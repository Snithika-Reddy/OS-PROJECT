import time
import uuid
import json
import threading
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.experiment import Experiment
from app.models.workload import Workload
from app.models.metric import Metric
from app.workloads.registry import workload_registry
from app.services.monitoring_service import SystemMonitor
from app.services.bottleneck_service import BottleneckService
from app.services.export_service import ExportService
from app.schemas.metric import LiveMetricSnapshot

logger = logging.getLogger("experiment_service")


class ExperimentRunner:
    def __init__(self):
        self.current_experiment_id: Optional[str] = None
        self.is_running: bool = False
        self.stop_event: threading.Event = threading.Event()
        self.worker_thread: Optional[threading.Thread] = None
        self.live_snapshot: LiveMetricSnapshot = LiveMetricSnapshot(
            experiment_id="",
            status="IDLE"
        )
        self._lock = threading.Lock()

    def get_live_state(self) -> LiveMetricSnapshot:
        with self._lock:
            return self.live_snapshot

    def start_experiment(self, experiment_id: str):
        with self._lock:
            if self.is_running:
                raise RuntimeError("An experiment is already actively running.")
            self.is_running = True
            self.current_experiment_id = experiment_id
            self.stop_event.clear()
            self.live_snapshot = LiveMetricSnapshot(
                experiment_id=experiment_id,
                status="RUNNING"
            )

        self.worker_thread = threading.Thread(
            target=self._execute_experiment_worker,
            args=(experiment_id,),
            daemon=True
        )
        self.worker_thread.start()

    def stop_current_experiment(self) -> bool:
        with self._lock:
            if not self.is_running:
                return False
            self.stop_event.set()
            self.live_snapshot.status = "CANCELLING"
            return True

    def _execute_experiment_worker(self, experiment_id: str):
        db: Session = SessionLocal()
        experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
        if not experiment:
            with self._lock:
                self.is_running = False
                self.current_experiment_id = None
            db.close()
            return

        experiment.status = "RUNNING"
        experiment.start_time = datetime.utcnow()
        db.commit()

        monitor = SystemMonitor()
        total_workloads = len(experiment.workloads)
        collected_experiment_metrics: List[Metric] = []
        overall_start_time = time.time()

        try:
            for idx, workload in enumerate(experiment.workloads):
                if self.stop_event.is_set():
                    break

                workload_start_time = time.time()
                workload_duration = experiment.duration_per_workload
                interval = max(experiment.sampling_interval, 0.2)

                # Find registered workload
                impl = workload_registry.get(workload.implementation)
                if not impl:
                    logger.error(f"Implementation '{workload.implementation}' not found.")
                    continue

                config = {}
                try:
                    if workload.configuration:
                        config = json.loads(workload.configuration)
                except Exception:
                    config = {}

                # Execute workload in a worker thread
                workload_stop = threading.Event()
                workload_thread = threading.Thread(
                    target=impl.run,
                    args=(workload_duration, config, workload_stop),
                    daemon=True
                )
                workload_thread.start()

                workload_metrics: List[Metric] = []

                # Active monitoring loop
                while workload_thread.is_alive() or (time.time() - workload_start_time < workload_duration):
                    if self.stop_event.is_set():
                        workload_stop.set()
                        break

                    sample_data = monitor.sample()
                    elapsed_w = round(time.time() - workload_start_time, 2)

                    metric_record = Metric(
                        experiment_id=experiment.id,
                        workload_id=workload.id,
                        workload_name=workload.name,
                        timestamp=sample_data["timestamp"],
                        elapsed_seconds=elapsed_w,
                        cpu_percent=sample_data["cpu_percent"],
                        ram_percent=sample_data["ram_percent"],
                        ram_used_gb=sample_data["ram_used_gb"],
                        ram_available_gb=sample_data["ram_available_gb"],
                        disk_percent=sample_data["disk_percent"],
                        disk_free_gb=sample_data["disk_free_gb"],
                        disk_read_mb_per_sec=sample_data["disk_read_mb_per_sec"],
                        disk_write_mb_per_sec=sample_data["disk_write_mb_per_sec"],
                        network_sent_mb_per_sec=sample_data["network_sent_mb_per_sec"],
                        network_received_mb_per_sec=sample_data["network_received_mb_per_sec"],
                        process_count=sample_data["process_count"],
                        process_cpu_percent=sample_data["process_cpu_percent"],
                        process_memory_percent=sample_data["process_memory_percent"],
                        process_rss_mb=sample_data["process_rss_mb"],
                        execution_time_seconds=elapsed_w
                    )

                    db.add(metric_record)
                    workload_metrics.append(metric_record)
                    collected_experiment_metrics.append(metric_record)

                    # Update live state
                    with self._lock:
                        self.live_snapshot = LiveMetricSnapshot(
                            experiment_id=experiment.id,
                            status="RUNNING",
                            current_workload_name=workload.name,
                            current_workload_index=idx + 1,
                            total_workloads=total_workloads,
                            elapsed_seconds=round(time.time() - overall_start_time, 1),
                            cpu_percent=sample_data["cpu_percent"],
                            ram_percent=sample_data["ram_percent"],
                            ram_used_gb=sample_data["ram_used_gb"],
                            ram_available_gb=sample_data["ram_available_gb"],
                            disk_read_mb_per_sec=sample_data["disk_read_mb_per_sec"],
                            disk_write_mb_per_sec=sample_data["disk_write_mb_per_sec"],
                            network_sent_mb_per_sec=sample_data["network_sent_mb_per_sec"],
                            network_received_mb_per_sec=sample_data["network_received_mb_per_sec"],
                            process_count=sample_data["process_count"],
                            process_cpu_percent=sample_data["process_cpu_percent"],
                            process_memory_percent=sample_data["process_memory_percent"],
                            process_rss_mb=sample_data["process_rss_mb"]
                        )

                    time.sleep(interval)

                workload_stop.set()
                workload_thread.join(timeout=2.0)
                db.commit()

                # Analyze bottlenecks for this workload
                bottlenecks = BottleneckService.analyze_metrics(
                    experiment_id=experiment.id,
                    workload_id=workload.id,
                    workload_name=workload.name,
                    metrics=workload_metrics
                )
                for b in bottlenecks:
                    db.add(b)
                db.commit()

            # Finalize experiment
            overall_elapsed = round(time.time() - overall_start_time, 2)
            experiment.end_time = datetime.utcnow()
            experiment.total_execution_time = overall_elapsed

            if self.stop_event.is_set():
                experiment.status = "CANCELLED"
            else:
                experiment.status = "COMPLETED"

            db.commit()

            # Export to run CSV and master CSV
            try:
                ExportService.export_experiment(experiment, collected_experiment_metrics)
            except Exception as exp_err:
                logger.error(f"Error exporting CSV: {exp_err}")

        except Exception as e:
            logger.exception(f"Experiment execution error: {e}")
            experiment.status = "FAILED"
            db.commit()
        finally:
            with self._lock:
                self.is_running = False
                self.live_snapshot.status = experiment.status
                self.current_experiment_id = None
            db.close()


experiment_runner = ExperimentRunner()

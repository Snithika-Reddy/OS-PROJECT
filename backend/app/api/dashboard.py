from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import psutil
from app.core.database import get_db
from app.models.experiment import Experiment
from app.models.workload import Workload
from app.models.metric import Metric
from app.models.bottleneck import Bottleneck
from app.schemas.dashboard import (
    DashboardSummary,
    ResourceKPI,
    WorkloadComparisonItem,
    ExperimentComparisonItem
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _calculate_status(val: float, warn: float, crit: float) -> str:
    if val >= crit:
        return "CRITICAL"
    elif val >= warn:
        return "HIGH"
    elif val >= (warn * 0.7):
        return "MEDIUM"
    return "NORMAL"


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_experiments = db.query(Experiment).count()
    active_workloads = db.query(Workload).filter(Workload.enabled == True).count()
    total_workloads = db.query(Workload).count()
    total_bottlenecks = db.query(Bottleneck).count()

    latest_exp = db.query(Experiment).order_by(Experiment.created_at.desc()).first()
    latest_id = latest_exp.id if latest_exp else None

    # Calculate bottleneck counts by resource
    bottlenecks_by_res: Dict[str, int] = {}
    bn_groups = (
        db.query(Bottleneck.resource, func.count(Bottleneck.id))
        .group_by(Bottleneck.resource)
        .all()
    )
    for res, count in bn_groups:
        bottlenecks_by_res[res] = count

    # Fetch metrics aggregates across historical runs
    metrics_count = db.query(Metric).count()

    # Fallback to current OS status if no runs yet
    current_cpu = float(psutil.cpu_percent(interval=None))
    vm = psutil.virtual_memory()
    current_ram = float(vm.percent)

    if metrics_count == 0:
        return DashboardSummary(
            cpu=ResourceKPI(current=current_cpu, average=current_cpu, peak=current_cpu, status=_calculate_status(current_cpu, 75, 90)),
            ram=ResourceKPI(current=current_ram, average=current_ram, peak=current_ram, status=_calculate_status(current_ram, 75, 90)),
            disk_read_mb_per_sec=ResourceKPI(current=0.0, average=0.0, peak=0.0, status="NORMAL"),
            disk_write_mb_per_sec=ResourceKPI(current=0.0, average=0.0, peak=0.0, status="NORMAL"),
            network_sent_mb_per_sec=ResourceKPI(current=0.0, average=0.0, peak=0.0, status="NORMAL"),
            network_received_mb_per_sec=ResourceKPI(current=0.0, average=0.0, peak=0.0, status="NORMAL"),
            average_execution_time_seconds=0.0,
            longest_execution_time_seconds=0.0,
            process_count=len(psutil.pids()),
            total_experiments=total_experiments,
            active_workloads=active_workloads,
            total_workloads=total_workloads,
            total_bottlenecks=total_bottlenecks,
            bottleneck_counts_by_resource=bottlenecks_by_res,
            latest_experiment_id=latest_id
        )

    # Compute actual statistical averages & peaks
    avg_cpu = db.query(func.avg(Metric.cpu_percent)).scalar() or 0.0
    peak_cpu = db.query(func.max(Metric.cpu_percent)).scalar() or 0.0

    avg_ram = db.query(func.avg(Metric.ram_percent)).scalar() or 0.0
    peak_ram = db.query(func.max(Metric.ram_percent)).scalar() or 0.0

    avg_read = db.query(func.avg(Metric.disk_read_mb_per_sec)).scalar() or 0.0
    peak_read = db.query(func.max(Metric.disk_read_mb_per_sec)).scalar() or 0.0

    avg_write = db.query(func.avg(Metric.disk_write_mb_per_sec)).scalar() or 0.0
    peak_write = db.query(func.max(Metric.disk_write_mb_per_sec)).scalar() or 0.0

    avg_net_sent = db.query(func.avg(Metric.network_sent_mb_per_sec)).scalar() or 0.0
    peak_net_sent = db.query(func.max(Metric.network_sent_mb_per_sec)).scalar() or 0.0

    avg_net_recv = db.query(func.avg(Metric.network_received_mb_per_sec)).scalar() or 0.0
    peak_net_recv = db.query(func.max(Metric.network_received_mb_per_sec)).scalar() or 0.0

    avg_runtime = db.query(func.avg(Experiment.total_execution_time)).scalar() or 0.0
    max_runtime = db.query(func.max(Experiment.total_execution_time)).scalar() or 0.0

    return DashboardSummary(
        cpu=ResourceKPI(
            current=current_cpu,
            average=round(float(avg_cpu), 1),
            peak=round(float(peak_cpu), 1),
            status=_calculate_status(float(peak_cpu), 75, 90)
        ),
        ram=ResourceKPI(
            current=current_ram,
            average=round(float(avg_ram), 1),
            peak=round(float(peak_ram), 1),
            status=_calculate_status(float(peak_ram), 75, 90)
        ),
        disk_read_mb_per_sec=ResourceKPI(
            current=0.0,
            average=round(float(avg_read), 2),
            peak=round(float(peak_read), 2),
            status="HIGH" if peak_read > 50.0 else "NORMAL"
        ),
        disk_write_mb_per_sec=ResourceKPI(
            current=0.0,
            average=round(float(avg_write), 2),
            peak=round(float(peak_write), 2),
            status="HIGH" if peak_write > 50.0 else "NORMAL"
        ),
        network_sent_mb_per_sec=ResourceKPI(
            current=0.0,
            average=round(float(avg_net_sent), 2),
            peak=round(float(peak_net_sent), 2),
            status="NORMAL"
        ),
        network_received_mb_per_sec=ResourceKPI(
            current=0.0,
            average=round(float(avg_net_recv), 2),
            peak=round(float(peak_net_recv), 2),
            status="NORMAL"
        ),
        average_execution_time_seconds=round(float(avg_runtime), 1),
        longest_execution_time_seconds=round(float(max_runtime), 1),
        process_count=len(psutil.pids()),
        total_experiments=total_experiments,
        active_workloads=active_workloads,
        total_workloads=total_workloads,
        total_bottlenecks=total_bottlenecks,
        bottleneck_counts_by_resource=bottlenecks_by_res,
        latest_experiment_id=latest_id
    )


@router.get("/timeseries")
def get_dashboard_timeseries(
    experiment_id: Optional[str] = Query(None, description="Experiment ID (defaults to latest)"),
    db: Session = Depends(get_db)
):
    target_id = experiment_id
    if not target_id:
        latest = db.query(Experiment).order_by(Experiment.created_at.desc()).first()
        if latest:
            target_id = latest.id

    if not target_id:
        return []

    metrics = (
        db.query(Metric)
        .filter(Metric.experiment_id == target_id)
        .order_by(Metric.id.asc())
        .all()
    )

    return [
        {
            "id": m.id,
            "timestamp": m.timestamp,
            "elapsed_seconds": m.elapsed_seconds,
            "workload_name": m.workload_name,
            "cpu_percent": m.cpu_percent,
            "ram_percent": m.ram_percent,
            "ram_used_gb": m.ram_used_gb,
            "ram_available_gb": m.ram_available_gb,
            "disk_read_mb_per_sec": m.disk_read_mb_per_sec,
            "disk_write_mb_per_sec": m.disk_write_mb_per_sec,
            "network_sent_mb_per_sec": m.network_sent_mb_per_sec,
            "network_received_mb_per_sec": m.network_received_mb_per_sec,
            "process_count": m.process_count,
            "process_cpu_percent": m.process_cpu_percent,
            "process_memory_percent": m.process_memory_percent,
            "process_rss_mb": m.process_rss_mb
        }
        for m in metrics
    ]


@router.get("/workload-comparison", response_model=List[WorkloadComparisonItem])
def get_workload_comparison(db: Session = Depends(get_db)):
    results: List[WorkloadComparisonItem] = []
    workload_names = db.query(Metric.workload_name).distinct().all()

    for (w_name,) in workload_names:
        w_obj = db.query(Workload).filter(Workload.name == w_name).first()
        category = w_obj.category if w_obj else "General"

        stats = (
            db.query(
                func.avg(Metric.cpu_percent),
                func.max(Metric.cpu_percent),
                func.avg(Metric.ram_percent),
                func.max(Metric.ram_percent),
                func.avg(Metric.disk_read_mb_per_sec),
                func.avg(Metric.disk_write_mb_per_sec),
                func.avg(Metric.network_sent_mb_per_sec),
                func.avg(Metric.network_received_mb_per_sec),
                func.avg(Metric.execution_time_seconds),
                func.count(Metric.id)
            )
            .filter(Metric.workload_name == w_name)
            .first()
        )

        bn_count = db.query(Bottleneck).filter(Bottleneck.workload_name == w_name).count()

        if stats and stats[9] > 0:
            results.append(WorkloadComparisonItem(
                workload_name=w_name,
                category=category,
                avg_cpu_percent=round(float(stats[0] or 0), 1),
                peak_cpu_percent=round(float(stats[1] or 0), 1),
                avg_ram_percent=round(float(stats[2] or 0), 1),
                peak_ram_percent=round(float(stats[3] or 0), 1),
                avg_disk_read_mb=round(float(stats[4] or 0), 2),
                avg_disk_write_mb=round(float(stats[5] or 0), 2),
                avg_network_sent_mb=round(float(stats[6] or 0), 2),
                avg_network_recv_mb=round(float(stats[7] or 0), 2),
                avg_runtime_seconds=round(float(stats[8] or 0), 1),
                sample_count=int(stats[9] or 0),
                bottleneck_count=bn_count
            ))

    return results


@router.get("/experiment-comparison", response_model=List[ExperimentComparisonItem])
def get_experiment_comparison(db: Session = Depends(get_db)):
    experiments = db.query(Experiment).order_by(Experiment.created_at.desc()).all()
    items: List[ExperimentComparisonItem] = []

    for exp in experiments:
        m_stats = (
            db.query(
                func.avg(Metric.cpu_percent),
                func.max(Metric.cpu_percent),
                func.avg(Metric.ram_percent),
                func.max(Metric.ram_percent)
            )
            .filter(Metric.experiment_id == exp.id)
            .first()
        )

        bn_count = db.query(Bottleneck).filter(Bottleneck.experiment_id == exp.id).count()

        avg_cpu = round(float(m_stats[0] or 0), 1) if m_stats else 0.0
        peak_cpu = round(float(m_stats[1] or 0), 1) if m_stats else 0.0
        avg_ram = round(float(m_stats[2] or 0), 1) if m_stats else 0.0
        peak_ram = round(float(m_stats[3] or 0), 1) if m_stats else 0.0

        items.append(ExperimentComparisonItem(
            experiment_id=exp.id,
            name=exp.name,
            status=exp.status,
            created_at=exp.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            workload_count=len(exp.workloads),
            avg_cpu_percent=avg_cpu,
            peak_cpu_percent=peak_cpu,
            avg_ram_percent=avg_ram,
            peak_ram_percent=peak_ram,
            total_execution_time=round(exp.total_execution_time, 1),
            bottleneck_count=bn_count
        ))

    return items

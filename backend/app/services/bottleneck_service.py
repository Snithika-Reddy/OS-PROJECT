from typing import List, Dict, Any
from app.models.metric import Metric
from app.models.bottleneck import Bottleneck
from app.core.config import settings


class BottleneckService:
    @staticmethod
    def analyze_metrics(
        experiment_id: str,
        workload_id: int,
        workload_name: str,
        metrics: List[Metric],
        config_override: Dict[str, Any] = None
    ) -> List[Bottleneck]:
        if not metrics:
            return []

        cfg = config_override or {}
        cpu_crit = float(cfg.get("cpu_critical_threshold", settings.cpu_critical_threshold))
        cpu_warn = float(cfg.get("cpu_warning_threshold", settings.cpu_warning_threshold))
        ram_crit = float(cfg.get("ram_critical_threshold", settings.ram_critical_threshold))
        ram_warn = float(cfg.get("ram_warning_threshold", settings.ram_warning_threshold))
        disk_read_thresh = float(cfg.get("disk_read_threshold_mb", settings.disk_read_threshold_mb))
        disk_write_thresh = float(cfg.get("disk_write_threshold_mb", settings.disk_write_threshold_mb))
        net_thresh = float(cfg.get("network_threshold_mb", settings.network_threshold_mb))
        sustained_req = int(cfg.get("sustained_samples_required", settings.sustained_samples_required))

        bottlenecks: List[Bottleneck] = []

        # 1. CPU Analysis
        cpu_values = [m.cpu_percent for m in metrics]
        peak_cpu = max(cpu_values)
        crit_cpu_samples = sum(1 for v in cpu_values if v >= cpu_crit)
        warn_cpu_samples = sum(1 for v in cpu_values if v >= cpu_warn)

        if crit_cpu_samples >= sustained_req:
            duration = crit_cpu_samples * 1.0
            bottlenecks.append(Bottleneck(
                experiment_id=experiment_id,
                workload_id=workload_id,
                workload_name=workload_name,
                resource="CPU",
                severity="CRITICAL" if peak_cpu >= 95.0 else "HIGH",
                metric_name="cpu_percent",
                metric_value=round(peak_cpu, 1),
                threshold=cpu_crit,
                duration_seconds=duration,
                message=f"Potential CPU bottleneck: sustained utilization exceeded {cpu_crit}% for {duration:.1f}s (Peak: {peak_cpu:.1f}%)."
            ))
        elif warn_cpu_samples >= sustained_req:
            duration = warn_cpu_samples * 1.0
            bottlenecks.append(Bottleneck(
                experiment_id=experiment_id,
                workload_id=workload_id,
                workload_name=workload_name,
                resource="CPU",
                severity="MEDIUM",
                metric_name="cpu_percent",
                metric_value=round(peak_cpu, 1),
                threshold=cpu_warn,
                duration_seconds=duration,
                message=f"Elevated CPU usage: utilization exceeded warning threshold {cpu_warn}% (Peak: {peak_cpu:.1f}%)."
            ))

        # 2. RAM Analysis
        ram_values = [m.ram_percent for m in metrics]
        peak_ram = max(ram_values)
        min_avail_ram = min(m.ram_available_gb for m in metrics)
        crit_ram_samples = sum(1 for v in ram_values if v >= ram_crit)
        warn_ram_samples = sum(1 for v in ram_values if v >= ram_warn)

        if crit_ram_samples >= sustained_req:
            duration = crit_ram_samples * 1.0
            bottlenecks.append(Bottleneck(
                experiment_id=experiment_id,
                workload_id=workload_id,
                workload_name=workload_name,
                resource="RAM",
                severity="CRITICAL",
                metric_name="ram_percent",
                metric_value=round(peak_ram, 1),
                threshold=ram_crit,
                duration_seconds=duration,
                message=f"Potential memory pressure: RAM utilization reached {peak_ram:.1f}% (Available headroom dropped to {min_avail_ram:.2f} GB)."
            ))
        elif warn_ram_samples >= sustained_req:
            duration = warn_ram_samples * 1.0
            bottlenecks.append(Bottleneck(
                experiment_id=experiment_id,
                workload_id=workload_id,
                workload_name=workload_name,
                resource="RAM",
                severity="MEDIUM",
                metric_name="ram_percent",
                metric_value=round(peak_ram, 1),
                threshold=ram_warn,
                duration_seconds=duration,
                message=f"Elevated memory consumption: RAM reached {peak_ram:.1f}% (Threshold: {ram_warn}%)."
            ))

        # 3. Disk I/O Analysis
        disk_read_values = [m.disk_read_mb_per_sec for m in metrics]
        peak_read = max(disk_read_values) if disk_read_values else 0.0
        high_read_samples = sum(1 for v in disk_read_values if v >= disk_read_thresh)

        if high_read_samples >= sustained_req:
            duration = high_read_samples * 1.0
            bottlenecks.append(Bottleneck(
                experiment_id=experiment_id,
                workload_id=workload_id,
                workload_name=workload_name,
                resource="Disk I/O",
                severity="HIGH",
                metric_name="disk_read_mb_per_sec",
                metric_value=round(peak_read, 2),
                threshold=disk_read_thresh,
                duration_seconds=duration,
                message=f"High disk read activity detected: sustained throughput reached {peak_read:.2f} MB/s (Threshold: {disk_read_thresh} MB/s)."
            ))

        disk_write_values = [m.disk_write_mb_per_sec for m in metrics]
        peak_write = max(disk_write_values) if disk_write_values else 0.0
        high_write_samples = sum(1 for v in disk_write_values if v >= disk_write_thresh)

        if high_write_samples >= sustained_req:
            duration = high_write_samples * 1.0
            bottlenecks.append(Bottleneck(
                experiment_id=experiment_id,
                workload_id=workload_id,
                workload_name=workload_name,
                resource="Disk I/O",
                severity="HIGH",
                metric_name="disk_write_mb_per_sec",
                metric_value=round(peak_write, 2),
                threshold=disk_write_thresh,
                duration_seconds=duration,
                message=f"High disk write activity detected: sustained throughput reached {peak_write:.2f} MB/s (Threshold: {disk_write_thresh} MB/s)."
            ))

        # 4. Network Analysis
        net_values = [m.network_sent_mb_per_sec + m.network_received_mb_per_sec for m in metrics]
        peak_net = max(net_values) if net_values else 0.0
        high_net_samples = sum(1 for v in net_values if v >= net_thresh)

        if high_net_samples >= sustained_req:
            duration = high_net_samples * 1.0
            bottlenecks.append(Bottleneck(
                experiment_id=experiment_id,
                workload_id=workload_id,
                workload_name=workload_name,
                resource="Network",
                severity="MEDIUM",
                metric_name="network_throughput_mb_per_sec",
                metric_value=round(peak_net, 2),
                threshold=net_thresh,
                duration_seconds=duration,
                message=f"Elevated network traffic detected: peak combined throughput reached {peak_net:.2f} MB/s (Threshold: {net_thresh} MB/s)."
            ))

        return bottlenecks

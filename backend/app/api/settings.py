import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.setting import AppSetting
from app.schemas.setting import SettingsUpdate
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("")
def get_current_settings(db: Session = Depends(get_db)):
    setting_row = db.query(AppSetting).filter(AppSetting.key == "bottleneck_config").first()
    if setting_row:
        try:
            return json.loads(setting_row.value)
        except Exception:
            pass

    return {
        "cpu_warning_threshold": settings.cpu_warning_threshold,
        "cpu_critical_threshold": settings.cpu_critical_threshold,
        "ram_warning_threshold": settings.ram_warning_threshold,
        "ram_critical_threshold": settings.ram_critical_threshold,
        "disk_read_threshold_mb": settings.disk_read_threshold_mb,
        "disk_write_threshold_mb": settings.disk_write_threshold_mb,
        "network_threshold_mb": settings.network_threshold_mb,
        "sustained_samples_required": settings.sustained_samples_required,
        "default_sampling_interval": settings.default_sampling_interval,
        "default_workload_duration": settings.default_workload_duration,
        "enable_process_monitoring": settings.enable_process_monitoring
    }


@router.put("")
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    data = payload.dict()
    setting_row = db.query(AppSetting).filter(AppSetting.key == "bottleneck_config").first()
    if not setting_row:
        setting_row = AppSetting(key="bottleneck_config", value=json.dumps(data))
        db.add(setting_row)
    else:
        setting_row.value = json.dumps(data)

    # Update memory configuration
    settings.cpu_warning_threshold = payload.cpu_warning_threshold
    settings.cpu_critical_threshold = payload.cpu_critical_threshold
    settings.ram_warning_threshold = payload.ram_warning_threshold
    settings.ram_critical_threshold = payload.ram_critical_threshold
    settings.disk_read_threshold_mb = payload.disk_read_threshold_mb
    settings.disk_write_threshold_mb = payload.disk_write_threshold_mb
    settings.network_threshold_mb = payload.network_threshold_mb
    settings.sustained_samples_required = payload.sustained_samples_required
    settings.default_sampling_interval = payload.default_sampling_interval
    settings.default_workload_duration = payload.default_workload_duration
    settings.enable_process_monitoring = payload.enable_process_monitoring

    db.commit()
    return data

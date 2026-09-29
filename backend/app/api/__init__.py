from fastapi import APIRouter
from app.api.workloads import router as workloads_router
from app.api.experiments import router as experiments_router
from app.api.metrics import router as metrics_router
from app.api.bottlenecks import router as bottlenecks_router
from app.api.dashboard import router as dashboard_router
from app.api.exports import router as exports_router
from app.api.settings import router as settings_router

api_router = APIRouter()
api_router.include_router(workloads_router)
api_router.include_router(experiments_router)
api_router.include_router(metrics_router)
api_router.include_router(bottlenecks_router)
api_router.include_router(dashboard_router)
api_router.include_router(exports_router)
api_router.include_router(settings_router)

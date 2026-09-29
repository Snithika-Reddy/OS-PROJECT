import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.workload_service import WorkloadService
from app.services.experiment_service import experiment_runner
from app.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize SQLite Database Tables
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)

    # 2. Seed default workloads if empty
    db = SessionLocal()
    try:
        WorkloadService.seed_defaults(db)
        logger.info("Default workloads verified/seeded.")
    finally:
        db.close()

    yield
    logger.info("Shutting down OS Performance Analytics backend.")


app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    description="Full-stack platform benchmarking OS resource utilization, bottleneck detection, dynamic workloads, and Power BI integration.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints
app.include_router(api_router, prefix=settings.api_v1_str)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "ONLINE",
        "service": settings.project_name,
        "version": settings.version,
        "is_experiment_running": experiment_runner.is_running,
        "active_experiment_id": experiment_runner.current_experiment_id
    }


@app.websocket("/ws/live")
async def websocket_live_metrics(websocket: WebSocket):
    """
    WebSocket streaming real-time experiment performance metrics to the frontend.
    """
    await websocket.accept()
    logger.info("Live WebSocket client connected.")
    try:
        while True:
            live_data = experiment_runner.get_live_state()
            await websocket.send_json(live_data.dict())
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        logger.info("Live WebSocket client disconnected.")
    except Exception as e:
        logger.warning(f"WebSocket streaming closed: {e}")

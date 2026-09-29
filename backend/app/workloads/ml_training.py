import time
import threading
from typing import Dict, Any, Optional
from sklearn.datasets import make_classification
from sklearn.ensemble import RandomForestClassifier
from app.workloads.base import BaseWorkload


class MLTrainingWorkload(BaseWorkload):
    def __init__(self):
        super().__init__(
            implementation_id="ml_training",
            name="ML Training",
            description="Supervised learning workload training a multi-threaded RandomForestClassifier on synthetic features.",
            category="Machine Learning",
            default_duration=15,
            default_config={"samples": 40000, "features": 25, "n_estimators": 60}
        )

    def run(self, duration: int, config: Dict[str, Any], stop_event: Optional[threading.Event] = None) -> Dict[str, Any]:
        start_time = time.time()
        samples = int(config.get("samples", 40000))
        features = int(config.get("features", 25))
        n_estimators = int(config.get("n_estimators", 60))
        models_trained = 0

        while (time.time() - start_time) < duration:
            if stop_event and stop_event.is_set():
                break

            X, y = make_classification(
                n_samples=samples,
                n_features=features,
                n_informative=int(features * 0.7),
                n_classes=2,
                random_state=None
            )

            clf = RandomForestClassifier(
                n_estimators=n_estimators,
                max_depth=12,
                n_jobs=-1,  # Utilizes all CPU cores
                random_state=42
            )
            clf.fit(X, y)
            _ = clf.predict(X[:1000])

            models_trained += 1
            time.sleep(0.05)

        elapsed = time.time() - start_time
        return {
            "models_trained": models_trained,
            "total_samples_fit": models_trained * samples,
            "actual_duration_seconds": round(elapsed, 2)
        }

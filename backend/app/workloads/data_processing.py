import time
import threading
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
from app.workloads.base import BaseWorkload


class DataProcessingWorkload(BaseWorkload):
    def __init__(self):
        super().__init__(
            implementation_id="data_processing",
            name="Data Processing",
            description="Pandas DataFrame generation, transformation, filtering, grouping, and aggregation.",
            category="Data Processing",
            default_duration=15,
            default_config={"batch_rows": 300000, "columns": 10}
        )

    def run(self, duration: int, config: Dict[str, Any], stop_event: Optional[threading.Event] = None) -> Dict[str, Any]:
        start_time = time.time()
        rows = int(config.get("batch_rows", 300000))
        cols = int(config.get("columns", 10))
        iterations = 0
        total_rows_processed = 0

        while (time.time() - start_time) < duration:
            if stop_event and stop_event.is_set():
                break

            # 1. Create DataFrame
            data = np.random.rand(rows, cols)
            col_names = [f"metric_{i}" for i in range(cols)]
            df = pd.DataFrame(data, columns=col_names)

            # 2. Vectorized calculation
            df["computed_total"] = df.sum(axis=1)
            df["scaled_val"] = df[col_names[0]] * 100.0

            # 3. Filtering
            filtered_df = df[df["computed_total"] > (cols * 0.45)]

            # 4. Grouping & Aggregations
            key_col = (filtered_df[col_names[0]] * 10).round()
            _ = filtered_df.groupby(key_col).agg(
                mean_total=("computed_total", "mean"),
                std_total=("computed_total", "std"),
                max_scaled=("scaled_val", "max")
            )

            iterations += 1
            total_rows_processed += rows
            # Yield briefly to keep system responsive if needed
            time.sleep(0.05)

        elapsed = time.time() - start_time
        return {
            "iterations": iterations,
            "total_rows_processed": total_rows_processed,
            "actual_duration_seconds": round(elapsed, 2)
        }

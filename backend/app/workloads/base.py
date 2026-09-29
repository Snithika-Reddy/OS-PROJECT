import abc
from typing import Dict, Any, Optional
import threading


class BaseWorkload(abc.ABC):
    """
    Abstract base class for all benchmark workloads.
    Safe and controlled execution.
    """

    def __init__(
        self,
        implementation_id: str,
        name: str,
        description: str,
        category: str,
        default_duration: int = 15,
        default_config: Optional[Dict[str, Any]] = None
    ):
        self.implementation_id = implementation_id
        self.name = name
        self.description = description
        self.category = category
        self.default_duration = default_duration
        self.default_config = default_config or {}

    @abc.abstractmethod
    def run(self, duration: int, config: Dict[str, Any], stop_event: Optional[threading.Event] = None) -> Dict[str, Any]:
        """
        Execute the workload for the specified duration or until stop_event is set.
        Returns a dictionary of execution metadata (e.g. operations count, items processed).
        """
        pass

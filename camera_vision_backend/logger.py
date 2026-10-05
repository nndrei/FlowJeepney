# FlowJeep Camera Vision - Event Logger Module
# File: logger.py
import csv
import logging
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger("flowjeep.logger")


class EventLogger:
    CSV_HEADER = [
        "timestamp",
        "tracking_id",
        "event_type",
        "confidence",
        "current_passenger_count",
    ]

    def __init__(self, log_dir: Path, filename: str = "events.csv"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.csv_path = self.log_dir / filename
        self._init_csv()

    def _init_csv(self):
        file_exists = self.csv_path.exists()
        self.csv_file = open(self.csv_path, mode="a", newline="", encoding="utf-8")
        self.csv_writer = csv.writer(self.csv_file)
        if not file_exists or self.csv_path.stat().st_size == 0:
            self.csv_writer.writerow(self.CSV_HEADER)
            self.csv_file.flush()

    def log_event(self, event: Dict[str, Any]):
        if self.csv_writer is None:
            return
        row = [
            event.get("timestamp", ""),
            event.get("tracking_id", -1),
            event.get("event_type", "UNKNOWN"),
            f"{event.get('confidence', 0.0):.2f}",
            event.get("current_passenger_count", 0),
        ]
        self.csv_writer.writerow(row)
        self.csv_file.flush()

    def close(self):
        if self.csv_file:
            self.csv_file.close()

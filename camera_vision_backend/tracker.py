# FlowJeep Camera Vision - Multi-Object Tracker Module
# File: tracker.py
import logging
from collections import deque
from typing import List, Dict, Any, Optional
import torch

logger = logging.getLogger("flowjeep.tracker")


class PassengerTracker:
    def __init__(
        self,
        model_name: str = "yolov8n.pt",
        tracker_config: str = "bytetrack.yaml",
        confidence_threshold: float = 0.45,
        target_classes: Optional[List[int]] = None,
        imgsz: int = 640,
        max_trajectory_points: int = 15,
        device: Optional[str] = None,
        min_height: int = 0,
        min_width: int = 0,
        min_aspect_ratio: float = 0.0,
        max_aspect_ratio: float = 1e9,
    ):
        self.model_name = model_name
        self.tracker_config = tracker_config
        self.confidence_threshold = confidence_threshold
        self.target_classes = target_classes if target_classes is not None else [0]
        self.imgsz = imgsz
        self.max_trajectory_points = max_trajectory_points
        self.min_height = min_height
        self.min_width = min_width
        self.min_aspect_ratio = min_aspect_ratio
        self.max_aspect_ratio = max_aspect_ratio
        self.device = device or ("cuda:0" if torch.cuda.is_available() else "cpu")
        self.trajectories: Dict[int, deque] = {}
        self._load_tracker()

    def _load_tracker(self):
        from ultralytics import YOLO
        self.model = YOLO(self.model_name)

    def update(self, frame) -> List[Dict[str, Any]]:
        if self.model is None or frame is None:
            return []
        results = self.model.track(
            source=frame,
            persist=True,
            tracker=self.tracker_config,
            conf=self.confidence_threshold,
            classes=self.target_classes,
            imgsz=self.imgsz,
            device=self.device,
            verbose=False,
        )
        active_tracks = []
        if len(results) > 0 and results[0].boxes is not None and results[0].boxes.id is not None:
            boxes = results[0].boxes
            track_ids = boxes.id.int().cpu().tolist()
            xyxys = boxes.xyxy.int().cpu().tolist()
            confs = boxes.conf.cpu().tolist()
            clss = boxes.cls.int().cpu().tolist()

            for track_id, xyxy, conf, cls_id in zip(track_ids, xyxys, confs, clss):
                # STRICT FILTER: COCO Class 0 ('person') and PERSON_CONFIDENCE only
                if int(cls_id) != 0 or cls_id not in self.target_classes:
                    continue
                if float(conf) < self.confidence_threshold:
                    continue
                x1, y1, x2, y2 = xyxy
                bw, bh = x2 - x1, y2 - y1
                # Human geometry / plausibility filters (aspect ratio = height / width)
                if bh < self.min_height or bw < self.min_width or bw <= 0:
                    continue
                aspect = bh / bw
                if aspect < self.min_aspect_ratio or aspect > self.max_aspect_ratio:
                    continue
                centroid = (int((x1 + x2) / 2), int((y1 + y2) / 2))
                if track_id not in self.trajectories:
                    self.trajectories[track_id] = deque(maxlen=self.max_trajectory_points)
                self.trajectories[track_id].append(centroid)

                active_tracks.append({
                    "track_id": int(track_id),
                    "bbox": (x1, y1, x2, y2),
                    "confidence": round(float(conf), 3),
                    "centroid": centroid,
                    "trajectory": list(self.trajectories[track_id]),
                })
        return active_tracks

    def reset(self):
        self.trajectories.clear()

# FlowJeep Camera Vision - Appearance/Disappearance Passenger Counter
# File: counter.py
# Purpose: Counts passengers based on appearance and confirmed disappearance
#          from the camera tracking view (NO virtual counting lines).

import time
import logging
from datetime import datetime
from typing import Dict, Any, List, Set, Optional

logger = logging.getLogger("flowjeep.counter")


class AppearancePassengerCounter:
    """
    Counts passengers based on presence in the camera view:
    - New ID observed -> ENTRY +1 (one entry per tracked appearance)
    - ID missing for >= PERSON_MISSING_FRAMES -> EXIT +1
    - current_passenger_count = total_entry - total_exit
    No virtual counting lines or boundary crossings are used.
    """

    def __init__(
        self,
        person_missing_frames: int = 15,
        confirm_appearance_frames: int = 2,
        reentry_cooldown_frames: int = 30,
        initial_passenger_count: int = 0,
        exit_timeout_seconds: float = 30.0,
    ):
        self.person_missing_frames = person_missing_frames
        self.confirm_appearance_frames = confirm_appearance_frames
        self.reentry_cooldown_frames = reentry_cooldown_frames
        self.initial_passenger_count = initial_passenger_count
        self.exit_timeout_seconds = exit_timeout_seconds

        self.total_entry_count: int = 0
        self.total_exit_count: int = 0
        self.current_passenger_count: int = initial_passenger_count

        self.active_tracks: Dict[int, Dict[str, Any]] = {}
        self.active_passenger_ids: Set[int] = set()
        self.exited_history: Dict[int, Dict[str, Any]] = {}
        self.recent_events: List[Dict[str, Any]] = []
        self.frame_index: int = 0

    def reset(self, new_initial: Optional[int] = None):
        if new_initial is not None:
            self.initial_passenger_count = new_initial
        self.total_entry_count = 0
        self.total_exit_count = 0
        self.current_passenger_count = self.initial_passenger_count
        self.active_tracks.clear()
        self.active_passenger_ids.clear()
        self.exited_history.clear()
        self.recent_events.clear()
        self.frame_index = 0
        logger.info("Passenger counter session reset. Entry=0, Exit=0, Current=0, Active IDs=empty.")

    def update(self, detected_tracks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        now = time.time()
        self.frame_index += 1
        # forget old exits that are past the re-entry cooldown
        self.exited_history = {
            t: d for t, d in self.exited_history.items()
            if self.frame_index - d["frame"] <= self.reentry_cooldown_frames
        }
        now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        new_events: List[Dict[str, Any]] = []
        visible_ids_this_frame = set()

        for track in detected_tracks:
            tid = track["track_id"]
            conf = track["confidence"]
            bbox = track["bbox"]
            visible_ids_this_frame.add(tid)

            if tid not in self.active_tracks:
                self.active_tracks[tid] = {
                    "consecutive_seen": 1,
                    "consecutive_missing": 0,
                    "entry_confirmed": False,
                    "last_confidence": conf,
                    "first_seen_time": now,
                    "last_seen_time": now,
                    "last_bbox": bbox,
                }
            else:
                tdata = self.active_tracks[tid]
                tdata["consecutive_seen"] += 1
                tdata["consecutive_missing"] = 0
                tdata["last_confidence"] = conf
                tdata["last_seen_time"] = now
                tdata["last_bbox"] = bbox

            tdata = self.active_tracks[tid]
            if not tdata["entry_confirmed"] and tdata["consecutive_seen"] >= self.confirm_appearance_frames:
                tdata["entry_confirmed"] = True
                self.active_passenger_ids.add(tid)

                if tid in self.exited_history:
                    # Same ID is back right after being counted as EXIT -> tracker blip.
                    # Undo that EXIT instead of counting a second ENTRY.
                    del self.exited_history[tid]
                    self.total_exit_count = max(0, self.total_exit_count - 1)
                    event_type = "EXIT_CANCELLED"
                else:
                    self.total_entry_count += 1
                    event_type = "ENTRY"

                self.current_passenger_count = max(
                    0, self.initial_passenger_count + self.total_entry_count - self.total_exit_count
                )
                event = {
                    "timestamp": now_iso,
                    "tracking_id": int(tid),
                    "event_type": event_type,
                    "confidence": float(conf),
                    "current_passenger_count": int(self.current_passenger_count),
                }
                new_events.append(event)
                self.recent_events.append(event)

        ids_to_remove = []
        for tid, tdata in list(self.active_tracks.items()):
            if tid not in visible_ids_this_frame:
                tdata["consecutive_missing"] += 1
                # Do not confirm exit until missing for PERSON_MISSING_FRAMES consecutive frames
                if tdata["consecutive_missing"] < self.person_missing_frames:
                    continue
                if (now - tdata["last_seen_time"]) < self.exit_timeout_seconds:
                    continue

                if tdata["entry_confirmed"]:
                    self.total_exit_count += 1
                    self.current_passenger_count = max(
                        0, self.initial_passenger_count + self.total_entry_count - self.total_exit_count
                    )
                    self.active_passenger_ids.discard(tid)
                    self.exited_history[tid] = {"frame": self.frame_index}

                    event = {
                        "timestamp": now_iso,
                        "tracking_id": int(tid),
                        "event_type": "EXIT",
                        "confidence": float(tdata["last_confidence"]),
                        "current_passenger_count": int(self.current_passenger_count),
                    }
                    new_events.append(event)
                    self.recent_events.append(event)

                ids_to_remove.append(tid)

        for tid in ids_to_remove:
            del self.active_tracks[tid]

        return new_events

    def get_stats(self) -> Dict[str, Any]:
        return {
            "entry_count": self.total_entry_count,
            "exit_count": self.total_exit_count,
            "current_passenger_count": self.current_passenger_count,
            "active_ids_count": len(self.active_passenger_ids),
            "active_ids_list": sorted(list(self.active_passenger_ids)),
            "missing_threshold": self.person_missing_frames,
        }

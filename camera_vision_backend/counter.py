# FlowJeep Camera Vision - Virtual Line-Crossing Passenger Counter
# File: counter.py
# Purpose: Counts passenger ENTRY and EXIT using virtual line crossing and state tracking.

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

logger = logging.getLogger("flowjeep.counter")


class LineCrossingPassengerCounter:
    def __init__(
        self,
        line_y: int = 240,
        hysteresis: int = 25,
        entry_direction: str = "BELOW_TO_ABOVE",
        initial_passenger_count: int = 0,
        max_missing_frames: int = 30,
    ):
        self.line_y = line_y
        self.hysteresis = hysteresis
        self.entry_direction = entry_direction
        self.initial_passenger_count = initial_passenger_count
        self.max_missing_frames = max_missing_frames

        self.total_entry_count: int = 0
        self.total_exit_count: int = 0
        self.current_passenger_count: int = max(0, initial_passenger_count)

        self.track_states: Dict[int, Dict[str, Any]] = {}
        self.recent_events: List[Dict[str, Any]] = []
        self.frame_index: int = 0

    def reset(self, new_initial: Optional[int] = None):
        if new_initial is not None:
            self.initial_passenger_count = max(0, new_initial)
        self.total_entry_count = 0
        self.total_exit_count = 0
        self.current_passenger_count = self.initial_passenger_count
        self.track_states.clear()
        self.recent_events.clear()
        self.frame_index = 0
        logger.info("Passenger counter reset. Current count: %d", self.current_passenger_count)

    def _determine_position(self, cy: int) -> str:
        if cy < (self.line_y - self.hysteresis):
            return "ABOVE"
        if cy > (self.line_y + self.hysteresis):
            return "BELOW"
        return "DEADZONE"

    def update(self, detected_tracks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        self.frame_index += 1
        now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        new_events: List[Dict[str, Any]] = []
        visible_ids = set()

        for track in detected_tracks:
            tid = track["track_id"]
            conf = track.get("confidence", 0.0)
            cx, cy = track["centroid"]
            visible_ids.add(tid)

            current_pos = self._determine_position(cy)

            if tid not in self.track_states:
                self.track_states[tid] = {
                    "last_pos": current_pos if current_pos != "DEADZONE" else None,
                    "last_seen_frame": self.frame_index,
                    "last_confidence": conf,
                    "last_centroid": (cx, cy),
                }
            else:
                state = self.track_states[tid]
                state["last_seen_frame"] = self.frame_index
                state["last_confidence"] = conf
                state["last_centroid"] = (cx, cy)
                prev_pos = state["last_pos"]

                if current_pos != "DEADZONE":
                    if prev_pos is not None and prev_pos != current_pos:
                        event_type = None
                        if self.entry_direction == "BELOW_TO_ABOVE":
                            if prev_pos == "BELOW" and current_pos == "ABOVE":
                                event_type = "ENTRY"
                            elif prev_pos == "ABOVE" and current_pos == "BELOW":
                                event_type = "EXIT"
                        else:
                            if prev_pos == "ABOVE" and current_pos == "BELOW":
                                event_type = "ENTRY"
                            elif prev_pos == "BELOW" and current_pos == "ABOVE":
                                event_type = "EXIT"

                        if event_type == "ENTRY":
                            self.total_entry_count += 1
                            self.current_passenger_count = max(
                                0, self.initial_passenger_count + self.total_entry_count - self.total_exit_count
                            )
                        elif event_type == "EXIT":
                            self.total_exit_count += 1
                            self.current_passenger_count = max(0, self.current_passenger_count - 1)

                        if event_type is not None:
                            event = {
                                "timestamp": now_iso,
                                "tracking_id": int(tid),
                                "event_type": event_type,
                                "confidence": float(conf),
                                "current_passenger_count": int(self.current_passenger_count),
                            }
                            new_events.append(event)
                            self.recent_events.append(event)
                            logger.info(
                                "Event %s by Track ID %d -> Current Passengers: %d",
                                event_type, tid, self.current_passenger_count
                            )

                    state["last_pos"] = current_pos

        stale_ids = [
            tid for tid, s in self.track_states.items()
            if (self.frame_index - s["last_seen_frame"]) > self.max_missing_frames
        ]
        for tid in stale_ids:
            del self.track_states[tid]

        return new_events

    def get_stats(self) -> Dict[str, Any]:
        active_ids = [
            tid for tid, s in self.track_states.items()
            if (self.frame_index - s["last_seen_frame"]) <= 2
        ]
        return {
            "entry_count": self.total_entry_count,
            "exit_count": self.total_exit_count,
            "current_passenger_count": self.current_passenger_count,
            "active_ids_count": len(active_ids),
            "active_ids_list": sorted(active_ids),
            "line_y": self.line_y,
            "hysteresis": self.hysteresis,
            "entry_direction": self.entry_direction,
        }

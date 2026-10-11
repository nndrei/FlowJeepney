# Unit Tests for Line Crossing Passenger Counter Logic
import unittest
from counter import LineCrossingPassengerCounter


class TestLineCrossingPassengerCounter(unittest.TestCase):
    def setUp(self):
        # Line at Y=240, hysteresis band 25 (DEADZONE: 215 to 265)
        # ENTRY: BELOW (>265) to ABOVE (<215)
        # EXIT: ABOVE (<215) to BELOW (>265)
        self.counter = LineCrossingPassengerCounter(
            line_y=240,
            hysteresis=25,
            entry_direction="BELOW_TO_ABOVE",
            initial_passenger_count=0,
            max_missing_frames=10,
        )

    def _make_track(self, tid, cx, cy, conf=0.85):
        return {
            "track_id": tid,
            "centroid": (cx, cy),
            "confidence": conf,
            "bbox": (cx - 20, cy - 40, cx + 20, cy + 40),
        }

    def test_1_single_entry(self):
        # Frame 1: Person 1 BELOW line
        events = self.counter.update([self._make_track(1, 320, 300)])
        self.assertEqual(len(events), 0)
        self.assertEqual(self.counter.current_passenger_count, 0)

        # Frame 2: Person 1 inside DEADZONE
        events = self.counter.update([self._make_track(1, 320, 240)])
        self.assertEqual(len(events), 0)
        self.assertEqual(self.counter.current_passenger_count, 0)

        # Frame 3: Person 1 ABOVE line -> ENTRY
        events = self.counter.update([self._make_track(1, 320, 180)])
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["event_type"], "ENTRY")
        self.assertEqual(events[0]["tracking_id"], 1)
        self.assertEqual(self.counter.current_passenger_count, 1)

    def test_2_single_exit(self):
        self.counter.reset(new_initial=2)
        # Frame 1: Person 2 ABOVE line
        self.counter.update([self._make_track(2, 320, 180)])
        # Frame 2: Person 2 moves BELOW line -> EXIT
        events = self.counter.update([self._make_track(2, 320, 300)])
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["event_type"], "EXIT")
        self.assertEqual(events[0]["tracking_id"], 2)
        self.assertEqual(self.counter.current_passenger_count, 1)

    def test_3_entry_then_exit(self):
        # Entry
        self.counter.update([self._make_track(3, 320, 300)])
        events_entry = self.counter.update([self._make_track(3, 320, 180)])
        self.assertEqual(len(events_entry), 1)
        self.assertEqual(events_entry[0]["event_type"], "ENTRY")
        self.assertEqual(self.counter.current_passenger_count, 1)

        # Exit back out
        events_exit = self.counter.update([self._make_track(3, 320, 300)])
        self.assertEqual(len(events_exit), 1)
        self.assertEqual(events_exit[0]["event_type"], "EXIT")
        self.assertEqual(self.counter.current_passenger_count, 0)

    def test_4_stays_on_one_side(self):
        self.counter.update([self._make_track(4, 320, 300)])
        self.counter.update([self._make_track(4, 325, 310)])
        events = self.counter.update([self._make_track(4, 310, 290)])
        self.assertEqual(len(events), 0)
        self.assertEqual(self.counter.current_passenger_count, 0)

    def test_5_temporary_disappearance_no_exit(self):
        # Person enters
        self.counter.update([self._make_track(5, 320, 300)])
        self.counter.update([self._make_track(5, 320, 180)])
        self.assertEqual(self.counter.current_passenger_count, 1)

        # Person occluded for 3 frames (empty detections)
        for _ in range(3):
            events = self.counter.update([])
            self.assertEqual(len(events), 0)

        # Count must remain 1
        self.assertEqual(self.counter.current_passenger_count, 1)

    def test_6_jitter_in_deadzone_no_spam(self):
        # Person starts BELOW line
        self.counter.update([self._make_track(6, 320, 300)])

        # Jitters inside hysteresis zone (215 to 265)
        for y in [240, 245, 235, 250, 240]:
            events = self.counter.update([self._make_track(6, 320, y)])
            self.assertEqual(len(events), 0)

        # Crosses to ABOVE -> exactly 1 ENTRY
        events = self.counter.update([self._make_track(6, 320, 180)])
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["event_type"], "ENTRY")

        # Jitters back and forth between ABOVE and deadzone -> NO extra events
        for y in [230, 190, 240, 180]:
            events = self.counter.update([self._make_track(6, 320, y)])
            self.assertEqual(len(events), 0)

        self.assertEqual(self.counter.current_passenger_count, 1)

    def test_7_two_separate_people(self):
        # Person 1 enters
        self.counter.update([self._make_track(10, 200, 300)])
        events1 = self.counter.update([self._make_track(10, 200, 180)])
        self.assertEqual(len(events1), 1)
        self.assertEqual(self.counter.current_passenger_count, 1)

        # Person 2 enters
        self.counter.update([self._make_track(20, 400, 300)])
        events2 = self.counter.update([self._make_track(20, 400, 180)])
        self.assertEqual(len(events2), 1)
        self.assertEqual(self.counter.current_passenger_count, 2)

    def test_negative_count_protection(self):
        # If count is 0 and someone crosses ABOVE to BELOW, count remains >= 0
        self.counter.update([self._make_track(7, 320, 180)])
        events = self.counter.update([self._make_track(7, 320, 300)])
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["event_type"], "EXIT")
        self.assertEqual(self.counter.current_passenger_count, 0)


if __name__ == "__main__":
    unittest.main()

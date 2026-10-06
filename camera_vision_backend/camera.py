# FlowJeep Camera Vision - Camera Module (ESP32-CAM / webcam / video file)
# File: camera.py
import cv2
import logging
import threading
import time
from typing import Tuple, Optional, Union

logger = logging.getLogger("flowjeep.camera")


def _is_network_source(source) -> bool:
    return isinstance(source, str) and source.lower().startswith(("http://", "https://", "rtsp://"))


class CameraStream:
    """
    Works with:
      - ESP32-CAM MJPEG stream  (e.g. "http://192.168.1.50:81/stream")
      - USB webcam              (int index)
      - video file              (path string)

    Live sources (ESP32-CAM, webcam) are read by a background thread that keeps ONLY the
    newest frame, so slow YOLO inference never makes the video lag behind. If the Wi-Fi
    or stream drops, the thread reconnects automatically.
    Video files are read frame by frame (no skipped frames) so test runs stay repeatable.
    """

    def __init__(
        self,
        source: Union[int, str] = 0,
        width: int = 640,
        height: int = 480,
        target_fps: int = 30,
        use_threading: bool = True,
        reconnect_delay: float = 2.0,
    ):
        self.source = source
        self.width = width
        self.height = height
        self.target_fps = target_fps
        self.reconnect_delay = reconnect_delay

        self.is_network = _is_network_source(source)
        self.is_live = self.is_network or isinstance(source, int)
        self.use_threading = bool(use_threading and self.is_live)

        self.cap = None
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._cond = threading.Condition()
        self._frame = None
        self._seq = 0
        self._last_read_seq = 0

    # ------------------------------------------------------------------ open
    def _open(self):
        if isinstance(self.source, int):
            cap = cv2.VideoCapture(self.source, cv2.CAP_DSHOW)
            if not cap.isOpened():
                cap.release()
                cap = cv2.VideoCapture(self.source)
        else:
            cap = cv2.VideoCapture(self.source)
        if not cap.isOpened():
            cap.release()
            return None
        try:
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        except Exception:
            pass
        if not self.is_network and isinstance(self.source, int):
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        return cap

    def start(self) -> bool:
        if self.use_threading:
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._reader_loop, name="camera-reader", daemon=True)
            self._thread.start()
            logger.info("Camera stream thread started for source: %s", self.source)
            return True
        self.cap = self._open()
        if self.cap is None:
            if self.is_network:
                logger.error(
                    "Cannot open stream %s. Check: ESP32-CAM powered, same Wi-Fi, correct IP, "
                    "and the page http://<IP>:81/stream opens in a browser.", self.source)
            return False
        return True

    # ---------------------------------------------------------- reader thread
    def _read_mjpeg_loop(self):
        import requests
        import numpy as np

        while not self._stop_event.is_set():
            try:
                logger.info("Connecting to MJPEG stream: %s", self.source)
                with requests.get(self.source, stream=True, timeout=6) as response:
                    if response.status_code != 200:
                        logger.warning("Stream returned status %d. Retrying...", response.status_code)
                        self._stop_event.wait(self.reconnect_delay)
                        continue
                    logger.info("Connected to MJPEG stream: %s", self.source)
                    stream_bytes = b""
                    for chunk in response.iter_content(chunk_size=4096):
                        if self._stop_event.is_set():
                            break
                        if not chunk:
                            continue
                        stream_bytes += chunk
                        a = stream_bytes.find(b"\xff\xd8")
                        b = stream_bytes.find(b"\xff\xd9")
                        if a != -1 and b != -1 and b > a:
                            jpg = stream_bytes[a : b + 2]
                            stream_bytes = stream_bytes[b + 2 :]
                            frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
                            if frame is not None:
                                with self._cond:
                                    self._frame = frame
                                    self._seq += 1
                                    self._cond.notify_all()
            except Exception as e:
                logger.warning("MJPEG stream connection dropped (%s), retrying in %.1fs...", e, self.reconnect_delay)
                self._stop_event.wait(self.reconnect_delay)

    def _reader_loop(self):
        if self.is_network:
            # First try cv2.VideoCapture; if it fails to open, switch to resilient direct HTTP MJPEG reader
            cap = self._open()
            if cap and cap.isOpened():
                self.cap = cap
            else:
                logger.info("Direct VideoCapture failed for %s. Using HTTP MJPEG stream reader.", self.source)
                self._read_mjpeg_loop()
                return

        failures = 0
        while not self._stop_event.is_set():
            if self.cap is None or not self.cap.isOpened():
                self.cap = self._open()
                if self.cap is None:
                    logger.warning("Camera unavailable, retrying in %.1fs...", self.reconnect_delay)
                    self._stop_event.wait(self.reconnect_delay)
                else:
                    logger.info("Camera reconnected.")
                continue

            ok, frame = self.cap.read()
            if not ok or frame is None:
                failures += 1
                if failures >= 5:
                    logger.warning("Stream lost. Reconnecting...")
                    self.cap.release()
                    self.cap = None
                    failures = 0
                    self._stop_event.wait(self.reconnect_delay)
                else:
                    time.sleep(0.05)
                continue

            failures = 0
            with self._cond:
                self._frame = frame      # replaces older frame -> only the newest is kept
                self._seq += 1
                self._cond.notify_all()

    # ------------------------------------------------------------------- read
    def _fit(self, frame):
        h, w = frame.shape[:2]
        if (w, h) != (self.width, self.height):
            frame = cv2.resize(frame, (self.width, self.height))
        return frame

    def read(self, timeout: float = 1.0) -> Tuple[bool, Optional[any]]:
        """Returns (ok, frame). For live sources, waits up to `timeout` for a NEW frame."""
        if not self.use_threading:
            if not self.cap:
                return False, None
            ok, frame = self.cap.read()
            if not ok or frame is None:
                return False, None
            return True, self._fit(frame)

        with self._cond:
            got_new = self._cond.wait_for(
                lambda: self._seq != self._last_read_seq or self._stop_event.is_set(),
                timeout=timeout,
            )
            if not got_new or self._frame is None:
                return False, None
            self._last_read_seq = self._seq
            frame = self._frame
        return True, self._fit(frame)

    def get_resolution(self) -> Tuple[int, int]:
        if self._frame is not None:
            h, w = self._frame.shape[:2]
            return w, h
        if self.cap:
            return int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return self.width, self.height

    def stop(self):
        self._stop_event.set()
        with self._cond:
            self._cond.notify_all()
        if self._thread:
            self._thread.join(timeout=3)
        if self.cap:
            self.cap.release()
            self.cap = None

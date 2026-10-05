"""
FlowJeep OSRM Routing & Geospatial Corridor Snapping Service
Integrates Open Source Routing Machine (OSRM) for route-constrained snapping and ETA computation.
"""

import os
import math
import logging
import requests
from typing import Dict, Any, List, Tuple

logging.basicConfig(level=logging.INFO)

OSRM_BASE_URL = os.getenv("OSRM_URL", "https://router.project-osrm.org")

# Curated Metro Manila Paratransit Route Geometry (EDSA - Quezon Memorial Circle - UP Diliman)
DESIGNATED_CORRIDORS = {
    "EDSA-QMC-DILIMAN": [
        [14.65625, 121.02914], # SM City North EDSA Terminal
        [14.65350, 121.03320], # TriNoma / North Ave MRT
        [14.65210, 121.04010], # Agham Road / Vertis North
        [14.65150, 121.04940], # Quezon Memorial Circle (Elliptical)
        [14.65380, 121.05650], # Philcoa Public Jeepney Terminal
        [14.65430, 121.06600], # UP Asian Center / Commonwealth
        [14.65388, 121.06849]  # UP Diliman University Avenue
    ]
}

def haversine_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """Calculates great-circle distance in meters between two [lat, lng] points."""
    R = 6371000.0 # Earth radius in meters
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat / 2.0)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class OSRMRoutingService:
    def __init__(self, base_url: str = OSRM_BASE_URL):
        self.base_url = base_url.rstrip('/')

    def snap_to_corridor(
        self, 
        lat: float, 
        lng: float, 
        route_code: str = "EDSA-QMC-DILIMAN"
    ) -> Dict[str, Any]:
        """
        Geospatially projects raw vehicle GPS coordinate onto the authorized paratransit corridor polyline.
        Prevents GPS drift from placing vehicles in buildings or opposing lanes.
        """
        corridor = DESIGNATED_CORRIDORS.get(route_code, DESIGNATED_CORRIDORS["EDSA-QMC-DILIMAN"])
        min_dist = float("inf")
        best_snap = (lat, lng)
        best_segment_idx = 0

        # Project point onto each line segment of corridor
        for i in range(len(corridor) - 1):
            p1 = corridor[i]
            p2 = corridor[i + 1]
            snapped_pt, dist = self._project_point_to_segment((lat, lng), p1, p2)
            if dist < min_dist:
                min_dist = dist
                best_snap = snapped_pt
                best_segment_idx = i

        # Calculate progress along route (0.0 to 1.0)
        route_progress_pct = round(((best_segment_idx + 0.5) / len(corridor)) * 100, 1)

        return {
            "snapped_lat": round(best_snap[0], 6),
            "snapped_lng": round(best_snap[1], 6),
            "distance_to_corridor_m": round(min_dist, 1),
            "segment_index": best_segment_idx,
            "corridor_code": route_code,
            "route_progress_pct": route_progress_pct,
            "is_on_route": min_dist < 45.0 # Max acceptable offset in dense urban canyons
        }

    def compute_route_eta(
        self,
        current_lat: float,
        current_lng: float,
        destination_lat: float,
        destination_lng: float,
        traffic_congestion_factor: float = 1.35
    ) -> Dict[str, Any]:
        """
        Queries OSRM Route service for driving distance and duration,
        applying Manila paratransit dwell time and traffic congestion multipliers.
        """
        # Snap current position first
        snapped = self.snap_to_corridor(current_lat, current_lng)
        start_lat, start_lng = snapped["snapped_lat"], snapped["snapped_lng"]

        # OSRM coordinate format: {longitude},{latitude}
        osrm_url = f"{self.base_url}/route/v1/driving/{start_lng},{start_lat};{destination_lng},{destination_lat}?overview=false&geometries=geojson"
        
        try:
            res = requests.get(osrm_url, timeout=3.0)
            if res.status_code == 200:
                data = res.json()
                if "routes" in data and len(data["routes"]) > 0:
                    route = data["routes"][0]
                    raw_duration_sec = route.get("duration", 600)
                    distance_m = route.get("distance", 3500)

                    # Paratransit stops (dwell time ~30s per active boarding stop)
                    adjusted_duration_sec = (raw_duration_sec * traffic_congestion_factor) + 90.0
                    eta_minutes = max(1.0, round(adjusted_duration_sec / 60.0, 1))

                    return {
                        "eta_minutes": eta_minutes,
                        "eta_seconds": int(adjusted_duration_sec),
                        "distance_meters": round(distance_m, 1),
                        "distance_km": round(distance_m / 1000.0, 2),
                        "snapped_start": [start_lat, start_lng],
                        "congestion_multiplier": traffic_congestion_factor,
                        "routing_engine": "OSRM_Engine_v5"
                    }
        except Exception as e:
            logging.warning(f"[OSRM] Live query fallback: {e}")

        # Geometric fallback calculation (Haversine @ 22 km/h average paratransit urban speed)
        dist_m = haversine_distance((start_lat, start_lng), (destination_lat, destination_lng))
        est_seconds = (dist_m / (22.0 * 1000.0 / 3600.0)) * traffic_congestion_factor + 60.0

        return {
            "eta_minutes": max(1.0, round(est_seconds / 60.0, 1)),
            "eta_seconds": int(est_seconds),
            "distance_meters": round(dist_m, 1),
            "distance_km": round(dist_m / 1000.0, 2),
            "snapped_start": [start_lat, start_lng],
            "congestion_multiplier": traffic_congestion_factor,
            "routing_engine": "Haversine_Paratransit_Model"
        }

    def _project_point_to_segment(self, p, p1, p2):
        """Projects point p onto line segment p1-p2 in Euclidean approximation."""
        x, y = p[1], p[0]
        x1, y1 = p1[1], p1[0]
        x2, y2 = p2[1], p2[0]

        dx = x2 - x1
        dy = y2 - y1
        if dx == 0 and dy == 0:
            return p1, haversine_distance(p, p1)

        t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
        t = max(0.0, min(1.0, t))

        proj_x = x1 + t * dx
        proj_y = y1 + t * dy
        proj_pt = (proj_y, proj_x)
        dist = haversine_distance(p, proj_pt)
        return proj_pt, dist

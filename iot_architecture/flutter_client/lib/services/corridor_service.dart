import 'dart:math';
import 'package:latlong2/latlong.dart';
import '../models/corridor_route.dart';
import '../models/vehicle_telemetry.dart';

class SnappedPoint {
  final LatLng point;
  final String corridorName;
  final double distanceMeters;
  final bool isSnapped;

  const SnappedPoint({
    required this.point,
    required this.corridorName,
    required this.distanceMeters,
    required this.isSnapped,
  });
}

class JourneyVehicleMatch {
  final VehicleTelemetry vehicle;
  final ModernJeepneyRoute route;
  final int etaMinutes;
  final double distanceToPickupKm;

  const JourneyVehicleMatch({
    required this.vehicle,
    required this.route,
    required this.etaMinutes,
    required this.distanceToPickupKm,
  });
}

class CorridorService {
  /// Calculate Haversine distance in meters
  static double distanceBetween(LatLng a, LatLng b) {
    const double r = 6371000; // Earth radius in meters
    final double dLat = (b.latitude - a.latitude) * pi / 180.0;
    final double dLng = (b.longitude - a.longitude) * pi / 180.0;
    final double lat1 = a.latitude * pi / 180.0;
    final double lat2 = b.latitude * pi / 180.0;

    final double h = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1) * cos(lat2) * sin(dLng / 2) * sin(dLng / 2);
    final double c = 2 * atan2(sqrt(h), sqrt(1 - h));
    return r * c;
  }

  /// Projects a point onto a line segment
  static LatLng closestPointOnSegment(LatLng p, LatLng a, LatLng b) {
    final double x = p.latitude, y = p.longitude;
    final double x1 = a.latitude, y1 = a.longitude;
    final double x2 = b.latitude, y2 = b.longitude;
    final double dx = x2 - x1;
    final double dy = y2 - y1;

    if (dx == 0 && dy == 0) return a;

    final double t = max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
    return LatLng(x1 + t * dx, y1 + t * dy);
  }

  /// Snaps any GPS point to the nearest Modern Jeepney road corridor
  static SnappedPoint snapToCorridors(LatLng point, {double maxSnapDistanceMeters = 2500}) {
    double bestDistance = double.infinity;
    LatLng bestPoint = point;
    String bestCorridor = 'Selected Location';

    for (final route in ModernJeepneyRoute.defaultRoutes) {
      final path = route.path;
      for (int i = 0; i < path.length - 1; i++) {
        final a = path[i];
        final b = path[i + 1];
        final proj = closestPointOnSegment(point, a, b);
        final dist = distanceBetween(point, proj);

        if (dist < bestDistance) {
          bestDistance = dist;
          bestPoint = proj;
          bestCorridor = route.name;
        }
      }
    }

    final bool isSnapped = bestDistance <= maxSnapDistanceMeters;
    return SnappedPoint(
      point: isSnapped ? bestPoint : point,
      corridorName: isSnapped ? bestCorridor : 'Custom Pin Location',
      distanceMeters: bestDistance,
      isSnapped: isSnapped,
    );
  }

  /// Checks if a coordinate is near a route path (within threshold meters)
  static bool isPointNearRoute(LatLng point, List<LatLng> path, {double thresholdMeters = 1200}) {
    for (int i = 0; i < path.length - 1; i++) {
      final a = path[i];
      final b = path[i + 1];
      final proj = closestPointOnSegment(point, a, b);
      if (distanceBetween(point, proj) <= thresholdMeters) {
        return true;
      }
    }
    return false;
  }

  /// Find index of the segment closest to point
  static int findNearestSegmentIndex(LatLng point, List<LatLng> path) {
    double minDist = double.infinity;
    int nearestIdx = 0;
    for (int i = 0; i < path.length - 1; i++) {
      final a = path[i];
      final b = path[i + 1];
      final proj = closestPointOnSegment(point, a, b);
      final dist = distanceBetween(point, proj);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }
    return nearestIdx;
  }

  /// Filters vehicles that cover both pickup and destination in the proper direction of travel
  static List<JourneyVehicleMatch> filterVehiclesForJourney({
    required LatLng pickup,
    LatLng? destination,
    required List<VehicleTelemetry> fleet,
  }) {
    final List<JourneyVehicleMatch> matches = [];

    for (final vehicle in fleet) {
      final route = ModernJeepneyRoute.defaultRoutes.firstWhere(
        (r) => r.id == vehicle.routeId || r.routeCode == vehicle.routeCode,
        orElse: () => ModernJeepneyRoute.defaultRoutes.first,
      );

      final bool nearPickup = isPointNearRoute(pickup, route.path);
      if (!nearPickup) continue;

      if (destination != null) {
        final bool nearDest = isPointNearRoute(destination, route.path);
        if (!nearDest) continue;

        final pickupIdx = findNearestSegmentIndex(pickup, route.path);
        final destIdx = findNearestSegmentIndex(destination, route.path);
        if (pickupIdx > destIdx) {
          // Jeep is traveling in the opposite direction
          continue;
        }
      }

      final vehiclePos = LatLng(vehicle.lat, vehicle.lng);
      final distMeters = distanceBetween(vehiclePos, pickup);
      final distKm = distMeters / 1000.0;

      // Realistic Manila transit speed ~22 km/h
      final etaMin = max(1, (distKm / 22.0 * 60).round());

      matches.add(JourneyVehicleMatch(
        vehicle: vehicle,
        route: route,
        etaMinutes: etaMin,
        distanceToPickupKm: distKm,
      ));
    }

    matches.sort((a, b) => a.etaMinutes.compareTo(b.etaMinutes));
    return matches;
  }
}

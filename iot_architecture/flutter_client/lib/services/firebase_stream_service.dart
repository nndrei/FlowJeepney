import 'dart:async';
import 'package:latlong2/latlong.dart';
import '../models/vehicle_telemetry.dart';
import '../models/corridor_route.dart';

class FirebaseVehicleStreamService {
  StreamController<List<VehicleTelemetry>>? _simulatorController;
  Timer? _simulationTimer;

  // Active simulated fleet units traversing the corridors
  final List<_SimulatedUnit> _units = [
    _SimulatedUnit(
      id: 'FJ-01',
      plate: 'NCM-8821',
      routeId: 'route-10',
      routeCode: 'Route 10',
      routeName: 'Fairview - Buendia',
      model: 'Hino Poncho Modern PUV',
      routeIndex: 5, // near Philcoa
      isAircon: true,
      maxCapacity: 24,
      onboard: 16,
      voltage: 14.1,
      rssi: -68,
    ),
    _SimulatedUnit(
      id: 'FJ-02',
      plate: 'NDB-4419',
      routeId: 'route-10',
      routeCode: 'Route 10',
      routeName: 'Fairview - Buendia',
      model: 'Isuzu NLR77 PUV Class 2',
      routeIndex: 9, // near Timog / Fisher Mall
      isAircon: true,
      maxCapacity: 24,
      onboard: 22,
      voltage: 13.9,
      rssi: -74,
    ),
    _SimulatedUnit(
      id: 'FJ-03',
      plate: 'NAF-2390',
      routeId: 'route-06',
      routeCode: 'Route 6',
      routeName: 'Commonwealth - Quiapo',
      model: 'Foton F-Jeepney',
      routeIndex: 2, // near Commonwealth / Tandang Sora
      isAircon: false,
      maxCapacity: 22,
      onboard: 11,
      voltage: 13.7,
      rssi: -79,
    ),
    _SimulatedUnit(
      id: 'FJ-04',
      plate: 'NCR-5510',
      routeId: 'route-15',
      routeCode: 'Route 15',
      routeName: 'SM North - Philcoa / UP',
      model: 'Hyundai HD50S Class 2',
      routeIndex: 1, // near Agham / QC Circle
      isAircon: true,
      maxCapacity: 24,
      onboard: 7,
      voltage: 14.2,
      rssi: -65,
    ),
  ];

  /// Streams active fleet with live position updates and load shifts
  Stream<List<VehicleTelemetry>> streamActiveFleet() {
    _simulatorController ??= StreamController<List<VehicleTelemetry>>.broadcast(
      onListen: _startSimulation,
      onCancel: _stopSimulation,
    );
    return _simulatorController!.stream;
  }

  void _startSimulation() {
    _simulationTimer?.cancel();
    _emitSnapshot();

    _simulationTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      for (final unit in _units) {
        final route = ModernJeepneyRoute.defaultRoutes.firstWhere(
          (r) => r.id == unit.routeId,
          orElse: () => ModernJeepneyRoute.defaultRoutes.first,
        );

        // Advance along the corridor path
        unit.progress += 0.08;
        if (unit.progress >= 1.0) {
          unit.progress = 0.0;
          unit.routeIndex = (unit.routeIndex + 1) % (route.path.length - 1);

          // Simulate passenger boarding/alighting events at stops
          if (unit.onboard >= unit.maxCapacity) {
            unit.onboard -= 4;
            unit.alightedCount += 4;
          } else if (unit.onboard <= 6) {
            unit.onboard += 6;
            unit.boardedCount += 6;
          } else {
            unit.onboard += (unit.id.hashCode % 3) - 1;
          }
          unit.onboard = unit.onboard.clamp(0, unit.maxCapacity);
        }
      }
      _emitSnapshot();
    });
  }

  void _stopSimulation() {
    _simulationTimer?.cancel();
    _simulationTimer = null;
  }

  void _emitSnapshot() {
    if (_simulatorController == null || _simulatorController!.isClosed) return;

    final List<VehicleTelemetry> snapshot = [];
    for (final unit in _units) {
      final route = ModernJeepneyRoute.defaultRoutes.firstWhere(
        (r) => r.id == unit.routeId,
        orElse: () => ModernJeepneyRoute.defaultRoutes.first,
      );

      final p1 = route.path[unit.routeIndex % route.path.length];
      final p2 = route.path[(unit.routeIndex + 1) % route.path.length];

      final double currentLat = p1.latitude + (p2.latitude - p1.latitude) * unit.progress;
      final double currentLng = p1.longitude + (p2.longitude - p1.longitude) * unit.progress;

      final int capPct = ((unit.onboard / unit.maxCapacity) * 100).round();

      snapshot.add(VehicleTelemetry(
        vehicleId: unit.id,
        routeId: unit.routeId,
        routeCode: unit.routeCode,
        routeName: unit.routeName,
        plateNumber: unit.plate,
        model: unit.model,
        isAircon: unit.isAircon,
        lat: currentLat,
        lng: currentLng,
        speedKph: 24.5,
        heading: 145.0,
        passengersOnboard: unit.onboard,
        maxCapacity: unit.maxCapacity,
        capacityPct: capPct,
        etaSeconds: (360 * (1.0 - unit.progress)).round().clamp(60, 600),
        nextStop: route.name.split(' via ').first,
        timestamp: DateTime.now().millisecondsSinceEpoch,
        alternatorVoltage: unit.voltage,
        lteRssiDbm: unit.rssi,
        totalBoarded: unit.boardedCount,
        totalAlighted: unit.alightedCount,
        sosActive: false,
      ));
    }

    _simulatorController!.add(snapshot);
  }

  void dispose() {
    _stopSimulation();
    _simulatorController?.close();
  }
}

class _SimulatedUnit {
  final String id;
  final String plate;
  final String routeId;
  final String routeCode;
  final String routeName;
  final String model;
  final bool isAircon;
  final int maxCapacity;
  int routeIndex;
  double progress;
  int onboard;
  double voltage;
  int rssi;
  int boardedCount;
  int alightedCount;

  _SimulatedUnit({
    required this.id,
    required this.plate,
    required this.routeId,
    required this.routeCode,
    required this.routeName,
    required this.model,
    required this.isAircon,
    required this.maxCapacity,
    required this.routeIndex,
    this.progress = 0.0,
    required this.onboard,
    required this.voltage,
    required this.rssi,
    this.boardedCount = 142,
    this.alightedCount = 124,
  });
}

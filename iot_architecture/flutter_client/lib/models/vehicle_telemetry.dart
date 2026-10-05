class VehicleTelemetry {
  final String vehicleId;
  final String routeId;
  final String routeCode;
  final String routeName;
  final String plateNumber;
  final String model;
  final bool isAircon;
  final double lat;
  final double lng;
  final double speedKph;
  final double heading;
  final int passengersOnboard;
  final int maxCapacity;
  final int capacityPct;
  final int etaSeconds;
  final String nextStop;
  final int timestamp;

  // Edge Hardware & Diagnostic Metrics
  final double alternatorVoltage;
  final int lteRssiDbm;
  final bool beam1Triggered;
  final bool beam2Triggered;
  final int totalBoarded;
  final int totalAlighted;
  final bool sosActive;

  VehicleTelemetry({
    required this.vehicleId,
    this.routeId = 'route-10',
    required this.routeCode,
    this.routeName = 'Fairview - Buendia',
    this.plateNumber = 'NCM-8821',
    this.model = 'Hino Poncho Modern PUV',
    this.isAircon = true,
    required this.lat,
    required this.lng,
    required this.speedKph,
    required this.heading,
    required this.passengersOnboard,
    required this.maxCapacity,
    required this.capacityPct,
    required this.etaSeconds,
    required this.nextStop,
    required this.timestamp,
    this.alternatorVoltage = 13.8,
    this.lteRssiDbm = -72,
    this.beam1Triggered = false,
    this.beam2Triggered = false,
    this.totalBoarded = 142,
    this.totalAlighted = 124,
    this.sosActive = false,
  });

  factory VehicleTelemetry.fromMap(String id, Map<dynamic, dynamic> map) {
    final int cap = (map['max_capacity'] as num?)?.toInt() ?? 24;
    final int onboard = (map['passengers_onboard'] as num?)?.toInt() ?? 0;
    final int calculatedPct = cap > 0 ? ((onboard / cap) * 100).round() : 0;

    return VehicleTelemetry(
      vehicleId: id,
      routeId: map['route_id'] ?? 'route-10',
      routeCode: map['route_code'] ?? 'Route 10',
      routeName: map['route_name'] ?? 'Fairview - Buendia',
      plateNumber: map['plate_number'] ?? 'NCM-8821',
      model: map['model'] ?? 'Isuzu NLR77 PUV Class 2',
      isAircon: map['is_aircon'] ?? true,
      lat: (map['lat'] as num?)?.toDouble() ?? 14.6535,
      lng: (map['lng'] as num?)?.toDouble() ?? 121.0332,
      speedKph: (map['speed_kph'] as num?)?.toDouble() ?? 22.0,
      heading: (map['heading'] as num?)?.toDouble() ?? 0.0,
      passengersOnboard: onboard,
      maxCapacity: cap,
      capacityPct: (map['capacity_pct'] as num?)?.toInt() ?? calculatedPct,
      etaSeconds: (map['eta_next_stop_seconds'] as num?)?.toInt() ?? 180,
      nextStop: map['next_stop'] ?? 'Philcoa Transit Hub',
      timestamp: (map['timestamp'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
      alternatorVoltage: (map['alternator_voltage'] as num?)?.toDouble() ?? 13.8,
      lteRssiDbm: (map['lte_rssi_dbm'] as num?)?.toInt() ?? -72,
      beam1Triggered: map['beam1_state'] ?? false,
      beam2Triggered: map['beam2_state'] ?? false,
      totalBoarded: (map['total_boarded'] as num?)?.toInt() ?? 142,
      totalAlighted: (map['total_alighted'] as num?)?.toInt() ?? 124,
      sosActive: map['sos_active'] ?? false,
    );
  }

  int get availableSeats => (maxCapacity - passengersOnboard).clamp(0, maxCapacity);

  bool get hasSeatsAvailable => availableSeats > 0;

  String get loadStatus {
    if (capacityPct >= 95) return 'Full (Standing Only)';
    if (capacityPct >= 75) return 'Few Seats Left';
    return '$availableSeats Seats Open';
  }

  int get etaMinutes => (etaSeconds / 60).ceil().clamp(1, 120);
}

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../models/vehicle_telemetry.dart';
import '../models/transit_place.dart';
import '../services/corridor_service.dart';
import '../widgets/jeepney_card.dart';

class WaitingScreen extends StatefulWidget {
  final LatLng pickupLocation;
  final String pickupName;
  final LatLng? destinationLocation;
  final String? destinationName;
  final List<VehicleTelemetry> fleet;
  final Function(LatLng point) onTrackVehicle;
  final VoidCallback onChangeStop;

  const WaitingScreen({
    super.key,
    required this.pickupLocation,
    required this.pickupName,
    this.destinationLocation,
    this.destinationName,
    required this.fleet,
    required this.onTrackVehicle,
    required this.onChangeStop,
  });

  @override
  State<WaitingScreen> createState() => _WaitingScreenState();
}

class _WaitingScreenState extends State<WaitingScreen> {
  final Set<String> _signaledVehicles = {};
  String? _lastSignaledPlate;

  void _toggleSignal(String vehicleId, String plate) {
    setState(() {
      if (_signaledVehicles.contains(vehicleId)) {
        _signaledVehicles.remove(vehicleId);
        if (_lastSignaledPlate == plate) _lastSignaledPlate = null;
      } else {
        _signaledVehicles.add(vehicleId);
        _lastSignaledPlate = plate;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final matches = CorridorService.filterVehiclesForJourney(
      pickup: widget.pickupLocation,
      destination: widget.destinationLocation,
      fleet: widget.fleet,
    );

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('I Am Waiting', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: const Color(0xFF800020),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.black26,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Row(
              children: [
                CircleAvatar(radius: 4, backgroundColor: Color(0xFF00E676)),
                SizedBox(width: 6),
                Text('Broadcasting', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Signal Toast Alert
            if (_lastSignaledPlate != null) ...[
              Container(
                margin: const EdgeInsets.bottom(14),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF003816),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF00B14F).withOpacity(0.5)),
                  boxShadow: const [
                    BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 2)),
                  ],
                ),
                child: Row(
                  children: [
                    const CircleAvatar(
                      radius: 14,
                      backgroundColor: Color(0xFF00B14F),
                      child: Icon(Icons.check, size: 16, color: Colors.white),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Driver Signaled · $_lastSignaledPlate',
                            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          const Text(
                            'Pickup location broadcasted to driver cabin manifest.',
                            style: TextStyle(color: Color(0xFFA3F3C6), fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 16, color: Colors.white70),
                      onPressed: () => setState(() => _lastSignaledPlate = null),
                    ),
                  ],
                ),
              ),
            ],

            // Active Corridor & Stop Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Row(
                        children: [
                          CircleAvatar(radius: 4, backgroundColor: Color(0xFF800020)),
                          SizedBox(width: 6),
                          Text(
                            'CURRENT WAITING LOCATION',
                            style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: Colors.grey),
                          ),
                        ],
                      ),
                      TextButton(
                        onPressed: widget.onChangeStop,
                        style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(50, 24)),
                        child: const Text('Change Stop', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0288D1))),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 14,
                        backgroundColor: Color(0xFF0288D1),
                        child: Icon(Icons.location_on_rounded, size: 16, color: Colors.white),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Waiting At (Pickup)', style: TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                            Text(widget.pickupName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (widget.destinationName != null && widget.destinationName!.isNotEmpty) ...[
                    const Divider(height: 20),
                    Row(
                      children: [
                        const CircleAvatar(
                          radius: 14,
                          backgroundColor: Color(0xFF800020),
                          child: Icon(Icons.flag_rounded, size: 16, color: Colors.white),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Bound For (Destination)', style: TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                              Text(widget.destinationName!, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 18),

            // Queue Section Header
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Text(
                  'APPROACHING JEEPNEYS (${matches.length})',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                    color: Colors.grey.shade700,
                  ),
                ),
                if (matches.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF800020).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Next in ~${matches.first.etaMinutes} min',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF800020)),
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 8),

            if (matches.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.directions_bus_filled_rounded, size: 48, color: Colors.grey),
                    SizedBox(height: 12),
                    Text(
                      'No vehicles approaching this stop right now',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Telemetry units will appear automatically as modern jeeps dispatch onto this corridor.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              )
            else
              ...matches.map((m) {
                final isSignaled = _signaledVehicles.contains(m.vehicle.vehicleId);
                return JeepneyCard(
                  vehicle: m.vehicle,
                  etaMinutes: m.etaMinutes,
                  distanceKm: m.distanceToPickupKm,
                  isSignaled: isSignaled,
                  onSignalDriver: () => _toggleSignal(m.vehicle.vehicleId, m.vehicle.plateNumber),
                  onTrackOnMap: () => widget.onTrackVehicle(LatLng(m.vehicle.lat, m.vehicle.lng)),
                );
              }),
          ],
        ),
      ),
    );
  }
}

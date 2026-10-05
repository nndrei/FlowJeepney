import 'package:flutter/material.dart';
import '../models/vehicle_telemetry.dart';

class OperatorDashboardScreen extends StatefulWidget {
  final List<VehicleTelemetry> fleet;

  const OperatorDashboardScreen({super.key, required this.fleet});

  @override
  State<OperatorDashboardScreen> createState() => _OperatorDashboardScreenState();
}

class _OperatorDashboardScreenState extends State<OperatorDashboardScreen> {
  String? _selectedVehicleId;

  @override
  Widget build(BuildContext context) {
    final activeFleet = widget.fleet;
    final totalPassengers = activeFleet.fold<int>(0, (sum, v) => sum + v.passengersOnboard);
    final totalCapacity = activeFleet.fold<int>(0, (sum, v) => sum + v.maxCapacity);
    final avgLoadPct = totalCapacity > 0 ? ((totalPassengers / totalCapacity) * 100).round() : 0;

    final selectedVehicle = activeFleet.firstWhere(
      (v) => v.vehicleId == _selectedVehicleId,
      orElse: () => activeFleet.isNotEmpty ? activeFleet.first : VehicleTelemetry(
        vehicleId: 'NONE',
        routeCode: 'None',
        lat: 14.65,
        lng: 121.05,
        speedKph: 0,
        heading: 0,
        passengersOnboard: 0,
        maxCapacity: 24,
        capacityPct: 0,
        etaSeconds: 0,
        nextStop: 'N/A',
        timestamp: 0,
      ),
    );

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Fleet Operator Dispatch', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF007A37).withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF00E676)),
            ),
            child: const Row(
              children: [
                CircleAvatar(radius: 4, backgroundColor: Color(0xFF00E676)),
                SizedBox(width: 6),
                Text('MQTT Connected', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF00E676))),
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
            // Operator Metric KPI Cards
            Row(
              children: [
                _kpiCard('Active Units', '${activeFleet.length} Jeeps', Icons.directions_bus_rounded, const Color(0xFF800020)),
                const SizedBox(width: 10),
                _kpiCard('Fleet Load', '$avgLoadPct% Cap', Icons.groups_rounded, const Color(0xFF007A37)),
                const SizedBox(width: 10),
                _kpiCard('SOS Alerts', '0 Active', Icons.security_rounded, const Color(0xFF0288D1)),
              ],
            ),

            const SizedBox(height: 18),

            // Vehicle Unit Selector Tabs
            Text(
              'SELECT EDGE NODE TO INSPECT',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.8,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),

            SizedBox(
              height: 48,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: activeFleet.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final v = activeFleet[index];
                  final isSelected = selectedVehicle.vehicleId == v.vehicleId;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedVehicleId = v.vehicleId),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF1E293B) : Colors.grey.shade300,
                        ),
                        boxShadow: isSelected
                            ? [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 6, offset: const Offset(0, 2))]
                            : null,
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 5,
                            backgroundColor: v.capacityPct >= 90 ? Colors.red : const Color(0xFF00E676),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '${v.vehicleId} (${v.plateNumber})',
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.white : Colors.black87,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 18),

            // Live Edge IoT Telemetry Diagnostic Panel
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${selectedVehicle.vehicleId} · ${selectedVehicle.plateNumber}',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
                          ),
                          Text(
                            '${selectedVehicle.routeName} · ${selectedVehicle.model}',
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF800020),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          selectedVehicle.routeCode,
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),

                  const Divider(height: 24),

                  // Hardware Telemetry Matrix
                  const Text(
                    'EDGE HARDWARE DIAGNOSTICS (ESP32-S3)',
                    style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      _telemetryTile(
                        icon: Icons.battery_charging_full_rounded,
                        label: 'Alternator',
                        value: '${selectedVehicle.alternatorVoltage.toStringAsFixed(1)} V',
                        color: const Color(0xFF007A37),
                      ),
                      const SizedBox(width: 10),
                      _telemetryTile(
                        icon: Icons.signal_cellular_alt_rounded,
                        label: '4G LTE RSSI',
                        value: '${selectedVehicle.lteRssiDbm} dBm',
                        color: const Color(0xFF0288D1),
                      ),
                      const SizedBox(width: 10),
                      _telemetryTile(
                        icon: Icons.speed_rounded,
                        label: 'Speed',
                        value: '${selectedVehicle.speedKph.toStringAsFixed(0)} km/h',
                        color: const Color(0xFF800020),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Dual E18-D80NK IR Sensor State Machine Visualizer
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Text(
                              'DUAL E18-D80NK DOOR TRIPWIRE SENSORS',
                              style: TextStyle(color: Colors.white70, fontSize: 10.5, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                            ),
                            Text('GPIO 4/5 FSM', style: TextStyle(color: Color(0xFF00E676), fontSize: 10.5, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _beamIndicator('BEAM 1 (OUTER)', selectedVehicle.beam1Triggered),
                            const Icon(Icons.compare_arrows_rounded, color: Colors.white38, size: 24),
                            _beamIndicator('BEAM 2 (INNER)', selectedVehicle.beam2Triggered),
                          ],
                        ),
                        const Divider(color: Colors.white12, height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            Text(
                              'Total Boarded: ${selectedVehicle.totalBoarded}',
                              style: const TextStyle(color: Color(0xFF00E676), fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'Total Alighted: ${selectedVehicle.totalAlighted}',
                              style: const TextStyle(color: Colors.amber, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Current Load Bar
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Text(
                        'Onboard Load: ${selectedVehicle.passengersOnboard} / ${selectedVehicle.maxCapacity} Passengers',
                        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '${selectedVehicle.capacityPct}%',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF800020)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: selectedVehicle.capacityPct / 100.0,
                      backgroundColor: Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        selectedVehicle.capacityPct >= 90 ? Colors.red : const Color(0xFF007A37),
                      ),
                      minHeight: 8,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _kpiCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          children: [
            CircleAvatar(radius: 14, backgroundColor: color.withOpacity(0.12), child: Icon(icon, size: 16, color: color)),
            const SizedBox(height: 6),
            Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900)),
            Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _telemetryTile({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 9.5, color: Colors.grey, fontWeight: FontWeight.bold)),
            Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _beamIndicator(String label, bool isTriggered) {
    return Column(
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isTriggered ? Colors.amber : const Color(0xFF00E676),
            boxShadow: [
              BoxShadow(
                color: isTriggered ? Colors.amber.withOpacity(0.5) : const Color(0xFF00E676).withOpacity(0.5),
                blurRadius: 8,
                spreadRadius: 2,
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

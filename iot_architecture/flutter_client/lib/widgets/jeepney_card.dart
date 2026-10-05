import 'package:flutter/material.dart';
import '../models/vehicle_telemetry.dart';

class JeepneyCard extends StatelessWidget {
  final VehicleTelemetry vehicle;
  final int etaMinutes;
  final double distanceKm;
  final VoidCallback? onTrackOnMap;
  final VoidCallback? onSignalDriver;
  final bool isSignaled;

  const JeepneyCard({
    super.key,
    required this.vehicle,
    required this.etaMinutes,
    required this.distanceKm,
    this.onTrackOnMap,
    this.onSignalDriver,
    this.isSignaled = false,
  });

  Color _getLoadColor(int capacityPct) {
    if (capacityPct >= 90) return const Color(0xFFD32F2F); // Red
    if (capacityPct >= 70) return const Color(0xFFF57C00); // Amber
    return const Color(0xFF007A37); // Green
  }

  @override
  Widget build(BuildContext context) {
    final loadColor = _getLoadColor(vehicle.capacityPct);

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Route Badge + Plate + ETA
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF800020),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      vehicle.routeCode,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Text(
                      vehicle.plateNumber,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.shade800,
                      ),
                    ),
                  ),
                  if (vehicle.isAircon) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0288D1).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.ac_unit, size: 10, color: Color(0xFF0288D1)),
                          SizedBox(width: 2),
                          Text(
                            'Aircon',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0288D1),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
              // Countdown ETA Chip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.access_time_filled, size: 13, color: Color(0xFF800020)),
                    const SizedBox(width: 4),
                    Text(
                      '~$etaMinutes min',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF800020),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Route Name & Model
          Text(
            vehicle.routeName,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          Text(
            '${vehicle.model} · ${distanceKm < 1 ? '${(distanceKm * 1000).round()}m away' : '${distanceKm.toStringAsFixed(1)}km away'}',
            style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600),
          ),

          const SizedBox(height: 10),

          // Occupancy & Capacity Progress Bar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Occupancy: ${vehicle.passengersOnboard}/${vehicle.maxCapacity} Passengers',
                style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600),
              ),
              Text(
                vehicle.loadStatus,
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.bold,
                  color: loadColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: (vehicle.capacityPct / 100.0).clamp(0.0, 1.0),
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(loadColor),
              minHeight: 6,
            ),
          ),

          const SizedBox(height: 12),

          // Action Buttons: Signal Driver & Track On Map
          Row(
            children: [
              if (onSignalDriver != null)
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onSignalDriver,
                    icon: Icon(
                      isSignaled ? Icons.check_circle : Icons.sensors,
                      size: 16,
                      color: isSignaled ? const Color(0xFF007A37) : const Color(0xFF800020),
                    ),
                    label: Text(
                      isSignaled ? 'Signaled' : 'Signal Driver',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isSignaled ? const Color(0xFF007A37) : const Color(0xFF800020),
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      side: BorderSide(
                        color: isSignaled ? const Color(0xFF007A37) : const Color(0xFF800020),
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              if (onSignalDriver != null && onTrackOnMap != null) const SizedBox(width: 8),
              if (onTrackOnMap != null)
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onTrackOnMap,
                    icon: const Icon(Icons.navigation_rounded, size: 16),
                    label: const Text(
                      'Track On Map',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF800020),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

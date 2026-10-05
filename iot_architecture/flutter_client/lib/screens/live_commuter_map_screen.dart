import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/vehicle_telemetry.dart';
import '../models/transit_place.dart';
import '../models/corridor_route.dart';
import '../services/corridor_service.dart';
import '../widgets/place_search_dialog.dart';
import '../widgets/jeepney_card.dart';

class LiveCommuterMapScreen extends StatefulWidget {
  final List<VehicleTelemetry> fleet;
  final LatLng pickupLocation;
  final String pickupName;
  final LatLng? destinationLocation;
  final String? destinationName;
  final Function(LatLng point, String name) onUpdatePickup;
  final Function(LatLng point, String name) onUpdateDestination;
  final VoidCallback onClearDestination;
  final VoidCallback onNavigateToWaiting;
  final MapController mapController;

  const LiveCommuterMapScreen({
    super.key,
    required this.fleet,
    required this.pickupLocation,
    required this.pickupName,
    this.destinationLocation,
    this.destinationName,
    required this.onUpdatePickup,
    required this.onUpdateDestination,
    required this.onClearDestination,
    required this.onNavigateToWaiting,
    required this.mapController,
  });

  @override
  State<LiveCommuterMapScreen> createState() => _LiveCommuterMapScreenState();
}

class _LiveCommuterMapScreenState extends State<LiveCommuterMapScreen> {
  bool _isDrawerExpanded = true;
  VehicleTelemetry? _inspectedVehicle;

  void _recenterOnPickup() {
    widget.mapController.move(widget.pickupLocation, 15.5);
  }

  void _zoomIn() {
    widget.mapController.move(widget.mapController.camera.center, widget.mapController.camera.zoom + 1.0);
  }

  void _zoomOut() {
    widget.mapController.move(widget.mapController.camera.center, widget.mapController.camera.zoom - 1.0);
  }

  void _showPickupSearch() {
    showDialog(
      context: context,
      builder: (_) => PlaceSearchDialog(
        title: 'Choose Pickup Stop',
        isPickup: true,
        onSelectPlace: (place) {
          final snapped = CorridorService.snapToCorridors(place.location);
          widget.onUpdatePickup(snapped.point, place.name);
          widget.mapController.move(snapped.point, 15.5);
        },
        onSelectCurrentLocation: () {
          // Defaults to Philcoa Diliman GPS
          const defaultGps = LatLng(14.6538, 121.0505);
          final snapped = CorridorService.snapToCorridors(defaultGps);
          widget.onUpdatePickup(snapped.point, 'Current GPS Location');
          widget.mapController.move(snapped.point, 15.5);
        },
      ),
    );
  }

  void _showDestinationSearch() {
    showDialog(
      context: context,
      builder: (_) => PlaceSearchDialog(
        title: 'Choose Destination Stop',
        isPickup: false,
        onSelectPlace: (place) {
          final snapped = CorridorService.snapToCorridors(place.location);
          widget.onUpdateDestination(snapped.point, place.name);
          widget.mapController.move(snapped.point, 15.0);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final matches = CorridorService.filterVehiclesForJourney(
      pickup: widget.pickupLocation,
      destination: widget.destinationLocation,
      fleet: widget.fleet,
    );

    // Build polyline points connecting pickup and destination along corridor
    final List<LatLng> polylinePoints = [];
    if (widget.destinationLocation != null) {
      polylinePoints.add(widget.pickupLocation);
      for (final route in ModernJeepneyRoute.defaultRoutes) {
        if (CorridorService.isPointNearRoute(widget.pickupLocation, route.path) &&
            CorridorService.isPointNearRoute(widget.destinationLocation!, route.path)) {
          final pIdx = CorridorService.findNearestSegmentIndex(widget.pickupLocation, route.path);
          final dIdx = CorridorService.findNearestSegmentIndex(widget.destinationLocation!, route.path);
          if (pIdx <= dIdx) {
            polylinePoints.addAll(route.path.sublist(pIdx, dIdx + 1));
          }
          break;
        }
      }
      polylinePoints.add(widget.destinationLocation!);
    }

    return Scaffold(
      body: Stack(
        children: [
          // 1. OpenStreetMap Vector Map
          FlutterMap(
            mapController: widget.mapController,
            options: MapOptions(
              initialCenter: widget.pickupLocation,
              initialZoom: 15.5,
              onTap: (tapPosition, point) {
                final snapped = CorridorService.snapToCorridors(point);
                widget.onUpdatePickup(snapped.point, 'Pinned: ${snapped.corridorName}');
              },
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'ph.gov.flowjeep.app',
              ),

              // Journey Polyline Layer
              if (polylinePoints.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: polylinePoints,
                      strokeWidth: 5.0,
                      color: const Color(0xFF800020),
                    ),
                  ],
                ),

              // Marker Layer: Pickup, Destination & Active Fleet
              MarkerLayer(
                markers: [
                  // Pickup Pin (Sky Blue)
                  Marker(
                    point: widget.pickupLocation,
                    width: 44,
                    height: 44,
                    alignment: Alignment.topCenter,
                    child: const Column(
                      children: [
                        CircleAvatar(
                          radius: 14,
                          backgroundColor: Color(0xFF0288D1),
                          child: Icon(Icons.location_on_rounded, color: Colors.white, size: 18),
                        ),
                      ],
                    ),
                  ),

                  // Destination Pin (Burgundy Maroon)
                  if (widget.destinationLocation != null)
                    Marker(
                      point: widget.destinationLocation!,
                      width: 44,
                      height: 44,
                      alignment: Alignment.topCenter,
                      child: const Column(
                        children: [
                          CircleAvatar(
                            radius: 14,
                            backgroundColor: Color(0xFF800020),
                            child: Icon(Icons.flag_rounded, color: Colors.white, size: 18),
                          ),
                        ],
                      ),
                    ),

                  // Fleet Vehicles
                  ...widget.fleet.map((v) {
                    final isFull = v.capacityPct >= 95;
                    return Marker(
                      point: LatLng(v.lat, v.lng),
                      width: 90,
                      height: 34,
                      child: GestureDetector(
                        onTap: () {
                          setState(() => _inspectedVehicle = v);
                          widget.mapController.move(LatLng(v.lat, v.lng), 16.5);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF800020).withOpacity(0.3)),
                            boxShadow: const [
                              BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2)),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              CircleAvatar(
                                radius: 4,
                                backgroundColor: isFull ? Colors.red : const Color(0xFF007A37),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                v.routeCode,
                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black87),
                              ),
                              const SizedBox(width: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF800020).withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  v.plateNumber,
                                  style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF800020)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ],
          ),

          // 2. Floating Search Bar Header (Pickup & Destination)
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.grey.shade200),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Pickup Stop Field
                    GestureDetector(
                      onTap: _showPickupSearch,
                      child: Row(
                        children: [
                          const CircleAvatar(
                            radius: 10,
                            backgroundColor: Color(0xFF0288D1),
                            child: Icon(Icons.circle, size: 6, color: Colors.white),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              widget.pickupName,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const Icon(Icons.search_rounded, size: 18, color: Colors.grey),
                        ],
                      ),
                    ),
                    const Divider(height: 16),
                    // Destination Field
                    GestureDetector(
                      onTap: _showDestinationSearch,
                      child: Row(
                        children: [
                          const CircleAvatar(
                            radius: 10,
                            backgroundColor: Color(0xFF800020),
                            child: Icon(Icons.flag_rounded, size: 10, color: Colors.white),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              widget.destinationName ?? 'Where are you heading? (Tap to search)',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: widget.destinationName != null ? Colors.black87 : Colors.grey.shade500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (widget.destinationName != null)
                            GestureDetector(
                              onTap: widget.onClearDestination,
                              child: const Icon(Icons.close_rounded, size: 18, color: Colors.grey),
                            )
                          else
                            const Icon(Icons.search_rounded, size: 18, color: Colors.grey),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 3. Floating Map Controls (Right Side)
          Positioned(
            right: 16,
            bottom: _isDrawerExpanded ? 240 : 100,
            child: Column(
              children: [
                FloatingActionButton.small(
                  heroTag: 'recenter',
                  onPressed: _recenterOnPickup,
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF0288D1),
                  child: const Icon(Icons.my_location_rounded),
                ),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [
                      BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2)),
                    ],
                  ),
                  child: Column(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.add_rounded, size: 20),
                        onPressed: _zoomIn,
                      ),
                      const Divider(height: 1),
                      IconButton(
                        icon: const Icon(Icons.remove_rounded, size: 20),
                        onPressed: _zoomOut,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 4. Draggable / Collapsible Bottom Sheet Drawer
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: [
                  BoxShadow(color: Colors.black12, blurRadius: 16, offset: Offset(0, -4)),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Centered Drag Pill
                  GestureDetector(
                    onTap: () => setState(() => _isDrawerExpanded = !_isDrawerExpanded),
                    child: Container(
                      width: 40,
                      height: 5,
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),

                  // Header Row: Live Jeepneys + En Route Count
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'Live Jeepneys',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF800020),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                const CircleAvatar(radius: 3, backgroundColor: Colors.white),
                                const SizedBox(width: 5),
                                Text(
                                  '${matches.length} EN ROUTE',
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (matches.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.grey.shade300),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.access_time_rounded, size: 12, color: Color(0xFF800020)),
                              const SizedBox(width: 4),
                              Text(
                                '~${matches.first.etaMinutes} min',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF800020)),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),

                  if (_isDrawerExpanded) ...[
                    const SizedBox(height: 12),

                    // "I Am Waiting" Quick Action Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: widget.onNavigateToWaiting,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF800020),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 2,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Row(
                              children: [
                                CircleAvatar(
                                  radius: 14,
                                  backgroundColor: Colors.white24,
                                  child: Icon(Icons.sensors_rounded, color: Colors.white, size: 16),
                                ),
                                SizedBox(width: 10),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('I Am Waiting', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                    Text('Signal approaching drivers on this corridor', style: TextStyle(color: Colors.white70, fontSize: 10)),
                                  ],
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white24,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Row(
                                children: [
                                  Text('View Feed', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  Icon(Icons.chevron_right, size: 14),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 10),

                    // Live Jeepney Cards List
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 180),
                      child: matches.isEmpty
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 20),
                                child: Text(
                                  'No jeeps along this corridor right now.',
                                  style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                                ),
                              ),
                            )
                          : ListView.builder(
                              shrinkWrap: true,
                              itemCount: matches.length,
                              itemBuilder: (context, index) {
                                final m = matches[index];
                                return JeepneyCard(
                                  vehicle: m.vehicle,
                                  etaMinutes: m.etaMinutes,
                                  distanceKm: m.distanceToPickupKm,
                                  onTrackOnMap: () {
                                    widget.mapController.move(LatLng(m.vehicle.lat, m.vehicle.lng), 16.5);
                                  },
                                );
                              },
                            ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/vehicle_telemetry.dart';
import '../services/firebase_stream_service.dart';
import 'live_commuter_map_screen.dart';
import 'waiting_screen.dart';
import 'forecast_screen.dart';
import 'operator_dashboard_screen.dart';
import 'profile_screen.dart';
import '../widgets/fare_calculator_dialog.dart';
import '../widgets/settings_help_dialog.dart';

class MainNavigationShell extends StatefulWidget {
  final String userName;
  final String userEmail;
  final VoidCallback onLogout;

  const MainNavigationShell({
    super.key,
    required this.userName,
    required this.userEmail,
    required this.onLogout,
  });

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentTabIndex = 0;
  final FirebaseVehicleStreamService _streamService = FirebaseVehicleStreamService();
  final MapController _mapController = MapController();

  // Commuter Pickup & Destination State (Snaps to Commonwealth/Philcoa by default)
  LatLng _pickupLocation = const LatLng(14.6538, 121.0505);
  String _pickupName = 'Philcoa / PCA Transit Hub';
  LatLng? _destinationLocation;
  String? _destinationName;

  @override
  void dispose() {
    _streamService.dispose();
    super.dispose();
  }

  void _onSelectDrawerItem(int tabIndex) {
    Navigator.of(context).pop(); // Close drawer
    setState(() => _currentTabIndex = tabIndex);
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<VehicleTelemetry>>(
      stream: _streamService.streamActiveFleet(),
      builder: (context, snapshot) {
        final fleet = snapshot.data ?? [];

        final screens = [
          // 0: Live Commuter Map
          LiveCommuterMapScreen(
            fleet: fleet,
            pickupLocation: _pickupLocation,
            pickupName: _pickupName,
            destinationLocation: _destinationLocation,
            destinationName: _destinationName,
            mapController: _mapController,
            onUpdatePickup: (point, name) {
              setState(() {
                _pickupLocation = point;
                _pickupName = name;
              });
            },
            onUpdateDestination: (point, name) {
              setState(() {
                _destinationLocation = point;
                _destinationName = name;
              });
            },
            onClearDestination: () {
              setState(() {
                _destinationLocation = null;
                _destinationName = null;
              });
            },
            onNavigateToWaiting: () => setState(() => _currentTabIndex = 1),
          ),

          // 1: "I Am Waiting" Broadcast
          WaitingScreen(
            pickupLocation: _pickupLocation,
            pickupName: _pickupName,
            destinationLocation: _destinationLocation,
            destinationName: _destinationName,
            fleet: fleet,
            onChangeStop: () => setState(() => _currentTabIndex = 0),
            onTrackVehicle: (coord) {
              setState(() => _currentTabIndex = 0);
              _mapController.move(coord, 16.5);
            },
          ),

          // 2: Passenger Load Forecast
          const ForecastScreen(),

          // 3: Fleet Operator & IoT Edge Radar
          OperatorDashboardScreen(fleet: fleet),

          // 4: Commuter Profile & Settings
          ProfileScreen(
            userName: widget.userName,
            userEmail: widget.userEmail,
            onLogout: widget.onLogout,
          ),
        ];

        return Scaffold(
          drawer: Drawer(
            child: Column(
              children: [
                // Drawer Profile Header
                UserAccountsDrawerHeader(
                  decoration: const BoxDecoration(
                    color: Color(0xFF800020),
                  ),
                  accountName: Text(
                    widget.userName,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  accountEmail: Text(
                    widget.userEmail,
                    style: const TextStyle(fontSize: 12, color: Colors.white70),
                  ),
                  currentAccountPicture: CircleAvatar(
                    backgroundColor: Colors.white,
                    child: Text(
                      widget.userName.isNotEmpty ? widget.userName[0].toUpperCase() : 'C',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF800020)),
                    ),
                  ),
                ),

                // Navigation Items
                ListTile(
                  leading: const Icon(Icons.home_rounded, color: Color(0xFF800020)),
                  title: const Text('Live Map & Tracking', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  selected: _currentTabIndex == 0,
                  onTap: () => _onSelectDrawerItem(0),
                ),
                ListTile(
                  leading: const Icon(Icons.sensors_rounded, color: Color(0xFF800020)),
                  title: const Text('I Am Waiting (Broadcast)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  selected: _currentTabIndex == 1,
                  onTap: () => _onSelectDrawerItem(1),
                ),
                ListTile(
                  leading: const Icon(Icons.trending_up_rounded, color: Color(0xFF800020)),
                  title: const Text('Passenger Load Forecast', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  selected: _currentTabIndex == 2,
                  onTap: () => _onSelectDrawerItem(2),
                ),
                ListTile(
                  leading: const Icon(Icons.dashboard_rounded, color: Color(0xFF1E293B)),
                  title: const Text('Fleet Operator Dispatch', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  selected: _currentTabIndex == 3,
                  onTap: () => _onSelectDrawerItem(3),
                ),

                const Divider(),

                ListTile(
                  leading: const Icon(Icons.payments_rounded, color: Color(0xFF007A37)),
                  title: const Text('LTFRB Fare Calculator', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  onTap: () {
                    Navigator.of(context).pop();
                    showDialog(
                      context: context,
                      builder: (_) => const FareCalculatorDialog(),
                    );
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.settings_rounded, color: Color(0xFF0288D1)),
                  title: const Text('Commuter Settings', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  onTap: () {
                    Navigator.of(context).pop();
                    showDialog(
                      context: context,
                      builder: (_) => const SettingsDialog(),
                    );
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.help_outline_rounded, color: Colors.grey),
                  title: const Text('Help & Support', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  onTap: () {
                    Navigator.of(context).pop();
                    showDialog(
                      context: context,
                      builder: (_) => const HelpSupportDialog(),
                    );
                  },
                ),

                const Spacer(),
                const Divider(),

                ListTile(
                  leading: const Icon(Icons.logout_rounded, color: Color(0xFF800020)),
                  title: const Text('Log Out', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF800020))),
                  onTap: () {
                    Navigator.of(context).pop();
                    widget.onLogout();
                  },
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
          body: IndexedStack(
            index: _currentTabIndex,
            children: screens,
          ),
          bottomNavigationBar: BottomNavigationBar(
            currentIndex: _currentTabIndex,
            onTap: (index) => setState(() => _currentTabIndex = index),
            type: BottomNavigationBarType.fixed,
            selectedItemColor: const Color(0xFF800020),
            unselectedItemColor: Colors.grey.shade400,
            selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
            unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
            elevation: 8,
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.home_rounded),
                label: 'Home',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.sensors_rounded),
                label: 'Waiting',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.trending_up_rounded),
                label: 'Forecast',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.dashboard_rounded),
                label: 'Dispatch',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person_rounded),
                label: 'Profile',
              ),
            ],
          ),
        );
      },
    );
  }
}

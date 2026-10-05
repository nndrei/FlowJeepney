import 'package:latlong2/latlong.dart';

class ModernJeepneyRoute {
  final String id;
  final String routeCode;
  final String name;
  final String origin;
  final String destination;
  final double fareBase;
  final List<LatLng> path;

  const ModernJeepneyRoute({
    required this.id,
    required this.routeCode,
    required this.name,
    required this.origin,
    required this.destination,
    required this.fareBase,
    required this.path,
  });

  static final List<ModernJeepneyRoute> defaultRoutes = [
    ModernJeepneyRoute(
      id: 'route-10',
      routeCode: 'Route 10',
      name: 'Fairview - Buendia via Quezon Ave & España',
      origin: 'SM City Fairview / Litex',
      destination: 'Gil Puyat (Buendia) LRT / Taft',
      fareBase: 15.0,
      path: const [
        LatLng(14.7120, 121.0920),
        LatLng(14.6980, 121.0850),
        LatLng(14.6850, 121.0775),
        LatLng(14.6710, 121.0690),
        LatLng(14.6610, 121.0585),
        LatLng(14.6538, 121.0505), // Philcoa
        LatLng(14.6515, 121.0494), // Elliptical Rd
        LatLng(14.6535, 121.0435), // Quezon Ave exit
        LatLng(14.6425, 121.0378), // EDSA - Quezon Ave
        LatLng(14.6375, 121.0285), // Timog
        LatLng(14.6318, 121.0195), // Fisher Mall
        LatLng(14.6247, 121.0102), // Banawe
        LatLng(14.6195, 121.0028), // Welcome Rotonda
        LatLng(14.6165, 121.0005), // Blumentritt
        LatLng(14.6100, 120.9940), // España / UST
        LatLng(14.6042, 120.9880), // Lerma
        LatLng(14.5995, 120.9842), // Quiapo
        LatLng(14.5888, 120.9818), // Manila City Hall
        LatLng(14.5768, 120.9892), // Pedro Gil
        LatLng(14.5635, 120.9945), // Vito Cruz
        LatLng(14.5542, 120.9972), // Buendia
      ],
    ),
    ModernJeepneyRoute(
      id: 'route-06',
      routeCode: 'Route 6',
      name: 'Commonwealth - Quiapo via Philcoa & España',
      origin: 'Litex / Batasan Commonwealth',
      destination: 'Quiapo (Plaza Miranda)',
      fareBase: 15.0,
      path: const [
        LatLng(14.6980, 121.0850),
        LatLng(14.6710, 121.0690),
        LatLng(14.6538, 121.0505), // Philcoa
        LatLng(14.6515, 121.0494), // Elliptical Rd
        LatLng(14.6535, 121.0435), // Quezon Ave
        LatLng(14.6375, 121.0285), // Timog
        LatLng(14.6195, 121.0028), // Welcome Rotonda
        LatLng(14.6100, 120.9940), // UST España
        LatLng(14.6042, 120.9880), // Lerma
        LatLng(14.5995, 120.9842), // Quiapo
      ],
    ),
    ModernJeepneyRoute(
      id: 'route-03',
      routeCode: 'Route 3',
      name: 'Visayas Ave - Manila City Hall via Quezon Ave',
      origin: 'Tandang Sora / Visayas Ave',
      destination: 'Manila City Hall / Kartilya',
      fareBase: 15.0,
      path: const [
        LatLng(14.6710, 121.0468),
        LatLng(14.6620, 121.0475),
        LatLng(14.6540, 121.0480), // Elliptical Rd
        LatLng(14.6535, 121.0435), // Quezon Ave
        LatLng(14.6425, 121.0378), // EDSA
        LatLng(14.6318, 121.0195), // Fisher Mall
        LatLng(14.6195, 121.0028), // Welcome Rotonda
        LatLng(14.6100, 120.9940), // UST
        LatLng(14.5995, 120.9842), // Quiapo
        LatLng(14.5888, 120.9818), // Manila City Hall
      ],
    ),
    ModernJeepneyRoute(
      id: 'route-15',
      routeCode: 'Route 15',
      name: 'SM North / North Ave - Philcoa / Commonwealth',
      origin: 'SM North EDSA / TriNoma',
      destination: 'Philcoa / UP Diliman',
      fareBase: 15.0,
      path: const [
        LatLng(14.6520, 121.0330), // SM North
        LatLng(14.6530, 121.0390), // Agham
        LatLng(14.6558, 121.0460), // Elliptical Rd
        LatLng(14.6515, 121.0494), // QC Circle
        LatLng(14.6538, 121.0505), // Philcoa
        LatLng(14.6610, 121.0585), // UP Diliman
      ],
    ),
  ];
}

import 'package:latlong2/latlong.dart';

class TransitPlace {
  final String name;
  final String fullAddress;
  final LatLng location;
  final List<String> aliases;

  const TransitPlace({
    required this.name,
    required this.fullAddress,
    required this.location,
    this.aliases = const [],
  });

  static const List<TransitPlace> defaultTransitPlaces = [
    TransitPlace(
      name: 'SM City North EDSA',
      fullAddress: 'Misamis St, EDSA, Santo Cristo, Bago Bantay, Quezon City',
      location: LatLng(14.65625, 121.02914),
      aliases: ['sm north', 'sm north edsa', 'sm', 'north edsa', 'sm city', 'sm annex', 'sm mall'],
    ),
    TransitPlace(
      name: 'TriNoma Mall',
      fullAddress: 'North Avenue cor. EDSA, Bagong Pag-asa, Quezon City',
      location: LatLng(14.6533, 121.0335),
      aliases: ['trinoma', 'ayala trinoma', 'north ave mall', 'trinoma landmark'],
    ),
    TransitPlace(
      name: 'MRT-3 North Avenue Station',
      fullAddress: 'EDSA cor. North Ave, Diliman, Quezon City',
      location: LatLng(14.6521, 121.0323),
      aliases: ['mrt north', 'north ave station', 'mrt-3 north', 'mrt'],
    ),
    TransitPlace(
      name: 'Quezon Memorial Circle (QC Circle)',
      fullAddress: 'Elliptical Road, Diliman, Quezon City',
      location: LatLng(14.6515, 121.0494),
      aliases: ['qc circle', 'quezon circle', 'elliptical road', 'circle', 'qc hall'],
    ),
    TransitPlace(
      name: 'Philcoa / PCA Transit Hub',
      fullAddress: 'Commonwealth Avenue, Diliman, Quezon City',
      location: LatLng(14.6539, 121.0538),
      aliases: ['philcoa', 'pca', 'commonwealth philcoa', 'up jeep terminal', 'philcoa overpass'],
    ),
    TransitPlace(
      name: 'UP Diliman (University Avenue)',
      fullAddress: 'University Avenue, UP Campus, Diliman, Quezon City',
      location: LatLng(14.6538, 121.0685),
      aliases: ['up diliman', 'up', 'university of the philippines', 'sunken garden', 'up campus'],
    ),
    TransitPlace(
      name: 'Tandang Sora (Commonwealth Ave)',
      fullAddress: 'Commonwealth Ave cor. Tandang Sora Ave, Quezon City',
      location: LatLng(14.6710, 121.0690),
      aliases: ['tandang sora', 'ts', 'commonwealth tandang sora', 'tandang sora flyover'],
    ),
    TransitPlace(
      name: 'Don Antonio / Ever Gotesco Commonwealth',
      fullAddress: 'Commonwealth Ave, Batasan Hills, Quezon City',
      location: LatLng(14.6850, 121.0775),
      aliases: ['don antonio', 'ever gotesco', 'ever commonwealth', 'don antonio station'],
    ),
    TransitPlace(
      name: 'Batasan Pambansa / Batasan Road',
      fullAddress: 'Commonwealth Ave cor. Batasan Road, Quezon City',
      location: LatLng(14.6980, 121.0850),
      aliases: ['batasan', 'batasan pambansa', 'congress', 'batasan road', 'litex'],
    ),
    TransitPlace(
      name: 'Fairview Center Mall (FCM)',
      fullAddress: 'Commonwealth Ave, Fairview, Quezon City',
      location: LatLng(14.7065, 121.0715),
      aliases: ['fcm', 'fairview center mall', 'fairview', 'commonwealth fairview'],
    ),
    TransitPlace(
      name: 'SM City Fairview / Fairview Terraces',
      fullAddress: 'Quirino Highway cor. Regalado Ave, Novaliches, Quezon City',
      location: LatLng(14.7335, 121.0585),
      aliases: ['sm fairview', 'fairview terraces', 'robinsons novaliches', 'sm fv'],
    ),
    TransitPlace(
      name: 'MRT-3 Quezon Avenue Station',
      fullAddress: 'EDSA cor. Quezon Ave, Diliman, Quezon City',
      location: LatLng(14.6425, 121.0378),
      aliases: ['mrt q ave', 'quezon ave station', 'mrt quezon ave', 'centris', 'eton centris'],
    ),
    TransitPlace(
      name: 'Fisher Mall Quezon Avenue',
      fullAddress: 'Quezon Ave cor. Roosevelt Ave (FPJ Ave), Quezon City',
      location: LatLng(14.6318, 121.0195),
      aliases: ['fisher mall', 'fishermall', 'roosevelt', 'fpj ave', 'pantranco'],
    ),
    TransitPlace(
      name: 'Welcome Rotonda',
      fullAddress: 'Quezon Ave / España Blvd, Quezon City - Manila border',
      location: LatLng(14.6195, 121.0028),
      aliases: ['welcome rotonda', 'rotonda', 'welcome', 'espana rotonda', 'sun residences'],
    ),
    TransitPlace(
      name: 'University of Santo Tomas (UST)',
      fullAddress: 'España Boulevard, Sampaloc, Manila',
      location: LatLng(14.6098, 120.9895),
      aliases: ['ust', 'espana', 'university of santo tomas', 'lacson', 'noval', 'dapitan'],
    ),
    TransitPlace(
      name: 'FEU / Morayta (Nicanor Reyes St)',
      fullAddress: 'España Blvd cor. Nicanor Reyes St, Sampaloc, Manila',
      location: LatLng(14.6045, 120.9882),
      aliases: ['feu', 'morayta', 'nicanor reyes', 'lerma', 'university belt', 'ubelt'],
    ),
    TransitPlace(
      name: 'Quiapo Church / Plaza Miranda',
      fullAddress: 'Quezon Blvd, Quiapo, Manila',
      location: LatLng(14.5988, 120.9832),
      aliases: ['quiapo', 'quiapo church', 'plaza miranda', 'quiapo bridge', 'carriedo'],
    ),
    TransitPlace(
      name: 'Manila City Hall',
      fullAddress: 'Padre Burgos Ave, Ermita, Manila',
      location: LatLng(14.5888, 120.9818),
      aliases: ['manila city hall', 'city hall', 'sm manila', 'padre burgos'],
    ),
    TransitPlace(
      name: 'Gil Puyat / LRT Buendia',
      fullAddress: 'Taft Ave cor. Gil Puyat Ave, Pasay',
      location: LatLng(14.5542, 120.9972),
      aliases: ['buendia', 'gil puyat', 'lrt buendia', 'buendia bus terminal', 'pasay'],
    ),
    TransitPlace(
      name: 'Araneta City / Cubao (Gateway Mall)',
      fullAddress: 'EDSA cor. Aurora Blvd, Cubao, Quezon City',
      location: LatLng(14.6210, 121.0530),
      aliases: ['cubao', 'araneta center', 'araneta city', 'gateway mall', 'farmers plaza'],
    ),
  ];
}

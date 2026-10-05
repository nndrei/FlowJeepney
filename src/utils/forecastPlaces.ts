import { ForecastPlace } from '../types/forecast';
import { projectToNearestCorridor } from './jeepneyCorridors';

export const FORECAST_PLACES: ForecastPlace[] = [
  {
    id: 'quezon-ave',
    name: 'Quezon Avenue Corridor',
    shortName: 'Quezon Ave',
    corridor: 'Quezon Ave – Commonwealth',
    category: 'Corridor',
    description: 'Welcome Rotonda to QC Circle via Fisher Mall, EDSA, & Timog Ave',
    coords: { lat: 14.6375, lng: 121.0285 },
    morningDirection: 'Inbound towards España & Manila City Hall',
    eveningDirection: 'Outbound towards Elliptical Rd & Commonwealth',
    peakOccupancyProfile: {
      Monday: 95,
      Tuesday: 86,
      Wednesday: 89,
      Thursday: 87,
      Friday: 98,
      Saturday: 76,
      Sunday: 54,
    },
  },
  {
    id: 'commonwealth-ave',
    name: 'Commonwealth Avenue Corridor',
    shortName: 'Commonwealth',
    corridor: 'Commonwealth Mega-Corridor',
    category: 'Corridor',
    description: 'Philcoa to Litex, Batasan, & SM City Fairview',
    coords: { lat: 14.671, lng: 121.069 },
    morningDirection: 'Southbound to Philcoa, QC Circle & Manila',
    eveningDirection: 'Northbound towards Litex & SM Fairview',
    peakOccupancyProfile: {
      Monday: 98,
      Tuesday: 92,
      Wednesday: 93,
      Thursday: 91,
      Friday: 99,
      Saturday: 82,
      Sunday: 58,
    },
  },
  {
    id: 'philcoa-hub',
    name: 'Philcoa Transit Hub',
    shortName: 'Philcoa Hub',
    corridor: 'QC Circle Junction',
    category: 'Transit Hub',
    description: 'Primary interchange connecting UP Diliman, Commonwealth, & Quezon Ave',
    coords: { lat: 14.6538, lng: 121.0505 },
    morningDirection: 'Transfers to Buendia / Manila / MRT-3',
    eveningDirection: 'Transfers to Litex / San Mateo / Fairview',
    peakOccupancyProfile: {
      Monday: 96,
      Tuesday: 88,
      Wednesday: 91,
      Thursday: 89,
      Friday: 97,
      Saturday: 79,
      Sunday: 56,
    },
  },
  {
    id: 'sm-north-trinoma',
    name: 'SM North EDSA / TriNoma Terminal',
    shortName: 'SM North / TriNoma',
    corridor: 'North Avenue Transit Center',
    category: 'Terminal',
    description: 'Major multimodal terminus connecting MRT-3, EDSA Carousel, & North jeeps',
    coords: { lat: 14.652, lng: 121.033 },
    morningDirection: 'Dispersal to UP, QC Circle, & Timog',
    eveningDirection: 'Terminal queues towards Fairview & Novaliches',
    peakOccupancyProfile: {
      Monday: 92,
      Tuesday: 85,
      Wednesday: 88,
      Thursday: 88,
      Friday: 96,
      Saturday: 90,
      Sunday: 78,
    },
  },
  {
    id: 'espana-ust',
    name: 'España Boulevard / UST Hub',
    shortName: 'España / UST',
    corridor: 'University Belt Corridor',
    category: 'Campus / School',
    description: 'High-density university corridor from Welcome Rotonda to Lerma & Quiapo',
    coords: { lat: 14.61, lng: 120.994 },
    morningDirection: 'Arrivals to UST, FEU, & Manila campuses',
    eveningDirection: 'Student homeward rush towards QC & Fairview',
    peakOccupancyProfile: {
      Monday: 94,
      Tuesday: 90,
      Wednesday: 92,
      Thursday: 91,
      Friday: 97,
      Saturday: 68,
      Sunday: 45,
    },
  },
  {
    id: 'up-diliman',
    name: 'UP Diliman Campus Loop',
    shortName: 'UP Diliman',
    corridor: 'Academic Oval – Katipunan',
    category: 'Campus / School',
    description: 'Campus perimeter and internal loop from Philcoa, Vinzons to Katipunan',
    coords: { lat: 14.654, lng: 121.065 },
    morningDirection: 'Inbound class arrivals from Philcoa & Katipunan',
    eveningDirection: 'Outbound to Philcoa & Commonwealth stations',
    peakOccupancyProfile: {
      Monday: 91,
      Tuesday: 87,
      Wednesday: 88,
      Thursday: 86,
      Friday: 93,
      Saturday: 55,
      Sunday: 40,
    },
  },
  {
    id: 'quiapo-manila',
    name: 'Quiapo / Manila City Hall',
    shortName: 'Quiapo Hub',
    corridor: 'Manila Downtown Terminus',
    category: 'Commercial',
    description: 'Plaza Miranda, Quezon Blvd, & Lawton commercial departure hub',
    coords: { lat: 14.5995, lng: 120.9842 },
    morningDirection: 'Terminus drop-offs for Manila business center',
    eveningDirection: 'Extreme homeward loading queues heading north',
    peakOccupancyProfile: {
      Monday: 97,
      Tuesday: 91,
      Wednesday: 94,
      Thursday: 93,
      Friday: 99,
      Saturday: 84,
      Sunday: 62,
    },
  },
  {
    id: 'cubao-aurora',
    name: 'Cubao - Aurora Boulevard Hub',
    shortName: 'Cubao Hub',
    corridor: 'Aurora Blvd Transit Line',
    category: 'Transit Hub',
    description: 'Eastern transport interchange connecting Gateway Mall, MRT-3, & LRT-2',
    coords: { lat: 14.62, lng: 121.052 },
    morningDirection: 'Feeder into EDSA & Quezon City financial hubs',
    eveningDirection: 'Dispersal towards Marikina, Rizal, & Katipunan',
    peakOccupancyProfile: {
      Monday: 94,
      Tuesday: 88,
      Wednesday: 90,
      Thursday: 89,
      Friday: 98,
      Saturday: 86,
      Sunday: 65,
    },
  },
  {
    id: 'monumento-caloocan',
    name: 'Monumento Transit Hub (CAMANAVA)',
    shortName: 'Monumento Hub',
    corridor: 'MacArthur Hwy – Samson Rd',
    category: 'Transit Hub',
    description: 'Northern gateway connecting Caloocan, Malabon, Navotas, & Valenzuela to EDSA & LRT-1',
    coords: { lat: 14.6575, lng: 120.9835 },
    morningDirection: 'Southbound to Manila, Avenida & EDSA',
    eveningDirection: 'Northbound to Malabon, Valenzuela & Bulacan',
    peakOccupancyProfile: {
      Monday: 96,
      Tuesday: 89,
      Wednesday: 91,
      Thursday: 90,
      Friday: 98,
      Saturday: 85,
      Sunday: 62,
    },
  },
  {
    id: 'one-ayala-makati',
    name: 'One Ayala / Buendia Terminal (Makati)',
    shortName: 'One Ayala / Makati',
    corridor: 'EDSA – Ayala Avenue',
    category: 'Terminal',
    description: 'Central business district multimodal interchange connecting MRT-3, EDSA Carousel, & South jeeps',
    coords: { lat: 14.5505, lng: 121.0265 },
    morningDirection: 'Dispersal across Makati CBD and BGC',
    eveningDirection: 'Homeward queues towards Pasay, Taguig, & South Metro',
    peakOccupancyProfile: {
      Monday: 98,
      Tuesday: 92,
      Wednesday: 94,
      Thursday: 93,
      Friday: 99,
      Saturday: 80,
      Sunday: 52,
    },
  },
  {
    id: 'alabang-starmall',
    name: 'Alabang South Station / Starmall Terminal',
    shortName: 'Alabang Terminal',
    corridor: 'Alabang-Zapote Rd – SLEX',
    category: 'Terminal',
    description: 'Premier southern hub connecting Muntinlupa, Las Piñas, Parañaque, & Cavite/Laguna routes',
    coords: { lat: 14.419, lng: 121.044 },
    morningDirection: 'Northbound towards Makati, Pasay, & Manila',
    eveningDirection: 'Dispersal to Las Piñas, Bayanan, & Laguna',
    peakOccupancyProfile: {
      Monday: 97,
      Tuesday: 90,
      Wednesday: 92,
      Thursday: 91,
      Friday: 99,
      Saturday: 84,
      Sunday: 60,
    },
  },
  {
    id: 'sucat-paranaque',
    name: 'Dr. A. Santos / Sucat Interchange (Parañaque)',
    shortName: 'Sucat Interchange',
    corridor: 'Dr. A. Santos Avenue (Sucat Rd)',
    category: 'Corridor',
    description: 'Key Parañaque artery connecting Coastal Road, Kabihasnan, BF Homes, & SLEX',
    coords: { lat: 14.473, lng: 121.046 },
    morningDirection: 'Inbound to SLEX, Baclaran, & Pasay',
    eveningDirection: 'Outbound to BF Homes & Kabihasnan',
    peakOccupancyProfile: {
      Monday: 93,
      Tuesday: 87,
      Wednesday: 89,
      Thursday: 88,
      Friday: 96,
      Saturday: 78,
      Sunday: 55,
    },
  },
  {
    id: 'las-pinas-southmall',
    name: 'SM Southmall / Las Piñas Hub',
    shortName: 'SM Southmall',
    corridor: 'Alabang-Zapote Road',
    category: 'Commercial',
    description: 'Central Las Piñas transit node along Alabang-Zapote Road serving Talon and Almanza',
    coords: { lat: 14.442, lng: 121.009 },
    morningDirection: 'Eastbound to Alabang & Westbound to Zapote',
    eveningDirection: 'High commuter turnover at commercial bay',
    peakOccupancyProfile: {
      Monday: 92,
      Tuesday: 86,
      Wednesday: 88,
      Thursday: 87,
      Friday: 95,
      Saturday: 88,
      Sunday: 70,
    },
  },
  {
    id: 'pasay-rotonda-moa',
    name: 'Pasay Rotonda / SM Mall of Asia',
    shortName: 'Pasay Rotonda / MOA',
    corridor: 'EDSA – Taft Avenue Junction',
    category: 'Transit Hub',
    description: 'Major South-West transit crossroad connecting LRT-1, MRT-3, and Macapagal Blvd bays',
    coords: { lat: 14.5375, lng: 121.0005 },
    morningDirection: 'Dispersal to Manila, Makati, & Reclamation area',
    eveningDirection: 'Heavy queues towards Cavite, Parañaque, & Las Piñas',
    peakOccupancyProfile: {
      Monday: 97,
      Tuesday: 91,
      Wednesday: 93,
      Thursday: 92,
      Friday: 99,
      Saturday: 89,
      Sunday: 75,
    },
  },
  {
    id: 'bgc-market-market',
    name: 'Market! Market! Terminal (BGC Taguig)',
    shortName: 'BGC Market! Market!',
    corridor: 'C-5 – 26th Street Corridor',
    category: 'Terminal',
    description: 'Taguig multimodal gateway connecting BGC buses, C-5 jeepneys, & Pasig-Pateros routes',
    coords: { lat: 14.55, lng: 121.0545 },
    morningDirection: 'Worker arrivals into Bonifacio Global City',
    eveningDirection: 'Homeward dispersal towards Pasig, Pateros, & Taguig',
    peakOccupancyProfile: {
      Monday: 96,
      Tuesday: 90,
      Wednesday: 92,
      Thursday: 91,
      Friday: 98,
      Saturday: 82,
      Sunday: 58,
    },
  },
  {
    id: 'ortigas-center-hub',
    name: 'Ortigas Center / Robinsons Galleria Interchange',
    shortName: 'Ortigas Center',
    corridor: 'Ortigas Avenue – EDSA',
    category: 'Commercial',
    description: 'Inter-city junction connecting Mandaluyong, Pasig, San Juan, and Quezon City business districts',
    coords: { lat: 14.593, lng: 121.0585 },
    morningDirection: 'Inbound into Ortigas business district',
    eveningDirection: 'Outbound to Pasig, Cainta, & Rizal',
    peakOccupancyProfile: {
      Monday: 95,
      Tuesday: 88,
      Wednesday: 90,
      Thursday: 89,
      Friday: 97,
      Saturday: 80,
      Sunday: 55,
    },
  },
  {
    id: 'marikina-riverbanks',
    name: 'Marikina Riverbanks / Sports Center Hub',
    shortName: 'Marikina Hub',
    corridor: 'Marcos Hwy – Sumulong Hwy',
    category: 'Transit Hub',
    description: 'Eastern valley gateway connecting Marikina, San Mateo, Antipolo, & QC',
    coords: { lat: 14.631, lng: 121.087 },
    morningDirection: 'Westbound to Katipunan, Cubao, & Manila',
    eveningDirection: 'Eastbound to Marikina Heights & Rizal',
    peakOccupancyProfile: {
      Monday: 94,
      Tuesday: 87,
      Wednesday: 89,
      Thursday: 88,
      Friday: 96,
      Saturday: 78,
      Sunday: 50,
    },
  },
];

export const DEFAULT_FORECAST_PLACE = FORECAST_PLACES[0];

/**
 * Calculates Euclidean / Haversine distance in kilometers between two geo coordinates.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest predefined FlowJeep corridor or hub for a given lat/lng.
 */
export function findNearestForecastPlace(lat: number, lng: number): ForecastPlace {
  let nearestPlace = FORECAST_PLACES[0];
  let minDistance = Infinity;

  for (const place of FORECAST_PLACES) {
    const dist = calculateDistanceKm(lat, lng, place.coords.lat, place.coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestPlace = place;
    }
  }

  return nearestPlace;
}

/**
 * Creates a dynamic ForecastPlace instance representing the user's live physical location.
 * Snaps to the authentic transit road corridor and provides passenger occupancy profile.
 */
export function createUserLocationPlace(
  coords: { lat: number; lng: number },
  pickupName?: string
): ForecastPlace {
  const nearest = findNearestForecastPlace(coords.lat, coords.lng);
  const snapped = projectToNearestCorridor(coords.lat, coords.lng);
  const distKm = calculateDistanceKm(coords.lat, coords.lng, nearest.coords.lat, nearest.coords.lng);

  const corridorName =
    snapped.isSnapped && snapped.corridorName !== 'Custom Location'
      ? snapped.corridorName
      : nearest.corridor;

  // Use authentic location or corridor name without redundant "My Location" wrapper
  const locationName =
    pickupName && !pickupName.toLowerCase().startsWith('near custom')
      ? pickupName
      : (snapped.isSnapped ? snapped.corridorName : nearest.name);

  return {
    id: 'user-current-location',
    name: locationName,
    shortName: snapped.isSnapped ? snapped.corridorName : nearest.shortName,
    corridor: corridorName,
    category: nearest.category,
    description: nearest.description,
    coords: {
      lat: coords.lat,
      lng: coords.lng,
    },
    morningDirection: nearest.morningDirection,
    eveningDirection: nearest.eveningDirection,
    peakOccupancyProfile: { ...nearest.peakOccupancyProfile },
    isUserLocation: true,
    distanceKm: distKm,
    customLabel: locationName,
  };
}

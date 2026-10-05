// Modern Jeepney Primary Corridors & Point-to-Segment Snapping

import RBush from 'rbush';
import { osmCorridorsData } from './osmCorridorsData';

export interface CorridorSegment {
  corridorId: string;
  corridorName: string;
  p1: [number, number]; // [lat, lng]
  p2: [number, number]; // [lat, lng]
}

export interface ModernJeepneyRoute {
  id: string;
  routeCode: string;
  name: string;
  origin: string;
  destination: string;
  fareBase: number;
  path: [number, number][]; // [lat, lng] array
}

export interface ModernJeepneyVehicle {
  id: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  plateNumber: string;
  model: string;
  isAircon: boolean;
  totalSeats: number;
  occupiedSeats: number;
  standingAllowed: boolean;
  speedKmh: number;
  currentCoord: [number, number];
  headingDegrees: number;
}

// 1. Single Source of Truth: Real OpenStreetMap Road Geometry for Primary Transit Corridors
export const PRIMARY_JEEPNEY_CORRIDORS: Array<{
  id: string;
  name: string;
  coords: [number, number][];
}> = osmCorridorsData as Array<{
  id: string;
  name: string;
  coords: [number, number][];
}>;

// Backward-compatible alias so deduplication is complete
export const LOCAL_VECTOR_CORRIDORS = PRIMARY_JEEPNEY_CORRIDORS;

export interface SnappedCorridorPoint {
  lat: number;
  lng: number;
  corridorName: string;
  distanceMeters: number;
  isSnapped: boolean;
}

interface CorridorSpatialItem {
  minX: number; // minLng
  minY: number; // minLat
  maxX: number; // maxLng
  maxY: number; // maxLat
  corridorId: string;
  corridorName: string;
  a: [number, number];
  b: [number, number];
}

// 2. High-Performance Spatial Indexing using RBush (Sub-millisecond R-Tree lookups)
const corridorSpatialTree = new RBush<CorridorSpatialItem>();

const spatialItems: CorridorSpatialItem[] = [];
for (const corridor of PRIMARY_JEEPNEY_CORRIDORS) {
  const coords = corridor.coords;
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    spatialItems.push({
      minX: Math.min(a[1], b[1]),
      minY: Math.min(a[0], b[0]),
      maxX: Math.max(a[1], b[1]),
      maxY: Math.max(a[0], b[0]),
      corridorId: corridor.id,
      corridorName: corridor.name,
      a,
      b,
    });
  }
}
corridorSpatialTree.load(spatialItems);

// Exact Point-to-Segment Projection Math
export function getClosestPointOnSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): [number, number] {
  const x = p[0], y = p[1];
  const x1 = a[0], y1 = a[1];
  const x2 = b[0], y2 = b[1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return [x1, y1];

  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return [x1 + t * dx, y1 + t * dy];
}

export const DEFAULT_MAX_SNAP_DISTANCE_METERS = 2500;

// Geographic bounding box for the entire National Capital Region (NCR / Metro Manila)
export const NCR_BOUNDS = {
  minLat: 14.30,
  maxLat: 14.85,
  minLng: 120.85,
  maxLng: 121.25,
};

export function isWithinNCR(lat: number, lng: number): boolean {
  return (
    lat >= NCR_BOUNDS.minLat &&
    lat <= NCR_BOUNDS.maxLat &&
    lng >= NCR_BOUNDS.minLng &&
    lng <= NCR_BOUNDS.maxLng
  );
}

/**
 * Synchronous client-side snapping to authentic OSM road geometry.
 * Works across the entire map of NCR (Metro Manila):
 * - Snaps to the nearest road/path/highway for jeeps across all 16 cities and 1 municipality.
 * - Uses an adaptive spatial query so it never stops working at any distance or perimeter within NCR.
 * - Accurately calculates orthogonal projection on the curved roadway centerline.
 */
export function projectToNearestCorridor(
  lat: number,
  lng: number,
  maxSnapDistanceMeters: number = DEFAULT_MAX_SNAP_DISTANCE_METERS
): SnappedCorridorPoint {
  const latToMeters = 111320;
  const lngToMeters = 111320 * Math.cos((lat * Math.PI) / 180);

  // Search window based on threshold or adaptive NCR perimeter
  const searchDist = Math.max(maxSnapDistanceMeters, 2000);
  const dLat = searchDist / latToMeters;
  const dLng = searchDist / Math.max(1, lngToMeters);

  let candidates = corridorSpatialTree.search({
    minX: lng - dLng,
    minY: lat - dLat,
    maxX: lng + dLng,
    maxY: lat + dLat,
  });

  // If point is within NCR or near border, ensure we always find the closest corridor
  if (candidates.length === 0) {
    if (isWithinNCR(lat, lng) || spatialItems.length > 0) {
      // Expand search box to 8km
      const wideDist = 8000;
      candidates = corridorSpatialTree.search({
        minX: lng - wideDist / Math.max(1, lngToMeters),
        minY: lat - wideDist / latToMeters,
        maxX: lng + wideDist / Math.max(1, lngToMeters),
        maxY: lat + wideDist / latToMeters,
      });

      // Fallback to all spatial items if still empty (rare edge of province)
      if (candidates.length === 0) {
        candidates = spatialItems;
      }
    }
  }

  if (candidates.length === 0) {
    return {
      lat,
      lng,
      corridorName: 'Custom Location',
      distanceMeters: Infinity,
      isSnapped: false,
    };
  }

  const p: [number, number] = [lat, lng];
  let bestDist = Infinity;
  let bestProj: [number, number] = [lat, lng];
  let bestName = 'Transit Corridor';

  for (const seg of candidates) {
    const proj = getClosestPointOnSegment(p, seg.a, seg.b);
    const distLat = (p[0] - proj[0]) * latToMeters;
    const distLng = (p[1] - proj[1]) * lngToMeters;
    const dist = Math.sqrt(distLat * distLat + distLng * distLng);

    if (dist < bestDist) {
      bestDist = dist;
      bestProj = proj;
      bestName = seg.corridorName;
    }
  }

  // Snaps everywhere within NCR, or within max distance if outside NCR
  const inNCR = isWithinNCR(lat, lng);
  const shouldSnap = inNCR || bestDist <= maxSnapDistanceMeters;

  if (shouldSnap && bestDist < 25000) {
    return {
      lat: Number(bestProj[0].toFixed(5)),
      lng: Number(bestProj[1].toFixed(5)),
      corridorName: bestName,
      distanceMeters: Math.round(bestDist),
      isSnapped: true,
    };
  }

  return {
    lat,
    lng,
    corridorName: 'Custom Location',
    distanceMeters: Math.round(bestDist),
    isSnapped: false,
  };
}

export const snapToJeepneyCorridor = projectToNearestCorridor;

// 2. Active Authorized Modern Jeepney Routes
export const MODERN_JEEPNEY_ROUTES: ModernJeepneyRoute[] = [
  {
    id: 'route-10',
    routeCode: 'Route 10',
    name: 'Fairview - Buendia via Quezon Ave & España',
    origin: 'SM City Fairview / Litex',
    destination: 'Gil Puyat (Buendia) LRT / Taft',
    fareBase: 15.0,
    path: [
      [14.7120, 121.0920],
      [14.6980, 121.0850],
      [14.6850, 121.0775],
      [14.6710, 121.0690],
      [14.6610, 121.0585],
      [14.6538, 121.0505], // Philcoa
      [14.6515, 121.0494], // Elliptical Rd
      [14.6535, 121.0435], // Quezon Ave exit
      [14.6425, 121.0378], // EDSA - Quezon Ave
      [14.6375, 121.0285], // Timog
      [14.6318, 121.0195], // Fisher Mall
      [14.6247, 121.0102], // Banawe
      [14.6195, 121.0028], // Welcome Rotonda
      [14.6165, 121.0005], // Blumentritt
      [14.6100, 120.9940], // España / UST
      [14.6042, 120.9880], // Lerma
      [14.5995, 120.9842], // Quiapo
      [14.5888, 120.9818], // Manila City Hall
      [14.5768, 120.9892], // Pedro Gil
      [14.5635, 120.9945], // Vito Cruz
      [14.5542, 120.9972], // Buendia
    ],
  },
  {
    id: 'route-06',
    routeCode: 'Route 6',
    name: 'Commonwealth - Quiapo via Philcoa & España',
    origin: 'Litex / Batasan Commonwealth',
    destination: 'Quiapo (Plaza Miranda)',
    fareBase: 15.0,
    path: [
      [14.6980, 121.0850],
      [14.6710, 121.0690],
      [14.6538, 121.0505], // Philcoa
      [14.6515, 121.0494], // Elliptical Rd
      [14.6535, 121.0435], // Quezon Ave
      [14.6375, 121.0285], // Timog
      [14.6195, 121.0028], // Welcome Rotonda
      [14.6100, 120.9940], // UST España
      [14.6042, 120.9880], // Lerma
      [14.5995, 120.9842], // Quiapo
    ],
  },
  {
    id: 'route-03',
    routeCode: 'Route 3',
    name: 'Visayas Ave - Manila City Hall via Quezon Ave',
    origin: 'Tandang Sora / Visayas Ave',
    destination: 'Manila City Hall / Kartilya',
    fareBase: 15.0,
    path: [
      [14.6710, 121.0468],
      [14.6620, 121.0475],
      [14.6540, 121.0480], // Elliptical Rd
      [14.6535, 121.0435], // Quezon Ave
      [14.6425, 121.0378], // EDSA
      [14.6318, 121.0195], // Fisher Mall
      [14.6195, 121.0028], // Welcome Rotonda
      [14.6100, 120.9940], // UST
      [14.5995, 120.9842], // Quiapo
      [14.5888, 120.9818], // Manila City Hall
    ],
  },
  {
    id: 'route-15',
    routeCode: 'Route 15',
    name: 'SM North / North Ave - Philcoa / Commonwealth',
    origin: 'SM North EDSA / TriNoma',
    destination: 'Philcoa / UP Diliman',
    fareBase: 15.0,
    path: [
      [14.6520, 121.0330], // SM North
      [14.6530, 121.0390], // Agham
      [14.6558, 121.0460], // Elliptical Rd
      [14.6515, 121.0494], // QC Circle
      [14.6538, 121.0505], // Philcoa
      [14.6610, 121.0585], // UP Diliman
    ],
  },
];

// 3. Active Modern Jeepney Fleet: Live telemetry buffer (empty by default until real units stream)
export const ACTIVE_MODERN_JEEPNEYS: ModernJeepneyVehicle[] = [];

/**
 * Checks if a route passes near a coordinate (within threshold meters)
 */
export function isCoordNearRoute(
  coord: { lat: number; lng: number },
  routePath: [number, number][],
  thresholdMeters: number = 850
): { near: boolean; nearestIndex: number; distanceMeters: number } {
  const latToMeters = 111320;
  const lngToMeters = 111320 * Math.cos((coord.lat * Math.PI) / 180);

  const px = coord.lng * lngToMeters;
  const py = coord.lat * latToMeters;

  let minDistance = Infinity;
  let nearestIdx = -1;

  for (let i = 0; i < routePath.length - 1; i++) {
    const a = routePath[i];
    const b = routePath[i + 1];

    const ax = a[1] * lngToMeters;
    const ay = a[0] * latToMeters;
    const bx = b[1] * lngToMeters;
    const by = b[0] * latToMeters;

    const dx = bx - ax;
    const dy = by - ay;
    const segLenSq = dx * dx + dy * dy;

    let t = 0;
    if (segLenSq > 0) {
      t = ((px - ax) * dx + (py - ay) * dy) / segLenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const projX = ax + t * dx;
    const projY = ay + t * dy;

    const distSq = (px - projX) * (px - projX) + (py - projY) * (py - projY);
    const dist = Math.sqrt(distSq);

    if (dist < minDistance) {
      minDistance = dist;
      nearestIdx = i;
    }
  }

  return {
    near: minDistance <= thresholdMeters,
    nearestIndex: nearestIdx,
    distanceMeters: minDistance,
  };
}

/**
 * Filters vehicles whose route traverses BOTH the pickup point and destination point in valid travel order.
 */
export function filterVehiclesForJourney(
  pickup: { lat: number; lng: number },
  destination?: { lat: number; lng: number } | null,
  activeVehicles: ModernJeepneyVehicle[] = ACTIVE_MODERN_JEEPNEYS
): Array<{
  vehicle: ModernJeepneyVehicle;
  route: ModernJeepneyRoute;
  etaMinutes: number;
  distanceToPickupKm: number;
}> {
  const results: Array<{
    vehicle: ModernJeepneyVehicle;
    route: ModernJeepneyRoute;
    etaMinutes: number;
    distanceToPickupKm: number;
  }> = [];

  for (const vehicle of activeVehicles) {
    const route = MODERN_JEEPNEY_ROUTES.find((r) => r.id === vehicle.routeId);
    if (!route) continue;

    const pickupCheck = isCoordNearRoute(pickup, route.path, 1200);
    if (!pickupCheck.near) continue;

    if (destination) {
      const destCheck = isCoordNearRoute(destination, route.path, 1200);
      if (!destCheck.near) continue;
      // Also ensure pickup is not after destination along this route direction
      if (pickupCheck.nearestIndex > destCheck.nearestIndex) {
        continue;
      }
    }

    // Calculate approximate ETA based on vehicle current position to pickup
    const latDist = (vehicle.currentCoord[0] - pickup.lat) * 111.32;
    const lngDist =
      (vehicle.currentCoord[1] - pickup.lng) *
      111.32 *
      Math.cos((pickup.lat * Math.PI) / 180);
    const distKm = Math.sqrt(latDist * latDist + lngDist * lngDist);

    // Speed ~ 22 km/h average traffic
    const travelTimeMinutes = Math.max(1, Math.round((distKm / 22) * 60));

    results.push({
      vehicle,
      route,
      etaMinutes: travelTimeMinutes,
      distanceToPickupKm: parseFloat(distKm.toFixed(1)),
    });
  }

  // Sort by earliest arrival
  results.sort((a, b) => a.etaMinutes - b.etaMinutes);
  return results;
}

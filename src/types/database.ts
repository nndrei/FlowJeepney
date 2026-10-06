/**
 * FlowJeep Firebase Realtime Database Unified Type Definitions
 * 
 * Defines the schemas for all core entities:
 * - Users & Roles
 * - Routes & Stops
 * - Jeepney Master Registry
 * - Live Telemetry (/live_telemetry)
 * - Trips & Dispatch Shifts
 * - Doorway Vision Events
 * - Waiting Commuter Pings
 * - Demand Hotspots
 * - Forecast Records
 * - System Configuration
 */

export type UserRole = 'commuter' | 'driver' | 'admin' | 'operator';

export interface UserRecord {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  cooperative?: string;
  driverId?: string;
  operatorId?: string; // backwards compatibility alias
  assignedJeepneyId?: string;
  assignedRouteId?: string;
  assignedPlate?: string;
  licenseNumber?: string;
  phone?: string;
  createdAt: number;
  lastLoginAt?: number;
}

export interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sequenceOrder: number;
  isTerminal?: boolean;
}

export interface RouteRecord {
  id: string;
  routeCode: string;
  name: string;
  origin: string;
  destination: string;
  totalDistanceKm: number;
  estimatedDurationMin: number;
  baseFare: number;
  status: 'ACTIVE' | 'INACTIVE';
  stops?: Record<string, RouteStop>;
  color?: string;
}

export type JeepneyStatus = 'IN_SERVICE' | 'OFF_DUTY' | 'MAINTENANCE';

export interface JeepneyRecord {
  id: string;
  plateNumber: string;
  cooperative: string;
  assignedRouteId: string;
  currentDriverUid?: string;
  currentDriverName?: string;
  deviceId?: string;
  model: string;
  isAircon: boolean;
  totalSeats: number;
  standingAllowed: boolean;
  status: JeepneyStatus;
  createdAt?: number;
  updatedAt?: number;
}

export interface DeviceRecord {
  deviceId: string;
  jeepneyId: string;
  firmwareVersion: string;
  esp32CamIp?: string;
  cameraStatus: 'STREAMING' | 'DISCONNECTED' | 'STANDBY';
  dualBeamStatus: 'CONNECTED' | 'DISCONNECTED';
  lastHeartbeat: number;
  wifiRssi?: number;
}

export interface LiveTelemetryRecord {
  jeepneyId: string;
  routeId: string;
  routeCode?: string;
  routeName?: string;
  plateNumber?: string;
  currentCoord: [number, number]; // [lat, lng]
  headingDegrees: number;
  speedKmh: number;
  occupiedSeats: number;
  totalSeats: number;
  capacityPct: number;
  loadCategory: 'Seats Available' | 'Near-Full' | 'Full / Standing';
  doorState?: 'OPEN' | 'CLOSED';
  activeTripId?: string;
  snappedCorridor?: string;
  nextStop?: string;
  etaNextStopSeconds?: number;
  lastUpdate: number;
  isOnline: boolean;
}

export interface TripRecord {
  tripId: string;
  jeepneyId: string;
  routeId: string;
  driverUid?: string;
  startTime: number;
  endTime?: number | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalBoarded: number;
  totalAlighted: number;
  peakOccupancy: number;
  averageSpeedKmh?: number;
}

export interface DoorwayEventRecord {
  eventId: string;
  tripId?: string;
  jeepneyId: string;
  eventType: 'BOARDING' | 'ALIGHTING' | 'CANCELLED';
  trackingId: number;
  confidence: number;
  currentOccupancy: number;
  timestamp: number;
  location?: [number, number];
}

export interface WaitingCommuterRecord {
  pingId: string;
  userId: string;
  isGuest: boolean;
  routeId: string;
  pickupCoords: {
    lat: number;
    lng: number;
  };
  destinationCoords?: {
    lat: number;
    lng: number;
  };
  pickupStopName?: string;
  destinationName?: string;
  status: 'waiting' | 'acknowledged' | 'arriving' | 'expired';
  timestamp: number;
  acknowledgedAt?: number;
  expiresAt: number;
}

export interface DemandHotspotRecord {
  id: string;
  corridorId: string;
  stopName: string;
  lat: number;
  lng: number;
  waitingCount: number;
  demandLevel: 'high' | 'medium' | 'low';
  lastUpdated: number;
}

export interface ForecastPeriodRecord {
  name: string;
  timeWindow: string;
  occupancyPercentage: number;
  passengerCount?: number;
  totalCapacity?: number;
}

export interface CorridorForecastRecord {
  corridorId: string;
  dateString: string;
  weatherCondition: string;
  temperatureC: number;
  precipitationProb: number;
  peakPercentage: number;
  recommendedWindow: string;
  periods: Record<string, ForecastPeriodRecord>;
  lastModelRun: number;
}

export interface SystemConfigRecord {
  version: string;
  activeFareMatrix: {
    baseFareFirst4km: number;
    succeedingKmRate: number;
    discountRate: number;
  };
  pingExpirationMinutes: number;
  gpsStaleThresholdSeconds: number;
}

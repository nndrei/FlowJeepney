export type OperatorScreen =
  | 'splash'
  | 'login'
  | 'dashboard'
  | 'live-tracking'
  | 'passenger-load'
  | 'demand-map'
  | 'settings';

export interface OperatorUser {
  name: string;
  email: string;
  role: 'operator';
  phone?: string;
  avatarUrl?: string;
  assignedRouteId?: string;
  assignedPlate?: string;
}

export interface OperatorRouteInfo {
  id: string;
  routeNumber: string;
  name: string;
  status: 'Full' | 'Not Full' | 'Moderate';
  activeUnitsCount: number;
  totalCapacity: number;
  currentPassengers: number;
  onTimeRate: number;
  origin: string;
  destination: string;
  color: string;
}

export interface StopCheckpoint {
  id: string;
  name: string;
  etaMinutes: number;
  isNext?: boolean;
  isPassed?: boolean;
  passengerCount: number;
  distanceKm: number;
  lat: number;
  lng: number;
}

export interface DemandHotspot {
  id: string;
  stopName: string;
  waitingCount: number;
  demandLevel: 'high' | 'medium' | 'low';
  lat: number;
  lng: number;
  lastUpdated: string;
}

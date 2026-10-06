export type UserRole = 'commuter' | 'driver' | 'admin' | 'operator';

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  isGuest?: boolean;
  driverId?: string;
  operatorId?: string; // backwards compatibility alias
  assignedJeepneyId?: string;
  assignedRouteId?: string;
  assignedPlate?: string;
  cooperative?: string;
  licenseNumber?: string;
  phone?: string;
}

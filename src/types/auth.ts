export type UserRole = 'commuter' | 'operator';

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  operatorId?: string;
  assignedRouteId?: string;
  assignedPlate?: string;
  cooperative?: string;
}

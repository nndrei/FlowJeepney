/**
 * FlowJeep User and Role Definitions
 * Step 1: Frontend role structure and separation (Commuter vs Operator)
 */

export type UserRole = 'commuter' | 'driver' | 'admin' | 'operator';

export interface FlowJeepUser {
  name: string;
  email: string;
  role: UserRole;
  assignedJeepneyId?: string;
  assignedPlate?: string;
  assignedRouteId?: string;
}

/**
 * Resolves the development role from Vite environment variables (VITE_DEV_ROLE).
 * Falls back safely to 'commuter'.
 */
export function getDevRole(): UserRole {
  const envRole = import.meta.env.VITE_DEV_ROLE;
  if (envRole === 'driver' || envRole === 'operator') {
    return 'driver';
  }
  if (envRole === 'admin') {
    return 'admin';
  }
  return 'commuter';
}

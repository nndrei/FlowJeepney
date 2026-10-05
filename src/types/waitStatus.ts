/**
 * FlowJeep "Wait" Tab Ping & Waiting State Machine Types
 */

export type WaitStatus = 'idle' | 'waiting' | 'acknowledged' | 'arriving' | 'expired';

export interface VehicleWaitPing {
  vehicleId: string;
  routeId: string;
  routeCode: string;
  plateNumber: string;
  passengerCoords: { lat: number; lng: number };
  passengerStopName?: string;
  status: WaitStatus;
  timestamp: number;
  acknowledgedAt?: number;
  arrivingAt?: number;
  expiresAt: number;
}

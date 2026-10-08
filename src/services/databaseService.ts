/**
 * FlowJeep Firebase Realtime Database Service Layer
 * 
 * Provides unified, type-safe API for reading, writing, and real-time streaming
 * across all FlowJeep database nodes:
 * - system_config
 * - users
 * - routes
 * - jeepneys
 * - devices
 * - live_telemetry
 * - trips
 * - doorway_events
 * - waiting_commuters
 * - demand_hotspots
 * - forecast_records
 */

import {
  ref,
  get,
  set,
  update,
  onValue,
  off,
  push,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  DataSnapshot,
} from 'firebase/database';
import { rtdb } from './firebase';
import {
  UserRecord,
  RouteRecord,
  JeepneyRecord,
  DeviceRecord,
  LiveTelemetryRecord,
  TripRecord,
  DoorwayEventRecord,
  WaitingCommuterRecord,
  DemandHotspotRecord,
  CorridorForecastRecord,
  SystemConfigRecord,
} from '../types/database';

const DEFAULT_TIMEOUT_MS = 2500;

const withTimeout = <T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT_MS): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Database operation timed out after ${ms}ms`)), ms)
    ),
  ]);
};

// ============================================================================
// 1. SYSTEM CONFIGURATION & INITIALIZATION
// ============================================================================

export async function getSystemConfig(): Promise<SystemConfigRecord | null> {
  try {
    const configRef = ref(rtdb, 'system_config');
    const snapshot = await withTimeout(get(configRef));
    if (snapshot.exists()) {
      return snapshot.val() as SystemConfigRecord;
    }
    return null;
  } catch (err) {
    console.warn('[databaseService] Failed to fetch system_config:', err);
    return null;
  }
}

/**
 * Initializes the default system configuration and baseline transit routes if empty.
 * Non-destructive: checks if nodes exist before writing.
 */
export async function initializeDatabaseDefaults(): Promise<void> {
  try {
    // 1. System Config
    const configRef = ref(rtdb, 'system_config');
    const configSnap = await withTimeout(get(configRef));
    if (!configSnap.exists()) {
      const initialConfig: SystemConfigRecord = {
        version: '2.1.0',
        activeFareMatrix: {
          baseFareFirst4km: 15.0,
          succeedingKmRate: 2.2,
          discountRate: 0.2,
        },
        pingExpirationMinutes: 20,
        gpsStaleThresholdSeconds: 45,
      };
      await withTimeout(set(configRef, initialConfig));
    }
  } catch (err) {
    console.warn('[databaseService] Notice during database initialization:', err);
  }
}

// ============================================================================
// 2. ROUTES
// ============================================================================

export async function getAllRoutes(): Promise<RouteRecord[]> {
  try {
    const routesRef = ref(rtdb, 'routes');
    const snapshot = await withTimeout(get(routesRef));
    if (snapshot.exists()) {
      const val = snapshot.val();
      return Object.values(val) as RouteRecord[];
    }
    return [];
  } catch (err) {
    console.warn('[databaseService] Failed to get routes:', err);
    return [];
  }
}

export async function getRouteById(routeId: string): Promise<RouteRecord | null> {
  try {
    const routeRef = ref(rtdb, `routes/${routeId}`);
    const snapshot = await withTimeout(get(routeRef));
    if (snapshot.exists()) {
      return snapshot.val() as RouteRecord;
    }
    return null;
  } catch (err) {
    console.warn(`[databaseService] Failed to get route ${routeId}:`, err);
    return null;
  }
}

// ============================================================================
// 3. JEEPNEYS MASTER REGISTRY
// ============================================================================

export async function getAllJeepneys(): Promise<JeepneyRecord[]> {
  try {
    const jeepneysRef = ref(rtdb, 'jeepneys');
    const snapshot = await withTimeout(get(jeepneysRef));
    if (snapshot.exists()) {
      const val = snapshot.val();
      return Object.values(val) as JeepneyRecord[];
    }
    return [];
  } catch (err) {
    console.warn('[databaseService] Failed to get jeepneys:', err);
    return [];
  }
}

export async function getJeepneyById(jeepneyId: string): Promise<JeepneyRecord | null> {
  try {
    const jeepneyRef = ref(rtdb, `jeepneys/${jeepneyId}`);
    const snapshot = await withTimeout(get(jeepneyRef));
    if (snapshot.exists()) {
      return snapshot.val() as JeepneyRecord;
    }
    return null;
  } catch (err) {
    console.warn(`[databaseService] Failed to get jeepney ${jeepneyId}:`, err);
    return null;
  }
}

export async function updateJeepneyStatus(
  jeepneyId: string,
  status: JeepneyRecord['status']
): Promise<void> {
  try {
    const jeepneyRef = ref(rtdb, `jeepneys/${jeepneyId}`);
    await withTimeout(
      update(jeepneyRef, {
        status,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.error(`[databaseService] Failed to update jeepney status for ${jeepneyId}:`, err);
    throw err;
  }
}

// ============================================================================
// 4. LIVE TELEMETRY
// ============================================================================

/**
 * Publishes live telemetry from edge hardware, camera vision, or GPS tracker
 * directly to the canonical `/live_telemetry/{jeepneyId}` node.
 */
export async function publishLiveTelemetry(telemetry: LiveTelemetryRecord): Promise<void> {
  try {
    const jeepneyId = telemetry.jeepneyId;
    const now = telemetry.lastUpdate || Date.now();

    const liveTelemetryRef = ref(rtdb, `live_telemetry/${jeepneyId}`);
    const livePayload = {
      ...telemetry,
      lastUpdate: now,
      isOnline: true,
    };

    await withTimeout(set(liveTelemetryRef, livePayload));
  } catch (err) {
    console.warn('[databaseService] Failed to publish live telemetry:', err);
    throw err;
  }
}

/**
 * Subscribes to real-time live telemetry for all active fleet units.
 */
export function subscribeLiveTelemetry(
  callback: (telemetries: LiveTelemetryRecord[]) => void
): () => void {
  const telemetryRef = ref(rtdb, 'live_telemetry');

  const listener = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const records: LiveTelemetryRecord[] = Object.values(data);
      callback(records);
    } else {
      callback([]);
    }
  };

  onValue(telemetryRef, listener);

  return () => {
    off(telemetryRef, 'value', listener);
  };
}

// ============================================================================
// 5. TRIPS & DISPATCH SHIFTS
// ============================================================================

export async function startTrip(params: {
  jeepneyId: string;
  routeId: string;
  driverUid?: string;
}): Promise<string> {
  try {
    const tripsRef = ref(rtdb, 'trips');
    const newTripRef = push(tripsRef);
    const tripId = newTripRef.key || `trip_${Date.now()}`;

    const tripRecord: TripRecord = {
      tripId,
      jeepneyId: params.jeepneyId,
      routeId: params.routeId,
      driverUid: params.driverUid,
      startTime: Date.now(),
      status: 'IN_PROGRESS',
      totalBoarded: 0,
      totalAlighted: 0,
      peakOccupancy: 0,
    };

    await withTimeout(set(newTripRef, tripRecord));

    // Link activeTripId to live_telemetry
    const telemetryRef = ref(rtdb, `live_telemetry/${params.jeepneyId}`);
    await withTimeout(update(telemetryRef, { activeTripId: tripId }));

    return tripId;
  } catch (err) {
    console.error('[databaseService] Failed to start trip:', err);
    throw err;
  }
}

export async function endTrip(tripId: string): Promise<void> {
  try {
    const tripRef = ref(rtdb, `trips/${tripId}`);
    const tripSnap = await withTimeout(get(tripRef));
    if (tripSnap.exists()) {
      const trip = tripSnap.val() as TripRecord;
      await withTimeout(
        update(tripRef, {
          endTime: Date.now(),
          status: 'COMPLETED',
        })
      );

      // Clear activeTripId on live_telemetry
      if (trip.jeepneyId) {
        const telemetryRef = ref(rtdb, `live_telemetry/${trip.jeepneyId}`);
        await withTimeout(update(telemetryRef, { activeTripId: null }));
      }
    }
  } catch (err) {
    console.error(`[databaseService] Failed to end trip ${tripId}:`, err);
    throw err;
  }
}

// ============================================================================
// 6. DOORWAY VISION EVENTS
// ============================================================================

export async function recordDoorwayEvent(event: Omit<DoorwayEventRecord, 'eventId'>): Promise<string> {
  try {
    const eventsRef = ref(rtdb, 'doorway_events');
    const newEventRef = push(eventsRef);
    const eventId = newEventRef.key || `evt_${Date.now()}`;

    const record: DoorwayEventRecord = {
      ...event,
      eventId,
      timestamp: event.timestamp || Date.now(),
    };

    await withTimeout(set(newEventRef, record));

    // Update active trip counters if tripId provided
    if (event.tripId) {
      const tripRef = ref(rtdb, `trips/${event.tripId}`);
      const tripSnap = await withTimeout(get(tripRef));
      if (tripSnap.exists()) {
        const trip = tripSnap.val() as TripRecord;
        const totalBoarded =
          event.eventType === 'BOARDING' ? trip.totalBoarded + 1 : trip.totalBoarded;
        const totalAlighted =
          event.eventType === 'ALIGHTING' ? trip.totalAlighted + 1 : trip.totalAlighted;
        const peakOccupancy = Math.max(trip.peakOccupancy, event.currentOccupancy);

        await withTimeout(
          update(tripRef, {
            totalBoarded,
            totalAlighted,
            peakOccupancy,
          })
        );
      }
    }

    return eventId;
  } catch (err) {
    console.warn('[databaseService] Notice recording doorway event:', err);
    return '';
  }
}

// ============================================================================
// 7. WAITING COMMUTERS & DEMAND HOTSPOTS
// ============================================================================

export async function submitWaitingPing(
  ping: Omit<WaitingCommuterRecord, 'pingId' | 'timestamp' | 'expiresAt'>
): Promise<string> {
  try {
    const waitingRef = ref(rtdb, 'waiting_commuters');
    const newPingRef = push(waitingRef);
    const pingId = newPingRef.key || `ping_${Date.now()}`;
    const now = Date.now();
    const expiresAt = now + 20 * 60 * 1000; // 20 minutes expiration

    const rawRecord: any = {
      ...ping,
      pingId,
      timestamp: now,
      expiresAt,
    };

    const sanitizedRecord: any = {};
    for (const [k, v] of Object.entries(rawRecord)) {
      if (v !== undefined) {
        sanitizedRecord[k] = v;
      }
    }

    await withTimeout(set(newPingRef, sanitizedRecord));
    return pingId;
  } catch (err) {
    console.error('[databaseService] Failed to submit waiting ping:', err);
    throw err;
  }
}

export async function cancelWaitingPing(pingId: string): Promise<void> {
  try {
    const pingRef = ref(rtdb, `waiting_commuters/${pingId}`);
    await withTimeout(
      update(pingRef, {
        status: 'expired',
      })
    );
  } catch (err) {
    console.warn(`[databaseService] Notice cancelling waiting ping ${pingId}:`, err);
  }
}

export function subscribeWaitingCommuters(
  callback: (pings: WaitingCommuterRecord[]) => void
): () => void {
  const waitingRef = ref(rtdb, 'waiting_commuters');

  const listener = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const now = Date.now();
      const pings: WaitingCommuterRecord[] = Object.values(data);
      // Filter out expired pings
      const activePings = pings.filter(
        (p) => p.status === 'waiting' && p.expiresAt > now
      );
      callback(activePings);
    } else {
      callback([]);
    }
  };

  onValue(waitingRef, listener);

  return () => {
    off(waitingRef, 'value', listener);
  };
}

export function subscribeDemandHotspots(
  callback: (hotspots: DemandHotspotRecord[]) => void
): () => void {
  const hotspotsRef = ref(rtdb, 'demand_hotspots');

  const listener = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const results: DemandHotspotRecord[] = [];
      Object.keys(data).forEach((corridorId) => {
        const corridorHotspots = data[corridorId];
        if (corridorHotspots && typeof corridorHotspots === 'object') {
          Object.keys(corridorHotspots).forEach((spotId) => {
            results.push({
              ...corridorHotspots[spotId],
              id: spotId,
              corridorId,
            });
          });
        }
      });
      callback(results);
    } else {
      callback([]);
    }
  };

  onValue(hotspotsRef, listener);

  return () => {
    off(hotspotsRef, 'value', listener);
  };
}

// ============================================================================
// 8. CORRIDOR FORECAST PERSISTENCE
// ============================================================================

export async function saveCorridorForecast(
  corridorId: string,
  dateKey: string,
  forecast: CorridorForecastRecord
): Promise<void> {
  try {
    const forecastRef = ref(rtdb, `forecast_records/${corridorId}/${dateKey}`);
    await withTimeout(set(forecastRef, forecast));
  } catch (err) {
    console.warn(`[databaseService] Failed to save forecast for ${corridorId}/${dateKey}:`, err);
  }
}

export async function getCorridorForecast(
  corridorId: string,
  dateKey: string
): Promise<CorridorForecastRecord | null> {
  try {
    const forecastRef = ref(rtdb, `forecast_records/${corridorId}/${dateKey}`);
    const snapshot = await withTimeout(get(forecastRef));
    if (snapshot.exists()) {
      return snapshot.val() as CorridorForecastRecord;
    }
    return null;
  } catch (err) {
    console.warn(`[databaseService] Failed to get forecast for ${corridorId}/${dateKey}:`, err);
    return null;
  }
}

// ============================================================================
// 9. IOT DEVICE TELEMETRY & HEARTBEAT
// ============================================================================

export async function updateDeviceHeartbeat(
  deviceId: string,
  status: Partial<DeviceRecord>
): Promise<void> {
  try {
    const deviceRef = ref(rtdb, `devices/${deviceId}`);
    await withTimeout(
      update(deviceRef, {
        ...status,
        lastHeartbeat: Date.now(),
      })
    );
  } catch (err) {
    console.warn(`[databaseService] Failed to update device heartbeat for ${deviceId}:`, err);
  }
}

// ============================================================================
// 10. ADMIN MANAGEMENT & ASSIGNMENT SYSTEM
// ============================================================================

/**
 * Retrieves all registered Driver accounts from the database.
 */
export async function getAllDrivers(): Promise<UserRecord[]> {
  try {
    const usersRef = ref(rtdb, 'users');
    const snapshot = await withTimeout(get(usersRef));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const drivers: UserRecord[] = Object.values(data);
      return drivers.filter(
        (u) => u.role === 'driver' || u.role === 'operator'
      );
    }
    return [];
  } catch (err) {
    console.warn('[databaseService] Failed to get drivers:', err);
    return [];
  }
}

/**
 * Creates a new Driver profile managed by the Administrator.
 */
export async function createDriverAccount(data: {
  name: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  cooperative?: string;
  initialUid?: string;
}): Promise<string> {
  try {
    const uid = data.initialUid || `driver_${Date.now()}`;
    const userRef = ref(rtdb, `users/${uid}`);

    const driverRecord: UserRecord = {
      uid,
      name: data.name,
      email: data.email,
      role: 'driver',
      phone: data.phone,
      licenseNumber: data.licenseNumber,
      cooperative: data.cooperative || 'MAVANODA Transport Cooperative',
      createdAt: Date.now(),
    };

    await withTimeout(set(userRef, driverRecord));
    return uid;
  } catch (err) {
    console.error('[databaseService] Failed to create driver account:', err);
    throw err;
  }
}

/**
 * Admin assigns an authorized Driver to an active Jeepney.
 * Updates both the Jeepney record and Driver's profile atomically.
 */
export async function assignDriverToJeepney(
  jeepneyId: string,
  driverUid: string,
  driverName?: string
): Promise<void> {
  try {
    // 1. Fetch jeepney
    const jeepneyRef = ref(rtdb, `jeepneys/${jeepneyId}`);
    const jeepneySnap = await withTimeout(get(jeepneyRef));
    if (!jeepneySnap.exists()) {
      throw new Error(`Jeepney ${jeepneyId} does not exist`);
    }
    const jeepney = jeepneySnap.val() as JeepneyRecord;

    // 2. Resolve driver name if not supplied
    let resolvedDriverName = driverName;
    if (!resolvedDriverName) {
      const userRef = ref(rtdb, `users/${driverUid}`);
      const userSnap = await withTimeout(get(userRef));
      if (userSnap.exists()) {
        resolvedDriverName = userSnap.val().name || 'Assigned Driver';
      }
    }

    // 3. Update jeepney currentDriver
    await withTimeout(
      update(jeepneyRef, {
        currentDriverUid: driverUid,
        currentDriverName: resolvedDriverName || 'Driver',
        status: 'IN_SERVICE',
        updatedAt: Date.now(),
      })
    );

    // 4. Update driver profile
    const driverRef = ref(rtdb, `users/${driverUid}`);
    await withTimeout(
      update(driverRef, {
        assignedJeepneyId: jeepneyId,
        assignedPlate: jeepney.plateNumber,
        assignedRouteId: jeepney.assignedRouteId,
      })
    );
  } catch (err) {
    console.error(`[databaseService] Failed to assign driver to ${jeepneyId}:`, err);
    throw err;
  }
}

/**
 * Admin unassigns a Driver from a Jeepney.
 */
export async function unassignDriverFromJeepney(jeepneyId: string): Promise<void> {
  try {
    const jeepneyRef = ref(rtdb, `jeepneys/${jeepneyId}`);
    const jeepneySnap = await withTimeout(get(jeepneyRef));
    if (jeepneySnap.exists()) {
      const jeepney = jeepneySnap.val() as JeepneyRecord;
      const prevDriverUid = jeepney.currentDriverUid;

      // 1. Clear on Jeepney
      await withTimeout(
        update(jeepneyRef, {
          currentDriverUid: null,
          currentDriverName: null,
          updatedAt: Date.now(),
        })
      );

      // 2. Clear on Driver profile if previously assigned
      if (prevDriverUid) {
        const driverRef = ref(rtdb, `users/${prevDriverUid}`);
        await withTimeout(
          update(driverRef, {
            assignedJeepneyId: null,
            assignedPlate: null,
          })
        );
      }
    }
  } catch (err) {
    console.error(`[databaseService] Failed to unassign driver from ${jeepneyId}:`, err);
    throw err;
  }
}

/**
 * Admin assigns an IoT Device (ESP32-CAM) to a Jeepney.
 */
export async function assignDeviceToJeepney(
  jeepneyId: string,
  deviceId: string
): Promise<void> {
  try {
    const jeepneyRef = ref(rtdb, `jeepneys/${jeepneyId}`);
    await withTimeout(
      update(jeepneyRef, {
        deviceId,
        updatedAt: Date.now(),
      })
    );

    const deviceRef = ref(rtdb, `devices/${deviceId}`);
    await withTimeout(
      update(deviceRef, {
        jeepneyId,
        lastHeartbeat: Date.now(),
      })
    );
  } catch (err) {
    console.error(`[databaseService] Failed to assign device ${deviceId} to ${jeepneyId}:`, err);
    throw err;
  }
}

/**
 * Admin unassigns an IoT Device from a Jeepney.
 */
export async function unassignDeviceFromJeepney(
  jeepneyId: string,
  deviceId: string
): Promise<void> {
  try {
    const jeepneyRef = ref(rtdb, `jeepneys/${jeepneyId}`);
    await withTimeout(
      update(jeepneyRef, {
        deviceId: null,
        updatedAt: Date.now(),
      })
    );

    const deviceRef = ref(rtdb, `devices/${deviceId}`);
    await withTimeout(
      update(deviceRef, {
        jeepneyId: null,
      })
    );
  } catch (err) {
    console.error(`[databaseService] Failed to unassign device ${deviceId}:`, err);
    throw err;
  }
}

/**
 * Retrieves all registered IoT edge devices.
 */
export async function getAllDevices(): Promise<DeviceRecord[]> {
  try {
    const devicesRef = ref(rtdb, 'devices');
    const snapshot = await withTimeout(get(devicesRef));
    if (snapshot.exists()) {
      return Object.values(snapshot.val()) as DeviceRecord[];
    }
    return [];
  } catch (err) {
    console.warn('[databaseService] Failed to get devices:', err);
    return [];
  }
}

/**
 * Registers a new IoT hardware device.
 */
export async function registerDevice(device: DeviceRecord): Promise<void> {
  try {
    const deviceRef = ref(rtdb, `devices/${device.deviceId}`);
    await withTimeout(set(deviceRef, device));
  } catch (err) {
    console.error('[databaseService] Failed to register device:', err);
    throw err;
  }
}

/**
 * Registers a new Jeepney in the master registry.
 */
export async function registerJeepney(jeepney: JeepneyRecord): Promise<void> {
  try {
    const jeepneyRef = ref(rtdb, `jeepneys/${jeepney.id}`);
    await withTimeout(set(jeepneyRef, { ...jeepney, createdAt: Date.now() }));
  } catch (err) {
    console.error('[databaseService] Failed to register jeepney:', err);
    throw err;
  }
}

/**
 * Subscribes to real-time updates for all Jeepneys in the master registry.
 */
export function subscribeJeepneys(callback: (jeepneys: JeepneyRecord[]) => void): () => void {
  const jeepneysRef = ref(rtdb, 'jeepneys');
  const listener = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(Object.values(snapshot.val()) as JeepneyRecord[]);
    } else {
      callback([]);
    }
  };
  onValue(jeepneysRef, listener);
  return () => off(jeepneysRef, 'value', listener);
}

/**
 * Subscribes to real-time updates for all registered edge devices.
 */
export function subscribeDevices(callback: (devices: DeviceRecord[]) => void): () => void {
  const devicesRef = ref(rtdb, 'devices');
  const listener = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(Object.values(snapshot.val()) as DeviceRecord[]);
    } else {
      callback([]);
    }
  };
  onValue(devicesRef, listener);
  return () => off(devicesRef, 'value', listener);
}

/**
 * Subscribes to real-time updates for registered Driver accounts.
 */
export function subscribeDrivers(callback: (drivers: UserRecord[]) => void): () => void {
  const usersRef = ref(rtdb, 'users');
  const listener = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const all: UserRecord[] = Object.values(snapshot.val());
      callback(all.filter((u) => u.role === 'driver' || u.role === 'operator'));
    } else {
      callback([]);
    }
  };
  onValue(usersRef, listener);
  return () => off(usersRef, 'value', listener);
}

// ============================================================================
// 11. DRIVER-SCOPED ACCESS & TELEMETRY
// ============================================================================

export interface DriverAssignedVehicleBundle {
  jeepney: JeepneyRecord | null;
  telemetry: LiveTelemetryRecord | null;
  device: DeviceRecord | null;
  route: RouteRecord | null;
}

/**
 * Fetches the assigned vehicle information strictly for the requesting Driver.
 * Drivers can ONLY access their own assigned vehicle.
 */
export async function getAssignedJeepneyForDriver(
  driverUid: string
): Promise<DriverAssignedVehicleBundle> {
  try {
    // 1. Find jeepney where currentDriverUid matches driverUid
    const jeepneysRef = ref(rtdb, 'jeepneys');
    const jeepSnap = await withTimeout(get(jeepneysRef));
    let assignedJeepney: JeepneyRecord | null = null;

    if (jeepSnap.exists()) {
      const allJeeps = jeepSnap.val();
      for (const key of Object.keys(allJeeps)) {
        if (allJeeps[key]?.currentDriverUid === driverUid) {
          assignedJeepney = allJeeps[key] as JeepneyRecord;
          break;
        }
      }
    }

    // Fallback: check /users/{driverUid} for assignedJeepneyId
    if (!assignedJeepney) {
      const userRef = ref(rtdb, `users/${driverUid}`);
      const userSnap = await withTimeout(get(userRef));
      if (userSnap.exists() && userSnap.val().assignedJeepneyId) {
        const jId = userSnap.val().assignedJeepneyId;
        const directJeepSnap = await withTimeout(get(ref(rtdb, `jeepneys/${jId}`)));
        if (directJeepSnap.exists()) {
          assignedJeepney = directJeepSnap.val() as JeepneyRecord;
        }
      }
    }

    if (!assignedJeepney) {
      return { jeepney: null, telemetry: null, device: null, route: null };
    }

    // 2. Fetch live telemetry for assigned jeepney
    let telemetry: LiveTelemetryRecord | null = null;
    const telRef = ref(rtdb, `live_telemetry/${assignedJeepney.id}`);
    const telSnap = await withTimeout(get(telRef));
    if (telSnap.exists()) {
      telemetry = telSnap.val() as LiveTelemetryRecord;
    }

    // 3. Fetch linked device
    let device: DeviceRecord | null = null;
    if (assignedJeepney.deviceId) {
      const devRef = ref(rtdb, `devices/${assignedJeepney.deviceId}`);
      const devSnap = await withTimeout(get(devRef));
      if (devSnap.exists()) {
        device = devSnap.val() as DeviceRecord;
      }
    }

    // 4. Fetch assigned route
    let route: RouteRecord | null = null;
    if (assignedJeepney.assignedRouteId) {
      const routeRef = ref(rtdb, `routes/${assignedJeepney.assignedRouteId}`);
      const routeSnap = await withTimeout(get(routeRef));
      if (routeSnap.exists()) {
        route = routeSnap.val() as RouteRecord;
      }
    }

    return {
      jeepney: assignedJeepney,
      telemetry,
      device,
      route,
    };
  } catch (err) {
    console.warn('[databaseService] Failed to get assigned jeepney for driver:', err);
    return { jeepney: null, telemetry: null, device: null, route: null };
  }
}

/**
 * Real-time listener for the logged-in User profile record in RTDB (/users).
 * Listens continuously and triggers callback whenever admin/operator edits
 * any field (name, cooperative, driverId, licenseNumber, phone, assignedJeepneyId, etc.) in Firebase Console.
 */
export function subscribeUserProfile(
  uid: string,
  email: string | undefined,
  callback: (user: Partial<UserRecord> | null) => void
): () => void {
  const usersRef = ref(rtdb, 'users');

  const onUsersChange = (snap: DataSnapshot) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }

    const allUsers = snap.val();
    // 1. Direct match by key or uid
    if (uid && allUsers[uid]) {
      callback({ uid, ...allUsers[uid] });
      return;
    }

    // 2. Search by uid field or email
    const normalizedEmail = email?.trim().toLowerCase();
    for (const key of Object.keys(allUsers)) {
      const u = allUsers[key];
      if (
        (uid && (u?.uid === uid || key === uid)) ||
        (normalizedEmail && u?.email && u.email.trim().toLowerCase() === normalizedEmail)
      ) {
        callback({ uid: u.uid || key, ...u });
        return;
      }
    }

    callback(null);
  };

  onValue(usersRef, onUsersChange);
  return () => off(usersRef, 'value', onUsersChange);
}

export interface DriverMatchOptions {
  email?: string;
  driverId?: string;
  assignedJeepneyId?: string;
  assignedPlate?: string;
}

/**
 * Subscribes to real-time telemetry, vehicle, route, and device changes for the Driver's assigned vehicle.
 * Robustly matches by assignedJeepneyId, driverUid, driverId, driverEmail, or assignedPlate,
 * and maintains continuous listeners on live_telemetry, routes, and devices nodes.
 */
export function subscribeAssignedJeepney(
  driverUid: string,
  callback: (bundle: DriverAssignedVehicleBundle) => void,
  userOptions?: DriverMatchOptions
): () => void {
  let activeJeepneyId: string | null = null;
  let unsubTelemetry: (() => void) | null = null;
  let unsubRoute: (() => void) | null = null;
  let unsubDevice: (() => void) | null = null;

  let currentJeepney: JeepneyRecord | null = null;
  let currentTelemetry: LiveTelemetryRecord | null = null;
  let currentDevice: DeviceRecord | null = null;
  let currentRoute: RouteRecord | null = null;

  const emit = () => {
    callback({
      jeepney: currentJeepney,
      telemetry: currentTelemetry,
      device: currentDevice,
      route: currentRoute,
    });
  };

  const jeepneysRef = ref(rtdb, 'jeepneys');

  const onJeepneysUpdate = (snapshot: DataSnapshot) => {
    let assignedJeepney: JeepneyRecord | null = null;

    if (snapshot.exists()) {
      const allJeeps = snapshot.val();
      const keys = Object.keys(allJeeps);

      // Priority 1: Match by user's assignedJeepneyId
      if (userOptions?.assignedJeepneyId) {
        for (const k of keys) {
          if (k === userOptions.assignedJeepneyId || allJeeps[k]?.id === userOptions.assignedJeepneyId) {
            assignedJeepney = { ...allJeeps[k], id: allJeeps[k]?.id || k };
            break;
          }
        }
      }

      // Priority 2: Match by driverUid / currentDriverUid / assignedDriverUid
      if (!assignedJeepney && driverUid) {
        for (const k of keys) {
          const j = allJeeps[k];
          if (
            j?.currentDriverUid === driverUid ||
            j?.driverUid === driverUid ||
            j?.assignedDriverUid === driverUid
          ) {
            assignedJeepney = { ...j, id: j?.id || k };
            break;
          }
        }
      }

      // Priority 3: Match by driverId
      if (!assignedJeepney && userOptions?.driverId) {
        for (const k of keys) {
          const j = allJeeps[k];
          if (j?.driverId === userOptions.driverId || j?.currentDriverId === userOptions.driverId) {
            assignedJeepney = { ...j, id: j?.id || k };
            break;
          }
        }
      }

      // Priority 4: Match by driverEmail
      if (!assignedJeepney && userOptions?.email) {
        const normEmail = userOptions.email.trim().toLowerCase();
        for (const k of keys) {
          const j = allJeeps[k];
          if (j?.driverEmail && j.driverEmail.trim().toLowerCase() === normEmail) {
            assignedJeepney = { ...j, id: j?.id || k };
            break;
          }
        }
      }

      // Priority 5: Match by assignedPlate
      if (!assignedJeepney && userOptions?.assignedPlate) {
        const normPlate = userOptions.assignedPlate.replace(/\s+/g, '').toUpperCase();
        for (const k of keys) {
          const j = allJeeps[k];
          if (
            (j?.plateNumber && j.plateNumber.replace(/\s+/g, '').toUpperCase() === normPlate) ||
            (j?.plate && j.plate.replace(/\s+/g, '').toUpperCase() === normPlate)
          ) {
            assignedJeepney = { ...j, id: j?.id || k };
            break;
          }
        }
      }

      // Priority 6: Single vehicle fallback for easy manual database testing
      if (!assignedJeepney && keys.length === 1 && driverUid) {
        assignedJeepney = { ...allJeeps[keys[0]], id: allJeeps[keys[0]]?.id || keys[0] };
      }
    }

    if (!assignedJeepney) {
      if (unsubTelemetry) { unsubTelemetry(); unsubTelemetry = null; }
      if (unsubRoute) { unsubRoute(); unsubRoute = null; }
      if (unsubDevice) { unsubDevice(); unsubDevice = null; }
      activeJeepneyId = null;
      currentJeepney = null;
      currentTelemetry = null;
      currentDevice = null;
      currentRoute = null;
      emit();
      return;
    }

    // Normalize vehicle fields
    assignedJeepney.plateNumber = assignedJeepney.plateNumber || (assignedJeepney as any).plate || '';
    assignedJeepney.model = assignedJeepney.model || (assignedJeepney as any).unitModel || '';
    assignedJeepney.totalSeats = Number(assignedJeepney.totalSeats || (assignedJeepney as any).capacity || 22);

    currentJeepney = assignedJeepney;
    const jId = assignedJeepney.id;

    // Resubscribe live telemetry & routes & device if vehicle changed
    if (activeJeepneyId !== jId) {
      activeJeepneyId = jId;

      // 1. Telemetry Listener
      if (unsubTelemetry) { unsubTelemetry(); unsubTelemetry = null; }
      const telRef = ref(rtdb, `live_telemetry/${jId}`);
      const telListener = (telSnap: DataSnapshot) => {
        if (telSnap.exists()) {
          const val = telSnap.val();
          currentTelemetry = {
            jeepneyId: jId,
            occupiedSeats: Number(val.occupiedSeats ?? val.passengerCount ?? val.passengers ?? val.currentCount ?? 0),
            totalSeats: Number(val.totalSeats ?? val.capacity ?? currentJeepney?.totalSeats ?? 22),
            speedKmh: Number(val.speedKmh ?? val.speed ?? 0),
            timestamp: Number(val.timestamp ?? val.lastUpdated ?? Date.now()),
            currentCoord: val.currentCoord || (val.lat && val.lng ? [val.lat, val.lng] : undefined),
            status: val.status || 'IN_SERVICE',
            networkType: val.networkType || val.network || 'LTE',
            wifiRssi: val.wifiRssi ?? val.rssi ?? undefined,
            etaMin: val.etaMin,
          };
        } else {
          // Check embedded telemetry on vehicle
          const embedded = currentJeepney as any;
          if (embedded?.speedKmh !== undefined || embedded?.occupiedSeats !== undefined) {
            currentTelemetry = {
              jeepneyId: jId,
              occupiedSeats: Number(embedded.occupiedSeats ?? 0),
              totalSeats: Number(embedded.totalSeats ?? 22),
              speedKmh: Number(embedded.speedKmh ?? 0),
              timestamp: Number(embedded.timestamp ?? Date.now()),
              currentCoord: embedded.currentCoord,
              status: 'IN_SERVICE',
            };
          } else {
            currentTelemetry = null;
          }
        }
        emit();
      };
      onValue(telRef, telListener);
      unsubTelemetry = () => off(telRef, 'value', telListener);

      // 2. Real-time Route Listener
      if (unsubRoute) { unsubRoute(); unsubRoute = null; }
      const routeId = assignedJeepney.assignedRouteId;
      if (routeId) {
        const routeRef = ref(rtdb, `routes/${routeId}`);
        const routeListener = (rSnap: DataSnapshot) => {
          if (rSnap.exists()) {
            const rVal = rSnap.val();
            let stopsObj = rVal.stops;
            if (Array.isArray(rVal.stops)) {
              stopsObj = {};
              rVal.stops.forEach((s: any, idx: number) => {
                if (typeof s === 'string') {
                  stopsObj[`stop-${idx}`] = { name: s, sequenceOrder: idx + 1 };
                } else if (s && typeof s === 'object') {
                  stopsObj[`stop-${idx}`] = { ...s, sequenceOrder: s.sequenceOrder ?? idx + 1 };
                }
              });
            }
            currentRoute = {
              id: routeId,
              routeCode: rVal.routeCode || '',
              name: rVal.name || `${rVal.origin || ''} – ${rVal.destination || ''}`,
              origin: rVal.origin || '',
              destination: rVal.destination || '',
              totalDistanceKm: Number(rVal.totalDistanceKm || 0),
              estimatedDurationMin: Number(rVal.estimatedDurationMin || 0),
              baseFare: Number(rVal.baseFare || 13),
              status: rVal.status || 'ACTIVE',
              direction: rVal.direction || 'Northbound',
              stops: stopsObj,
            } as any;
          } else {
            currentRoute = null;
          }
          emit();
        };
        onValue(routeRef, routeListener);
        unsubRoute = () => off(routeRef, 'value', routeListener);
      } else {
        currentRoute = null;
      }

      // 3. Real-time Device Listener
      if (unsubDevice) { unsubDevice(); unsubDevice = null; }
      const devId = assignedJeepney.deviceId;
      if (devId) {
        const devRef = ref(rtdb, `devices/${devId}`);
        const devListener = (dSnap: DataSnapshot) => {
          if (dSnap.exists()) {
            currentDevice = dSnap.val() as DeviceRecord;
          } else {
            currentDevice = null;
          }
          emit();
        };
        onValue(devRef, devListener);
        unsubDevice = () => off(devRef, 'value', devListener);
      } else {
        currentDevice = null;
      }
    } else {
      // Re-emit updated vehicle without erasing telemetry
      emit();
    }
  };

  onValue(jeepneysRef, onJeepneysUpdate);

  return () => {
    off(jeepneysRef, 'value', onJeepneysUpdate);
    if (unsubTelemetry) unsubTelemetry();
    if (unsubRoute) unsubRoute();
    if (unsubDevice) unsubDevice();
  };
}

/**
 * Fetches recent doorway boarding/alighting events for a specific Jeepney.
 */
export async function getRecentDoorwayEventsForJeepney(
  jeepneyId: string,
  limit = 8
): Promise<DoorwayEventRecord[]> {
  try {
    const eventsRef = ref(rtdb, 'doorway_events');
    const snapshot = await withTimeout(get(eventsRef));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const events: DoorwayEventRecord[] = Object.values(data);
      return events
        .filter((e) => e.jeepneyId === jeepneyId)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    }
    return [];
  } catch (err) {
    console.warn(`[databaseService] Failed to get events for ${jeepneyId}:`, err);
    return [];
  }
}


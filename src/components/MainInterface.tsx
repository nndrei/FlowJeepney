import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Menu,
  Crosshair,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  Home,
  Radio,
  ChevronRight,
  Map as MapIcon,
  User,
  MapPin,
  Loader2,
  X,
  Users,
  Clock,
  TrendingUp,
  Navigation,
} from 'lucide-react';
import L from 'leaflet';
import { NavigationDrawer } from './NavigationDrawer';
import { ForecastScreen } from './forecast/ForecastScreen';
import { WaitingScreen } from './waiting/WaitingScreen';
import { subscribeLiveTelemetry } from '../services/databaseService';
import { LiveTelemetryRecord } from '../types/database';
import {
  filterVehiclesForJourney,
  projectToNearestCorridor,
  getClosestPointOnSegment,
  LOCAL_VECTOR_CORRIDORS,
  ModernJeepneyVehicle,
} from '../utils/jeepneyCorridors';

// Export for any external consumers
export { projectToNearestCorridor, getClosestPointOnSegment, LOCAL_VECTOR_CORRIDORS };

// FlowJeep Live Jeepney Card Interface matching design
export interface DisplayJeepney {
  id: string;
  routeCode: string;
  isDarkBadge: boolean;
  routeName: string;
  plateNumber: string;
  occupiedSeats: number;
  totalSeats: number;
  etaMinutes: number;
  distanceText: string;
  coord: [number, number];
}

// FlowJeep Persisted Recent Location / Pin Model
export interface RecentLocation {
  id: string;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
  timestamp: number;
  isPin?: boolean;
}

export const DEFAULT_RECENT_LOCATIONS: RecentLocation[] = [];

// 3. Rich Curated Transit Places & Landmarks for Instant Offline/Online Search
export interface TransitPlace {
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
  aliases?: string[];
}

export const METRO_MANILA_TRANSIT_PLACES: TransitPlace[] = [
  {
    name: 'SM City North EDSA',
    fullAddress: 'Misamis St, EDSA, Santo Cristo, Bago Bantay, Quezon City',
    lat: 14.65625,
    lng: 121.02914,
    aliases: ['sm north', 'sm north edsa', 'sm', 'north edsa', 'sm city', 'sm annex', 'sm mall'],
  },
  {
    name: 'SM North Interior Zone and The Car Park Plaza',
    fullAddress: 'North Road, SM North EDSA, Santo Cristo, Quezon City',
    lat: 14.65766,
    lng: 121.03096,
    aliases: ['sm north interior', 'interior zone', 'car park plaza', 'sm north parking'],
  },
  {
    name: 'SM North EDSA Transport Terminal',
    fullAddress: 'West Road, SM North EDSA, Bago Bantay, Quezon City',
    lat: 14.65552,
    lng: 121.03161,
    aliases: ['sm north terminal', 'sm uv express', 'sm jeep terminal', 'sm bus stop'],
  },
  {
    name: 'SM City North EDSA Annex Parking',
    fullAddress: 'Pag-Asa Bypass Road, SM North EDSA, Quezon City',
    lat: 14.65645,
    lng: 121.03345,
    aliases: ['sm annex', 'annex parking', 'sm north annex'],
  },
  {
    name: 'TriNoma Mall',
    fullAddress: 'North Avenue cor. EDSA, Bagong Pag-asa, Quezon City',
    lat: 14.6533,
    lng: 121.0335,
    aliases: ['trinoma', 'ayala trinoma', 'north ave mall', 'trinoma landmark'],
  },
  {
    name: 'MRT-3 North Avenue Station',
    fullAddress: 'EDSA cor. North Ave, Diliman, Quezon City',
    lat: 14.6521,
    lng: 121.0323,
    aliases: ['mrt north', 'north ave station', 'mrt-3 north', 'mrt'],
  },
  {
    name: 'Vertis North (Ayala Malls Vertis)',
    fullAddress: 'North Avenue, Bagong Pag-asa, Quezon City',
    lat: 14.6515,
    lng: 121.0375,
    aliases: ['vertis north', 'ayala vertis', 'vertis mall', 'seda vertis'],
  },
  {
    name: 'Quezon Memorial Circle (QC Circle)',
    fullAddress: 'Elliptical Road, Diliman, Quezon City',
    lat: 14.6515,
    lng: 121.0494,
    aliases: ['qc circle', 'quezon circle', 'elliptical road', 'circle', 'qc hall'],
  },
  {
    name: 'Philcoa / PCA Transit Hub',
    fullAddress: 'Commonwealth Avenue, Diliman, Quezon City',
    lat: 14.6539,
    lng: 121.0538,
    aliases: ['philcoa', 'pca', 'commonwealth philcoa', 'up jeep terminal', 'philcoa overpass'],
  },
  {
    name: 'UP Diliman (University Avenue)',
    fullAddress: 'University Avenue, UP Campus, Diliman, Quezon City',
    lat: 14.6538,
    lng: 121.0685,
    aliases: ['up diliman', 'up', 'university of the philippines', 'sunken garden', 'up campus'],
  },
  {
    name: 'Tandang Sora (Commonwealth Ave)',
    fullAddress: 'Commonwealth Ave cor. Tandang Sora Ave, Quezon City',
    lat: 14.6710,
    lng: 121.0690,
    aliases: ['tandang sora', 'ts', 'commonwealth tandang sora', 'tandang sora flyover'],
  },
  {
    name: 'Don Antonio / Ever Gotesco Commonwealth',
    fullAddress: 'Commonwealth Ave, Batasan Hills, Quezon City',
    lat: 14.6850,
    lng: 121.0775,
    aliases: ['don antonio', 'ever gotesco', 'ever commonwealth', 'don antonio station'],
  },
  {
    name: 'Batasan Pambansa / Batasan Road',
    fullAddress: 'Commonwealth Ave cor. Batasan Road, Quezon City',
    lat: 14.6980,
    lng: 121.0850,
    aliases: ['batasan', 'batasan pambansa', 'congress', 'batasan road', 'litex'],
  },
  {
    name: 'Fairview Center Mall (FCM)',
    fullAddress: 'Commonwealth Ave, Fairview, Quezon City',
    lat: 14.7065,
    lng: 121.0715,
    aliases: ['fcm', 'fairview center mall', 'fairview', 'commonwealth fairview'],
  },
  {
    name: 'SM City Fairview / Fairview Terraces',
    fullAddress: 'Quirino Highway cor. Regalado Ave, Novaliches, Quezon City',
    lat: 14.7335,
    lng: 121.0585,
    aliases: ['sm fairview', 'fairview terraces', 'robinsons novaliches', 'sm fv'],
  },
  {
    name: 'MRT-3 Quezon Avenue Station',
    fullAddress: 'EDSA cor. Quezon Ave, Diliman, Quezon City',
    lat: 14.6425,
    lng: 121.0378,
    aliases: ['mrt q ave', 'quezon ave station', 'mrt quezon ave', 'centris', 'eton centris'],
  },
  {
    name: 'Fisher Mall Quezon Avenue',
    fullAddress: 'Quezon Ave cor. Roosevelt Ave (FPJ Ave), Quezon City',
    lat: 14.6318,
    lng: 121.0195,
    aliases: ['fisher mall', 'fishermall', 'roosevelt', 'fpj ave', 'pantranco'],
  },
  {
    name: 'Banawe Chinatown District',
    fullAddress: 'Quezon Ave cor. Banawe St, Santa Mesa Heights, Quezon City',
    lat: 14.6247,
    lng: 121.0102,
    aliases: ['banawe', 'banawe chinatown', 'quezon ave banawe'],
  },
  {
    name: 'Welcome Rotonda',
    fullAddress: 'Quezon Ave / España Blvd, Quezon City - Manila border',
    lat: 14.6195,
    lng: 121.0028,
    aliases: ['welcome rotonda', 'rotonda', 'welcome', 'espana rotonda', 'sun residences'],
  },
  {
    name: 'University of Santo Tomas (UST)',
    fullAddress: 'España Boulevard, Sampaloc, Manila',
    lat: 14.6098,
    lng: 120.9895,
    aliases: ['ust', 'espana', 'university of santo tomas', 'lacson', 'noval', 'dapitan'],
  },
  {
    name: 'FEU / Morayta (Nicanor Reyes St)',
    fullAddress: 'España Blvd cor. Nicanor Reyes St, Sampaloc, Manila',
    lat: 14.6045,
    lng: 120.9882,
    aliases: ['feu', 'morayta', 'nicanor reyes', 'lerma', 'university belt', 'ubelt'],
  },
  {
    name: 'Quiapo Church / Plaza Miranda',
    fullAddress: 'Quezon Blvd, Quiapo, Manila',
    lat: 14.5988,
    lng: 120.9832,
    aliases: ['quiapo', 'quiapo church', 'plaza miranda', 'quiapo bridge', 'carriedo'],
  },
  {
    name: 'Lawton / Liwasang Bonifacio',
    fullAddress: 'Padre Burgos Ave / Taft Ave, Ermita, Manila',
    lat: 14.5945,
    lng: 120.9795,
    aliases: ['lawton', 'liwasang bonifacio', 'post office', 'intramuros lawton'],
  },
  {
    name: 'Manila City Hall',
    fullAddress: 'Padre Burgos Ave, Ermita, Manila',
    lat: 14.5888,
    lng: 120.9818,
    aliases: ['manila city hall', 'city hall', 'sm manila', 'padre burgos'],
  },
  {
    name: 'United Nations (UN) Ave / Rizal Park',
    fullAddress: 'Taft Ave cor. UN Ave, Ermita, Manila',
    lat: 14.5828,
    lng: 120.9840,
    aliases: ['un ave', 'united nations', 'luneta', 'rizal park', 'un station'],
  },
  {
    name: 'Pedro Gil / PGH / UP Manila',
    fullAddress: 'Taft Ave cor. Pedro Gil St, Ermita, Manila',
    lat: 14.5768,
    lng: 120.9892,
    aliases: ['pedro gil', 'pgh', 'up manila', 'philippine general hospital', 'robinsons manila'],
  },
  {
    name: 'Quirino Avenue / Malate',
    fullAddress: 'Taft Ave cor. Quirino Ave, Malate, Manila',
    lat: 14.5702,
    lng: 120.9918,
    aliases: ['quirino', 'quirino ave', 'malate', 'san andres'],
  },
  {
    name: 'De La Salle University (DLSU) / Vito Cruz',
    fullAddress: 'Taft Ave, Malate, Manila',
    lat: 14.5635,
    lng: 120.9945,
    aliases: ['dlsu', 'vito cruz', 'la salle', 'csb', 'benilde', 'vito cruz station'],
  },
  {
    name: 'Gil Puyat / LRT Buendia',
    fullAddress: 'Taft Ave cor. Gil Puyat Ave, Pasay',
    lat: 14.5542,
    lng: 120.9972,
    aliases: ['buendia', 'gil puyat', 'lrt buendia', 'buendia bus terminal', 'pasay'],
  },
  {
    name: 'Araneta City / Cubao (Gateway Mall)',
    fullAddress: 'EDSA cor. Aurora Blvd, Cubao, Quezon City',
    lat: 14.6210,
    lng: 121.0530,
    aliases: ['cubao', 'araneta center', 'araneta city', 'gateway mall', 'farmers plaza', 'ali mall'],
  },
  {
    name: 'Philippine Heart Center / East Ave Medical',
    fullAddress: 'East Avenue, Diliman, Quezon City',
    lat: 14.6440,
    lng: 121.0460,
    aliases: ['heart center', 'east ave', 'east avenue medical center', 'bir', 'sss'],
  },
  {
    name: 'Visayas Avenue / Central Ave',
    fullAddress: 'Visayas Avenue, Vasra, Quezon City',
    lat: 14.6620,
    lng: 121.0475,
    aliases: ['visayas ave', 'visayas', 'dar', 'denr'],
  },
  {
    name: 'LRT-1 Balintawak / Ayala Malls Cloverleaf',
    fullAddress: 'EDSA, Balintawak, Quezon City',
    lat: 14.6575,
    lng: 121.0310,
    aliases: ['balintawak', 'cloverleaf', 'ayala cloverleaf', 'lrt balintawak'],
  },
  {
    name: 'Monumento Circle / SM Center Sangandaan',
    fullAddress: 'Samson Rd / Rizal Ave, Grace Park, Caloocan',
    lat: 14.6548,
    lng: 120.9841,
    aliases: ['monumento', 'bonifacio monument', 'caloocan', 'sm sangandaan'],
  },
];

export const POPULAR_TRANSIT_PLACES = [
  METRO_MANILA_TRANSIT_PLACES[0], // SM City North EDSA
  METRO_MANILA_TRANSIT_PLACES[4], // TriNoma Mall
  METRO_MANILA_TRANSIT_PLACES[7], // QC Circle
  METRO_MANILA_TRANSIT_PLACES[8], // Philcoa / PCA
  METRO_MANILA_TRANSIT_PLACES[9], // UP Diliman
  METRO_MANILA_TRANSIT_PLACES[19], // UST España
  METRO_MANILA_TRANSIT_PLACES[21], // Quiapo Church
  METRO_MANILA_TRANSIT_PLACES[29], // Cubao Araneta
];

export function searchLocalTransitPlaces(query: string): TransitPlace[] {
  const q = query.trim().toLowerCase();
  if (!q) return POPULAR_TRANSIT_PLACES;

  return METRO_MANILA_TRANSIT_PLACES.filter((place) => {
    if (place.name.toLowerCase().includes(q)) return true;
    if (place.fullAddress.toLowerCase().includes(q)) return true;
    if (place.aliases?.some((alias) => alias.toLowerCase().includes(q))) return true;
    return false;
  });
}

interface MainInterfaceProps {
  onOpenMenu?: () => void;
  onNavigateTab?: (tab: 'home' | 'waiting' | 'forecast' | 'profile') => void;
  onLogout?: () => void;
  user?: { name: string; email: string; isGuest?: boolean } | null;
}

export const MainInterface: React.FC<MainInterfaceProps> = ({
  onOpenMenu,
  onNavigateTab,
  onLogout,
  user,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'waiting' | 'forecast' | 'profile'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [drawerActiveItem, setDrawerActiveItem] = useState('Home');

  // Bottom Sheet Drawer State (collapsible / gesture-friendly)
  const [isSheetMinimized, setIsSheetMinimized] = useState(false);
  const touchStartYRef = useRef<number | null>(null);

  // Search & Routing Panel State
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeField, setActiveField] = useState<'pickup' | 'destination'>('destination');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ name: string; fullAddress: string; lat: number; lng: number }>>(POPULAR_TRANSIT_PLACES);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Recent Selected Pins & Areas (persisted in localStorage across sessions)
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('flowjeep_recent_locations');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  const addRecentLocation = useCallback(
    (loc: { name: string; fullAddress: string; lat: number; lng: number; isPin?: boolean }) => {
      setRecentLocations((prev) => {
        // Deduplicate if matching name or coordinates within ~40 meters
        const filtered = prev.filter(
          (item) =>
            item.name.toLowerCase() !== loc.name.toLowerCase() &&
            (Math.abs(item.lat - loc.lat) > 0.0004 || Math.abs(item.lng - loc.lng) > 0.0004)
        );
        const newEntry: RecentLocation = {
          id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: loc.name,
          fullAddress: loc.fullAddress,
          lat: loc.lat,
          lng: loc.lng,
          timestamp: Date.now(),
          isPin: loc.isPin ?? false,
        };
        const updated = [newEntry, ...filtered].slice(0, 8);
        try {
          localStorage.setItem('flowjeep_recent_locations', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    []
  );

  const handleClearRecents = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentLocations([]);
    try {
      localStorage.removeItem('flowjeep_recent_locations');
    } catch {
      // ignore
    }
  }, []);

  // Live Passenger GPS Position
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flowjeep_saved_coords');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return null;
  });

  // Transit center reference point
  const defaultCenter: [number, number] = [14.6538, 121.0505];

  // 1. Dedicated Road-Snapped Pickup Point & Persistence (Default to commuter's live location)
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(() => {
    if (typeof window !== 'undefined') {
      const userSaved = localStorage.getItem('flowjeep_saved_coords');
      if (userSaved) {
        try {
          const parsedUser = JSON.parse(userSaved);
          if (parsedUser && typeof parsedUser.lat === 'number' && typeof parsedUser.lng === 'number') {
            const projected = projectToNearestCorridor(parsedUser.lat, parsedUser.lng);
            return { lat: projected.lat, lng: projected.lng };
          }
        } catch {
          // ignore
        }
      }
      const saved = localStorage.getItem('flowjeep_pickup_coords');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const projected = projectToNearestCorridor(parsed.lat, parsed.lng);
          return { lat: projected.lat, lng: projected.lng };
        } catch {
          // ignore
        }
      }
    }
    const initialSnap = projectToNearestCorridor(defaultCenter[0], defaultCenter[1]);
    return { lat: initialSnap.lat, lng: initialSnap.lng };
  });

  const [pickupStopName, setPickupStopName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const userSaved = localStorage.getItem('flowjeep_saved_coords');
      if (userSaved) {
        try {
          const parsedUser = JSON.parse(userSaved);
          if (parsedUser && typeof parsedUser.lat === 'number' && typeof parsedUser.lng === 'number') {
            const projected = projectToNearestCorridor(parsedUser.lat, parsedUser.lng);
            return projected.isSnapped ? `Near ${projected.corridorName}` : 'Current Location';
          }
        } catch {
          // ignore
        }
      }
      const saved = localStorage.getItem('flowjeep_pickup_location_name');
      if (saved) return saved;
    }
    const initialSnap = projectToNearestCorridor(defaultCenter[0], defaultCenter[1]);
    return `Near ${initialSnap.corridorName}`;
  });

  const [pickupInput, setPickupInput] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const userSaved = localStorage.getItem('flowjeep_saved_coords');
      if (userSaved) {
        try {
          const parsedUser = JSON.parse(userSaved);
          if (parsedUser && typeof parsedUser.lat === 'number' && typeof parsedUser.lng === 'number') {
            const projected = projectToNearestCorridor(parsedUser.lat, parsedUser.lng);
            return projected.isSnapped ? `Near ${projected.corridorName}` : 'Current Location';
          }
        } catch {
          // ignore
        }
      }
      const saved = localStorage.getItem('flowjeep_pickup_location_name');
      if (saved) return saved;
    }
    const initialSnap = projectToNearestCorridor(defaultCenter[0], defaultCenter[1]);
    return `Near ${initialSnap.corridorName}`;
  });

  // 2. Controlled Destination Coordinates and Name
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationName, setDestinationName] = useState<string>('');
  const [destinationInput, setDestinationInput] = useState('');

  // Map & Markers references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const vehicleMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Synchronized Coordinate and Handler Refs to avoid stale closures in Leaflet events
  const userCoordsRef = useRef<{ lat: number; lng: number } | null>(userCoords);
  const isInitialGpsFixRef = useRef<boolean>(true);
  const pickupCoordsRef = useRef<{ lat: number; lng: number } | null>(pickupCoords);
  const destinationCoordsRef = useRef<{ lat: number; lng: number } | null>(destinationCoords);
  const handleSetPickupPointRef = useRef<(rawLat: number, rawLng: number, explicitName?: string, animate?: boolean) => void>(() => {});
  const handleSetDestinationPointRef = useRef<(rawLat: number, rawLng: number, explicitName?: string, animate?: boolean) => void>(() => {});
  const isSearchActiveRef = useRef<boolean>(isSearchActive);
  const activeFieldRef = useRef<'pickup' | 'destination'>(activeField);

  useEffect(() => {
    userCoordsRef.current = userCoords;
  }, [userCoords]);

  useEffect(() => {
    pickupCoordsRef.current = pickupCoords;
  }, [pickupCoords]);

  useEffect(() => {
    destinationCoordsRef.current = destinationCoords;
  }, [destinationCoords]);

  useEffect(() => {
    isSearchActiveRef.current = isSearchActive;
  }, [isSearchActive]);

  useEffect(() => {
    activeFieldRef.current = activeField;
  }, [activeField]);

  // Update or draw polyline connecting pickup and destination along road corridor
  const updateRoutePolyline = useCallback(
    async (
      pickup: { lat: number; lng: number } | null,
      dest: { lat: number; lng: number } | null,
      fitBounds = true
    ) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (!pickup || !dest) {
        if (routePolylineRef.current) {
          map.removeLayer(routePolylineRef.current);
          routePolylineRef.current = null;
        }
        return;
      }

      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(
              (c: [number, number]) => [c[1], c[0]] as [number, number]
            );

            if (routePolylineRef.current) {
              routePolylineRef.current.setLatLngs(coords);
            } else {
              routePolylineRef.current = L.polyline(coords, {
                color: '#800020', // FlowJeep Maroon accent
                weight: 5,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }).addTo(map);
            }

            if (fitBounds) {
              const bounds = L.latLngBounds([
                [pickup.lat, pickup.lng],
                [dest.lat, dest.lng],
              ]);
              map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
            }
            return;
          }
        }
      } catch {
        // ignore
      }

      // Direct corridor fallback
      const directCoords: [number, number][] = [
        [pickup.lat, pickup.lng],
        [dest.lat, dest.lng],
      ];
      if (routePolylineRef.current) {
        routePolylineRef.current.setLatLngs(directCoords);
      } else {
        routePolylineRef.current = L.polyline(directCoords, {
          color: '#800020',
          weight: 4,
          dashArray: '6, 8',
          opacity: 0.85,
        }).addTo(map);
      }

      if (fitBounds) {
        const bounds = L.latLngBounds([
          [pickup.lat, pickup.lng],
          [dest.lat, dest.lng],
        ]);
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
      }
    },
    []
  );

  // 100% Offline, Instant Synchronous Snapping for Pickup Point
  const handleSetPickupPoint = useCallback(
    (rawLat: number, rawLng: number, explicitName?: string, animate = true) => {
      // Synchronous mathematical projection
      const projected = projectToNearestCorridor(rawLat, rawLng);
      const newCoords = { lat: projected.lat, lng: projected.lng };

      setPickupCoords(newCoords);

      // Save projected coordinates to localStorage under flowjeep_pickup_coords
      try {
        localStorage.setItem('flowjeep_pickup_coords', JSON.stringify(newCoords));
      } catch {
        // ignore
      }

      const map = mapInstanceRef.current;
      if (map) {
        if (!pickupMarkerRef.current) {
          const pickupIcon = L.divIcon({
            className: 'custom-pickup-pin',
            html: `
              <div class="relative flex items-center justify-center cursor-grab active:cursor-grabbing filter drop-shadow-[0_4px_8px_rgba(2,136,209,0.55)] select-none">
                <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.1634 0 0 7.1634 0 16c0 11.2 14.4 24.6 15.35 25.5a0.95 0.95 0 0 0 1.3 0C17.6 40.6 32 27.2 32 16 32 7.1634 24.8366 0 16 0z" fill="#0288D1"/>
                  <circle cx="16" cy="15" r="5.5" fill="#FFFFFF"/>
                </svg>
              </div>
            `,
            iconSize: [32, 42],
            iconAnchor: [16, 42], // sharp bottom tip directly on road
          });

          const marker = L.marker([projected.lat, projected.lng], {
            icon: pickupIcon,
            draggable: true,
            autoPan: true,
          }).addTo(map);

          marker.on('dragend', (e) => {
            isInitialGpsFixRef.current = false;
            const pos = e.target.getLatLng();
            handleSetPickupPointRef.current(pos.lat, pos.lng, undefined, false);
          });

          pickupMarkerRef.current = marker;
        } else {
          // Force pickupMarker.setLatLng(projectedCoords) immediately
          pickupMarkerRef.current.setLatLng([projected.lat, projected.lng]);
        }

        if (animate) {
          map.panTo([projected.lat, projected.lng], { animate: true, duration: 0.4 });
        }
      }

      const resolvedName =
        explicitName ||
        (projected.isSnapped ? `Near ${projected.corridorName}` : 'Custom Pin Location');
      setPickupStopName(resolvedName);
      setPickupInput(resolvedName);

      if (explicitName !== 'Current Location') {
        addRecentLocation({
          name: resolvedName,
          fullAddress: explicitName
            ? (projected.isSnapped ? `Transit Corridor: ${projected.corridorName}` : 'Selected Transit Stop')
            : (projected.isSnapped ? `Near ${projected.corridorName} (Pinned)` : 'Custom Map Pin Location'),
          lat: projected.lat,
          lng: projected.lng,
          isPin: !explicitName,
        });
      }

      try {
        localStorage.setItem('flowjeep_pickup_location_name', resolvedName);
      } catch {
        // ignore
      }

      const currentDest = destinationCoordsRef.current;
      if (currentDest) {
        updateRoutePolyline(newCoords, currentDest, animate);
      }
    },
    [updateRoutePolyline, addRecentLocation]
  );

  useEffect(() => {
    handleSetPickupPointRef.current = handleSetPickupPoint;
  }, [handleSetPickupPoint]);

  // Clear Pickup Point
  const handleClearPickup = () => {
    setPickupInput('');
    setPickupStopName('');
    setPickupCoords(null);
    setSearchResults(POPULAR_TRANSIT_PLACES);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    try {
      localStorage.removeItem('flowjeep_pickup_coords');
      localStorage.removeItem('flowjeep_pickup_location_name');
    } catch {
      // ignore
    }

    if (pickupMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }

    if (routePolylineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
  };

  // 100% Offline, Instant Synchronous Snapping for Destination Point
  const handleSetDestinationPoint = useCallback(
    (rawLat: number, rawLng: number, explicitName?: string, animate = true) => {
      const projected = projectToNearestCorridor(rawLat, rawLng);
      const newCoords = { lat: projected.lat, lng: projected.lng };

      setDestinationCoords(newCoords);

      const map = mapInstanceRef.current;
      if (map) {
        if (!destinationMarkerRef.current) {
          const destIcon = L.divIcon({
            className: 'custom-dest-pin',
            html: `
              <div class="relative flex items-center justify-center cursor-grab active:cursor-grabbing filter drop-shadow-[0_4px_8px_rgba(128,0,32,0.55)] select-none">
                <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.1634 0 0 7.1634 0 16c0 11.2 14.4 24.6 15.35 25.5a0.95 0.95 0 0 0 1.3 0C17.6 40.6 32 27.2 32 16 32 7.1634 24.8366 0 16 0z" fill="#800020"/>
                  <circle cx="16" cy="15" r="5.5" fill="#FFFFFF"/>
                </svg>
              </div>
            `,
            iconSize: [32, 42],
            iconAnchor: [16, 42], // sharp bottom tip directly on road
          });

          const marker = L.marker([projected.lat, projected.lng], {
            icon: destIcon,
            draggable: true,
            autoPan: true,
          }).addTo(map);

          marker.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            handleSetDestinationPointRef.current(pos.lat, pos.lng, undefined, false);
          });

          destinationMarkerRef.current = marker;
        } else {
          destinationMarkerRef.current.setLatLng([projected.lat, projected.lng]);
        }
      }

      const resolvedName =
        explicitName ||
        (projected.isSnapped ? `Near ${projected.corridorName}` : 'Custom Pin Location');
      setDestinationName(resolvedName);
      setDestinationInput(resolvedName);

      addRecentLocation({
        name: resolvedName,
        fullAddress: explicitName
          ? (projected.isSnapped ? `Transit Corridor: ${projected.corridorName}` : 'Destination Stop')
          : (projected.isSnapped ? `Near ${projected.corridorName} (Pinned)` : 'Custom Destination Pin'),
        lat: projected.lat,
        lng: projected.lng,
        isPin: !explicitName,
      });

      const currentPickup = pickupCoordsRef.current;
      if (currentPickup) {
        updateRoutePolyline(currentPickup, newCoords, animate);
      } else if (map && animate) {
        map.panTo([projected.lat, projected.lng], { animate: true, duration: 0.4 });
      }

      setIsSearchActive(false);
    },
    [updateRoutePolyline, addRecentLocation]
  );

  useEffect(() => {
    handleSetDestinationPointRef.current = handleSetDestinationPoint;
  }, [handleSetDestinationPoint]);

  // Keep route polyline continuously synchronized whenever either pin coordinate changes
  useEffect(() => {
    if (pickupCoords && destinationCoords) {
      updateRoutePolyline(pickupCoords, destinationCoords, false);
    } else if (!destinationCoords && routePolylineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
  }, [
    pickupCoords?.lat,
    pickupCoords?.lng,
    destinationCoords?.lat,
    destinationCoords?.lng,
    updateRoutePolyline,
  ]);

  // Clear Destination Point
  const handleClearDestination = () => {
    setDestinationInput('');
    setDestinationName('');
    setDestinationCoords(null);
    setSearchResults(POPULAR_TRANSIT_PLACES);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (destinationMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }

    if (routePolylineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (pickupCoords && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([pickupCoords.lat, pickupCoords.lng], {
        animate: true,
        duration: 0.4,
      });
    }
  };

  // High-accuracy GPS options
  const geoOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  };

  // Update live passenger position
  const updateUserLivePosition = (
    lat: number,
    lng: number,
    accuracy: number = 18,
    shouldCenter = false
  ) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const coords: [number, number] = [lat, lng];

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(coords);
    }

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng(coords);
      accuracyCircleRef.current.setRadius(Math.max(accuracy, 12));
    } else {
      accuracyCircleRef.current = L.circle(coords, {
        radius: Math.max(accuracy, 12),
        color: '#0288D1',
        fillColor: '#38BDF8',
        fillOpacity: 0.15,
        weight: 1.5,
      }).addTo(map);
    }

    const newCoords = { lat, lng };
    userCoordsRef.current = newCoords;
    setUserCoords(newCoords);
    try {
      localStorage.setItem('flowjeep_saved_coords', JSON.stringify(newCoords));
    } catch {
      // ignore
    }

    if (shouldCenter) {
      const currentCenter = map.getCenter();
      if (currentCenter.distanceTo(coords) > 20) {
        map.panTo(coords, { animate: true, duration: 0.6 });
      }
    }
  };

  // Graceful device GPS acquisition
  const requestDeviceGps = (forceCenter = false, updatePickup = false) => {
    if (!navigator.geolocation) return;

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;

        updateUserLivePosition(latitude, longitude, accuracy, forceCenter);

        // Draggable pickup pin defaults to current user location of passenger on initial fix,
        // or whenever explicitly requested (e.g. clicking "go to current location")
        if (isInitialGpsFixRef.current || updatePickup || forceCenter) {
          isInitialGpsFixRef.current = false;
          handleSetPickupPointRef.current(latitude, longitude, 'Current Location', forceCenter);
        }

        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          (watchPos) => {
            const { latitude: wLat, longitude: wLng, accuracy: wAcc } = watchPos.coords;
            if (wAcc <= 1000) {
              updateUserLivePosition(wLat, wLng, wAcc, false);
            }
          },
          undefined,
          geoOptions
        );
      },
      () => {
        setIsLocating(false);
        if (forceCenter && pickupCoordsRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.panTo([pickupCoordsRef.current.lat, pickupCoordsRef.current.lng], {
            animate: true,
            duration: 0.4,
          });
        }
      },
      geoOptions
    );
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = pickupCoords ? pickupCoords.lat : defaultCenter[0];
    const initialLng = pickupCoords ? pickupCoords.lng : defaultCenter[1];

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      minZoom: 4,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    const sizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Passenger Live Location Marker (Blue pulse)
    const passengerInitialCoords: [number, number] = userCoords
      ? [userCoords.lat, userCoords.lng]
      : [initialLat, initialLng];

    const passengerIcon = L.divIcon({
      className: 'custom-passenger-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 pointer-events-none select-none">
          <div class="absolute w-8 h-8 bg-sky-400/35 rounded-full animate-ping"></div>
          <div class="relative w-4 h-4 bg-[#0288D1] border-2 border-white rounded-full shadow-md"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const userMarker = L.marker(passengerInitialCoords, {
      icon: passengerIcon,
      draggable: false,
      interactive: false,
    }).addTo(map);
    userMarkerRef.current = userMarker;

    // Pickup Marker with precise road anchor [16, 42]
    if (pickupCoords) {
      const pickupIcon = L.divIcon({
        className: 'custom-pickup-pin',
        html: `
          <div class="relative flex items-center justify-center cursor-grab active:cursor-grabbing filter drop-shadow-[0_4px_8px_rgba(2,136,209,0.55)] select-none">
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.1634 0 0 7.1634 0 16c0 11.2 14.4 24.6 15.35 25.5a0.95 0.95 0 0 0 1.3 0C17.6 40.6 32 27.2 32 16 32 7.1634 24.8366 0 16 0z" fill="#0288D1"/>
              <circle cx="16" cy="15" r="5.5" fill="#FFFFFF"/>
            </svg>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });

      const pickupMarker = L.marker([pickupCoords.lat, pickupCoords.lng], {
        icon: pickupIcon,
        draggable: true,
        autoPan: true,
      }).addTo(map);

      // Instant Synchronous Snapping on dragend
      pickupMarker.on('dragend', (e) => {
        isInitialGpsFixRef.current = false;
        const pos = e.target.getLatLng();
        handleSetPickupPointRef.current(pos.lat, pos.lng, undefined, false);
      });

      pickupMarkerRef.current = pickupMarker;
    }

    // Instant Synchronous Snapping on map click
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isSearchActiveRef.current && activeFieldRef.current === 'destination') {
        handleSetDestinationPointRef.current(e.latlng.lat, e.latlng.lng, undefined, false);
      } else {
        isInitialGpsFixRef.current = false;
        handleSetPickupPointRef.current(e.latlng.lat, e.latlng.lng, undefined, false);
      }
    });

    requestDeviceGps(false);

    return () => {
      clearTimeout(sizeTimer);
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Real Live Vehicle Fleet Telemetry (raw records from Firebase RTDB)
  const [rawTelemetries, setRawTelemetries] = useState<LiveTelemetryRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flowjeep_live_telemetry');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // ignore
        }
      }
    }
    return [];
  });

  // Active time ticker: automatically prunes offline vehicles if ESP32 powers down
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Listen for real-time telemetry updates from Firebase Realtime Database
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = subscribeLiveTelemetry((records) => {
        setRawTelemetries(records);
        try {
          localStorage.setItem('flowjeep_live_telemetry', JSON.stringify(records));
        } catch {
          // ignore
        }
      });
    } catch (err) {
      console.warn('[Firebase RTDB] Live telemetry subscription notice:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Derived active fleet: immediately drops vehicles when ESP32 powers off or is marked offline
  const liveVehicles = useMemo<ModernJeepneyVehicle[]>(() => {
    const HEARTBEAT_TIMEOUT_MS = 20000; // 20s heartbeat staleness window
    return rawTelemetries
      .filter((tel) => {
        // 1. Explicit offline flag
        if (tel.isOnline === false) return false;
        // 2. Staleness timeout: if last heartbeat is older than 20 seconds, the ESP32 is powered off
        if (tel.lastUpdate && currentTime - tel.lastUpdate > HEARTBEAT_TIMEOUT_MS) {
          return false;
        }
        return true;
      })
      .map((tel) => {
        const coord: [number, number] = tel.currentCoord || [14.6544, 120.9839];
        return {
          id: tel.jeepneyId,
          routeId: tel.routeId || 'route-1',
          routeCode: tel.routeCode || 'Route 1',
          routeName: tel.routeName || 'Baclaran – Monumento',
          plateNumber: tel.plateNumber || 'NDL-8421',
          model: 'Modern Jeepney',
          isAircon: true,
          totalSeats: Number(tel.totalSeats) || 22,
          occupiedSeats: Number(tel.occupiedSeats) || 0,
          standingAllowed: true,
          speedKmh: Number(tel.speedKmh) || 20,
          currentCoord: coord,
          headingDegrees: Number(tel.headingDegrees) || 0,
        };
      });
  }, [rawTelemetries, currentTime]);

  // Live Vehicle Filtering: Strictly by pickup AND active destination with actual live vehicle telemetry
  const activeFleet = liveVehicles;
  const effectivePickup = pickupCoords || userCoords;

  const matchingVehicles = effectivePickup
    ? filterVehiclesForJourney(effectivePickup, destinationCoords, activeFleet)
    : [];

  // If filtered journey vehicles exist, show them; otherwise display all active fleet vehicles on the map
  const activeDisplayFleet = matchingVehicles.length > 0
    ? matchingVehicles
    : activeFleet.map((v) => {
        let distKm = 0.8;
        if (effectivePickup && v.currentCoord) {
          const latDist = (v.currentCoord[0] - effectivePickup.lat) * 111.32;
          const lngDist = (v.currentCoord[1] - effectivePickup.lng) * 111.32 * Math.cos((effectivePickup.lat * Math.PI) / 180);
          distKm = Math.sqrt(latDist * latDist + lngDist * lngDist);
        }
        const eta = Math.max(1, Math.round((distKm / 22) * 60));
        return {
          vehicle: v,
          etaMinutes: eta,
          distanceToPickupKm: parseFloat(distKm.toFixed(1)),
        };
      });

  // Computed display vehicles: ONLY jeeps covering the pickup and destination area
  const displayVehicles: DisplayJeepney[] = activeDisplayFleet.map(
    ({ vehicle, etaMinutes, distanceToPickupKm }, idx) => {
      const isDark = idx % 2 === 0;
      const distText =
        distanceToPickupKm < 1
          ? `${Math.round(distanceToPickupKm * 1000)}m away`
          : `${distanceToPickupKm.toFixed(1)}km away`;
      return {
        id: vehicle.id,
        routeCode: vehicle.routeCode.startsWith('Route ')
          ? `R-${vehicle.routeCode.replace('Route ', '').padStart(2, '0')}`
          : vehicle.routeCode,
        isDarkBadge: isDark,
        routeName: vehicle.routeName,
        plateNumber: vehicle.plateNumber,
        occupiedSeats: vehicle.occupiedSeats,
        totalSeats: vehicle.totalSeats,
        etaMinutes,
        distanceText: distText,
        coord: vehicle.currentCoord,
      };
    }
  );

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    vehicleMarkersRef.current.forEach((marker) => {
      map.removeLayer(marker);
    });
    vehicleMarkersRef.current.clear();

    displayVehicles.forEach((item) => {
      const isFull = item.occupiedSeats >= item.totalSeats;
      const vehicleIcon = L.divIcon({
        className: 'custom-jeep-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer select-none filter drop-shadow-md hover:scale-105 transition-transform">
            <div class="px-2.5 py-1 bg-white border border-[#800020]/20 rounded-full shadow-md flex items-center space-x-1.5 backdrop-blur-xs">
              <span class="w-2 h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-[#800020] animate-pulse'}"></span>
              <span class="text-[11px] font-bold text-slate-800">${item.routeCode}</span>
              <span class="text-[9.5px] font-semibold text-[#800020] bg-[#800020]/[0.06] px-1.5 py-0.5 rounded border border-[#800020]/15">${item.plateNumber}</span>
            </div>
          </div>
        `,
        iconSize: [95, 30],
        iconAnchor: [47, 15],
      });

      const marker = L.marker([item.coord[0], item.coord[1]], {
        icon: vehicleIcon,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 2px; min-width: 170px;">
          <div style="font-weight: 800; color: #800020; font-size: 14px; margin-bottom: 2px;">
            ${item.routeCode} &bull; ${item.plateNumber}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            ${item.routeName}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: ${isFull ? '#fef2f2' : '#ecfdf5'}; border-radius: 8px; border: 1px solid ${isFull ? '#fecaca' : '#a7f3d0'};">
            <span style="font-size: 11.5px; font-weight: 700; color: ${isFull ? '#dc2626' : '#059669'};">
              ● ${item.occupiedSeats} / ${item.totalSeats} seats
            </span>
            <span style="font-size: 10px; color: #64748b;">
              ${isFull ? 'FULL' : `${item.totalSeats - item.occupiedSeats} left`}
            </span>
          </div>
          <div style="margin-top: 6px; font-size: 11px; color: #475569; font-weight: 600;">
            ETA: ~${item.etaMinutes} min (${item.distanceText})
          </div>
        </div>
      `);

      marker.on('click', () => {
        map.panTo([item.coord[0], item.coord[1]], { animate: true, duration: 0.5 });
      });

      vehicleMarkersRef.current.set(item.id, marker);
    });
  }, [displayVehicles, pickupCoords?.lat, pickupCoords?.lng, destinationCoords?.lat, destinationCoords?.lng]);

  // Background online geocoding with Photon + Nominatim fallback (non-blocking)
  const triggerOnlineSearch = useCallback((trimmed: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!trimmed || trimmed.length < 2) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Fast OpenStreetMap-backed Photon query (sub-300ms, CORS open)
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          trimmed
        )}&lat=14.65&lon=121.05&limit=8`;

        const res = await fetch(photonUrl, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            const onlinePlaces: TransitPlace[] = data.features.map((f: any) => {
              const p = f.properties || {};
              const title = p.name || p.street || 'Transit Point';
              const parts = [p.street, p.district, p.city, p.state].filter(Boolean);
              return {
                name: title,
                fullAddress: parts.join(', ') || 'Metro Manila, Philippines',
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
              };
            });

            // Merge local places + online places avoiding duplicates
            const local = searchLocalTransitPlaces(trimmed);
            const combined = [...local];
            for (const op of onlinePlaces) {
              const exists = combined.some(
                (c) =>
                  c.name.toLowerCase() === op.name.toLowerCase() ||
                  (Math.abs(c.lat - op.lat) < 0.001 && Math.abs(c.lng - op.lng) < 0.001)
              );
              if (!exists) {
                combined.push(op);
              }
            }
            setSearchResults(combined.slice(0, 10));
            setIsSearching(false);
            return;
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }

      // Fallback to Nominatim if Photon yields no results
      try {
        const query = `${trimmed} Metro Manila Philippines`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          const parsed: TransitPlace[] = data.map((item: any) => {
            const parts = item.display_name.split(',');
            const title = item.name || parts[0] || 'Transit Point';
            const fullAddress = parts.slice(1, 4).join(',').trim();
            return {
              name: title,
              fullAddress: fullAddress || parts.slice(1).join(',').trim(),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });

          const local = searchLocalTransitPlaces(trimmed);
          const combined = [...local];
          for (const np of parsed) {
            const exists = combined.some(
              (c) =>
                c.name.toLowerCase() === np.name.toLowerCase() ||
                (Math.abs(c.lat - np.lat) < 0.001 && Math.abs(c.lng - np.lng) < 0.001)
            );
            if (!exists) {
              combined.push(np);
            }
          }
          setSearchResults(combined.slice(0, 10));
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      } finally {
        setIsSearching(false);
      }
    }, 200);
  }, []);

  // Instant Local Search + Multi-Source Online Autocomplete
  const handleQueryChange = (val: string, field: 'pickup' | 'destination') => {
    if (field === 'pickup') {
      setPickupInput(val);
    } else {
      setDestinationInput(val);
    }

    const trimmed = val.trim();
    if (!trimmed) {
      setSearchResults(POPULAR_TRANSIT_PLACES);
      setIsSearching(false);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      return;
    }

    // 1. Instant local search (0ms delay) - always immediately shows matching places!
    const localResults = searchLocalTransitPlaces(trimmed);
    if (localResults.length > 0) {
      setSearchResults(localResults);
    } else {
      setSearchResults(POPULAR_TRANSIT_PLACES.slice(0, 4));
    }

    // 2. Fetch live online points to expand/refine results
    triggerOnlineSearch(trimmed);
  };

  // Immediate places population upon focusing an input field
  const handleFocusField = (field: 'pickup' | 'destination') => {
    setIsSearchActive(true);
    setActiveField(field);

    const currentVal = field === 'pickup' ? pickupInput : destinationInput;
    const trimmed = currentVal.trim();

    if (!trimmed || trimmed.toLowerCase().startsWith('near ')) {
      setSearchResults(POPULAR_TRANSIT_PLACES);
    } else {
      const localMatches = searchLocalTransitPlaces(trimmed);
      setSearchResults(localMatches.length > 0 ? localMatches : POPULAR_TRANSIT_PLACES);
      triggerOnlineSearch(trimmed);
    }
  };

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    // 1. Immediately move the draggable pickup pin to the current user location and pan map
    if (userCoordsRef.current) {
      handleSetPickupPointRef.current(
        userCoordsRef.current.lat,
        userCoordsRef.current.lng,
        'Current Location',
        true
      );
    }
    // 2. Fetch fresh device GPS fix and ensure pickup pin snaps to that location
    requestDeviceGps(true, true);
  };

  const handleTabClick = (tab: 'home' | 'waiting' | 'forecast' | 'profile') => {
    setActiveTab(tab);
    onNavigateTab?.(tab);
  };

  // Re-invalidate map bounds when commuter returns to Home map view
  useEffect(() => {
    if (activeTab === 'home' && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }
  }, [activeTab]);

  // Drag handle gesture handlers for the bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;

    // Swiping down -> minimize
    if (deltaY > 40 && !isSheetMinimized) {
      setIsSheetMinimized(true);
      touchStartYRef.current = null;
    }
    // Swiping up -> expand
    else if (deltaY < -40 && isSheetMinimized) {
      setIsSheetMinimized(false);
      touchStartYRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartYRef.current = null;
  };

  // Color helper based on active input field
  const isPickupActive = activeField === 'pickup';

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* 1. Full-Screen Interactive Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Home Map View */}
      {activeTab === 'home' && (
        <>
          {/* 2. Production Dual-Input Route Search Panel */}
          <div className="relative z-20 w-full px-4 pt-3 pointer-events-none">
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100/90 p-3.5 pointer-events-auto transition-all">
          {/* Top Row: Menu / Back + Route Visualizer + Two Controlled Inputs */}
          <div className="flex items-start space-x-3">
            {/* Action Icon: Hamburger or Back */}
            <button
              type="button"
              onClick={() => {
                if (isSearchActive) {
                  setIsSearchActive(false);
                  setSearchResults([]);
                } else {
                  setIsMenuOpen(true);
                  onOpenMenu?.();
                }
              }}
              className="p-2 mt-1 text-slate-700 hover:text-slate-900 active:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label={isSearchActive ? 'Close search' : 'Open navigation menu'}
            >
              {isSearchActive ? (
                <X className="w-5 h-5 text-slate-700" />
              ) : (
                <Menu className="w-5 h-5 text-slate-700" />
              )}
            </button>

            {/* FlowJeep Minimalist Vertical Route Connector */}
            <div className="flex flex-col items-center pt-2.5 pb-1 shrink-0">
              {/* Blue Pickup Node */}
              <div className="w-3.5 h-3.5 rounded-full bg-[#0288D1] border-2 border-white shadow-2xs"></div>
              {/* Minimalist dashed connector */}
              <div className="w-0.5 h-7 border-l-2 border-dashed border-slate-300 my-1"></div>
              {/* FlowJeep Maroon Destination Node (#800020) */}
              <div className="w-3.5 h-3.5 rounded-full bg-[#800020] border-2 border-white shadow-2xs"></div>
            </div>

            {/* Two Connected Input Fields */}
            <div className="flex-1 flex flex-col space-y-2">
              {/* Pickup Stop Controlled Input */}
              <div
                className={`relative flex items-center bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white rounded-xl border px-3 py-1.5 transition-all ${
                  isSearchActive && isPickupActive
                    ? 'ring-2 ring-[#0288D1]/25 border-[#0288D1]'
                    : 'border-slate-200/80'
                }`}
              >
                <input
                  type="text"
                  value={pickupInput}
                  onFocus={() => handleFocusField('pickup')}
                  onChange={(e) => handleQueryChange(e.target.value, 'pickup')}
                  placeholder="Enter pickup stop or location"
                  className="w-full bg-transparent text-[13.5px] font-medium text-slate-800 placeholder:text-slate-400 outline-none pr-6 truncate"
                />
                {pickupInput && (
                  <button
                    type="button"
                    onClick={handleClearPickup}
                    className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
                    title="Clear pickup stop"
                    aria-label="Clear pickup stop"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Destination Controlled Input */}
              <div
                className={`relative flex items-center bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white rounded-xl border px-3 py-1.5 transition-all ${
                  isSearchActive && !isPickupActive
                    ? 'ring-2 ring-[#800020]/25 border-[#800020]'
                    : 'border-slate-200/80'
                }`}
              >
                <input
                  type="text"
                  value={destinationInput}
                  onFocus={() => handleFocusField('destination')}
                  onChange={(e) => handleQueryChange(e.target.value, 'destination')}
                  placeholder="Enter destination or street"
                  className="w-full bg-transparent text-[13.5px] font-medium text-slate-800 placeholder:text-slate-400 outline-none pr-6 truncate"
                />
                {destinationInput && (
                  <button
                    type="button"
                    onClick={handleClearDestination}
                    className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
                    title="Clear destination"
                    aria-label="Clear destination"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Expandable Live Dynamic Search Autocomplete Panel */}
          {isSearchActive && (() => {
            const activeInput = (isPickupActive ? pickupInput : destinationInput).trim();
            const isDefaultOrEmpty =
              activeInput === '' || activeInput.toLowerCase().startsWith('near ');

            // If user is searching text, filter matching recents (exclude current location from destination search)
            const rawRecents = !isPickupActive
              ? recentLocations.filter(
                  (loc) =>
                    loc.name.toLowerCase() !== 'current location' &&
                    loc.name.toLowerCase() !== 'my current location' &&
                    loc.fullAddress.toLowerCase() !== 'current location'
                )
              : recentLocations;

            const matchingRecents = !isDefaultOrEmpty
              ? rawRecents.filter(
                  (loc) =>
                    loc.name.toLowerCase().includes(activeInput.toLowerCase()) ||
                    loc.fullAddress.toLowerCase().includes(activeInput.toLowerCase())
                )
              : rawRecents;

            return (
              <div className="mt-3 pt-3 border-t border-slate-100 max-h-[50vh] overflow-y-auto no-scrollbar space-y-3">
                {/* 1. RECENT PINS & AREAS SECTION */}
                {isDefaultOrEmpty && matchingRecents.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-1.5 py-1 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <Clock className={`w-3.5 h-3.5 ${isPickupActive ? 'text-[#0288D1]' : 'text-[#800020]'}`} />
                        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                          Recent Pins & Areas
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearRecents}
                        className="text-[10px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer uppercase tracking-wider"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 bg-slate-900/[0.025] rounded-xl overflow-hidden border border-slate-900/[0.06] shadow-2xs">
                      {matchingRecents.slice(0, 5).map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => {
                            if (isPickupActive) {
                              handleSetPickupPoint(loc.lat, loc.lng, loc.name, true);
                              if (!destinationCoords) {
                                handleFocusField('destination');
                              } else {
                                setIsSearchActive(false);
                              }
                            } else {
                              handleSetDestinationPoint(loc.lat, loc.lng, loc.name, true);
                              setIsSearchActive(false);
                            }
                          }}
                          className="w-full px-2.5 py-2 flex items-start space-x-3 text-left hover:bg-slate-900/[0.03] rounded-lg cursor-pointer transition-colors group"
                        >
                          <div
                            className={`w-7 h-7 mt-0.5 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                              isPickupActive
                                ? 'bg-[#0288D1] text-white group-hover:bg-[#0277bd]'
                                : 'bg-[#800020] text-white group-hover:bg-[#6b001a]'
                            }`}
                          >
                            {loc.isPin ? <MapPin className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center space-x-2">
                              <p className="text-[13px] font-semibold text-slate-800 truncate leading-snug">
                                {loc.name}
                              </p>
                              <span
                                className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider shadow-2xs ${
                                  loc.isPin
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-slate-800 text-white'
                                }`}
                              >
                                {loc.isPin ? 'Pinned' : 'Recent'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {loc.fullAddress}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* If searching actively and there are matching recents, show them on top */}
                {!isDefaultOrEmpty && matchingRecents.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-1.5 px-1.5 py-1 mb-1">
                      <Clock className={`w-3.5 h-3.5 ${isPickupActive ? 'text-[#0288D1]' : 'text-[#800020]'}`} />
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                        Recent Matches
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100 bg-slate-900/[0.025] rounded-xl overflow-hidden border border-slate-900/[0.06] mb-2 shadow-2xs">
                      {matchingRecents.slice(0, 3).map((loc) => (
                        <button
                          key={`match-${loc.id}`}
                          type="button"
                          onClick={() => {
                            if (isPickupActive) {
                              handleSetPickupPoint(loc.lat, loc.lng, loc.name, true);
                              if (!destinationCoords) {
                                handleFocusField('destination');
                              } else {
                                setIsSearchActive(false);
                              }
                            } else {
                              handleSetDestinationPoint(loc.lat, loc.lng, loc.name, true);
                              setIsSearchActive(false);
                            }
                          }}
                          className="w-full px-2.5 py-2 flex items-start space-x-3 text-left hover:bg-slate-900/[0.03] rounded-lg cursor-pointer transition-colors group"
                        >
                          <div
                            className={`w-7 h-7 mt-0.5 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                              isPickupActive
                                ? 'bg-[#0288D1] text-white group-hover:bg-[#0277bd]'
                                : 'bg-[#800020] text-white group-hover:bg-[#6b001a]'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-[13px] font-semibold text-slate-800 truncate leading-snug">
                              {loc.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {loc.fullAddress}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. POPULAR STATIONS & TRANSIT HUBS SECTION / SEARCH RESULTS */}
                <div>
                  <div className="flex items-center justify-between px-1.5 py-1 mb-1">
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                      {isDefaultOrEmpty
                        ? 'Popular Stations & Transit Hubs'
                        : 'Matching Transit Corridors & Places'}
                    </span>
                    {isSearching && (
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Loader2
                          className={`w-3.5 h-3.5 animate-spin ${
                            isPickupActive ? 'text-[#0288D1]' : 'text-[#800020]'
                          }`}
                        />
                        <span className="text-[10.5px]">Updating...</span>
                      </div>
                    )}
                  </div>

                  {/* Autocomplete Places List */}
                  {(() => {
                    const showCurrentLocationPickup =
                      isPickupActive &&
                      (isDefaultOrEmpty ||
                        'current location'.includes(activeInput.toLowerCase()) ||
                        'use current location'.includes(activeInput.toLowerCase()) ||
                        'my location'.includes(activeInput.toLowerCase()) ||
                        'near me'.includes(activeInput.toLowerCase()) ||
                        'gps'.includes(activeInput.toLowerCase()));

                    // Filter search results so destination/drop-off never contains 'current location'
                    const displaySearchResults = !isPickupActive
                      ? searchResults.filter(
                          (res) =>
                            res.name.toLowerCase() !== 'current location' &&
                            res.name.toLowerCase() !== 'my current location'
                        )
                      : searchResults;

                    if (displaySearchResults.length > 0 || showCurrentLocationPickup) {
                      return (
                        <div className="divide-y divide-slate-100">
                          {/* Current Location Option ONLY for Pickup Search */}
                          {showCurrentLocationPickup && (
                            <button
                              type="button"
                              onClick={() => {
                                if (userCoords) {
                                  handleSetPickupPoint(userCoords.lat, userCoords.lng, 'Current Location', true);
                                } else {
                                  requestDeviceGps(true, true);
                                }
                                if (!destinationCoords) {
                                  handleFocusField('destination');
                                } else {
                                  setIsSearchActive(false);
                                }
                              }}
                              className="w-full px-2.5 py-2.5 flex items-start space-x-3 text-left hover:bg-slate-900/[0.03] rounded-xl cursor-pointer transition-colors group"
                            >
                              <div className="w-7 h-7 mt-0.5 rounded-full flex items-center justify-center shrink-0 bg-[#0288D1] text-white shadow-2xs group-hover:bg-[#0277bd] transition-colors">
                                <Crosshair className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <div className="flex items-center space-x-2">
                                  <p className="text-[13px] font-bold text-slate-800 group-hover:text-[#0288D1] transition-colors truncate leading-snug">
                                    Current Location
                                  </p>
                                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#0288D1] text-white shadow-2xs">
                                    GPS
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {userCoords
                                    ? 'Use your detected GPS position on map'
                                    : 'Auto-detect nearest road corridor & passenger telemetry'}
                                </p>
                              </div>
                            </button>
                          )}

                          {displaySearchResults.map((res, i) => (
                            <button
                              key={`${res.name}-${res.lat}-${i}`}
                              type="button"
                              onClick={() => {
                                if (isPickupActive) {
                                  handleSetPickupPoint(res.lat, res.lng, res.name, true);
                                  if (!destinationCoords) {
                                    handleFocusField('destination');
                                  } else {
                                    setIsSearchActive(false);
                                  }
                                } else {
                                  handleSetDestinationPoint(res.lat, res.lng, res.name, true);
                                  setIsSearchActive(false);
                                }
                              }}
                              className="w-full px-2.5 py-2.5 flex items-start space-x-3 text-left hover:bg-slate-900/[0.03] rounded-xl cursor-pointer transition-colors group"
                            >
                              {/* Dynamic symbol color: Blue for pickup, Maroon for destination */}
                              <div
                                className={`w-7 h-7 mt-0.5 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                                  isPickupActive
                                    ? 'bg-[#0288D1] text-white group-hover:bg-[#0277bd]'
                                    : 'bg-[#800020] text-white group-hover:bg-[#6b001a]'
                                }`}
                              >
                                <MapPin className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-[13px] font-semibold text-slate-800 truncate leading-snug">
                                  {res.name}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {res.fullAddress}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      );
                    }

                    if (isSearching) {
                      return (
                        <div className="py-6 flex flex-col items-center justify-center space-y-2 text-slate-400">
                          <Loader2
                            className={`w-5 h-5 animate-spin ${
                              isPickupActive ? 'text-[#0288D1]' : 'text-[#800020]'
                            }`}
                          />
                          <span className="text-xs font-medium">Searching transit corridors...</span>
                        </div>
                      );
                    }

                    if (matchingRecents.length === 0) {
                      return (
                        <div className="py-5 px-3 text-center">
                          <p className="text-[12.5px] font-medium text-slate-500">
                            No matching transit points found
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Try searching for a station (e.g., SM North, UST, Quiapo, Cubao, Philcoa)
                          </p>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 3. Floating Map Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-16 z-10 flex flex-col space-y-2.5 pointer-events-auto">
        <button
          onClick={handleRecenter}
          disabled={isLocating}
          className={`w-11 h-11 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 rounded-full shadow-md border border-slate-100 flex items-center justify-center transition-all cursor-pointer ${
            isLocating ? 'ring-2 ring-[#0288D1]' : ''
          }`}
          aria-label="Recenter on live passenger GPS"
          title="Recenter on Live GPS"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 text-[#0288D1] animate-spin" />
          ) : (
            <Crosshair className={`w-5 h-5 ${userCoords ? 'text-[#0288D1]' : 'text-slate-600'}`} />
          )}
        </button>

        <div className="bg-white rounded-full shadow-md border border-slate-100 flex flex-col items-center overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="w-11 h-10 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors border-b border-slate-100 cursor-pointer"
            aria-label="Zoom in"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-11 h-10 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            aria-label="Zoom out"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Interactive Draggable / Minimizable Bottom Sheet Drawer */}
      <div className="mt-auto relative z-10 w-full flex flex-col pointer-events-auto">
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] border-t border-slate-100 px-5 pt-2 pb-2.5 transition-all duration-300 ease-in-out"
        >
          {/* Centered Drag Handle Pill */}
          <div
            onClick={() => setIsSheetMinimized(!isSheetMinimized)}
            className="w-full py-1.5 flex justify-center cursor-grab active:cursor-grabbing"
            title={isSheetMinimized ? 'Expand drawer' : 'Minimize drawer'}
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full hover:bg-slate-400 transition-colors" />
          </div>

          {/* Header Row: Title + 2 EN ROUTE + ~14 min + Collapse/Expand */}
          <div
            onClick={() => setIsSheetMinimized(!isSheetMinimized)}
            className="flex items-center justify-between py-1 cursor-pointer select-none gap-2"
          >
            <div className="flex items-center space-x-2 shrink-0">
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Live Jeepneys
              </h2>
              <span className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-[#800020] text-white rounded-full text-[10.5px] font-extrabold tracking-tight whitespace-nowrap shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>{displayVehicles.length} EN ROUTE</span>
              </span>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {displayVehicles.length > 0 && (
                <div className="flex items-center space-x-1 px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-[#800020] rounded-full text-[11px] font-black whitespace-nowrap shadow-2xs">
                  <Clock className="w-3 h-3 text-[#800020]" />
                  <span>~{displayVehicles[0].etaMinutes} min</span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSheetMinimized(!isSheetMinimized);
                }}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label={isSheetMinimized ? 'Expand drawer' : 'Collapse drawer'}
              >
                <ChevronUp
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isSheetMinimized ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Live Approaching Jeepney Cards */}
          {!isSheetMinimized && displayVehicles.length > 0 && (
            <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {displayVehicles.map((jeep) => {
                const isFull = jeep.occupiedSeats >= jeep.totalSeats;
                const available = Math.max(0, jeep.totalSeats - jeep.occupiedSeats);
                return (
                  <div
                    key={jeep.id}
                    onClick={() => {
                      if (mapInstanceRef.current && jeep.coord) {
                        mapInstanceRef.current.panTo([jeep.coord[0], jeep.coord[1]], {
                          animate: true,
                          duration: 0.5,
                        });
                      }
                    }}
                    className="p-3 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-2xl flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-[#800020] text-white flex items-center justify-center font-extrabold text-xs shadow-2xs">
                        {jeep.routeCode}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[13px] font-bold text-slate-900 leading-tight">
                            {jeep.plateNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                            {jeep.routeName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                              isFull
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <Users className="w-3 h-3" />
                            <span>
                              {jeep.occupiedSeats} / {jeep.totalSeats} seats
                            </span>
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-medium">
                            {available > 0 ? `${available} left` : 'Full'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[13px] font-extrabold text-[#800020]">
                        ~{jeep.etaMinutes} min
                      </div>
                      <div className="text-[10.5px] text-slate-400 font-medium">
                        {jeep.distanceText}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State when no jeepneys active */}
          {!isSheetMinimized && displayVehicles.length === 0 && (
            <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center space-x-3 text-slate-500">
              <div className="w-8 h-8 rounded-xl bg-slate-200/70 flex items-center justify-center shrink-0 text-slate-400">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[12.5px] font-bold text-slate-700">No jeepneys currently active</p>
                <p className="text-[11px] text-slate-400">Waiting for live fleet vehicles to broadcast GPS along this corridor</p>
              </div>
            </div>
          )}

          {/* Quick-Action: "I Am Waiting" Trigger Button */}
          {!isSheetMinimized && (
            <button
              type="button"
              onClick={() => {
                if (!pickupCoords) {
                  if (userCoords) {
                    handleSetPickupPoint(userCoords.lat, userCoords.lng, 'My Current Location');
                  } else {
                    requestDeviceGps(true);
                  }
                }
                setActiveTab('waiting');
                setDrawerActiveItem('Wait for a Jeep');
              }}
              className="mt-2.5 w-full bg-[#800020] hover:bg-[#6b001a] active:scale-[0.99] text-white font-bold rounded-2xl py-2.5 px-3.5 shadow-md flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                </div>
                <div className="text-left">
                  <div className="text-[13px] font-extrabold leading-tight tracking-tight">
                    I Am Waiting
                  </div>
                  <div className="text-[10px] text-rose-200 font-medium">
                    {displayVehicles.length > 0
                      ? `${displayVehicles.length} ${
                          displayVehicles.length === 1 ? 'Jeep' : 'Jeeps'
                        } Approaching Corridor`
                      : 'Signal approaching drivers on this route'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 bg-white/20 px-2.5 py-1 rounded-full text-[10.5px] font-bold tracking-tight">
                <span>View Feed</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )}
        </div>
      </div>
      </>
    )}

    {/* 3. Forecast Screen View (replacing MAP navigation screen) */}
    {activeTab === 'forecast' && (
      <div className="relative z-20 flex-1 w-full overflow-hidden flex flex-col bg-slate-100">
        <ForecastScreen
          onOpenMenu={() => setIsMenuOpen(true)}
          currentUserCoords={userCoords || pickupCoords}
          userPickupName={pickupStopName}
        />
      </div>
    )}

    {/* 4. "I Am Waiting" Screen View (Replacing Routes screen) */}
    {activeTab === 'waiting' && (
      <WaitingScreen
        pickupCoords={pickupCoords}
        destinationCoords={destinationCoords}
        pickupStopName={pickupStopName}
        destinationName={destinationName}
        onOpenMenu={() => setIsMenuOpen(true)}
        onBackToHome={() => setActiveTab('home')}
        onChangeStop={() => {
          setActiveTab('home');
          setIsSearchActive(true);
        }}
        onTrackOnMap={(coord) => {
          setActiveTab('home');
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo([coord[0], coord[1]], {
              animate: true,
              duration: 0.6,
            });
          }
        }}
        activeFleet={activeFleet}
        userCoords={userCoords}
        onRequestGps={() => requestDeviceGps(true)}
      />
    )}

    {/* 5. Profile Screen View */}
    {activeTab === 'profile' && (
      <div className="relative z-20 flex-1 w-full overflow-hidden flex flex-col bg-slate-100">
        <header className="bg-white border-b border-slate-200/80 px-4 py-3 shrink-0 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="p-1.5 text-slate-700 hover:text-slate-900 active:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-[16px] font-extrabold text-slate-900 leading-tight">
                Commuter Profile
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                FlowJeep Account & Preferences
              </p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center mx-auto text-xl font-bold shadow-md">
              {user?.name ? user.name[0].toUpperCase() : (user?.isGuest ? 'G' : 'C')}
            </div>
            <h3 className="text-[16px] font-bold text-slate-900 mt-2.5">
              {user?.name || (user?.isGuest ? 'Guest Passenger' : 'Commuter')}
            </h3>
            <p className="text-[12px] text-slate-400">
              {user?.email || (user?.isGuest ? 'Guest Session' : 'No email linked')}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
              <div className="bg-slate-900/[0.025] p-2.5 rounded-xl border border-slate-900/[0.06] shadow-2xs">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Account Status
                </span>
                <span className="text-[12px] font-semibold text-[#007A37]">
                  {user?.isGuest ? 'Guest Access' : 'Active Passenger'}
                </span>
              </div>
              <div className="bg-slate-900/[0.025] p-2.5 rounded-xl border border-slate-900/[0.06] shadow-2xs">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Corridor Telemetry
                </span>
                <span className="text-[12px] font-semibold text-[#0288D1]">
                  Connected
                </span>
              </div>
            </div>

            {onLogout && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-[#800020] font-semibold text-[13px] rounded-xl transition-colors cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* 6. Fixed Bottom Navigation Bar (Persistent across all tabs) */}
    <nav className="bg-white border-t border-slate-200/80 px-6 py-2.5 flex items-center justify-between shrink-0 z-30 shadow-xs">
      <button
        onClick={() => handleTabClick('home')}
        className={`flex flex-col items-center py-0.5 transition-colors cursor-pointer ${
          activeTab === 'home' ? 'text-[#800020]' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className={`text-[11px] mt-1 ${activeTab === 'home' ? 'font-bold' : 'font-medium'}`}>Home</span>
      </button>

      <button
        onClick={() => handleTabClick('waiting')}
        className={`flex flex-col items-center py-0.5 transition-colors cursor-pointer ${
          activeTab === 'waiting' ? 'text-[#800020]' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Radio className={`w-5 h-5 ${activeTab === 'waiting' ? 'text-[#800020] animate-pulse' : ''}`} />
        <span className={`text-[11px] mt-1 ${activeTab === 'waiting' ? 'font-bold' : 'font-medium'}`}>
          I Am Waiting
        </span>
      </button>

      {/* Forecast Navigation Destination (Replaces MAP) */}
      <button
        onClick={() => handleTabClick('forecast')}
        className={`flex flex-col items-center py-0.5 transition-colors cursor-pointer ${
          activeTab === 'forecast' ? 'text-[#800020]' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <TrendingUp className="w-5 h-5" />
        <span className={`text-[11px] mt-1 ${activeTab === 'forecast' ? 'font-bold' : 'font-medium'}`}>Forecast</span>
      </button>

      <button
        onClick={() => handleTabClick('profile')}
        className={`flex flex-col items-center py-0.5 transition-colors cursor-pointer ${
          activeTab === 'profile' ? 'text-[#800020]' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <User className="w-5 h-5" />
        <span className={`text-[11px] mt-1 ${activeTab === 'profile' ? 'font-bold' : 'font-medium'}`}>Profile</span>
      </button>
    </nav>

    {/* 7. Navigation Side Drawer */}
    <NavigationDrawer
      isOpen={isMenuOpen}
      onClose={() => setIsMenuOpen(false)}
      activeItem={drawerActiveItem}
      user={user}
      onSelectItem={(item) => {
        setDrawerActiveItem(item);
        if (item === 'Home') setActiveTab('home');
        if (item === 'Wait for a Jeep' || item === 'Waiting' || item === 'I Am Waiting') {
          setActiveTab('waiting');
        }
        if (item === 'Forecast' || item === 'Map') setActiveTab('forecast');
      }}
      onLogout={onLogout}
    />
  </div>
);
};

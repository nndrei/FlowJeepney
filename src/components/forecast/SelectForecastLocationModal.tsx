import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Crosshair,
  Search,
  Check,
  ChevronRight,
  MapPin,
  TrendingUp,
  Bus,
  ArrowLeftRight,
  GraduationCap,
  Store,
  Loader2,
} from 'lucide-react';

export type LocationCategory =
  | 'All'
  | 'Area / Place'
  | 'Corridor'
  | 'Transit Hub'
  | 'Terminal'
  | 'Campus / School'
  | 'Commercial';

export interface ForecastLocationItem {
  id: string;
  name: string;
  category: Exclude<LocationCategory, 'All'>;
  routeSummary: string;
  peakStat: string;
  directionNote: string;
  lat: number;
  lng: number;
  iconType: 'bus' | 'transfer' | 'terminal' | 'campus' | 'commercial' | 'area';
}

export const FORECAST_LOCATIONS_DATA: ForecastLocationItem[] = [
  // Geographic Areas & Municipalities (Corridor-independent)
  {
    id: 'area-malinta',
    name: 'Malinta, Valenzuela City',
    category: 'Area / Place',
    routeSummary: 'MacArthur Highway cor. Maysan Road & Malinta Bayan',
    peakStat: 'Valenzuela',
    directionNote: 'Northern Metro Manila commercial & industrial district',
    lat: 14.6926,
    lng: 120.9645,
    iconType: 'area',
  },
  {
    id: 'area-novaliches-bayan',
    name: 'Novaliches Bayan / Proper',
    category: 'Area / Place',
    routeSummary: 'Quirino Highway cor. Sarmiento St & Susano Rd',
    peakStat: 'Novaliches',
    directionNote: 'Historic commercial center & jeepney transit nexus',
    lat: 14.7226,
    lng: 121.0462,
    iconType: 'area',
  },
  {
    id: 'area-novaliches-qc',
    name: 'Novaliches, Quezon City',
    category: 'Area / Place',
    routeSummary: 'Quirino Highway, Fairview, & Sauyo District',
    peakStat: 'Quezon City',
    directionNote: 'Major residential and commercial district of North QC',
    lat: 14.7209,
    lng: 121.0389,
    iconType: 'area',
  },
  {
    id: 'area-valenzuela',
    name: 'Valenzuela City Center',
    category: 'Area / Place',
    routeSummary: 'MacArthur Highway, Karuhatan, & Gen. T. de Leon',
    peakStat: 'CAMANAVA Hub',
    directionNote: 'CAMANAVA gateway connecting Metro Manila and Bulacan',
    lat: 14.7000,
    lng: 120.9667,
    iconType: 'area',
  },
  {
    id: 'area-quezon-city',
    name: 'Quezon City (Diliman / Central)',
    category: 'Area / Place',
    routeSummary: 'Elliptical Road, East Ave, North Ave, & Quezon Ave',
    peakStat: 'Capital District',
    directionNote: 'Largest city center in Metro Manila',
    lat: 14.6760,
    lng: 121.0437,
    iconType: 'area',
  },
  {
    id: 'area-monumento',
    name: 'Monumento, Caloocan City',
    category: 'Area / Place',
    routeSummary: 'Bonifacio Monument Circle, EDSA cor. Samson Rd & Rizal Ave',
    peakStat: 'Caloocan',
    directionNote: 'Northern capital gateway and major historical landmark',
    lat: 14.6548,
    lng: 120.9841,
    iconType: 'area',
  },
  {
    id: 'area-manila',
    name: 'City of Manila (Ermita / Quiapo)',
    category: 'Area / Place',
    routeSummary: 'Roxas Blvd, Taft Ave, España Blvd, & Quiapo Church',
    peakStat: 'National Capital',
    directionNote: 'Historical capital of the Philippines',
    lat: 14.5995,
    lng: 120.9842,
    iconType: 'area',
  },
  {
    id: 'area-makati',
    name: 'Makati City Center (Ayala / CBD)',
    category: 'Area / Place',
    routeSummary: 'Ayala Ave, Makati Ave, Paseo de Roxas, & EDSA',
    peakStat: 'Financial CBD',
    directionNote: 'Premier financial and business district of the Philippines',
    lat: 14.5547,
    lng: 121.0244,
    iconType: 'area',
  },
  {
    id: 'area-pasig',
    name: 'Pasig City (Ortigas / Kapitolyo)',
    category: 'Area / Place',
    routeSummary: 'Shaw Blvd, Ortigas Ave, C-5, & Kapitolyo',
    peakStat: 'Eastern Metro',
    directionNote: 'Ortigas commercial district and residential areas',
    lat: 14.5764,
    lng: 121.0851,
    iconType: 'area',
  },
  {
    id: 'area-taguig',
    name: 'Taguig / Bonifacio Global City (BGC)',
    category: 'Area / Place',
    routeSummary: '5th Ave, Bonifacio High Street, & McKinley Hill',
    peakStat: 'BGC Hub',
    directionNote: 'Modern financial and urban center',
    lat: 14.5547,
    lng: 121.0509,
    iconType: 'area',
  },
  {
    id: 'area-marikina',
    name: 'Marikina City Center',
    category: 'Area / Place',
    routeSummary: 'Sumulong Hwy, Shoe Ave, & Marikina Riverbanks',
    peakStat: 'Marikina Valley',
    directionNote: 'Eastern NCR shoe capital & transit corridor',
    lat: 14.6507,
    lng: 121.1029,
    iconType: 'area',
  },

  // Transportation Corridors & Hubs
  {
    id: 'loc-1',
    name: 'Quezon Avenue Corridor',
    category: 'Corridor',
    routeSummary: 'Welcome Rotonda to QC Circle via Fisher Mall, EDSA, & Timog Ave',
    peakStat: 'Mon Peak: 95%',
    directionNote: 'Inbound towards España & Manila City ...',
    lat: 14.6425,
    lng: 121.0378,
    iconType: 'bus',
  },
  {
    id: 'loc-2',
    name: 'Commonwealth Avenue Corridor',
    category: 'Corridor',
    routeSummary: 'Philcoa to Litex, Batasan, & SM City Fairview',
    peakStat: 'Mon Peak: 98%',
    directionNote: 'Southbound to Philcoa, QC Circle & Man...',
    lat: 14.6621,
    lng: 121.0548,
    iconType: 'bus',
  },
  {
    id: 'loc-3',
    name: 'Philcoa Transit Hub',
    category: 'Transit Hub',
    routeSummary: 'Primary interchange connecting UP Diliman, Commonwealth, & Quezon Ave',
    peakStat: 'Mon Peak: 96%',
    directionNote: 'Transfers to Buendia / Manila / MRT-3',
    lat: 14.6539,
    lng: 121.0538,
    iconType: 'transfer',
  },
  {
    id: 'loc-4',
    name: 'SM North EDSA / TriNoma Terminal',
    category: 'Terminal',
    routeSummary: 'Major multimodal terminus connecting MRT-3, EDSA Carousel, & North jeeps',
    peakStat: 'Mon Peak: 92%',
    directionNote: 'Dispersal to UP, QC Circle, & Timog',
    lat: 14.6562,
    lng: 121.0291,
    iconType: 'terminal',
  },
  {
    id: 'loc-5',
    name: 'España Boulevard Corridor',
    category: 'Corridor',
    routeSummary: 'Welcome Rotonda to Lerma, Morayta, & Quiapo via UST',
    peakStat: 'Mon Peak: 94%',
    directionNote: 'Westbound University Belt student corridor',
    lat: 14.6098,
    lng: 120.9895,
    iconType: 'bus',
  },
  {
    id: 'loc-6',
    name: 'Cubao / Araneta City Terminal',
    category: 'Terminal',
    routeSummary: 'Aurora Blvd cor. EDSA, Farmers Plaza & Gateway central bays',
    peakStat: 'Mon Peak: 97%',
    directionNote: 'Eastern NCR & Marikina/Rizal connection',
    lat: 14.621,
    lng: 121.053,
    iconType: 'terminal',
  },
  {
    id: 'loc-7',
    name: 'UP Diliman Campus Loop',
    category: 'Campus / School',
    routeSummary: 'University Avenue, Sunken Garden, Vinzons Hall, & Katipunan Gate',
    peakStat: 'Mon Peak: 88%',
    directionNote: 'Internal Ikot / Toki eco-jeep routes',
    lat: 14.6538,
    lng: 121.0685,
    iconType: 'campus',
  },
  {
    id: 'loc-8',
    name: 'University of Santo Tomas (UST)',
    category: 'Campus / School',
    routeSummary: 'España Blvd, Lacson Ave, Dapitan, & P. Noval Gates',
    peakStat: 'Mon Peak: 93%',
    directionNote: 'Student rush convergence point',
    lat: 14.6085,
    lng: 120.989,
    iconType: 'campus',
  },
  {
    id: 'loc-9',
    name: 'Quiapo Plaza Miranda Hub',
    category: 'Transit Hub',
    routeSummary: 'Quezon Blvd, Carriedo LRT-1, & Carlos Palanca transfer point',
    peakStat: 'Mon Peak: 95%',
    directionNote: 'Southbound to Lawton, Taft, & Pasay',
    lat: 14.5988,
    lng: 120.9832,
    iconType: 'transfer',
  },
  {
    id: 'loc-10',
    name: 'Taft Avenue / Vito Cruz Hub',
    category: 'Transit Hub',
    routeSummary: 'DLSU, College of St. Benilde, & LRT-1 Vito Cruz Station',
    peakStat: 'Mon Peak: 91%',
    directionNote: 'Feeder corridor towards Buendia',
    lat: 14.5635,
    lng: 120.9945,
    iconType: 'transfer',
  },
  {
    id: 'loc-11',
    name: 'SM City Fairview Transport Bay',
    category: 'Commercial',
    routeSummary: 'Quirino Highway & Regalado Ave, Fairview Terraces interchange',
    peakStat: 'Mon Peak: 94%',
    directionNote: 'North Caloocan & SJDM Bulacan gateway',
    lat: 14.7335,
    lng: 121.0585,
    iconType: 'commercial',
  },
  {
    id: 'loc-12',
    name: 'Batasan Pambansa / Litex Stop',
    category: 'Corridor',
    routeSummary: 'Commonwealth Ave cor. IBP Road & Litex Public Market',
    peakStat: 'Mon Peak: 96%',
    directionNote: 'High-density residential catchment',
    lat: 14.698,
    lng: 121.085,
    iconType: 'bus',
  },
  {
    id: 'loc-13',
    name: 'Fairview Center Mall (FCM)',
    category: 'Commercial',
    routeSummary: 'Commonwealth Ave, Regalado, & West Fairview access',
    peakStat: 'Mon Peak: 89%',
    directionNote: 'Mid-route high turnover shopping stop',
    lat: 14.7065,
    lng: 121.0715,
    iconType: 'commercial',
  },
  {
    id: 'loc-14',
    name: 'Fisher Mall Quezon Avenue',
    category: 'Commercial',
    routeSummary: 'Quezon Ave cor. Roosevelt (FPJ) Ave & Pantranco junction',
    peakStat: 'Mon Peak: 87%',
    directionNote: 'Interchange for Project 8 routes',
    lat: 14.6318,
    lng: 121.0195,
    iconType: 'commercial',
  },
  {
    id: 'loc-15',
    name: 'FEU / Morayta (Nicanor Reyes)',
    category: 'Campus / School',
    routeSummary: 'España Blvd cor. Morayta, Recto Ave, & Gastambide',
    peakStat: 'Mon Peak: 92%',
    directionNote: 'Direct link to LRT-2 Recto station',
    lat: 14.6045,
    lng: 120.9882,
    iconType: 'campus',
  },
  {
    id: 'loc-16',
    name: 'Gil Puyat / LRT Buendia Terminal',
    category: 'Terminal',
    routeSummary: 'Taft Ave cor. Gil Puyat, provincial buses & Pasay jeeps',
    peakStat: 'Mon Peak: 98%',
    directionNote: 'Major South Metro commuter gateway',
    lat: 14.5542,
    lng: 120.9972,
    iconType: 'terminal',
  },
  {
    id: 'loc-17',
    name: 'Monumento Circle Terminus',
    category: 'Terminal',
    routeSummary: 'Samson Rd cor. Rizal Ave, Caloocan LRT-1 & EDSA Carousel',
    peakStat: 'Mon Peak: 93%',
    directionNote: 'Northern CAMANAVA transit dispersal point',
    lat: 14.6548,
    lng: 120.9841,
    iconType: 'terminal',
  },
  {
    id: 'loc-18',
    name: 'Baguio City Central Terminal',
    category: 'Terminal',
    routeSummary: 'Gov. Pack Road, Session Road, & Burnham Park Terminus',
    peakStat: 'Highland: 16°C',
    directionNote: 'Benguet Cordillera mountain transit gateway',
    lat: 16.4023,
    lng: 120.5960,
    iconType: 'terminal',
  },
  {
    id: 'loc-19',
    name: 'Tagaytay Rotonda Transport Bay',
    category: 'Transit Hub',
    routeSummary: 'Aguinaldo Highway cor. Tagaytay-Calamba Road & Olivarez Plaza',
    peakStat: 'Ridge: 22°C',
    directionNote: 'Cavite-Batangas scenic ridge transit interchange',
    lat: 14.1153,
    lng: 120.9621,
    iconType: 'transfer',
  },
  {
    id: 'loc-20',
    name: 'Clark Freeport / SM Clark Terminal',
    category: 'Terminal',
    routeSummary: 'Manuel A. Roxas Hwy, Clark Global City & North Luzon Expressway',
    peakStat: 'Central Luzon',
    directionNote: 'Angeles City & Pampanga transit interchange',
    lat: 15.1685,
    lng: 120.5794,
    iconType: 'terminal',
  },
  {
    id: 'loc-21',
    name: 'Batangas Grand Terminal & Port',
    category: 'Terminal',
    routeSummary: 'Diversion Road, Bolbok & Batangas Sea Port passenger bays',
    peakStat: 'Port Gateway',
    directionNote: 'Southern Luzon & Mimaropa island connection',
    lat: 13.7845,
    lng: 121.0664,
    iconType: 'terminal',
  },
  {
    id: 'loc-22',
    name: 'Cebu IT Park / South Terminal',
    category: 'Transit Hub',
    routeSummary: 'Salinas Drive, Lahug & Natalio Bacalso Ave multimodal bays',
    peakStat: 'Visayas Metro',
    directionNote: 'Central Visayas Metro Cebu transport corridors',
    lat: 10.3297,
    lng: 123.9056,
    iconType: 'transfer',
  },
  {
    id: 'loc-23',
    name: 'Davao Overland Transport Terminal (DCOTT)',
    category: 'Terminal',
    routeSummary: 'Ecoland, McArthur Highway & Matina jeepney dispersal bays',
    peakStat: 'Mindanao Hub',
    directionNote: 'Southern Mindanao overland travel gateway',
    lat: 7.0542,
    lng: 125.5925,
    iconType: 'terminal',
  },
];

const CATEGORIES: LocationCategory[] = [
  'All',
  'Area / Place',
  'Corridor',
  'Transit Hub',
  'Terminal',
  'Campus / School',
  'Commercial',
];

export interface SelectForecastLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: ForecastLocationItem | null;
  onSelectCurrentLocation: () => void;
  onSelectLocation: (location: ForecastLocationItem) => void;
}

export const SelectForecastLocationModal: React.FC<SelectForecastLocationModalProps> = ({
  isOpen,
  onClose,
  selectedLocation,
  onSelectCurrentLocation,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory>('All');
  const [liveGeocodedResults, setLiveGeocodedResults] = useState<ForecastLocationItem[]>([]);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // Filter existing locations by text query and category
  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return FORECAST_LOCATIONS_DATA.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!q) return true;

      return (
        item.name.toLowerCase().includes(q) ||
        item.routeSummary.toLowerCase().includes(q) ||
        item.directionNote.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  // Live Geocoding for custom searched areas (e.g., Novaliches, Malinta, Bulacan, etc.)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setLiveGeocodedResults([]);
      setIsGeocodingLoading(false);
      return;
    }

    const abortController = new AbortController();

    const timer = setTimeout(async () => {
      setIsGeocodingLoading(true);
      try {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        let items: ForecastLocationItem[] = [];

        // 1. Try OpenWeather Geocoding API if key available
        if (apiKey && apiKey !== 'your_openweather_api_key_here') {
          const res = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
              q
            )},PH&limit=4&appid=${apiKey}`,
            { signal: abortController.signal }
          );
          if (res.ok) {
            const data: Array<{ name: string; lat: number; lon: number; state?: string }> =
              await res.json();
            items = data.map((d, idx) => ({
              id: `geo-ow-${idx}-${d.lat.toFixed(3)}`,
              name: d.state ? `${d.name}, ${d.state}` : d.name,
              category: 'Area / Place',
              routeSummary: `Geographic area in ${d.state || 'Philippines'}`,
              peakStat: 'Live Area',
              directionNote: `Exact Coordinates: ${d.lat.toFixed(4)}, ${d.lon.toFixed(4)}`,
              lat: d.lat,
              lng: d.lon,
              iconType: 'area',
            }));
          }
        }

        // 2. Fallback to Open-Meteo Geocoding if OpenWeather returned no items
        if (items.length === 0 && !abortController.signal.aborted) {
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
              q
            )}&count=4&language=en&format=json`,
            { signal: abortController.signal }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.results && Array.isArray(data.results)) {
              items = data.results
                .filter((r: { country_code?: string }) => r.country_code === 'PH')
                .map((r: { name: string; admin1?: string; latitude: number; longitude: number }, idx: number) => ({
                  id: `geo-om-${idx}-${r.latitude.toFixed(3)}`,
                  name: r.admin1 ? `${r.name}, ${r.admin1}` : r.name,
                  category: 'Area / Place',
                  routeSummary: `Municipality / District in ${r.admin1 || 'Philippines'}`,
                  peakStat: 'Geocoded',
                  directionNote: `Exact Coordinates: ${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`,
                  lat: r.latitude,
                  lng: r.longitude,
                  iconType: 'area',
                }));
            }
          }
        }

        // Deduplicate against static locations
        if (!abortController.signal.aborted) {
          const filteredNew = items.filter(
            (newItem) =>
              !FORECAST_LOCATIONS_DATA.some(
                (staticItem) =>
                  Math.abs(staticItem.lat - newItem.lat) < 0.01 &&
                  Math.abs(staticItem.lng - newItem.lng) < 0.01
              )
          );

          setLiveGeocodedResults(filteredNew);
        }
      } catch (err: unknown) {
        if (!abortController.signal.aborted) {
          setLiveGeocodedResults([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsGeocodingLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  const showCurrentLocation = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      'use my current location'.includes(q) ||
      'current location'.includes(q) ||
      'auto-detects nearest road corridor'.includes(q) ||
      'my location'.includes(q) ||
      'near me'.includes(q) ||
      'default'.includes(q) ||
      'gps'.includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const isCurrentLocationSelected = selectedLocation === null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      {/* Background Dim */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Dialog / Sheet Surface */}
      <div
        className="relative w-full max-w-md sm:max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[86vh] overflow-hidden z-10 animate-in slide-in-from-bottom duration-250"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#701428] text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 leading-tight">
                Select Location / Area
              </h2>
              <p className="text-[12px] text-slate-500 font-normal mt-0.5">
                Search any Philippine area, district, or transit corridor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 no-scrollbar">
          {/* Search Bar at Top */}
          <div className="relative flex items-center">
            {isGeocodingLoading ? (
              <Loader2 className="w-4 h-4 text-[#701428] absolute left-3.5 animate-spin pointer-events-none" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area (e.g. Malinta, Novaliches, Valenzuela, QC)..."
              className="w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white text-[13px] text-slate-800 placeholder:text-slate-400 pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-[#701428] focus:ring-2 focus:ring-[#701428]/15 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#701428] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                LOCATIONS &amp; AREAS (
                {filteredLocations.length +
                  liveGeocodedResults.length +
                  (showCurrentLocation ? 1 : 0)}
                )
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Option: Use My Current Location (among the search results) */}
              {showCurrentLocation && (
                <div
                  onClick={() => {
                    onSelectCurrentLocation();
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group shadow-2xs ${
                    isCurrentLocationSelected
                      ? 'border-[#701428] ring-1 ring-[#701428]/25 bg-slate-50'
                      : 'border-slate-200/90 bg-white hover:border-[#701428]/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-[#701428] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Crosshair className="w-4 h-4" />
                      </div>
                      <div className="flex items-center space-x-2 truncate">
                        <h4 className="text-[14px] font-bold text-slate-900 truncate">
                          Use My Current Location
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#701428] text-white shrink-0 shadow-xs">
                          GPS
                        </span>
                      </div>
                    </div>
                    {isCurrentLocationSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#701428] text-white flex items-center justify-center shrink-0 ml-2">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors ml-2 shrink-0" />
                    )}
                  </div>

                  <div className="mt-2 flex items-start space-x-1.5 text-slate-500 text-[11.5px] leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">Auto-detects live GPS coordinates from your device</span>
                  </div>

                  <div className="mt-1.5 flex items-center space-x-2 text-[11px] text-slate-600 font-medium">
                    <div className="flex items-center space-x-1 text-slate-800 font-semibold">
                      <TrendingUp className="w-3 h-3 text-[#701428]" />
                      <span>Live Device Sensor</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-400 truncate">
                      Real-time area coordinates
                    </span>
                  </div>
                </div>
              )}

              {/* Live Geocoded Results (when user types custom query) */}
              {liveGeocodedResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectLocation(item);
                    onClose();
                  }}
                  className="w-full p-3.5 bg-white rounded-2xl border border-sky-300/80 bg-sky-50/20 hover:bg-sky-50/50 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex items-center space-x-2 truncate">
                        <h4 className="text-[14px] font-bold text-slate-900 truncate">
                          {item.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 shrink-0">
                          Geocoded
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors ml-2 shrink-0" />
                  </div>
                  <div className="mt-2 flex items-start space-x-1.5 text-slate-500 text-[11.5px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{item.routeSummary}</span>
                  </div>
                  <div className="mt-1 flex items-center space-x-2 text-[10.5px] text-slate-400">
                    <span>{item.directionNote}</span>
                  </div>
                </div>
              ))}

              {/* All filtered curated locations & areas */}
              {filteredLocations.map((item) => {
                const isSelected = selectedLocation?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectLocation(item);
                      onClose();
                    }}
                    className={`w-full p-3.5 bg-white rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group hover:border-[#701428]/40 shadow-2xs ${
                      isSelected
                        ? 'border-[#701428] ring-1 ring-[#701428]/25 bg-slate-50'
                        : 'border-slate-200/90 hover:bg-slate-50'
                    }`}
                  >
                    {/* Top Row: Icon + Name + Category Pill + Chevron/Check */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-[#701428] text-white flex items-center justify-center shrink-0 shadow-xs">
                          {item.iconType === 'area' && <MapPin className="w-4 h-4" />}
                          {item.iconType === 'bus' && <Bus className="w-4 h-4" />}
                          {item.iconType === 'transfer' && (
                            <ArrowLeftRight className="w-4 h-4" />
                          )}
                          {item.iconType === 'terminal' && <Bus className="w-4 h-4" />}
                          {item.iconType === 'campus' && (
                            <GraduationCap className="w-4 h-4" />
                          )}
                          {item.iconType === 'commercial' && (
                            <Store className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 truncate">
                          <h4 className="text-[14px] font-bold text-slate-900 truncate">
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#701428] text-white shrink-0 shadow-xs">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#701428] text-white flex items-center justify-center shrink-0 ml-2">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors ml-2 shrink-0" />
                      )}
                    </div>

                    {/* Middle Row: Route/Area Description with MapPin */}
                    <div className="mt-2 flex items-start space-x-1.5 text-slate-500 text-[11.5px] leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{item.routeSummary}</span>
                    </div>

                    {/* Bottom Row: Peak Stat + Direction Note */}
                    <div className="mt-1.5 flex items-center space-x-2 text-[11px] text-slate-600 font-medium">
                      <div className="flex items-center space-x-1 text-slate-800 font-semibold">
                        <TrendingUp className="w-3 h-3 text-[#701428]" />
                        <span>{item.peakStat}</span>
                      </div>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-400 truncate">
                        {item.directionNote}
                      </span>
                    </div>
                  </div>
                );
              })}

              {!showCurrentLocation &&
                filteredLocations.length === 0 &&
                liveGeocodedResults.length === 0 && (
                  <div className="py-7 text-center bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-600">
                      No locations found matching "{searchQuery}"
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try typing a Philippine municipality, city, or area (e.g. Malinta, Novaliches, Valenzuela)
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

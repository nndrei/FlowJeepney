import React, { useState } from 'react';
import {
  Menu,
  MapPin,
  Calendar,
  CloudSun,
  Bus,
  Clock,
  Users,
  ChevronRight,
  TrendingUp,
  ArrowLeftRight,
  GraduationCap,
  Store,
} from 'lucide-react';
import {
  SelectForecastLocationModal,
  ForecastLocationItem,
} from './SelectForecastLocationModal';
import { LocationMapPreview } from './LocationMapPreview';
import { WeeklyForecastCard } from './WeeklyForecastCard';

interface DayOption {
  dayName: string;
  dayNumber: number;
  monthName: string;
  fullDateString: string;
  isToday?: boolean;
}

interface ForecastScreenProps {
  onOpenMenu?: () => void;
  currentUserCoords?: { lat: number; lng: number } | null;
  userPickupName?: string;
}

export const ForecastScreen: React.FC<ForecastScreenProps> = ({
  onOpenMenu,
  userPickupName,
  currentUserCoords,
}) => {
  const weekDays: DayOption[] = [
    { dayName: 'MON', dayNumber: 28, monthName: 'September', fullDateString: 'Monday, September 28' },
    { dayName: 'TUE', dayNumber: 29, monthName: 'September', fullDateString: 'Tuesday, September 29' },
    { dayName: 'WED', dayNumber: 30, monthName: 'September', fullDateString: 'Wednesday, September 30', isToday: true },
    { dayName: 'THU', dayNumber: 1, monthName: 'October', fullDateString: 'Thursday, October 1' },
    { dayName: 'FRI', dayNumber: 2, monthName: 'October', fullDateString: 'Friday, October 2' },
    { dayName: 'SAT', dayNumber: 3, monthName: 'October', fullDateString: 'Saturday, October 3' },
    { dayName: 'SUN', dayNumber: 4, monthName: 'October', fullDateString: 'Sunday, October 4' },
  ];

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const selectedDay = weekDays[selectedIndex];

  // Location selection state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<ForecastLocationItem | null>(null);

  const defaultCoords = { lat: 14.6572, lng: 120.9842 };
  const currentCoords = selectedLocation
    ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
    : currentUserCoords || defaultCoords;

  const currentLocationName = selectedLocation
    ? selectedLocation.name
    : userPickupName || 'Near MacArthur Highway';

  const currentCategory = selectedLocation
    ? selectedLocation.category
    : 'Transit Hub';

  const currentDescription = selectedLocation
    ? selectedLocation.routeSummary
    : 'Northern gateway connecting Caloocan and Valenzuela.';

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'Transit Hub':
        return <ArrowLeftRight className="w-3 h-3" />;
      case 'Terminal':
        return <Bus className="w-3 h-3" />;
      case 'Campus / School':
        return <GraduationCap className="w-3 h-3" />;
      case 'Commercial':
        return <Store className="w-3 h-3" />;
      default:
        return <Bus className="w-3 h-3" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 overflow-y-auto no-scrollbar select-none">
      <header className="bg-white border-b border-slate-200/80 px-4 py-3 shrink-0 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="p-1.5 text-slate-700 hover:text-slate-900 active:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-[16px] font-extrabold text-slate-900 leading-tight">
              Passenger Load Forecast
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time trends & daily schedules
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-3.5">
        <section className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-[#701428]" />
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                Forecast Location
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="text-[11px] font-bold text-[#701428] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Change</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer group"
            >
              <div className="w-13 h-13 rounded-2xl bg-[#701428] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6 fill-current text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] sm:text-[16px] font-bold text-slate-900 truncate group-hover:text-[#701428] transition-colors">
                  {currentLocationName}
                </h2>

                <div className="mt-1 flex items-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-900 text-white shadow-xs">
                    {renderCategoryIcon(currentCategory)}
                    {currentCategory}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                  {currentDescription}
                </p>
              </div>
            </div>

            {/* Right side: Real interactive Leaflet map cropped preview */}
            <div className="w-[32%] sm:w-[35%] min-w-[100px] max-w-[140px] h-[88px] sm:h-[94px] rounded-2xl overflow-hidden border border-slate-200/90 relative shrink-0 shadow-2xs">
              <LocationMapPreview coords={currentCoords} name={currentLocationName} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={day.dayName + day.dayNumber}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`py-3 px-1 rounded-2xl flex flex-col items-center justify-between transition-all cursor-pointer min-h-[92px] ${
                  isSelected
                    ? 'bg-[#701428] text-white shadow-md'
                    : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isSelected ? 'text-white/80' : 'text-slate-400'
                  }`}
                >
                  {day.dayName}
                </span>

                <span
                  className={`text-[19px] font-black my-0.5 ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {day.isToday && !isSelected ? (
                  <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-[#701428] text-white">
                    TODAY
                  </span>
                ) : (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-slate-300'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </section>

        <section className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center space-x-1.5 mb-2.5">
            <Calendar className="w-4 h-4 text-[#701428]" />
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Daily Schedule Overview
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[18px] font-bold text-[#701428] leading-tight">
                {selectedDay.fullDateString}
              </h3>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                Expected transit occupancy & peak intervals
              </p>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-3 flex items-center space-x-2.5 shrink-0 shadow-sm">
              <CloudSun className="w-5 h-5 text-amber-400" />
              <div className="text-right">
                <span className="text-[14px] font-black text-white block leading-none">
                  28°C
                </span>
                <span className="text-[10px] font-medium text-slate-400 mt-0.5 block">
                  Partly Cloudy
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-2.5">
          {/* 1. Morning Rush Hour */}
          <div className="p-3.5 bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-slate-900 leading-tight truncate">
                    Morning Rush Hour (6:30 AM - 9:00 AM)
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                    ~6 mins headway · High passenger influx
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-black text-rose-600 shrink-0 whitespace-nowrap">
                90% Full
              </span>
            </div>

            {/* Visual Load Status Bar: 90% Filled */}
            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] mb-1.5 gap-2">
                <span className="font-bold text-rose-800 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md text-[10.5px] whitespace-nowrap">
                  High Demand (85–95%)
                </span>
                <span className="text-slate-500 font-medium text-[11px] whitespace-nowrap">
                  10% seats left
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                  style={{ width: '90%' }}
                />
              </div>
            </div>
          </div>

          {/* 2. Midday Regular Hours */}
          <div className="p-3.5 bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-[#00E676] flex items-center justify-center shrink-0 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-slate-900 leading-tight truncate">
                    Midday Regular Hours (10:00 AM - 3:30 PM)
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                    ~4 mins headway · Smooth flow
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-black text-[#00B14F] shrink-0 whitespace-nowrap">
                50% Full
              </span>
            </div>

            {/* Visual Load Status Bar: 50% Filled */}
            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] mb-1.5 gap-2">
                <span className="font-bold text-[#007A37] bg-[#00B14F]/10 border border-[#00B14F]/25 px-2 py-0.5 rounded-md text-[10.5px] whitespace-nowrap">
                  Seats Available (40–60%)
                </span>
                <span className="text-slate-500 font-medium text-[11px] whitespace-nowrap">
                  Plenty of seats open
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00B14F] rounded-full transition-all duration-300"
                  style={{ width: '50%' }}
                />
              </div>
            </div>
          </div>

          {/* 3. Evening Peak Hours */}
          <div className="p-3.5 bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-slate-900 leading-tight truncate">
                    Evening Peak Hours (5:00 PM - 8:30 PM)
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                    ~8 mins headway · Heavy terminal queues
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-black text-[#800020] shrink-0 whitespace-nowrap">
                100% Full
              </span>
            </div>

            {/* Visual Load Status Bar: 100% COMPLETE */}
            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] mb-1.5 gap-2">
                <span className="font-bold text-rose-800 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md text-[10.5px] whitespace-nowrap">
                  Standing Load (100%)
                </span>
                <span className="text-rose-700 font-bold text-[11px] whitespace-nowrap">
                  At full capacity
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#800020] rounded-full transition-all duration-300"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 7-Day Passenger Occupancy Forecast (Corridor Trend) */}
        <WeeklyForecastCard
          selectedIndex={selectedIndex}
          onSelectIndex={(idx) => setSelectedIndex(idx)}
        />
      </main>

      {/* Location Picker Modal */}
      <SelectForecastLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        selectedLocation={selectedLocation}
        onSelectCurrentLocation={() => setSelectedLocation(null)}
        onSelectLocation={(loc) => setSelectedLocation(loc)}
      />
    </div>
  );
};

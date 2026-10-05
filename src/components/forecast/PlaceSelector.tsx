import React, { useState } from 'react';
import {
  MapPin,
  ChevronDown,
  Search,
  X,
  Compass,
  ArrowRight,
  Check,
  Crosshair,
  RotateCcw,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { ForecastPlace } from '../../types/forecast';
import { FORECAST_PLACES } from '../../utils/forecastPlaces';
import { LocationMapPreview } from './LocationMapPreview';

interface PlaceSelectorProps {
  selectedPlace: ForecastPlace;
  onSelectPlace: (place: ForecastPlace) => void;
  onUseCurrentLocation: () => void;
  isCurrentLocation: boolean;
  isLocating?: boolean;
}

export const PlaceSelector: React.FC<PlaceSelectorProps> = ({
  selectedPlace,
  onSelectPlace,
  onUseCurrentLocation,
  isCurrentLocation,
  isLocating = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Corridor', 'Transit Hub', 'Terminal', 'Campus / School', 'Commercial'];

  const filteredPlaces = FORECAST_PLACES.filter((place) => {
    const matchesSearch =
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.corridor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || place.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Corridor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Transit Hub':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Terminal':
        return 'bg-[#00B14F]/10 text-[#007A37] border border-[#00B14F]/25';
      case 'Campus / School':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs">
        {/* Top Header: Section Label & Action */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
          <div className="flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-[#800020]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Forecast Location
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-[11px] font-semibold text-[#800020] hover:text-[#5c0017] transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <span>Change</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Selected Place Summary: Left Info + Right Functional Interactive Map */}
        <div className="flex items-stretch gap-3">
          {/* Left Side: Location information */}
          <div
            onClick={() => setIsModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsModalOpen(true);
            }}
            className="flex-1 min-w-0 flex items-start space-x-2.5 cursor-pointer group"
          >
            {/* Location Icon */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 bg-[#800020] text-white group-hover:scale-105 transition-transform">
              <MapPin className="w-4.5 h-4.5 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <h2 className="text-[14px] font-bold text-slate-900 leading-snug group-hover:text-[#800020] transition-colors">
                  {selectedPlace.name}
                </h2>
                {isLocating && (
                  <span className="text-[9.5px] font-medium text-slate-400 animate-pulse">
                    (Locating...)
                  </span>
                )}
              </div>

              {/* Category Badge */}
              <div className="mt-1">
                <span
                  className={`inline-block text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeColor(
                    selectedPlace.category
                  )}`}
                >
                  {selectedPlace.category}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-500 font-normal leading-relaxed mt-1.5 line-clamp-2">
                {selectedPlace.description}
              </p>
            </div>
          </div>

          {/* Right Side: Real Functional Map (~30–35% width, rounded corners) */}
          <div className="w-[32%] sm:w-[35%] min-w-[105px] max-w-[145px] shrink-0 min-h-[96px] max-h-[115px] rounded-xl overflow-hidden border border-slate-200/90 relative shadow-2xs">
            <LocationMapPreview coords={selectedPlace.coords} name={selectedPlace.name} />
          </div>
        </div>

        {/* Dynamic Context Action: Only show Reset if user has manually chosen another place */}
        {!isCurrentLocation && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10.5px] text-slate-500 font-medium">
              Viewing custom place
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUseCurrentLocation();
              }}
              className="px-2.5 py-1 rounded-lg bg-[#00B14F]/10 hover:bg-[#00B14F]/20 text-[#007A37] border border-[#00B14F]/25 text-[11px] font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-[#00B14F]" />
              <span>Reset to Current Location</span>
            </button>
          </div>
        )}
      </div>

      {/* Place Selection Modal / Drawer - ONLY shown when user explicitly wants to select */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#800020] flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 leading-tight">
                    Select Forecast Location
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Forecast your current location or choose a specific corridor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                aria-label="Close location selector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Primary Action: Use My Current Location */}
            <div className="p-3.5 pb-1 border-b border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={() => {
                  onUseCurrentLocation();
                  setIsModalOpen(false);
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isCurrentLocation
                    ? 'bg-[#00B14F]/10 border-[#00B14F]/40 ring-1 ring-[#00B14F]/30'
                    : 'bg-white hover:bg-[#00B14F]/5 border-slate-200 hover:border-[#00B14F]/30'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#00B14F] text-white flex items-center justify-center shrink-0">
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[13px] font-bold text-slate-900">
                        Use My Current Location
                      </span>
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#00B14F]/15 text-[#007A37]">
                        Default
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Auto-detects your nearest road corridor & passenger telemetry
                    </p>
                  </div>
                </div>

                {isCurrentLocation ? (
                  <div className="w-6 h-6 rounded-full bg-[#00B14F] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
            </div>

            {/* Search Input & Category Filters */}
            <div className="p-3.5 pb-2 shrink-0 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search other corridor or station (e.g. Philcoa, España, SM North)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-[12.5px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold shrink-0 transition-colors cursor-pointer border ${
                      selectedCategory === cat
                        ? 'bg-[#800020] text-white border-[#800020]'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Place List */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 pt-1 space-y-2">
              <div className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                All Corridors & Transport Hubs ({filteredPlaces.length})
              </div>

              {filteredPlaces.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No corridors or stations found matching &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                filteredPlaces.map((place) => {
                  const isSelected = !isCurrentLocation && selectedPlace.id === place.id;
                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => {
                        onSelectPlace(place);
                        setIsModalOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                        isSelected
                          ? 'bg-rose-50/60 border-[#800020] ring-1 ring-[#800020]/30'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[13px] font-bold text-slate-900">
                            {place.name}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCategoryBadgeColor(
                              place.category
                            )}`}
                          >
                            {place.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {place.description}
                        </p>
                        <div className="mt-1.5 flex items-center space-x-2 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-600">
                            Mon Peak: {place.peakOccupancyProfile.Monday}%
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">
                            {place.morningDirection}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#800020] text-white flex items-center justify-center shrink-0 mt-1">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="text-slate-300 group-hover:text-slate-500 shrink-0 mt-1">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

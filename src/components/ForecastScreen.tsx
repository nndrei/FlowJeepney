import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Sun,
  CloudRain,
  Cloud,
  ChevronDown,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Compass,
  Menu,
  RotateCw,
} from 'lucide-react';

export interface DayForecastData {
  id: string;
  dayAbbr: string;
  dayFull: string;
  dateStr: string;
  peakOccupancy: number; // e.g. 95
  weather: 'sunny' | 'cloudy' | 'rain';
  temperature: string;
  surgeStatus: 'Surge (>90%)' | 'Busy (80–89%)' | 'Open (<80%)';
  narrative: string;
  peakCrowdLabel: string;
  recommendedWindow: string;
  fairWeatherImpact: {
    title: string;
    description: string;
    headway: string;
    terminalWait: string;
  };
  rainWeatherImpact: {
    title: string;
    description: string;
    headway: string;
    terminalWait: string;
  };
  timeSlots: {
    title: string;
    timeRange: string;
    passengers: number;
    maxCapacity: number;
    badgeStatus: 'Seats Available' | 'Near-Full' | 'Full (Standing)';
    operationalNotes: string;
  }[];
}

export const CORRIDOR_OPTIONS = [
  {
    id: 'malinta-novaliches',
    name: 'Malinta – Novaliches Corridor',
    distance: '9.2 km',
    activeDirection: 'Eastbound (Malinta Terminal → Novaliches Bayan)',
  },
  {
    id: 'quezon-commonwealth',
    name: 'Quezon Ave – Commonwealth Corridor',
    distance: '14.5 km',
    activeDirection: 'Northbound (Manila City Hall → Fairview Center Mall)',
  },
  {
    id: 'edsa-cubao-monumento',
    name: 'EDSA – Monumento to Cubao Corridor',
    distance: '11.8 km',
    activeDirection: 'Southbound (Monumento Circle → Araneta City Cubao)',
  },
];

export const WEEKLY_FORECAST_DATA: DayForecastData[] = [
  {
    id: 'mon',
    dayAbbr: 'Mon',
    dayFull: 'Monday',
    dateStr: 'Mon, Sep 15',
    peakOccupancy: 95,
    weather: 'sunny',
    temperature: '31°C',
    surgeStatus: 'Surge (>90%)',
    narrative:
      'Heavy start-of-week morning rush. Major worker and university commuter queue from Malinta heading east toward Novaliches Bayan and QC.',
    peakCrowdLabel: 'High Rush (95%)',
    recommendedWindow: '10:00 AM – 2:30 PM (Midday)',
    fairWeatherImpact: {
      title: 'Fair Skies Condition',
      description: 'Normal corridor ridership with predictable vehicle headway and dry road corridors.',
      headway: '4–6 mins',
      terminalWait: '5–8 mins',
    },
    rainWeatherImpact: {
      title: 'Monsoon Rain & Ponding Advisory',
      description: 'Localized flooding along Paso de Blas junction slow departures; queues at terminals surge +35%.',
      headway: '14–18 mins',
      terminalWait: '20–30 mins',
    },
    timeSlots: [
      {
        title: 'Early Worker Dispatch',
        timeRange: '5:30 AM – 6:30 AM',
        passengers: 14,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Early trips depart promptly; good seat availability before heavy morning rush builds.',
      },
      {
        title: 'Morning Peak Rush',
        timeRange: '6:30 AM – 9:00 AM',
        passengers: 20,
        maxCapacity: 20,
        badgeStatus: 'Full (Standing)',
        operationalNotes: 'Terminal queues at Malinta. Jeeps fill up before reaching Paso de Blas intersection.',
      },
      {
        title: 'Midday Off-Peak',
        timeRange: '10:00 AM – 2:30 PM',
        passengers: 10,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Smooth traffic and relaxed corridor speeds. Best time for senior citizens and quick errands.',
      },
      {
        title: 'Afternoon School Surge',
        timeRange: '3:00 PM – 5:00 PM',
        passengers: 17,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'Students departing PLV and Bagbaguin secondary campuses create steady localized boarding.',
      },
      {
        title: 'Evening Homeward Rush',
        timeRange: '5:30 PM – 8:30 PM',
        passengers: 20,
        maxCapacity: 20,
        badgeStatus: 'Full (Standing)',
        operationalNotes: 'Dense queue at NLEX Paso de Blas junction. Standing passengers common on all outbound units.',
      },
      {
        title: 'Night Sweep',
        timeRange: '8:30 PM – 11:00 PM',
        passengers: 12,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Frequency thins; moderate seating remaining along Novaliches Bayan terminal loop.',
      },
    ],
  },
  {
    id: 'tue',
    dayAbbr: 'Tue',
    dayFull: 'Tuesday',
    dateStr: 'Tue, Sep 16',
    peakOccupancy: 86,
    weather: 'sunny',
    temperature: '32°C',
    surgeStatus: 'Busy (80–89%)',
    narrative:
      'Steady weekday commuter flow. Sustained morning volume transitioning into moderate mid-afternoon university dispatch.',
    peakCrowdLabel: 'Moderate Rush (86%)',
    recommendedWindow: '10:30 AM – 2:00 PM (Off-Peak)',
    fairWeatherImpact: {
      title: 'Fair Skies Condition',
      description: 'Clear road conditions and standard vehicle cycle times across all corridor segments.',
      headway: '5–7 mins',
      terminalWait: '6–10 mins',
    },
    rainWeatherImpact: {
      title: 'Sudden Afternoon Thunderstorm Alert',
      description: 'Scattered downpours reduce vehicle cruising speeds. Passenger queues gather under shelter points.',
      headway: '12–16 mins',
      terminalWait: '18–25 mins',
    },
    timeSlots: [
      {
        title: 'Early Worker Dispatch',
        timeRange: '5:30 AM – 6:30 AM',
        passengers: 12,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Smooth corridor flow; seating easily accessible at origin stops.',
      },
      {
        title: 'Morning Peak Rush',
        timeRange: '6:30 AM – 9:00 AM',
        passengers: 18,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'Heavy boarding near Valenzuela Gateway. 2–3 seats left per unit past Gen. Luis.',
      },
      {
        title: 'Midday Off-Peak',
        timeRange: '10:00 AM – 2:30 PM',
        passengers: 9,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Comfortable air-conditioned ride; minimal wait times at designated passenger bays.',
      },
      {
        title: 'Afternoon School Surge',
        timeRange: '3:00 PM – 5:00 PM',
        passengers: 16,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'High university cluster movement; seats fill briskly between 3:45 PM and 4:30 PM.',
      },
      {
        title: 'Evening Homeward Rush',
        timeRange: '5:30 PM – 8:30 PM',
        passengers: 19,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'Significant homeward crowd from NLEX interchange toward Novaliches proper.',
      },
      {
        title: 'Night Sweep',
        timeRange: '8:30 PM – 11:00 PM',
        passengers: 11,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Reduced headway between units; relaxed boarding for late-shift workers.',
      },
    ],
  },
  {
    id: 'wed',
    dayAbbr: 'Wed',
    dayFull: 'Wednesday',
    dateStr: 'Wed, Sep 17',
    peakOccupancy: 89,
    weather: 'rain',
    temperature: '28°C',
    surgeStatus: 'Busy (80–89%)',
    narrative:
      'Mid-week peak ridership accompanied by localized drizzle. Steady passenger queues at covered interchange points.',
    peakCrowdLabel: 'Busy Rush (89%)',
    recommendedWindow: '11:00 AM – 1:30 PM (Midday)',
    fairWeatherImpact: {
      title: 'Scattered Showers',
      description: 'Intermittent rainfall prompts commuters to congregate at covered stops and retail hubs.',
      headway: '7–9 mins',
      terminalWait: '10–14 mins',
    },
    rainWeatherImpact: {
      title: 'Heavy Tropical Downpour',
      description: 'Slow crawling traffic along General Luis St; queue lines spill outside terminal roofs.',
      headway: '16–20 mins',
      terminalWait: '25–35 mins',
    },
    timeSlots: [
      {
        title: 'Early Worker Dispatch',
        timeRange: '5:30 AM – 6:30 AM',
        passengers: 13,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Drivers running on schedule before precipitation intensifies.',
      },
      {
        title: 'Morning Peak Rush',
        timeRange: '6:30 AM – 9:00 AM',
        passengers: 19,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'Wet road surfaces extend braking distances; slight headway expansion observed.',
      },
      {
        title: 'Midday Off-Peak',
        timeRange: '10:00 AM – 2:30 PM',
        passengers: 11,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Steady mid-day shopping commuters; comfortable passenger distribution.',
      },
      {
        title: 'Afternoon School Surge',
        timeRange: '3:00 PM – 5:00 PM',
        passengers: 17,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'Student clusters waiting under canopy areas; rapid boarding upon unit arrival.',
      },
      {
        title: 'Evening Homeward Rush',
        timeRange: '5:30 PM – 8:30 PM',
        passengers: 20,
        maxCapacity: 20,
        badgeStatus: 'Full (Standing)',
        operationalNotes: 'Rainfall exacerbates evening bottleneck near Paso de Blas toll exit.',
      },
      {
        title: 'Night Sweep',
        timeRange: '8:30 PM – 11:00 PM',
        passengers: 13,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Pavement drying; transit return loop clearing smoothly.',
      },
    ],
  },
  {
    id: 'thu',
    dayAbbr: 'Thu',
    dayFull: 'Thursday',
    dateStr: 'Thu, Sep 18',
    peakOccupancy: 87,
    weather: 'cloudy',
    temperature: '30°C',
    surgeStatus: 'Busy (80–89%)',
    narrative:
      'Overcast skies and consistent commercial travel. Higher boarding observed around industrial zones in Paso de Blas.',
    peakCrowdLabel: 'High Volume (87%)',
    recommendedWindow: '9:45 AM – 2:15 PM (Midday)',
    fairWeatherImpact: {
      title: 'Overcast & Cool Condition',
      description: 'Temperate weather supports steady walking commutes and predictable boarding rhythms.',
      headway: '5–6 mins',
      terminalWait: '5–8 mins',
    },
    rainWeatherImpact: {
      title: 'Late Evening Rain Squall',
      description: 'Wind gusts slow highway connector transit; minor delays along Paso de Blas underpass.',
      headway: '11–15 mins',
      terminalWait: '16–22 mins',
    },
    timeSlots: [
      {
        title: 'Early Worker Dispatch',
        timeRange: '5:30 AM – 6:30 AM',
        passengers: 14,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Industrial shift turnover; punctual departures from Malinta.',
      },
      {
        title: 'Morning Peak Rush',
        timeRange: '6:30 AM – 9:00 AM',
        passengers: 18,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'Consistently high boarding; majority heading past Bagbaguin intersection.',
      },
      {
        title: 'Midday Off-Peak',
        timeRange: '10:00 AM – 2:30 PM',
        passengers: 10,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Low queue times at all stops; recommended for hassle-free transit.',
      },
      {
        title: 'Afternoon School Surge',
        timeRange: '3:00 PM – 5:00 PM',
        passengers: 16,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'Afternoon dismissal volume handled cleanly by dispatched modern units.',
      },
      {
        title: 'Evening Homeward Rush',
        timeRange: '5:30 PM – 8:30 PM',
        passengers: 19,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'Substantial factory and office exit wave; standing room only after Paso de Blas.',
      },
      {
        title: 'Night Sweep',
        timeRange: '8:30 PM – 11:00 PM',
        passengers: 12,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Regular cadence maintained until final terminal depot dispatch.',
      },
    ],
  },
  {
    id: 'fri',
    dayAbbr: 'Fri',
    dayFull: 'Friday',
    dateStr: 'Fri, Sep 19',
    peakOccupancy: 98,
    weather: 'rain',
    temperature: '29°C',
    surgeStatus: 'Surge (>90%)',
    narrative:
      'Weekly absolute peak! Extreme payday and weekend exodus surge. Both morning workforce and intense evening queues span full corridor.',
    peakCrowdLabel: 'Weekly Peak Surge (98%)',
    recommendedWindow: '10:30 AM – 1:30 PM (Strict Window)',
    fairWeatherImpact: {
      title: 'High-Density Friday Rush',
      description: 'Maximum fleet capacity deployed. Passenger load consistently exceeds seated volume.',
      headway: '4–5 mins',
      terminalWait: '10–18 mins',
    },
    rainWeatherImpact: {
      title: 'Monsoon Rain & Friday Payday Combo',
      description: 'Severe corridor gridlock. Wait times at Malinta terminal reach 35+ minutes.',
      headway: '18–25 mins',
      terminalWait: '35–45 mins',
    },
    timeSlots: [
      {
        title: 'Early Worker Dispatch',
        timeRange: '5:30 AM – 6:30 AM',
        passengers: 16,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'High early departure rate as commuters anticipate heavy Friday gridlock.',
      },
      {
        title: 'Morning Peak Rush',
        timeRange: '6:30 AM – 9:00 AM',
        passengers: 20,
        maxCapacity: 20,
        badgeStatus: 'Full (Standing)',
        operationalNotes: 'Every jeepney operates at 100% capacity with standing passengers inside.',
      },
      {
        title: 'Midday Off-Peak',
        timeRange: '10:00 AM – 2:30 PM',
        passengers: 13,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Only calm period of the day; errand-goers should travel exclusively now.',
      },
      {
        title: 'Afternoon School Surge',
        timeRange: '3:00 PM – 5:00 PM',
        passengers: 19,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'Early weekend dismissal collides with early office departures.',
      },
      {
        title: 'Evening Homeward Rush',
        timeRange: '5:30 PM – 8:30 PM',
        passengers: 20,
        maxCapacity: 20,
        badgeStatus: 'Full (Standing)',
        operationalNotes: 'Critical passenger backlog. Queue reaches past exterior terminal gates.',
      },
      {
        title: 'Night Sweep',
        timeRange: '8:30 PM – 11:00 PM',
        passengers: 16,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'Night-life and weekend social travelers maintain elevated demand until midnight.',
      },
    ],
  },
  {
    id: 'sat',
    dayAbbr: 'Sat',
    dayFull: 'Saturday',
    dateStr: 'Sat, Sep 20',
    peakOccupancy: 76,
    weather: 'sunny',
    temperature: '33°C',
    surgeStatus: 'Open (<80%)',
    narrative:
      'Moderate weekend commercial traffic. Balanced flow dominated by shopping mall visitors, churchgoers, and localized leisure trips.',
    peakCrowdLabel: 'Moderate Load (76%)',
    recommendedWindow: '8:00 AM – 11:30 AM / 2:00 PM – 4:00 PM',
    fairWeatherImpact: {
      title: 'Warm Weekend Skies',
      description: 'Pleasant transit flow without severe worker commute peaks. Good passenger seat turnover.',
      headway: '7–10 mins',
      terminalWait: '4–6 mins',
    },
    rainWeatherImpact: {
      title: 'Afternoon Heat Thunderstorm',
      description: 'Short 30-minute intense shower causes localized boarding rush at shopping centers.',
      headway: '12–15 mins',
      terminalWait: '10–15 mins',
    },
    timeSlots: [
      {
        title: 'Early Worker Dispatch',
        timeRange: '5:30 AM – 6:30 AM',
        passengers: 8,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Quiet morning dispatch; primarily weekend market stall vendors.',
      },
      {
        title: 'Morning Peak Rush',
        timeRange: '6:30 AM – 9:00 AM',
        passengers: 14,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Relaxed morning pace; ample seating on virtually all departing vehicles.',
      },
      {
        title: 'Midday Off-Peak',
        timeRange: '10:00 AM – 2:30 PM',
        passengers: 15,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Mall-bound families and shoppers board near Paso de Blas Hypermarket.',
      },
      {
        title: 'Afternoon School Surge',
        timeRange: '3:00 PM – 5:00 PM',
        passengers: 13,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Weekend review and collegiate student activities create calm boarding waves.',
      },
      {
        title: 'Evening Homeward Rush',
        timeRange: '5:30 PM – 8:30 PM',
        passengers: 16,
        maxCapacity: 20,
        badgeStatus: 'Near-Full',
        operationalNotes: 'Dining and shopping crowd returning towards Novaliches residential areas.',
      },
      {
        title: 'Night Sweep',
        timeRange: '8:30 PM – 11:00 PM',
        passengers: 9,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Smooth road conditions; swift transit across entire 9.2 km corridor.',
      },
    ],
  },
  {
    id: 'sun',
    dayAbbr: 'Sun',
    dayFull: 'Sunday',
    dateStr: 'Sun, Sep 21',
    peakOccupancy: 54,
    weather: 'sunny',
    temperature: '32°C',
    surgeStatus: 'Open (<80%)',
    narrative:
      'Lightest day of the entire week! Clear corridors, swift transit runtimes, and abundant seating across morning and evening dispatches.',
    peakCrowdLabel: 'Light & Open (54%)',
    recommendedWindow: 'All Day (Excellent Seating Throughout)',
    fairWeatherImpact: {
      title: 'Calm Sunday Conditions',
      description: 'Ideal travel conditions. Rapid trip transit times with zero congestion choke-points.',
      headway: '8–12 mins',
      terminalWait: '2–5 mins',
    },
    rainWeatherImpact: {
      title: 'Scattered Light Showers',
      description: 'Minimal effect on Sunday transit; roads remain clear with zero passenger queuing.',
      headway: '10–14 mins',
      terminalWait: '5–8 mins',
    },
    timeSlots: [
      {
        title: 'Early Worker Dispatch',
        timeRange: '5:30 AM – 6:30 AM',
        passengers: 5,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Early mass churchgoers; seats wide open across entire cabin.',
      },
      {
        title: 'Morning Peak Rush',
        timeRange: '6:30 AM – 9:00 AM',
        passengers: 10,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Calm and spacious; quick boarding at every designated shelter.',
      },
      {
        title: 'Midday Off-Peak',
        timeRange: '10:00 AM – 2:30 PM',
        passengers: 11,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Post-service family gatherings; peaceful, air-conditioned journeys.',
      },
      {
        title: 'Afternoon School Surge',
        timeRange: '3:00 PM – 5:00 PM',
        passengers: 8,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Negligible student traffic; vehicles operate with plenty of spare capacity.',
      },
      {
        title: 'Evening Homeward Rush',
        timeRange: '5:30 PM – 8:30 PM',
        passengers: 12,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Light Sunday evening homeward movement; quick and relaxing trip.',
      },
      {
        title: 'Night Sweep',
        timeRange: '8:30 PM – 11:00 PM',
        passengers: 6,
        maxCapacity: 20,
        badgeStatus: 'Seats Available',
        operationalNotes: 'Fleet prepares for Monday morning dispatch reset; serene corridor.',
      },
    ],
  },
];

interface ForecastScreenProps {
  onOpenMenu?: () => void;
  onNavigateHome?: () => void;
}

export const ForecastScreen: React.FC<ForecastScreenProps> = ({
  onOpenMenu,
  onNavigateHome,
}) => {
  const [selectedDayId, setSelectedDayId] = useState<string>('mon');
  const [dateScope, setDateScope] = useState<'day' | 'week'>('day');
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('malinta-novaliches');
  const [isCorridorDropdownOpen, setIsCorridorDropdownOpen] = useState(false);
  const [isRainMode, setIsRainMode] = useState(false);

  const activeCorridor =
    CORRIDOR_OPTIONS.find((c) => c.id === selectedCorridorId) || CORRIDOR_OPTIONS[0];

  const currentDayData =
    WEEKLY_FORECAST_DATA.find((d) => d.id === selectedDayId) || WEEKLY_FORECAST_DATA[0];

  const getWeatherIcon = (weather: 'sunny' | 'cloudy' | 'rain', className = 'w-4 h-4') => {
    if (weather === 'sunny') return <Sun className={`${className} text-amber-500`} />;
    if (weather === 'cloudy') return <Cloud className={`${className} text-slate-400`} />;
    return <CloudRain className={`${className} text-sky-500`} />;
  };

  const getDemandColor = (percent: number) => {
    if (percent >= 90) {
      return {
        barBg: 'bg-[#800020]',
        textColor: 'text-[#800020]',
        badgeBg: 'bg-rose-50 text-rose-800 border-rose-200/80',
        label: 'Surge (>90%)',
      };
    }
    if (percent >= 80) {
      return {
        barBg: 'bg-amber-500',
        textColor: 'text-amber-600',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
        label: 'Busy (80–89%)',
      };
    }
    return {
      barBg: 'bg-[#00B14F]',
      textColor: 'text-[#007A37]',
      badgeBg: 'bg-[#00B14F]/10 text-[#007A37] border-[#00B14F]/25',
      label: 'Open (<80%)',
    };
  };

  // Weather Impact based on simulated toggle
  const activeWeatherImpact = isRainMode
    ? currentDayData.rainWeatherImpact
    : currentDayData.fairWeatherImpact;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-50 overflow-y-auto no-scrollbar pb-28 select-none">
      {/* 1. Header Bar with Brand Maroon Accent */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onOpenMenu}
              className="p-1.5 text-slate-700 hover:text-slate-900 active:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex items-center space-x-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#800020]/10 flex items-center justify-center text-[#800020]">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <h1 className="text-[16px] font-bold text-slate-900 tracking-tight">
                Passenger Demand Forecast
              </h1>
            </div>
          </div>

          {/* Scope Segmented Action: Day vs Entire Week */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setDateScope('day')}
              className={`px-2.5 py-1 text-[11.5px] font-semibold rounded-lg transition-all cursor-pointer ${
                dateScope === 'day'
                  ? 'bg-white text-[#800020] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Single Day
            </button>
            <button
              type="button"
              onClick={() => setDateScope('week')}
              className={`flex items-center space-x-1 px-2.5 py-1 text-[11.5px] font-semibold rounded-lg transition-all cursor-pointer ${
                dateScope === 'week'
                  ? 'bg-white text-[#800020] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3 h-3 text-[#800020]" />
              <span>Entire Week</span>
            </button>
          </div>
        </div>

        {/* Corridor Context Selector */}
        <div className="mt-2.5 relative">
          <button
            type="button"
            onClick={() => setIsCorridorDropdownOpen(!isCorridorDropdownOpen)}
            className="w-full px-3 py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-2 overflow-hidden">
              <Compass className="w-3.5 h-3.5 text-[#800020] shrink-0" />
              <div className="truncate">
                <span className="text-[12px] font-bold text-slate-800">
                  {activeCorridor.name}
                </span>
                <span className="text-[11px] text-slate-400 ml-1.5 font-medium">
                  ({activeCorridor.distance})
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0 transition-transform" />
          </button>

          {isCorridorDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40">
              {CORRIDOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCorridorId(c.id);
                    setIsCorridorDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-[12px] hover:bg-slate-50 flex flex-col transition-colors cursor-pointer ${
                    c.id === selectedCorridorId ? 'bg-rose-50/50' : ''
                  }`}
                >
                  <span
                    className={`font-semibold ${
                      c.id === selectedCorridorId ? 'text-[#800020]' : 'text-slate-800'
                    }`}
                  >
                    {c.name} ({c.distance})
                  </span>
                  <span className="text-[10.5px] text-slate-400 mt-0.5">{c.activeDirection}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <div className="px-4 py-3 space-y-3.5">
        {/* Subtitle Scope Narrative */}
        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-bold text-slate-800">
              Weekly Occupancy & Demand Forecast
            </h2>
            <p className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">
              7-day passenger demand outlook along the {activeCorridor.distance} {activeCorridor.name}.
            </p>
          </div>
        </div>

        {/* 2. 7-Day Horizontal Selector Strip */}
        <section className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Day of Week
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Showing:{' '}
              <strong className="text-slate-800 font-bold">{currentDayData.dayFull}</strong>
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEKLY_FORECAST_DATA.map((day) => {
              const isSelected = day.id === selectedDayId;
              const demandStyle = getDemandColor(day.peakOccupancy);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => {
                    setSelectedDayId(day.id);
                    if (dateScope === 'week') setDateScope('day');
                  }}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#800020] text-white shadow-md shadow-[#800020]/20 ring-2 ring-[#800020]/30'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700'
                  }`}
                >
                  <span
                    className={`text-[11.5px] font-bold ${
                      isSelected ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {day.dayAbbr}
                  </span>
                  <div className="my-1.5">
                    {getWeatherIcon(day.weather, 'w-4 h-4')}
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : `${demandStyle.badgeBg} font-bold`
                    }`}
                  >
                    {day.peakOccupancy}%
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Interactive Peak Occupancy Bar Chart Comparison */}
        <section className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                7-Day Peak Occupancy Comparison
              </h3>
              <p className="text-[10.5px] text-slate-400">Tap any bar to inspect day</p>
            </div>
            <div className="flex items-center space-x-1 text-[10.5px] font-semibold text-[#800020] bg-rose-50/70 px-2 py-0.5 rounded-md border border-rose-100">
              <Sparkles className="w-3 h-3" />
              <span>Friday = Weekly Peak (98%)</span>
            </div>
          </div>

          {/* Vertical Bar Chart Container */}
          <div className="pt-2 pb-1">
            <div className="h-36 flex items-end justify-between gap-2 px-1 border-b border-slate-100">
              {WEEKLY_FORECAST_DATA.map((day) => {
                const isSelected = day.id === selectedDayId;
                const demandStyle = getDemandColor(day.peakOccupancy);
                const barHeightPercent = Math.max(20, Math.min(100, day.peakOccupancy));

                return (
                  <button
                    key={`bar-${day.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedDayId(day.id);
                      if (dateScope === 'week') setDateScope('day');
                    }}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Value label on top of bar */}
                    <span
                      className={`text-[10px] font-extrabold mb-1 transition-transform group-hover:scale-110 ${
                        isSelected ? demandStyle.textColor : 'text-slate-500'
                      }`}
                    >
                      {day.peakOccupancy}%
                    </span>

                    {/* Bar Pill background container */}
                    <div className="w-full max-w-[32px] h-28 bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end p-0.5">
                      <div
                        style={{ height: `${barHeightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 ${demandStyle.barBg} ${
                          isSelected ? 'ring-2 ring-slate-900/30 shadow-md' : 'opacity-85 hover:opacity-100'
                        }`}
                      />
                    </div>

                    {/* Bottom Day Label */}
                    <span
                      className={`text-[11px] font-bold mt-1.5 transition-colors ${
                        isSelected ? 'text-[#800020] underline underline-offset-2' : 'text-slate-600'
                      }`}
                    >
                      {day.dayAbbr}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Threshold Legend */}
            <div className="flex items-center justify-between pt-2.5 px-1 text-[10.5px]">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#800020]" />
                <span className="font-bold text-slate-700">&gt;90% Surge</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-semibold text-slate-600">80–89% Busy</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00B14F]" />
                <span className="font-semibold text-slate-600">&lt;80% Open</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Entire Week Summary View OR Selected Day View */}
        {dateScope === 'week' ? (
          <section className="space-y-3">
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-[13px] font-bold text-slate-900">
                  Full 7-Day Network Schedule Outlook
                </h3>
                <span className="text-[11px] font-semibold text-[#800020]">
                  Avg. Peak: 83.6%
                </span>
              </div>

              <div className="divide-y divide-slate-100 mt-1">
                {WEEKLY_FORECAST_DATA.map((day) => {
                  const style = getDemandColor(day.peakOccupancy);
                  return (
                    <div
                      key={`week-row-${day.id}`}
                      onClick={() => {
                        setSelectedDayId(day.id);
                        setDateScope('day');
                      }}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                          {getWeatherIcon(day.weather, 'w-4 h-4')}
                        </div>
                        <div>
                          <p className="text-[12.5px] font-bold text-slate-800">
                            {day.dayFull}{' '}
                            <span className="text-slate-400 font-normal">({day.dateStr})</span>
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {day.recommendedWindow}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-md border ${style.badgeBg}`}
                        >
                          {day.peakOccupancy}%
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          /* Single Day Detailed View */
          <div className="space-y-3.5">
            {/* Day Header & Narrative */}
            <section className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
                    {currentDayData.dayFull}{' '}
                    <span className="text-slate-400 font-medium text-[13px]">
                      ({currentDayData.dateStr})
                    </span>
                  </h3>
                </div>
                <div className="flex items-center space-x-1.5 bg-amber-50/70 border border-amber-200/60 px-2.5 py-1 rounded-xl">
                  {getWeatherIcon(currentDayData.weather, 'w-4 h-4')}
                  <span className="text-[12px] font-bold text-amber-900">
                    {currentDayData.temperature}
                  </span>
                </div>
              </div>

              <p className="text-[12px] text-slate-600 mt-2 leading-relaxed">
                {currentDayData.narrative}
              </p>

              {/* 2 Key Metric Cards: Peak Crowd Level & Recommended Travel Window */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Peak Crowd Level
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center text-[11.5px] font-extrabold px-2 py-0.5 rounded-md border ${
                        getDemandColor(currentDayData.peakOccupancy).badgeBg
                      }`}
                    >
                      {currentDayData.peakCrowdLabel}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Recommended Window
                  </span>
                  <p className="text-[11.5px] font-extrabold text-slate-800 mt-1 truncate">
                    {currentDayData.recommendedWindow}
                  </p>
                </div>
              </div>
            </section>

            {/* Weather Impact Banner with Working Interactive Toggle */}
            <section
              className={`rounded-2xl p-3 border transition-colors shadow-xs ${
                isRainMode
                  ? 'bg-sky-50/90 border-sky-200/90'
                  : 'bg-amber-50/80 border-amber-200/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5">
                    {isRainMode ? (
                      <CloudRain className="w-5 h-5 text-sky-600" />
                    ) : (
                      <Sun className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <h4
                      className={`text-[12.5px] font-bold ${
                        isRainMode ? 'text-sky-950' : 'text-amber-950'
                      }`}
                    >
                      {activeWeatherImpact.title}
                    </h4>
                    <p
                      className={`text-[11px] mt-0.5 leading-snug ${
                        isRainMode ? 'text-sky-800' : 'text-amber-900/80'
                      }`}
                    >
                      {activeWeatherImpact.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRainMode(!isRainMode)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-white text-slate-800 border border-slate-200 shadow-xs hover:bg-slate-50 active:scale-95 transition-all shrink-0 ml-2 cursor-pointer"
                  title="Simulate wet/dry weather shifts on passenger headway"
                >
                  <RotateCw className="w-3 h-3 text-[#800020]" />
                  <span>Toggle Weather</span>
                </button>
              </div>

              {/* Headway & Terminal Wait Impact Metric Bar */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-1">
                  <span className="text-slate-500 font-medium">Avg Headway:</span>
                  <span
                    className={`font-bold ${isRainMode ? 'text-sky-950' : 'text-slate-800'}`}
                  >
                    {activeWeatherImpact.headway}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-500 font-medium">Terminal Queue:</span>
                  <span
                    className={`font-bold ${isRainMode ? 'text-sky-950' : 'text-slate-800'}`}
                  >
                    {activeWeatherImpact.terminalWait}
                  </span>
                </div>
              </div>
            </section>

            {/* 5. Hourly / Time-of-Day Occupancy Breakdown Cards */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {currentDayData.dayFull} Time-of-Day Occupancy Breakdown
                </span>
                <span className="text-[10.5px] font-semibold text-slate-400">
                  6 Dispatch Windows
                </span>
              </div>

              <div className="space-y-2.5">
                {currentDayData.timeSlots.map((slot, index) => {
                  const percent = Math.round((slot.passengers / slot.maxCapacity) * 100);
                  const isSurge = slot.badgeStatus === 'Full (Standing)';
                  const isNear = slot.badgeStatus === 'Near-Full';

                  const badgeColor = isSurge
                    ? 'bg-rose-50 text-[#800020] border-rose-200/80 font-bold'
                    : isNear
                    ? 'bg-amber-50 text-amber-800 border-amber-200/80 font-bold'
                    : 'bg-[#00B14F]/10 text-[#007A37] border-[#00B14F]/25 font-semibold';

                  const barFillColor = isSurge
                    ? 'bg-[#800020]'
                    : isNear
                    ? 'bg-amber-500'
                    : 'bg-[#00B14F]';

                  return (
                    <div
                      key={`slot-${index}`}
                      className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs hover:border-slate-200 transition-colors"
                    >
                      {/* Top Slot Header: Window Name + Pax Count + Status Badge */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-[13.5px] font-bold text-slate-900">
                            {slot.title}
                          </h4>
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{slot.timeRange}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-[12px] font-extrabold text-slate-800">
                            {slot.passengers}/{slot.maxCapacity}{' '}
                            <span className="text-[10.5px] font-medium text-slate-400">pax</span>
                          </span>
                          <span
                            className={`text-[10.5px] px-2 py-0.5 rounded-full border ${badgeColor}`}
                          >
                            {slot.badgeStatus}
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Fill Bar */}
                      <div className="mt-2.5 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${barFillColor}`}
                        />
                      </div>

                      {/* Operational Choke-Point / Travel Notes */}
                      <p className="text-[11.5px] text-slate-500 mt-2 leading-relaxed">
                        {slot.operationalNotes}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

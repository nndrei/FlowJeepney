import { DayOfWeek, DAYS_OF_WEEK } from '../types/forecast';

export interface WeekDayInfo {
  day: DayOfWeek;
  date: Date;
  dateLabel: string; // e.g., "Sep 30"
  dateString: string; // e.g., "Wednesday, September 30"
  dayNumber: number; // e.g., 30
  shortName: string; // e.g., "Mon", "Wed"
  isToday: boolean;
}

/**
 * Returns the current day of the week ('Monday' - 'Sunday')
 */
export function getTodayDayOfWeek(baseDate: Date = new Date()): DayOfWeek {
  const dayIndex = (baseDate.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
  return DAYS_OF_WEEK[dayIndex];
}

/**
 * Computes all 7 days for the current week (Monday through Sunday)
 * centered dynamically on the user's real calendar date.
 */
export function getCurrentWeekDays(baseDate: Date = new Date()): WeekDayInfo[] {
  const current = new Date(baseDate);
  const currentDayIndex = (current.getDay() + 6) % 7; // Monday is 0

  // Find Monday of the current week
  const monday = new Date(current);
  monday.setDate(current.getDate() - currentDayIndex);
  monday.setHours(0, 0, 0, 0);

  const todayStr = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;

  return DAYS_OF_WEEK.map((day, i) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);

    const isToday =
      `${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}` === todayStr;

    const dateLabel = dayDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const dateString = dayDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const shortName = day.slice(0, 3);

    return {
      day,
      date: dayDate,
      dateLabel,
      dateString,
      dayNumber: dayDate.getDate(),
      shortName,
      isToday,
    };
  });
}

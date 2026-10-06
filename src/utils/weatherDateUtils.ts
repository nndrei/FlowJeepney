/**
 * FlowJeep Weather Date & Timezone Utilities
 *
 * Enforces strict Asia/Manila (UTC+08:00) timezone calculations for all weather
 * date comparisons, calendar grouping, and classifications.
 */

export const MANILA_TIMEZONE = 'Asia/Manila';

/**
 * Returns today's ISO date string (YYYY-MM-DD) in Asia/Manila timezone.
 */
export function getManilaTodayString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MANILA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Converts a Date object or Unix timestamp (seconds or milliseconds)
 * into a YYYY-MM-DD date string in Asia/Manila timezone.
 */
export function getManilaDateString(dateOrTimestamp: Date | number): string {
  let d: Date;
  if (typeof dateOrTimestamp === 'number') {
    // If timestamp is in seconds (< 100 billion), convert to ms
    d = dateOrTimestamp < 100000000000 ? new Date(dateOrTimestamp * 1000) : new Date(dateOrTimestamp);
  } else {
    d = dateOrTimestamp;
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MANILA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Classifies an ISO date string (YYYY-MM-DD) as 'past', 'today', or 'future'
 * relative to the current calendar date in Asia/Manila.
 */
export function classifyDateInManila(isoDate: string): 'past' | 'today' | 'future' {
  const today = getManilaTodayString();
  if (isoDate < today) return 'past';
  if (isoDate === today) return 'today';
  return 'future';
}

export interface ManilaDayOption {
  dayName: string; // e.g. 'MON', 'TUE'
  dayNumber: number; // e.g. 6
  monthName: string; // e.g. 'October'
  fullDateString: string; // e.g. 'Tuesday, October 6'
  isoDateString: string; // e.g. '2026-10-06'
  classification: 'past' | 'today' | 'future';
  isToday: boolean;
}

/**
 * Retrieves the year, month, and day for now in Asia/Manila.
 */
function getManilaNowParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10), // 1-based
    day: parseInt(map.day, 10),
  };
}

/**
 * Computes 7 days (Monday through Sunday) for a given week offset
 * (0 = current week, -1 = last week, +1 = next week, etc.)
 * evaluated strictly in Asia/Manila.
 */
export function getManilaWeekDays(weekOffset = 0): ManilaDayOption[] {
  const todayIso = getManilaTodayString();
  const manilaNowParts = getManilaNowParts();

  // Create an anchor at midday UTC for today's Manila calendar date
  const anchor = new Date(
    Date.UTC(manilaNowParts.year, manilaNowParts.month - 1, manilaNowParts.day, 12, 0, 0)
  );

  // Day of week: 0 = Sun, 1 = Mon ... 6 = Sat
  const dayOfWeek = anchor.getUTCDay();
  const distanceToMonday = (dayOfWeek + 6) % 7; // Monday = 0
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - distanceToMonday + weekOffset * 7);

  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const days: ManilaDayOption[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const isoDateString = `${year}-${month}-${day}`;
    const isToday = isoDateString === todayIso;
    const classification = isoDateString < todayIso ? 'past' : isToday ? 'today' : 'future';

    days.push({
      dayName: dayNames[i],
      dayNumber: d.getUTCDate(),
      monthName: monthNames[d.getUTCMonth()],
      fullDateString: d.toLocaleDateString('en-US', {
        timeZone: 'UTC',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      isoDateString,
      classification,
      isToday,
    });
  }

  return days;
}

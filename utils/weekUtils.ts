/**
 * Utility functions for ISO week calculations
 */

/**
 * Get ISO week number for a given date
 */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get start date (Monday) of ISO week for a given year and week number
 */
export function getISOWeekStart(year: number, week: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return ISOweekStart;
}

/**
 * Get end date (Sunday) of ISO week for a given year and week number
 */
export function getISOWeekEnd(year: number, week: number): Date {
  const start = getISOWeekStart(year, week);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Get current ISO week info
 */
export function getCurrentISOWeek(): { year: number; week: number; start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const week = getISOWeek(now);
  const start = getISOWeekStart(year, week);
  const end = getISOWeekEnd(year, week);
  return { year, week, start, end };
}

/**
 * Get ISO week info for a specific week offset (0 = current week, -1 = previous, 1 = next)
 */
export function getISOWeekByOffset(offset: number = 0): { year: number; week: number; start: Date; end: Date } {
  const current = getCurrentISOWeek();
  const targetWeek = current.week + offset;
  let year = current.year;
  let week = targetWeek;

  // Handle year boundaries
  if (week < 1) {
    year -= 1;
    // Get last week of previous year
    const lastWeekOfYear = getISOWeek(new Date(year, 11, 31));
    week = lastWeekOfYear + week;
  } else {
    // Check if week exceeds weeks in current year
    const lastWeekOfYear = getISOWeek(new Date(year, 11, 31));
    if (week > lastWeekOfYear) {
      year += 1;
      week = week - lastWeekOfYear;
    }
  }

  const start = getISOWeekStart(year, week);
  const end = getISOWeekEnd(year, week);
  return { year, week, start, end };
}

/**
 * Format week range for display (e.g., "6-12 Kwi")
 */
export function formatWeekRange(start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('pl-PL', { month: 'short' });
  const endMonth = end.toLocaleDateString('pl-PL', { month: 'short' });

  if (startMonth === endMonth) {
    return `${startDay}-${endDay} ${startMonth}`;
  } else {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }
}




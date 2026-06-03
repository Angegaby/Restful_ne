/** Earliest allowed calendar year for equipment / maintenance records */
export const MIN_CALENDAR_YEAR = 1990;

/** How far ahead expiry dates may be set */
export const MAX_EXPIRY_YEARS_AHEAD = 30;

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function currentCalendarYear(): number {
  return new Date().getFullYear();
}

export function maxExpiryYear(): number {
  return currentCalendarYear() + MAX_EXPIRY_YEARS_AHEAD;
}

/** Parse YYYY-MM-DD as local calendar date; rejects invalid days and absurd years */
export function parseCalendarDate(value: string): Date | null {
  if (!DATE_FORMAT.test(value)) return null;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

type DateCheckResult = { ok: true; date: Date } | { ok: false; message: string };

export function validatePastOrToday(value: string): DateCheckResult {
  const date = parseCalendarDate(value);
  if (!date) {
    return { ok: false, message: 'Enter a valid date (YYYY-MM-DD)' };
  }

  const year = date.getFullYear();
  const maxYear = currentCalendarYear();
  if (year < MIN_CALENDAR_YEAR || year > maxYear) {
    return {
      ok: false,
      message: `Year must be between ${MIN_CALENDAR_YEAR} and ${maxYear}`,
    };
  }

  if (date > startOfToday()) {
    return { ok: false, message: 'Date cannot be in the future' };
  }

  return { ok: true, date };
}

export function validateTodayOrFuture(value: string): DateCheckResult {
  const date = parseCalendarDate(value);
  if (!date) {
    return { ok: false, message: 'Enter a valid date (YYYY-MM-DD)' };
  }

  const year = date.getFullYear();
  const maxYear = maxExpiryYear();
  if (year < MIN_CALENDAR_YEAR || year > maxYear) {
    return {
      ok: false,
      message: `Year must be between ${MIN_CALENDAR_YEAR} and ${maxYear}`,
    };
  }

  if (date < startOfToday()) {
    return { ok: false, message: 'Date must be today or in the future' };
  }

  return { ok: true, date };
}

export function validateExpiryCalendarDate(value: string): DateCheckResult {
  const date = parseCalendarDate(value);
  if (!date) {
    return { ok: false, message: 'Enter a valid expiry date (YYYY-MM-DD)' };
  }

  const year = date.getFullYear();
  const maxYear = maxExpiryYear();
  if (year < MIN_CALENDAR_YEAR || year > maxYear) {
    return {
      ok: false,
      message: `Year must be between ${MIN_CALENDAR_YEAR} and ${maxYear}`,
    };
  }

  return { ok: true, date };
}

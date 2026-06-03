export const MIN_CALENDAR_YEAR = 1990;
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

export function todayIsoDate(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function minCalendarIsoDate(): string {
  return `${MIN_CALENDAR_YEAR}-01-01`;
}

export function maxExpiryIsoDate(): string {
  return `${maxExpiryYear()}-12-31`;
}

export function parseCalendarDate(value: string): Date | null {
  if (!DATE_FORMAT.test(value)) return null;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

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

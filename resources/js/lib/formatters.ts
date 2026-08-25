// js/lib/formatters.ts

// Format number to currency with commas and 2 decimals
export function formatAmount(
  amount: number | null | undefined,
  options?: {
    decimals?: number;
    prefix?: string;
  }
): string {
  if (amount === null || amount === undefined) return '0.00';

  const decimals = options?.decimals ?? 2;
  const prefix = options?.prefix ?? '';

  return prefix + amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Parse a date string for display. A plain "YYYY-MM-DD" is a calendar date,
 * not an instant, so it is built in local time — `new Date('2026-08-25')`
 * would read it as UTC midnight and render the day before in any timezone
 * behind UTC. Everything else keeps the standard parsing.
 */
export function parseDateValue(dateString: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  return dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(dateString);
}

// Format date to MM/DD/YYYY
export function formatDate(
  dateString: string | null | undefined,
  options?: {
    format?: 'short' | 'long';
  }
): string {
  if (!dateString) return 'N/A';

  const date = parseDateValue(dateString);

  if (options?.format === 'long') {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

// Format time only
export function formatTime(
  dateString: string | null | undefined,
  options?: {
    format?: '12h' | '24h';
  }
): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const format = options?.format ?? '12h';

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12h',
  });
}

// Format date with time to MM/DD/YYYY hh:mm AM/PM
export function formatDateTime(
  dateString: string | null | undefined,
  options?: {
    dateFormat?: 'short' | 'long';
    timeFormat?: '12h' | '24h';
  }
): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const timeFormat = options?.timeFormat ?? '12h';

  const dateStr = formatDate(dateString, { format: options?.dateFormat });

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  });

  return `${dateStr} ${timeStr}`;
}

/**
 * Supplier name without the "CODE - " prefix. Prefers the raw name the SAP
 * endpoint sends; the label fallback splits on the first separator only, so
 * names that themselves contain " - " survive intact.
 */
export function supplierNameOf(
  option: { name?: string; label: string } | null | undefined
): string | null {
  if (!option) return null;
  if (option.name) return option.name;

  const separator = option.label.indexOf(' - ');
  return separator === -1 ? option.label : option.label.slice(separator + 3);
}

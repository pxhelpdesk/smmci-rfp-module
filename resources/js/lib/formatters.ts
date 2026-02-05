// lib/formatters.ts

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

// Format date to MM/DD/YYYY
export function formatDate(
  dateString: string | null | undefined,
  options?: {
    format?: 'short' | 'long';
  }
): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);

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

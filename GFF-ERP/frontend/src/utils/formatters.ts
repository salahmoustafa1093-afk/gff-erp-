import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';
import { CURRENCY_SYMBOLS, NUMBER_FORMATS } from './constants';

// ============================================
// Currency Formatting
// ============================================

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'USD',
  decimals: number = NUMBER_FORMATS.CURRENCY_DECIMALS
): string {
  if (amount == null || isNaN(Number(amount))) return '-';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numAmount);
  } catch {
    // Fallback for unsupported currencies
    const formatted = formatNumber(numAmount, decimals);
    return `${symbol}${formatted}`;
  }
}

export function formatCurrencyShort(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '-';

  const absValue = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    return `${sign}$${(absValue / 1_000_000_000).toFixed(1)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}$${(absValue / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}$${(absValue / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

// ============================================
// Number Formatting
// ============================================

export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = NUMBER_FORMATS.DECIMAL_PLACES
): string {
  if (value == null || isNaN(Number(value))) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatInteger(value: number | string | null | undefined): string {
  if (value == null || isNaN(Number(value))) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatPercentage(
  value: number | string | null | undefined,
  decimals: number = NUMBER_FORMATS.PERCENTAGE_DECIMALS,
  includeSign: boolean = true
): string {
  if (value == null || isNaN(Number(value))) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const sign = includeSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}

// ============================================
// Quantity Formatting
// ============================================

export function formatQuantity(
  qty: number | string | null | undefined,
  unit?: string,
  decimals: number = NUMBER_FORMATS.QUANTITY_DECIMALS
): string {
  if (qty == null || isNaN(Number(qty))) return '-';
  const num = typeof qty === 'string' ? parseFloat(qty) : qty;
  const formatted = formatNumber(num, decimals);
  return unit ? `${formatted} ${unit}` : formatted;
}

// ============================================
// Date Formatting
// ============================================

export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = 'MMM dd, yyyy'
): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '-';
    return format(dateObj, formatStr);
  } catch {
    return '-';
  }
}

export function formatDateTime(
  date: string | Date | null | undefined,
  formatStr: string = 'MMM dd, yyyy HH:mm'
): string {
  return formatDate(date, formatStr);
}

export function formatTime(date: string | Date | null | undefined, formatStr: string = 'HH:mm'): string {
  return formatDate(date, formatStr);
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '-';
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return '-';
  }
}

export function formatDateRange(
  startDate: string | Date | null,
  endDate: string | Date | null,
  separator: string = ' - '
): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start === '-' && end === '-') return '-';
  if (start === '-') return `Until ${end}`;
  if (end === '-') return `From ${start}`;
  return `${start}${separator}${end}`;
}

// ============================================
// String Formatting
// ============================================

export function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function capitalizeWords(str: string): string {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '-';
  // Simple formatting - can be enhanced per country
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

// ============================================
// File Size Formatting
// ============================================

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || isNaN(bytes)) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================
// Status Label Formatting
// ============================================

export function formatStatusLabel(status: string): string {
  if (!status) return '-';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// ============================================
// Address Formatting
// ============================================

export function formatAddress(
  address?: string,
  city?: string,
  country?: string,
  postalCode?: string
): string {
  const parts: string[] = [];
  if (address) parts.push(address);
  if (city) parts.push(city);
  if (postalCode) parts.push(postalCode);
  if (country) parts.push(country);
  if (parts.length === 0) return '-';
  return parts.join(', ');
}

// ============================================
// Account Number Masking
// ============================================

export function maskAccountNumber(accountNumber: string, visibleDigits: number = 4): string {
  if (!accountNumber || accountNumber.length <= visibleDigits) return accountNumber;
  const masked = '*'.repeat(accountNumber.length - visibleDigits);
  return masked + accountNumber.slice(-visibleDigits);
}

// ============================================
// Tax Number Formatting
// ============================================

export function formatTaxNumber(taxNumber: string | null | undefined): string {
  if (!taxNumber) return '-';
  // Generic tax number formatting - can be customized per country
  return taxNumber.toUpperCase();
}

// ============================================
// ID Formatting (with leading zeros)
// ============================================

export function formatId(id: string | number | null | undefined, prefix: string = '', length: number = 6): string {
  if (id == null) return '-';
  const numId = typeof id === 'string' ? parseInt(id, 10) || 0 : id;
  return `${prefix}${String(numId).padStart(length, '0')}`;
}
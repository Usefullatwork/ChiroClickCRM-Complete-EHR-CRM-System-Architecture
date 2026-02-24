import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to Norwegian format
 */
export function formatDate(date, format = 'short') {
  if (!date) {
    return '-';
  }

  const d = new Date(date);

  if (format === 'short') {
    return d.toLocaleDateString('no-NO');
  }

  if (format === 'long') {
    return d.toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (format === 'time') {
    return d.toLocaleString('no-NO');
  }

  return d.toLocaleDateString('no-NO');
}

/**
 * Format time to Norwegian format
 */
export function formatTime(time, format = 'short') {
  if (!time) {
    return '-';
  }

  const t = new Date(time);

  if (format === 'short') {
    return t.toLocaleTimeString('no-NO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (format === 'long') {
    return t.toLocaleTimeString('no-NO');
  }

  return t.toLocaleTimeString('no-NO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format currency (Norwegian Kroner)
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('no-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format phone number
 */
export function formatPhone(phone) {
  if (!phone) {
    return '-';
  }

  // Remove +47
  const cleaned = phone.replace('+47', '').replace(/\s/g, '');

  // Format as XXX XX XXX
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5)}`;
  }

  return phone;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) {
    return null;
  }

  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get status badge color
 */
export function getStatusColor(status) {
  const colors = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    FINISHED: 'bg-blue-100 text-blue-800',
    DECEASED: 'bg-red-100 text-red-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Format Norwegian phone number for display
 */
export function formatNorwegianPhone(phone) {
  if (!phone) {
    return '';
  }

  const str = String(phone).replace(/\s/g, '');
  const hasCountryCode = str.startsWith('+47');
  const cleaned = str.replace(/^\+47/, '');

  if (cleaned.length === 8) {
    const formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5)}`;
    return hasCountryCode ? `+47 ${formatted}` : formatted;
  }

  return String(phone);
}

/**
 * Format personnummer for display (mask last 5 digits)
 */
export function formatPersonnummer(personnummer) {
  if (!personnummer) {
    return '';
  }

  const str = String(personnummer);
  if (str.length === 11) {
    return `${str.slice(0, 6)}***`;
  }

  return str;
}

/**
 * Format relative time (e.g., "2 min ago", "3h ago")
 */
export function formatRelativeTime(date) {
  if (!date) return '-';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString('no-NO');
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

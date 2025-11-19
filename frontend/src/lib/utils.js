import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to Norwegian format
 */
export function formatDate(date, format = 'short') {
  if (!date) return '-';

  const d = new Date(date);

  if (format === 'short') {
    return d.toLocaleDateString('no-NO');
  }

  if (format === 'long') {
    return d.toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
  if (!time) return '-';

  const t = new Date(time);

  if (format === 'short') {
    return t.toLocaleTimeString('no-NO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (format === 'long') {
    return t.toLocaleTimeString('no-NO');
  }

  return t.toLocaleTimeString('no-NO', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format currency (Norwegian Kroner)
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-';

  return new Intl.NumberFormat('no-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format phone number
 */
export function formatPhone(phone) {
  if (!phone) return '-';

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
  if (!dateOfBirth) return null;

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
    DECEASED: 'bg-red-100 text-red-800'
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
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

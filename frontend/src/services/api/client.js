/**
 * Axios API Client
 * Shared axios instance with interceptors for auth, CSRF, and error handling
 */

import axios from 'axios';
import logger from '../../utils/logger';
import { API_BASE_URL, API_TIMEOUT } from '../../config/api';

const log = logger.scope('API');

// Secure organization storage using sessionStorage (more secure than localStorage)
// Organization ID is cleared when browser tab is closed
const ORG_STORAGE_KEY = 'org_session';

// Default organization ID for desktop/development mode
const DEV_ORGANIZATION_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Securely store organization ID
 * Uses sessionStorage which is cleared when the browser tab closes
 * @param {string} organizationId - The organization ID to store
 */
export const setOrganizationId = (organizationId) => {
  if (!organizationId) {
    sessionStorage.removeItem(ORG_STORAGE_KEY);
    return;
  }
  // Store with timestamp for potential expiry checks
  const data = {
    id: organizationId,
    ts: Date.now(),
  };
  sessionStorage.setItem(ORG_STORAGE_KEY, btoa(JSON.stringify(data)));
};

/**
 * Retrieve organization ID from secure storage
 * @returns {string|null} The organization ID or null if not set
 */
export const getOrganizationId = () => {
  try {
    const stored = sessionStorage.getItem(ORG_STORAGE_KEY);
    if (!stored) {
      // Fallback to localStorage for migration (remove after initial deployment)
      const legacyId = localStorage.getItem('organizationId');
      if (legacyId) {
        setOrganizationId(legacyId);
        localStorage.removeItem('organizationId'); // Clean up legacy storage
        return legacyId;
      }
      // Use default organization ID in development mode
      if (import.meta.env.DEV) {
        return DEV_ORGANIZATION_ID;
      }
      return null;
    }
    const data = JSON.parse(atob(stored));
    // Optional: Add expiry check (e.g., 24 hours)
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - data.ts > MAX_AGE) {
      sessionStorage.removeItem(ORG_STORAGE_KEY);
      return null;
    }
    return data.id;
  } catch {
    sessionStorage.removeItem(ORG_STORAGE_KEY);
    return null;
  }
};

/**
 * Clear organization ID from storage
 */
export const clearOrganizationId = () => {
  sessionStorage.removeItem(ORG_STORAGE_KEY);
  localStorage.removeItem('organizationId'); // Clean up legacy storage
};

/**
 * Get the base API URL (without /api/v1 suffix) for use outside the axios client
 */
export const getApiBaseUrl = () => {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, '');
};

/**
 * Initialize CSRF protection
 * Fetches CSRF token from the server and stores it for subsequent requests
 * Note: Currently a no-op as backend uses session-based auth
 */
export const initializeCSRF = async () => {
  // CSRF is not needed when using JWT/Bearer token authentication
  // This is a placeholder for future CSRF implementation if needed
  log.debug('API client initialized');
  return true;
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for secure session handling
});

// CSRF token interceptor - reads XSRF-TOKEN cookie and sends as header
apiClient.interceptors.request.use((config) => {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    config.headers['X-XSRF-TOKEN'] = match[1];
  }
  return config;
});

// Request interceptor - Add organization ID header
apiClient.interceptors.request.use(
  async (config) => {
    // Get organization ID from secure storage
    const organizationId = getOrganizationId();
    if (!organizationId) {
      // Organization ID is required for most API calls
      // Allow some endpoints without org ID (e.g., organization selection)
      const exemptPaths = ['/organizations', '/users/me'];
      const isExempt = exemptPaths.some((path) => config.url?.includes(path));

      if (!isExempt) {
        log.error('Organization ID is missing. Please select an organization.');
        return Promise.reject(
          new Error('Organization ID is required. Please select an organization in settings.')
        );
      }
    } else {
      config.headers['X-Organization-Id'] = organizationId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - log warning (desktop mode has no external login page)
          log.warn('401 Unauthorized - session may have expired');
          break;
        case 403:
          // Forbidden
          log.error('Access denied', { message: data.message });
          break;
        case 404:
          // Not found
          log.warn('Resource not found', { message: data.message });
          break;
        case 429:
          // Rate limit exceeded
          log.warn('Too many requests', { message: data.message });
          break;
        case 500:
          // Server error
          log.error('Server error', { message: data.message });
          break;
        default:
          log.error('API error', { status, message: data.message });
      }
    } else if (error.request) {
      // Request made but no response
      log.error('Network error: No response from server');
    } else {
      // Something else happened
      log.error('Request error', { message: error.message });
    }

    return Promise.reject(error);
  }
);

export { API_BASE_URL as API_URL };
export default apiClient;

/**
 * API Client with Security Integration
 * Handles CSRF tokens, authentication, error handling, and rate limiting
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

/**
 * Get CSRF token from cookie
 */
const getCsrfToken = () => {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='));

  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
};

/**
 * Get organization ID from localStorage
 */
const getOrganizationId = () => {
  return localStorage.getItem('organizationId');
};

/**
 * Create axios instance with default config
 */
const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: API_TIMEOUT,
  withCredentials: true, // Send cookies (CSRF token, session)
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Request interceptor - Add CSRF token and organization ID
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Add CSRF token to all non-GET requests
    if (config.method !== 'get') {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Add organization ID to all requests
    const orgId = getOrganizationId();
    if (orgId) {
      config.headers['X-Organization-Id'] = orgId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors globally
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (!response) {
      // Network error
      throw new Error('Network error - please check your connection');
    }

    // Handle specific error codes
    switch (response.status) {
      case 401:
        // Unauthorized - redirect to login
        window.location.href = '/login';
        break;

      case 403:
        // Forbidden - check if 2FA required
        if (response.data?.action === 'ENABLE_2FA') {
          window.location.href = response.data.setupUrl;
        } else if (response.data?.action === 'VERIFY_2FA') {
          window.location.href = '/auth/verify-2fa';
        }
        break;

      case 429:
        // Rate limit exceeded
        const retryAfter = response.data?.retryAfter || response.headers['x-ratelimit-reset'];
        throw new Error(
          `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
        );

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        throw new Error('Server error - please try again later');

      default:
        // Other errors
        throw new Error(response.data?.message || 'An error occurred');
    }

    return Promise.reject(error);
  }
);

/**
 * API Client - Organized by resource
 */
export const api = {
  /**
   * CSRF Token Management
   */
  csrf: {
    async getToken() {
      const response = await axiosInstance.get('/auth/csrf-token');
      return response.data.csrfToken;
    }
  },

  /**
   * Patients API
   */
  patients: {
    async getAll(params = {}) {
      const response = await axiosInstance.get('/patients', { params });
      return response.data;
    },

    async getById(id) {
      const response = await axiosInstance.get(`/patients/${id}`);
      return response.data;
    },

    async create(data) {
      const response = await axiosInstance.post('/patients', data);
      return response.data;
    },

    async update(id, data) {
      const response = await axiosInstance.put(`/patients/${id}`, data);
      return response.data;
    },

    async delete(id) {
      const response = await axiosInstance.delete(`/patients/${id}`);
      return response.data;
    },

    async search(query) {
      const response = await axiosInstance.get('/patients/search', {
        params: { q: query }
      });
      return response.data;
    }
  },

  /**
   * Clinical Encounters API
   */
  encounters: {
    async getAll(patientId, params = {}) {
      const response = await axiosInstance.get(`/patients/${patientId}/encounters`, { params });
      return response.data;
    },

    async getById(encounterId) {
      const response = await axiosInstance.get(`/encounters/${encounterId}`);
      return response.data;
    },

    async create(data) {
      const response = await axiosInstance.post('/encounters', data);
      return response.data;
    },

    async update(encounterId, data) {
      const response = await axiosInstance.put(`/encounters/${encounterId}`, data);
      return response.data;
    },

    async sign(encounterId) {
      const response = await axiosInstance.post(`/encounters/${encounterId}/sign`);
      return response.data;
    },

    async getVersions(encounterId) {
      const response = await axiosInstance.get(`/encounters/${encounterId}/versions`);
      return response.data;
    }
  },

  /**
   * Appointments API
   */
  appointments: {
    async getAll(params = {}) {
      const response = await axiosInstance.get('/appointments', { params });
      return response.data;
    },

    async getById(id) {
      const response = await axiosInstance.get(`/appointments/${id}`);
      return response.data;
    },

    async create(data) {
      const response = await axiosInstance.post('/appointments', data);
      return response.data;
    },

    async update(id, data) {
      const response = await axiosInstance.put(`/appointments/${id}`, data);
      return response.data;
    },

    async cancel(id, reason) {
      const response = await axiosInstance.post(`/appointments/${id}/cancel`, { reason });
      return response.data;
    }
  },

  /**
   * Diagnosis Codes (ICPC-2)
   */
  codes: {
    async getICPC2(params = {}) {
      const response = await axiosInstance.get('/codes/icpc2', { params });
      return response.data;
    },

    async searchICPC2(query) {
      const response = await axiosInstance.get('/codes/icpc2/search', {
        params: { q: query }
      });
      return response.data;
    },

    async getByChapter(chapter) {
      const response = await axiosInstance.get('/codes/icpc2', {
        params: { chapter }
      });
      return response.data;
    }
  },

  /**
   * Templates API
   */
  templates: {
    async getAll(params = {}) {
      const response = await axiosInstance.get('/templates', { params });
      return response.data;
    },

    async getById(id) {
      const response = await axiosInstance.get(`/templates/${id}`);
      return response.data;
    },

    async create(data) {
      const response = await axiosInstance.post('/templates', data);
      return response.data;
    }
  },

  /**
   * AI Suggestions API
   */
  ai: {
    async getSuggestions(context) {
      const response = await axiosInstance.post('/ai/suggest', context);
      return response.data;
    },

    async provideFeedback(suggestionId, feedback) {
      const response = await axiosInstance.post(`/ai/feedback/${suggestionId}`, feedback);
      return response.data;
    }
  },

  /**
   * Dashboard / KPI API
   */
  dashboard: {
    async getKPIs(params = {}) {
      const response = await axiosInstance.get('/dashboard/kpis', { params });
      return response.data;
    },

    async getRecentActivity() {
      const response = await axiosInstance.get('/dashboard/activity');
      return response.data;
    }
  },

  /**
   * GDPR API
   */
  gdpr: {
    async exportPatientData(patientId) {
      const response = await axiosInstance.get(`/gdpr/export/${patientId}`, {
        responseType: 'blob'
      });
      return response.data;
    },

    async deletePatientData(patientId, reason) {
      const response = await axiosInstance.delete(`/gdpr/delete/${patientId}`, {
        data: { reason }
      });
      return response.data;
    }
  },

  /**
   * Audit Log API
   */
  audit: {
    async logAction(action, resourceType, resourceId, metadata = {}) {
      const response = await axiosInstance.post('/audit/log', {
        action,
        resourceType,
        resourceId,
        metadata
      });
      return response.data;
    },

    async getPatientAccessLog(patientId) {
      const response = await axiosInstance.get(`/audit/patient/${patientId}`);
      return response.data;
    }
  }
};

/**
 * Error handling utility
 */
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      message: error.response.data?.message || error.message,
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request made but no response
    return {
      message: 'No response from server - please check your connection',
      status: 0
    };
  } else {
    // Error in request setup
    return {
      message: error.message,
      status: 0
    };
  }
};

export default api;

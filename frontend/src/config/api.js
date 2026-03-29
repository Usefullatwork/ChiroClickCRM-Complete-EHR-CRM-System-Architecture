/**
 * API Configuration
 * Single source of truth for API base URL and timeout settings
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
export const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000;

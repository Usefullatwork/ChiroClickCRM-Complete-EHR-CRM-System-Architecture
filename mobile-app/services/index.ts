/**
 * Services Index
 * Central export for all API services
 */

// API Client
export * from './api';
export { default as api } from './api';

// Authentication
export * from './auth';
export { default as authService } from './auth';

// Exercises
export * from './exercises';
export { default as exerciseService } from './exercises';

// Programs
export * from './programs';
export { default as programService } from './programs';

// Progress
export * from './progress';
export { default as progressService } from './progress';

// Notifications
export * from './notifications';
export { default as notificationService } from './notifications';

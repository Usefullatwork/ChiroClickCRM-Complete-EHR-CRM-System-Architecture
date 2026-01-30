/**
 * Notification Service
 * Push notification API calls
 */

import { get, post, put, ApiResponse } from './api';

// Types
export interface NotificationPreferences {
  dailyReminders: boolean;
  reminderTime: string; // "HH:mm" format
  missedWorkoutReminders: boolean;
  streakReminders: boolean;
  achievementNotifications: boolean;
  programUpdates: boolean;
  clinicianMessages: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// Get notification preferences
export async function getNotificationPreferences(): Promise<ApiResponse<NotificationPreferences>> {
  return get<NotificationPreferences>('/mobile/notifications/preferences');
}

// Update notification preferences
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<ApiResponse<NotificationPreferences>> {
  return put<NotificationPreferences>('/mobile/notifications/preferences', preferences);
}

// Get notification history
export async function getNotifications(
  page = 1,
  pageSize = 20
): Promise<ApiResponse<Notification[]>> {
  return get<Notification[]>(`/mobile/notifications?page=${page}&pageSize=${pageSize}`);
}

// Mark notification as read
export async function markAsRead(notificationId: string): Promise<ApiResponse<void>> {
  return put(`/mobile/notifications/${notificationId}/read`, {});
}

// Mark all as read
export async function markAllAsRead(): Promise<ApiResponse<void>> {
  return put('/mobile/notifications/read-all', {});
}

// Get unread count
export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  return get<{ count: number }>('/mobile/notifications/unread-count');
}

// Test push notification (for debugging)
export async function sendTestNotification(): Promise<ApiResponse<void>> {
  return post('/mobile/notifications/test');
}

export default {
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  sendTestNotification
};

/**
 * Push Notification Utilities
 * Handles notification scheduling and permissions
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = 'chiroclick-notification-settings';

interface NotificationSettings {
  enabled: boolean;
  dailyReminderTime: string; // HH:mm format
  reminderDays: number[]; // 0-6, Sunday = 0
  missedWorkoutReminder: boolean;
  achievementNotifications: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyReminderTime: '08:00',
  reminderDays: [1, 2, 3, 4, 5], // Weekdays
  missedWorkoutReminder: true,
  achievementNotifications: true
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return false;
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Standard',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF'
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Påminnelser',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#34C759'
    });
  }

  return true;
}

/**
 * Get Expo push token for FCM
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'chiroclickcrm'
    });

    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Get notification settings
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save notification settings
 */
export async function saveNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
  try {
    const current = await getNotificationSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));

    // Reschedule notifications with new settings
    await scheduleDailyReminder(updated);
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
}

/**
 * Schedule daily workout reminder
 */
export async function scheduleDailyReminder(settings?: NotificationSettings): Promise<void> {
  const notificationSettings = settings || await getNotificationSettings();

  // Cancel existing reminders
  await cancelAllScheduledNotifications();

  if (!notificationSettings.enabled) return;

  const [hours, minutes] = notificationSettings.dailyReminderTime.split(':').map(Number);

  // Schedule for each enabled day
  for (const dayOfWeek of notificationSettings.reminderDays) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tid for trening! 💪',
        body: 'Dagens øvelser venter på deg. La oss komme i gang!',
        sound: 'default',
        data: { type: 'daily_reminder' }
      },
      trigger: {
        weekday: dayOfWeek + 1, // Expo uses 1-7 (Sunday = 1)
        hour: hours,
        minute: minutes,
        repeats: true
      }
    });
  }
}

/**
 * Schedule missed workout reminder
 */
export async function scheduleMissedWorkoutReminder(exerciseCount: number): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.missedWorkoutReminder) return;

  // Schedule for later same day
  const trigger = new Date();
  trigger.setHours(trigger.getHours() + 4); // 4 hours later

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ikke glem treningen! 🏃',
      body: `Du har ${exerciseCount} øvelse${exerciseCount > 1 ? 'r' : ''} igjen i dag.`,
      sound: 'default',
      data: { type: 'missed_workout' }
    },
    trigger
  });
}

/**
 * Send achievement notification
 */
export async function sendAchievementNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.achievementNotifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: { type: 'achievement', ...data }
    },
    trigger: null // Immediate
  });
}

/**
 * Send streak notification
 */
export async function sendStreakNotification(streakDays: number): Promise<void> {
  const messages: Record<number, { title: string; body: string }> = {
    3: {
      title: '🔥 3-dagers streak!',
      body: 'Du er i gang! Fortsett slik!'
    },
    7: {
      title: '🔥🔥 1 uke i strekk!',
      body: 'En hel uke med konsekvent trening. Fantastisk!'
    },
    14: {
      title: '🔥🔥🔥 2 uker!',
      body: 'To uker med dedikasjon. Du bygger gode vaner!'
    },
    30: {
      title: '💥 30-dagers streak!',
      body: 'En hel måned! Du er en inspirasjon!'
    },
    100: {
      title: '⚡ 100-dagers streak!',
      body: 'UTROLIG! 100 dager på rad. Du er en mester!'
    }
  };

  const message = messages[streakDays];
  if (message) {
    await sendAchievementNotification(message.title, message.body, { streakDays });
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Cancel specific notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Set badge count (iOS)
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear badge (iOS)
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Add notification response listener
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export default {
  requestNotificationPermissions,
  getExpoPushToken,
  getNotificationSettings,
  saveNotificationSettings,
  scheduleDailyReminder,
  scheduleMissedWorkoutReminder,
  sendAchievementNotification,
  sendStreakNotification,
  cancelAllScheduledNotifications,
  cancelNotification,
  getScheduledNotifications,
  setBadgeCount,
  clearBadge,
  addNotificationResponseListener,
  addNotificationReceivedListener
};

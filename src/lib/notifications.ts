import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Pill } from '../types';
import { getReminderDate, formatTime } from './utils';
import { addDays } from 'date-fns';

const BACKGROUND_TASK = 'MEDITRACK_NOTIFICATION_TASK';
const PILL_CATEGORY = 'PILL_REMINDER';

export async function initializeNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pill-reminders', {
      name: 'Pill Reminders',
      importance: Notifications.AndroidImportance.MAX,
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'pill-reminder.wav',
      vibrationPattern: [0, 500, 200, 500],
      enableLights: true,
      lightColor: '#4CAF50',
    });
  }

  await Notifications.setNotificationCategoryAsync(PILL_CATEGORY, [
    {
      identifier: 'TAKE_PILL',
      buttonTitle: '✅ Take Pill',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'SNOOZE',
      buttonTitle: '⏰ Snooze 10min',
      options: { opensAppToForeground: false },
    },
  ]);

  Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
}

async function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const { actionIdentifier, notification } = response;
  const data = notification.request.content.data as { pillId?: string; time?: string };

  if (actionIdentifier === 'TAKE_PILL' && data.pillId && data.time) {
    // Log pill taken via AsyncStorage (store will sync to Supabase)
    const key = `pill_taken_${data.pillId}_${data.time}_${new Date().toISOString().slice(0, 10)}`;
    await AsyncStorage.setItem(key, new Date().toISOString());
    await Notifications.dismissNotificationAsync(notification.request.identifier);
  } else if (actionIdentifier === 'SNOOZE' && data.pillId && data.time) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Pill Reminder (Snoozed)',
        body: notification.request.content.body ?? 'Time to take your medication',
        data: data,
        categoryIdentifier: PILL_CATEGORY,
        sound: 'pill-reminder.wav',
        sticky: true,
        ...(Platform.OS === 'android' && { channelId: 'pill-reminders' }),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 600 },
    });
  }
}

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true, allowCriticalAlerts: true },
  });
  return status === 'granted';
}

export async function schedulePillNotifications(pill: Pill) {
  // Cancel existing for this pill
  await cancelPillNotifications(pill.id);

  const granted = await requestPermissions();
  if (!granted) return;

  const now = new Date();

  for (const time of pill.times) {
    let triggerDate = getReminderDate(time, now);

    // If time already passed today, schedule for tomorrow
    if (triggerDate <= now) {
      triggerDate = getReminderDate(time, addDays(now, 1));
    }

    const secondsUntil = Math.max(1, Math.floor((triggerDate.getTime() - now.getTime()) / 1000));

    await Notifications.scheduleNotificationAsync({
      identifier: `pill_${pill.id}_${time}`,
      content: {
        title: `💊 ${pill.name} Reminder`,
        body: `Time to take ${pill.name} (${pill.dosage}) at ${formatTime(time)}`,
        data: { pillId: pill.id, time, pillName: pill.name },
        categoryIdentifier: PILL_CATEGORY,
        sound: 'pill-reminder.wav',
        sticky: true,
        ...(Platform.OS === 'android' && { channelId: 'pill-reminders' }),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsUntil },
    });
  }

  // Save pill data for background rescheduling
  const stored = await AsyncStorage.getItem('scheduled_pills');
  const pills: Record<string, Pill> = stored ? JSON.parse(stored) : {};
  pills[pill.id] = pill;
  await AsyncStorage.setItem('scheduled_pills', JSON.stringify(pills));
}

export async function cancelPillNotifications(pillId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith(`pill_${pillId}_`)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function dismissPillNotification(pillId: string, time: string) {
  const identifier = `pill_${pillId}_${time}`;
  await Notifications.dismissNotificationAsync(identifier).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
}

// Background task to reschedule notifications
TaskManager.defineTask(BACKGROUND_TASK, async () => {
  try {
    const stored = await AsyncStorage.getItem('scheduled_pills');
    if (!stored) return TaskManager.TaskManagerTaskBody ? undefined : undefined;
    const pills: Record<string, Pill> = JSON.parse(stored);
    for (const pill of Object.values(pills)) {
      await schedulePillNotifications(pill);
    }
  } catch (e) {
    console.error('Background task error:', e);
  }
});

export async function registerBackgroundTask() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
  if (!isRegistered) {
    try {
      await Notifications.registerTaskAsync(BACKGROUND_TASK);
    } catch (e) {
      console.log('Background task registration not available:', e);
    }
  }
}

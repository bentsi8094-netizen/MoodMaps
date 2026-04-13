import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { user_service } from '../services/userService';

/**
 * הגדרות בסיסיות להתנהגות התראות כשהאפליקציה פתוחה
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * בקשת הרשאה וקבלת Push Token
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // שליפת הטוקן (השתמש ב-ProjectID שלך אם קיים ב-Expo Config)
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("[Notifications] Token:", token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * שליחת הטוקן לשרת לעדכון הפרופיל
 */
export async function syncPushTokenWithServer() {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await user_service.update_push_token(token);
    }
  } catch (error) {
    console.error("[Notifications] Sync Error:", error.message);
  }
}

/**
 * הקמת מאזיני התראות (לחיצה על התראה וקבלת התראה כשהאפליקציה פתוחה)
 */
export function setupNotificationListeners(onNotificationTapped) {
  // מאזין ללחיצה על התראה (Response)
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (onNotificationTapped) {
      onNotificationTapped(data);
    }
  });

  // מאזין לקבלת התראה כשהאפליקציה פתוחה
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log("[Notifications] Received while open:", notification.request.content.title);
  });

  return () => {
    Notifications.removeNotificationSubscription(responseListener);
    Notifications.removeNotificationSubscription(notificationListener);
  };
}

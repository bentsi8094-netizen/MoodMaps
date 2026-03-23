import Constants from 'expo-constants';

const getBaseUrl = () => {
  // קודם כל בודק אם יש משתנה סביבה (למשל ב-Vercel)
  // ב-Expo Web המשתנים חייבים להתחיל ב-EXPO_PUBLIC
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // ברירת מחדל אם אין משתנה (למשל בהרצה מקומית)
  return "https://moodmaps-native.onrender.com";
};

export const API_BASE_URL = getBaseUrl();
import Constants from 'expo-constants';

const getBaseUrl = () => {
  // Priority 1: Vercel / CI/CD environment variables (must start with EXPO_PUBLIC_)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Priority 2: Local development / fallback
  return "https://moodmaps-native.onrender.com";
};

export const API_BASE_URL = getBaseUrl();
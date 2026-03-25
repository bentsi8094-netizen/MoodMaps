import Constants from 'expo-constants';

const getBaseUrl = () => {
  // Priority 1: Vercel / CI/CD environment variables (must start with EXPO_PUBLIC_)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Priority 2: Local development detection for Web
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return "http://localhost:5000";
  }
  
  // Priority 3: local/fallback
  return "https://moodmaps-native.onrender.com";
};

export const API_BASE_URL = getBaseUrl();
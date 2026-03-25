import Constants from 'expo-constants';

// אנחנו מגדירים את Render ככתובת היחידה כדי שזה יעבוד בכל מקום
const getBaseUrl = () => {
  return "https://moodmaps-native.onrender.com";
};

export const API_BASE_URL = getBaseUrl();
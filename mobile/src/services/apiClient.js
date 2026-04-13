import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/Config';

let on_unauthorized_callback = null;
let cached_token = null;

export const set_unauthorized_callback = (callback) => {
  on_unauthorized_callback = callback;
};

export const update_api_token = (token) => {
  cached_token = token;
};

const request = async (endpoint, options = {}) => {
  if (!cached_token) {
    cached_token = await AsyncStorage.getItem('user_token');
  }

  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  if (cached_token) {
    headers['Authorization'] = `Bearer ${cached_token}`;
  }
  
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeout_id = setTimeout(() => controller.abort(), options.timeout || 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { 
      ...options, 
      headers, 
      credentials: 'include', 
      signal: controller.signal 
    });
    
    clearTimeout(timeout_id);
    
    if (response.status === 401) {
      cached_token = null;
      await AsyncStorage.removeItem('user_token');
      
      if (on_unauthorized_callback) {
        on_unauthorized_callback();
      }
      
      return { success: false, error: 'unauthorized_access', status: 401 };
    }

    if (response.status === 204) return { success: true };

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || data.message || `Error ${response.status}`,
        errors: data.errors || {}, // מוסיפים את השגיאות המפורטות
        status: response.status 
      };
    }

    return { success: true, ...data };

  } catch (error) {
    clearTimeout(timeout_id);
    return { 
      success: false, 
      error: error.name === 'AbortError' ? 'timeout_error' : 'connection_error'
    };
  }
};

export const api_client = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body = {}, options = {}) => request(endpoint, { 
    ...options, 
    method: 'POST', 
    body: body instanceof FormData ? body : JSON.stringify(body) 
  }),
  put: (endpoint, body = {}, options = {}) => request(endpoint, { 
    ...options, 
    method: 'PUT', 
    body: body instanceof FormData ? body : JSON.stringify(body) 
  }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api_client;
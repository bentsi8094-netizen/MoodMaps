import { api_client } from './apiClient';

const normalize_user = (result) => {
  if (result.success && result.user) {
    result.user.id = result.user._id || result.user.id;
  }
  return result;
};

export const user_service = {
  login: async (email, password, google_token = null) => {
    const result = await api_client.post('/api/users/login', { 
        email, 
        password, 
        google_token 
    });
    return normalize_user(result);
  },

  get_profile: async () => {
    const result = await api_client.get('/api/users/profile');
    return normalize_user(result);
  },

  register_with_image: async (form_data) => {
    const result = await api_client.post('/api/users/register', form_data);
    return normalize_user(result);
  },

  check_email: (email) => 
    api_client.post('/api/users/check-email', { email }),

  update_mood: (last_mood, last_sticker_url) => 
    api_client.post('/api/users/update-mood', { 
      last_mood, 
      last_sticker_url: last_sticker_url || null 
    })
};

export default user_service;
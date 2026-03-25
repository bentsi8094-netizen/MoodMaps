import { api_client } from './apiClient';

export const post_service = {
  get_all_posts: () => api_client.get('/api/posts'),

  create_post: (post_data) => {
    return api_client.post('/api/posts/create', {
      emoji: post_data.emoji || '📍',
      content: post_data.content?.trim() || '',
      sticker_url: post_data.sticker_url || null,
      messages: post_data.messages || []
    });
  },

  get_my_session: async () => {
    return api_client.get('/api/posts/my-session');
  },

  deactivate_status: () => api_client.post('/api/posts/deactivate'),

  update_active_status: (emoji, sticker_url) => {
    return api_client.post('/api/posts/update-active', {
      emoji,
      sticker_url: sticker_url || null
    });
  }
};

export default post_service;
import { api_client } from './apiClient';

export const comment_service = {
  get_comments_by_post: (session_id) => 
    api_client.get(`/api/comments/${session_id}`),

  add_comment: (session_id, comment_data) => {
    if (!comment_data.content?.trim()) {
      return { success: false, error: 'empty_comment' };
    }
    return api_client.post(`/api/comments/${session_id}`, {
      content: comment_data.content.trim(),
      user_alias: comment_data.user_alias,
      user_avatar_url: comment_data.user_avatar_url,
      user_id: comment_data.user_id
    });
  }
};

export default comment_service;
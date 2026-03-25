import { api_client } from './apiClient';

export const chat_service = {
  prepare_chat: async () => {
    return api_client.post('/api/ai/prepare');
  },

  generate_mood: async (history) => {
    if (!Array.isArray(history) || history.length === 0) {
      return { success: false, error: 'empty_or_invalid_history' };
    }

    const sanitized_history = history.filter(msg => msg && typeof msg.content === 'string' && msg.content.trim() !== "");

    if (sanitized_history.length === 0) {
      return { success: false, error: 'no_valid_messages_to_process' };
    }

    return api_client.post('/api/ai/generate-mood', { 
      messages: sanitized_history 
    }, { timeout: 45000 });
  },

  save_conversation: async (messages) => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return { success: false, error: 'nothing_to_save' };
    }

    return api_client.post('/api/ai/save-conversation', { 
      messages 
    });
  },

  get_conversation: async (session_id) => {
    return api_client.get(`/api/ai/${session_id}`);
  },
  
  save_message: async (message) => {
    return api_client.post('/api/ai/message', { message });
  }
};

export default chat_service;
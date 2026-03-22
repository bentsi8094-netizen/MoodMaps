import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { user_service } from '../services/userService';
import { post_service } from '../services/postService';
import { map_service } from '../services/mapService';
import { chat_service } from '../services/chatService';
import { comment_service } from '../services/commentService';
import { set_unauthorized_callback, update_api_token } from '../services/apiClient';

const normalize_user_data = (raw_data) => {
  if (!raw_data) return null;
  return {
    id: raw_data._id || raw_data.id,
    first_name: raw_data.first_name || "משתמש",
    user_alias: raw_data.user_alias || "אנונימי",
    email: raw_data.email,
    mood: raw_data.mood || raw_data.active_emoji || "😀",
    sticker_url: raw_data.sticker_url || null,
    avatar_url: raw_data.avatar_url || raw_data.profile_image || null
  };
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      current_user: null,
      is_loading_user: true,

      init_auth: async () => {
        set({ is_loading_user: true });
        try {
          const token = await AsyncStorage.getItem('user_token');
          if (token) {
            update_api_token(token);
            const response = await user_service.get_profile();
            if (response?.success && response.user) {
              set({ current_user: normalize_user_data(response.user) });
              await Promise.all([
                get().fetch_posts(),
                get().sync_active_session(),
                get().refresh_locations(true)
              ]);
            }
          }
        } catch (e) {
          console.error("[Store] Init Auth Error:", e.message);
        } finally {
          set({ is_loading_user: false });
        }
      },

      login_user: async (user_data, token) => {
        set({ is_loading_user: true }); 
        try {
          const normalized = normalize_user_data(user_data?.user || user_data);
          set({ current_user: normalized });
          if (token) {
            update_api_token(token);
            await AsyncStorage.setItem('user_token', token);
          }
          await Promise.all([
            get().fetch_posts(),
            get().sync_active_session(),
            get().refresh_locations(true)
          ]);
        } catch (e) {
          console.error("[Store] Login Error:", e.message);
        } finally {
          setTimeout(() => set({ is_loading_user: false }), 250);
        }
      },

      logout_user: async (callback) => {
        set({ is_loading_user: true }); 
        try {
          if (callback) await callback();
          
          set({ 
            current_user: null, 
            messages: [], 
            active_posts: [], 
            comments: [] 
          });
          update_api_token(null);
          await AsyncStorage.multiRemove(['user_token']);
        } catch (e) {
          console.error("[Store] Logout Error:", e.message);
        } finally {
          setTimeout(() => set({ is_loading_user: false }), 250);
        }
      },

      update_user_mood: async (new_mood, sticker_url = null) => {
        const { current_user } = get();
        if (!current_user?.id) return { success: false };
        try {
          const response = await user_service.update_mood(new_mood, sticker_url);
          if (response?.success) {
            set({ current_user: { ...current_user, mood: new_mood, sticker_url } });
            return { success: true };
          }
          return response;
        } catch (e) {
          return { success: false, error: e.message };
        }
      },

      active_posts: [],
      is_loading_feed: false,

      fetch_posts: async () => {
        set({ is_loading_feed: true });
        try {
          const result = await post_service.get_all_posts();
          if (result?.success) {
            const normalized = (result.posts || []).map(post => ({
              ...post,
              id: (post._id || post.id)?.toString()
            }));
            set({ active_posts: normalized });
          }
        } catch (error) {
          console.error("[Store] Fetch Posts Error:", error.message);
        } finally {
          set({ is_loading_feed: false });
        }
      },

      add_post: async (post_data) => {
        const { current_user, fetch_posts } = get();
        if (!current_user?.id) return { success: false, error: "no_user" };
        
        try {
          const result = await post_service.create_post(post_data);
          
          if (result?.success) {
            const reconstructed = (result.messages || []).map(m => ({
              ...m,
              role: m.message_number % 2 !== 0 ? 'assistant' : 'user'
            }));
            set({ session_chat: reconstructed });
            if (result.post) {
              const new_post = { 
                ...result.post, 
                id: (result.post._id || result.post.id)?.toString(),
                user_id: result.post.user_id?.toString()
              };
              set(state => ({
                active_posts: [
                  new_post, 
                  ...state.active_posts.filter(p => String(p.user_id).toLowerCase() !== String(current_user.id).toLowerCase())
                ]
              }));
            } else {
              await fetch_posts();
            }
            await get().sync_active_session();
            await get().refresh_locations(true);
            return { success: true };
          }
          return result;
        } catch (error) { 
          return { success: false, error: error.message }; 
        }
      },

      sync_active_session: async () => {
        const { current_user } = get();
        if (!current_user?.id) return;

        try {
          const response = await post_service.get_my_session();
          if (response?.success && response.active) {
            const normalized_post = { 
              ...response.post, 
              id: (response.post._id || response.post.id)?.toString(),
              user_id: response.post.user_id?.toString()
            };
            
            set(state => ({
              active_posts: [
                normalized_post, 
                ...state.active_posts.filter(p => String(p.user_id).toLowerCase() !== String(current_user.id).toLowerCase())
              ],
              comments: response.comments || [],
              messages: (response.chat || []).map(m => ({
                ...m,
                role: m.message_number % 2 !== 0 ? 'assistant' : 'user'
              })) 
            }));
          } else if (response?.success && !response.active) {
            set(state => ({
              active_posts: state.active_posts.filter(p => String(p.user_id).toLowerCase() !== String(current_user.id).toLowerCase()),
              comments: [],
              messages: []
            }));
          }
        } catch (e) {
          console.error("[Store] Sync Active Session Error:", e.message);
        }
      },

      remove_post: async () => {
        const { current_user } = get();
        if (!current_user?.id) return { success: false, error: "missing_user_id" };
        
        try {
          const result = await post_service.deactivate_status();
          if (result?.success) {
            set(state => ({ 
              active_posts: state.active_posts.filter(p => String(p.user_id).toLowerCase() !== String(current_user.id).toLowerCase()),
              messages: [],
              comments: []
            }));
            get().refresh_locations(true);
            return { success: true };
          }
          return result;
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      user_location: null,
      nearby_users: [],
      is_loading_map: false,
      last_map_update: 0,

      refresh_locations: async (force = false) => {
        const now = Date.now();
        const { current_user, last_map_update } = get();
        if (!force && now - last_map_update < 30000) return;
        
        if (force) set({ is_loading_map: true });
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          let coords = null;

          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
            if (loc) {
              coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
              set({ user_location: coords });
            }
          }

          const requests = [map_service.get_map_users()];
          if (coords && current_user?.id) {
            requests.push(map_service.update_location(coords));
          }

          const [mapRes] = await Promise.all(requests);
          if (mapRes?.success) {
            set({ nearby_users: mapRes.users || [], last_map_update: now });
          }
        } catch (error) {
          console.error("[Store] Map Refresh Error:", error.message);
        } finally {
          set({ is_loading_map: false });
        }
      },

      messages: [],
      session_chat: [],
      chat_last_activity: 0,
      chat_owner_id: null,

      add_message: async (msg) => {
        const { current_user, messages } = get();
        if (!current_user?.id) return;

        const new_messages = [...messages, msg];
        set({ messages: new_messages });

        try {
          const res = await chat_service.save_message(msg);
          if (res?.success) {
            if (new_messages.length <= 2) {
                get().refresh_locations(true);
            }
          }
        } catch (e) {
          console.error('[Store] Save Message Error:', e.message);
        }
      },

      update_messages: (new_messages) => {
        set({ messages: new_messages });
      },

      load_and_sync_chat: async () => {
        await get().sync_active_session();
      },

      comments: [],
      is_loading_comments: false,

      fetch_comments: async (session_id) => {
        if (!session_id) return { success: false, error: "missing_session_id" };
        set({ is_loading_comments: true });
        
        try {
          const result = await comment_service.get_comments_by_post(session_id);
          if (result?.success) {
            const normalized = (result.comments || []).map(c => ({
              ...c, id: (c._id || c.id)?.toString()
            }));
            set({ comments: normalized });
          }
          return result;
        } catch (error) {
          return { success: false, error: error.message };
        } finally {
          set({ is_loading_comments: false });
        }
      },

      add_comment: async (session_id, comment_data) => {
        const { current_user } = get();
        if (!current_user?.id || !session_id || !comment_data.content?.trim()) {
          return { success: false, error: "invalid_input" };
        }

        try {
          const result = await comment_service.add_comment(session_id, { content: comment_data.content.trim() });
          if (result?.success && result.comment) {
            const new_comment = {
              ...result.comment,
              id: (result.comment._id || result.comment.id)?.toString(),
              user_alias: current_user.user_alias,
              user_avatar_url: current_user.profile_image,
              user_id: current_user.id
            };
            set(state => ({ comments: [...state.comments, new_comment] }));
            return { success: true, comment: new_comment };
          }
          return result;
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      set_comments: (comments) => set({ comments })
    }),
    {
      name: 'moodmaps-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        current_user: state.current_user, 
        messages: state.messages,
        chat_last_activity: state.chat_last_activity,
        chat_owner_id: state.chat_owner_id
      })
    }
  )
);

set_unauthorized_callback(() => {
  useAppStore.getState().logout_user();
});

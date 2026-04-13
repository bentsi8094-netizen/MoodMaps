import { supabase } from '../config/supabaseClient';

/**
 * מנהל התראות בזמן אמת לווב
 * משתמש ב-Supabase Realtime כדי להאזין לתגובות חדשות
 */
export const setupWebNotificationListener = (onNewComment) => {
  const channel = supabase
    .channel('comment-notifications')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comments' },
      (payload) => {
        if (onNewComment) {
          onNewComment(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
/**
 * מנהל התראות היסטוריה בזמן אמת לווב
 */
export const setupHistoryListener = (userId, onNewNotification) => {
  if (!userId) return () => {};

  const channel = supabase
    .channel(`history-notifications-${userId}`)
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications_history',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (onNewNotification) {
          onNewNotification(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

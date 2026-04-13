const { Expo } = require('expo-server-sdk');
const supabase = require('../config/supabaseClient');

let expo = new Expo();

/**
 * מנוע ההתראות של MoodMaps
 * מטפל בהרשמה לפוסטים (Subscriptions) ובשליחת הודעות Push
 */
const notificationService = {
  
  /**
   * רשימת משתמש כמנוי לעדכונים על פוסט ספציפי
   * @param {string} session_id - מזהה הסשן של הפוסט
   * @param {string} user_id - מזהה המשתמש
   */
  subscribe_to_post: async (session_id, user_id) => {
    try {
      const { error } = await supabase
        .from('post_subscriptions')
        .upsert([{ session_id, user_id }], { onConflict: 'session_id, user_id' });
      
      if (error) {
        console.error("[Notification Service] Subscription Failed:", error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      console.error("[Notification Service] Subscription Error:", e.message);
      return { success: false, error: e.message };
    }
  },

  /**
   * שליחת התראה לכל המנויים של פוסט מסוים
   * @param {object} params - פרמטרי ההתראה
   */
  notify_subscribers: async ({ session_id, sender_id, sender_alias, post_owner_alias, comment_text }) => {
    try {
      // 1. שליפת כל המנויים לסשן הזה מלבד השולח עצמו
      const { data: subscribers, error: subError } = await supabase
        .from('post_subscriptions')
        .select(`
          user_id,
          profiles:user_id (expo_push_token)
        `)
        .eq('session_id', session_id)
        .neq('user_id', sender_id);

      if (subError) throw subError;
      if (!subscribers || subscribers.length === 0) return;

      // 2. איסוף כל הטוקנים התקינים
      let messages = [];
      for (let sub of subscribers) {
        const profile = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles;
        const push_token = profile?.expo_push_token;

        // --- שמירה להיסטוריה בבסיס הנתונים ---
        await supabase.from('notifications_history').insert([{
          user_id: sub.user_id,
          session_id,
          actor_alias: sender_alias,
          post_owner_alias,
          message_preview: comment_text,
          is_read: false
        }]);
        // ------------------------------------

        if (!push_token || !Expo.isExpoPushToken(push_token)) {
          continue;
        }

        messages.push({
          to: push_token,
          sound: 'default',
          title: `תגובה חדשה בפוסט של ${post_owner_alias}`,
          body: `${sender_alias}: ${comment_text}`,
          data: { session_id, type: 'NEW_COMMENT' },
          badge: 1
        });
      }

      if (messages.length === 0) return;

      // 3. שליחה בפועל דרך Expo
      let chunks = expo.chunkPushNotifications(messages);
      let tickets = [];
      
      for (let chunk of chunks) {
        try {
          let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error("[Notification Service] Expo Chunk Send Error:", error);
        }
      }

      return { success: true, count: messages.length };

    } catch (e) {
      console.error("[Notification Service] Notify Error:", e.message);
      return { success: false, error: e.message };
    }
  }
};

module.exports = notificationService;

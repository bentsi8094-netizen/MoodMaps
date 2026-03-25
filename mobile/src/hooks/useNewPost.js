import { useState, useContext, useCallback } from "react";
import { Alert, Keyboard } from "react-native";
import * as Haptics from 'expo-haptics';
import { useAppStore } from "../store/useAppStore";
import { chat_service } from "../services/chatService"; 
import { emoji_utils } from "../utils/emojiUtils"; 

export function useNewPost(on_post_success) {
  const current_user = useAppStore(state => state.current_user);
  const update_user_mood = useAppStore(state => state.update_user_mood);
  const add_post = useAppStore(state => state.add_post);
  const refresh_locations = useAppStore(state => state.refresh_locations);

  const trigger_refresh = useCallback(() => refresh_locations(true), [refresh_locations]);

  const [current_mood, set_current_mood] = useState({ emoji: "😀", sticker_url: null });
  const [post_content, set_post_content] = useState("");
  const [loading, set_loading] = useState(false);
  const [ai_modal_visible, set_ai_modal_visible] = useState(false);
  const [checking_chat, set_checking_chat] = useState(false);

  const handle_open_ai_agent = useCallback(async (initial_query = "") => {
    if (!current_user?.id || checking_chat) return;
    
    // בגלל בעיות סנכרון רשת ספציפיות שלא משפיעות על פתיחת המודל, 
    // אנחנו מדלגים על בקשת prepare_chat ודואגים לפתוח את המסך ישירות
    set_checking_chat(true);
    setTimeout(() => {
      set_ai_modal_visible(true);
      set_checking_chat(false);
    }, 100);
  }, [checking_chat, current_user?.id]);

  const handle_emoji_input = useCallback((val) => {
    if (!val || val === " ") return null;
    const last_char = emoji_utils.get_last_emoji(val);
    
    if (last_char) {
      set_current_mood({ emoji: last_char, sticker_url: null });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return true;
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "זה לא אימוג'י",
        `הקלדת "${val}", תרצה שהסוכן ימצא לך מדבקה מתאימה?`,
        [
          { text: "ביטול", style: "cancel" },
          { text: "דבר עם הסוכן", onPress: () => handle_open_ai_agent(val) }
        ]
      );
      return false;
    }
  }, [handle_open_ai_agent]);

  const handle_publish = useCallback(async () => {
    if (loading || !current_user?.id) return;

    if (!current_mood.emoji && !current_mood.sticker_url) {
      return Alert.alert("חסר משהו", "בחר אימוג'י או מדבקה לפני הפרסום");
    }

    set_loading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();

    try {
      const result = await add_post({
        emoji: current_mood.emoji || '📍',
        sticker_url: current_mood.sticker_url,
        content: post_content.trim(),
        user_avatar_url: current_user?.profile_image || null
      });

      if (result && result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (update_user_mood) {
          await update_user_mood(current_user.id, current_mood.emoji, current_mood.sticker_url);
        }

        if (trigger_refresh) {
          trigger_refresh();
        }
        
        set_post_content("");
        set_current_mood({ emoji: "😀", sticker_url: null });
        
        if (typeof on_post_success === 'function') {
          on_post_success();
        }
      } else {
        throw new Error(result?.error || "Publish failed");
      }
    } catch (e) {
      console.error('[useNewPost] Publish Error:', e.message);
      Alert.alert("שגיאה", "הפרסום נכשל. נסה שוב בעוד רגע.");
    } finally {
      set_loading(false);
    }
  }, [current_mood, current_user, post_content, add_post, update_user_mood, on_post_success, loading, trigger_refresh]);

  return {
    current_mood,
    set_current_mood,
    post_content,
    set_post_content,
    loading,
    ai_modal_visible,
    set_ai_modal_visible,
    checking_chat,
    handle_open_ai_agent,
    handle_emoji_input,
    handle_publish,
    current_user
  };
}
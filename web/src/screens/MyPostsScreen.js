import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import * as Animatable from 'react-native-animatable';
import { useAppStore } from "../store/useAppStore";
import GlassCard from "../components/GlassCard";
import { date_utils } from "../utils/dateUtils";

export default function MyPostsScreen() {
  const current_user = useAppStore(state => state.current_user);
  const update_user_mood = useAppStore(state => state.update_user_mood);
  const posts = useAppStore(state => state.active_posts);
  const remove_post = useAppStore(state => state.remove_post);
  const [is_expired, set_is_expired] = useState(false);
  
  const my_post = posts.find(p => p.user_id === current_user?.id);

  useEffect(() => {
    if (my_post?.created_at) {
      const check_status = () => {
        const active = date_utils.is_post_active(my_post.created_at);
        set_is_expired(!active);
      };

      check_status();
      const interval = setInterval(check_status, 60000);
      return () => clearInterval(interval);
    }
  }, [my_post]);

  const handle_delete = async () => {
    if (is_expired || !current_user?.id) return;

    const on_confirm = async () => {
      try {
        console.log("[MyPosts] Starting deactivation...");
        const result = await remove_post();
        if (result.success) {
          await update_user_mood("😀", null);
          if (Platform.OS !== 'web') Alert.alert("המוד הוסר בהצלחה");
          else alert("המוד הוסר בהצלחה");
        } else {
          const errMsg = result.error || "לא ניתן היה להסיר את המוד";
          if (Platform.OS !== 'web') Alert.alert("שגיאה", errMsg);
          else alert(`שגיאה: ${errMsg}`);
        }
      } catch (e) {
        console.error("[MyPosts] Delete Error:", e.message);
        if (Platform.OS !== 'web') Alert.alert("שגיאה", "לא ניתן היה להסיר את המוד כרגע");
        else alert("שגיאה: לא ניתן היה להסיר את המוד כרגע");
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("הפוסט והמידע שלו יימחקו, האם אתה בטוח שברצונך להסיר?")) {
        await on_confirm();
      }
    } else {
      Alert.alert("הסרת מוד", "הפוסט והמידע שלו יימחקו, האם אתה בטוח שברצונך להסיר?", [
        { text: "ביטול", style: "cancel" },
        { text: "הסר", style: "destructive", onPress: on_confirm }
      ]);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scroll_content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>הסטטוס שלי</Text>
      
      <View style={styles.header_container}>
        {current_user?.profile_image && (
          <Image 
            source={{ uri: current_user.profile_image }} 
            style={styles.user_avatar} 
          />
        )}
        <Text style={styles.alias_header}>
          מחובר בתור: {current_user?.user_alias}
        </Text>
      </View>
      
      {my_post && !is_expired ? (
        <GlassCard style={styles.card}>
          <View style={styles.post_body}>
            <View style={styles.visual_container}>
              {my_post.sticker_url ? (
                <Animatable.View animation="zoomIn" style={styles.sticker_wrapper}>
                  <Animatable.View animation="pulse" iterationCount="infinite" duration={3000}>
                    <Image 
                      source={{ uri: my_post.sticker_url }} 
                      style={styles.main_sticker} 
                      contentFit="contain" 
                    />
                  </Animatable.View>
                </Animatable.View>
              ) : (
                <Text style={styles.emoji}>{my_post.emoji || "😀"}</Text>
              )}
            </View>

            {my_post.content ? (
              <View style={styles.text_container}>
                <Text style={styles.content}>{my_post.content}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity 
            style={[styles.delete_btn, is_expired && styles.disabled_btn]} 
            onPress={handle_delete}
            disabled={is_expired}
          >
            <Text style={[styles.delete_text, is_expired && styles.disabled_text]}>
              {is_expired ? "המוד פג תוקף ⏳" : "הסר את המוד שלי 📍"}
            </Text>
          </TouchableOpacity>
        </GlassCard>
      ) : (
        <View style={styles.empty_container}>
          <Animatable.Text animation="fadeIn" style={styles.empty_text}>
            אין לך מוד פעיל כרגע.
          </Animatable.Text>
          <Text style={styles.empty_sub_text}>שתף את המוד שלך כדי להופיע על המפה!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll_content: { padding: 20, paddingTop: 40, paddingBottom: 150 },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  header_container: { alignItems: 'center', marginBottom: 20 },
  user_avatar: { width: 70, height: 70, borderRadius: 35, marginBottom: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  alias_header: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, textAlign: 'center' },
  card: { minHeight: 320, justifyContent: 'space-between', paddingVertical: 25 },
  post_body: { alignItems: 'center' },
  visual_container: { height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  emoji: { fontSize: 85 }, 
  sticker_wrapper: { alignItems: 'center', justifyContent: 'center' },
  main_sticker: { width: 165, height: 165 }, 
  text_container: { 
    width: '100%', paddingVertical: 20, 
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: 20
  },
  content: { color: 'white', fontSize: 22, textAlign: 'center', lineHeight: 30, paddingHorizontal: 15 },
  delete_btn: { 
    backgroundColor: 'rgba(150, 0, 0, 0.2)', borderWidth: 1, borderColor: '#ff4444',
    padding: 20, borderRadius: 22, alignItems: 'center', marginTop: 20
  },
  disabled_btn: { backgroundColor: 'rgba(100, 100, 100, 0.1)', borderColor: 'rgba(255, 255, 255, 0.1)' },
  delete_text: { color: '#ff4444', fontWeight: 'bold', fontSize: 15 },
  disabled_text: { color: 'rgba(255, 255, 255, 0.4)' },
  empty_container: { marginTop: 100, justifyContent: 'center', alignItems: 'center' },
  empty_text: { color: 'rgba(255,255,255,0.8)', fontSize: 20, fontWeight: '600' },
  empty_sub_text: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 10 }
});
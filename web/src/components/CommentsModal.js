import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, 
  Modal, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { Image } from 'expo-image';
import { useAppStore } from '../store/useAppStore';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CommentsModal({ visible, on_close, session_id, post_alias, post_avatar }) {
  const current_user = useAppStore(state => state.current_user);
  const [local_comments, set_local_comments] = useState([]); 
  const is_loading_comments = useAppStore(state => state.is_loading_comments);
  const fetch_comments_api = useAppStore(state => state.fetch_comments);
  const add_comment_api = useAppStore(state => state.add_comment);
  
  const [new_comment, set_new_comment] = useState('');
  const [is_sending, setIs_sending] = useState(false);
  const insets = useSafeAreaInsets();
  const flat_list_ref = useRef(null);

  useEffect(() => {
    let is_mounted = true;
    if (visible && session_id) {
      const load = async () => {
        const result = await fetch_comments_api(session_id);
        if (is_mounted && result?.success) {
          set_local_comments(result.comments || []);
        }
      };
      load();
    }
    return () => { is_mounted = false; };
  }, [visible, session_id]);

  useEffect(() => {
    if (visible && local_comments.length > 0) {
      setTimeout(() => flat_list_ref.current?.scrollToEnd({ animated: true }), 300);
    }
  }, [visible, local_comments.length]);

  const displayed_comments = useMemo(() => {
    return [...local_comments].sort((a, b) => 
      (a.comment_number || 0) - (b.comment_number || 0)
    );
  }, [local_comments]);

  const handle_send = async () => {
    if (!new_comment.trim() || is_sending) return;
    
    const comment_text = new_comment.trim();
    set_new_comment(''); 
    setIs_sending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await add_comment_api(session_id, { content: comment_text });

      if (result.success && result.comment) {
        set_local_comments(prev => [...prev, result.comment]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => flat_list_ref.current?.scrollToEnd({ animated: true }), 150);
      } else {
        set_new_comment(comment_text);
      }
    } catch (error) {
      set_new_comment(comment_text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIs_sending(false);
    }
  };

  const render_item = useCallback(({ item }) => {
    const current_id = current_user?.id || current_user?._id;
    const is_me = item.user_id?.toString() === current_id?.toString();
    
    return (
      <View style={[styles.comment_wrapper, is_me ? styles.my_comment_wrapper : styles.other_comment_wrapper]}>
        {!is_me && (
          <View style={styles.comment_avatar_container}>
            {item.user_avatar_url ? (
              <Image source={{ uri: item.user_avatar_url }} style={styles.comment_avatar} transition={200} />
            ) : (
              <View style={[styles.comment_avatar, styles.avatar_placeholder]}>
                <Text style={styles.avatar_letter}>{item.user_alias?.[0]?.toUpperCase() || '?'}</Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.comment_bubble, is_me ? styles.my_bubble : styles.other_bubble]}>
          {!is_me && <Text style={styles.comment_alias}>{item.user_alias || "חבר קהילה"}</Text>}
          <Text style={[styles.comment_text, is_me && styles.my_comment_text]}>{item.content}</Text>
          <Text style={[styles.comment_time, is_me && styles.my_comment_time]}>
            {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  }, [current_user?.id]);

  return (
    <Modal 
    navigationBarTranslucent 
    statusBarTranslucent
    visible={visible} 
    animationType="slide" 
    transparent 
    onRequestClose={on_close} 
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.container}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={on_close} hitSlop={15}>
              <Text style={styles.close_btn}>ביטול</Text>
            </TouchableOpacity>

            <View style={styles.header_info}>
              <Text style={styles.title} numberOfLines={1}>תגובות ל{post_alias}</Text>
              <View style={styles.header_avatar_wrapper}>
                {post_avatar ? (
                  <Image source={{ uri: post_avatar }} style={styles.header_avatar} />
                ) : (
                  <View style={[styles.header_avatar, styles.avatar_placeholder]}>
                    <Text style={styles.avatar_letter}>{post_alias?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          <FlatList
            ref={flat_list_ref}
            data={displayed_comments}
            keyExtractor={(item, index) => item.id || `comment_${index}`}
            renderItem={render_item}
            contentContainerStyle={styles.list_content}
            ListEmptyComponent={!is_loading_comments && <Text style={styles.empty_text}>אין עדיין פעילות... תהיו הראשונים!</Text>}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />

          <View style={[styles.input_area, { paddingBottom: Math.max(insets.bottom, 15) }]}>
            <TextInput 
              style={styles.input} 
              placeholder="מה אתה חושב?" 
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={new_comment}
              onChangeText={set_new_comment}
              multiline
              textAlign="right"
              maxLength={500}
            />
            <TouchableOpacity 
              onPress={handle_send} 
              style={[styles.send_btn, (!new_comment.trim() || is_sending) && styles.send_btn_disabled]}
              disabled={!new_comment.trim() || is_sending}
            >
              {is_sending ? <ActivityIndicator size="small" color="#00d5ff" /> : <Text style={styles.send_text}>שלח</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0)', justifyContent: 'flex-end' },
  container: { height: '80%', backgroundColor: '#651542', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  header: { 
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', 
    padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  header_info: { flexDirection: 'row-reverse', alignItems: 'center' },
  header_avatar_wrapper: { marginRight: 10 },
  header_avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#00d5ff' },
  title: { color: 'white', fontSize: 17, fontWeight: '700' },
  close_btn: { color: '#00d5ff', fontSize: 16 },
  list_content: { padding: 15, paddingBottom: 40 },
  comment_wrapper: { marginBottom: 15, width: '100%' },
  my_comment_wrapper: { alignItems: 'flex-end' },
  other_comment_wrapper: { alignItems: 'flex-start', flexDirection: 'row' },
  comment_avatar_container: { marginRight: 10, alignSelf: 'flex-start' },
  comment_avatar: { width: 30, height: 30, borderRadius: 15 },
  avatar_placeholder: { backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  avatar_letter: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  comment_bubble: { maxWidth: '85%', padding: 12, borderRadius: 18 },
  my_bubble: { backgroundColor: '#0077b6', borderBottomRightRadius: 4 },
  other_bubble: { backgroundColor: '#2C2C2E', borderBottomLeftRadius: 4 },
  comment_alias: { fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: '#00d5ff', textAlign: 'right' },
  comment_text: { color: 'white', fontSize: 15, lineHeight: 20, textAlign: 'right' },
  my_comment_text: { color: '#ffffff' },
  comment_time: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 4, textAlign: 'left' },
  my_comment_time: { color: 'rgba(255,255,255,0.5)', textAlign: 'right' },
  empty_text: { color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', marginTop: 40 },
  input_area: { 
    flexDirection: 'row-reverse', padding: 15, 
    backgroundColor: '#651542', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' 
  },
  input: { 
    flex: 1, backgroundColor: '#2C2C2E', borderRadius: 20, 
    paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, minHeight: 40, maxHeight: 100,
    color: 'white', fontSize: 16, textAlign: 'right' 
  },
  send_btn: { marginLeft: 12, marginRight: 40, justifyContent: 'center' },
  send_btn_disabled: { opacity: 1 },
  send_text: { color: '#00d5ff', fontSize: 17, fontWeight: 'bold' }
});
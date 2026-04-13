import React, { useMemo, useState, useEffect, memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useAppStore } from '../store/useAppStore';
import GlassCard from './GlassCard';
import CommentsModal from './CommentsModal';

const FeedCard = ({ post }) => {
  const [is_comments_visible, set_comments_visible] = useState(false);

  const toggle_comments = useCallback((visible) => {
    set_comments_visible(visible);
  }, []);

  const formatted_time = useMemo(() => {
    const raw_date = post?.created_at;
    if (!raw_date) return '';
    const date = new Date(raw_date);
    return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  }, [post?.created_at]);

  if (!post) return null;

  const alias = post.user_alias || 'משתמש אנונימי';
  const sticker = post.sticker_url;
  const avatar_url = post.avatar_url; 
  const session_id = post.session_id?.toString() || post.id?.toString();
  const target_session_id = useAppStore(state => state.target_session_id);

  useEffect(() => {
    if (target_session_id && target_session_id === session_id) {
      set_comments_visible(true);
    }
  }, [target_session_id, session_id]);

  return (
    <View style={styles.outer_container}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.user_info}>
            <View style={styles.text_container}>
              <Text style={styles.user_name}>{alias}</Text>
              <Text style={styles.time}>{formatted_time}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.avatar_wrapper}
              onPress={() => avatar_url && useAppStore.getState().open_viewer(avatar_url)}
            >
              {avatar_url ? (
                <Image 
                  source={{ uri: avatar_url }} 
                  style={styles.avatar_image} 
                  contentFit="cover" 
                  transition={300}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.avatar_placeholder}>
                  <Text style={styles.avatar_text}>
                    {alias?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.main_emoji_container}>
          {sticker ? (
            <Image 
              source={{ uri: sticker }} 
              style={styles.sticker_extra_large} 
              contentFit="contain" 
              transition={500} 
              cachePolicy="memory-disk"
            />
          ) : (
            <Text style={styles.emoji_extra_large}>{post.emoji}</Text>
          )}
        </View>

        {post.content ? (
          <View style={styles.content_container}>
            <Text style={styles.content_text}>{post.content}</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          style={styles.comment_bar} 
          onPress={() => toggle_comments(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.comment_text}>💬 הצג תגובות...</Text>
        </TouchableOpacity>
      </GlassCard>

      {is_comments_visible && session_id && (
        <CommentsModal 
          visible={is_comments_visible} 
          on_close={() => toggle_comments(false)} 
          session_id={session_id} 
          post_alias={alias}
          post_avatar={avatar_url}
        />
      )}
    </View>
  );
};

export default memo(FeedCard, (prevProps, nextProps) => {
  return (
    prevProps.post?.id === nextProps.post?.id &&
    prevProps.post?.content === nextProps.post?.content &&
    prevProps.post?.emoji === nextProps.post?.emoji &&
    prevProps.post?.sticker_url === nextProps.post?.sticker_url &&
    prevProps.post?.avatar_url === nextProps.post?.avatar_url
  );
});

const styles = StyleSheet.create({
  outer_container: { width: '100%', alignItems: 'center' },
  card: { marginBottom: 20, width: '90%', padding: 20 },
  header: { marginBottom: 10 },
  user_info: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  text_container: { marginRight: 12, alignItems: 'flex-end' },
  avatar_wrapper: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  avatar_image: { width: '100%', height: '100%' },
  avatar_placeholder: { flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' },
  avatar_text: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  user_name: { color: '#00d5ff', fontSize: 16, fontWeight: '700' },
  time: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  main_emoji_container: { alignItems: 'center', justifyContent: 'center', marginVertical: 25 },
  emoji_extra_large: { fontSize: 80 },
  sticker_extra_large: { width: 150, height: 150 },
  content_container: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  content_text: { color: 'white', fontSize: 18, lineHeight: 26, textAlign: 'center', opacity: 0.95 },
  comment_bar: { marginTop: 25, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 12 },
  comment_text: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'right' }
});
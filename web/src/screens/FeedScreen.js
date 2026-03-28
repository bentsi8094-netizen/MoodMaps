import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, StyleSheet, View, RefreshControl, Text, ActivityIndicator, Platform } from 'react-native';
import { useFeedFilters } from '../hooks/useFeedFilters';
import FeedCard from '../components/FeedCard';
import * as Animatable from 'react-native-animatable';
import { useAppStore } from '../store/useAppStore';

export default function FeedScreen({ route, navigation }) {
  const target_post_id = route?.params?.target_post_id;
  const { active_posts, is_loading, fetch_posts, find_post_index } = useFeedFilters();
  const current_user = useAppStore(state => state.current_user);
  const flat_list_ref = useRef(null);
  const has_scrolled = useRef(false);

  const on_refresh = useCallback(() => {
    fetch_posts();
  }, [fetch_posts]);

  const getItemLayout = useCallback((data, index) => ({
    length: 420,
    offset: 420 * index,
    index,
  }), []);

  useEffect(() => {
    if (target_post_id) {
      has_scrolled.current = false;
    }
  }, [target_post_id]);

  useEffect(() => {
    let scroll_timer;
    if (target_post_id && active_posts.length > 0 && !has_scrolled.current) {
      const index = find_post_index(target_post_id);
      if (index !== -1) {
        has_scrolled.current = true; 
        scroll_timer = setTimeout(() => {
          flat_list_ref.current?.scrollToIndex({ 
            index, 
            animated: true, 
            viewPosition: 0.5 
          });
          navigation.setParams({ target_post_id: null });
        }, 800);
      }
    }
    return () => clearTimeout(scroll_timer);
  }, [target_post_id, active_posts, find_post_index, navigation]); 

  const render_item = useCallback(({ item, index }) => {
    return (
      <Animatable.View 
        animation={index < 5 ? "fadeInUp" : undefined} 
        duration={600} 
        useNativeDriver
      >
        <FeedCard post={item} />
      </Animatable.View>
    );
  }, []);

  return (
    <View style={styles.container}>
      {is_loading && active_posts.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00b4d8" />
          <Animatable.Text animation="pulse" iterationCount="infinite" style={styles.loadingText}>
            מסנכרן מודים מהסביבה...
          </Animatable.Text>
        </View>
      ) : (
        <FlatList
          ref={flat_list_ref}
          data={active_posts}
          keyExtractor={(item, index) => (item._id || item.id || `post-${index}`).toString()}
          renderItem={render_item}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          onScrollToIndexFailed={(info) => {
            flat_list_ref.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: false
            });
          }}
          refreshControl={
            <RefreshControl refreshing={is_loading} onRefresh={on_refresh} tintColor="#00b4d8" />
          }
          ListEmptyComponent={
            active_posts.length === 0 && current_user ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🕶️</Text>
                <Text style={styles.emptyText}>הפיד ריק כרגע.</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#00b4d8', marginTop: 15, fontWeight: '600', letterSpacing: 0.5 },
  listContent: { paddingVertical: 20, paddingBottom: 140 },
  emptyContainer: { marginTop: 120, alignItems: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 20 },
  emptyText: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 10 }
});
import { useMemo, useContext, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { date_utils } from '../utils/dateUtils';

export function useFeedFilters() {
  const posts = useAppStore(state => state.active_posts);
  const is_loading = useAppStore(state => state.is_loading_feed);
  const fetch_posts = useAppStore(state => state.fetch_posts);

  const active_posts = useMemo(() => {
    if (!posts || !Array.isArray(posts)) return [];
    
    return posts
      .filter(post => {
        const is_time_valid = post && date_utils.is_post_active(post.created_at);
        return is_time_valid && post.is_active !== false;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
  }, [posts]); 

  const find_post_index = useCallback((target_id) => {
    if (!target_id || !active_posts.length) return -1;
    
    const search_id = target_id.toString();
    
    return active_posts.findIndex(p => {
      const p_id = (p._id || p.id)?.toString();
      const u_id = p.user_id?.toString();
      return p_id === search_id || u_id === search_id;
    });
  }, [active_posts]);

  return {
    active_posts,
    is_loading,
    fetch_posts,
    find_post_index
  };
}
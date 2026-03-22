export const date_utils = {
  is_post_active: (created_at) => {
    if (!created_at) return false;
    const post_time = new Date(created_at).getTime();
    const now = Date.now();
    const diff_in_hours = (now - post_time) / (1000 * 60 * 60);
    return diff_in_hours < 24;
  },

  get_post_status: (created_at) => {
    if (!created_at) return 'inactive';
    const active = date_utils.is_post_active(created_at);
    return active ? 'active' : 'expired';
  },

  get_time_remaining: (created_at) => {
    const post_time = new Date(created_at).getTime();
    const expiration_time = post_time + (24 * 60 * 60 * 1000);
    const remaining = expiration_time - Date.now();
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      total_ms: Math.max(0, remaining),
      hours,
      minutes,
      is_expired: remaining <= 0
    };
  }
};
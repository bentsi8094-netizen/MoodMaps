import { api_client } from './apiClient';

export const map_service = {
  update_location: (coords) => {
    if (!coords?.latitude || !coords?.longitude) return;
    return api_client.post('/api/users/update-location', { 
      latitude: coords.latitude, 
      longitude: coords.longitude 
    });
  },

  get_map_users: () => 
    api_client.get('/api/posts/map-users'),

  deactivate_location: () => 
    api_client.post('/api/posts/deactivate')
};

export default map_service;
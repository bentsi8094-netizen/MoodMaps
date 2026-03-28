import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import UniversalMapView, { PROVIDER_GOOGLE } from '../components/UniversalMapView';
import Marker from '../components/UniversalMarker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Animatable from 'react-native-animatable';
import { useAppStore } from "../store/useAppStore";

const UserMarker = memo(({ user, is_me, onPress, map }) => {
  return (
    <Marker
      map={map}
      coordinate={{ 
        latitude: parseFloat(user.latitude) || 0, 
        longitude: parseFloat(user.longitude) || 0 
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={onPress}
      zIndex={is_me ? 999 : 1}
    >
      <View style={styles.marker_wrapper}>
        <Animatable.View
          animation={is_me ? "pulse" : undefined}
          iterationCount={is_me ? "infinite" : 1}
          duration={2000}
          style={[styles.marker_container, is_me && styles.my_marker_container]}
        >
          {user.sticker_url ? (
            <Image 
              source={{ uri: user.sticker_url }} 
              style={styles.marker_sticker} 
              contentFit="contain"
            />
          ) : (
            <Animatable.Text 
              animation={is_me ? "swing" : undefined} 
              iterationCount={is_me ? "infinite" : 1} 
              duration={2500}
              style={styles.marker_emoji}
            >
              {user.active_emoji || user.emoji || '📍'}
            </Animatable.Text>
          )}
        </Animatable.View>
      </View>
    </Marker>
  );
}, (prev, next) => {
  return (
    prev.user.id === next.user.id &&
    prev.user.latitude === next.user.latitude &&
    prev.user.longitude === next.user.longitude &&
    prev.user.emoji === next.user.emoji &&
    prev.user.sticker_url === next.user.sticker_url &&
    prev.map === next.map
  );
});

export default function MapScreen({ navigation }) {
  const current_user = useAppStore(state => state.current_user);
  const nearby_users = useAppStore(state => state.nearby_users);
  const user_location = useAppStore(state => state.user_location);
  const refresh_locations = useAppStore(state => state.refresh_locations);
  const map_ref = useRef(null);
  const [is_map_ready, set_is_map_ready] = useState(false);
  const has_centered = useRef(false);

  useEffect(() => {
    refresh_locations(true);
  }, []);

  useEffect(() => {
    if (is_map_ready && user_location && !has_centered.current) {
      setTimeout(() => {
        map_ref.current?.animateToRegion({
          latitude: user_location.latitude,
          longitude: user_location.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }, 1500);
        has_centered.current = true;
      }, 1000);
    }
  }, [is_map_ready, user_location]);

  const handle_marker_press = useCallback((display_id) => {
    navigation.navigate('Feed', { target_post_id: display_id });
  }, [navigation]);

  const recenter_map = useCallback(() => {
    if (user_location) {
      map_ref.current?.animateToRegion({
        ...user_location,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  }, [user_location]);

  return (
    <View style={styles.container}>
      <UniversalMapView
        ref={map_ref}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        onMapReady={() => set_is_map_ready(true)}
        showsUserLocation={false}
        showsMyLocationButton={false}
        mapPadding={{ top: 0, right: 0, bottom: 90, left: 10 }}
        initialRegion={{
          latitude: user_location?.latitude || 31.7683,
          longitude: user_location?.longitude || 35.2137,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {is_map_ready && nearby_users?.map((user) => (
          <UserMarker
            key={String(user.id)}
            user={user}
            is_me={String(user.id) === String(current_user?.id)}
            onPress={() => handle_marker_press(user.id)}
          />
        ))}
      </UniversalMapView>

      <TouchableOpacity 
        style={styles.recenter_button} 
        onPress={recenter_map}
        activeOpacity={0.7}
      >
        <Ionicons name="locate" size={24} color="#00d5ff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'transparent', 
    marginBottom: 100, // Adjusted for new floating nav bar
    borderRadius: 20, 
    overflow: 'hidden', 
    marginHorizontal: 12, 
    marginTop: 8,
  },
  map: { 
    flex: 1,
    width: '100%', 
    height: '100%',
  },
  marker_wrapper: { 
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker_container: {
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2,
    borderColor: '#f900e9',
  },
  my_marker_container: { 
    borderColor: '#00b4d8', 
  },
  marker_sticker: { 
    width: 25, 
    height: 25,
  },
  marker_emoji: { 
    fontSize: 17, 
  },
  recenter_button: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 213, 255, 0.3)',
    elevation: 8,
  }
});
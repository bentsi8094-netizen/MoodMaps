import React, { memo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Image } from 'expo-image';
import * as Animatable from 'react-native-animatable';

const UserMarker = memo(({ user, is_me, onPress }) => {
  const [tracks_view, set_tracks_view] = useState(true);

  return (
    <Marker
      coordinate={{ 
        latitude: parseFloat(user.latitude), 
        longitude: parseFloat(user.longitude) 
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={onPress}
      zIndex={is_me ? 999 : 1}
      tracksViewChanges={tracks_view} 
    >
      <View style={styles.marker_wrapper}>
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
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
              animation="swing" 
              iterationCount="infinite" 
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
    prev.user.latitude === next.user.latitude &&
    prev.user.longitude === next.user.longitude &&
    prev.user.active_emoji === next.user.active_emoji &&
    prev.user.emoji === next.user.emoji &&
    prev.user.sticker_url === next.user.sticker_url
  );
});

const styles = StyleSheet.create({
  marker_wrapper: { 
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  marker_container: {
    paddingBottom: 2,
    width: 30, 
    height: 30, 
    backgroundColor: '#ffffff00', 
    borderRadius: 15, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2,
    borderColor: '#f900e9',
  },
  my_marker_container: { 
    borderColor: '#00b4d8', 
    borderWidth: 2,
  },
  marker_sticker: { 
    width: 25, 
    height: 25,
  },
  marker_emoji: { 
    fontSize: 17, 
  }
});

export default UserMarker;
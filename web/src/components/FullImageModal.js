import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useAppStore } from '../store/useAppStore';

export default function FullImageModal() {
  const imageUrl = useAppStore(state => state.viewer_image_url);
  const closeViewer = useAppStore(state => state.close_viewer);

  if (!imageUrl) return null;

  return (
    <View style={styles.webOverlay}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      
      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.closeArea} 
        onPress={closeViewer}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.fullImage}
          contentFit="contain"
          transition={350}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeBtn} onPress={closeViewer}>
        <View style={styles.closeIcon}>
          <View style={[styles.line, { transform: [{ rotate: '45deg' }] }]} />
          <View style={[styles.line, { transform: [{ rotate: '-45deg' }], position: 'absolute' }]} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  webOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100000,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeArea: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'zoom-out',
  },
  fullImage: {
    width: '90%',
    height: '90%',
    maxWidth: 1200,
    maxHeight: '90vh',
  },
  closeBtn: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    width: 24,
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  }
});

import React from 'react';
import { 
  Modal, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useAppStore } from '../store/useAppStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FullImageModal() {
  const imageUrl = useAppStore(state => state.viewer_image_url);
  const closeViewer = useAppStore(state => state.close_viewer);

  if (!imageUrl) return null;

  return (
    <Modal
      transparent
      visible={!!imageUrl}
      animationType="fade"
      onRequestClose={closeViewer}
    >
      <View style={styles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.closeArea} 
          onPress={closeViewer}
        >
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.fullImage}
              contentFit="contain"
              transition={300}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeBtn} onPress={closeViewer}>
          <View style={styles.closeIcon}>
            <View style={[styles.line, { transform: [{ rotate: '45deg' }] }]} />
            <View style={[styles.line, { transform: [{ rotate: '-45deg' }], position: 'absolute' }]} />
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_HEIGHT * 0.8,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    width: 20,
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  }
});

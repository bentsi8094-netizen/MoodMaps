import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function GlassCard({ children, style }) {
  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.safe_container}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '95%',
    maxWidth: 440,
    alignSelf: 'center',
    borderRadius: 22,
    marginVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', 
    overflow: 'hidden',
  },
  safe_container: {
    padding: 15,
    width: '100%',
    alignItems: 'stretch', 
  }, 
});
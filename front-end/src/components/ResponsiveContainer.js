import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';

const ResponsiveContainer = ({ children }) => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width > 600;

  if (!isDesktop) {
    return <View style={styles.mobile_full}>{children}</View>;
  }

  return (
    <View style={styles.web_outer_wrapper}>
      <View style={styles.app_frame}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mobile_full: {
    flex: 1,
  },
  web_outer_wrapper: {
    flex: 1,
    backgroundColor: '#0a0a0b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  app_frame: {
    width: 430, // iPhone 14-15 Pro Max width approx
    height: '92%',
    maxHeight: 932,
    backgroundColor: '#000',
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: '#1a1a1c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.6,
    shadowRadius: 35,
    elevation: 25,
    position: 'relative',
  }
});

export default ResponsiveContainer;

import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';

const ResponsiveContainer = ({ children }) => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width > 600;

  React.useEffect(() => {
    if (isWeb) {
      // Simple global CSS for web to handle background and touch behavior
      const style = document.createElement('style');
      style.innerHTML = `
        html, body {
          background-color: #000;
          margin: 0;
          padding: 0;
          height: 100%;
          min-height: 100%;
          width: 100%;
          overflow: hidden;
        }
        #root {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
      `;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
    }
  }, [isWeb]);

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
    height: '100%',
  },
  web_outer_wrapper: {
    flex: 1,
    backgroundColor: '#0a0a0b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
  },
  app_frame: {
    width: 440, // Slightly wider desktop view
    height: '100%',
    maxHeight: '100%',
    backgroundColor: '#000',
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0px 25px 35px rgba(0, 0, 0, 0.6)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.6,
        shadowRadius: 35,
        elevation: 25,
      }
    })
  }
});

export default ResponsiveContainer;

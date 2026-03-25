import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';

const ResponsiveContainer = ({ children }) => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width > 600;

  React.useEffect(() => {
    if (isWeb) {
      // Inject global CSS to constrain portals (Modals) to the app frame width on desktop
      const style = document.createElement('style');
      style.innerHTML = `
        /* RN Web Modal portal root targeting */
        body > div[style*="position: fixed"] {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          background-color: rgba(0,0,0,0.5) !important;
        }

        /* The actual modal container inside the portal */
        body > div[style*="position: fixed"] > div:last-child {
          max-width: 440px !important;
          width: 100% !important;
          margin: 0 auto !important;
          position: relative !important;
          left: auto !important;
          right: auto !important;
          height: 100% !important;
          top: 0 !important;
          border-radius: 0px !important;
          overflow: hidden !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
        }

        /* Target role="dialog" variants */
        [role="dialog"] {
          max-width: 440px !important;
          margin: 0 auto !important;
          border-radius: 0px !important;
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.6,
    shadowRadius: 35,
    elevation: 25,
    position: 'relative',
  }
});

export default ResponsiveContainer;

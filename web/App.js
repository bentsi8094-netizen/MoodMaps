import React from 'react';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

// Force Global Monitoring and Styles on Web
if (Platform.OS === 'web') {
  window.addEventListener('error', (event) => {
    console.error("[Web Critical Error]:", event.error);
  });

  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100vh !important;
      width: 100vw !important;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #000;
    }
    /* Hide Google Maps extra UI */
    .gm-style-cc, .gmnoprint, .gm-style-mtc { display: none !important; }
    a[href^="https://maps.google.com/maps"] { display: none !important; }
  `;
  document.head.appendChild(style);
}

import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAppStore } from './src/store/useAppStore';
import RootNavigator from './src/navigation/RootNavigator';
import ResponsiveContainer from './src/components/ResponsiveContainer';

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

export default function App() {
  if (!GOOGLE_CLIENT_ID) {
    console.warn("Google Client ID is missing. Google Login will be disabled.");
    return (
      <SafeAreaProvider>
        <ResponsiveContainer>
          <RootNavigator />
        </ResponsiveContainer>
      </SafeAreaProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <SafeAreaProvider>
        <ResponsiveContainer>
          <RootNavigator />
        </ResponsiveContainer>
      </SafeAreaProvider>
    </GoogleOAuthProvider>
  );
}

registerRootComponent(App);
import React from 'react';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

// Force Light Mode on Web
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    html, body {
      color-scheme: light !important;
    }
    /* Hide Google Maps extra UI on Web */
    .gm-style-cc, .gmnoprint, .gm-style-mtc {
      display: none !important;
    }
    a[href^="https://maps.google.com/maps"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

import { useAppStore } from './src/store/useAppStore';
import RootNavigator from './src/navigation/RootNavigator';
import ResponsiveContainer from './src/components/ResponsiveContainer';

export default function App() {
  return (
    <SafeAreaProvider>
      <ResponsiveContainer>
        <RootNavigator />
      </ResponsiveContainer>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
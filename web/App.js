import React from 'react';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
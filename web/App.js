import React, { Component } from 'react';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, Text, TouchableOpacity } from 'react-native';

// Simple Error Boundary for Web Debugging
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[App Critical Crash]:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#ff4d4d', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>אופס, משהו השתבש</Text>
          <Text style={{ color: '#ccc', textAlign: 'center', marginBottom: 20 }}>{this.state.error?.toString()}</Text>
          <TouchableOpacity 
            onPress={() => window.location.reload()}
            style={{ backgroundColor: '#00b4d8', padding: 15, borderRadius: 10 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>נסה לרענן את הדף</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// Force Global Monitoring and Styles on Web
if (Platform.OS === 'web') {
  window.addEventListener('error', (event) => {
    console.error("[Web Global Error]:", event.error);
  });

  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100vh !important;
      width: 100vw !important;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #0a0a0b;
    }
    /* Disable all animations on Web for extreme stability if needed */
    * { transition: none !important; }
  `;
  document.head.appendChild(style);
}

import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAppStore } from './src/store/useAppStore';
import RootNavigator from './src/navigation/RootNavigator';
import ResponsiveContainer from './src/components/ResponsiveContainer';

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ResponsiveContainer>
          <RootNavigator />
        </ResponsiveContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  return (
    <ErrorBoundary>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          {content}
        </GoogleOAuthProvider>
      ) : (
        content
      )}
    </ErrorBoundary>
  );
}

registerRootComponent(App);
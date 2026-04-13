import React, { useContext, useCallback, useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets, CardStyleInterpolators } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '../store/useAppStore';
import Sidebar from '../components/Sidebar';
import FullImageModal from '../components/FullImageModal';

import UserMainScreen from '../screens/auth/UserMainScreen';
import MainTabs from './MainTabs';

const Stack = createStackNavigator();

const TransparentTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: 'transparent',
    border: 'transparent',
    notification: 'transparent',
  },
};

function AppHeader() {
  const current_user = useAppStore(state => state.current_user);
  const logout_user = useAppStore(state => state.logout_user);
  const setSidebarOpen = useAppStore(state => state.setSidebarOpen);
  const is_logging_out = useRef(false);


  const handle_logout = useCallback(async () => {
    if (is_logging_out.current) return;
    is_logging_out.current = true;
    try {
      await logout_user();
    } finally {
      is_logging_out.current = false;
    }
  }, [logout_user]);

  const display_name = (current_user?.first_name && current_user.first_name !== "משתמש") 
                        ? current_user.first_name 
                        : (current_user?.user_alias || "חבר");

  return (
    <View style={styles.top_header}>
      <View style={styles.header_left}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.hamburger_btn}>
          <View style={styles.hamburger_line} />
          <View style={[styles.hamburger_line, { width: 14, marginTop: 4 }]} />
          <View style={[styles.hamburger_line, { marginTop: 4 }]} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handle_logout} style={styles.logout_btn}>
          <Text style={styles.logout_text}>התנתק</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.user_section}>
        <Text style={styles.user_name}>היי, {display_name} 👋</Text>
        <TouchableOpacity 
          style={styles.avatar_container} 
          onPress={() => current_user?.avatar_url && useAppStore.getState().open_viewer(current_user.avatar_url)}
        >
          {current_user?.avatar_url ? (
            <Image 
              source={{ uri: current_user.avatar_url }} 
              style={styles.header_avatar} 
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatar_placeholder}>
              <Text style={styles.avatar_initial}>{display_name[0]}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AppWithHeader() {
  const isSidebarOpen = useAppStore(state => state.isSidebarOpen);
  const setSidebarOpen = useAppStore(state => state.setSidebarOpen);

  try {
    console.log("[Navigator] User authenticated. Mounting AppRoot/AppWithHeader.");
    return (
      <View style={styles.full_screen}>
        <AppHeader />
        <MainTabs />
        {typeof isSidebarOpen !== 'undefined' ? (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        ) : null}
      </View>
    );
  } catch (err) {
    console.error("[Navigator Crash] Error in AppWithHeader:", err);
    return <View style={{flex:1, backgroundColor:'red'}}><Text>Navigation Error: {err.message}</Text></View>;
  }
}

export default function RootNavigator() {
  const current_user = useAppStore(state => state.current_user);
  const is_loading = useAppStore(state => state.is_loading_user);
  const init_auth = useAppStore(state => state.init_auth);

  useEffect(() => {
    init_auth();
  }, [init_auth]);

  if (is_loading) {
    return (
      <View style={[styles.center_container, { backgroundColor: '#192f6a' }]}>
        {Platform.OS !== 'web' && <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={StyleSheet.absoluteFill} />}
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    console.log("[Navigator] Mounting Web. User:", current_user ? "Logged In" : "Guest");
    return (
      <View style={{ flex: 1, backgroundColor: '#192f6a', width: '100%', height: '100vh' }}>
        <NavigationContainer theme={TransparentTheme}>
            <Stack.Navigator 
            screenOptions={{ 
              headerShown: false, 
              animationEnabled: false, 
              cardStyle: { backgroundColor: 'transparent', flex: 1 } 
            }}
          >
            {!current_user ? (
              <Stack.Screen name="Auth" component={UserMainScreen}/>
            ) : (
              <Stack.Screen name="AppRoot" component={AppWithHeader} />
              )}
            </Stack.Navigator>
            <FullImageModal />
        </NavigationContainer>
      </View>
    );
  }

  return (
    <View style={[styles.full_screen, { backgroundColor: 'transparent' }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient 
        colors={current_user ? ['#00b4d8', '#9d4edd', '#f72585'] : ['#4c669f', '#3b5998', '#192f6a']} 
        style={StyleSheet.absoluteFill} 
      />
      <SafeAreaView style={[styles.safe_area, { backgroundColor: 'transparent' }]}>
        <NavigationContainer theme={TransparentTheme}>
          <Stack.Navigator 
            screenOptions={{ 
              headerShown: false, 
              animationEnabled: false, 
              detachPreviousScreen: false,
              gestureEnabled: false, 
              cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
              cardStyle: { 
                backgroundColor: 'transparent',
                elevation: 0,
                shadowOpacity: 0,
                shadowColor: 'transparent',
              } 
            }}
          >
            {!current_user ? (
              <Stack.Screen name="Auth" component={UserMainScreen}/>
            ) : (
            <Stack.Group>
                <Stack.Screen name="AppRoot" component={AppWithHeader} />
              </Stack.Group>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  full_screen: { flex: 1 },
  center_container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3b5998' },
  safe_area: { flex: 1, paddingBottom: 0 },
  top_header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10,
    zIndex: 20 
  },
  user_name: { color: 'white', fontWeight: 'bold', fontSize: 16, marginRight: 10 },
  user_section: { flexDirection: 'row', alignItems: 'center' },
  avatar_container: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  header_avatar: { width: '100%', height: '100%' },
  avatar_placeholder: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  avatar_initial: { color: 'white', fontWeight: 'bold' },
  logout_text: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  logout_btn: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  header_left: { flexDirection: 'row', alignItems: 'center' },
  hamburger_btn: { padding: 10, marginRight: 5, cursor: 'pointer' },
  hamburger_line: { height: 2, width: 20, backgroundColor: 'white', borderRadius: 1 },
});
/ /   F o r c e d   r e f r e s h   C o m m i t  
 
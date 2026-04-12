import React, { useContext, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets, CardStyleInterpolators } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '../store/useAppStore';

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
  const is_logging_out = useRef(false);

  const normalize_user_data = (raw_data) => {
    if (!raw_data) return null;
    try {
      return {
        id: String(raw_data._id || raw_data.id || "unknown"),
        first_name: raw_data.first_name || "משתמש",
        user_alias: raw_data.user_alias || raw_data.email?.split('@')[0] || "אנונימי",
        email: raw_data.email || "",
        mood: raw_data.mood || raw_data.active_emoji || "😀",
        sticker_url: raw_data.sticker_url || null,
        avatar_url: raw_data.avatar_url || raw_data.profile_image || null
      };
    } catch (e) {
      console.error("[Store] Normalization failed:", e);
      return null;
    }
  };

  const handle_logout = useCallback(async () => {
    if (is_logging_out.current) return;
    is_logging_out.current = true;
    try {
      await logout_user();
    } finally {
      is_logging_out.current = false;
    }
  }, [logout_user]);

  const user = normalize_user_data(current_user);
  const display_name = (user?.first_name && user.first_name !== "משתמש") 
                        ? user.first_name 
                        : (user?.user_alias || "חבר");

  return (
    <View style={styles.top_header}>
      <TouchableOpacity onPress={handle_logout} style={styles.logout_btn}>
        <Text style={styles.logout_text}>התנתק</Text>
      </TouchableOpacity>
      
      <View style={styles.user_section}>
        <Text style={styles.user_name}>היי, {display_name} 👋</Text>
        <View style={styles.avatar_container}>
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
        </View>
      </View>
    </View>
  );
}

function AppWithHeader() {
  return (
    <View style={styles.full_screen}>
      <AppHeader />
      <MainTabs />
    </View>
  );
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
});

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';

import FeedScreen from '../screens/FeedScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import MapScreen from '../screens/MapScreen';
import NewPostScreen from '../screens/NewPostScreen';

const Tab = createMaterialTopTabNavigator();

function CustomTabBar({ state, navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 600;
  
  const container_style = [
    styles.nav_bar_container,
    isDesktop && {
      width: 440,
      left: (width - 440) / 2
    }
  ];

  return (
    <View style={container_style} pointerEvents="box-none">
      <View style={styles.nav_bar}>
        <TouchableOpacity
          style={styles.special_btn}
          onPress={() => navigation.navigate('NewPost')}
        >
          <Text style={styles.special_btn_text}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('MyPosts')}
          style={styles.tab_btn}
        >
          <Text style={[styles.nav_text, state.index === 2 && styles.active_nav_text]}>המוד שלי</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Feed')}
          style={styles.tab_btn}
        >
          <Text style={[styles.nav_text, state.index === 1 && styles.active_nav_text]}>פיד</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Map')}
          style={styles.tab_btn}
        >
          <Text style={[styles.nav_text, state.index === 0 && styles.active_nav_text]}>מפה</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Feed"
      tabBarPosition="bottom"
      tabBar={props => <CustomTabBar {...props} />}
      style={{ backgroundColor: 'transparent', flex: 1 }}
      screenOptions={{
        swipeEnabled: false,
        animationEnabled: true,
        tabBarBounces: true,
      }}
      sceneContainerStyle={{ backgroundColor: 'transparent', flex: 1 }}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="MyPosts" component={MyPostsScreen} />
      <Tab.Screen name="NewPost" component={NewPostScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  nav_bar_container: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 14, 
    width: '100%',
    alignItems: 'center',
    zIndex: 1000
  },
  nav_bar: {
    flexDirection: 'row-reverse',
    width: '94%',
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    paddingHorizontal: 5,
  },
  tab_btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  nav_text: {
    color: 'white',
    fontWeight: '600',
    opacity: 0.7,
    fontSize: 13,
  },
  active_nav_text: {
    opacity: 1,
    textDecorationLine: 'underline',
    fontWeight: 'bold', // Added bold for better visibility
  },
  special_btn: {
    backgroundColor: '#00b4d8',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 3
  },
  special_btn_text: {
    color: 'white',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: Platform.OS === 'web' ? 38 : 42, 
    textAlign: 'center',
    includeFontPadding: false,
  }
});

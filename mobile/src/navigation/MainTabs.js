import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

import FeedScreen from '../screens/FeedScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import MapScreen from '../screens/MapScreen';
import NewPostScreen from '../screens/NewPostScreen';

const Tab = createMaterialTopTabNavigator();

function CustomTabBar({ state, navigation }) {

  return (
    <View style={styles.nav_bar_container} pointerEvents="box-none">
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
          <Text style={[styles.nav_text, (state.index === 0) && styles.active_nav_text]}>פיד</Text>
        </TouchableOpacity>


        <TouchableOpacity
          onPress={() => navigation.navigate('Map')}
          style={styles.tab_btn}
        >
          <Text style={[styles.nav_text, state.index === 1 && styles.active_nav_text]}>מפה</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

export default function MainTabs() {
  const navigation = useNavigation();
  const target_id = useAppStore(state => state.target_session_id);

  useEffect(() => {
    if (target_id) {
      navigation.navigate('Feed', { target_post_id: target_id });
    }
  }, [target_id, navigation]);

  return (
    <Tab.Navigator
      initialRouteName="Feed"
      tabBarPosition="bottom"
      tabBar={props => <CustomTabBar {...props} />}
      style={{ backgroundColor: 'transparent' }}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        tabBarBounces: true,
      }}
      sceneContainerStyle={{ backgroundColor: 'transparent', elevation: 0 }}
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
    position: 'absolute',
    bottom: 8,
    width: '100%',
    alignItems: 'center',
    zIndex: 1000
  },
  nav_bar: {
    flexDirection: 'row-reverse',
    width: '94%',
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  tab_btn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  nav_text: {
    color: 'white',
    fontWeight: '600',
    opacity: 0.7
  },
  active_nav_text: {
    opacity: 1,
    textDecorationLine: 'underline'
  },
  special_btn: {
    backgroundColor: '#00b4d8',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: "#000000ff",
    shadowOpacity: 0.2,
    shadowRadius: 3
  },
  special_btn_text: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold'
  }
});

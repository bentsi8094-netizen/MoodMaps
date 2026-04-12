import React from 'react';
import { View, Text, Platform } from 'react-native';

let MapViewExport;

if (Platform.OS === 'web') {
  MapViewExport = React.forwardRef(({ children, style }, ref) => (
    <View ref={ref} style={[style, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#00b4d8', fontSize: 16, fontWeight: '600' }}>המפה זמינה כרגע באפליקציית ה-Mobile</Text>
    </View>
  ));
} else {
  const MapView = require('react-native-maps').default;
  MapViewExport = MapView;
}

export const PROVIDER_GOOGLE = 'google';
export const Marker = Platform.OS === 'web' ? View : require('react-native-maps').Marker;

export default MapViewExport;

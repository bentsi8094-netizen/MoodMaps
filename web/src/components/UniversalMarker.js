import { Platform, View } from 'react-native';

const Marker = Platform.OS === 'web' ? View : require('react-native-maps').Marker;

export default Marker;

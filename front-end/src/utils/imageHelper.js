import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const pick_image = async (use_camera = false) => {
  const permission_result = use_camera 
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission_result.granted) {
    Alert.alert("חסרה הרשאה", "חייבים הרשאה כדי להעלות תמונה");
    return null;
  }

  const options = {
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    selectionLimit: 1,
    allowsMultipleSelection: false,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    tintColor: '#00b4d8', 
  };

  try {
    const result = use_camera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
  } catch (error) {
    console.error("Image Picker Error:", error);
    Alert.alert("שגיאה", "לא ניתן היה לגשת לתמונה");
  }
  
  return null;
};
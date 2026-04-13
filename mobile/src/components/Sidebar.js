import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  TextInput, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75;

export default function Sidebar({ isOpen, onClose }) {
  const [slideAnim] = useState(new Animated.Value(-SIDEBAR_WIDTH));
  const current_user = useAppStore(state => state.current_user);
  const update_profile = useAppStore(state => state.update_profile);
  const notifications = useAppStore(state => state.notifications);
  const mark_read = useAppStore(state => state.mark_notification_read);

  // מצבי עריכה
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(current_user?.first_name || '');
  const [userAlias, setUserAlias] = useState(current_user?.user_alias || '');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState(null);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    if (isOpen) {
      setFirstName(current_user?.first_name || '');
      setUserAlias(current_user?.user_alias || '');
      setSelectedImage(null);
      setErrorText(null);
      useAppStore.getState().set_target_session(null);
    }
  }, [isOpen]);

  const toggleEditing = () => {
    Haptics.selectionAsync();
    setIsEditing(!isEditing);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setIsSaving(true);
    setErrorText(null);
    
    // הכנת FormData להעלאת תמונה אם נבחרה
    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('user_alias', userAlias);
    
    if (selectedImage) {
      const filename = selectedImage.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      formData.append('avatar', { uri: selectedImage, name: filename, type });
    }

    const res = await update_profile(formData);
    setIsSaving(false);
    if (res?.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorText(res?.error || "עדכון נכשל");
    }
  };

  if (!isOpen && slideAnim._value === -SIDEBAR_WIDTH) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Overlay לעצירת לחיצה בחוץ */}
      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.overlay} 
        onPress={onClose} 
      />

      <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}>
        <BlurView intensity={80} tint="dark" style={styles.blurBackground}>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header / Profile */}
            <View style={styles.profileHeader}>
              <View>
                <TouchableOpacity 
                   onPress={isEditing ? pickImage : () => current_user?.avatar_url && useAppStore.getState().open_viewer(current_user.avatar_url)}
                >
                  <Image source={{ uri: selectedImage || current_user?.avatar_url }} style={styles.avatar} />
                  {isEditing && (
                    <View style={styles.cameraOverlay}>
                      <Text style={{ fontSize: 20 }}>📷</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.profileFields}>
                {errorText && <Text style={styles.errorTextLabel}>{errorText}</Text>}
                {isEditing ? (
                  <>
                    <TextInput 
                      style={styles.input} 
                      value={firstName} 
                      onChangeText={setFirstName} 
                      placeholder="שם פרטי"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                    />
                    <TextInput 
                      style={styles.input} 
                      value={userAlias} 
                      onChangeText={setUserAlias} 
                      placeholder="כינוי (Alias)"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.profileName}>{current_user?.first_name}</Text>
                    <Text style={styles.profileAlias}>@{current_user?.user_alias}</Text>
                  </>
                )}
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.editBtnText}>{isEditing ? 'Save Changes' : 'Change'}</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Notifications */}
            <Text style={styles.sectionTitle}>Notifications</Text>
            {notifications.length === 0 ? (
              <Text style={styles.emptyText}>אין התראות חדשות</Text>
            ) : (
              notifications.map((note) => (
                <TouchableOpacity 
                  key={note.id} 
                  style={[styles.noteItem, !note.is_read && styles.noteUnread]} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    mark_read(note.id);
                    if (note.session_id) {
                      useAppStore.getState().set_target_session(note.session_id);
                      onClose();
                    }
                  }}
                >
                  <Text style={[styles.noteText, !note.is_read && styles.noteTextBold]}>
                    {note.actor_alias} הגיב לפוסט של {note.post_owner_alias}
                  </Text>
                  <Text style={styles.noteSubText} numberOfLines={1}>
                    בפוסט שאתה עוקב אחריו: {note.message_preview}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            <View style={{ flex: 1 }} />

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerLink}>מדיניות פרטיות MoodMaps</Text>
              <Text style={styles.footerInfo}>Version 1.0.4 | © 2025 MoodMaps Inc.</Text>
            </View>
          </ScrollView>

        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebarContainer: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1000,
  },
  blurBackground: {
    flex: 1,
    paddingTop: 60,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'white',
  },
  profileFields: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileName: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileAlias: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  errorTextLabel: {
    color: '#ff4d4d',
    fontSize: 12,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    textAlign: 'center',
  },
  editBtn: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 15,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  noteItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  noteUnread: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  noteText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'left',
  },
  noteTextBold: {
    fontWeight: 'bold',
    color: 'white',
  },
  noteSubText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'left',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerLink: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textDecorationLine: 'underline',
    marginBottom: 5,
  },
  footerInfo: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  }
});

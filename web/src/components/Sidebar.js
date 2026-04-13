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
import { useAppStore } from '../store/useAppStore';

const SIDEBAR_WIDTH = 400; // רוחב קבוע לווב

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState(null);

  const fileInputRef = React.useRef(null);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
      duration: 350,
      useNativeDriver: true,
    }).start();
    
    if (isOpen) {
      setFirstName(current_user?.first_name || '');
      setUserAlias(current_user?.user_alias || '');
      setPreviewUrl(null);
      setSelectedFile(null);
      setErrorText(null);
      useAppStore.getState().set_target_session(null);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setIsSaving(true);
    setErrorText(null);
    
    // הכנת FormData
    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('user_alias', userAlias);
    if (selectedFile) {
        formData.append('avatar', selectedFile);
    }

    const res = await update_profile(formData);
    setIsSaving(false);
    if (res?.success) {
      setIsEditing(false);
    } else {
      setErrorText(res?.error || "עדכון נכשל");
    }
  };

  // Always render to prevent removeChild DOM errors on web

  return (
    <View 
      style={[
        styles.fullOverlay, 
        { 
          pointerEvents: isOpen ? 'auto' : 'none',
          opacity: isOpen ? 1 : 0
        }
      ]}
    >
      {/* Overlay לעצירת לחיצה בחוץ */}
      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.overlay} 
        onPress={onClose} 
      />

      <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}>
        <BlurView intensity={95} tint="dark" style={styles.blurBackground}>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
              {/* Header / Profile */}
            <View style={styles.profileHeader}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileChange}
              />
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={isEditing ? () => fileInputRef.current?.click() : () => current_user?.avatar_url && useAppStore.getState().open_viewer(current_user.avatar_url)}
                style={styles.avatarWrapper}
              >
                <Image source={{ uri: previewUrl || current_user?.avatar_url }} style={styles.avatar} />
                {isEditing && (
                  <View style={styles.cameraOverlay}>
                    <Text style={{ fontSize: 18 }}>📷</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.profileFields}>
                {errorText && <Text style={styles.errorLabel}>{errorText}</Text>}
                {isEditing ? (
                  <>
                    <TextInput 
                      style={styles.input} 
                      value={firstName} 
                      onChangeText={setFirstName} 
                      placeholder="שם פרטי"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                    />
                    <TextInput 
                      style={styles.input} 
                      value={userAlias} 
                      onChangeText={setUserAlias} 
                      placeholder="כינוי (Alias)"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.profileName}>{current_user?.first_name}</Text>
                    <Text style={styles.profileAlias}>@{current_user?.user_alias}</Text>
                  </>
                )}
              </View>
              <TouchableOpacity 
                style={[styles.editBtn, isSaving && { opacity: 0.7 }]} 
                onPress={handleSaveProfile} 
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.editBtnText}>{isEditing ? 'Save Changes' : 'Change Profile'}</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Notifications */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notification History</Text>
              {notifications.some(n => !n.is_read) && (
                <View style={styles.unreadBadge} />
              )}
            </View>

            {notifications.length === 0 ? (
              <Text style={styles.emptyText}>עדיין אין היסטוריית התראות</Text>
            ) : (
              notifications.map((note) => (
                <TouchableOpacity 
                  key={note.id} 
                  style={[styles.noteItem, !note.is_read && styles.noteUnread]} 
                  onPress={() => {
                    mark_read(note.id);
                    if (note.session_id) {
                        useAppStore.getState().set_target_session(note.session_id);
                        onClose();
                    }
                  }}
                >
                  <View style={styles.noteIndicator}>
                    {!note.is_read && <View style={styles.dot} />}
                  </View>
                  <View style={styles.noteContent}>
                    <Text style={[styles.noteText, !note.is_read && styles.noteTextBold]}>
                      {note.actor_alias} הגיב לפוסט של {note.post_owner_alias}
                    </Text>
                    <Text style={styles.noteSubText} numberOfLines={2}>
                      בפוסט שאתה עוקב אחריו: {note.message_preview}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            <View style={{ flex: 1, minHeight: 40 }} />

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity>
                <Text style={styles.footerLink}>מדיניות פרטיות MoodMaps</Text>
              </TouchableOpacity>
              <Text style={styles.footerInfo}>Design & Dev by Antigravity | Version 1.0.4</Text>
              <Text style={styles.footerInfo}>© 2025 MoodMaps. כל הזכויות שמורות.</Text>
            </View>
          </ScrollView>

        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sidebarContainer: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    boxShadow: '10px 0 30px rgba(0,0,0,0.2)',
  },
  blurBackground: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 5,
  },
  avatarWrapper: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#f72585',
    marginBottom: 15,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  errorLabel: {
    color: '#ff4d4d',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  profileFields: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileAlias: {
    color: '#4cc9f0',
    fontSize: 15,
    marginTop: 4,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    outlineWidth: 0,
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  editBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 19,
    fontWeight: '700',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f72585',
    marginLeft: 8,
  },
  noteItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  noteUnread: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginHorizontal: -10,
    paddingHorizontal: 10,
  },
  noteIndicator: {
    width: 20,
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f72585',
  },
  noteContent: {
    flex: 1,
  },
  noteText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'left',
    lineHeight: 20,
  },
  noteTextBold: {
    fontWeight: '700',
    color: 'white',
  },
  noteSubText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'left',
    fontStyle: 'italic',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'left',
    marginTop: 10,
    fontSize: 14,
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
    opacity: 0.6,
  },
  footerLink: {
    color: 'white',
    fontSize: 13,
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
  footerInfo: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginBottom: 3,
  }
});

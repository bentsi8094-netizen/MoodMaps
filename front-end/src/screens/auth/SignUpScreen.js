import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  ScrollView, 
  Image, 
  Keyboard, 
  Platform 
} from "react-native";
import GlassCard from "../../components/GlassCard";
import { user_service } from "../../services/userService"; 
import { pick_image } from "../../utils/imageHelper";
import { generate_alias } from "../../utils/aliasGenerator";

export default function SignUpScreen({ on_register }) {
  const [step, set_step] = useState(1);
  const [is_loading, set_is_loading] = useState(false);
  const [image_uri, set_image_uri] = useState(null);
  const [show_password, set_show_password] = useState(false);
  const [form_data, set_form_data] = useState({
    first_name: "", last_name: "", email: "", password: "", user_alias: ""
  });

  const navigate_to_step = (next_step) => {
    Keyboard.dismiss();
    set_step(next_step);
  };

  const handle_generate_new_alias = useCallback(() => {
    const suggested = generate_alias(form_data.first_name);
    set_form_data(prev => ({ ...prev, user_alias: suggested }));
  }, [form_data.first_name]);

  useEffect(() => {
    if (step === 3 && !form_data.user_alias) {
      handle_generate_new_alias();
    }
  }, [step]);

  const handle_image_selection = async (use_camera) => {
    const uri = await pick_image(use_camera);
    if (uri) set_image_uri(uri);
  };

  const validate_current_step = () => {
    const { first_name, last_name, email, password } = form_data;
    if (step === 1) {
      if (first_name.trim().length < 2 || last_name.trim().length < 2) {
        Alert.alert("שם חסר", "נא להזין שם תקין");
        return false;
      }
    }
    if (step === 2) {
      const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email_regex.test(email.trim()) || password.length < 6) {
        Alert.alert("פרטים לא תקינים", "בדוק אימייל או אורך סיסמה");
        return false;
      }
    }
    return true;
  };

  const handle_submit = async () => {
    if (!image_uri) return Alert.alert("תמונה חובה", "חובה להעלות תמונת פרופיל כדי להמשיך");
    
    set_is_loading(true);
    try {
      const data = new FormData();
      data.append('first_name', form_data.first_name.trim());
      data.append('last_name', form_data.last_name.trim());
      data.append('email', form_data.email.trim().toLowerCase());
      data.append('password', form_data.password);
      data.append('user_alias', form_data.user_alias.trim());

      const file_name = image_uri.split('/').pop() || 'profile.jpg';
      
      if (Platform.OS === 'web') {
        const response = await fetch(image_uri);
        const blob = await response.blob();
        data.append('profile_image', blob, file_name);
      } else {
        data.append('profile_image', {
          uri: Platform.OS === 'ios' ? image_uri.replace('file://', '') : image_uri,
          name: file_name,
          type: `image/${file_name.split('.').pop() || 'jpeg'}`
        });
      }

      const response = await user_service.register_with_image(data);
      if (response.success) {
        on_register(response.user, response.token);
      } else {
        Alert.alert("רישום נכשל", response.error || "פרטי הרישום תפוסים");
      }
    } catch (err) {
      Alert.alert("שגיאת תקשורת", "החיבור לשרת נכשל.");
    } finally {
      set_is_loading(false);
    }
  };

  const update_field = (field, value) => set_form_data(prev => ({ ...prev, [field]: value }));

  return (
    <View style={[styles.container, Platform.OS === 'web' && { flex: 1, width: '100%' }]}>
      <ScrollView 
        contentContainerStyle={styles.scroll_content} 
        keyboardShouldPersistTaps="always"
      >
        <GlassCard>
          <Text style={styles.step_indicator}>שלב {step} מתוך 3</Text>
          
          {step === 1 && (
            <View>
              <TextInput style={styles.input} placeholder="שם פרטי" placeholderTextColor="#ccc" value={form_data.first_name} onChangeText={(v) => update_field('first_name', v)} />
              <TextInput style={styles.input} placeholder="שם משפחה" placeholderTextColor="#ccc" value={form_data.last_name} onChangeText={(v) => update_field('last_name', v)} />
              <TouchableOpacity style={styles.button} onPress={() => validate_current_step() && navigate_to_step(2)}>
                <Text style={styles.button_text}>המשך</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View>
              <TextInput style={styles.input} placeholder="אימייל" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholderTextColor="#ccc" value={form_data.email} onChangeText={(v) => update_field('email', v)} />
              <View style={styles.password_container}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="סיסמה" secureTextEntry={!show_password} placeholderTextColor="#ccc" value={form_data.password} onChangeText={(v) => update_field('password', v)} />
                <TouchableOpacity style={styles.eye_icon} onPress={() => set_show_password(!show_password)}>
                  <Text style={{ fontSize: 18 }}>{show_password ? "👁️" : "🙈"}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.button, styles.back_btn]} onPress={() => navigate_to_step(1)}>
                  <Text style={styles.button_text}>חזור</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, {flex: 2}]} onPress={() => validate_current_step() && navigate_to_step(3)}>
                  <Text style={styles.button_text}>המשך</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <View style={styles.image_section}>
                {image_uri ? (
                  <Image source={{ uri: image_uri }} style={styles.preview_image} />
                ) : (
                  <View style={styles.image_placeholder}>
                    <Text style={{color: '#aaa', fontSize: 12}}>תמונה חובה</Text>
                  </View>
                )}
                <View style={styles.media_actions}>
                  <TouchableOpacity style={styles.media_btn} onPress={() => handle_image_selection(true)}>
                    <Text style={styles.media_btn_text}>מצלמה 📸</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.media_btn} onPress={() => handle_image_selection(false)}>
                    <Text style={styles.media_btn_text}>גלריה 🖼️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TextInput style={styles.input} placeholder="כינוי בקהילה" placeholderTextColor="#ccc" autoCorrect={false} value={form_data.user_alias} onChangeText={(v) => update_field('user_alias', v.replace(/\s/g, '_'))} />
              <TouchableOpacity onPress={handle_generate_new_alias} style={styles.alias_refresh}>
                <Text style={styles.alias_refresh_text}>🎲 הצע שם אחר</Text>
              </TouchableOpacity>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.button, styles.back_btn]} onPress={() => navigate_to_step(2)}>
                  <Text style={styles.button_text}>חזור</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, {flex: 2}, styles.submit_btn]} onPress={handle_submit} disabled={is_loading}>
                  {is_loading ? <ActivityIndicator color="white" /> : <Text style={styles.button_text}>סיום ורישום</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { /* flex: 1 הוסר כדי למנוע מתיחה */ }, 
  scroll_content: { paddingVertical: 20, paddingHorizontal: 20, flexGrow: 1, justifyContent: 'center' }, 
  step_indicator: { color: '#00b4d8', textAlign: 'center', marginBottom: 20, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, color: 'white', marginBottom: 15, textAlign: 'right' },
  password_container: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 15, overflow: 'hidden' },
  eye_icon: { paddingHorizontal: 15 },
  button: { backgroundColor: '#00b4d8', padding: 15, borderRadius: 12, alignItems: 'center', height: 55, justifyContent: 'center' },
  submit_btn: { backgroundColor: '#0077b6' },
  button_text: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  back_btn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  image_section: { alignItems: 'center', marginBottom: 15 },
  preview_image: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#00b4d8' },
  image_placeholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  media_actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  media_btn: { backgroundColor: 'rgba(0,180,216,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, borderWidth: 1, borderColor: '#00b4d8' },
  media_btn_text: { color: '#00b4d8', fontSize: 12, fontWeight: 'bold' },
  alias_refresh: { alignSelf: 'center', padding: 5, marginBottom: 10 },
  alias_refresh_text: { color: '#00b4d8', fontSize: 13, textDecorationLine: 'underline' }
});

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
import { useGoogleLogin } from '@react-oauth/google';
import GlassCard from "../../components/GlassCard";
import ErrorText from "../../components/ErrorText";
import { user_service } from "../../services/userService"; 
import { pick_image } from "../../utils/imageHelper";
import { generate_alias } from "../../utils/aliasGenerator";
import { 
  validate_email, 
  validate_password, 
  validate_name, 
  validate_alias 
} from "../../utils/validationHelper";

const GOOGLE_G_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4Ij48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMjQgOS41YzMuNTQgMCA2LjcyIDEuMjMgOS4yMSAzLjI1bDYuODItNi44MkMzNS44NCAzLjM0IDMwLjU1IDIgMjQgMiA4LjA4IDIgNC43NyAxMi4xNSAzIDIzLjU2bDEwuMjIgNy45MkMxNC41OSAxMy42NiAxOC44NiA5LjUgMjQgOS41eiIvPjxwYXRoIGZpbGw9IiM0Mjg1RjQiIGQ9Ik00Ni41IDI0YzAtMS41OC0uMTQtMy4xMS0uNDEtNC41SDI0djloMTIuN2MtLjYgMy4xOS0yLjQyIDUuODUtNC45OCA3LjU4bDUuOTggNy45MkM0Mi41NiA0MCA0Ni41IDMzLjIyIDQ2LjUgMjR6Ii8+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTEwLjQ3IDMxLjgxQTE1LjkzIDE1LjkzIDAgMCAxIDkgMjRjMC0yLjY3LjQ1LTUuMjYgMS4yNy03LjY5TDEwLjIzIDguMzlDNi4zNiAxNS44MiA0IDI0IDQgMjRzMi4zNiA4LjE4IDYuMjMgMTUuNjFsNC4yNC0zLjh6Ii8+PHBhdGggZmlsbD0iIzM0QTg1MyIgZD0iTTI0IDQ0YzUuNDQgMCA5Ljg4LTEuNzggMTMuMjItNC44M2wtNS45OC03LjkyYy0xLjg0IDEuMjUtNC4yMiAyLjA1LTcuMjQgMi4wNS01LjE0IDAtOS40MS0zLjQ5LTEwLjk3LTguMTlsLTEwLjIxIDcuOTJDMTAuODQgNDAgMTUuMjggNDQgMjQgNDR6Ii8+PHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGg0OHY0OEgwVnoiLz48L3N2Zz4=";

export default function SignUpScreen({ on_register }) {
  const [step, set_step] = useState(1);
  const [is_loading, set_is_loading] = useState(false);
  const [image_uri, set_image_uri] = useState(null);
  const [show_password, set_show_password] = useState(false);
  const [form_data, set_form_data] = useState({
    first_name: "", last_name: "", email: "", password: "", user_alias: ""
  });
  const [errors, set_errors] = useState({});

  const navigate_to_step = (next_step) => {
    Keyboard.dismiss();
    set_step(next_step);
  };

  const handle_step_2_continue = async () => {
    if (!validate_current_step()) return;

    set_is_loading(true);
    set_errors({});
    try {
      const resp = await user_service.check_email(form_data.email.trim().toLowerCase());
      if (resp.success && resp.exists === false) {
        navigate_to_step(3);
      } else {
        set_errors({ email: resp.error || "האימייל כבר קיים במערכת" });
      }
    } catch (err) {
      set_errors({ general: "נכשלה בדיקה מול השרת" });
    } finally {
      set_is_loading(false);
    }
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
    const current_errors = {};

    if (step === 1) {
      const first_name_err = validate_name(first_name, 'first');
      const last_name_err = validate_name(last_name, 'last');
      if (first_name_err) current_errors.first_name = first_name_err;
      if (last_name_err) current_errors.last_name = last_name_err;
    }
    
    if (step === 2) {
      const email_err = validate_email(email);
      const password_err = validate_password(password);
      if (email_err) current_errors.email = email_err;
      if (password_err) current_errors.password = password_err;
    }

    if (step === 3) {
      if (!image_uri) current_errors.profile_image = "חובה להעלות תמונה";
      const alias_err = validate_alias(form_data.user_alias);
      if (alias_err) current_errors.user_alias = alias_err;
    }

    set_errors(current_errors);
    return Object.keys(current_errors).length === 0;
  };

  let login_with_google;
  try {
    login_with_google = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
        set_is_loading(true);
        set_errors({});
        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          const payload = await res.json();
          
          set_form_data({
            ...form_data,
            email: payload.email,
            first_name: payload.given_name || "",
            last_name: payload.family_name || "",
            password: "GOOGLE_AUTH_SERVICE"
          });
          set_errors({});
          set_step(3);
        } catch (error) {
          set_errors({ general: "נכשלה גישה לנתוני גוגל" });
        } finally {
          set_is_loading(false);
        }
      },
      onError: () => set_errors({ general: 'התחברות עם גוגל נכשלה' }),
    });
  } catch (e) {
    console.warn("Google Login hook failed (likely missing Provider):", e);
    login_with_google = () => Alert.alert("שירות לא זמין", "הרשמה עם גוגל אינה זמינה כרגע.");
  }

  const handle_submit = async () => {
    if (!validate_current_step()) return;
    
    set_is_loading(true);
    try {
      const data = new FormData();
      data.append('first_name', form_data.first_name.trim());
      data.append('last_name', form_data.last_name.trim());
      data.append('email', form_data.email.trim().toLowerCase());
      data.append('password', form_data.password);
      data.append('user_alias', form_data.user_alias.trim());

      const file_name = image_uri.split('/').pop() || 'profile.jpg';
      const safe_file_name = file_name.includes('.') ? file_name : `${file_name}.jpg`;
      
      if (Platform.OS === 'web') {
        const img_response = await fetch(image_uri);
        const blob = await img_response.blob();
        data.append('profile_image', blob, safe_file_name);
      } else {
        data.append('profile_image', {
          uri: Platform.OS === 'ios' ? image_uri.replace('file://', '') : image_uri,
          name: safe_file_name,
          type: `image/${safe_file_name.split('.').pop() || 'jpeg'}`
        });
      }

      const response = await user_service.register_with_image(data);
      if (response.success) {
        on_register(response.user, response.token);
      } else {
        if (response.errors) {
          set_errors(response.errors);
          
          // ניווט אוטומטי לשלב השגיאה
          if (response.errors.first_name || response.errors.last_name) set_step(1);
          else if (response.errors.email || response.errors.password) set_step(2);
          else if (response.errors.profile_image || response.errors.user_alias) set_step(3);
        } else {
          set_errors({ general: response.error || "רישום נכשל" });
        }
      }
    } catch (err) {
      Alert.alert("שגיאת תקשורת", "החיבור לשרת נכשל.");
    } finally {
      set_is_loading(false);
    }
  };

  const update_field = (field, value) => {
    set_form_data(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      set_errors(prev => ({ ...prev, [field]: null }));
    }
    if (errors.general) {
      set_errors(prev => ({ ...prev, general: null }));
    }
  };

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
              <ErrorText error={errors.first_name} />
              
              <TextInput style={styles.input} placeholder="שם משפחה" placeholderTextColor="#ccc" value={form_data.last_name} onChangeText={(v) => update_field('last_name', v)} />
              <ErrorText error={errors.last_name} />

              <TouchableOpacity style={styles.button} onPress={() => validate_current_step() && navigate_to_step(2)}>
                <Text style={styles.button_text}>המשך</Text>
              </TouchableOpacity>

              <View style={styles.separator}>
                <View style={styles.line} />
                <Text style={styles.separator_text}>או</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.google_btn_wrapper}>
                <TouchableOpacity 
                  style={styles.custom_google_btn} 
                  onPress={() => login_with_google()}
                  activeOpacity={0.8}
                >
                  <View style={styles.google_logo_container}>
                    <Image source={{ uri: GOOGLE_G_LOGO }} style={styles.google_logo} />
                  </View>
                  <Text style={styles.google_text}>Sign up with Google</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <TextInput style={styles.input} placeholder="אימייל" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholderTextColor="#ccc" value={form_data.email} onChangeText={(v) => update_field('email', v)} />
              <ErrorText error={errors.email} />

              <View style={styles.password_container}>
                <TouchableOpacity style={styles.eye_icon} onPress={() => set_show_password(!show_password)}>
                  <Text style={{ fontSize: 22 }}>{show_password ? "👁️" : "🙈"}</Text>
                </TouchableOpacity>
                <TextInput 
                  style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent', paddingRight: 10, outlineStyle: 'none' }]} 
                  placeholder="סיסמה" 
                  secureTextEntry={!show_password} 
                  placeholderTextColor="#ccc" 
                  value={form_data.password} 
                  onChangeText={(v) => update_field('password', v)} 
                />
              </View>
              <ErrorText error={errors.password} />
              <View style={styles.row}>
                <TouchableOpacity style={[styles.button, styles.back_btn]} onPress={() => navigate_to_step(1)}>
                  <Text style={styles.button_text}>חזור</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, {flex: 2}]} 
                  onPress={handle_step_2_continue}
                  disabled={is_loading}
                >
                  {is_loading && step === 2 ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.button_text}>המשך</Text>
                  )}
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
                  <View style={[styles.image_placeholder, errors.profile_image && {borderColor: '#ff4d4d', borderWidth: 2}]}>
                    <Text style={{color: errors.profile_image ? '#ff4d4d' : '#aaa', fontSize: 12}}>תמונה חובה</Text>
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
              <ErrorText error={errors.profile_image} />

              <TextInput style={styles.input} placeholder="כינוי בקהילה" placeholderTextColor="#ccc" autoCorrect={false} value={form_data.user_alias} onChangeText={(v) => update_field('user_alias', v.replace(/\s/g, '_'))} />
              <ErrorText error={errors.user_alias} />

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
  scroll_content: { paddingVertical: 20, paddingHorizontal: 0, flexGrow: 1, justifyContent: 'center' }, 
  step_indicator: { color: '#00b4d8', textAlign: 'center', marginBottom: 20, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, paddingRight: 15, color: 'white', marginBottom: 15, textAlign: 'right', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  password_container: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  eye_icon: { width: 50, height: '100%', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
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
  alias_refresh_text: { color: '#00b4d8', fontSize: 13, textDecorationLine: 'underline' },
  separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  separator_text: { color: 'rgba(255,255,255,0.5)', marginHorizontal: 10, fontSize: 14 },
  google_btn_wrapper: { alignItems: 'center', marginTop: 5, width: '100%' },
  custom_google_btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 1,
    borderWidth: 1,
    borderColor: '#DADCE0',
    overflow: 'hidden',
  },
  google_logo_container: {
    width: 38,
    height: 38,
    backgroundColor: 'white',
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  google_logo: {
    width: 18,
    height: 18,
  },
  google_text: {
    color: '#3C4043',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Roboto, arial, sans-serif' : undefined,
    marginLeft: 10,
    flex: 1,
    textAlign: 'center',
    marginRight: 48, // Balances the logo on the left
  }
});

import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleLogin } from '@react-oauth/google';
import GlassCard from '../../components/GlassCard';
import ErrorText from '../../components/ErrorText';
import { user_service } from '../../services/userService';
import { update_api_token } from '../../services/apiClient';

export default function SignInScreen({ on_login }) {
  const [is_loading, set_is_loading] = useState(false);
  const [show_password, set_show_password] = useState(false);
  const [form_data, set_form_data] = useState({ email: "", password: "" });
  const [errors, set_errors] = useState({});
  const password_ref = useRef();

  const handle_login = async () => {
    const { email, password } = form_data;
    if (!email || !password) {
      set_errors({ 
        email: !email ? "אימייל חסר" : null,
        password: !password ? "סיסמה חסרה" : null
      });
      return;
    }

    set_is_loading(true);
    set_errors({});
    try {
      const response = await user_service.login(email, password);
      if (response.success) {
        await AsyncStorage.setItem('user_token', response.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
        update_api_token(response.token);
        on_login(response.user);
      } else {
        set_errors({ general: response.error || 'התחברות נכשלה' });
      }
    } catch (err) {
      set_errors({ general: 'שגיאת תקשורת' });
    } finally {
      set_is_loading(false);
    }
  };

  const handle_google_success = async (credentialResponse) => {
    // Decoding the credential on the client for immediate UI feedback
    const token = credentialResponse.credential;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    set_is_loading(true);
    set_errors({});
    
    try {
      // We try to login with email using a special flag or just return error if not exists
      const response = await user_service.login(payload.email, "GOOGLE_AUTH_SERVICE"); 
      if (response.success) {
        await AsyncStorage.setItem('user_token', response.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
        update_api_token(response.token);
        on_login(response.user);
      } else {
        set_errors({ general: "נראה שאין לך עדיין חשבון. אנא הירשם דרך עמוד ההרשמה עם גוגל." });
      }
    } catch (err) {
      set_errors({ general: 'שגיאת התחברות עם גוגל' });
    } finally {
      set_is_loading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GlassCard>
        <ErrorText error={errors.general} />

        <TextInput 
          style={styles.input} 
          placeholder="אימייל" 
          placeholderTextColor="rgba(255,255,255,0.5)" 
          keyboardType="email-address"
          autoCapitalize="none"
          value={form_data.email}
          onChangeText={(v) => set_form_data({ ...form_data, email: v })}
          onSubmitEditing={() => password_ref.current?.focus()}
        />
        <ErrorText error={errors.email} />

        <View style={styles.password_container}>
          <TouchableOpacity 
            style={styles.eye_icon} 
            onPress={() => set_show_password(!show_password)}
          >
            <Text style={{ fontSize: Platform.OS === 'web' ? 20 : 22 }}>{show_password ? "👁️" : "🙈"}</Text>
          </TouchableOpacity>
          <TextInput 
            ref={password_ref} 
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent', paddingRight: 10, outlineStyle: 'none' }]} 
            placeholder="סיסמה" 
            placeholderTextColor="rgba(255,255,255,0.5)" 
            secureTextEntry={!show_password} 
            value={form_data.password} 
            onChangeText={(v) => set_form_data({ ...form_data, password: v })} 
          />
        </View>
        <ErrorText error={errors.password} />

        <TouchableOpacity style={[styles.button, is_loading && styles.button_disabled]} onPress={handle_login} disabled={is_loading}>
          {is_loading ? <ActivityIndicator color="white" /> : <Text style={styles.button_text}>כניסה</Text>}
        </TouchableOpacity>

        <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.separator_text}>או</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.google_btn_wrapper}>
          <GoogleLogin
            onSuccess={handle_google_success}
            onError={() => set_errors({ general: 'התחברות עם גוגל נכשלה' })}
            useOneTap
            theme="filled_blue"
            shape="pill"
            text="signin_with"
            locale="he"
            width="100%"
          />
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100% transition: "all 0.3s ease"' },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, paddingRight: 15, color: 'white', marginBottom: 15, textAlign: 'right', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  password_container: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  eye_icon: { width: 50, height: '100%', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  button: { backgroundColor: '#00b4d8', padding: 15, borderRadius: 12, alignItems: 'center', height: 55, justifyContent: 'center', marginTop: 5 },
  button_disabled: { opacity: 0.6 },
  button_text: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  separator_text: { color: 'rgba(255,255,255,0.5)', marginHorizontal: 10, fontSize: 14 },
  google_btn_wrapper: { alignItems: 'center', marginTop: 5, width: '100%' }
});

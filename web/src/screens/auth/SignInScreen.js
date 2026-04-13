import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGoogleLogin } from '@react-oauth/google';
import GlassCard from '../../components/GlassCard';
import ErrorText from '../../components/ErrorText';
import { user_service } from '../../services/userService';
import { update_api_token } from '../../services/apiClient';
import { validate_email, validate_password } from '../../utils/validationHelper';

const GOOGLE_G_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4Ij48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMjQgOS41YzMuNTQgMCA2LjcyIDEuMjMgOS4yMSAzLjI1bDYuODItNi44MkMzNS44NCAzLjM0IDMwLjU1IDIgMjQgMiA4LjA4IDIgNC43NyAxMi4xNSAzIDIzLjU2bDEwuMjIgNy45MkMxNC41OSAxMy42NiAxOC44NiA5LjUgMjQgOS41eiIvPjxwYXRoIGZpbGw9IiM0Mjg1RjQiIGQ9Ik00Ni41IDI0YzAtMS41OC0uMTQtMy4xMS0uNDEtNC41SDI0djloMTIuN2MtLjYgMy4xOS0yLjQyIDUuODUtNC45OCA3LjU4bDUuOTggNy45MkM0Mi41NiA0MCA0Ni41IDMzLjIyIDQ2LjUgMjR6Ii8+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTEwLjQ3IDMxLjgxQTE1LjkzIDE1LjkzIDAgMCAxIDkgMjRjMC0yLjY3LjQ1LTUuMjYgMS4yNy03LjY5TDEwLjIzIDguMzlDNi4zNiAxNS44MiA0IDI0IDQgMjRzMi4zNiA4LjE4IDYuMjMgMTUuNjFsNC4yNC0zLjh6Ii8+PHBhdGggZmlsbD0iIzM0QTg1MyIgZD0iTTI0IDQ0YzUuNDQgMCA5Ljg4LTEuNzggMTMuMjItNC44M2wtNS45OC03LjkyYy0xLjg0IDEuMjUtNC4yMiAyLjA1LTcuMjQgMi4wNS01LjE0IDAtOS40MS0zLjQ5LTEwLjk3LTguMTlsLTEwLjIxIDcuOTJDMTAuODQgNDAgMTUuMjggNDQgMjQgNDR6Ii8+PHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGg0OHY0OEgwVnoiLz48L3N2Zz4=";

export default function SignInScreen({ on_login }) {
  const [is_loading, set_is_loading] = useState(false);
  const [show_password, set_show_password] = useState(false);
  const [form_data, set_form_data] = useState({ email: "", password: "" });
  const [errors, set_errors] = useState({});
  const password_ref = useRef();

  const update_field = (field, value) => {
    set_form_data(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      set_errors(prev => ({ ...prev, [field]: null }));
    }
    if (errors.general) {
      set_errors(prev => ({ ...prev, general: null }));
    }
  };

  const handle_login = async () => {
    const { email, password } = form_data;
    const current_errors = {};

    const email_error = validate_email(email);
    const password_error = validate_password(password);

    if (email_error) current_errors.email = email_error;
    if (password_error) current_errors.password = password_error;

    if (Object.keys(current_errors).length > 0) {
      set_errors(current_errors);
      return;
    }

    set_is_loading(true);
    set_errors({});
    try {
      const response = await user_service.login(email.trim().toLowerCase(), password);
      if (response.success) {
        await AsyncStorage.setItem('user_token', response.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
        update_api_token(response.token);
        on_login(response.user);
      } else {
        if (response.errors) {
          set_errors(response.errors);
        } else {
          set_errors({ general: response.error || 'התחברות נכשלה' });
        }
      }
    } catch (err) {
      set_errors({ general: 'שגיאת תקשורת' });
    } finally {
      set_is_loading(false);
    }
  };

  let login_with_google;
  try {
    login_with_google = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
        set_is_loading(true);
        set_errors({});
        try {
          // Fetch user info using the access token
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          const payload = await res.json();
          
          const response = await user_service.login(payload.email, "GOOGLE_AUTH_SERVICE", tokenResponse.access_token); 
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
      },
      onError: () => set_errors({ general: 'התחברות עם גוגל נכשלה' }),
    });
  } catch (e) {
    console.warn("Google Login hook failed (likely missing Provider):", e);
    login_with_google = () => Alert.alert("שירות לא זמין", "התחברות עם גוגל אינה זמינה כרגע.");
  }

  return (
    <View style={styles.container}>
      <GlassCard>
        <ErrorText error={errors.general} />

        <TextInput 
          style={[styles.input, errors.email && styles.error_border]} 
          placeholder="אימייל" 
          placeholderTextColor="rgba(255,255,255,0.5)" 
          keyboardType="email-address"
          autoCapitalize="none"
          value={form_data.email}
          onChangeText={(v) => update_field('email', v)}
          onSubmitEditing={() => password_ref.current?.focus()}
        />
        <ErrorText error={errors.email} />

        <View style={[styles.password_container, errors.password && styles.error_border]}>
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
            onChangeText={(v) => update_field('password', v)} 
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
          <TouchableOpacity 
            style={styles.custom_google_btn} 
            onPress={() => login_with_google()}
            activeOpacity={0.8}
          >
            <View style={styles.google_logo_container}>
              <Image source={{ uri: GOOGLE_G_LOGO }} style={styles.google_logo} />
            </View>
            <Text style={styles.google_text}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, paddingRight: 15, color: 'white', marginBottom: 15, textAlign: 'right', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  error_border: { borderColor: '#ff4d4d' },
  password_container: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  eye_icon: { width: 50, height: '100%', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  button: { backgroundColor: '#00b4d8', padding: 15, borderRadius: 12, alignItems: 'center', height: 55, justifyContent: 'center', marginTop: 5 },
  button_disabled: { opacity: 0.6 },
  button_text: { color: 'white', fontWeight: 'bold', fontSize: 16 },
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

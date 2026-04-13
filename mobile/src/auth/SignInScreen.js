import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard } from "react-native";
import GlassCard from "../components/GlassCard";
import ErrorText from "../components/ErrorText";
import { user_service } from "../services/userService";

export default function SignInScreen({ on_login }) {
  const [is_loading, set_is_loading] = useState(false);
  const [show_password, set_show_password] = useState(false);
  const [form_data, set_form_data] = useState({ email: "", password: "" });
  const [errors, set_errors] = useState({});
  const password_ref = useRef();

  const handle_login = async () => {
    const clean_email = form_data.email.trim().toLowerCase();
    const current_errors = {};

    // ולידציית פורמט (Regex)
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!clean_email) current_errors.email = "נא להזין אימייל";
    else if (!email_regex.test(clean_email)) current_errors.email = "פורמט אימייל לא תקין";
    
    if (!form_data.password) current_errors.password = "נא להזין סיסמה";

    if (Object.keys(current_errors).length > 0) {
      set_errors(current_errors);
      return;
    }

    Keyboard.dismiss();
    set_is_loading(true);
    set_errors({});
    
    try {
      const result = await user_service.login(clean_email, form_data.password);
      if (result.success && result.user) {
        on_login(result.user, result.token);
      } else {
        if (result.errors) {
          set_errors(result.errors);
        } else {
          set_errors({ general: result.error || "פרטי התחברות שגויים" });
        }
      }
    } catch (err) { 
      set_errors({ general: "נכשלה גישה לשרת. נסה שוב מאוחר יותר." }); 
    } finally { 
      set_is_loading(false); 
    }
  };

  const update_field = (field, value) => {
    set_form_data(prev => ({ ...prev, [field]: value }));
    if (errors[field]) set_errors(prev => ({ ...prev, [field]: null }));
    if (errors.general) set_errors(prev => ({ ...prev, general: null }));
  };

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
          onSubmitEditing={() => password_ref.current?.focus()} 
          value={form_data.email} 
          onChangeText={(v) => update_field('email', v)} 
        />
        <ErrorText error={errors.email} />
        
        <View style={[styles.password_container, errors.password && styles.error_border]}>
          <TextInput 
            ref={password_ref} 
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]} 
            placeholder="סיסמה" 
            placeholderTextColor="rgba(255,255,255,0.5)" 
            secureTextEntry={!show_password} 
            value={form_data.password} 
            onChangeText={(v) => update_field('password', v)} 
          />
          <TouchableOpacity style={styles.eye_icon} onPress={() => set_show_password(!show_password)}>
            <Text style={{ fontSize: 18 }}>{show_password ? "👁️" : "🙈"}</Text>
          </TouchableOpacity>
        </View>
        <ErrorText error={errors.password} />

        <TouchableOpacity style={[styles.button, is_loading && styles.button_disabled]} onPress={handle_login} disabled={is_loading}>
          {is_loading ? <ActivityIndicator color="white" /> : <Text style={styles.button_text}>כניסה</Text>}
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, color: 'white', marginBottom: 15, textAlign: 'right', fontSize: 16, borderWidth: 1, borderColor: 'transparent' },
  error_border: { borderColor: '#ff4d4d' },
  password_container: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  eye_icon: { paddingHorizontal: 15 },
  button: { backgroundColor: '#00b4d8', padding: 15, borderRadius: 12, alignItems: 'center', height: 55, justifyContent: 'center', marginTop: 5 },
  button_disabled: { opacity: 0.6 },
  button_text: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
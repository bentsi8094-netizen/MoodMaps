import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Keyboard } from "react-native";
import GlassCard from "../../components/GlassCard";
import { user_service } from "../../services/userService";

export default function SignInScreen({ on_login }) {
  const [is_loading, set_is_loading] = useState(false);
  const [show_password, set_show_password] = useState(false);
  const [form_data, set_form_data] = useState({ email: "", password: "" });
  const password_ref = useRef();

  const handle_login = async () => {
    const clean_email = form_data.email.trim().toLowerCase();
    if (!clean_email || !form_data.password) return Alert.alert("חסר מידע", "נא להזין אימייל וסיסמה");
    Keyboard.dismiss();
    set_is_loading(true);
    try {
      const result = await user_service.login(clean_email, form_data.password);
      if (result.success && result.user) on_login(result.user, result.token);
      else Alert.alert("התחברות נכשלה", result.error || "פרטים שגויים");
    } catch (err) { Alert.alert("שגיאה", "נסה שוב מאוחר יותר"); } finally { set_is_loading(false); }
  };

  return (
    <View style={styles.container}>
      <GlassCard>
        <TextInput 
          style={styles.input} 
          placeholder="אימייל" 
          placeholderTextColor="rgba(255,255,255,0.5)" 
          keyboardType="email-address" 
          autoCapitalize="none" 
          onSubmitEditing={() => password_ref.current?.focus()} 
          value={form_data.email} 
          onChangeText={(v) => set_form_data({ ...form_data, email: v })} 
        />
        
        <View style={styles.password_container}>
          <TouchableOpacity style={styles.eye_icon} onPress={() => set_show_password(!show_password)}>
            <Text style={{ fontSize: 22 }}>{show_password ? "👁️" : "🙈"}</Text>
          </TouchableOpacity>
          <TextInput 
            ref={password_ref} 
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent', padding: 15 }]} 
            placeholder="סיסמה      " 
            placeholderTextColor="rgba(255,255,255,0.5)" 
            secureTextEntry={!show_password} 
            value={form_data.password} 
            onChangeText={(v) => set_form_data({ ...form_data, password: v })} 
          />
        </View>

        <TouchableOpacity style={[styles.button, is_loading && styles.button_disabled]} onPress={handle_login} disabled={is_loading}>
          {is_loading ? <ActivityIndicator color="white" /> : <Text style={styles.button_text}>כניסה</Text>}
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, color: 'white', marginBottom: 15, textAlign: 'right', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  password_container: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  eye_icon: { width: 60, height: '100%', justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#00b4d8', padding: 15, borderRadius: 12, alignItems: 'center', height: 55, justifyContent: 'center', marginTop: 5 },
  button_disabled: { opacity: 0.6 },
  button_text: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

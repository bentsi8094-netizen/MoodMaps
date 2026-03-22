import React, { useState, useContext } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard 
} from "react-native";
import SignInScreen from "./SignInScreen";
import SignUpScreen from "./SignUpScreen";
import { useAppStore } from "../store/useAppStore";

export default function UserMainScreen() {
  const [show_sign_up, set_show_sign_up] = useState(false);
  const login_user = useAppStore(state => state.login_user);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.header}>
            {show_sign_up ? 'יצירת חשבון' : 'ברוכים הבאים'}
          </Text>
          
          <View style={styles.form_wrapper}>
            {show_sign_up ? (
              <SignUpScreen on_register={login_user} />
            ) : (
              <SignInScreen on_login={login_user} />
            )}
          </View>

          <TouchableOpacity 
            onPress={() => set_show_sign_up(!show_sign_up)} 
            style={styles.toggle}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.toggle_text}>
              {show_sign_up ? 'כבר יש לך חשבון? התחבר' : 'אין לך חשבון? הירשם עכשיו'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 60 : 30 
  },
  header: { 
    color: 'white', 
    fontSize: 36, 
    fontWeight: '900', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  form_wrapper: { 
    width: '100%',
    // לא משתמשים ב-flex: 1 כדי שהתוכן יישאר ממורכז וצמוד
  },
  toggle: { 
    marginTop: 20, 
    marginBottom: 30,
    alignItems: 'center' 
  },
  toggle_text: { 
    color: 'white', 
    textDecorationLine: 'underline', 
    fontSize: 15, 
    opacity: 0.8 
  }
});
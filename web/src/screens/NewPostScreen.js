import React, { memo, useMemo, useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from "react-native";
import { Image } from 'expo-image';
import * as Animatable from 'react-native-animatable';
import GlassCard from "../components/GlassCard";
import AiAgentModal from "../components/AiAgentModal";
import { useNewPost } from "../hooks/useNewPost";

export default function NewPostScreen({ navigation }) {
  const [show_emoji_hint, set_show_emoji_hint] = useState(false);
  const on_post_success = () => {
    navigation.navigate('Feed');
  };
  const {
    current_mood,
    set_current_mood,
    post_content,
    set_post_content,
    loading,
    ai_modal_visible,
    set_ai_modal_visible,
    checking_chat,
    handle_open_ai_agent,
    handle_emoji_input,
    handle_publish,
    current_user 
  } = useNewPost(on_post_success);

  const [has_animated, set_has_animated] = useState(false);
  const [hidden_input_value, set_hidden_input_value] = useState(" ");
  const emojiInputRef = useRef(null);

  useEffect(() => {
    set_has_animated(true);
  }, []);

  const handle_emoji_press = () => {
    if (Platform.OS === 'web') {
      set_show_emoji_hint(true);
      setTimeout(() => set_show_emoji_hint(false), 4000);
    }
    if (emojiInputRef.current) {
      emojiInputRef.current.blur();
      setTimeout(() => {
        emojiInputRef.current.focus();
      }, 100); 
    }
  };

  const on_emoji_change = (text) => {
    if (text === " ") return;
    handle_emoji_input(text);
    set_hidden_input_value(" ");
  };

  const header_section = useMemo(() => (
    <Text style={styles.user_name}>
      היי {current_user?.user_alias || current_user?.first_name || 'חבר'}, איך אתה מרגיש?
    </Text>
  ), [current_user?.user_alias, current_user?.first_name]);

  const mood_preview = useMemo(() => (
    <View style={styles.preview}>
      {current_mood.sticker_url ? (
        <Animatable.View 
          animation="zoomIn" 
          duration={600}
          key={`sticker-${current_mood.sticker_url}`}
          style={styles.sticker_container}
        >
          <Image 
            source={{ uri: current_mood.sticker_url }} 
            style={styles.sticker} 
            contentFit="contain"
            transition={300}
          />
          <TouchableOpacity 
            onPress={() => set_current_mood({ emoji: "😀", sticker_url: null })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.remove_sticker}>הסר מדבקה</Text>
          </TouchableOpacity>
        </Animatable.View>
      ) : (
        <Animatable.Text 
          key={`emoji-${current_mood.emoji}`} 
          animation="zoomIn" 
          duration={600}
          style={styles.big_emoji}
        >
          {current_mood.emoji || "😀"}
        </Animatable.Text>
      )}
    </View>
  ), [current_mood.sticker_url, current_mood.emoji]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animatable.View 
          animation={!has_animated ? "fadeInUp" : undefined} 
          duration={600}
          useNativeDriver={true}
        >
          <GlassCard style={styles.card_wrapper}>
            
            <View style={styles.header_container}>
              {header_section}
              {mood_preview}
            </View>

            <View style={styles.input_row}>
              <View style={styles.emoji_square_section}>
                <TouchableOpacity 
                  style={styles.square_emoji_input}
                  onPress={handle_emoji_press}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emoji_display_text}>
                    {current_mood.sticker_url ? "" : (current_mood.emoji || "😀")}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  ref={emojiInputRef}
                  style={styles.hidden_input}
                  value={hidden_input_value}
                  onChangeText={on_emoji_change}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="default"
                  blurOnSubmit={false}
                />
              </View>
              
              {show_emoji_hint && (
                <Animatable.View 
                  animation="fadeInUp" 
                  duration={400} 
                  style={styles.emoji_hint_popup}
                >
                  <Text style={styles.emoji_hint_text}>לחץ Win + . להוספת אימוג'י ⌨️</Text>
                </Animatable.View>
              )}
              
              <TouchableOpacity 
                style={[styles.ai_flex_btn, checking_chat && styles.btn_loading]} 
                onPress={() => handle_open_ai_agent()}
                disabled={checking_chat || loading}
                activeOpacity={0.7}
              >
                {checking_chat ? (
                  <ActivityIndicator color="#00d5ff" />
                ) : (
                  <Text style={styles.ai_btn_text}>צור עם הסוכן</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>מה עובר עליך? (אופציונלי):</Text>
              <TextInput
                style={styles.content_input_small}
                placeholder="כתוב משהו..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={post_content}
                onChangeText={set_post_content}
                textAlign="right"
                multiline
                blurOnSubmit={true}
                returnKeyType="done"
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Enter') Keyboard.dismiss();
                }}
              />
            </View>

            <TouchableOpacity 
              style={[styles.publish_btn, (loading || (!current_mood.emoji && !current_mood.sticker_url)) && styles.btn_disabled]} 
              onPress={handle_publish} 
              disabled={loading || (!current_mood.emoji && !current_mood.sticker_url)}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.publish_btn_text}>פרסם</Text>
              )}
            </TouchableOpacity>
          </GlassCard>
        </Animatable.View>

        {ai_modal_visible && (
          <AiAgentModal 
            visible={ai_modal_visible} 
            on_close={() => set_ai_modal_visible(false)}
            on_select_result={(data) => {
              set_current_mood({ emoji: data.emoji, sticker_url: data.sticker_url });
              set_ai_modal_visible(false);
            }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 5, paddingBottom: 120 },
  card_wrapper: { padding: 5 },
  header_container: { height: 230, justifyContent: 'center' },
  user_name: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  preview: { 
    height: 180, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 10, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  sticker_container: { alignItems: 'center' },
  sticker: { width: 120, height: 120 },
  remove_sticker: { color: '#ff4d4d', fontSize: 13, marginTop: 8, fontWeight: '500' },
  big_emoji: { fontSize: 90 },
  input_row: { flexDirection: 'row-reverse', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 25 },
  emoji_square_section: { width: 65, alignItems: 'center' },
  square_emoji_input: { 
    width: 60, height: 60, 
    backgroundColor: 'rgba(255, 58, 199, 0.10)', 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: 'hsla(326, 100%, 58%, 0.52)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  emoji_display_text: {
    color: 'white', 
    fontSize: 28,
    textAlign: 'center'
  },
  hidden_input: {
    opacity: 0,
    position: 'absolute',
    width: 0,
    height: 0
  },
  ai_flex_btn: { 
    flex: 1, marginRight: 15, height: 60, 
    backgroundColor: 'rgba(0, 180, 216, 0.1)', 
    borderRadius: 15, borderWidth: 1, 
    borderColor: '#00b4d8', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  btn_loading: { opacity: 0.6 },
  label: { color: '#00d5ff', marginBottom: 8, fontWeight: '600', textAlign: 'right', fontSize: 13 },
  ai_btn_text: { color: '#00d5ff', fontWeight: 'bold' , fontSize : 15},
  content_input_small: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 18, padding: 15, 
    color: 'white', minHeight: 100, 
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' , 
    fontSize: 16, textAlignVertical: 'top'
  },
  publish_btn: { 
    backgroundColor: '#ff0073', 
    paddingVertical: 12, paddingHorizontal: 40, 
    borderRadius: 30, marginTop: 20, 
    alignSelf: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(255, 0, 115, 0.3)'
      },
      default: {
        shadowColor: '#ff0073',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
      }
    })
  },
  publish_btn_text: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  btn_disabled: { backgroundColor: '#333', shadowOpacity: 0 },
  emoji_hint_popup: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    backgroundColor: '#00b4d8',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.3)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10
      }
    })
  },
  emoji_hint_text: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  }
});
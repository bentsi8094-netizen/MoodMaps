import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, 
    Modal, KeyboardAvoidingView, Platform, ActivityIndicator, 
    Alert, Keyboard 
} from 'react-native';
import { Image } from 'expo-image';
import * as Animatable from 'react-native-animatable';
import { useAppStore } from '../store/useAppStore';
import { chat_service } from '../services/chatService'; 
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AiAgentModal({ visible, on_close, on_select_result }) {
    const current_user = useAppStore(state => state.current_user);
    const messages = useAppStore(state => state.messages);
    const add_message = useAppStore(state => state.add_message);
    const sync_active_session = useAppStore(state => state.sync_active_session);
    const [input_value, set_input_value] = useState('');
    const [is_loading, set_is_loading] = useState(false);
    const insets = useSafeAreaInsets();
    const flat_list_ref = useRef(null);
    const is_initial_open = useRef(true);

    useEffect(() => {
        if (!visible) {
            is_initial_open.current = true;
        }
    }, [visible]);

    useEffect(() => {
        if (visible && current_user && (!messages || messages.length === 0)) {
            const initial_msg = {
                role: "assistant",
                content: `היי ${current_user.first_name || 'חבר'}, ספר לי מה עובר עליך ואתאים לך מדבקה!`,
                created_at: new Date().toISOString()
            };
            add_message(initial_msg);
        }
    }, [visible, current_user?.id]);

    useEffect(() => {
        if (visible && messages?.length > 0) {
            const delay = is_initial_open.current ? 600 : 300;
            scroll_to_bottom(delay);
            if (is_initial_open.current) is_initial_open.current = false;
        }
    }, [visible, messages?.length]);

    const scroll_to_bottom = (delay = 300) => {
        setTimeout(() => {
            flat_list_ref.current?.scrollToEnd({ animated: true });
        }, delay);
    };

    const handle_send = async () => {
        if (!input_value.trim() || is_loading) return;

        const user_text = input_value.trim();
        const user_msg = { role: "user", content: user_text, created_at: new Date().toISOString() };
        
        set_input_value('');
        add_message(user_msg); 
        set_is_loading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scroll_to_bottom();

        try {
            const result = await chat_service.generate_mood([...messages, user_msg].slice(-10));
            
            if (result?.success) {
                const ai_msg = {
                    role: "assistant",
                    content: result.ai_response,
                    sticker_url: result.sticker_url,
                    emoji: result.emoji,
                    created_at: new Date().toISOString()
                };
                add_message(ai_msg);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                throw new Error(result?.error || "הסוכן לא זמין");
            }
        } catch (e) {
            if (e.message.includes('unauthorized_access')) {
                Alert.alert("התחברות פגה", "נראה שפג תוקף החיבור שלך ואתה לא מורשה לבצע פעולות. אנא התחבר מראש למערכת.");
            } else {
                Alert.alert("אופס", `הסוכן נתקל בבעיה. מזהה שגיאה: ${e.message}`);
            }
        } finally {
            set_is_loading(false);
            scroll_to_bottom();
        }
    };

    const render_message = useCallback(({ item }) => {
        const is_me = item.role === "user";
        return (
            <Animatable.View 
                animation={is_me ? "fadeInUp" : "fadeIn"} 
                duration={300}
                style={[styles.msg_wrapper, is_me ? styles.my_msg_wrapper : styles.ai_msg_wrapper]}
            >
                <View style={[styles.bubble, is_me ? styles.my_bubble : styles.ai_bubble]}>
                    <Text style={[styles.msg_text, is_me && styles.my_msg_text]}>{item.content}</Text>
                    
                    {item.sticker_url && (
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                on_select_result({ 
                                    emoji: item.emoji || '✨', 
                                    sticker_url: item.sticker_url
                                });
                                on_close();
                            }}
                            activeOpacity={0.8}
                            style={styles.sticker_preview}
                        >
                            <Image 
                                source={{ uri: item.sticker_url }} 
                                style={styles.sticker_img} 
                                contentFit="contain"
                                transition={300}
                            />
                            <View style={styles.select_badge}>
                                <Text style={styles.select_text}>בחר {item.emoji}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </Animatable.View>
        );
    }, [on_select_result, on_close]);

    return (
        <Modal 
        navigationBarTranslucent
        statusBarTranslucent
        visible={visible} 
        animationType="slide" 
        transparent 
        onRequestClose={on_close}>
            <View style={styles.overlay}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={styles.container}
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={on_close} hitSlop={15}>
                            <Text style={styles.close_btn}>ביטול</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Mood AI Agent</Text>
                        <View style={{ width: 40 }} /> 
                    </View>

                    <FlatList
                        ref={flat_list_ref}
                        data={messages}
                        keyExtractor={(_, index) => `msg_${index}`}
                        renderItem={render_message}
                        contentContainerStyle={styles.list_content}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    />

                    {is_loading && (
                        <View style={styles.loading_container}>
                            <ActivityIndicator color="#00d5ff" size="small" />
                            <Text style={styles.loading_text}>הסוכן מעבד את מצב הרוח...</Text>
                        </View>
                    )}

                    <View style={[styles.input_area, { paddingBottom: Math.max(insets.bottom, 15) }]}>
                        <TextInput
                            style={styles.input}
                            placeholder="איך המרגש היום?"
                            placeholderTextColor="rgba(255, 255, 255, 0.66)"
                            value={input_value}
                            onChangeText={set_input_value}
                            onSubmitEditing={handle_send}
                            textAlign="right"
                            returnKeyType="send"
                        />
                        <TouchableOpacity 
                            onPress={handle_send} 
                            style={[styles.send_btn, (!input_value.trim() || is_loading) && styles.send_btn_disabled]} 
                            disabled={!input_value.trim() || is_loading}
                        >
                            <Text style={styles.send_btn_text}>שלח</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0)', justifyContent: 'flex-end' },
    container: { height: '80%', backgroundColor: '#c067a1', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
    header: { 
        flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', 
        padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' 
    },
    title: { color: 'white', fontSize: 17, fontWeight: '700' },
    close_btn: { color: '#00d5ff', fontSize: 16 },
    list_content: { padding: 15, paddingBottom: 40 },
    msg_wrapper: { marginBottom: 15, width: '100%' },
    my_msg_wrapper: { alignItems: 'flex-end' },
    ai_msg_wrapper: { alignItems: 'flex-start' },
    bubble: { maxWidth: '85%', padding: 12, borderRadius: 20 },
    my_bubble: { backgroundColor: '#00d5ff', borderBottomRightRadius: 4 },
    ai_bubble: { backgroundColor: '#ff8ccd', borderBottomLeftRadius: 4 },
    msg_text: { color: 'white', fontSize: 16, textAlign: 'right' },
    my_msg_text: { color: '#000', fontWeight: '500' },
    sticker_preview: { 
        marginTop: 10, alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)', 
        borderRadius: 15, padding: 10, borderWidth: 1, borderColor: 'rgba(0, 213, 255, 0.28)' 
    },
    sticker_img: { width: 140, height: 140 },
    select_badge: { marginTop: 8, backgroundColor: '#00d5ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
    select_text: { color: '#000000', fontSize: 12, fontWeight: 'bold' },
    loading_container: { flexDirection: 'row-reverse', justifyContent: 'center', paddingVertical: 10 },
    loading_text: { color: '#727272', marginRight: 8, fontSize: 13 },
    input_area: { 
        flexDirection: 'row-reverse', padding: 15, 
        backgroundColor: '#c067a1', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' 
    },
    input: { 
        flex: 1, backgroundColor: '#54aeb8ab', borderRadius: 25, 
        paddingHorizontal: 20, height: 45, color: 'white', fontSize: 16, textAlign: 'right' 
    },
    send_btn: { marginLeft: 22, marginRight: 30, justifyContent: 'center' },
    send_btn_disabled: { opacity: 1 },
    send_btn_text: { color: '#00d5ff', fontSize: 17, fontWeight: 'bold' }
});
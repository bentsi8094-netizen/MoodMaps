const { OpenAI } = require('openai');
const axios = require('axios');
const supabase = require('../config/supabaseClient');
const crypto = require('crypto');

const get_openai_client = () => {
    if (!process.env.OPENAI_API_KEY) return null;
    return new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 20000
    });
};

const generate_mood_sticker = async (req, res) => {
    try {
        const { messages } = req.body;
        const openai = get_openai_client();
        if (!openai) return res.status(500).json({ success: false, error: "AI Config Error" });

        const gpt_messages = [
            {
                role: "system",
                content: `You are a creative, deeply empathetic, and witty AI companion. 
                Your goal is to mirror the user's emotion but also add your own unique personality. 
                Avoid repetitive phrases and generic "I understand" replies. Be diverse, colorful, and engaging.
                
                Based on the conversation, provide a rich response and a keyword for a sticker.
                Return ONLY a JSON object:
                {"q": "specific descriptive english keywords for sticker", "ai_response": "Hebrew creative and warm reply", "emoji": "one_matching_emoji", "rating": "pg"}`
            },
            ...messages.map(msg => ({
                role: msg.role === "assistant" ? "assistant" : "user",
                content: String(msg.content)
            }))
        ];

        const gpt_response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: gpt_messages,
            response_format: { type: "json_object" },
            temperature: 0.85
        });

        let ai_result;
        try {
            ai_result = JSON.parse(gpt_response.choices[0].message.content);
        } catch (e) {
            console.error("JSON Parse Error:", gpt_response.choices[0].message.content);
            throw new Error("Failed to parse AI response");
        }
        
        const fetch_sticker = async (search_term) => {
            if (!search_term) return null;
            try {
                const response = await axios.get(`https://api.giphy.com/v1/stickers/search`, {
                    params: { 
                        api_key: process.env.GIPHY_API_KEY, 
                        q: search_term, 
                        limit: 25,
                        rating: ai_result.rating || 'pg'
                    },
                    timeout: 5000
                });
                
                const results = response.data.data;
                if (results && results.length > 0) {
                    const random_index = Math.floor(Math.random() * results.length);
                    return results[random_index].images.fixed_height.url;
                }
            } catch (e) {
                console.error("Giphy API Error:", e.message);
                return null;
            }
            return null;
        };

        let sticker_url = await fetch_sticker(ai_result.q);
        if (!sticker_url) sticker_url = await fetch_sticker(ai_result.emoji);

        res.json({
            success: true,
            emoji: ai_result.emoji || "✨",
            sticker_url: sticker_url,
            ai_response: ai_result.ai_response,
            search_query: ai_result.q
        });

    } catch (error) {
        console.error("AI Controller Error:", error.message);
        res.json({
            success: true,
            emoji: "✨",
            sticker_url: null,
            ai_response: "נראה שאתה במצב רוח מעניין היום! בוא נמשיך עם האימוג'י שבחרת.",
            search_query: "magic crystal ball"
        });
    }
};

const { get_active_session } = require('./postController');

const save_conversation = async (req, res) => {
    try {
        const user_id = req.user?.id;
        const { messages } = req.body;
        
        if (!user_id || !messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, error: "Missing required data" });
        }

        const active_session = await get_active_session(user_id);
        
        if (!active_session) {
             return res.status(400).json({ success: false, error: "No active session found to attach messages to." });
        }
        
        const target_session_id = active_session.session_id;
        
        let next_msg_number = 1;
        const { data: maxData } = await supabase
            .from('ai_conversations')
            .select('message_number')
            .eq('session_id', target_session_id)
            .order('message_number', { ascending: false })
            .limit(1);
            
        if (maxData && maxData.length > 0) {
            next_msg_number = maxData[0].message_number + 1;
        }

        const inserts = messages
            .filter(msg => msg.content && msg.role !== 'system')
            .map((msg, index) => ({
                content: msg.content,
                emoji: msg.emoji || null,
                sticker_url: msg.sticker_url || null,
                session_id: target_session_id,
                message_number: next_msg_number + index,
                created_at: new Date().toISOString()
            }));

        if (inserts.length === 0) return res.json({ success: true, message: "Nothing to save" });

        const { error } = await supabase.from('ai_conversations').insert(inserts);
        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error("Save Conversation Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

const get_conversation = async (req, res) => {
    try {
        const { session_id } = req.params;
        if (!session_id) return res.status(400).json({ success: false, error: "Session ID is required" });

        const { data, error } = await supabase
            .from('ai_conversations')
            .select('id, content, emoji, sticker_url, message_number, created_at')
            .eq('session_id', session_id)
            .order('message_number', { ascending: true });

        if (error) throw error;
        
        const reconstructed = data.map(m => ({
            ...m,
            role: m.message_number % 2 !== 0 ? 'assistant' : 'user'
        }));
        
        res.json({ success: true, messages: reconstructed });
    } catch (error) {
        console.error("Get Conversation Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

const save_chat_message = async (req, res) => {
    try {
        const user_id = req.user?.id;
        const { message } = req.body; 
        
        if (!user_id || !message) {
            return res.status(400).json({ success: false, error: "Missing required data" });
        }

        let active_session = await get_active_session(user_id);
        let target_session_id;

        if (!active_session) {
            target_session_id = crypto.randomUUID();
            const { error: anchorError } = await supabase
                .from('posts')
                .insert([{
                    user_id,
                    session_id: target_session_id,
                    emoji: 'SESSION_DRAFT',
                    content: 'שיחת הכנה עם הסוכן',
                    post_number: 0,
                    created_at: new Date().toISOString()
                }]);
            
            if (anchorError) throw anchorError;
        } else {
            target_session_id = active_session.session_id;
        }

        let next_msg_number = 1;
        const { data: maxData } = await supabase
            .from('ai_conversations')
            .select('message_number')
            .eq('session_id', target_session_id)
            .order('message_number', { ascending: false })
            .limit(1);
            
        if (maxData && maxData.length > 0) {
            next_msg_number = maxData[0].message_number + 1;
        }

        const { error: insertErr } = await supabase
            .from('ai_conversations')
            .insert([{
                content: message.content,
                emoji: message.emoji || null,
                sticker_url: message.sticker_url || null,
                session_id: target_session_id,
                message_number: next_msg_number,
                created_at: new Date().toISOString()
            }]);

        if (insertErr) throw insertErr;

        if (!active_session) {
            try {
                const { data: lastLoc } = await supabase
                    .from('locations')
                    .select('latitude, longitude')
                    .eq('user_id', user_id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (lastLoc && lastLoc.length > 0) {
                    await supabase.from('locations').insert([{
                        user_id,
                        session_id: target_session_id,
                        latitude: lastLoc[0].latitude,
                        longitude: lastLoc[0].longitude,
                        updated_at: new Date().toISOString()
                    }]);
                }
            } catch (locErr) {
                console.warn("Initial chat location ping failed:", locErr.message);
            }
        }

        res.json({ success: true, session_id: target_session_id });
    } catch (error) {
        console.error("Save Individual Message Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

const prepare_chat = (req, res) => res.json({ success: true });

module.exports = { 
    generate_mood_sticker, 
    save_conversation,
    save_chat_message,
    get_conversation,
    prepare_chat
};
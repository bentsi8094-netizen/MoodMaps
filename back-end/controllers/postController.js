const supabase = require('../config/supabaseClient');
const crypto = require('crypto');

const get_active_session = async (user_id) => {
    const { data: latestPosts, error: postErr } = await supabase
        .from('posts')
        .select(`id, session_id, post_number, created_at, emoji, content, sticker_url, user_id`)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1);

    if (postErr) throw postErr;

    if (!latestPosts || latestPosts.length === 0) return null;

    const latest = latestPosts[0];
    const session_id = latest.session_id;

    const [postRes, msgRes] = await Promise.all([
        supabase.from('posts').select('created_at').eq('session_id', session_id).order('created_at', { ascending: false }).limit(1),
        supabase.from('ai_conversations').select('created_at').eq('session_id', session_id).order('created_at', { ascending: false }).limit(1)
    ]);

    const postTime = postRes.data?.[0]?.created_at ? new Date(postRes.data[0].created_at).getTime() : 0;
    const msgTime = msgRes.data?.[0]?.created_at ? new Date(msgRes.data[0].created_at).getTime() : 0;
    
    const lastActivity = Math.max(postTime, msgTime);
    const twenty_four_hours_ago = Date.now() - 24 * 60 * 60 * 1000;

    if (lastActivity > twenty_four_hours_ago && latest.emoji !== 'CLOSED_SESSION') {
        const { data: profile } = await supabase
            .from('profiles')
            .select('user_alias, avatar_url')
            .eq('id', user_id)
            .single();

        return {
            ...latest,
            user_alias: profile?.user_alias || "אנונימי",
            avatar_url: profile?.avatar_url || null,
            last_activity: new Date(lastActivity).toISOString()
        };
    }

    return null; 
};

const get_active_posts = async (req, res) => {
    try {
        const twenty_four_hours_ago = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
            .from('posts')
            .select(`
                id, emoji, content, sticker_url, created_at, user_id, session_id, post_number,
                profiles:user_id (user_alias, avatar_url)
            `) 
            .gt('created_at', twenty_four_hours_ago)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        const activeUsersMap = new Map();
        
        const filteredData = data.filter(p => p.emoji !== 'SESSION_DRAFT' && p.emoji !== 'CLOSED_SESSION');
        
        for (const post of filteredData) {
            const user_id_str = String(post.user_id);
            if (!activeUsersMap.has(user_id_str)) {
                if (post.emoji !== 'CLOSED_SESSION') {
                  activeUsersMap.set(user_id_str, post);
                }
            }
        }

        const formattedPosts = [];
        for (const post of activeUsersMap.values()) {
            if (post.emoji !== 'CLOSED_SESSION') {
                const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                
                formattedPosts.push({
                    id: post.id,
                    emoji: post.emoji,
                    content: post.content,
                    sticker_url: post.sticker_url,
                    created_at: post.created_at,
                    user_id: post.user_id,
                    session_id: post.session_id,
                    post_number: post.post_number,
                    user_alias: profile?.user_alias || "אנונימי",
                    avatar_url: profile?.avatar_url || null
                });
            }
        }

        res.json({ success: true, posts: formattedPosts });
    } catch (err) {
        console.error("Get Active Posts Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה בטעינת הפיד" });
    }
};

const create_post = async (req, res) => {
    const { emoji, content, sticker_url, messages } = req.body;
    const user_id = req.user?.id;

    if (!user_id) return res.status(401).json({ success: false, error: "משתמש לא מזוהה" });

    try {
        const active_session = await get_active_session(user_id);
        
        let target_session_id;
        let next_post_number = 1;

        if (active_session) {
            target_session_id = active_session.session_id;
            const { data: maxData } = await supabase
                .from('posts')
                .select('post_number')
                .eq('session_id', target_session_id)
                .order('post_number', { ascending: false })
                .limit(1);
            if (maxData && maxData.length > 0) {
                next_post_number = maxData[0].post_number + 1;
            }
        } else {
            target_session_id = crypto.randomUUID();
        }
            
        const { data: new_post, error: insert_error } = await supabase
            .from('posts')
            .insert([{
                user_id,
                emoji: emoji || "✨",
                content: content || "",
                sticker_url: sticker_url || null,
                session_id: target_session_id,
                post_number: next_post_number,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (insert_error) throw insert_error;

        if (messages && Array.isArray(messages) && messages.length > 0) {
            try {
                let start_number = 1;
                const { data: lastMsg } = await supabase
                    .from('ai_conversations')
                    .select('message_number')
                    .eq('session_id', target_session_id)
                    .order('message_number', { ascending: false })
                    .limit(1);
                
                if (lastMsg && lastMsg.length > 0) {
                    start_number = lastMsg[0].message_number + 1;
                }

                const inserts = messages
                    .filter(msg => msg.content && msg.role !== 'system' && !msg.id && !msg.message_number)
                    .map((msg, index) => ({
                        content: msg.content,
                        emoji: msg.emoji || null,
                        sticker_url: msg.sticker_url || null,
                        session_id: target_session_id,
                        message_number: start_number + index,
                        created_at: new Date().toISOString()
                    }));

                if (inserts.length > 0) {
                    await supabase.from('ai_conversations').insert(inserts);
                }
            } catch (chatError) {
                console.error("Atomic Chat Save Error:", chatError.message);
            }
        }

        try {
            const { data: lastLoc } = await supabase
                .from('locations')
                .select('latitude, longitude')
                .eq('user_id', user_id)
                .order('updated_at', { ascending: false })
                .limit(1);

            if (lastLoc && lastLoc.length > 0) {
                await supabase.from('locations').upsert({
                    user_id,
                    session_id: target_session_id,
                    latitude: lastLoc[0].latitude,
                    longitude: lastLoc[0].longitude,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'session_id, user_id' });
            }
        } catch (locErr) {
            console.warn("Map sync failed during post creation:", locErr.message);
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('user_alias, avatar_url')
            .eq('id', user_id)
            .single();

        res.json({ 
            success: true, 
            post: {
                ...new_post,
                user_alias: profile?.user_alias || "אנונימי",
                avatar_url: profile?.avatar_url || null
            } 
        });
    } catch (err) {
        console.error("Create Post Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה ביצירת הפוסט" });
    }
};

const update_active_post = async (req, res) => {
    const { emoji, sticker_url } = req.body;
    const user_id = req.user?.id;

    if (!user_id) return res.status(401).json({ success: false, error: "משתמש לא מזוהה" });

    try {
        const active_session = await get_active_session(user_id);
        
        if (!active_session) {
            return res.status(404).json({ 
                success: false, 
                error: "לא נמצא פוסט פעיל לעדכון. נא ליצור פוסט לפני השימוש בעדכונים." 
            });
        }

        const { data: new_post, error } = await supabase
            .from('posts')
            .insert([{
                user_id: user_id,
                emoji: emoji || active_session.emoji,
                content: active_session.content,
                sticker_url: sticker_url || active_session.sticker_url,
                session_id: active_session.session_id,
                post_number: active_session.post_number + 1,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, post: new_post });
    } catch (err) {
        console.error("Update Active Post Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה בעדכון הסטטוס" });
    }
};

const deactivate_post = async (req, res) => {
    const user_id = req.user?.id;
    try {
        const active_session = await get_active_session(user_id);
        
        if (active_session) {
            const { error } = await supabase
                .from('posts')
                .insert([{
                    user_id: user_id,
                    emoji: "CLOSED_SESSION",
                    content: "",
                    sticker_url: null,
                    session_id: active_session.session_id,
                    post_number: active_session.post_number + 1,
                    created_at: new Date().toISOString()
                }]);
                
            if (error) throw error;
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Deactivate Post Error:", err.message);
        res.status(500).json({ success: false, error: "לא ניתן היה לכבות את הסטטוס" });
    }
};

const get_map_users = async (req, res) => {
    try {
        const twenty_four_hours_ago = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select(`
                user_id, emoji, sticker_url, created_at, session_id, post_number,
                profiles:user_id (avatar_url, user_alias)
            `)
            .gt('created_at', twenty_four_hours_ago)
            .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        const activeUsersMap = new Map();
        for (const post of postsData) {
            if (!activeUsersMap.has(post.user_id)) {
                activeUsersMap.set(post.user_id, post);
            } else {
                const existing = activeUsersMap.get(post.user_id);
                if (new Date(post.created_at) > new Date(existing.created_at)) {
                    activeUsersMap.set(post.user_id, post);
                }
            }
        }

        const session_ids = Array.from(activeUsersMap.values()).map(p => p.session_id);
        if (session_ids.length === 0) return res.json({ success: true, users: [] });

        const { data: allLocs, error: locError } = await supabase
            .from('locations')
            .select('session_id, latitude, longitude, location_number')
            .in('session_id', session_ids)
            .order('location_number', { ascending: false });

        if (locError) throw locError;

        const latest_locs = {};
        allLocs.forEach(l => {
            if (!latest_locs[l.session_id]) {
                latest_locs[l.session_id] = l;
            }
        });

        const map_users = Array.from(activeUsersMap.values())
            .filter(post => post.emoji !== 'CLOSED_SESSION' && post.emoji !== 'SESSION_DRAFT')
            .map(post => {
                const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                const loc = latest_locs[post.session_id];
                
                if (!loc || !profile) return null;

                return {
                    id: post.user_id,
                    user_alias: profile.user_alias,
                    avatar_url: profile.avatar_url, 
                    active_emoji: post.emoji,
                    sticker_url: post.sticker_url,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    created_at: post.created_at,
                    session_id: post.session_id
                };
            }).filter(Boolean);

        res.json({ success: true, users: map_users });
    } catch (err) {
        console.error("Get Map Users Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה בטעינת המפה" });
    }
};

const get_my_session_details = async (req, res) => {
    const user_id = req.user?.id;
    try {
        const active_session = await get_active_session(user_id);
        
        if (!active_session) {
            return res.json({ success: true, active: false });
        }

        const session_id = active_session.session_id;

        const [commentsRes, chatRes] = await Promise.all([
            supabase.from('comments')
                .select('id, session_id, user_id, content, created_at, comment_number, user_alias')
                .eq('session_id', session_id)
                .order('comment_number', { ascending: true }),
            supabase.from('ai_conversations')
                .select('id, content, emoji, sticker_url, message_number, created_at')
                .eq('session_id', session_id)
                .order('message_number', { ascending: true })
        ]);

        res.json({
            success: true,
            active: true,
            session_id,
            post: active_session,
            comments: commentsRes.data || [],
            chat: (chatRes.data || []).map(m => ({
                ...m,
                role: m.message_number % 2 !== 0 ? 'assistant' : 'user'
            }))
        });

    } catch (err) {
        console.error("Get Session Details Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה בשחזור נתוני סשן" });
    }
};

module.exports = { 
    get_active_posts, 
    create_post, 
    update_active_post,
    deactivate_post, 
    get_map_users,
    get_my_session_details,
    get_active_session 
};
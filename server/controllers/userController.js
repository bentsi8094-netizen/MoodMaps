const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const { first_name, last_name, email, password, user_alias } = req.body;
    const avatar_url = req.file ? req.file.path : null;

    try {
        if (!first_name || !last_name || !email || !password || !user_alias || !avatar_url) {
            return res.status(400).json({
                success: false,
                error: "כל השדות הם חובה, כולל תמונת פרופיל"
            });
        }

        const clean_email = email.trim().toLowerCase();

        const { data: existing_user } = await supabase
            .from('auth_manual')
            .select('id')
            .eq('email', clean_email)
            .maybeSingle();

        if (existing_user) {
            return res.status(400).json({ success: false, error: "האימייל כבר קיים במערכת" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash(password, salt);

        const { data: auth_user, error: auth_error } = await supabase
            .from('auth_manual')
            .insert([{ email: clean_email, password_hash: hashed_password }])
            .select('id')
            .single();

        if (auth_error) throw auth_error;

        const { data: new_profile, error: profile_error } = await supabase
            .from('profiles')
            .insert([{
                id: auth_user.id,
                first_name: first_name.trim(),
                last_name: last_name.trim(),
                avatar_url: avatar_url,
                user_alias: user_alias.trim()
            }])
            .select('id, first_name, last_name, avatar_url, user_alias')
            .single();

        if (profile_error) {
            await supabase.from('auth_manual').delete().eq('id', auth_user.id);
            
            if (profile_error.code === '23505') {
                return res.status(400).json({ success: false, error: "הכינוי (alias) כבר תפוס על ידי משתמש אחר" });
            }
            throw profile_error;
        }

        const token = jwt.sign(
            { id: auth_user.id, user_alias: new_profile.user_alias },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            user: { ...new_profile, email: clean_email },
            token
        });

    } catch (err) {
        console.error("Register Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה פנימית בתהליך ההרשמה" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ success: false, error: "יש להזין אימייל וסיסמה" });
        }

        const clean_email = email.trim().toLowerCase();
        
        const { data: auth_data, error: auth_error } = await supabase
            .from('auth_manual')
            .select('id, email, password_hash')
            .eq('email', clean_email)
            .maybeSingle();

        if (!auth_data || auth_error) {
            return res.status(400).json({ success: false, error: "פרטי התחברות שגויים" });
        }

        const is_match = await bcrypt.compare(password, auth_data.password_hash);
        
        // אבטחה מחמירה: אם המשתמש מנסה להיכנס עם "סיסמה סטטית" של גוגל, 
        // אנחנו דורשים אימות חי מול גוגל בשרת.
        if (password === "GOOGLE_AUTH_SERVICE") {
            const google_token = req.body.google_token;
            if (!google_token) {
                return res.status(401).json({ success: false, error: "חסר טוקן אימות של גוגל" });
            }
            
            try {
                // אימות הטוקן מול שרת גוגל (כירורגי ומאובטח)
                const axios = require('axios');
                const gRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
                    headers: { Authorization: `Bearer ${google_token}` }
                });
                
                if (gRes.data.email.toLowerCase() !== clean_email) {
                    return res.status(401).json({ success: false, error: "אימות גוגל נכשל - מייל לא תואם" });
                }
            } catch (err) {
                return res.status(401).json({ success: false, error: "טוקן גוגל פג תוקף או לא תקין" });
            }
        } else if (!is_match) {
            return res.status(400).json({ success: false, error: "פרטי התחברות שגויים" });
        }

        const { data: profile_data, error: profile_error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, user_alias')
            .eq('id', auth_data.id)
            .single();

        if (profile_error) throw profile_error;

        const token = jwt.sign(
            { id: profile_data.id, user_alias: profile_data.user_alias },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            user: { ...profile_data, email: auth_data.email },
            token
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה בתהליך ההתחברות" });
    }
};

const { get_active_session } = require('./postController');

const update_location = async (req, res) => {
    const { latitude, longitude } = req.body;
    const user_id = req.user?.id; 

    if (!latitude || !longitude) {
        return res.status(400).json({ success: false, error: "נתוני מיקום חסרים" });
    }

    try {
        await supabase
            .from('profiles')
            .update({ 
                latitude, 
                longitude,
                last_seen: new Date().toISOString()
            })
            .eq('id', user_id);

        const active_session = await get_active_session(user_id);
        
        if (active_session) {
            let next_loc_number = 1;
            const { data: maxData } = await supabase
                .from('locations')
                .select('location_number')
                .eq('session_id', active_session.session_id)
                .order('location_number', { ascending: false })
                .limit(1);
            if (maxData && maxData.length > 0) {
                next_loc_number = maxData[0].location_number + 1;
            }
            
            const { error: locError } = await supabase
                .from('locations')
                .insert([{
                    user_id,
                    session_id: active_session.session_id,
                    latitude,
                    longitude,
                    location_number: next_loc_number,
                    created_at: new Date().toISOString()
                }]);
                
            if (locError) {
                console.error("Location Tracking Insert Error:", locError.message);
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Update Location Error:", err.message);
        res.status(500).json({ success: false, error: "עדכון המיקום נכשל" });
    }
};

const get_profile = async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, user_alias')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;
        res.json({ success: true, user });
    } catch (err) {
        console.error("Get Profile Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה בשליפת נתוני פרופיל" });
    }
};

module.exports = { register, login, get_profile, update_location };
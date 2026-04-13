const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * מנהל רישום משתמש חדש
 * כולל ולידציה, הצפנת סיסמה, ויצירת פרופיל עם תמונה
 */
const register = async (req, res) => {
    const { first_name, last_name, email, password, user_alias } = req.body;
    const avatar_url = req.file ? req.file.path : null;
    const errors = {};

    try {
        // ולידציה בסיסית של שדות חובה
        if (!first_name?.trim()) errors.first_name = "שם פרטי הוא שדה חובה";
        if (!last_name?.trim()) errors.last_name = "שם משפחה הוא שדה חובה";
        if (!email?.trim()) errors.email = "אימייל הוא שדה חובה";
        if (!password) errors.password = "סיסמה היא שדה חובה";
        else if (password.length < 6) errors.password = "סיסמה חייבת להכיל לפחות 6 תווים";
        if (!user_alias?.trim()) errors.user_alias = "כינוי הוא שדה חובה";
        if (!avatar_url) errors.profile_image = "חובה להעלות תמונת פרופיל";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const clean_email = email.trim().toLowerCase();

        // בדיקה אם המייל קיים במערכת
        const { data: existing_user } = await supabase
            .from('auth_manual')
            .select('id')
            .eq('email', clean_email)
            .maybeSingle();

        if (existing_user) {
            return res.status(400).json({ 
                success: false, 
                errors: { email: "האימייל כבר קיים במערכת" } 
            });
        }

        // הצפנת סיסמה
        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash(password, salt);

        // 1. יצירת רשומת אבטחה בטבלת auth_manual
        const { data: auth_user, error: auth_error } = await supabase
            .from('auth_manual')
            .insert([{ email: clean_email, password_hash: hashed_password }])
            .select('id')
            .single();

        if (auth_error) {
            console.error("[User Controller] Auth Creation Failed:", auth_error.message);
            throw new Error("נכשלה יצירת חשבון אבטחה");
        }

        // 2. יצירת פרופיל משתמש בטבלת profiles
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
            // Rollback מיידי: מחיקת ה-auth אם יצירת הפרופיל נכשלה כדי לא לחסום את המייל
            console.warn("[User Controller] Profile Creation Failed, rolling back Auth...");
            await supabase.from('auth_manual').delete().eq('id', auth_user.id);
            
            if (profile_error.code === '23505') {
                return res.status(400).json({ 
                    success: false, 
                    errors: { user_alias: "הכינוי (alias) כבר תפוס על ידי משתמש אחר" } 
                });
            }
            throw profile_error;
        }

        // יצירת טוקן JWT
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
        console.error("[User Controller] Register Error:", err.message);
        res.status(500).json({ 
            success: false, 
            error: "שגיאה פנימית בתהליך ההרשמה"
        });
    }
};

/**
 * מנהל התחברות משתמש קיים
 * תומך בהתחברות רגילה ובהתחברות דרך גוגל
 */
const login = async (req, res) => {
    const { email, password } = req.body;
    const errors = {};

    try {
        if (!email?.trim()) errors.email = "יש להזין אימייל";
        if (!password) errors.password = "יש להזין סיסמה";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const clean_email = email.trim().toLowerCase();
        
        // שליפת נתוני אבטחה
        const { data: auth_data, error: auth_error } = await supabase
            .from('auth_manual')
            .select('id, email, password_hash')
            .eq('email', clean_email)
            .maybeSingle();

        if (!auth_data || auth_error) {
            return res.status(401).json({ 
                success: false, 
                error: "פרטי התחברות שגויים",
                errors: { general: "המייל או הסיסמה אינם תואמים" }
            });
        }

        // בדיקת סיסמה (או אימות גוגל)
        const is_match = await bcrypt.compare(password, auth_data.password_hash);
        
        if (password === "GOOGLE_AUTH_SERVICE") {
            const google_token = req.body.google_token;
            if (!google_token) {
                return res.status(401).json({ success: false, error: "חסר טוקן אימות של גוגל" });
            }
            
            try {
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
            return res.status(401).json({ 
                success: false, 
                error: "פרטי התחברות שגויים",
                errors: { general: "המייל או הסיסמה אינם תואמים" }
            });
        }

        // שליפת הפרופיל
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
        console.error("[User Controller] Login Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה בתהליך ההתחברות" });
    }
};

const { get_active_session } = require('./postController');

/**
 * עדכון מיקום משתמש בזמן אמת ושמירה להיסטוריית סשן
 */
const update_location = async (req, res) => {
    const { latitude, longitude } = req.body;
    const user_id = req.user?.id; 

    if (!latitude || !longitude) {
        return res.status(400).json({ success: false, error: "נתוני מיקום חסרים" });
    }

    try {
        // עדכון מיקום נוכחי בפרופיל
        await supabase
            .from('profiles')
            .update({ 
                latitude, 
                longitude,
                last_seen: new Date().toISOString()
            })
            .eq('id', user_id);

        // בדיקה אם יש סשן פעיל לתיעוד היסטוריה
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
            
            await supabase
                .from('locations')
                .insert([{
                    user_id,
                    session_id: active_session.session_id,
                    latitude,
                    longitude,
                    location_number: next_loc_number,
                    created_at: new Date().toISOString()
                }]);
        }

        res.json({ success: true });
    } catch (err) {
        console.error("[User Controller] Location Error:", err.message);
        res.status(500).json({ success: false, error: "עדכון המיקום נכשל" });
    }
};

/**
 * שליפת נתוני פרופיל למשתמש המחובר
 */
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
        console.error("[User Controller] Get Profile Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה בשליפת נתוני פרופיל" });
    }
};

/**
 * בדיקה מהירה אם אימייל קיים במערכת (שלב 2 ברישום)
 */
const check_email = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ success: false, error: "אימייל חובה לצורך בדיקה" });
        }

        const clean_email = email.trim().toLowerCase();
        const { data: existing_user } = await supabase
            .from('auth_manual')
            .select('id')
            .eq('email', clean_email)
            .maybeSingle();

        if (existing_user) {
            return res.status(200).json({ success: false, exists: true, error: "האימייל כבר קיים במערכת" });
        }

        res.json({ success: true, exists: false });
    } catch (err) {
        console.error("[User Controller] Check Email Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה בבדיקת אימייל" });
    }
};

/**
 * עדכון טוקן התראות (Push Token)
 */
const update_push_token = async (req, res) => {
    const { token } = req.body;
    const user_id = req.user?.id;

    if (!user_id) return res.status(401).json({ success: false });

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ expo_push_token: token })
            .eq('id', user_id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error("Update Push Token Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה בעדכון טוקן התראות" });
    }
};

/**
 * עדכון פרטי פרופיל (שם וכינוי)
 */
const update_profile = async (req, res) => {
    const { first_name, last_name, user_alias } = req.body;
    const user_id = req.user?.id;

    if (!user_id) return res.status(401).json({ success: false });

    try {
        const updateData = {};
        if (first_name) updateData.first_name = first_name.trim();
        if (last_name) updateData.last_name = last_name.trim();
        if (user_alias) updateData.user_alias = user_alias.trim();
        if (req.file) updateData.avatar_url = req.file.path; // הכתובת מקלאודינרי

        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user_id)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ success: false, error: "הכינוי כבר תפוס" });
            }
            throw error;
        }

        res.json({ success: true, user: data });
    } catch (err) {
        console.error("Update Profile Error:", err.message);
        res.status(500).json({ success: false, error: "עדכון הפרופיל נכשל" });
    }
};

/**
 * שליפת היסטוריית התראות למשתמש
 */
const get_notifications = async (req, res) => {
    const user_id = req.user?.id;
    try {
        const { data, error } = await supabase
            .from('notifications_history')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        res.json({ success: true, notifications: data });
    } catch (err) {
        console.error("Get Notifications Error:", err.message);
        res.status(500).json({ success: false });
    }
};

/**
 * סימון התראה כנקראה
 */
const mark_notification_read = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user?.id;
    try {
        const { error } = await supabase
            .from('notifications_history')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', user_id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

module.exports = { 
    register, 
    login, 
    get_profile, 
    update_location, 
    check_email, 
    update_push_token,
    update_profile,
    get_notifications,
    mark_notification_read
};
const supabase = require('../config/supabaseClient');

const get_comments = async (req, res) => {
    const { session_id } = req.params;
    try {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                id, session_id, user_id, content, created_at, comment_number,
                profiles:user_id (user_alias, avatar_url)
            `)
            .eq('session_id', session_id)
            .order('comment_number', { ascending: true });

        if (error) throw error;

        const formattedComments = data.map(comment => ({
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user_id: comment.user_id,
            session_id: comment.session_id,
            comment_number: comment.comment_number,
            user_alias: comment.profiles?.user_alias || "אנונימי",
            user_avatar_url: comment.profiles?.avatar_url || null
        }));

        res.json({ success: true, comments: formattedComments });
    } catch (err) {
        console.error("Get Comments Error:", err.message);
        res.status(500).json({ success: false, error: "שגיאה בטעינת תגובות" });
    }
};

const add_comment = async (req, res) => {
    const { session_id } = req.params;
    const { content } = req.body;
    
    const user_id = req.user?.id;
    const user_alias = req.user?.user_alias; 

    try {
        if (!content || content.trim() === "") {
            return res.status(400).json({ success: false, error: "אי אפשר לשלוח תגובה ריקה" });
        }

        if (!user_id || !session_id) {
            return res.status(401).json({ success: false, error: "פרטים חסרים: משתמש או מזהה סשן" });
        }

        let next_comment_number = 1;
        const { data: maxData } = await supabase
            .from('comments')
            .select('comment_number')
            .eq('session_id', session_id)
            .order('comment_number', { ascending: false })
            .limit(1);
        if (maxData && maxData.length > 0) {
            next_comment_number = maxData[0].comment_number + 1;
        }

        const { data: newComment, error: insertError } = await supabase
            .from('comments')
            .insert([{
                session_id,
                user_id,
                content: content.trim(),
                user_alias: user_alias || "חבר קהילה",
                comment_number: next_comment_number,
                created_at: new Date().toISOString()
            }])
            .select('id, session_id, user_id, content, created_at, comment_number, user_alias')
            .single();

        if (insertError) {
            console.error("Supabase Insert Error:", insertError);
            return res.status(500).json({ success: false, error: insertError.message });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user_id)
            .single();

        const fullComment = {
            ...newComment,
            user_alias: newComment.user_alias, 
            user_avatar_url: profile?.avatar_url || null
        };

        res.json({ success: true, comment: fullComment });
    } catch (err) {
        console.error("Add Comment Server Crash:", err);
        res.status(500).json({ success: false, error: "שגיאה פנימית בשליחת התגובה" });
    }
};

module.exports = { get_comments, add_comment };
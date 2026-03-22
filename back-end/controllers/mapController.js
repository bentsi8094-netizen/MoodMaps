const supabase = require('../config/supabaseClient');

const update_location = async (req, res) => {
    const { latitude, longitude, session_id } = req.body;
    const user_id = req.user?.id;

    if (!latitude || !longitude || !session_id) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    try {
        const { data: lastLoc, error: fetchError } = await supabase
            .from('locations')
            .select('location_number')
            .eq('session_id', session_id)
            .order('location_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (fetchError) throw fetchError;

        const next_number = lastLoc ? lastLoc.location_number + 1 : 1;

        const { error: insertError } = await supabase
            .from('locations')
            .insert([{
                user_id,
                session_id,
                latitude,
                longitude,
                location_number: next_number,
                created_at: new Date().toISOString()
            }]);

        if (insertError) throw insertError;

        await supabase
            .from('profiles')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', user_id);

        res.json({ success: true, location_number: next_number });
    } catch (err) {
        res.status(500).json({ success: false, error: "עדכון מיקום נכשל" });
    }
};

module.exports = { update_location };
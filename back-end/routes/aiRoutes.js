const express = require('express');
const router = express.Router();
const ai_controller = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// הכנת הקשר לצ'אט
router.post('/prepare', protect, ai_controller.prepare_chat);

// יצירת תגובה ומדבקה לפי מצב רוח
router.post('/generate-mood', protect, ai_controller.generate_mood_sticker);

// שמירת הודעה בודדת בזמן אמת
router.post('/message', protect, ai_controller.save_chat_message);

// שמירת היסטוריית השיחה בסיום (אופציונלי כעת)
router.post('/save-conversation', protect, ai_controller.save_conversation);

// שליפת היסטוריית שיחה לסשן
router.get('/:session_id', protect, ai_controller.get_conversation);

module.exports = router;
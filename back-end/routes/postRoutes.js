const express = require('express');
const router = express.Router();
const post_controller = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// שליפת פיד הפוסטים הכללי
router.get('/', post_controller.get_active_posts);

// יצירת פוסט חדש (מכבה קודמים)
router.post('/create', protect, post_controller.create_post);

// עדכון פוסט פעיל (עבור ה-AI Agent)
router.post('/update-active', protect, post_controller.update_active_post);

// כיבוי ידני של פוסט
router.post('/deactivate', protect, post_controller.deactivate_post);

// שליפת משתמשים ופוסטים עבור המפה
router.get('/map-users', post_controller.get_map_users);

// שחזור סשן מלא למשתמש המחובר
router.get('/my-session', protect, post_controller.get_my_session_details);

module.exports = router;
const express = require('express');
const router = express.Router();
const user_controller = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../services/uploadService');
const rateLimit = require('express-rate-limit');

// הגבלת קצב מחמירה להתחברות ובדיקת מייל (למניעת Scraped/Brute-force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // מקסימום 10 ניסיונות ב-15 דקות
    message: { success: false, error: "בוצעו יותר מדי ניסיונות, אנא המתן 15 דקות" }
});

// הרשמה עם העלאת תמונה
router.post('/register', upload.single('profile_image'), user_controller.register);

// התחברות
router.post('/login', authLimiter, user_controller.login);

// בדיקת זמינות אימייל
router.post('/check-email', authLimiter, user_controller.check_email);

// שליפת פרופיל אישי
router.get('/profile', protect, user_controller.get_profile);

// עדכון מיקום GPS (רץ ברקע מהמובייל)
router.post('/update-location', protect, user_controller.update_location);

// עדכון טוקן התראות
router.post('/update-push-token', protect, user_controller.update_push_token);

// עדכון פרטי פרופיל (שם, כינוי ותמונה)
router.put('/update-profile', protect, upload.single('avatar'), user_controller.update_profile);

// שליפת היסטוריית התראות
router.get('/notifications', protect, user_controller.get_notifications);

// סימון התראה כנקראה
router.put('/notifications/:id/read', protect, user_controller.mark_notification_read);

module.exports = router;
const express = require('express');
const router = express.Router();
const user_controller = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../services/uploadService');

// הרשמה עם העלאת תמונה
router.post('/register', upload.single('profile_image'), user_controller.register);

// התחברות
router.post('/login', user_controller.login);

// בדיקת זמינות אימייל
router.post('/check-email', user_controller.check_email);

// שליפת פרופיל אישי
router.get('/profile', protect, user_controller.get_profile);

// עדכון מיקום GPS (רץ ברקע מהמובייל)
router.post('/update-location', protect, user_controller.update_location);

module.exports = router;
const express = require('express');
const router = express.Router();
const comment_controller = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// שליפת תגובות לפוסט ספציפי (הפוסט נחשב כסשן)
router.get('/:session_id', comment_controller.get_comments);

// הוספת תגובה לפלוסט/סשן (מוגן ע"י טוקן)
router.post('/:session_id', protect, comment_controller.add_comment);

module.exports = router;
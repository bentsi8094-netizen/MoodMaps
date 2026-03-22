const express = require('express');
const router = express.Router();
const map_controller = require('../controllers/mapController');
const { protect } = require('../middleware/authMiddleware');

router.post('/update', protect, map_controller.update_location);

module.exports = router;
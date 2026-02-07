const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware'); // Ensure protected routes

// AI Routes - Protected
router.post('/match', protect, aiController.matchExperts);
router.post('/draft-contract', protect, aiController.draftContract);
router.post('/chat', protect, aiController.chat);

module.exports = router;

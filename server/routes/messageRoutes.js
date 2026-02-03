const express = require('express');
const router = express.Router();
const {
    sendMessage,
    getMessages,
    markAsRead,
    markProjectAsRead,
    getUnreadMessages
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { validateMessage, validateId } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(protect);

// Send message
router.post('/', validateMessage, sendMessage);

// Get unread messages for user
router.get('/unread', getUnreadMessages);

// Get messages for a project
router.get('/project/:projectId', validateId, getMessages);

// Mark message as read
router.put('/:id/read', validateId, markAsRead);

// Mark all project messages as read
router.put('/project/:projectId/read', validateId, markProjectAsRead);

module.exports = router;

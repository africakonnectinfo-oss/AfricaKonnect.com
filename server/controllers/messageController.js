const {
    createMessage,
    getMessagesByProject,
    markAsRead,
    markProjectMessagesAsRead,
    getUnreadCount,
    getAllUnreadMessages
} = require('../models/messageModel');
const { getProjectById } = require('../models/projectModel');
const { getContractsByProject } = require('../models/contractModel');

// Send message
exports.sendMessage = async (req, res) => {
    try {
        const { projectId, content } = req.body;
        const senderId = req.user.id;

        // Validate required fields
        if (!projectId || !content) {
            return res.status(400).json({ message: 'Project ID and content are required' });
        }

        // Verify user has access to project
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is client or expert on this project
        const isClient = project.client_id === senderId;
        const contracts = await getContractsByProject(projectId);
        const isExpert = contracts.some(c => c.expert_id === senderId);

        if (!isClient && !isExpert && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to send messages in this project' });
        }

        const message = await createMessage({
            projectId,
            senderId,
            content
        });

        // Real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(`project_${projectId}`).emit('receive_message', {
                projectId,
                message: {
                    ...message,
                    // Ensure the shape matches what frontend expects if needed
                    sender: req.user.name // Add sender name convenience
                }
            });
            console.log(`Emitted message to project_${projectId}`);
        }

        res.status(201).json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get messages for a project
exports.getMessages = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { limit, offset } = req.query;

        // Verify user has access to project
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is client or expert on this project
        const isClient = project.client_id === req.user.id;
        const contracts = await getContractsByProject(projectId);
        const isExpert = contracts.some(c => c.expert_id === req.user.id);

        if (!isClient && !isExpert && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view messages in this project' });
        }

        const messages = await getMessagesByProject(
            projectId,
            limit ? parseInt(limit) : 100,
            offset ? parseInt(offset) : 0
        );

        // Get unread count
        const unreadCount = await getUnreadCount(projectId, req.user.id);

        res.json({
            count: messages.length,
            unreadCount,
            messages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await markAsRead(id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`project_${message.project_id}`).emit('message_read_update', {
                messageId: id,
                userId: req.user.id
            });
        }

        res.json(message);
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Mark all project messages as read
exports.markProjectAsRead = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        // Verify user has access to project
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const messages = await markProjectMessagesAsRead(projectId, userId);

        const io = req.app.get('io');
        if (io && messages.length > 0) {
            // Optimize: maybe just emit a 'all_read' event or loop if needed, but 'all_read' is better
            // For now, let's just emit a generic event that prompts refresh or bulk update
            io.to(`project_${projectId}`).emit('messages_marked_read', {
                userId,
                count: messages.length
            });
        }

        res.json({
            count: messages.length,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Mark project as read error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all unread messages for user
exports.getUnreadMessages = async (req, res) => {
    try {
        const userId = req.user.id;

        const messages = await getAllUnreadMessages(userId);

        res.json({
            count: messages.length,
            messages
        });
    } catch (error) {
        console.error('Get unread messages error:', error);
        res.status(500).json({ message: error.message });
    }
};

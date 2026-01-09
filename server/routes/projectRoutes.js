const express = require('express');
const router = express.Router();
const {
    createProject,
    getProject,
    getClientProjects,
    getAllProjects,
    updateProject,
    deleteProject,
    inviteExpert,
    respondToInvite,
    getInvitedProjects,
    updateState,
    getHistory: getProjectStateHistory
} = require('../controllers/projectController');
const { fundEscrow, releaseFunds, getHistory } = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkProfileStatus } = require('../middleware/expertMiddleware');
const { validateProject, validateId } = require('../middleware/validationMiddleware');
const { paymentLimiter } = require('../middleware/rateLimitMiddleware');

// All routes require authentication
router.use(protect);

// Create project (clients only)
router.post('/', authorize('client'), validateProject, createProject);

// Get all projects (with filters)
router.get('/', getAllProjects);

// Get specific project
router.get('/:id', validateId, getProject);

// Get client's projects
router.get('/client/:clientId', validateId, getClientProjects);

// Update project
router.put('/:id', validateId, validateProject, updateProject);
router.put('/:id/state', validateId, updateState);
router.get('/:id/history', validateId, getProjectStateHistory);

// Delete project
router.delete('/:id', validateId, deleteProject);

// Invite expert (clients only)
router.post('/:id/invite', validateId, authorize('client'), inviteExpert);

// Respond to invite (experts only)
router.put('/:id/invite', validateId, authorize('expert'), checkProfileStatus, respondToInvite);

// Escrow & Payments
router.post('/:id/fund', validateId, authorize('client'), paymentLimiter, fundEscrow);
router.post('/:id/release', validateId, authorize('client'), paymentLimiter, releaseFunds);
router.get('/:id/transactions', validateId, getHistory);

// Get expert invites
router.get('/expert/invites', authorize('expert'), getInvitedProjects);

module.exports = router;

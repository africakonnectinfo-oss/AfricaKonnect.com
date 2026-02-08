const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const bidController = require('../controllers/bidController');
const bidInterviewController = require('../controllers/bidInterviewController');

// All routes require authentication
router.use(authenticate);

// Expert routes - Submit and manage bids
router.post('/projects/:projectId/bids', bidController.submitBid);
router.get('/experts/my-bids', bidController.getMyBids);
router.put('/bids/:bidId', bidController.updateBid);
router.delete('/bids/:bidId/withdraw', bidController.withdrawBid);

// Client routes - View and manage bids on their projects
router.get('/projects/:projectId/bids', bidController.getBidsForProject);
router.put('/projects/:projectId/bids/:bidId/accept', bidController.acceptBid);
router.put('/projects/:projectId/bids/:bidId/reject', bidController.rejectBid);

// Interview routes
router.post('/projects/:projectId/bids/:bidId/interview', bidInterviewController.scheduleInterview);
router.get('/projects/:projectId/interviews', bidInterviewController.getProjectInterviews);
router.put('/interviews/:interviewId', bidInterviewController.updateInterview);

module.exports = router;

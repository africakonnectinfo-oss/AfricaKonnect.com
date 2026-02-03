const express = require('express');
const router = express.Router();
const {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    createMilestone,
    getMilestones,
    updateMilestone,
    addFileVersion,
    getVersions,
    getActivity
} = require('../controllers/collaborationController');
const { protect } = require('../middleware/authMiddleware');
const { requireProjectParticipant } = require('../middleware/projectMiddleware');

router.use(protect);

// Tasks
router.post('/projects/:projectId/tasks', requireProjectParticipant, createTask);
router.get('/projects/:projectId/tasks', requireProjectParticipant, getTasks);
router.put('/tasks/:id', updateTask); // Note: updateTask uses ID, middleware needs to be smarter or controller handles check. Kept as is for now, assuming controller checks.
router.delete('/tasks/:id', deleteTask);

// Milestones
router.post('/projects/:projectId/milestones', requireProjectParticipant, createMilestone);
router.get('/projects/:projectId/milestones', requireProjectParticipant, getMilestones);
router.put('/milestones/:id', updateMilestone);

// File Versions
router.post('/files/:fileId/versions', addFileVersion);
router.get('/files/:fileId/versions', getVersions);

// Activity Feed
router.get('/projects/:projectId/activity', requireProjectParticipant, getActivity);

module.exports = router;

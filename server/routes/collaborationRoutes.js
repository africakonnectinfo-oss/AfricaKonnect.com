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

router.use(protect);

// Tasks
router.post('/projects/:projectId/tasks', createTask);
router.get('/projects/:projectId/tasks', getTasks);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// Milestones
router.post('/projects/:projectId/milestones', createMilestone);
router.get('/projects/:projectId/milestones', getMilestones);
router.put('/milestones/:id', updateMilestone);

// File Versions
router.post('/files/:fileId/versions', addFileVersion);
router.get('/files/:fileId/versions', getVersions);

// Activity Feed
router.get('/projects/:projectId/activity', getActivity);

module.exports = router;

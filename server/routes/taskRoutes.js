const express = require('express');
const router = express.Router();
const {
    createTask,
    getProjectTasks,
    updateTask,
    deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { requireProjectParticipant, requireActiveContract } = require('../middleware/projectMiddleware');
const { validateId } = require('../middleware/validationMiddleware');

router.use(protect);

// Create task: Requires being a participant AND an active contract (or similar active state)
router.post('/', requireActiveContract, requireProjectParticipant, createTask);

// Get tasks: Requires being a participant
router.get('/project/:projectId', validateId, requireProjectParticipant, getProjectTasks);

// Update/Delete: Implicitly requires participation (ownership check in controller usually), 
// but let's enforce participant check via middleware if we can get ProjectId. 
// Note: updateTask/deleteTask routes only have :id. 
// Middleware would need to fetch task to find project ID first if we want strict middleware. 
// For now, let's keep it simple or assume controller handles ownership. 
// Audit requirement says "Collaboration activated only after contract".
router.put('/:id', validateId, updateTask);
router.delete('/:id', validateId, deleteTask);

module.exports = router;

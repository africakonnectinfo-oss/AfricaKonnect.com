const {
    createTask,
    getTasksByProject,
    updateTask,
    deleteTask
} = require('../models/taskModel');
const { getProjectById } = require('../models/projectModel');

// Create new task
exports.createTask = async (req, res) => {
    try {
        const { projectId, title, description, priority, assignedTo, dueDate } = req.body;

        // Verify project access
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is part of project (Client or Expert via contract)
        // For simplicity allow client or anyone authenticated for now, but should ideally check contracts
        if (req.user.role === 'client' && project.client_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const task = await createTask({
            projectId,
            title,
            description,
            priority,
            assignedTo,
            dueDate,
            createdBy: req.user.name,
            status: 'todo'
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get tasks for a project
exports.getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await getTasksByProject(projectId);
        res.json(tasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update task
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const task = await updateTask(id, updates);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete task
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteTask(id);
        res.json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: error.message });
    }
};

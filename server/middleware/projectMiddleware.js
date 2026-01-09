const { query } = require('../database/db');

/**
 * Require user to be a participant (client or expert) on the project
 */
const requireProjectParticipant = async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.params.id || req.body.projectId;

        if (!projectId) {
            // If we can't determine project ID from standard locations, 
            // we might be in a route like 'updateTask' where ID is task ID.
            // In that case, the controller/previous middleware should have attached project info,
            // or we need to look it up. For now, let's assume standard params or previously attached.
            if (req.project) {
                // if project is already attached
                if (req.project.client_id === req.user.id || req.project.selected_expert_id === req.user.id) {
                    return next();
                }
            }
            return res.status(400).json({ message: 'Project context required for this action' });
        }

        const text = `
            SELECT client_id, selected_expert_id 
            FROM projects 
            WHERE id = $1
        `;
        const result = await query(text, [projectId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const project = result.rows[0];

        if (project.client_id !== req.user.id && project.selected_expert_id !== req.user.id) {
            // Check if user is an "invited" expert (checked via selected_expert_id), 
            // but maybe we want to allow admins too?
            if (req.user.role === 'admin') return next();

            return res.status(403).json({
                message: 'Access denied. You are not a participant in this project.'
            });
        }

        // Attach basics for downstream use
        req.projectParticipant = {
            isClient: project.client_id === req.user.id,
            isExpert: project.selected_expert_id === req.user.id
        };

        next();
    } catch (error) {
        console.error('Participant middleware error:', error);
        res.status(500).json({ message: 'Server error checking project participation' });
    }
};

/**
 * Require an active contract (or at least signed/active/completed) 
 * AND strictly enforce that the project is not just in 'draft' or 'posted' state 
 * effectively gating collaboration.
 */
const requireActiveContract = async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.params.id || req.body.projectId;

        // Check project state first (cheaper)
        const projectText = 'SELECT state FROM projects WHERE id = $1';
        const projectRes = await query(projectText, [projectId]);

        if (projectRes.rows.length === 0) return res.status(404).json({ message: 'Project not found' });

        const state = projectRes.rows[0].state;
        const allowedStates = ['contracted', 'active', 'completed'];

        if (!allowedStates.includes(state)) {
            // Relax check: If contract exists and is signed, maybe we allow it even if state lag?
            // But strict audit says "Activated ONLY after contract execution".

            // Double check contracts table just in case state machine is out of sync
            const contractText = `
                SELECT status FROM contracts 
                WHERE project_id = $1 AND status IN ('signed', 'active', 'completed')
             `;
            const contractRes = await query(contractText, [projectId]);

            if (contractRes.rows.length === 0) {
                return res.status(403).json({
                    message: 'Collaboration Hub is locked. Active contract required.',
                    code: 'NO_ACTIVE_CONTRACT'
                });
            }
        }

        next();
    } catch (error) {
        console.error('Active contract middleware error:', error);
        res.status(500).json({ message: 'Server error checking contract status' });
    }
};

module.exports = {
    requireProjectParticipant,
    requireActiveContract
};

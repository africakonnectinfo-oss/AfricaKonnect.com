const { query } = require('../database/db');

/**
 * Get user notification preferences
 */
const getUserPreferences = async (userId) => {
    const text = `
        SELECT * FROM notification_preferences
        WHERE user_id = $1
    `;
    const result = await query(text, [userId]);

    // Create default preferences if none exist
    if (result.rows.length === 0) {
        return createDefaultPreferences(userId);
    }

    return result.rows[0];
};

/**
 * Create default preferences for a user
 */
const createDefaultPreferences = async (userId) => {
    const text = `
        INSERT INTO notification_preferences (user_id)
        VALUES ($1)
        RETURNING *
    `;
    const result = await query(text, [userId]);
    return result.rows[0];
};

/**
 * Update user notification preferences
 */
const updatePreferences = async (userId, preferences) => {
    const {
        email_enabled,
        push_enabled,
        project_updates,
        messages,
        payments,
        marketing
    } = preferences;

    const text = `
        UPDATE notification_preferences
        SET 
            email_enabled = COALESCE($2, email_enabled),
            push_enabled = COALESCE($3, push_enabled),
            project_updates = COALESCE($4, project_updates),
            messages = COALESCE($5, messages),
            payments = COALESCE($6, payments),
            marketing = COALESCE($7, marketing),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
    `;

    const result = await query(text, [
        userId,
        email_enabled,
        push_enabled,
        project_updates,
        messages,
        payments,
        marketing
    ]);

    return result.rows[0];
};

/**
 * Check if user wants notifications for a specific type
 */
const shouldNotify = async (userId, notificationType) => {
    const preferences = await getUserPreferences(userId);

    const typeMap = {
        'project_update': preferences.project_updates,
        'message': preferences.messages,
        'payment': preferences.payments,
        'marketing': preferences.marketing
    };

    return typeMap[notificationType] !== false;
};

module.exports = {
    getUserPreferences,
    createDefaultPreferences,
    updatePreferences,
    shouldNotify
};

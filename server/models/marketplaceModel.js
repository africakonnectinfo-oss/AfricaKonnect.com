const { query } = require('../database/db');

// Get marketplace projects (open for bidding)
const getMarketplaceProjects = async (filters = {}) => {
    let text = `
        SELECT 
            p.*,
            u.name as client_name,
            u.email as client_email,
            COUNT(DISTINCT pb.id) as bid_count
        FROM projects p
        JOIN users u ON p.client_id = u.id
        LEFT JOIN project_bids pb ON p.id = pb.project_id AND pb.status = 'pending'
        WHERE p.open_for_bidding = true
        AND p.status = 'open'
    `;

    const values = [];
    let paramCount = 1;

    // Search filter
    if (filters.search) {
        text += ` AND (
            p.title ILIKE $${paramCount} OR 
            p.description ILIKE $${paramCount} OR
            array_to_string(p.required_skills, ',') ILIKE $${paramCount}
        )`;
        values.push(`%${filters.search}%`);
        paramCount++;
    }

    // Budget filters
    if (filters.minBudget) {
        text += ` AND p.max_budget >= $${paramCount}`;
        values.push(parseFloat(filters.minBudget));
        paramCount++;
    }

    if (filters.maxBudget) {
        text += ` AND p.min_budget <= $${paramCount}`;
        values.push(parseFloat(filters.maxBudget));
        paramCount++;
    }

    // Skills filter
    if (filters.skills) {
        const skillsArray = filters.skills.split(',').filter(s => s.trim());
        if (skillsArray.length > 0) {
            text += ` AND p.required_skills && $${paramCount}`;
            values.push(skillsArray);
            paramCount++;
        }
    }

    // Check if bidding deadline hasn't passed
    text += ` AND (p.bidding_deadline IS NULL OR p.bidding_deadline > CURRENT_TIMESTAMP)`;

    text += ` GROUP BY p.id, u.name, u.email`;

    // Sorting
    switch (filters.sortBy) {
        case 'budget_high':
            text += ` ORDER BY p.max_budget DESC NULLS LAST`;
            break;
        case 'budget_low':
            text += ` ORDER BY p.min_budget ASC NULLS LAST`;
            break;
        case 'deadline':
            text += ` ORDER BY p.bidding_deadline ASC NULLS LAST`;
            break;
        case 'recent':
        default:
            text += ` ORDER BY p.created_at DESC`;
    }

    const result = await query(text, values);
    return result.rows;
};

module.exports = {
    getMarketplaceProjects
};

const { query } = require('./db');

(async () => {
    try {
        console.log('Adding expert columns to projects table...');

        await query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS selected_expert_id UUID REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS expert_status VARCHAR(20) DEFAULT 'none' CHECK (expert_status IN ('none', 'pending', 'accepted', 'rejected'));
        `);

        console.log('✅ Columns added successfully.');
    } catch (error) {
        console.error('Error adding columns:', error);
    }
})();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
console.log('DB Config:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER
});

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigrations() {
    const client = await pool.connect();

    try {
        console.log('🔄 Running database migrations...\n');

        // Migration 1: Audit Logs
        console.log('📝 Running migration: 003_audit_logs.sql');
        const auditLogsSql = fs.readFileSync(
            path.join(__dirname, 'database/migrations/003_audit_logs.sql'),
            'utf8'
        );
        await client.query(auditLogsSql);
        console.log('✅ Audit logs table created successfully\n');

        // Migration 2: Password Reset
        console.log('📝 Running migration: 004_password_reset.sql');
        const passwordResetSql = fs.readFileSync(
            path.join(__dirname, 'database/migrations/004_password_reset.sql'),
            'utf8'
        );
        await client.query(passwordResetSql);
        console.log('✅ Password reset fields added successfully\n');

        // Verify tables
        console.log('🔍 Verifying migrations...');
        const auditLogsCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'audit_logs'
            );
        `);

        // Migration 3: Audit Fixes (Timeline & Digital Signatures)
        console.log('📝 Running migration: 005_audit_fixes.sql');
        const auditFixesSql = fs.readFileSync(
            path.join(__dirname, 'database/migrations/005_audit_fixes.sql'),
            'utf8'
        );
        await client.query(auditFixesSql);
        console.log('✅ Audit fix schema applied successfully\n');

        // Migration 4: Profile Enhancements
        console.log('📝 Running migration: 007_profile_enhancements.sql');
        const profileEnhancementsSql = fs.readFileSync(
            path.join(__dirname, 'database/migrations/007_profile_enhancements.sql'),
            'utf8'
        );
        await client.query(profileEnhancementsSql);
        console.log('✅ Profile enhancements applied successfully\n');

        // Migration 5: Add Open Bidding to Projects
        console.log('📝 Running migration: 001_add_open_bidding_to_projects.sql');
        const openBiddingSql = fs.readFileSync(
            path.join(__dirname, 'database/migrations/001_add_open_bidding_to_projects.sql'),
            'utf8'
        );
        await client.query(openBiddingSql);
        console.log('✅ Open bidding fields added to projects table\n');

        // Migration 6: Create Project Bids Table
        console.log('📝 Running migration: 002_create_project_bids_table.sql');
        const projectBidsSql = fs.readFileSync(
            path.join(__dirname, 'database/migrations/002_create_project_bids_table.sql'),
            'utf8'
        );
        await client.query(projectBidsSql);
        console.log('✅ Project bids table created successfully\n');

        // Migration 7: Create Project Interviews Table
        console.log('📝 Running migration: 003_create_project_interviews_table.sql');
        const projectInterviewsSql = fs.readFileSync(
            path.join(__dirname, 'database/migrations/003_create_project_interviews_table.sql'),
            'utf8'
        );
        await client.query(projectInterviewsSql);
        console.log('✅ Project interviews table created successfully\n');

        // Migration 8: Create Project Interests Table
        console.log('📝 Running migration: 004_create_project_interests_table.sql');
        const projectInterestsSql = fs.readFileSync(
            path.join(__dirname, 'database/migrations/004_create_project_interests_table.sql'),
            'utf8'
        );
        await client.query(projectInterestsSql);
        console.log('✅ Project interests table created successfully\n');


        console.log('\n🎉 All migrations completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.message.includes('already exists')) {
            console.log('\n⚠️  Note: Some tables/columns already exist. This is normal if migrations were run before.');
        }
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations()
    .then(() => {
        console.log('\n✅ Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration script failed:', error);
        process.exit(1);
    });

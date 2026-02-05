const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Old Neon database connection
const OLD_DATABASE_URL = 'postgresql://neondb_owner:npg_ySqNLXntr7I3@ep-little-fog-ahdmxl28-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

console.log('📤 Exporting data from old Neon database...\n');

const pool = new Pool({
    connectionString: OLD_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function exportData() {
    const client = await pool.connect();

    try {
        const exportData = {
            timestamp: new Date().toISOString(),
            source: 'Neon Database',
            tables: {}
        };

        // Tables to export (in order to respect foreign key constraints)
        const tables = [
            'users',
            'expert_profiles',
            'projects',
            'contracts',
            'messages',
            'tasks',
            'files',
            'activities',
            'audit_logs',
            'password_reset_tokens',
            'notifications',
            'project_invitations',
            'applications',
            'interviews',
            'milestones',
            'transactions'
        ];

        console.log('📊 Exporting tables:\n');

        for (const table of tables) {
            try {
                // Check if table exists
                const tableExists = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    );
                `, [table]);

                if (!tableExists.rows[0].exists) {
                    console.log(`  ⏭️  Table '${table}' does not exist (skipped)`);
                    continue;
                }

                // Get row count
                const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
                const count = parseInt(countResult.rows[0].count);

                if (count === 0) {
                    console.log(`  📭 ${table}: 0 rows (empty)`);
                    exportData.tables[table] = [];
                    continue;
                }

                // Export data
                const result = await client.query(`SELECT * FROM ${table}`);
                exportData.tables[table] = result.rows;
                console.log(`  ✅ ${table}: ${count} rows exported`);

            } catch (error) {
                console.log(`  ❌ ${table}: Error - ${error.message}`);
                exportData.tables[table] = { error: error.message };
            }
        }

        // Save to file
        const exportPath = path.join(__dirname, 'database-export.json');
        fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

        console.log('\n✅ Export completed successfully!');
        console.log(`📁 Data saved to: ${exportPath}`);

        // Summary
        const totalRows = Object.values(exportData.tables)
            .filter(data => Array.isArray(data))
            .reduce((sum, data) => sum + data.length, 0);

        console.log('\n📊 Export Summary:');
        console.log(`   Tables exported: ${Object.keys(exportData.tables).length}`);
        console.log(`   Total rows: ${totalRows}`);

    } catch (error) {
        console.error('\n❌ Export failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

exportData()
    .then(() => {
        console.log('\n✅ Export script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Export script failed');
        process.exit(1);
    });

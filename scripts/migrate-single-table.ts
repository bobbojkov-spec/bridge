/**
 * Migrate a single table from Local to Supabase
 * Usage: npx tsx scripts/migrate-single-table.ts <table_name>
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const tableName = process.argv[2];

if (!tableName) {
  console.error('❌ Please provide a table name');
  console.error('Usage: npx tsx scripts/migrate-single-table.ts <table_name>');
  process.exit(1);
}

// Local PostgreSQL
const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bridge_db',
  user: process.env.USER || 'postgres',
});

// Supabase
function getSupabasePool() {
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    throw new Error('POSTGRES_URL is not set');
  }
  let cleanUrl = postgresUrl.replace(/[?&]sslmode=[^&]*/g, '');
  return new Pool({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });
}

const supabasePool = getSupabasePool();

// Increase connection timeout
supabasePool.on('error', (err) => {
  console.error('Pool error:', err);
});

async function migrateTable(table: string) {
  console.log(`\n📦 Migrating: ${table}\n`);
  
  try {
    // Get all rows from local
    const result = await localPool.query(`SELECT * FROM "${table}"`);
    const rows = result.rows;
    
    if (rows.length === 0) {
      console.log(`   ✅ No data (0 rows)`);
      return { success: 0, total: 0 };
    }
    
    console.log(`   📊 Found ${rows.length} rows in local`);
    
    // Check what's in Supabase
    const supabaseResult = await supabasePool.query(`SELECT COUNT(*) as count FROM "${table}"`);
    const supabaseCount = parseInt(supabaseResult.rows[0].count);
    console.log(`   📊 Supabase currently has: ${supabaseCount} rows\n`);
    
    const columns = Object.keys(rows[0]);
    const colNames = columns.map(c => `"${c}"`).join(', ');
    
    let success = 0;
    let skipped = 0;
    
    // Insert one by one
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const values = columns.map(col => row[col]);
      const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
      
      const query = `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      
      try {
        const start = Date.now();
        const result = await supabasePool.query(query, values);
        const duration = Date.now() - start;
        
        if (result.rowCount && result.rowCount > 0) {
          success++;
        } else {
          skipped++;
        }
        
        // Show progress every 5 rows or on last row
        if ((i + 1) % 5 === 0 || i === rows.length - 1) {
          process.stdout.write(`\r   Progress: ${i + 1}/${rows.length} (${success} inserted, ${skipped} skipped, ${duration}ms)`);
        }
      } catch (err: any) {
        if (err.code !== '23505') { // Skip duplicate key errors
          console.error(`\n   ❌ Row ${i + 1} failed: ${err.message}`);
        } else {
          skipped++;
        }
      }
    }
    
    console.log(`\n   ✅ Done: ${success} inserted, ${skipped} skipped`);
    
    // Verify
    const finalResult = await supabasePool.query(`SELECT COUNT(*) as count FROM "${table}"`);
    const finalCount = parseInt(finalResult.rows[0].count);
    console.log(`   📊 Supabase now has: ${finalCount} rows`);
    
    return { success, total: rows.length };
    
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: 0, total: 0 };
  }
}

async function main() {
  console.log('🚀 Single Table Migration: Local → Supabase\n');
  
  // Test connections
  try {
    await localPool.query('SELECT 1');
    console.log('✅ Local connected');
  } catch (error: any) {
    console.error('❌ Local failed:', error.message);
    process.exit(1);
  }
  
  try {
    await supabasePool.query('SELECT 1');
    console.log('✅ Supabase connected\n');
  } catch (error: any) {
    console.error('❌ Supabase failed:', error.message);
    process.exit(1);
  }
  
  await migrateTable(tableName);
  
  await localPool.end();
  await supabasePool.end();
  
  console.log('\n🎉 Migration complete!');
}

main().catch(console.error);


/**
 * Step 3: Migrate Only Missing Tables
 * Only inserts data for tables that are missing in Supabase
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

// Only tables that are missing
const missingTables = [
  'product_categories',
  'product_tags',
  'product_additional_info',
  'hero_slides',
  'news_articles',
  'media_files',
  'site_settings',
];

async function migrateTable(tableName: string, localPool: Pool, supabasePool: Pool) {
  console.log(`\n📦 ${tableName}:`);
  
  try {
    // Get all rows from local
    const result = await localPool.query(`SELECT * FROM "${tableName}"`);
    const rows = result.rows;
    
    if (rows.length === 0) {
      console.log(`   ✅ No data (0 rows)`);
      return { success: 0, total: 0 };
    }
    
    console.log(`   📊 Found ${rows.length} rows`);
    
    const columns = Object.keys(rows[0]);
    const colNames = columns.map(c => `"${c}"`).join(', ');
    
    let success = 0;
    
    // Insert one by one with progress
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const values = columns.map(col => row[col]);
      const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
      
      const query = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      
      try {
        const start = Date.now();
        const result = await supabasePool.query(query, values);
        const duration = Date.now() - start;
        
        if (result.rowCount && result.rowCount > 0) {
          success++;
        }
        
        // Show progress every 5 rows or on last row
        if ((i + 1) % 5 === 0 || i === rows.length - 1) {
          process.stdout.write(`\r   Progress: ${i + 1}/${rows.length} (${success} inserted, ${duration}ms)`);
        }
      } catch (err: any) {
        if (err.code !== '23505') { // Skip duplicate key errors
          console.error(`\n   ❌ Row ${i + 1} failed: ${err.message}`);
        }
      }
    }
    
    console.log(`\n   ✅ Done: ${success}/${rows.length} inserted`);
    return { success, total: rows.length };
    
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: 0, total: 0 };
  }
}

async function main() {
  console.log('🚀 Step 3: Migrating Missing Tables\n');
  
  // Local connection
  const localPool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'bridge_db',
    user: process.env.USER || 'postgres',
  });
  
  // Supabase connection
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    console.error('❌ POSTGRES_URL not found');
    process.exit(1);
  }
  
  const supabasePool = new Pool({
    connectionString: postgresUrl.replace(/[?&]sslmode=[^&]*/g, ''),
    ssl: { rejectUnauthorized: false },
    max: 1, // Single connection
  });
  
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
  
  // Migrate each missing table
  const results: { [key: string]: { success: number; total: number } } = {};
  
  for (const table of missingTables) {
    results[table] = await migrateTable(table, localPool, supabasePool);
  }
  
  console.log('\n\n📊 Summary:');
  console.log('-'.repeat(40));
  let totalSuccess = 0;
  let totalRows = 0;
  
  for (const [table, result] of Object.entries(results)) {
    totalSuccess += result.success;
    totalRows += result.total;
    const status = result.success === result.total ? '✅' : '⚠️';
    console.log(`${status} ${table.padEnd(25)} ${result.success}/${result.total}`);
  }
  
  console.log('-'.repeat(40));
  console.log(`Total: ${totalSuccess}/${totalRows} rows inserted\n`);
  
  await localPool.end();
  await supabasePool.end();
  
  console.log('🎉 Migration complete!');
}

main().catch(console.error);


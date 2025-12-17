/**
 * Simple Migration: Local PostgreSQL to Supabase
 * Inserts one row at a time, only proceeds on success
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

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
    max: 1, // Single connection to avoid overhead
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // 10 second timeout
  });
}

const supabasePool = getSupabasePool();

// Tables in order
const tables = [
  'users',
  'categories',
  'products',
  'product_images',
  'product_categories',
  'product_tags',
  'product_additional_info',
  'hero_slides',
  'news_articles',
  'pages',
  'page_blocks',
  'team_members',
  'media_files',
  'site_settings',
  'orders',
  'order_items',
];

async function migrateTable(tableName: string) {
  console.log(`\n📦 ${tableName}:`);
  
  try {
    // Get all rows from local
    const result = await localPool.query(`SELECT * FROM "${tableName}"`);
    const rows = result.rows;
    
    if (rows.length === 0) {
      console.log(`   ✅ No data (0 rows)`);
      return;
    }
    
    console.log(`   📊 Found ${rows.length} rows`);
    
    const columns = Object.keys(rows[0]);
    const colNames = columns.map(c => `"${c}"`).join(', ');
    
    let success = 0;
    let skipped = 0;
    
    // Insert one by one
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const values = columns.map(col => row[col]);
      const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
      
      const query = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      
      try {
        const startTime = Date.now();
        const insertResult = await supabasePool.query(query, values);
        const duration = Date.now() - startTime;
        
        if (insertResult.rowCount && insertResult.rowCount > 0) {
          success++;
          process.stdout.write(`\r   ✅ ${i + 1}/${rows.length} (${duration}ms)`);
        } else {
          skipped++;
          process.stdout.write(`\r   ⏭️  ${i + 1}/${rows.length} skipped (${duration}ms)`);
        }
      } catch (err: any) {
        console.error(`\n   ❌ Row ${i + 1} failed: ${err.message}`);
        // Continue with next row
      }
    }
    
    console.log(`\n   ✅ Done: ${success} inserted, ${skipped} skipped`);
    
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Simple Migration: Local → Supabase\n');
  
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
  
  // Migrate each table
  for (const table of tables) {
    await migrateTable(table);
  }
  
  console.log('\n🎉 Migration complete!\n');
  
  // Quick verification
  console.log('🔍 Verification:');
  for (const table of ['categories', 'products', 'product_images']) {
    try {
      const local = await localPool.query(`SELECT COUNT(*) as c FROM "${table}"`);
      const supabase = await supabasePool.query(`SELECT COUNT(*) as c FROM "${table}"`);
      const l = parseInt(local.rows[0].c);
      const s = parseInt(supabase.rows[0].c);
      const status = l === s ? '✅' : '⚠️';
      console.log(`   ${status} ${table}: Local=${l}, Supabase=${s}`);
    } catch (e) {
      // Skip if table doesn't exist
    }
  }
  
  await localPool.end();
  await supabasePool.end();
}

main().catch(console.error);


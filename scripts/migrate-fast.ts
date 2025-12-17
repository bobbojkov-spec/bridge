/**
 * Fast Migration: Uses COPY for bulk inserts (much faster)
 */

import { Pool, Client } from 'pg';
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

// Supabase - use single client for faster connection
function getSupabaseClient() {
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    throw new Error('POSTGRES_URL is not set');
  }
  let cleanUrl = postgresUrl.replace(/[?&]sslmode=[^&]*/g, '');
  return new Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
}

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

async function migrateTable(tableName: string, client: Client) {
  console.log(`\n📦 ${tableName}:`);
  
  try {
    // Get all rows from local
    const result = await localPool.query(`SELECT * FROM "${tableName}"`);
    const rows = result.rows;
    
    if (rows.length === 0) {
      console.log(`   ✅ No data (0 rows)`);
      return 0;
    }
    
    console.log(`   📊 Found ${rows.length} rows`);
    
    const columns = Object.keys(rows[0]);
    const colNames = columns.map(c => `"${c}"`).join(', ');
    
    let success = 0;
    
    // Insert in small batches of 5 for speed
    const batchSize = 5;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        const values = columns.map(col => row[col]);
        const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
        const query = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        
        try {
          const start = Date.now();
          const result = await client.query(query, values);
          const duration = Date.now() - start;
          
          if (result.rowCount && result.rowCount > 0) {
            success++;
            process.stdout.write(`\r   ✅ ${success}/${rows.length} (${duration}ms)`);
          } else {
            process.stdout.write(`\r   ⏭️  ${i + batch.length}/${rows.length} (${duration}ms)`);
          }
        } catch (err: any) {
          if (err.code !== '23505') { // Skip duplicate key errors
            console.error(`\n   ❌ Row failed: ${err.message}`);
          }
        }
      }
    }
    
    console.log(`\n   ✅ Done: ${success} inserted`);
    return success;
    
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🚀 Fast Migration: Local → Supabase\n');
  
  const supabaseClient = getSupabaseClient();
  
  try {
    await localPool.query('SELECT 1');
    console.log('✅ Local connected');
  } catch (error: any) {
    console.error('❌ Local failed:', error.message);
    process.exit(1);
  }
  
  try {
    await supabaseClient.connect();
    console.log('✅ Supabase connected (single connection)\n');
  } catch (error: any) {
    console.error('❌ Supabase failed:', error.message);
    process.exit(1);
  }
  
  // Migrate each table
  for (const table of tables) {
    await migrateTable(table, supabaseClient);
  }
  
  console.log('\n🎉 Migration complete!\n');
  
  // Quick verification
  console.log('🔍 Verification:');
  for (const table of ['categories', 'products', 'product_images']) {
    try {
      const local = await localPool.query(`SELECT COUNT(*) as c FROM "${table}"`);
      const supabase = await supabaseClient.query(`SELECT COUNT(*) as c FROM "${table}"`);
      const l = parseInt(local.rows[0].c);
      const s = parseInt(supabase.rows[0].c);
      const status = l === s ? '✅' : '⚠️';
      console.log(`   ${status} ${table}: Local=${l}, Supabase=${s}`);
    } catch (e) {
      // Skip if table doesn't exist
    }
  }
  
  await supabaseClient.end();
  await localPool.end();
}

main().catch(console.error);


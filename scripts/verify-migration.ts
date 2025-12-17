/**
 * Verify Migration: Compare Local PostgreSQL vs Supabase
 * Checks that all data was migrated correctly
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

// Local PostgreSQL connection
const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bridge_db',
  user: process.env.USER || 'postgres',
});

// Supabase connection
const supabasePool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

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

async function compareTable(tableName: string) {
  try {
    const localResult = await localPool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const supabaseResult = await supabasePool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    
    const localCount = parseInt(localResult.rows[0].count);
    const supabaseCount = parseInt(supabaseResult.rows[0].count);
    
    const match = localCount === supabaseCount;
    const status = match ? '✅' : '❌';
    
    console.log(`${status} ${tableName.padEnd(25)} Local: ${localCount.toString().padStart(4)} | Supabase: ${supabaseCount.toString().padStart(4)}`);
    
    return { tableName, localCount, supabaseCount, match };
  } catch (error: any) {
    console.log(`⚠️  ${tableName.padEnd(25)} Error: ${error.message}`);
    return { tableName, localCount: 0, supabaseCount: 0, match: false };
  }
}

async function main() {
  console.log('🔍 Verifying Migration: Local PostgreSQL vs Supabase\n');
  console.log('Table'.padEnd(25) + 'Local'.padStart(10) + ' | ' + 'Supabase'.padStart(10));
  console.log('-'.repeat(50));
  
  const results = [];
  for (const table of tables) {
    const result = await compareTable(table);
    results.push(result);
  }
  
  console.log('-'.repeat(50));
  
  const allMatch = results.every(r => r.match);
  const totalLocal = results.reduce((sum, r) => sum + r.localCount, 0);
  const totalSupabase = results.reduce((sum, r) => sum + r.supabaseCount, 0);
  
  console.log(`\nTotal rows - Local: ${totalLocal} | Supabase: ${totalSupabase}`);
  
  if (allMatch) {
    console.log('\n✅ All tables match! Migration is 1:1 successful!');
  } else {
    console.log('\n❌ Some tables do not match. Review the differences above.');
    const mismatches = results.filter(r => !r.match);
    console.log(`\nMismatched tables (${mismatches.length}):`);
    mismatches.forEach(r => {
      console.log(`   - ${r.tableName}: Local=${r.localCount}, Supabase=${r.supabaseCount}`);
    });
  }
  
  await localPool.end();
  await supabasePool.end();
}

main().catch(console.error);


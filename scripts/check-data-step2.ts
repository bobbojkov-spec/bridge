/**
 * Step 2: Check Data in Both Databases
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

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

async function main() {
  console.log('📊 Step 2: Comparing Local vs Supabase Data\n');
  
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
  });
  
  console.log('Table'.padEnd(25) + 'Local'.padStart(8) + ' | ' + 'Supabase'.padStart(8));
  console.log('-'.repeat(45));
  
  const differences: string[] = [];
  
  for (const table of tables) {
    try {
      const localResult = await localPool.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const supabaseResult = await supabasePool.query(`SELECT COUNT(*) as count FROM "${table}"`);
      
      const localCount = parseInt(localResult.rows[0].count);
      const supabaseCount = parseInt(supabaseResult.rows[0].count);
      
      const match = localCount === supabaseCount;
      const status = match ? '✅' : '⚠️';
      
      console.log(`${status} ${table.padEnd(23)} ${localCount.toString().padStart(6)} | ${supabaseCount.toString().padStart(6)}`);
      
      if (!match) {
        differences.push(`${table}: Local=${localCount}, Supabase=${supabaseCount}`);
      }
    } catch (error: any) {
      console.log(`❌ ${table.padEnd(23)} Error: ${error.message.substring(0, 30)}`);
    }
  }
  
  console.log('-'.repeat(45));
  
  if (differences.length > 0) {
    console.log('\n⚠️  Differences found:');
    differences.forEach(d => console.log(`   - ${d}`));
  } else {
    console.log('\n✅ All tables match!');
  }
  
  await localPool.end();
  await supabasePool.end();
}

main().catch(console.error);


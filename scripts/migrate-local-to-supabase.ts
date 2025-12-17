/**
 * Data Migration Script: Local PostgreSQL to Supabase
 * 
 * This script migrates data from local PostgreSQL to Supabase
 * Run with: npx tsx scripts/migrate-local-to-supabase.ts
 * 
 * Prerequisites:
 * 1. Local PostgreSQL database must be accessible
 * 2. Supabase database must be set up with schema
 * 3. POSTGRES_URL must point to Supabase in .env.local
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

// Supabase connection pool (reuse for all queries)
const supabasePool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Tables to migrate (in order due to foreign keys)
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
  console.log(`\n📦 Migrating table: ${tableName}`);
  
  try {
    // Fetch all data from local PostgreSQL
    const result = await localPool.query(`SELECT * FROM ${tableName}`);
    const data = result.rows;
    
    if (data.length === 0) {
      console.log(`   ⚠️  No data to migrate`);
      return;
    }
    
    console.log(`   📊 Found ${data.length} rows`);
    
    // Get column names
    const columns = Object.keys(data[0]);
    const colNames = columns.map(col => `"${col}"`).join(', ');
    
    // Use batch insert for better performance (100 rows at a time)
    const batchSize = 100;
    let successCount = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const values: any[] = [];
      const valuePlaceholders: string[] = [];
      
      batch.forEach((row, rowIndex) => {
        const rowPlaceholders: string[] = [];
        columns.forEach((col, colIndex) => {
          const paramIndex = rowIndex * columns.length + colIndex + 1;
          values.push(row[col]);
          rowPlaceholders.push(`$${paramIndex}`);
        });
        valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
      });
      
      const insertQuery = `INSERT INTO "${tableName}" (${colNames}) VALUES ${valuePlaceholders.join(', ')} ON CONFLICT DO NOTHING`;
      
      try {
        await supabasePool.query(insertQuery, values);
        successCount += batch.length;
      } catch (error: any) {
        // If batch fails, try individual inserts
        console.log(`   ⚠️  Batch insert failed, trying individual rows...`);
        for (const row of batch) {
          const rowValues: any[] = [];
          const rowPlaceholders: string[] = [];
          
          columns.forEach((col, colIndex) => {
            rowValues.push(row[col]);
            rowPlaceholders.push(`$${colIndex + 1}`);
          });
          
          const singleInsert = `INSERT INTO "${tableName}" (${colNames}) VALUES (${rowPlaceholders.join(', ')}) ON CONFLICT DO NOTHING`;
          
          try {
            await supabasePool.query(singleInsert, rowValues);
            successCount++;
          } catch (err: any) {
            if (err.code !== '23505') {
              console.error(`   ❌ Error:`, err.message);
            }
          }
        }
      }
    }
    
    console.log(`   ✅ Successfully migrated ${successCount}/${data.length} rows`);
    
  } catch (error: any) {
    console.error(`   ❌ Error migrating ${tableName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Local PostgreSQL to Supabase migration...\n');
  console.log('Source: Local PostgreSQL (localhost:5432/bridge_db)');
  console.log('Target: Supabase\n');
  
  // Test connections
  try {
    await localPool.query('SELECT 1');
    console.log('✅ Local PostgreSQL connection successful');
  } catch (error: any) {
    console.error('❌ Local PostgreSQL connection failed:', error.message);
    process.exit(1);
  }
  
  try {
    await supabasePool.query('SELECT 1');
    console.log('✅ Supabase connection successful\n');
  } catch (error: any) {
    console.error('❌ Supabase connection failed:', error.message);
    console.error('Make sure POSTGRES_URL is set to Supabase in .env.local');
    await supabasePool.end();
    process.exit(1);
  }
  
  // Migrate tables in order
  for (const table of tables) {
    try {
      await migrateTable(table);
    } catch (error: any) {
      console.error(`\n❌ Migration failed at table: ${table}`);
      console.error(error);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📝 Your app is now using Supabase!');
  console.log('   Restart your dev server to use the new connection.');
  
  await localPool.end();
  await supabasePool.end();
  process.exit(0);
}

// Run migration
main().catch(console.error);


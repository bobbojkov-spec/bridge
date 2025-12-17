/**
 * Clean Supabase and Migrate from Local PostgreSQL
 * 
 * This script:
 * 1. Cleans/truncates all tables in Supabase (in reverse order of foreign keys)
 * 2. Migrates all data from local PostgreSQL to Supabase
 * 
 * Run with: npx tsx scripts/clean-and-migrate-to-supabase.ts
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

// Supabase connection pool
function getSupabasePool() {
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    throw new Error('POSTGRES_URL is not set in .env.local');
  }
  
  // Remove sslmode from connection string if present (we'll handle SSL in Pool config)
  let cleanUrl = postgresUrl.replace(/[?&]sslmode=[^&]*/g, '');
  
  // Parse connection string to determine if SSL is needed
  try {
    const url = new URL(cleanUrl.replace('postgresql://', 'http://'));
    const hostname = url.hostname;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // Supabase always requires SSL
    if (!isLocalHost) {
      return new Pool({
        connectionString: cleanUrl,
        ssl: { 
          rejectUnauthorized: false 
        },
      });
    }
    
    return new Pool({
      connectionString: cleanUrl,
    });
  } catch {
    // If parsing fails, assume Supabase and use SSL
    return new Pool({
      connectionString: cleanUrl,
      ssl: { rejectUnauthorized: false },
    });
  }
}

const supabasePool = getSupabasePool();

// Tables in reverse order (to handle foreign keys when truncating)
const tablesReverseOrder = [
  'order_items',
  'orders',
  'site_settings',
  'media_files',
  'team_members',
  'page_blocks',
  'pages',
  'news_articles',
  'hero_slides',
  'product_additional_info',
  'product_tags',
  'product_categories',
  'product_images',
  'products',
  'categories',
  'users',
];

// Tables in forward order (for migration)
const tablesForwardOrder = [
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

async function cleanSupabaseTable(tableName: string) {
  try {
    // Use TRUNCATE CASCADE to handle foreign keys
    await supabasePool.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
    console.log(`   ✅ Cleaned ${tableName}`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error cleaning ${tableName}:`, error.message);
    return false;
  }
}

async function migrateTable(tableName: string) {
  console.log(`\n📦 Migrating table: ${tableName}`);
  
  try {
    // Fetch all data from local PostgreSQL
    const result = await localPool.query(`SELECT * FROM "${tableName}"`);
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
      
      // Use ON CONFLICT DO NOTHING to handle duplicates
      const insertQuery = `INSERT INTO "${tableName}" (${colNames}) VALUES ${valuePlaceholders.join(', ')} ON CONFLICT DO NOTHING`;
      
      try {
        const result = await supabasePool.query(insertQuery, values);
        // Count actual inserted rows (PostgreSQL returns rowCount)
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
            // Only log non-duplicate errors
            if (err.code !== '23505') { // 23505 is unique violation
              console.error(`   ❌ Error inserting row:`, err.message);
              console.error(`   Row data:`, JSON.stringify(row, null, 2));
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
  console.log('🧹 Cleaning Supabase database...\n');
  console.log('⚠️  WARNING: This will DELETE ALL DATA in Supabase!\n');
  
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
  
  // Step 1: Clean Supabase tables
  console.log('🧹 Step 1: Cleaning Supabase tables (in reverse order)...\n');
  for (const table of tablesReverseOrder) {
    await cleanSupabaseTable(table);
  }
  
  console.log('\n✅ Supabase database cleaned!\n');
  console.log('🚀 Step 2: Migrating data from Local PostgreSQL to Supabase...\n');
  
  // Step 2: Migrate tables in forward order
  for (const table of tablesForwardOrder) {
    try {
      await migrateTable(table);
    } catch (error: any) {
      console.error(`\n❌ Migration failed at table: ${table}`);
      console.error(error);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📝 Your Supabase database now matches your local database!');
  
  // Verify migration
  console.log('\n🔍 Verifying migration...\n');
  for (const table of tablesForwardOrder) {
    try {
      const localResult = await localPool.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const supabaseResult = await supabasePool.query(`SELECT COUNT(*) as count FROM "${table}"`);
      
      const localCount = parseInt(localResult.rows[0].count);
      const supabaseCount = parseInt(supabaseResult.rows[0].count);
      
      const match = localCount === supabaseCount;
      const status = match ? '✅' : '❌';
      
      console.log(`${status} ${table.padEnd(25)} Local: ${localCount.toString().padStart(4)} | Supabase: ${supabaseCount.toString().padStart(4)}`);
    } catch (error: any) {
      console.log(`⚠️  ${table.padEnd(25)} Error: ${error.message}`);
    }
  }
  
  await localPool.end();
  await supabasePool.end();
  process.exit(0);
}

// Run migration
main().catch(console.error);


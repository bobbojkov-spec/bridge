/**
 * Data Migration Script: MySQL to PostgreSQL
 * 
 * This script migrates data from MySQL to PostgreSQL
 * Run with: npx tsx scripts/migrate-data.ts
 * 
 * Prerequisites:
 * 1. MySQL database must be accessible
 * 2. PostgreSQL (Supabase) database must be set up with schema
 * 3. Environment variables must be configured
 */

import mysql from 'mysql2/promise';
import { query as pgQuery } from '../lib/db/connection-pg-local';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

// MySQL connection (source)
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'bridge_db',
};

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

// Tables that might not exist in MySQL (skip if missing)
const optionalTables = ['order_items'];

async function migrateTable(tableName: string) {
  console.log(`\n📦 Migrating table: ${tableName}`);
  
  try {
    // Connect to MySQL
    const mysqlConn = await mysql.createConnection(mysqlConfig);
    
    // Fetch all data from MySQL
    const [rows] = await mysqlConn.execute(`SELECT * FROM \`${tableName}\``);
    const data = rows as any[];
    
    if (data.length === 0) {
      console.log(`   ⚠️  No data to migrate`);
      await mysqlConn.end();
      return;
    }
    
    console.log(`   📊 Found ${data.length} rows`);
    
    // Get column names (filter out columns that don't exist in PostgreSQL schema)
    const allColumns = Object.keys(data[0]);
    
    // For site_settings, exclude featured_product columns that don't exist in PostgreSQL
    let columns = allColumns;
    if (tableName === 'site_settings') {
      columns = allColumns.filter(col => !col.startsWith('featured_product_'));
    }
    
    // Convert MySQL data to PostgreSQL format
    for (const row of data) {
      const values: any[] = [];
      
      columns.forEach((col) => {
        let value = row[col];
        
        // Convert MySQL booleans (0/1) to PostgreSQL booleans
        if (typeof value === 'number' && (col.includes('active') || col === 'enabled')) {
          value = value === 1;
        }
        
        // Handle dates
        if (value instanceof Date) {
          value = value.toISOString();
        }
        
        values.push(value);
      });
      
      // Create placeholders after collecting all values
      const placeholders = values.map((_, index) => `$${index + 1}`);
      
      // Build INSERT query (single line, no newlines)
      // Use PostgreSQL placeholders directly ($1, $2, etc.)
      const colNames = columns.map(col => `"${col}"`).join(', ');
      const insertQuery = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders.join(', ')}) ON CONFLICT DO NOTHING`;
      
      try {
        // Use pool directly to avoid double conversion
        const { Pool } = await import('pg');
        const pool = new Pool({
          host: 'localhost',
          port: 5432,
          database: 'bridge_db',
          user: process.env.USER || 'postgres',
        });
        await pool.query(insertQuery, values);
        await pool.end();
      } catch (error: any) {
        console.error(`   ❌ Error inserting row:`, error.message);
        console.error(`   Row data:`, JSON.stringify(row, null, 2));
      }
    }
    
    await mysqlConn.end();
    console.log(`   ✅ Successfully migrated ${data.length} rows`);
    
  } catch (error: any) {
    console.error(`   ❌ Error migrating ${tableName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting MySQL to PostgreSQL migration...\n');
  console.log('MySQL Source:', mysqlConfig.host, mysqlConfig.database);
  console.log('PostgreSQL Target: Local PostgreSQL (bridge_db)\n');
  
  // Test connections
  try {
    const mysqlConn = await mysql.createConnection(mysqlConfig);
    await mysqlConn.ping();
    console.log('✅ MySQL connection successful');
    await mysqlConn.end();
  } catch (error: any) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
  
  try {
    await pgQuery('SELECT 1');
    console.log('✅ PostgreSQL (Local) connection successful\n');
  } catch (error: any) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.error('Make sure PostgreSQL is running and POSTGRES_URL is set in .env.local');
    console.error('Connection string should be: postgresql://localhost:5432/bridge_db');
    console.error('\nTo start PostgreSQL: brew services start postgresql@16');
    process.exit(1);
  }
  
  // Migrate tables in order
  for (const table of tables) {
    try {
      await migrateTable(table);
    } catch (error: any) {
      // Skip optional tables if they don't exist
      if (optionalTables.includes(table) && error.code === 'ER_NO_SUCH_TABLE') {
        console.log(`\n⚠️  Table ${table} doesn't exist in MySQL, skipping...`);
        continue;
      }
      console.error(`\n❌ Migration failed at table: ${table}`);
      console.error(error);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 Migration completed successfully!');
  process.exit(0);
}

// Run migration
main().catch(console.error);


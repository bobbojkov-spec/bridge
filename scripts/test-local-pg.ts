/**
 * Test local PostgreSQL connection
 * Run with: npx tsx scripts/test-local-pg.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { query, testConnection } from '../lib/db/connection-pg-local';

async function test() {
  try {
    console.log('🔌 Testing local PostgreSQL connection...\n');
    console.log('Connection URL:', process.env.POSTGRES_URL?.replace(/:[^:@]+@/, ':****@') || 'Not set');
    
    // Test 1: Basic connection
    const result = await query<{current_time: Date, pg_version: string, db_name: string}>('SELECT NOW() as current_time, version() as pg_version, current_database() as db_name');
    console.log('✅ Connection successful!');
    console.log('   Database:', result[0].db_name);
    console.log('   Current time:', result[0].current_time);
    console.log('   PostgreSQL version:', result[0].pg_version.split(' ')[0] + ' ' + result[0].pg_version.split(' ')[1]);
    
    // Test 2: Check tables
    console.log('\n📊 Checking tables...');
    const tables = await query<{table_name: string}>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Test 3: Test a simple query
    console.log('\n🧪 Testing a query...');
    const countResult = await query<{count: string}>('SELECT COUNT(*) as count FROM products');
    console.log(`✅ Products table accessible (${countResult[0].count} rows)`);
    
    console.log('\n🎉 All tests passed! Your local PostgreSQL is ready.');
    
  } catch (error: any) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('password')) {
      console.error('\n💡 Tip: For local PostgreSQL, you might not need a password');
      console.error('   Try: postgresql://your_username@localhost:5432/bridge_db');
    } else if (error.message.includes('ENOENT') || error.message.includes('POSTGRES_URL')) {
      console.error('\n💡 Tip: Make sure POSTGRES_URL is set in .env.local');
    } else if (error.message.includes('connection')) {
      console.error('\n💡 Tip: Make sure PostgreSQL is running: brew services start postgresql@16');
    }
    
    process.exit(1);
  }
}

test();


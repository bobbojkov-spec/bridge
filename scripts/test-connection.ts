/**
 * Quick connection test script
 * Run with: npx tsx scripts/test-connection.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@vercel/postgres';

async function testConnection() {
  try {
    console.log('🔌 Testing PostgreSQL connection...\n');
    
    const client = createClient();
    
    // Test 1: Basic connection
    const result = await client.sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Connection successful!');
    console.log('   Current time:', result.rows[0].current_time);
    console.log('   PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
    
    // Test 2: Check tables
    console.log('\n📊 Checking tables...');
    const tables = await client.sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`✅ Found ${tables.rows.length} tables:`);
    tables.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Test 3: Test a simple query
    console.log('\n🧪 Testing a query...');
    const countResult = await client.sql`SELECT COUNT(*) as count FROM products`;
    console.log(`✅ Products table accessible (${countResult.rows[0].count} rows)`);
    
    console.log('\n🎉 All tests passed! Your database is ready.');
    
  } catch (error: any) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('password')) {
      console.error('\n💡 Tip: Make sure you replaced [YOUR-PASSWORD] in .env.local with your actual password');
    } else if (error.message.includes('ENOENT') || error.message.includes('POSTGRES_URL')) {
      console.error('\n💡 Tip: Make sure POSTGRES_URL is set in .env.local');
    }
    
    process.exit(1);
  }
}

testConnection();


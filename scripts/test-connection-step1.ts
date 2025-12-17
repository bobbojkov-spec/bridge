/**
 * Step 1: Test Supabase Connection
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('🔍 Step 1: Testing Supabase Connection\n');
  
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    console.error('❌ POSTGRES_URL not found');
    process.exit(1);
  }
  
  console.log('Connection string:', postgresUrl.replace(/:[^:@]+@/, ':***@'));
  
  const pool = new Pool({
    connectionString: postgresUrl.replace(/[?&]sslmode=[^&]*/g, ''),
    ssl: { rejectUnauthorized: false },
  });
  
  try {
    console.log('\n⏳ Attempting connection...');
    const start = Date.now();
    const result = await pool.query('SELECT 1 as test, NOW() as time, current_database() as db');
    const duration = Date.now() - start;
    
    console.log(`✅ Connected in ${duration}ms`);
    console.log('Result:', result.rows[0]);
    
    // Test a simple query
    const countResult = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`\n📊 Products in Supabase: ${countResult.rows[0].count}`);
    
    await pool.end();
    console.log('\n✅ Connection test successful!');
    
  } catch (error: any) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    await pool.end();
    process.exit(1);
  }
}

main().catch(console.error);


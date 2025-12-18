/**
 * Test different connection string formats
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const connectionStrings = [
  process.env.POSTGRES_URL,
  process.env.POSTGRES_URL_NON_POOLING,
].filter(Boolean);

async function testConnection(connString: string, name: string) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   URL: ${connString.replace(/:[^:@]+@/, ':***@')}`);
  
  try {
    const pool = new Pool({
      connectionString: connString.replace(/[?&]sslmode=[^&]*/g, ''),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    
    const start = Date.now();
    const result = await pool.query('SELECT COUNT(*) as count FROM products');
    const duration = Date.now() - start;
    
    console.log(`   ✅ Success! Products: ${result.rows[0].count} (${duration}ms)`);
    await pool.end();
    return true;
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing Connection Strings\n');
  
  for (const connString of connectionStrings) {
    if (connString) {
      await testConnection(connString, connString.includes('pooler') ? 'Pooler' : 'Direct');
    }
  }
  
  console.log('\n💡 If both fail, check Supabase Dashboard for the correct connection string');
}

main().catch(console.error);


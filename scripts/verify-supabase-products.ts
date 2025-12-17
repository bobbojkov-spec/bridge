/**
 * Verify Products in Supabase
 * 
 * This script queries Supabase to check if products are there
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

// Supabase connection pool
function getSupabasePool() {
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    throw new Error('POSTGRES_URL is not set in .env.local');
  }
  
  // Remove sslmode from connection string if present
  let cleanUrl = postgresUrl.replace(/[?&]sslmode=[^&]*/g, '');
  
  return new Pool({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
}

const supabasePool = getSupabasePool();

async function main() {
  console.log('🔍 Checking products in Supabase...\n');
  
  try {
    await supabasePool.query('SELECT 1');
    console.log('✅ Connected to Supabase\n');
  } catch (error: any) {
    console.error('❌ Supabase connection failed:', error.message);
    process.exit(1);
  }
  
  try {
    // Get count
    const countResult = await supabasePool.query('SELECT COUNT(*) as count FROM products');
    const count = parseInt(countResult.rows[0].count);
    console.log(`📊 Total products in Supabase: ${count}\n`);
    
    if (count === 0) {
      console.log('⚠️  No products found in Supabase');
      await supabasePool.end();
      process.exit(0);
    }
    
    // Get all products
    const productsResult = await supabasePool.query('SELECT id, name, slug, price, currency, active FROM products ORDER BY id LIMIT 10');
    const products = productsResult.rows;
    
    console.log('📦 Products found in Supabase:\n');
    products.forEach((product: any) => {
      console.log(`  ✅ ID: ${product.id} | Name: ${product.name} | Slug: ${product.slug} | Price: ${product.currency} ${product.price} | Active: ${product.active}`);
    });
    
    if (count > 10) {
      console.log(`\n  ... and ${count - 10} more products`);
    }
    
    console.log('\n✅ Products are confirmed in Supabase!');
    
  } catch (error: any) {
    console.error('❌ Error querying products:', error.message);
    console.error('Full error:', error);
  }
  
  await supabasePool.end();
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


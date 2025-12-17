/**
 * Test Script: Insert Products from Local PostgreSQL to Supabase
 * 
 * This script tests inserting just the products table to verify connection and insertion works
 * 
 * Run with: npx tsx scripts/test-insert-products.ts
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

async function main() {
  console.log('🧪 Testing Product Insertion: Local PostgreSQL → Supabase\n');
  
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
  
  // Step 1: Check current state
  console.log('📊 Checking current state...\n');
  
  try {
    const localCount = await localPool.query('SELECT COUNT(*) as count FROM products');
    const supabaseCount = await supabasePool.query('SELECT COUNT(*) as count FROM products');
    
    console.log(`Local products: ${localCount.rows[0].count}`);
    console.log(`Supabase products: ${supabaseCount.rows[0].count}\n`);
  } catch (error: any) {
    console.error('❌ Error checking counts:', error.message);
  }
  
  // Step 2: Fetch products from local
  console.log('📦 Fetching products from local PostgreSQL...\n');
  
  let localProducts;
  try {
    const result = await localPool.query('SELECT * FROM products ORDER BY id LIMIT 5');
    localProducts = result.rows;
    console.log(`✅ Found ${localProducts.length} products to test\n`);
    
    if (localProducts.length === 0) {
      console.log('⚠️  No products found in local database');
      await localPool.end();
      await supabasePool.end();
      process.exit(0);
    }
  } catch (error: any) {
    console.error('❌ Error fetching products from local:', error.message);
    await localPool.end();
    await supabasePool.end();
    process.exit(1);
  }
  
  // Step 3: Show first product structure
  console.log('📋 First product structure:');
  console.log('Columns:', Object.keys(localProducts[0]));
  console.log('Sample data:', JSON.stringify(localProducts[0], null, 2).substring(0, 500) + '...\n');
  
  // Step 4: Try inserting first product
  console.log('🔄 Attempting to insert first product into Supabase...\n');
  
  const testProduct = localProducts[0];
  const columns = Object.keys(testProduct);
  const colNames = columns.map(col => `"${col}"`).join(', ');
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const values = columns.map(col => testProduct[col]);
  
  const insertQuery = `INSERT INTO products (${colNames}) VALUES (${placeholders}) RETURNING id, name`;
  
  try {
    console.log('Query:', insertQuery.substring(0, 200) + '...');
    console.log('Values:', values.slice(0, 5), '...\n');
    
    const result = await supabasePool.query(insertQuery, values);
    console.log('✅ Successfully inserted product!');
    console.log('Inserted:', result.rows[0]);
  } catch (error: any) {
    console.error('❌ Error inserting product:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('\nFull error:', error);
    
    // Try to get more info about the table structure
    try {
      const tableInfo = await supabasePool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        ORDER BY ordinal_position
      `);
      console.log('\n📋 Supabase products table structure:');
      tableInfo.rows.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } catch (infoError: any) {
      console.error('Could not fetch table info:', infoError.message);
    }
  }
  
  // Step 5: Verify insertion
  console.log('\n🔍 Verifying insertion...\n');
  try {
    const verifyCount = await supabasePool.query('SELECT COUNT(*) as count FROM products');
    console.log(`Supabase now has ${verifyCount.rows[0].count} products`);
  } catch (error: any) {
    console.error('Error verifying:', error.message);
  }
  
  await localPool.end();
  await supabasePool.end();
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


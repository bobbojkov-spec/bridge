/**
 * Test Supabase Connection
 * Run this to verify the app can connect to Supabase
 */

import { query } from '@/lib/db/connection';

async function main() {
  console.log('🧪 Testing Supabase Connection...\n');
  
  try {
    // Test products
    const products = await query('SELECT COUNT(*) as count FROM products');
    console.log(`✅ Products: ${products[0].count} rows`);
    
    // Test categories
    const categories = await query('SELECT COUNT(*) as count FROM categories');
    console.log(`✅ Categories: ${categories[0].count} rows`);
    
    // Test a sample product
    const sampleProduct = await query('SELECT id, name FROM products LIMIT 1');
    if (sampleProduct.length > 0) {
      console.log(`✅ Sample product: ${sampleProduct[0].name} (ID: ${sampleProduct[0].id})`);
    }
    
    console.log('\n🎉 Supabase connection working!');
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);


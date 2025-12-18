/**
 * Full Supabase Connection Test
 * Tests all major database operations
 */

import { query, queryOne, insertAndGetId } from '@/lib/db/connection';

async function main() {
  console.log('🧪 Full Supabase Connection Test\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Test basic query
    console.log('\n1️⃣ Testing basic query...');
    const products = await query('SELECT COUNT(*) as count FROM products');
    console.log(`   ✅ Products count: ${products[0].count}`);
    
    // 2. Test queryOne
    console.log('\n2️⃣ Testing queryOne...');
    const category = await queryOne('SELECT * FROM categories LIMIT 1');
    console.log(`   ✅ Category: ${category?.name || 'N/A'}`);
    
    // 3. Test products with images
    console.log('\n3️⃣ Testing products with images...');
    const productWithImages = await query(`
      SELECT p.id, p.name, COUNT(pi.id) as image_count
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id
      GROUP BY p.id, p.name
      LIMIT 3
    `);
    productWithImages.forEach((p: any) => {
      console.log(`   ✅ ${p.name}: ${p.image_count} images`);
    });
    
    // 4. Test categories
    console.log('\n4️⃣ Testing categories...');
    const categories = await query('SELECT COUNT(*) as count FROM categories');
    console.log(`   ✅ Categories: ${categories[0].count}`);
    
    // 5. Test hero slides
    console.log('\n5️⃣ Testing hero slides...');
    const heroSlides = await query('SELECT COUNT(*) as count FROM hero_slides');
    console.log(`   ✅ Hero slides: ${heroSlides[0].count}`);
    
    // 6. Test news articles
    console.log('\n6️⃣ Testing news articles...');
    const news = await query('SELECT COUNT(*) as count FROM news_articles');
    console.log(`   ✅ News articles: ${news[0].count}`);
    
    // 7. Test media files
    console.log('\n7️⃣ Testing media files...');
    const media = await query('SELECT COUNT(*) as count FROM media_files');
    console.log(`   ✅ Media files: ${media[0].count}`);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 All tests passed! Supabase connection is working perfectly!');
    console.log('='.repeat(50));
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch(console.error);


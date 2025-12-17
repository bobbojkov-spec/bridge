import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/connection';

// GET /api/settings/featured-products/frontend - Get featured products for frontend
// Returns products in order with all necessary data
export async function GET(request: NextRequest) {
  try {
    // Get settings with featured product IDs
    const settings = await queryOne<any>(
      `SELECT 
        featured_product_1_id,
        featured_product_2_id,
        featured_product_3_id,
        featured_product_4_id,
        featured_product_5_id,
        featured_product_6_id
       FROM site_settings 
       ORDER BY id DESC 
       LIMIT 1`
    );

    if (!settings) {
      return NextResponse.json({ data: [] });
    }

    // Get product IDs in order
    const productIds = [
      settings.featured_product_1_id,
      settings.featured_product_2_id,
      settings.featured_product_3_id,
      settings.featured_product_4_id,
      settings.featured_product_5_id,
      settings.featured_product_6_id,
    ].filter(id => id !== null);

    if (productIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch all products at once
    const placeholders = productIds.map(() => '?').join(',');
    const products = await query<any>(
      `SELECT id, name, slug, price, currency, active 
       FROM products 
       WHERE id IN (${placeholders})`,
      productIds
    );

    // Get images for all products
    const productImagesMap: Record<number, string> = {};
    for (const productId of productIds) {
      const images = await query<any>(
        `SELECT image_url FROM product_images WHERE product_id = ? ORDER BY \`order\` ASC LIMIT 1`,
        [productId]
      );
      if (images[0]) {
        productImagesMap[productId] = images[0].image_url;
      }
    }

    // Map products to match frontend format, maintaining order
    const featuredProducts = productIds
      .map(productId => {
        const product = products.find((p: any) => p.id === productId);
        if (!product || !product.active) return null;
        
        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          currency: product.currency || 'EUR',
          image: productImagesMap[productId] || '/images/placeholder.jpg',
        };
      })
      .filter(Boolean);

    return NextResponse.json({ data: featuredProducts });
  } catch (error: any) {
    console.error('Error fetching featured products for frontend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products', details: error?.message },
      { status: 500 }
    );
  }
}


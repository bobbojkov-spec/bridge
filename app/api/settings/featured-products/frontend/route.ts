import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/connection';

// GET /api/settings/featured-products/frontend - Get featured products for frontend
// Returns products in order with all necessary data
export async function GET(request: NextRequest) {
  try {
    // Get featured products - for now, return first 6 active products
    // TODO: Add featured_products table or featured_product_ids JSON column to site_settings
    const products = await query<any>(
      `SELECT id, name, slug, price, currency, active 
       FROM products 
       WHERE active = TRUE 
       ORDER BY name ASC 
       LIMIT 6`
    );

    if (!products || products.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const productIds = products.map((p: any) => p.id);

    if (productIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get images for all products
    const productImagesMap: Record<number, string> = {};
    for (const productId of productIds) {
      const images = await query<any>(
        `SELECT image_url FROM product_images WHERE product_id = ? ORDER BY "order" ASC LIMIT 1`,
        [productId]
      );
      if (images[0]) {
        productImagesMap[productId] = images[0].image_url;
      }
    }

    // Map products to match frontend format, maintaining order
    const featuredProducts = products
      .map((product: any) => {
        if (!product || !product.active) return null;
        
        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          currency: product.currency || 'EUR',
          image: productImagesMap[product.id] || '/images/placeholder.jpg',
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


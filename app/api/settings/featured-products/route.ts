import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/connection';
import pool from '@/lib/db';

// GET /api/settings/featured-products - Get featured products
export async function GET(request: NextRequest) {
  try {
    // Get settings with featured product IDs (use id = 1 like the settings repository)
    const settings = await queryOne<any>(
      `SELECT 
        \`featured_product_1_id\`,
        \`featured_product_2_id\`,
        \`featured_product_3_id\`,
        \`featured_product_4_id\`,
        \`featured_product_5_id\`,
        \`featured_product_6_id\`
       FROM site_settings 
       WHERE id = 1`
    );

    if (!settings) {
      // Return empty featured products if no settings exist
      return NextResponse.json({
        data: {
          position1: null,
          position2: null,
          position3: null,
          position4: null,
          position5: null,
          position6: null,
        },
      });
    }

    // Fetch product details for each position
    const featuredProducts: any = {};
    const productIds = [
      settings.featured_product_1_id,
      settings.featured_product_2_id,
      settings.featured_product_3_id,
      settings.featured_product_4_id,
      settings.featured_product_5_id,
      settings.featured_product_6_id,
    ];

    for (let i = 0; i < 6; i++) {
      const productId = productIds[i];
      if (productId) {
        const product = await queryOne<any>(
          `SELECT id, name, slug, price, currency, active 
           FROM products 
           WHERE id = ?`,
          [productId]
        );
        
        // Get first image
        const images = await query<any>(
          `SELECT image_url FROM product_images WHERE product_id = ? ORDER BY \`order\` ASC LIMIT 1`,
          [productId]
        );

        featuredProducts[`position${i + 1}`] = product ? {
          id: String(product.id),
          name: product.name,
          slug: product.slug,
          price: product.price,
          currency: product.currency,
          active: Boolean(product.active),
          image: images[0]?.image_url || null,
        } : null;
      } else {
        featuredProducts[`position${i + 1}`] = null;
      }
    }

    return NextResponse.json({
      data: featuredProducts,
    });
  } catch (error: any) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/featured-products - Update featured products
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 PATCH /api/settings/featured-products - Request body:', body);
    
    const {
      position1,
      position2,
      position3,
      position4,
      position5,
      position6,
    } = body;

    // Convert string IDs to integers or null, handle empty strings
    const productIds = [
      position1 && position1 !== '' ? parseInt(String(position1)) : null,
      position2 && position2 !== '' ? parseInt(String(position2)) : null,
      position3 && position3 !== '' ? parseInt(String(position3)) : null,
      position4 && position4 !== '' ? parseInt(String(position4)) : null,
      position5 && position5 !== '' ? parseInt(String(position5)) : null,
      position6 && position6 !== '' ? parseInt(String(position6)) : null,
    ];

    console.log('📝 Converted product IDs:', productIds);

    // Check if settings record exists (use id = 1 like the settings repository)
    const existingSettings = await queryOne<any>(
      'SELECT id FROM site_settings WHERE id = 1'
    );

    console.log('📝 Existing settings:', existingSettings);

    if (existingSettings) {
      // Update existing settings
      console.log('📝 Updating existing settings...');
      await pool.execute(
        `UPDATE site_settings SET
          \`featured_product_1_id\` = ?,
          \`featured_product_2_id\` = ?,
          \`featured_product_3_id\` = ?,
          \`featured_product_4_id\` = ?,
          \`featured_product_5_id\` = ?,
          \`featured_product_6_id\` = ?
         WHERE id = 1`,
        productIds
      );
      console.log('✅ Update successful');
    } else {
      // Create new settings record with id = 1
      console.log('📝 Creating new settings record...');
      await pool.execute(
        `INSERT INTO site_settings (
          id,
          site_name,
          \`featured_product_1_id\`,
          \`featured_product_2_id\`,
          \`featured_product_3_id\`,
          \`featured_product_4_id\`,
          \`featured_product_5_id\`,
          \`featured_product_6_id\`
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Bridge',
          ...productIds,
        ]
      );
      console.log('✅ Insert successful');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error updating featured products:', error);
    console.error('❌ Error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack,
    });
    return NextResponse.json(
      { 
        error: 'Failed to update featured products', 
        details: error?.message || String(error),
        code: error?.code,
        sqlState: error?.sqlState,
      },
      { status: 500 }
    );
  }
}


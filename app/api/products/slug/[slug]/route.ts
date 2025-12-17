import { NextRequest, NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/db/repositories/products';
import {
  getProductImages,
  getProductCategories,
  getProductTags,
  getProductAdditionalInfo,
} from '@/lib/db/repositories/products';

// GET /api/products/slug/[slug] - Get a single product by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Invalid request: missing slug parameter' },
        { status: 400 }
      );
    }

    // Fetch product by slug
    const product = await getProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get related data
    const [images, categoryIds, tags, additionalInfo] = await Promise.all([
      getProductImages(product.id),
      getProductCategories(product.id),
      getProductTags(product.id),
      getProductAdditionalInfo(product.id),
    ]);

    const imageUrls = images.map(img => img.image_url);

    return NextResponse.json({
      data: {
        id: String(product.id),
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description || '',
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price || '0'),
        currency: product.currency || 'EUR',
        stockQuantity: product.stock_quantity !== null && product.stock_quantity !== undefined 
          ? Number(product.stock_quantity) 
          : 0,
        active: Boolean(product.active),
        images: imageUrls,
        categoryIds: categoryIds.map(id => Number(id)),
        tags: tags,
        additionalInfo: additionalInfo ? {
          weight: additionalInfo.weight || '',
          dimensions: additionalInfo.dimensions || '',
          material: additionalInfo.material || '',
          careInstructions: additionalInfo.care_instructions || '',
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


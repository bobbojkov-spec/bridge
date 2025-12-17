import { NextRequest, NextResponse } from 'next/server';
import { getProductById, getProductCategories, getProductTags, getProductImages } from '@/lib/db/repositories/products';
import { getCategoryById } from '@/lib/db/repositories/categories';
import { generateProductSEO } from '@/lib/seo/generate-product-seo';

// POST - Auto-generate SEO data for a product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Fetch product data
    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Fetch related data
    const [categoryIds, tags, images] = await Promise.all([
      getProductCategories(productId),
      getProductTags(productId),
      getProductImages(productId),
    ]);

    // Fetch category names
    const categoryPromises = categoryIds.map(id => getCategoryById(id));
    const categories = await Promise.all(categoryPromises);
    const categoryNames = categories
      .filter(cat => cat !== null)
      .map(cat => cat!.name);

    const tagNames = tags;
    const firstImageUrl = images.length > 0 ? images[0].image_url : null;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Prepare data for SEO generation
    const productDataForSEO = {
      id: productId,
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      price: product.price || null,
      currency: product.currency || 'EUR',
      categoryNames,
      tags: tagNames,
      firstImageUrl,
    };

    // Generate SEO data
    const seoData = generateProductSEO(productDataForSEO, baseUrl);

    return NextResponse.json({
      success: true,
      data: seoData,
      message: 'SEO data generated successfully',
    });
  } catch (error) {
    console.error('Error auto-generating SEO data:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to auto-generate SEO data', 
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 }
    );
  }
}

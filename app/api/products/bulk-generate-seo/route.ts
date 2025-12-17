import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/db/repositories/products';
import { getProductById, getProductCategories, getProductTags, getProductImages } from '@/lib/db/repositories/products';
import { getCategoryById } from '@/lib/db/repositories/categories';
import { generateProductSEO } from '@/lib/seo/generate-product-seo';
import { query } from '@/lib/db/connection';

// POST - Generate and save SEO data for all products
export async function POST(request: NextRequest) {
  try {
    // Get all products (fetch in batches to avoid memory issues)
    const batchSize = 50;
    let page = 1;
    let allProducts: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const result = await getProducts(page, batchSize);
      allProducts = [...allProducts, ...result.products];
      hasMore = result.products.length === batchSize;
      page++;
    }

    if (allProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products found',
        processed: 0,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each product
    for (const product of allProducts) {
      try {
        // Fetch related data
        const [categoryIds, tags, images] = await Promise.all([
          getProductCategories(product.id),
          getProductTags(product.id),
          getProductImages(product.id),
        ]);

        // Fetch category names
        const categoryPromises = categoryIds.map(id => getCategoryById(id));
        const categories = await Promise.all(categoryPromises);
        const categoryNames = categories
          .filter(cat => cat !== null)
          .map(cat => cat!.name);

        const tagNames = tags;
        const firstImageUrl = images.length > 0 ? images[0].image_url : null;

        // Prepare data for SEO generation
        const productDataForSEO = {
          id: product.id,
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

        // Update product in database
        await query(
          `UPDATE products SET
            meta_title = ?,
            meta_description = ?,
            meta_keywords = ?,
            og_title = ?,
            og_description = ?,
            canonical_url = ?
           WHERE id = ?`,
          [
            seoData.metaTitle,
            seoData.metaDescription,
            seoData.seoKeywords,
            seoData.ogTitle,
            seoData.ogDescription,
            seoData.canonicalUrl,
            product.id,
          ]
        );

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Product ${product.id} (${product.name}): ${error.message || String(error)}`);
        console.error(`Error processing product ${product.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${allProducts.length} products`,
      processed: allProducts.length,
      successful: results.success,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('Error bulk-generating SEO data:', error);
    return NextResponse.json(
      {
        error: 'Failed to bulk-generate SEO data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


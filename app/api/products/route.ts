import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getProductById, createProduct } from '@/lib/db/repositories/products';
import {
  setProductImages,
  setProductCategories,
  setProductTags,
  setProductAdditionalInfo,
  getProductImages,
  getProductCategories,
  getProductTags,
  getProductAdditionalInfo,
} from '@/lib/db/repositories/products';

// GET /api/products - List products with pagination and filters
// Refine simple-rest uses: _start, _end, _sort, _order
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Handle Refine's pagination format (_start, _end) or standard format
    let page = 1;
    let pageSize = 10;
    
    if (searchParams.get('_start') !== null && searchParams.get('_end') !== null) {
      // Refine format: _start=0, _end=10 means pageSize=10, page=1
      const start = parseInt(searchParams.get('_start') || '0', 10);
      const end = parseInt(searchParams.get('_end') || '10', 10);
      pageSize = end - start;
      page = Math.floor(start / pageSize) + 1;
    } else {
      // Standard format
      page = parseInt(searchParams.get('current') || searchParams.get('page') || '1', 10);
      pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    }
    
    // Sanitize pagination inputs
    // Ensure page >= 1
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    
    // Ensure pageSize >= 1 and <= 100
    if (isNaN(pageSize) || pageSize < 1) {
      pageSize = 10;
    }
    if (pageSize > 100) {
      pageSize = 100; // Cap at 100 for list endpoints
    }
    
    const active = searchParams.get('active');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    const filters: any = {};
    if (active !== null) filters.active = active === 'true';
    if (categoryId) filters.categoryId = parseInt(categoryId);
    if (search) filters.search = search;

    const result = await getProducts(page, pageSize, filters);

    // Enrich products with related data (images, categories, tags)
    let enrichedProducts = [];
    if (result.products && result.products.length > 0) {
      enrichedProducts = await Promise.all(
        result.products.map(async (product) => {
          try {
            const [images, categoryIds, tags, additionalInfo] = await Promise.all([
              getProductImages(product.id),
              getProductCategories(product.id),
              getProductTags(product.id),
              getProductAdditionalInfo(product.id),
            ]);

            // Ensure all data types are correct
            const priceValue = typeof product.price === 'string' 
              ? parseFloat(product.price) 
              : (typeof product.price === 'number' ? product.price : 0);
            
            const stockValue = typeof product.stock_quantity === 'string'
              ? parseInt(product.stock_quantity)
              : (typeof product.stock_quantity === 'number' ? product.stock_quantity : 0);

            return {
              id: String(product.id), // Ensure ID is string for Refine
              name: String(product.name || ''),
              slug: String(product.slug || ''),
              sku: String(product.sku || ''),
              description: String(product.description || ''),
              price: priceValue, // Number, not string
              currency: String(product.currency || 'EUR'),
              stockQuantity: stockValue, // Number, not string
              active: Boolean(product.active),
              metaTitle: product.meta_title ? String(product.meta_title) : null,
              metaDescription: product.meta_description ? String(product.meta_description) : null,
              images: Array.isArray(images) && images.length > 0 ? images.map(img => String(img.image_url)) : [],
              categoryIds: Array.isArray(categoryIds) ? categoryIds.map(id => Number(id)) : [],
              tags: Array.isArray(tags) ? tags.map(t => String(t)) : [],
              additionalInfo: additionalInfo ? {
                weight: additionalInfo.weight ? String(additionalInfo.weight) : null,
                dimensions: additionalInfo.dimensions ? String(additionalInfo.dimensions) : null,
                material: additionalInfo.material ? String(additionalInfo.material) : null,
                careInstructions: additionalInfo.care_instructions ? String(additionalInfo.care_instructions) : null,
              } : null,
            };
          } catch (err) {
            console.error(`Error enriching product ${product.id}:`, err);
            // Return basic product data even if enrichment fails
            return {
              id: product.id.toString(),
              name: product.name,
              slug: product.slug,
              sku: product.sku,
              description: product.description,
              price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
              currency: product.currency || 'EUR',
              stockQuantity: product.stock_quantity || 0,
              active: Boolean(product.active),
              images: [],
              categoryIds: [],
              tags: [],
              additionalInfo: null,
            };
          }
        })
      );
    }

    // Normalized response format: { data: [...], total: number, page: number, pageSize: number }
    // Also sets X-Total-Count header for Refine compatibility
    const total = result.total || 0;
    
    return NextResponse.json({
      data: enrichedProducts || [],
      total,
      page,
      pageSize,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Total-Count': String(total),
        'Access-Control-Expose-Headers': 'X-Total-Count',
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      sku,
      description,
      price,
      currency = 'EUR',
      stockQuantity = 0,
      active = true,
      metaTitle,
      metaDescription,
      images = [],
      categoryIds = [],
      tags = [],
      additionalInfo,
    } = body;

    // Create product
    const productId = await createProduct({
      name,
      slug,
      sku,
      description,
      price: parseFloat(price),
      currency,
      stock_quantity: stockQuantity,
      active,
      meta_title: metaTitle,
      meta_description: metaDescription,
    });

    // Add images
    if (images.length > 0) {
      await setProductImages(productId, images);
    }

    // Set categories
    if (categoryIds.length > 0) {
      // Convert string IDs to numbers
      const numericCategoryIds = Array.isArray(categoryIds)
        ? categoryIds.map(catId => parseInt(String(catId))).filter(id => !isNaN(id))
        : [];
      await setProductCategories(productId, numericCategoryIds);
    }

    // Set tags
    if (tags.length > 0) {
      await setProductTags(productId, tags);
    }

    // Set additional info
    if (additionalInfo) {
      await setProductAdditionalInfo(productId, {
        weight: additionalInfo.weight,
        dimensions: additionalInfo.dimensions,
        material: additionalInfo.material,
        care_instructions: additionalInfo.careInstructions,
      });
    }

    // Fetch created product with all related data
    const [product, productImages, productCategoryIds, productTags, productAdditionalInfo] = await Promise.all([
      getProductById(productId),
      getProductImages(productId),
      getProductCategories(productId),
      getProductTags(productId),
      getProductAdditionalInfo(productId),
    ]);

    return NextResponse.json({
      data: {
        ...product,
        id: product.id.toString(),
        images: productImages.map(img => img.image_url),
        categoryIds: productCategoryIds,
        tags: productTags,
        additionalInfo: productAdditionalInfo ? {
          weight: productAdditionalInfo.weight,
          dimensions: productAdditionalInfo.dimensions,
          material: productAdditionalInfo.material,
          careInstructions: productAdditionalInfo.care_instructions,
        } : null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

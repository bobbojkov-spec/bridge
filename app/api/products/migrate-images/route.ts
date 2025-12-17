import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { ProductImage } from '@/lib/db/models';
import { processImage } from '@/lib/media/processor';
import { createMediaFile } from '@/lib/db/repositories/media';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

// POST /api/products/migrate-images - Migrate all product images to new media system
export async function POST(request: NextRequest) {
  try {
    // Get all products with their images
    const productImages = await query<ProductImage>(
      `SELECT pi.*, p.name as product_name 
       FROM product_images pi 
       JOIN products p ON pi.product_id = p.id 
       ORDER BY pi.product_id, pi.\`order\``
    );

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Group images by product
    const imagesByProduct = new Map<number, ProductImage[]>();
    for (const img of productImages) {
      if (!imagesByProduct.has(img.product_id)) {
        imagesByProduct.set(img.product_id, []);
      }
      imagesByProduct.get(img.product_id)!.push(img);
    }

    for (const [productId, images] of imagesByProduct.entries()) {
      for (const productImage of images) {
        const imageUrl = productImage.image_url;
        try {
          
          // Skip if already in media_files (starts with /uploads/images/original/)
          if (imageUrl.startsWith('/uploads/images/original/')) {
            results.skipped++;
            continue;
          }

          // Find the largest version of this image
          const largestImagePath = await findLargestImageVersion(imageUrl);
          
          if (!largestImagePath || !existsSync(largestImagePath)) {
            results.failed++;
            results.errors.push(`Image not found: ${imageUrl} (Product ${productId}, Image ID: ${productImage.id})`);
            console.error(`Could not find image: ${imageUrl}`);
            continue;
          }
          
          console.log(`Found image: ${imageUrl} -> ${largestImagePath}`);

          // Read the image file
          const buffer = await readFile(largestImagePath);
          
          // Get mime type from file
          const metadata = await sharp(buffer).metadata();
          const mimeType = metadata.format === 'jpeg' ? 'image/jpeg' :
                          metadata.format === 'png' ? 'image/png' :
                          metadata.format === 'webp' ? 'image/webp' :
                          'image/jpeg';

          // Generate unique filename
          const timestamp = Date.now();
          const originalFilename = imageUrl.split('/').pop() || `product-${productId}-${productImage.order}.jpg`;
          const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
          const uniqueFilename = `${timestamp}_${sanitizedFilename}`;

          // Process image (no crop, just resize)
          const processed = await processImage(buffer, uniqueFilename, mimeType);

          // Create media file entry
          const mediaId = await createMediaFile({
            filename: uniqueFilename,
            url: processed.original.url,
            url_large: processed.large?.url || null,
            url_medium: processed.medium?.url || null,
            url_thumb: processed.thumb?.url || null,
            mime_type: mimeType,
            size: processed.original.size,
            width: processed.original.width,
            height: processed.original.height,
            alt_text: productImage.alt_text,
            caption: null,
          });

          // Update product_image to point to new media file
          await query(
            `UPDATE product_images SET image_url = ? WHERE id = ?`,
            [processed.original.url, productImage.id]
          );

          results.processed++;
        } catch (error: any) {
          results.failed++;
          const errorMsg = `Product ${productId}, Image ${productImage.id} (${imageUrl}): ${error.message || String(error)}`;
          results.errors.push(errorMsg);
          console.error(`Error processing image ${productImage.id}:`, error);
          console.error(`Image URL: ${imageUrl}`);
          console.error(`Error stack:`, error.stack);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} images, ${results.skipped} skipped (already migrated), ${results.failed} failed`,
      processed: results.processed,
      skipped: results.skipped,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined, // Return all errors for debugging
      totalErrors: results.errors.length,
    });
  } catch (error) {
    console.error('Error migrating product images:', error);
    return NextResponse.json(
      {
        error: 'Failed to migrate product images',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Find the largest version of an image by checking various size suffixes
 */
async function findLargestImageVersion(imageUrl: string): Promise<string | null> {
  // Remove leading slash if present
  const cleanUrl = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
  
  // Try multiple path variations
  const pathVariations = [
    cleanUrl, // Original path
    join('public', cleanUrl), // With public prefix
    cleanUrl.replace(/^public\//, ''), // Remove public if present
  ];

  // First, try exact path matches
  for (const pathVar of pathVariations) {
    const basePath = join(process.cwd(), pathVar);
    if (existsSync(basePath)) {
      return basePath;
    }
  }

  // Extract base filename (without size suffix)
  const urlParts = cleanUrl.split('/');
  const filename = urlParts[urlParts.length - 1];
  
  // Try to find base filename (remove size suffixes like -300x300, -800x800, etc.)
  const baseFilenameMatch = filename.match(/^(.+?)(?:-\d+x\d+)*(\.(jpg|jpeg|png|webp))$/i);
  if (!baseFilenameMatch) {
    // If no match, try the filename as-is
    const directory = urlParts.slice(0, -1).join('/');
    const dirVariations = [
      directory,
      join('public', directory),
      directory.replace(/^public\//, ''),
    ];
    
    for (const dirVar of dirVariations) {
      const dirPath = join(process.cwd(), dirVar);
      const filePath = join(dirPath, filename);
      if (existsSync(dirPath) && existsSync(filePath)) {
        return filePath;
      }
    }
    return null;
  }

  const baseName = baseFilenameMatch[1];
  const extension = baseFilenameMatch[2];
  const directory = urlParts.slice(0, -1).join('/');
  
  // Try multiple directory variations
  const dirVariations = [
    directory,
    join('public', directory),
    directory.replace(/^public\//, ''),
  ];

  // Find all versions of this image
  const possibleSizes = [
    '', // Original (no suffix)
    '-1920x1920',
    '-1024x1024',
    '-800x800',
    '-400x400',
    '-300x300',
    '-150x150',
  ];

  let largestPath: string | null = null;
  let largestSize = 0;

  for (const dirVar of dirVariations) {
    const dirPath = join(process.cwd(), dirVar);
    
    if (!existsSync(dirPath)) {
      continue;
    }

    for (const sizeSuffix of possibleSizes) {
      const testFilename = `${baseName}${sizeSuffix}${extension}`;
      const testPath = join(dirPath, testFilename);
      
      if (existsSync(testPath)) {
        try {
          const stats = await stat(testPath);
          if (stats.size > largestSize) {
            largestSize = stats.size;
            largestPath = testPath;
          }
        } catch (error) {
          // Continue to next file
        }
      }
    }
    
    // If we found a file, break (don't check other directory variations)
    if (largestPath) {
      break;
    }
  }

  return largestPath;
}


import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { ProductImage } from '@/lib/db/models';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';

// POST /api/products/cleanup-old-images - Delete old product images that are no longer referenced
export async function POST(request: NextRequest) {
  try {
    // Get all current product image URLs (the new ones)
    const productImages = await query<ProductImage>(
      `SELECT image_url FROM product_images`
    );

    // Create a set of all currently referenced image URLs
    const referencedUrls = new Set<string>();
    for (const img of productImages) {
      referencedUrls.add(img.image_url);
    }

    const results = {
      checked: 0,
      deleted: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Directories to check for old images
    const directoriesToCheck = [
      'public/images',
    ];

    for (const dir of directoriesToCheck) {
      const dirPath = join(process.cwd(), dir);
      
      if (!existsSync(dirPath)) {
        continue;
      }

      try {
        const files = readdirSync(dirPath, { withFileTypes: true });
        
        for (const file of files) {
          if (!file.isFile()) {
            continue;
          }

          // Skip non-image files
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
          const isImage = imageExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
          );
          
          if (!isImage) {
            continue;
          }

          results.checked++;

          // Check if this file is referenced
          const fileUrl = `/${dir}/${file.name}`;
          const fileUrlWithoutPublic = fileUrl.replace(/^\/public\//, '/');
          
          // Skip if this is a new media file (in uploads/images/)
          if (fileUrl.includes('/uploads/images/')) {
            continue;
          }

          // Check if file is referenced by any product
          const isReferenced = referencedUrls.has(fileUrl) || 
                              referencedUrls.has(fileUrlWithoutPublic) ||
                              productImages.some(img => img.image_url.includes(file.name));

          if (!isReferenced) {
            // This file is not referenced, safe to delete
            const filePath = join(dirPath, file.name);
            
            try {
              await unlink(filePath);
              results.deleted++;
              console.log(`Deleted: ${filePath}`);
            } catch (error: any) {
              results.failed++;
              results.errors.push(`Failed to delete ${file.name}: ${error.message || String(error)}`);
              console.error(`Error deleting ${filePath}:`, error);
            }
          }
        }
      } catch (error: any) {
        results.errors.push(`Error reading directory ${dir}: ${error.message || String(error)}`);
        console.error(`Error reading directory ${dirPath}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${results.checked} files. Deleted ${results.deleted} old images, ${results.failed} failed`,
      checked: results.checked,
      deleted: results.deleted,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('Error cleaning up old images:', error);
    return NextResponse.json(
      {
        error: 'Failed to cleanup old images',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


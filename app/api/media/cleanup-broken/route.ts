import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { MediaFile } from '@/lib/db/models';
import { join } from 'path';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

// POST /api/media/cleanup-broken - Remove broken images and their product references
export async function POST(request: NextRequest) {
  try {
    // Get all media files
    const files = await query<MediaFile>(
      `SELECT id, filename, url, url_large, url_medium, url_thumb FROM media_files`
    );

    const results = {
      checked: 0,
      broken: 0,
      removed: 0,
      productReferencesRemoved: 0,
      errors: [] as string[],
    };

    for (const file of files) {
      results.checked++;
      
      try {
        // Check if original file exists
        const originalPath = join(process.cwd(), 'public', file.url);
        const fileExists = existsSync(originalPath);

        if (!fileExists) {
          results.broken++;
          
          // Find and remove product references
          const productImages = await query<{ product_id: number; image_url: string }>(
            `SELECT product_id, image_url FROM product_images WHERE image_url = ?`,
            [file.url]
          );

          // Remove from all products
          for (const productImage of productImages) {
            await query(
              `DELETE FROM product_images WHERE product_id = ? AND image_url = ?`,
              [productImage.product_id, file.url]
            );
            results.productReferencesRemoved++;
          }

          // Try to delete file variants if they exist
          const filesToDelete = [
            file.url,
            file.url_large,
            file.url_medium,
            file.url_thumb,
          ].filter(Boolean) as string[];

          for (const fileUrl of filesToDelete) {
            try {
              const filePath = join(process.cwd(), 'public', fileUrl);
              if (existsSync(filePath)) {
                await unlink(filePath);
              }
            } catch (deleteError) {
              // Ignore delete errors for missing files
            }
          }

          // Remove from database
          await query(`DELETE FROM media_files WHERE id = ?`, [file.id]);
          results.removed++;
        }
      } catch (error: any) {
        results.errors.push(`${file.filename}: ${error.message || String(error)}`);
        console.error(`Error checking ${file.filename}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${results.checked} files. Removed ${results.removed} broken images and ${results.productReferencesRemoved} product references.`,
      checked: results.checked,
      broken: results.broken,
      removed: results.removed,
      productReferencesRemoved: results.productReferencesRemoved,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('Error cleaning up broken images:', error);
    return NextResponse.json(
      {
        error: 'Failed to cleanup broken images',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


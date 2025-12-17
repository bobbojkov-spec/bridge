import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { MediaFile } from '@/lib/db/models';
import { processImage } from '@/lib/media/processor';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// POST /api/media/reprocess-all - Reprocess all images with new sizing rules
export async function POST(request: NextRequest) {
  try {
    // Get all media files
    const files = await query<MediaFile>(
      `SELECT id, filename, url, url_large, url_medium, url_thumb, mime_type FROM media_files`
    );

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const file of files) {
      try {
        // Read original file
        const originalPath = join(process.cwd(), 'public', file.url);
        
        if (!existsSync(originalPath)) {
          results.failed++;
          results.errors.push(`Original file not found: ${file.filename}`);
          continue;
        }

        const buffer = await readFile(originalPath);
        const mimeType = file.mime_type || 'image/jpeg';

        // Delete old size variants
        const filesToDelete = [
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
            // Ignore delete errors
          }
        }

        // Reprocess with new rules
        const processed = await processImage(buffer, file.filename, mimeType);

        // Update database with new URLs
        await query(
          `UPDATE media_files 
           SET url_large = ?, url_medium = ?, url_thumb = ?, width = ?, height = ? 
           WHERE id = ?`,
          [
            processed.large?.url || null,
            processed.medium?.url || null,
            processed.thumb?.url || null,
            processed.original.width,
            processed.original.height,
            file.id,
          ]
        );

        results.processed++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${file.filename}: ${error.message || String(error)}`);
        console.error(`Error reprocessing ${file.filename}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reprocessed ${results.processed} images, ${results.failed} failed`,
      processed: results.processed,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('Error reprocessing images:', error);
    return NextResponse.json(
      {
        error: 'Failed to reprocess images',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


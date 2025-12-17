import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { MediaFile } from '@/lib/db/models';
import sharp from 'sharp';
import { join } from 'path';
import { existsSync } from 'fs';

// POST /api/media/fix-dimensions - Fix missing dimensions by reading from files
export async function POST(request: NextRequest) {
  try {
    // Get all media files with missing dimensions
    const files = await query<MediaFile>(
      `SELECT id, filename, url, width, height FROM media_files 
       WHERE width IS NULL OR height IS NULL OR width = 0 OR height = 0`
    );

    const results = {
      fixed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const file of files) {
      try {
        // Try to read dimensions from original file
        const filePath = join(process.cwd(), 'public', file.url);
        
        if (!existsSync(filePath)) {
          results.failed++;
          results.errors.push(`File not found: ${file.filename}`);
          continue;
        }

        const metadata = await sharp(filePath).metadata();
        const width = metadata.width || 0;
        const height = metadata.height || 0;

        if (width > 0 && height > 0) {
          // Update database with dimensions
          await query(
            `UPDATE media_files SET width = ?, height = ? WHERE id = ?`,
            [width, height, file.id]
          );
          results.fixed++;
        } else {
          results.failed++;
          results.errors.push(`Could not read dimensions: ${file.filename}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${file.filename}: ${error.message || String(error)}`);
        console.error(`Error fixing ${file.filename}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${results.fixed} images, ${results.failed} failed`,
      fixed: results.fixed,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('Error fixing dimensions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fix dimensions',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


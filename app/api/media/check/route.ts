import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Check endpoint to verify media uploads
 * GET /api/media/check - Check database and file system
 */
export async function GET(request: NextRequest) {
  try {
    // Check database
    const dbFiles = await query<any>(
      'SELECT id, filename, url, url_large, url_medium, url_thumb, width, height, size, created_at FROM media_files ORDER BY created_at DESC LIMIT 10'
    );

    // Check file system
    const uploadDirs = {
      original: join(process.cwd(), 'public/uploads/images/original'),
      large: join(process.cwd(), 'public/uploads/images/large'),
      medium: join(process.cwd(), 'public/uploads/images/medium'),
      thumb: join(process.cwd(), 'public/uploads/images/thumb'),
    };

    const fileSystemFiles: any = {};

    for (const [size, dir] of Object.entries(uploadDirs)) {
      if (existsSync(dir)) {
        try {
          const files = await readdir(dir);
          const fileStats = await Promise.all(
            files.map(async (file) => {
              const filePath = join(dir, file);
              const stats = await stat(filePath);
              return {
                name: file,
                size: stats.size,
                created: stats.birthtime,
              };
            })
          );
          fileSystemFiles[size] = fileStats;
        } catch (error) {
          fileSystemFiles[size] = { error: (error as Error).message };
        }
      } else {
        fileSystemFiles[size] = { error: 'Directory does not exist' };
      }
    }

    // Match database records with file system
    const matchedFiles = dbFiles.map((dbFile: any) => {
      const originalExists = fileSystemFiles.original?.some(
        (fsFile: any) => fsFile.name === dbFile.filename
      );
      const largeExists = dbFile.url_large
        ? fileSystemFiles.large?.some((fsFile: any) =>
            fsFile.name.includes(dbFile.filename.replace(/\.[^/.]+$/, ''))
          )
        : null;
      const mediumExists = dbFile.url_medium
        ? fileSystemFiles.medium?.some((fsFile: any) =>
            fsFile.name.includes(dbFile.filename.replace(/\.[^/.]+$/, ''))
          )
        : null;
      const thumbExists = dbFile.url_thumb
        ? fileSystemFiles.thumb?.some((fsFile: any) =>
            fsFile.name.includes(dbFile.filename.replace(/\.[^/.]+$/, ''))
          )
        : null;

      return {
        ...dbFile,
        fileSystem: {
          original: originalExists,
          large: largeExists,
          medium: mediumExists,
          thumb: thumbExists,
        },
      };
    });

    return NextResponse.json({
      success: true,
      database: {
        total: dbFiles.length,
        files: matchedFiles,
      },
      fileSystem: {
        original: {
          count: fileSystemFiles.original?.length || 0,
          files: fileSystemFiles.original || [],
        },
        large: {
          count: fileSystemFiles.large?.length || 0,
          files: fileSystemFiles.large || [],
        },
        medium: {
          count: fileSystemFiles.medium?.length || 0,
          files: fileSystemFiles.medium || [],
        },
        thumb: {
          count: fileSystemFiles.thumb?.length || 0,
          files: fileSystemFiles.thumb || [],
        },
      },
    });
  } catch (error: any) {
    console.error('Check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Check failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


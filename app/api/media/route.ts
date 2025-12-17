import { NextRequest, NextResponse } from 'next/server';
import { getMediaFiles, createMediaFile } from '@/lib/db/repositories/media';
import { processImage } from '@/lib/media/processor';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/lib/media/config';
import { query } from '@/lib/db/connection';
import { MediaFile } from '@/lib/db/models';

// GET /api/media - Get media files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Sanitize pagination inputs
    let page = parseInt(searchParams.get('page') || '1', 10);
    let pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
    
    // Ensure page >= 1
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    
    // Ensure pageSize >= 1 and <= 100
    if (isNaN(pageSize) || pageSize < 1) {
      pageSize = 100;
    }
    if (pageSize > 100) {
      pageSize = 100; // Cap at 100 for list endpoints
    }
    
    const offset = (page - 1) * pageSize;
    
    // Use string interpolation for LIMIT/OFFSET to avoid parameter binding issues
    // MySQL LIMIT doesn't always work with parameterized queries
    const files = await query<MediaFile>(
      `SELECT id, filename, url, url_large, url_medium, url_thumb, mime_type, size, width, height, alt_text, caption, created_at 
       FROM media_files 
       ORDER BY created_at DESC 
       LIMIT ${pageSize} OFFSET ${offset}`
    );

    // Get total count
    const countResult = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM media_files`
    );
    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      data: files || [],
      total,
      page,
      pageSize,
    });
  } catch (error: any) {
    console.error('Error fetching media files:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch media files',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

// POST /api/media - Upload/create media file with image processing
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const mimeType = file.type;
    
    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueFilename = `${timestamp}_${sanitizedFilename}`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Process image (generate all sizes)
    const processed = await processImage(buffer, uniqueFilename, mimeType);

    // Save to database
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
      alt_text: null,
      caption: null,
    });

    return NextResponse.json({
      data: {
        id: mediaId,
        filename: uniqueFilename,
        url: processed.original.url,
        url_large: processed.large?.url || null,
        url_medium: processed.medium?.url || null,
        url_thumb: processed.thumb?.url || null,
        mime_type: mimeType,
        size: processed.original.size,
        width: processed.original.width,
        height: processed.original.height,
        alt_text: null,
        caption: null,
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Error creating media file:', error);
    return NextResponse.json(
      { error: 'Failed to create media file', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

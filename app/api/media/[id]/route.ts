import { NextRequest, NextResponse } from 'next/server';
import { deleteMediaFile, getMediaFileById } from '@/lib/db/repositories/media';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { UPLOAD_DIRS } from '@/lib/media/config';

// DELETE /api/media/[id] - Delete media file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const mediaId = parseInt(id);

    if (isNaN(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    // Get media file info before deleting
    const mediaFile = await getMediaFileById(mediaId);
    if (!mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    // Delete from database
    await deleteMediaFile(mediaId);

    // Delete files from filesystem
    const filesToDelete = [
      mediaFile.url,
      mediaFile.url_large,
      mediaFile.url_medium,
      mediaFile.url_thumb,
    ].filter(Boolean) as string[];

    for (const fileUrl of filesToDelete) {
      try {
        // Convert URL to file path (remove leading /)
        const filePath = join(process.cwd(), 'public', fileUrl);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (fileError) {
        console.error(`Failed to delete file ${fileUrl}:`, fileError);
        // Continue even if file deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Media file deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting media file:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete media file',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


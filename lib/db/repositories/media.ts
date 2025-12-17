import { query, queryOne, insertAndGetId } from '../connection';
import { MediaFile } from '../models';

// Get all media files with pagination
export async function getMediaFiles(
  page: number = 1,
  pageSize: number = 20,
  filters?: { mimeType?: string; search?: string }
): Promise<{ files: MediaFile[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];

  if (filters?.mimeType && filters.mimeType.trim()) {
    whereClause += ' AND mime_type LIKE ?';
    params.push(`%${filters.mimeType}%`);
  }

  if (filters?.search && filters.search.trim()) {
    whereClause += ' AND (filename LIKE ? OR alt_text LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  const offset = (page - 1) * pageSize;
  
  // Use string interpolation for LIMIT/OFFSET (PostgreSQL compatible)
  const filesQuery = `SELECT id, filename, url, url_large, url_medium, url_thumb, mime_type, size, width, height, alt_text, caption, created_at FROM media_files WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
  
  const files = await query<MediaFile>(filesQuery, params);

  // For count query, use only the filter params (not LIMIT/OFFSET)
  const countQuery = `SELECT COUNT(*) as count FROM media_files WHERE ${whereClause}`;
  const countParams = params.length > 0 ? params : [];
  
  const totalResults = await query<{ count: number }>(countQuery, countParams);

  return {
    files,
    total: totalResults[0]?.count || 0,
  };
}

// Get media file by ID
export async function getMediaFileById(id: number): Promise<MediaFile | null> {
  return await queryOne<MediaFile>('SELECT * FROM media_files WHERE id = ?', [id]);
}

// Create media file
export async function createMediaFile(file: Omit<MediaFile, 'id' | 'created_at'>): Promise<number> {
  const mediaId = await insertAndGetId(
    `INSERT INTO media_files (filename, url, url_large, url_medium, url_thumb, mime_type, size, width, height, alt_text, caption)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      file.filename,
      file.url,
      file.url_large || null,
      file.url_medium || null,
      file.url_thumb || null,
      file.mime_type,
      file.size,
      file.width,
      file.height,
      file.alt_text,
      file.caption,
    ]
  );
  return mediaId;
}

// Delete media file
export async function deleteMediaFile(id: number): Promise<boolean> {
  await query('DELETE FROM media_files WHERE id = ?', [id]);
  return true;
}


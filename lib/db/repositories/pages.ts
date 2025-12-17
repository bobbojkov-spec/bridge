import { query, queryOne } from '../connection';
import { Page, PageBlock } from '../models';

// Get all pages
export async function getPages(): Promise<Page[]> {
  return await query<Page>('SELECT * FROM pages ORDER BY created_at DESC');
}

// Get page by ID
export async function getPageById(id: number): Promise<Page | null> {
  return await queryOne<Page>('SELECT * FROM pages WHERE id = ?', [id]);
}

// Get page by slug
export async function getPageBySlug(slug: string): Promise<Page | null> {
  return await queryOne<Page>('SELECT * FROM pages WHERE slug = ?', [slug]);
}

// Create page
export async function createPage(page: Omit<Page, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  try {
    const result = await query<{ insertId: number }>(
      `INSERT INTO pages (title, slug, status, seo_title, seo_description)
       VALUES (?, ?, ?, ?, ?)`,
      [
        page.title,
        page.slug,
        page.status || 'draft',
        page.seo_title || null,
        page.seo_description || null,
      ]
    );
    
    const insertId = result[0]?.insertId;
    if (!insertId || insertId === 0) {
      throw new Error('Failed to get insert ID from database result');
    }
    
    return insertId;
  } catch (error: any) {
    // Re-throw with more context
    console.error('createPage error:', {
      page: { title: page.title, slug: page.slug, status: page.status },
      error: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
    });
    throw error;
  }
}

// Update page
export async function updatePage(id: number, page: Partial<Omit<Page, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(page).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return false;

  values.push(id);
  await query(`UPDATE pages SET ${fields.join(', ')} WHERE id = ?`, values);
  return true;
}

// Delete page
export async function deletePage(id: number): Promise<boolean> {
  await query('DELETE FROM pages WHERE id = ?', [id]);
  return true;
}

// Get blocks for a page
export async function getPageBlocks(pageId: number): Promise<PageBlock[]> {
  const blocks = await query<any>(
    'SELECT * FROM page_blocks WHERE page_id = ? ORDER BY position ASC',
    [pageId]
  );
  
  // Parse JSON data field
  return blocks.map((block: any) => ({
    ...block,
    data: typeof block.data === 'string' ? JSON.parse(block.data) : block.data,
    enabled: Boolean(block.enabled),
  })) as PageBlock[];
}

// Create page block
export async function createPageBlock(block: Omit<PageBlock, 'id' | 'created_at'>): Promise<number> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO page_blocks (page_id, type, position, data, enabled)
     VALUES (?, ?, ?, ?, ?)`,
    [
      block.page_id,
      block.type,
      block.position || 0,
      JSON.stringify(block.data),
      block.enabled !== undefined ? (block.enabled ? 1 : 0) : 1,
    ]
  );
  return result[0]?.insertId || 0;
}

// Update page block
export async function updatePageBlock(id: number, block: Partial<Omit<PageBlock, 'id' | 'page_id' | 'created_at'>>): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(block).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'data') {
        fields.push('data = ?');
        values.push(JSON.stringify(value));
      } else if (key === 'enabled') {
        fields.push('enabled = ?');
        values.push(value ? 1 : 0);
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
  });

  if (fields.length === 0) return false;

  values.push(id);
  await query(`UPDATE page_blocks SET ${fields.join(', ')} WHERE id = ?`, values);
  return true;
}

// Delete page block
export async function deletePageBlock(id: number): Promise<boolean> {
  await query('DELETE FROM page_blocks WHERE id = ?', [id]);
  return true;
}

// Reorder blocks (update positions)
export async function reorderPageBlocks(updates: { id: number; position: number }[]): Promise<boolean> {
  if (updates.length === 0) return true;

  // Use a transaction-like approach with individual updates
  for (const update of updates) {
    await query('UPDATE page_blocks SET position = ? WHERE id = ?', [update.position, update.id]);
  }
  return true;
}

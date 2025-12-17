import { query, queryOne } from '../connection';
import { NewsArticle } from '../models';

// Get all news articles with pagination
export async function getNewsArticles(
  page: number = 1,
  pageSize: number = 10,
  filters?: { publishStatus?: string; search?: string; activeOnly?: boolean }
): Promise<{ articles: NewsArticle[]; total: number }> {
  try {
    let whereClause = '1=1';
    const params: any[] = [];

    if (filters?.activeOnly) {
      whereClause += ' AND active = TRUE';
    }

    if (filters?.publishStatus) {
      whereClause += ' AND publish_status = ?';
      params.push(filters.publishStatus);
    }

    if (filters?.search) {
      whereClause += ' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Sanitize page and pageSize
    const sanitizedPage = Math.max(1, page);
    const sanitizedPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (sanitizedPage - 1) * sanitizedPageSize;
    
    // Use string interpolation for LIMIT/OFFSET like products does
    const articlesQuery = `SELECT * FROM news_articles WHERE ${whereClause} ORDER BY COALESCE(\`order\`, 0) ASC, COALESCE(publish_date, created_at) DESC LIMIT ${sanitizedPageSize} OFFSET ${offset}`;
    const articles = await query<NewsArticle>(articlesQuery, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM news_articles WHERE ${whereClause}`;
    const countResult = await query<{ count: number }>(countQuery, params);
    const total = countResult[0]?.count || 0;

    return {
      articles: articles || [],
      total,
    };
  } catch (error: any) {
    console.error('❌ getNewsArticles error:', error?.message, error?.code);
    throw error;
  }
}

// Get news article by ID
export async function getNewsArticleById(id: number): Promise<NewsArticle | null> {
  return await queryOne<NewsArticle>('SELECT * FROM news_articles WHERE id = ?', [id]);
}

// Get news article by slug
export async function getNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
  return await queryOne<NewsArticle>('SELECT * FROM news_articles WHERE slug = ?', [slug]);
}

// Create news article
export async function createNewsArticle(article: Omit<NewsArticle, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  try {
    const result = await query<{ insertId: number }>(
      `INSERT INTO news_articles (title, slug, subtitle, featured_image, excerpt, content, cta_text, cta_link, \`order\`, active, publish_status, publish_date, author, meta_title, meta_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        article.title,
        article.slug,
        article.subtitle || null,
        article.featured_image || null,
        article.excerpt || null,
        article.content || null,
        article.cta_text || null,
        article.cta_link || null,
        article.order || 0,
        article.active !== undefined ? (article.active ? 1 : 0) : 1, // Convert boolean to 0/1 for MySQL
        article.publish_status || 'draft',
        article.publish_date ? new Date(article.publish_date) : null,
        article.author || null,
        article.meta_title || null,
        article.meta_description || null,
      ]
    );
    return result[0]?.insertId || 0;
  } catch (error: any) {
    console.error('Error in createNewsArticle:', error);
    console.error('Article data:', JSON.stringify(article, null, 2));
    throw error;
  }
}

// Update news article
export async function updateNewsArticle(id: number, article: Partial<Omit<NewsArticle, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(article).forEach(([key, value]) => {
    if (value !== undefined) {
      const dbKey = key === 'order' ? '`order`' : key;
      fields.push(`${dbKey} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return false;

  values.push(id);
  await query(`UPDATE news_articles SET ${fields.join(', ')} WHERE id = ?`, values);
  return true;
}

// Delete news article
export async function deleteNewsArticle(id: number): Promise<boolean> {
  await query('DELETE FROM news_articles WHERE id = ?', [id]);
  return true;
}


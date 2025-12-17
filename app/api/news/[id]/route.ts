import { NextRequest, NextResponse } from 'next/server';
import { getNewsArticleById, updateNewsArticle, deleteNewsArticle } from '@/lib/db/repositories/news';

// GET /api/news/[id] - Get a single news article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id);

    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const article = await getNewsArticleById(articleId);

    if (!article) {
      return NextResponse.json({ error: 'News article not found' }, { status: 404 });
    }

    // Transform database fields to frontend format
    const transformedArticle = {
      id: String(article.id),
      title: article.title || '',
      slug: article.slug || '',
      subtitle: article.subtitle || '',
      featuredImage: article.featured_image || '',
      excerpt: article.excerpt || '',
      content: article.content || '',
      ctaText: article.cta_text || '',
      ctaLink: article.cta_link || '',
      order: article.order || 0,
      active: Boolean(article.active),
      publishStatus: article.publish_status || 'draft',
      publishDate: article.publish_date ? new Date(article.publish_date).toISOString() : null,
      author: article.author || '',
      metaTitle: article.meta_title || '',
      metaDescription: article.meta_description || '',
      createdAt: article.created_at ? new Date(article.created_at).toISOString() : new Date().toISOString(),
      updatedAt: article.updated_at ? new Date(article.updated_at).toISOString() : new Date().toISOString(),
    };

    return NextResponse.json({ data: transformedArticle });
  } catch (error) {
    console.error('Error fetching news article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news article' },
      { status: 500 }
    );
  }
}

// PATCH /api/news/[id] - Update a news article
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id);

    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      subtitle,
      featuredImage,
      excerpt,
      content,
      ctaText,
      ctaLink,
      order,
      active,
      publishStatus,
      publishDate,
      author,
      metaTitle,
      metaDescription,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (featuredImage !== undefined) updateData.featured_image = featuredImage;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (ctaText !== undefined) updateData.cta_text = ctaText;
    if (ctaLink !== undefined) updateData.cta_link = ctaLink;
    if (order !== undefined) updateData.order = order;
    if (active !== undefined) updateData.active = active;
    if (publishStatus !== undefined) updateData.publish_status = publishStatus;
    if (publishDate !== undefined) updateData.publish_date = publishDate ? new Date(publishDate) : null;
    if (author !== undefined) updateData.author = author;
    if (metaTitle !== undefined) updateData.meta_title = metaTitle;
    if (metaDescription !== undefined) updateData.meta_description = metaDescription;

    await updateNewsArticle(articleId, updateData);

    const updatedArticle = await getNewsArticleById(articleId);
    if (!updatedArticle) {
      return NextResponse.json({ error: 'Failed to retrieve updated article' }, { status: 500 });
    }

    // Transform database fields to frontend format
    const transformedArticle = {
      id: String(updatedArticle.id),
      title: updatedArticle.title || '',
      slug: updatedArticle.slug || '',
      subtitle: updatedArticle.subtitle || '',
      featuredImage: updatedArticle.featured_image || '',
      excerpt: updatedArticle.excerpt || '',
      content: updatedArticle.content || '',
      ctaText: updatedArticle.cta_text || '',
      ctaLink: updatedArticle.cta_link || '',
      order: updatedArticle.order || 0,
      active: updatedArticle.active === 1 || updatedArticle.active === true,
      publishStatus: updatedArticle.publish_status || 'draft',
      publishDate: updatedArticle.publish_date ? new Date(updatedArticle.publish_date).toISOString() : null,
      author: updatedArticle.author || '',
      metaTitle: updatedArticle.meta_title || '',
      metaDescription: updatedArticle.meta_description || '',
      createdAt: updatedArticle.created_at ? new Date(updatedArticle.created_at).toISOString() : new Date().toISOString(),
      updatedAt: updatedArticle.updated_at ? new Date(updatedArticle.updated_at).toISOString() : new Date().toISOString(),
    };

    return NextResponse.json({ data: transformedArticle });
  } catch (error) {
    console.error('Error updating news article:', error);
    return NextResponse.json(
      { error: 'Failed to update news article' },
      { status: 500 }
    );
  }
}

// DELETE /api/news/[id] - Delete a news article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id);

    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    await deleteNewsArticle(articleId);

    return NextResponse.json({ success: true, message: 'News article deleted successfully' });
  } catch (error) {
    console.error('Error deleting news article:', error);
    return NextResponse.json(
      { error: 'Failed to delete news article' },
      { status: 500 }
    );
  }
}


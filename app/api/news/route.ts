import { NextRequest, NextResponse } from 'next/server';
import { getNewsArticles, createNewsArticle } from '@/lib/db/repositories/news';

// GET /api/news - List all news articles
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
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
    
    const publishStatus = searchParams.get('publishStatus') || undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const search = searchParams.get('search') || undefined;

    const { articles, total } = await getNewsArticles(page, pageSize, {
      publishStatus,
      activeOnly,
      search,
    });

    console.log('📰 getNewsArticles returned:', articles?.length || 0, 'articles');

    // Transform database fields to frontend format
    const transformedArticles = articles.map((article: any) => ({
      id: String(article.id || ''),
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
    }));

    return NextResponse.json({
      data: transformedArticles,
      total,
      page,
      pageSize,
    });
  } catch (error: any) {
    console.error('Error fetching news articles:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch news articles',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/news - Create a new news article
export async function POST(request: NextRequest) {
  try {
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
      order = 0,
      active = true,
      publishStatus = 'draft',
      publishDate,
      author,
      metaTitle,
      metaDescription,
    } = body;

    const articleId = await createNewsArticle({
      title,
      slug,
      subtitle,
      featured_image: featuredImage,
      excerpt,
      content,
      cta_text: ctaText,
      cta_link: ctaLink,
      order,
      active,
      publish_status: publishStatus,
      publish_date: publishDate ? new Date(publishDate) : null,
      author,
      meta_title: metaTitle,
      meta_description: metaDescription,
    });

    const { getNewsArticleById } = await import('@/lib/db/repositories/news');
    const article = await getNewsArticleById(articleId);
    if (!article) {
      return NextResponse.json(
        { error: 'Failed to retrieve created article' },
        { status: 500 }
      );
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

    return NextResponse.json({ data: transformedArticle }, { status: 201 });
  } catch (error) {
    console.error('Error creating news article:', error);
    return NextResponse.json(
      { error: 'Failed to create news article' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getPages, createPage } from '@/lib/db/repositories/pages';

// GET /api/pages - List all pages
export async function GET(request: NextRequest) {
  try {
    const pages = await getPages();

    // Transform to frontend format
    const transformedPages = pages.map((page) => ({
      id: String(page.id),
      title: page.title,
      slug: page.slug,
      status: page.status,
      seoTitle: page.seo_title || null,
      seoDescription: page.seo_description || null,
      createdAt: page.created_at ? new Date(page.created_at).toISOString() : new Date().toISOString(),
      updatedAt: page.updated_at ? new Date(page.updated_at).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      data: transformedPages,
      total: transformedPages.length,
    });
  } catch (error: any) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages', details: error?.message },
      { status: 500 }
    );
  }
}

// POST /api/pages - Create a new page
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError?.message || String(parseError) },
        { status: 400 }
      );
    }

    const {
      title,
      slug,
      status = 'draft',
      seoTitle,
      seoDescription,
    } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    let pageId: number;
    try {
      pageId = await createPage({
        title,
        slug,
        status,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
      });
    } catch (dbError: any) {
      console.error('Database error creating page:', dbError);
      console.error('Database error details:', {
        message: dbError?.message,
        code: dbError?.code,
        sqlState: dbError?.sqlState,
        sqlMessage: dbError?.sqlMessage,
        errno: dbError?.errno,
        sql: dbError?.sql,
      });
      
      // Check if it's a table doesn't exist error
      if (dbError?.code === 'ER_NO_SUCH_TABLE' || dbError?.message?.includes("doesn't exist")) {
        return NextResponse.json(
          { 
            error: 'Pages table does not exist. Please run the migration first.',
            details: 'Visit /api/pages/migrate-schema to create the required tables.',
            code: 'MIGRATION_REQUIRED'
          },
          { status: 500 }
        );
      }

      // Check for duplicate entry (unique constraint violation)
      if (dbError?.code === 'ER_DUP_ENTRY' || dbError?.errno === 1062) {
        return NextResponse.json(
          { 
            error: 'A page with this slug already exists',
            details: dbError?.sqlMessage || 'Duplicate entry',
            code: 'DUPLICATE_SLUG'
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to create page', 
          details: dbError?.message || dbError?.sqlMessage || String(dbError),
          code: dbError?.code || 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

    if (!pageId || pageId === 0) {
      console.error('createPage returned invalid ID:', pageId);
      return NextResponse.json(
        { error: 'Failed to create page', details: 'No page ID returned from database' },
        { status: 500 }
      );
    }

    let page;
    try {
      const { getPageById } = await import('@/lib/db/repositories/pages');
      page = await getPageById(pageId);
    } catch (fetchError: any) {
      console.error('Error fetching created page:', fetchError);
      return NextResponse.json(
        { 
          error: 'Page created but failed to retrieve it', 
          details: fetchError?.message || String(fetchError),
          pageId: String(pageId)
        },
        { status: 500 }
      );
    }

    if (!page) {
      console.error('getPageById returned null for ID:', pageId);
      return NextResponse.json(
        { error: 'Failed to retrieve created page', details: `Page with ID ${pageId} not found` },
        { status: 500 }
      );
    }

    // Transform to frontend format
    const transformedPage = {
      id: String(page.id),
      title: page.title,
      slug: page.slug,
      status: page.status,
      seoTitle: page.seo_title || null,
      seoDescription: page.seo_description || null,
      createdAt: page.created_at ? new Date(page.created_at).toISOString() : new Date().toISOString(),
      updatedAt: page.updated_at ? new Date(page.updated_at).toISOString() : new Date().toISOString(),
    };

    return NextResponse.json({ data: transformedPage }, { status: 201 });
  } catch (error: any) {
    console.error('Unexpected error creating page:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { 
        error: 'Failed to create page', 
        details: error?.message || String(error) 
      },
      { status: 500 }
    );
  }
}


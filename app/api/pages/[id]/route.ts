import { NextRequest, NextResponse } from 'next/server';
import { getPageById, updatePage, deletePage } from '@/lib/db/repositories/pages';

// GET /api/pages/[id] - Get a single page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pageId = parseInt(id);

    if (isNaN(pageId)) {
      return NextResponse.json(
        { error: 'Invalid page ID' },
        { status: 400 }
      );
    }

    const page = await getPageById(pageId);

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
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

    return NextResponse.json({ data: transformedPage });
  } catch (error: any) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH /api/pages/[id] - Update a page
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pageId = parseInt(id);

    if (isNaN(pageId)) {
      return NextResponse.json(
        { error: 'Invalid page ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      slug,
      status,
      seoTitle,
      seoDescription,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (status !== undefined) updateData.status = status;
    if (seoTitle !== undefined) updateData.seo_title = seoTitle;
    if (seoDescription !== undefined) updateData.seo_description = seoDescription;

    await updatePage(pageId, updateData);

    const updatedPage = await getPageById(pageId);

    if (!updatedPage) {
      return NextResponse.json(
        { error: 'Page not found after update' },
        { status: 404 }
      );
    }

    // Transform to frontend format
    const transformedPage = {
      id: String(updatedPage.id),
      title: updatedPage.title,
      slug: updatedPage.slug,
      status: updatedPage.status,
      seoTitle: updatedPage.seo_title || null,
      seoDescription: updatedPage.seo_description || null,
      createdAt: updatedPage.created_at ? new Date(updatedPage.created_at).toISOString() : new Date().toISOString(),
      updatedAt: updatedPage.updated_at ? new Date(updatedPage.updated_at).toISOString() : new Date().toISOString(),
    };

    return NextResponse.json({ data: transformedPage });
  } catch (error: any) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE /api/pages/[id] - Delete a page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pageId = parseInt(id);

    if (isNaN(pageId)) {
      return NextResponse.json(
        { error: 'Invalid page ID' },
        { status: 400 }
      );
    }

    await deletePage(pageId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page', details: error?.message },
      { status: 500 }
    );
  }
}


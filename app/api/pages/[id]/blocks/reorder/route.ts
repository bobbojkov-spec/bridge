import { NextRequest, NextResponse } from 'next/server';
import { reorderPageBlocks, getPageBlocks, getPageById } from '@/lib/db/repositories/pages';

// PATCH /api/pages/[id]/blocks/reorder - Reorder blocks
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

    // Verify page exists
    const page = await getPageById(pageId);
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { blockIds } = body;

    if (!Array.isArray(blockIds)) {
      return NextResponse.json(
        { error: 'blockIds must be an array' },
        { status: 400 }
      );
    }

    // Update positions based on array order
    const positionUpdates = blockIds.map((blockId: string, index: number) => ({
      id: parseInt(blockId),
      position: index,
    }));

    await reorderPageBlocks(positionUpdates);

    // Return updated blocks
    const updatedBlocks = await getPageBlocks(pageId);
    const transformedBlocks = updatedBlocks.map((block) => ({
      id: String(block.id),
      pageId: String(block.page_id),
      type: block.type,
      position: block.position,
      data: typeof block.data === 'string' ? JSON.parse(block.data) : block.data,
      enabled: Boolean(block.enabled),
      createdAt: block.created_at ? new Date(block.created_at).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: transformedBlocks,
    });
  } catch (error: any) {
    console.error('Error reordering page blocks:', error);
    return NextResponse.json(
      { error: 'Failed to reorder blocks', details: error?.message },
      { status: 500 }
    );
  }
}


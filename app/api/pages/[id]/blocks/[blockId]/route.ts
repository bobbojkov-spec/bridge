import { NextRequest, NextResponse } from 'next/server';
import { deletePageBlock } from '@/lib/db/repositories/pages';
import { getPageById } from '@/lib/db/repositories/pages';

// DELETE /api/pages/[id]/blocks/[blockId] - Delete a block
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  try {
    const { id, blockId } = await params;
    const pageId = parseInt(id);
    const blockIdNum = parseInt(blockId);

    if (isNaN(pageId) || isNaN(blockIdNum)) {
      return NextResponse.json(
        { error: 'Invalid page ID or block ID' },
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

    await deletePageBlock(blockIdNum);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting page block:', error);
    return NextResponse.json(
      { error: 'Failed to delete page block', details: error?.message },
      { status: 500 }
    );
  }
}


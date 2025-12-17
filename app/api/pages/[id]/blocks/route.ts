import { NextRequest, NextResponse } from 'next/server';
import { getPageBlocks, createPageBlock, updatePageBlock, deletePageBlock, reorderPageBlocks } from '@/lib/db/repositories/pages';
import { getPageById } from '@/lib/db/repositories/pages';

// GET /api/pages/[id]/blocks - Get all blocks for a page
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

    // Verify page exists
    const page = await getPageById(pageId);
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    const blocks = await getPageBlocks(pageId);

    // Transform to frontend format
    const transformedBlocks = blocks.map((block) => ({
      id: String(block.id),
      pageId: String(block.page_id),
      type: block.type,
      position: block.position,
      data: typeof block.data === 'string' ? JSON.parse(block.data) : block.data,
      enabled: Boolean(block.enabled),
      createdAt: block.created_at ? new Date(block.created_at).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      data: transformedBlocks,
      total: transformedBlocks.length,
    });
  } catch (error: any) {
    console.error('Error fetching page blocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page blocks', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH /api/pages/[id]/blocks - Reorder and update blocks
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
    const { blocks, reorder } = body;

    // Handle reordering
    if (reorder && Array.isArray(reorder)) {
      const positionUpdates = reorder.map((blockId: string, index: number) => ({
        id: parseInt(blockId),
        position: index,
      }));
      await reorderPageBlocks(positionUpdates);
    }

    // Handle block updates
    if (blocks && Array.isArray(blocks)) {
      for (const blockUpdate of blocks) {
        const blockId = parseInt(blockUpdate.id);
        if (isNaN(blockId)) continue;

        const updateData: any = {};
        if (blockUpdate.type !== undefined) updateData.type = blockUpdate.type;
        if (blockUpdate.position !== undefined) updateData.position = blockUpdate.position;
        if (blockUpdate.data !== undefined) updateData.data = blockUpdate.data;
        if (blockUpdate.enabled !== undefined) updateData.enabled = blockUpdate.enabled;

        if (Object.keys(updateData).length > 0) {
          await updatePageBlock(blockId, updateData);
        }
      }
    }

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
      data: transformedBlocks,
      total: transformedBlocks.length,
    });
  } catch (error: any) {
    console.error('Error updating page blocks:', error);
    return NextResponse.json(
      { error: 'Failed to update page blocks', details: error?.message },
      { status: 500 }
    );
  }
}

// POST /api/pages/[id]/blocks - Create a new block
export async function POST(
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
    const {
      type,
      position,
      data,
      enabled = true,
    } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      );
    }

    // Get current max position if position not provided
    let blockPosition = position;
    if (blockPosition === undefined) {
      const existingBlocks = await getPageBlocks(pageId);
      blockPosition = existingBlocks.length > 0 
        ? Math.max(...existingBlocks.map((b: any) => b.position)) + 1 
        : 0;
    }

    const blockId = await createPageBlock({
      page_id: pageId,
      type,
      position: blockPosition,
      data,
      enabled,
    });

    const allBlocks = await getPageBlocks(pageId);
    const newBlock = allBlocks.find(b => b.id === blockId);

    if (!newBlock) {
      return NextResponse.json(
        { error: 'Failed to retrieve created block' },
        { status: 500 }
      );
    }

    // Transform to frontend format
    const transformedBlock = {
      id: String(newBlock.id),
      pageId: String(newBlock.page_id),
      type: newBlock.type,
      position: newBlock.position,
      data: typeof newBlock.data === 'string' ? JSON.parse(newBlock.data) : newBlock.data,
      enabled: Boolean(newBlock.enabled),
      createdAt: newBlock.created_at ? new Date(newBlock.created_at).toISOString() : new Date().toISOString(),
    };

    return NextResponse.json({ data: transformedBlock }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating page block:', error);
    return NextResponse.json(
      { error: 'Failed to create page block', details: error?.message },
      { status: 500 }
    );
  }
}


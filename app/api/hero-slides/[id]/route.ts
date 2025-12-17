import { NextRequest, NextResponse } from 'next/server';
import { getHeroSlideById, updateHeroSlide, deleteHeroSlide } from '@/lib/db/repositories/hero-slides';

// GET /api/hero-slides/[id] - Get a single hero slide
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const slideId = parseInt(id);

    if (isNaN(slideId)) {
      return NextResponse.json({ error: 'Invalid slide ID' }, { status: 400 });
    }

    const slide = await getHeroSlideById(slideId);

    if (!slide) {
      return NextResponse.json({ error: 'Hero slide not found' }, { status: 404 });
    }

    // Transform database fields to frontend format
    const transformedSlide = {
      id: String(slide.id),
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      backgroundImage: slide.background_image || '',
      ctaText: slide.cta_text || '',
      ctaLink: slide.cta_link || '',
      order: slide.order || 0,
      active: Boolean(slide.active),
      createdAt: slide.created_at ? new Date(slide.created_at).toISOString() : new Date().toISOString(),
      updatedAt: slide.updated_at ? new Date(slide.updated_at).toISOString() : new Date().toISOString(),
    };

    return NextResponse.json({ data: transformedSlide });
  } catch (error) {
    console.error('Error fetching hero slide:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero slide' },
      { status: 500 }
    );
  }
}

// PATCH /api/hero-slides/[id] - Update a hero slide
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const slideId = parseInt(id);

    if (isNaN(slideId)) {
      return NextResponse.json({ error: 'Invalid slide ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      description,
      backgroundImage,
      ctaText,
      ctaLink,
      order,
      active,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (description !== undefined) updateData.description = description;
    if (backgroundImage !== undefined) updateData.background_image = backgroundImage;
    if (ctaText !== undefined) updateData.cta_text = ctaText;
    if (ctaLink !== undefined) updateData.cta_link = ctaLink;
    if (order !== undefined) updateData.order = order;
    if (active !== undefined) updateData.active = active;

    await updateHeroSlide(slideId, updateData);

    const updatedSlide = await getHeroSlideById(slideId);
    if (!updatedSlide) {
      return NextResponse.json({ error: 'Failed to retrieve updated slide' }, { status: 500 });
    }

    // Transform database fields to frontend format
    const transformedSlide = {
      id: String(updatedSlide.id),
      title: updatedSlide.title || '',
      subtitle: updatedSlide.subtitle || '',
      description: updatedSlide.description || '',
      backgroundImage: updatedSlide.background_image || '',
      ctaText: updatedSlide.cta_text || '',
      ctaLink: updatedSlide.cta_link || '',
      order: updatedSlide.order || 0,
      active: updatedSlide.active === 1 || updatedSlide.active === true,
      createdAt: updatedSlide.created_at ? new Date(updatedSlide.created_at).toISOString() : new Date().toISOString(),
      updatedAt: updatedSlide.updated_at ? new Date(updatedSlide.updated_at).toISOString() : new Date().toISOString(),
    };

    return NextResponse.json({ data: transformedSlide });
  } catch (error) {
    console.error('Error updating hero slide:', error);
    return NextResponse.json(
      { error: 'Failed to update hero slide' },
      { status: 500 }
    );
  }
}

// DELETE /api/hero-slides/[id] - Delete a hero slide
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const slideId = parseInt(id);

    if (isNaN(slideId)) {
      return NextResponse.json({ error: 'Invalid slide ID' }, { status: 400 });
    }

    await deleteHeroSlide(slideId);

    return NextResponse.json({ success: true, message: 'Hero slide deleted successfully' });
  } catch (error) {
    console.error('Error deleting hero slide:', error);
    return NextResponse.json(
      { error: 'Failed to delete hero slide' },
      { status: 500 }
    );
  }
}


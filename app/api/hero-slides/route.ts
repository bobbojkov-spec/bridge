import { NextRequest, NextResponse } from 'next/server';
import { getHeroSlides, createHeroSlide, getHeroSlideById } from '@/lib/db/repositories/hero-slides';

// GET /api/hero-slides - List all hero slides
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const slides = await getHeroSlides(activeOnly);

    // Transform database fields to frontend format
    const transformedSlides = slides.map((slide: any) => ({
      id: String(slide.id || ''),
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      backgroundImage: slide.background_image || '',
      ctaText: slide.cta_text || '',
      ctaLink: slide.cta_link || '',
      order: slide.order || 0,
      active: slide.active === 1 || slide.active === true,
      createdAt: slide.created_at ? new Date(slide.created_at).toISOString() : new Date().toISOString(),
      updatedAt: slide.updated_at ? new Date(slide.updated_at).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      data: transformedSlides,
      total: transformedSlides.length,
    });
  } catch (error: any) {
    console.error('Error fetching hero slides:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch hero slides',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/hero-slides - Create a new hero slide
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      subtitle,
      description,
      backgroundImage,
      ctaText,
      ctaLink,
      order = 0,
      active = true,
    } = body;

    const slideId = await createHeroSlide({
      title,
      subtitle,
      description,
      background_image: backgroundImage,
      cta_text: ctaText,
      cta_link: ctaLink,
      order,
      active,
    });

    const slide = await getHeroSlideById(slideId);
    if (!slide) {
      return NextResponse.json(
        { error: 'Failed to retrieve created slide' },
        { status: 500 }
      );
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
      active: slide.active === 1 || slide.active === true,
      createdAt: slide.created_at ? new Date(slide.created_at).toISOString() : new Date().toISOString(),
      updatedAt: slide.updated_at ? new Date(slide.updated_at).toISOString() : new Date().toISOString(),
    };

    return NextResponse.json({ data: transformedSlide }, { status: 201 });
  } catch (error) {
    console.error('Error creating hero slide:', error);
    return NextResponse.json(
      { error: 'Failed to create hero slide' },
      { status: 500 }
    );
  }
}


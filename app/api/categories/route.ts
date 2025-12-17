import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory, getCategoryById } from '@/lib/db/repositories/categories';

// GET /api/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const categories = await getCategories(activeOnly);

    // Transform to match frontend format
    const transformedCategories = categories.map((category) => ({
      id: String(category.id),
      name: category.name,
      slug: category.slug,
      description: category.description || null,
      image: category.image || null,
      parentId: category.parent_id ? String(category.parent_id) : null,
      order: category.order,
      active: Boolean(category.active),
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    }));

    return NextResponse.json({
      data: transformedCategories,
      total: transformedCategories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      image,
      parentId,
      order = 0,
      active = true,
    } = body;

    const categoryId = await createCategory({
      name,
      slug,
      description,
      image,
      parent_id: parentId || null,
      order,
      active,
    });

    const category = await getCategoryById(categoryId);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found after creation' },
        { status: 500 }
      );
    }

    // Transform to match frontend format
    const transformedCategory = {
      id: String(category.id),
      name: category.name,
      slug: category.slug,
      description: category.description || null,
      image: category.image || null,
      parentId: category.parent_id ? String(category.parent_id) : null,
      order: category.order,
      active: Boolean(category.active),
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };

    return NextResponse.json({ data: transformedCategory }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}


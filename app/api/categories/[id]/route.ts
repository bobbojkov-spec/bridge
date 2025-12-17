import { NextRequest, NextResponse } from 'next/server';
import { getCategoryById, updateCategory, deleteCategory } from '@/lib/db/repositories/categories';

// GET /api/categories/[id] - Get a single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const category = await getCategoryById(categoryId);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
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

    return NextResponse.json({ data: transformedCategory });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH /api/categories/[id] - Update a category
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      image,
      parentId,
      order,
      active,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (parentId !== undefined) updateData.parent_id = parentId ? parseInt(parentId) : null;
    if (order !== undefined) updateData.order = parseInt(String(order)) || 0;
    if (active !== undefined) updateData.active = active ? 1 : 0;

    await updateCategory(categoryId, updateData);

    const updatedCategory = await getCategoryById(categoryId);

    if (!updatedCategory) {
      return NextResponse.json(
        { error: 'Category not found after update' },
        { status: 404 }
      );
    }

    // Transform to match frontend format
    const transformedCategory = {
      id: String(updatedCategory.id),
      name: updatedCategory.name,
      slug: updatedCategory.slug,
      description: updatedCategory.description || null,
      image: updatedCategory.image || null,
      parentId: updatedCategory.parent_id ? String(updatedCategory.parent_id) : null,
      order: updatedCategory.order,
      active: Boolean(updatedCategory.active),
      createdAt: updatedCategory.created_at,
      updatedAt: updatedCategory.updated_at,
    };

    return NextResponse.json({ data: transformedCategory });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    await deleteCategory(categoryId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category', details: error?.message },
      { status: 500 }
    );
  }
}


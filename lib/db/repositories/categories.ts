import { query, queryOne } from '../connection';
import { Category } from '../models';

// Get all categories
export async function getCategories(activeOnly: boolean = false): Promise<Category[]> {
  const sql = activeOnly
    ? 'SELECT * FROM categories WHERE active = TRUE ORDER BY `order` ASC, name ASC'
    : 'SELECT * FROM categories ORDER BY `order` ASC, name ASC';
  return await query<Category>(sql);
}

// Get category by ID
export async function getCategoryById(id: number): Promise<Category | null> {
  return await queryOne<Category>('SELECT * FROM categories WHERE id = ?', [id]);
}

// Get category by slug
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return await queryOne<Category>('SELECT * FROM categories WHERE slug = ?', [slug]);
}

// Get child categories
export async function getChildCategories(parentId: number): Promise<Category[]> {
  return await query<Category>(
    'SELECT * FROM categories WHERE parent_id = ? ORDER BY `order` ASC, name ASC',
    [parentId]
  );
}

// Create category
export async function createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO categories (name, slug, description, image, parent_id, \`order\`, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      category.name,
      category.slug,
      category.description,
      category.image,
      category.parent_id,
      category.order,
      category.active,
    ]
  );
  return result[0]?.insertId || 0;
}

// Update category
export async function updateCategory(id: number, category: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(category).forEach(([key, value]) => {
    if (value !== undefined) {
      const dbKey = key === 'order' ? '`order`' : key;
      fields.push(`${dbKey} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return false;

  values.push(id);
  await query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
  return true;
}

// Delete category
export async function deleteCategory(id: number): Promise<boolean> {
  await query('DELETE FROM categories WHERE id = ?', [id]);
  return true;
}


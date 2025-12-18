import { query, queryOne, insertAndGetId } from '../connection';
import { Product, ProductImage, ProductCategory, ProductTag, ProductAdditionalInfo } from '../models';

// Get all products with pagination - SIMPLIFIED VERSION
export async function getProducts(
  page: number = 1,
  pageSize: number = 10,
  filters?: { active?: boolean; categoryId?: number; search?: string }
): Promise<{ products: Product[]; total: number }> {
  // Build WHERE conditions
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.active !== undefined) {
    conditions.push('active = ?');
    params.push(filters.active); // PostgreSQL uses boolean, not 1/0
  }

  if (filters?.categoryId) {
    conditions.push(`id IN (SELECT product_id FROM product_categories WHERE category_id = ?)`);
    params.push(filters.categoryId);
  }

  if (filters?.search) {
    conditions.push('(name LIKE ? OR description LIKE ? OR sku LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Sanitize page and pageSize
  const sanitizedPage = Math.max(1, page);
  const sanitizedPageSize = Math.max(1, Math.min(100, pageSize));
  const offset = (sanitizedPage - 1) * sanitizedPageSize;
  
  // Get products with LIMIT and OFFSET (using string interpolation, not parameterized)
  // Sort alphabetically by name (case-insensitive for consistent ordering)
  const productsQuery = `SELECT * FROM products ${whereSQL} ORDER BY LOWER(name) ASC, name ASC LIMIT ${sanitizedPageSize} OFFSET ${offset}`;
  const products = await query<Product>(productsQuery, params);

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM products ${whereSQL}`;
  const countResult = await query<{ count: string | number }>(countQuery, params);
  const total = typeof countResult[0]?.count === 'string' 
    ? parseInt(countResult[0].count, 10) 
    : (countResult[0]?.count || 0);

  return {
    products,
    total,
  };
}

// Get product by ID
export async function getProductById(id: number): Promise<Product | null> {
  const result = await query<Product>('SELECT * FROM products WHERE id = ?', [id]);
  return result[0] || null;
}

// Get product by slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const result = await query<Product>('SELECT * FROM products WHERE slug = ?', [slug]);
  return result[0] || null;
}

// Get product images
export async function getProductImages(productId: number): Promise<ProductImage[]> {
  return await query<ProductImage>(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY "order" ASC',
    [productId]
  );
}

// Get product categories
export async function getProductCategories(productId: number): Promise<number[]> {
  const result = await query<{ category_id: number }>(
    'SELECT category_id FROM product_categories WHERE product_id = ?',
    [productId]
  );
  return result.map(r => r.category_id);
}

// Get product tags
export async function getProductTags(productId: number): Promise<string[]> {
  const result = await query<{ tag: string }>(
    'SELECT tag FROM product_tags WHERE product_id = ?',
    [productId]
  );
  return result.map(r => r.tag);
}

// Get product additional info
export async function getProductAdditionalInfo(productId: number): Promise<ProductAdditionalInfo | null> {
  const result = await query<ProductAdditionalInfo>(
    'SELECT * FROM product_additional_info WHERE product_id = ?',
    [productId]
  );
  return result[0] || null;
}

// Create product
export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const productId = await insertAndGetId(
    `INSERT INTO products (name, slug, sku, description, price, currency, stock_quantity, active, meta_title, meta_description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.name,
      product.slug,
      product.sku,
      product.description,
      product.price,
      product.currency,
      product.stock_quantity,
      product.active, // PostgreSQL uses boolean
      product.meta_title,
      product.meta_description,
    ]
  );
  return productId;
}

// Update product
export async function updateProduct(id: number, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(product).forEach(([key, value]) => {
    if (value !== undefined) {
      // PostgreSQL uses boolean, not int
        fields.push(`${key} = ?`);
        values.push(value);
    }
  });

  if (fields.length === 0) return false;

  values.push(id);
  await query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
  return true;
}

// Delete product
export async function deleteProduct(id: number): Promise<boolean> {
  await query('DELETE FROM products WHERE id = ?', [id]);
  return true;
}

// Set product images (replace all)
export async function setProductImages(productId: number, images: string[]): Promise<void> {
  // Delete existing
  await query('DELETE FROM product_images WHERE product_id = ?', [productId]);
  
  // Insert new ones
  if (images.length > 0) {
    for (let i = 0; i < images.length; i++) {
      await query(
        'INSERT INTO product_images (product_id, image_url, `order`) VALUES (?, ?, ?)',
        [productId, images[i], i]
      );
    }
  }
}

// Set product categories
export async function setProductCategories(productId: number, categoryIds: number[]): Promise<void> {
  await query('DELETE FROM product_categories WHERE product_id = ?', [productId]);
  if (categoryIds.length > 0) {
    for (const catId of categoryIds) {
      await query(
        'INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)',
        [productId, catId]
      );
    }
  }
}

// Set product tags
export async function setProductTags(productId: number, tags: string[]): Promise<void> {
  await query('DELETE FROM product_tags WHERE product_id = ?', [productId]);
  if (tags.length > 0) {
    for (const tag of tags) {
      await query(
        'INSERT INTO product_tags (product_id, tag) VALUES (?, ?)',
        [productId, tag]
      );
    }
  }
}

// Set product additional info
export async function setProductAdditionalInfo(
  productId: number,
  info: {
    weight?: string | null;
    dimensions?: string | null;
    material?: string | null;
    care_instructions?: string | null;
  }
): Promise<void> {
  await query('DELETE FROM product_additional_info WHERE product_id = ?', [productId]);
  
  if (info.weight !== undefined || info.dimensions !== undefined || info.material !== undefined || info.care_instructions !== undefined) {
    await query(
      `INSERT INTO product_additional_info (product_id, weight, dimensions, material, care_instructions)
       VALUES (?, ?, ?, ?, ?)`,
      [
        productId,
        info.weight || null,
        info.dimensions || null,
        info.material || null,
        info.care_instructions || null,
      ]
    );
  }
}

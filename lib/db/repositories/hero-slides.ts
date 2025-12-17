import { query, queryOne } from '../connection';
import { HeroSlide } from '../models';

// Get all hero slides
export async function getHeroSlides(activeOnly: boolean = false): Promise<HeroSlide[]> {
  try {
    const sql = activeOnly
      ? 'SELECT * FROM hero_slides WHERE active = TRUE ORDER BY `order` ASC'
      : 'SELECT * FROM hero_slides ORDER BY `order` ASC';
    const result = await query<HeroSlide>(sql);
    console.log('📊 getHeroSlides result:', result?.length || 0, 'slides');
    return result || [];
  } catch (error: any) {
    console.error('❌ getHeroSlides error:', error?.message, error?.code);
    throw error;
  }
}

// Get hero slide by ID
export async function getHeroSlideById(id: number): Promise<HeroSlide | null> {
  return await queryOne<HeroSlide>('SELECT * FROM hero_slides WHERE id = ?', [id]);
}

// Create hero slide
export async function createHeroSlide(slide: Omit<HeroSlide, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const connection = await import('../connection').then(m => m.getConnection());
  try {
    const [result] = await connection.execute(
      `INSERT INTO hero_slides (title, subtitle, description, background_image, cta_text, cta_link, \`order\`, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slide.title,
        slide.subtitle,
        slide.description,
        slide.background_image,
        slide.cta_text,
        slide.cta_link,
        slide.order,
        slide.active,
      ]
    ) as any;
    return result?.insertId || 0;
  } finally {
    connection.release();
  }
}

// Update hero slide
export async function updateHeroSlide(id: number, slide: Partial<Omit<HeroSlide, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(slide).forEach(([key, value]) => {
    if (value !== undefined) {
      const dbKey = key === 'order' ? '`order`' : key;
      fields.push(`${dbKey} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return false;

  values.push(id);
  await query(`UPDATE hero_slides SET ${fields.join(', ')} WHERE id = ?`, values);
  return true;
}

// Delete hero slide
export async function deleteHeroSlide(id: number): Promise<boolean> {
  await query('DELETE FROM hero_slides WHERE id = ?', [id]);
  return true;
}


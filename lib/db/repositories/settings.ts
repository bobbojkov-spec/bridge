import { query, queryOne } from '../connection';
import { SiteSettings } from '../models';

// Get site settings (always returns the first/only row)
export async function getSiteSettings(): Promise<SiteSettings | null> {
  return await queryOne<SiteSettings>('SELECT * FROM site_settings WHERE id = 1');
}

// Update site settings
export async function updateSiteSettings(settings: Partial<Omit<SiteSettings, 'id' | 'updated_at'>>): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(settings).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return false;

  values.push(1); // Always update id = 1
  await query(`UPDATE site_settings SET ${fields.join(', ')} WHERE id = ?`, values);
  return true;
}


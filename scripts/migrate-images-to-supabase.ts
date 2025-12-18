/**
 * Migrate Images from Filesystem to Supabase Storage
 * 
 * This script:
 * 1. Scans /public/uploads/images/ for all images
 * 2. Uploads them to Supabase Storage
 * 3. Updates database paths to use Supabase URLs
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { uploadToStorage, STORAGE_BUCKETS } from '@/lib/supabase/client';
import { query } from '@/lib/db/connection';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

interface ImageFile {
  path: string;
  localPath: string;
  bucket: string;
  size: number;
}

async function scanUploadDirectory(): Promise<ImageFile[]> {
  const uploadBase = join(process.cwd(), 'public', 'uploads', 'images');
  const images: ImageFile[] = [];

  const sizes = ['original', 'large', 'medium', 'thumb'];
  
  for (const size of sizes) {
    const sizeDir = join(uploadBase, size);
    if (!existsSync(sizeDir)) continue;

    try {
      const files = await readdir(sizeDir);
      for (const file of files) {
        if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;
        
        const localPath = join(sizeDir, file);
        const stats = await stat(localPath);
        
        // Determine bucket based on filename patterns
        let bucket = STORAGE_BUCKETS.MEDIA_LIBRARY;
        if (file.includes('product') || file.includes('hero') || file.includes('news')) {
          // We'll check database to determine exact bucket
          bucket = STORAGE_BUCKETS.MEDIA_LIBRARY;
        }

        images.push({
          path: `${size}/${file}`,
          localPath,
          bucket,
          size: stats.size,
        });
      }
    } catch (error: any) {
      console.error(`Error scanning ${size}:`, error.message);
    }
  }

  return images;
}

async function determineBucketForImage(localPath: string): Promise<string> {
  const filename = localPath.split('/').pop() || '';
  
  // Check product_images table
  const productImages = await query(
    `SELECT product_id FROM product_images WHERE image_url LIKE $1 LIMIT 1`,
    [`%${filename}%`]
  );
  if (productImages.length > 0) {
    return STORAGE_BUCKETS.PRODUCT_IMAGES;
  }

  // Check hero_slides
  const heroSlides = await query(
    `SELECT id FROM hero_slides WHERE background_image LIKE $1 LIMIT 1`,
    [`%${filename}%`]
  );
  if (heroSlides.length > 0) {
    return STORAGE_BUCKETS.HERO_SLIDES;
  }

  // Check news_articles
  const newsArticles = await query(
    `SELECT id FROM news_articles WHERE image_url LIKE $1 LIMIT 1`,
    [`%${filename}%`]
  );
  if (newsArticles.length > 0) {
    return STORAGE_BUCKETS.NEWS_IMAGES;
  }

  // Default to media library
  return STORAGE_BUCKETS.MEDIA_LIBRARY;
}

async function migrateImage(image: ImageFile): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Determine correct bucket
    const bucket = await determineBucketForImage(image.localPath);
    
    // Read file
    const buffer = await readFile(image.localPath);
    
    // Determine content type
    const ext = image.path.split('.').pop()?.toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : 
                        ext === 'webp' ? 'image/webp' : 
                        'image/jpeg';
    
    // Upload to Supabase Storage
    const { url } = await uploadToStorage(
      bucket,
      image.path,
      buffer,
      { contentType, upsert: true }
    );

    return { success: true, url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function updateDatabasePaths(oldPath: string, newUrl: string): Promise<void> {
  // Update product_images
  await query(
    `UPDATE product_images SET image_url = $1 WHERE image_url = $2`,
    [newUrl, oldPath]
  );

  // Update media_files
  await query(
    `UPDATE media_files SET url = $1 WHERE url = $2`,
    [newUrl, oldPath]
  );
  await query(
    `UPDATE media_files SET url_large = $1 WHERE url_large = $2`,
    [newUrl, oldPath]
  );
  await query(
    `UPDATE media_files SET url_medium = $1 WHERE url_medium = $2`,
    [newUrl, oldPath]
  );
  await query(
    `UPDATE media_files SET url_thumb = $1 WHERE url_thumb = $2`,
    [newUrl, oldPath]
  );

  // Update hero_slides
  await query(
    `UPDATE hero_slides SET background_image = $1 WHERE background_image = $2`,
    [newUrl, oldPath]
  );

  // Update news_articles
  await query(
    `UPDATE news_articles SET image_url = $1 WHERE image_url = $2`,
    [newUrl, oldPath]
  );
}

async function main() {
  console.log('🚀 Starting Image Migration to Supabase Storage\n');
  
  // Scan for images
  console.log('📦 Scanning upload directory...');
  const images = await scanUploadDirectory();
  console.log(`   Found ${images.length} images to migrate\n`);

  if (images.length === 0) {
    console.log('✅ No images to migrate');
    return;
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  // Migrate each image
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const oldPath = `/uploads/images/${image.path}`;
    
    process.stdout.write(`\r   Progress: ${i + 1}/${images.length} (${success} success, ${failed} failed)`);
    
    const result = await migrateImage(image);
    
    if (result.success && result.url) {
      // Update database
      await updateDatabasePaths(oldPath, result.url);
      success++;
    } else {
      failed++;
      errors.push(`${image.path}: ${result.error}`);
    }
  }

  console.log(`\n\n✅ Migration complete!`);
  console.log(`   Success: ${success}`);
  console.log(`   Failed: ${failed}`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors:`);
    errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more`);
    }
  }
}

main().catch(console.error);


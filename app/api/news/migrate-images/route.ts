import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { NewsArticle } from '@/lib/db/models';
import { processImage } from '@/lib/media/processor';
import { createMediaFile } from '@/lib/db/repositories/media';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

// POST /api/news/migrate-images - Migrate all news article images to new media system
export async function POST(request: NextRequest) {
  try {
    // Get all news articles
    const newsArticles = await query<NewsArticle>(
      `SELECT id, title, featured_image FROM news_articles`
    );

    if (!newsArticles || newsArticles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No news articles found. Please create articles first or use "Generate Initial Articles" button.',
        processed: 0,
        skipped: 0,
        failed: 0,
      });
    }

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const article of newsArticles) {
      try {
        const imageUrl = article.featured_image;
        
        if (!imageUrl) {
          results.skipped++;
          continue;
        }
        
        // Skip if already in media_files (starts with /uploads/images/original/)
        if (imageUrl.startsWith('/uploads/images/original/')) {
          results.skipped++;
          continue;
        }

        // Find the largest version of this image
        const largestImagePath = await findLargestImageVersion(imageUrl);
        
        if (!largestImagePath || !existsSync(largestImagePath)) {
          results.failed++;
          results.errors.push(`Image not found: ${imageUrl} (News Article ${article.id}: ${article.title})`);
          console.error(`Could not find image: ${imageUrl}`);
          continue;
        }

        console.log(`Found image: ${imageUrl} -> ${largestImagePath}`);

        // Read the image file
        const buffer = await readFile(largestImagePath);
        
        // Get mime type from file
        const metadata = await sharp(buffer).metadata();
        const mimeType = metadata.format === 'jpeg' ? 'image/jpeg' :
                        metadata.format === 'png' ? 'image/png' :
                        metadata.format === 'webp' ? 'image/webp' :
                        'image/jpeg';

        // Generate unique filename
        const timestamp = Date.now();
        const originalFilename = imageUrl.split('/').pop() || `news-article-${article.id}.jpg`;
        const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `${timestamp}_${sanitizedFilename}`;

        // Process image (no crop, just resize)
        const processed = await processImage(buffer, uniqueFilename, mimeType);

        // Create media file entry
        const mediaId = await createMediaFile({
          filename: uniqueFilename,
          url: processed.original.url,
          url_large: processed.large?.url || null,
          url_medium: processed.medium?.url || null,
          url_thumb: processed.thumb?.url || null,
          mime_type: mimeType,
          size: processed.original.size,
          width: processed.original.width,
          height: processed.original.height,
          alt_text: article.title || null,
          caption: null,
        });

        // Update news_article to point to new media file
        await query(
          `UPDATE news_articles SET featured_image = ? WHERE id = ?`,
          [processed.original.url, article.id]
        );

        results.processed++;
      } catch (error: any) {
        results.failed++;
        const errorMsg = `News Article ${article.id} (${article.title}): ${error.message || String(error)}`;
        results.errors.push(errorMsg);
        console.error(`Error processing news article ${article.id}:`, error);
        console.error(`Image URL: ${article.featured_image}`);
        console.error(`Error stack:`, error.stack);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} images, ${results.skipped} skipped (already migrated or no image), ${results.failed} failed`,
      processed: results.processed,
      skipped: results.skipped,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('Error migrating news article images:', error);
    return NextResponse.json(
      {
        error: 'Failed to migrate news article images',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Find the largest version of an image by checking various size suffixes
 */
async function findLargestImageVersion(imageUrl: string): Promise<string | null> {
  // Remove leading slash if present
  const cleanUrl = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
  
  // Try multiple path variations
  const pathVariations = [
    cleanUrl, // Original path (e.g., images/blog-1s-413x647.jpg)
    join('public', cleanUrl), // With public prefix (e.g., public/images/blog-1s-413x647.jpg)
    cleanUrl.replace(/^public\//, ''), // Remove public if present
  ];

  // First, try exact path matches
  for (const pathVar of pathVariations) {
    const basePath = join(process.cwd(), pathVar);
    if (existsSync(basePath)) {
      console.log(`Found exact match: ${basePath}`);
      return basePath;
    }
  }
  
  // Also try with just the file name in public/images
  const directFile = cleanUrl.split('/').pop();
  if (directFile) {
    const directPath = join(process.cwd(), 'public', 'images', directFile);
    if (existsSync(directPath)) {
      console.log(`Found direct match: ${directPath}`);
      return directPath;
    }
  }

  // Extract base file name (without size suffix) for pattern matching
  const urlParts = cleanUrl.split('/');
  const extractedFileName = urlParts[urlParts.length - 1];
  
  // Try to find base file name (remove size suffixes like -300x300, -800x800, etc.)
  const fileNameMatch = extractedFileName.match(/^(.+?)(?:-\d+x\d+)*(\.(jpg|jpeg|png|webp))$/i);
  if (!fileNameMatch) {
    // If no match, try the file name as-is
    const dirPath = urlParts.slice(0, -1).join('/');
    const dirOptions = [
      dirPath,
      join('public', dirPath),
      dirPath.replace(/^public\//, ''),
    ];
    
    for (const dirOption of dirOptions) {
      const fullDirPath = join(process.cwd(), dirOption);
      const fullFilePath = join(fullDirPath, extractedFileName);
      if (existsSync(fullDirPath) && existsSync(fullFilePath)) {
        return fullFilePath;
      }
    }
    return null;
  }

  const nameBase = fileNameMatch[1];
  const fileExtension = fileNameMatch[2];
  const dirPath = urlParts.slice(0, -1).join('/');
  
  // Try multiple directory variations
  const dirOptions = [
    dirPath,
    join('public', dirPath),
    dirPath.replace(/^public\//, ''),
  ];

  // Find all versions of this image
  const sizeSuffixes = [
    '', // Original (no suffix)
    '-1920x1920',
    '-1024x1024',
    '-800x800',
    '-413x647',
    '-400x400',
    '-300x300',
    '-150x150',
  ];

  let largestPath: string | null = null;
  let largestSize = 0;

  for (const dirOption of dirOptions) {
    const fullDirPath = join(process.cwd(), dirOption);
    
    if (!existsSync(fullDirPath)) {
      continue;
    }

    for (const sizeSuffix of sizeSuffixes) {
      const testFileName = `${nameBase}${sizeSuffix}${fileExtension}`;
      const testFilePath = join(fullDirPath, testFileName);
      
      if (existsSync(testFilePath)) {
        try {
          const fileStats = await stat(testFilePath);
          if (fileStats.size > largestSize) {
            largestSize = fileStats.size;
            largestPath = testFilePath;
          }
        } catch (error) {
          // Continue to next file
        }
      }
    }
    
    // If we found a file, break (don't check other directory variations)
    if (largestPath) {
      break;
    }
  }

  return largestPath;
}


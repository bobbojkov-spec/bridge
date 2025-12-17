/**
 * Image Processing Utility
 * Handles image resizing and optimization using Sharp
 */

import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { IMAGE_SIZES, UPLOAD_DIRS, ImageSizeConfig } from './config';

export interface ProcessedImageResult {
  original: {
    path: string;
    url: string;
    width: number;
    height: number;
    size: number;
  };
  large?: {
    path: string;
    url: string;
    width: number;
    height: number;
    size: number;
  };
  medium?: {
    path: string;
    url: string;
    width: number;
    height: number;
    size: number;
  };
  thumb?: {
    path: string;
    url: string;
    width: number;
    height: number;
    size: number;
  };
}

/**
 * Process and save image in multiple sizes
 */
export async function processImage(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ProcessedImageResult> {
  // Ensure directories exist
  await ensureDirectories();

  // Get image metadata
  const metadata = await sharp(buffer).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  // Generate base filename (without extension)
  const baseFilename = filename.replace(/\.[^/.]+$/, '');
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';

  const results: ProcessedImageResult = {
    original: {
      path: '',
      url: '',
      width: originalWidth,
      height: originalHeight,
      size: 0,
    },
  };

  // Process original (save as-is)
  const originalPath = join(process.cwd(), UPLOAD_DIRS.original, filename);
  await writeFile(originalPath, buffer);
  results.original = {
    path: originalPath,
    url: `/uploads/images/original/${filename}`,
    width: originalWidth,
    height: originalHeight,
    size: buffer.length,
  };

  // Process large size
  if (IMAGE_SIZES.large.width > 0) {
    const largeBuffer = await resizeImage(buffer, IMAGE_SIZES.large, mimeType);
    const largeFilename = `${baseFilename}_large.${extension}`;
    const largePath = join(process.cwd(), UPLOAD_DIRS.large, largeFilename);
    await writeFile(largePath, largeBuffer);
    const largeMetadata = await sharp(largeBuffer).metadata();
    results.large = {
      path: largePath,
      url: `/uploads/images/large/${largeFilename}`,
      width: largeMetadata.width || IMAGE_SIZES.large.width,
      height: largeMetadata.height || IMAGE_SIZES.large.height,
      size: largeBuffer.length,
    };
  }

  // Process medium size - always 500px on short side
  if (IMAGE_SIZES.medium.shortSide > 0) {
    const shortSide = Math.min(originalWidth, originalHeight);
    let mediumWidth = originalWidth;
    let mediumHeight = originalHeight;
    
    if (shortSide > IMAGE_SIZES.medium.shortSide) {
      // Calculate dimensions to make short side 500px
      const ratio = IMAGE_SIZES.medium.shortSide / shortSide;
      mediumWidth = Math.round(originalWidth * ratio);
      mediumHeight = Math.round(originalHeight * ratio);
    }
    
    const mediumBuffer = await resizeImageToDimensions(
      buffer,
      mediumWidth,
      mediumHeight,
      IMAGE_SIZES.medium.quality,
      mimeType
    );
    const mediumFilename = `${baseFilename}_medium.${extension}`;
    const mediumPath = join(process.cwd(), UPLOAD_DIRS.medium, mediumFilename);
    await writeFile(mediumPath, mediumBuffer);
    const mediumMetadata = await sharp(mediumBuffer).metadata();
    results.medium = {
      path: mediumPath,
      url: `/uploads/images/medium/${mediumFilename}`,
      width: mediumMetadata.width || mediumWidth,
      height: mediumMetadata.height || mediumHeight,
      size: mediumBuffer.length,
    };
  }

  // Process thumbnail size
  if (IMAGE_SIZES.thumb.width > 0) {
    const thumbBuffer = await resizeImage(buffer, IMAGE_SIZES.thumb, mimeType);
    const thumbFilename = `${baseFilename}_thumb.${extension}`;
    const thumbPath = join(process.cwd(), UPLOAD_DIRS.thumb, thumbFilename);
    await writeFile(thumbPath, thumbBuffer);
    const thumbMetadata = await sharp(thumbBuffer).metadata();
    results.thumb = {
      path: thumbPath,
      url: `/uploads/images/thumb/${thumbFilename}`,
      width: thumbMetadata.width || IMAGE_SIZES.thumb.width,
      height: thumbMetadata.height || IMAGE_SIZES.thumb.height,
      size: thumbBuffer.length,
    };
  }

  return results;
}

/**
 * Resize image to specified dimensions
 */
async function resizeImage(
  buffer: Buffer,
  config: ImageSizeConfig,
  mimeType: string
): Promise<Buffer> {
  let sharpInstance = sharp(buffer);

  // Resize if dimensions are specified
  if (config.width > 0 && config.height > 0) {
    sharpInstance = sharpInstance.resize(config.width, config.height, {
      fit: 'inside', // Maintain aspect ratio, fit within dimensions
      withoutEnlargement: true, // Don't enlarge if image is smaller
    });
  }

  // Apply quality based on format
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    sharpInstance = sharpInstance.jpeg({ quality: config.quality });
  } else if (mimeType === 'image/png') {
    sharpInstance = sharpInstance.png({ quality: config.quality });
  } else if (mimeType === 'image/webp') {
    sharpInstance = sharpInstance.webp({ quality: config.quality });
  }

  return await sharpInstance.toBuffer();
}

/**
 * Resize image to exact dimensions (for medium size with short side logic)
 */
async function resizeImageToDimensions(
  buffer: Buffer,
  width: number,
  height: number,
  quality: number,
  mimeType: string
): Promise<Buffer> {
  let sharpInstance = sharp(buffer).resize(width, height, {
    fit: 'inside', // Maintain aspect ratio
    withoutEnlargement: false, // Allow resizing to exact dimensions
  });

  // Apply quality based on format
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    sharpInstance = sharpInstance.jpeg({ quality });
  } else if (mimeType === 'image/png') {
    sharpInstance = sharpInstance.png({ quality });
  } else if (mimeType === 'image/webp') {
    sharpInstance = sharpInstance.webp({ quality });
  }

  return await sharpInstance.toBuffer();
}

/**
 * Ensure all upload directories exist
 */
async function ensureDirectories(): Promise<void> {
  const dirs = [
    UPLOAD_DIRS.base,
    UPLOAD_DIRS.original,
    UPLOAD_DIRS.large,
    UPLOAD_DIRS.medium,
    UPLOAD_DIRS.thumb,
  ];

  for (const dir of dirs) {
    const fullPath = join(process.cwd(), dir);
    if (!existsSync(fullPath)) {
      await mkdir(fullPath, { recursive: true });
    }
  }
}


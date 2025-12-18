/**
 * Image Processing Utility for Supabase Storage
 * Processes images with Sharp and uploads to Supabase Storage
 */

import sharp from 'sharp';
import { IMAGE_SIZES, ImageSizeConfig } from './config';
import { uploadToStorage, STORAGE_BUCKETS } from '@/lib/supabase/client';

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
 * Process image and upload to Supabase Storage
 */
export async function processImageToSupabase(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  bucket: string = STORAGE_BUCKETS.MEDIA_LIBRARY
): Promise<ProcessedImageResult> {
  try {
    console.log('🖼️ Processing image:', { filename, mimeType, bucket, bufferSize: buffer.length });
    
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    console.log('📐 Image metadata:', { originalWidth, originalHeight, format: metadata.format });

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

    // Upload original
    const originalPath = `original/${filename}`;
    console.log('📤 Uploading original to:', `${bucket}/${originalPath}`);
    const { url: originalUrl } = await uploadToStorage(
      bucket,
      originalPath,
      buffer,
      { contentType: mimeType, upsert: true }
    );
    console.log('✅ Original uploaded:', originalUrl);
    results.original = {
      path: originalPath,
      url: originalUrl,
      width: originalWidth,
      height: originalHeight,
      size: buffer.length,
    };

    // Process and upload large size
    if (IMAGE_SIZES.large.width > 0) {
      console.log('📤 Processing large size...');
      const largeBuffer = await resizeImage(buffer, IMAGE_SIZES.large, mimeType);
      const largeFilename = `${baseFilename}_large.${extension}`;
      const largePath = `large/${largeFilename}`;
      const { url: largeUrl } = await uploadToStorage(
        bucket,
        largePath,
        largeBuffer,
        { contentType: mimeType, upsert: true }
      );
      const largeMetadata = await sharp(largeBuffer).metadata();
      results.large = {
        path: largePath,
        url: largeUrl,
        width: largeMetadata.width || IMAGE_SIZES.large.width,
        height: largeMetadata.height || IMAGE_SIZES.large.height,
        size: largeBuffer.length,
      };
    }

    // Process and upload medium size
    if (IMAGE_SIZES.medium.shortSide > 0) {
      console.log('📤 Processing medium size...');
      const shortSide = Math.min(originalWidth, originalHeight);
      let mediumWidth = originalWidth;
      let mediumHeight = originalHeight;
      
      if (shortSide > IMAGE_SIZES.medium.shortSide) {
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
      const mediumPath = `medium/${mediumFilename}`;
      const { url: mediumUrl } = await uploadToStorage(
        bucket,
        mediumPath,
        mediumBuffer,
        { contentType: mimeType, upsert: true }
      );
      const mediumMetadata = await sharp(mediumBuffer).metadata();
      results.medium = {
        path: mediumPath,
        url: mediumUrl,
        width: mediumMetadata.width || mediumWidth,
        height: mediumMetadata.height || mediumHeight,
        size: mediumBuffer.length,
      };
    }

    // Process and upload thumbnail size
    if (IMAGE_SIZES.thumb.width > 0) {
      console.log('📤 Processing thumb size...');
      const thumbBuffer = await resizeImage(buffer, IMAGE_SIZES.thumb, mimeType);
      const thumbFilename = `${baseFilename}_thumb.${extension}`;
      const thumbPath = `thumb/${thumbFilename}`;
      const { url: thumbUrl } = await uploadToStorage(
        bucket,
        thumbPath,
        thumbBuffer,
        { contentType: mimeType, upsert: true }
      );
      const thumbMetadata = await sharp(thumbBuffer).metadata();
      results.thumb = {
        path: thumbPath,
        url: thumbUrl,
        width: thumbMetadata.width || IMAGE_SIZES.thumb.width,
        height: thumbMetadata.height || IMAGE_SIZES.thumb.height,
        size: thumbBuffer.length,
      };
    }

    console.log('✅ Image processing complete');
    return results;
  } catch (error) {
    console.error('❌ Error in processImageToSupabase:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      filename,
      mimeType,
      bucket,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
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

  if (config.width > 0 && config.height > 0) {
    sharpInstance = sharpInstance.resize(config.width, config.height, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

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
 * Resize image to exact dimensions
 */
async function resizeImageToDimensions(
  buffer: Buffer,
  width: number,
  height: number,
  quality: number,
  mimeType: string
): Promise<Buffer> {
  let sharpInstance = sharp(buffer).resize(width, height, {
    fit: 'inside',
    withoutEnlargement: false,
  });

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    sharpInstance = sharpInstance.jpeg({ quality });
  } else if (mimeType === 'image/png') {
    sharpInstance = sharpInstance.png({ quality });
  } else if (mimeType === 'image/webp') {
    sharpInstance = sharpInstance.webp({ quality });
  }

  return await sharpInstance.toBuffer();
}


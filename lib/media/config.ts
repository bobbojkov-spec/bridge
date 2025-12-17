/**
 * Media Library Configuration
 * Centralized configuration for image sizes and processing
 */

export interface ImageSizeConfig {
  width: number;
  height: number;
  quality: number;
}

export interface MediumSizeConfig {
  shortSide: number;
  quality: number;
}

export const IMAGE_SIZES = {
  original: {
    width: 0, // 0 means keep original dimensions
    height: 0,
    quality: 100,
  },
  large: {
    width: 1920,
    height: 1920,
    quality: 90,
  },
  medium: {
    shortSide: 500, // Always 500px on the short side
    quality: 85,
  } as MediumSizeConfig,
  thumb: {
    width: 300,
    height: 300,
    quality: 80,
  },
} as const;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Crop configuration
export const CROP_CONFIG = {
  enabled: true, // Enable crop by default
  aspectRatio: null as number | null, // null = free aspect, or set like 16/9, 4/3, 1/1, etc.
  minWidth: 300,
  minHeight: 300,
} as const;

export const UPLOAD_DIRS = {
  base: 'public/uploads/images',
  original: 'public/uploads/images/original',
  large: 'public/uploads/images/large',
  medium: 'public/uploads/images/medium',
  thumb: 'public/uploads/images/thumb',
} as const;


/**
 * Supabase Client for Storage Operations
 * Uses service role key for server-side operations (bypasses RLS)
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and keys from environment
// Try multiple sources for URL (can extract from POSTGRES_URL if needed)
function getSupabaseUrl(): string {
  // First try explicit env var
  if (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
  }
  
  // Try to extract from POSTGRES_URL (format: postgresql://postgres.xxx@aws-0-region.pooler.supabase.com)
  const postgresUrl = process.env.POSTGRES_URL;
  if (postgresUrl) {
    try {
      // Try pooler format first
      const poolerMatch = postgresUrl.match(/@aws-[^-]+-([^.]+)\.pooler\.supabase\.com/);
      if (poolerMatch) {
        return `https://${poolerMatch[1]}.supabase.co`;
      }
      // Try direct format
      const directMatch = postgresUrl.match(/@([^.]+\.supabase\.co)/);
      if (directMatch) {
        return `https://${directMatch[1]}`;
      }
    } catch (e) {
      // Fall through
    }
  }
  
  throw new Error('Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_URL, or ensure POSTGRES_URL contains Supabase hostname');
}

// Lazy initialization function - call this to get the client
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    try {
      const supabaseUrl = getSupabaseUrl();
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      console.log('🔧 Initializing Supabase client:', {
        url: supabaseUrl ? '✅ Set' : '❌ Missing',
        serviceKey: supabaseServiceKey ? '✅ Set' : '❌ Missing',
        serviceKeyLength: supabaseServiceKey?.length || 0,
      });

      if (!supabaseServiceKey) {
        throw new Error('Missing Supabase Service Role Key. Set SUPABASE_SERVICE_ROLE_KEY in environment variables. Get it from: Supabase Dashboard → Settings → API → Service Role Key');
      }

      // Create Supabase client with service role key (for server-side operations)
      // Service role key bypasses Row Level Security (RLS)
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      console.log('✅ Supabase client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      throw error;
    }
  }
  return supabaseClient;
}

// Export getter function for direct access
export function getSupabase() {
  return getSupabaseClient();
}

// Export as object for backward compatibility (but prefer getSupabase() in new code)
export const supabase = {
  get storage() {
    return getSupabaseClient().storage;
  },
  get auth() {
    return getSupabaseClient().auth;
  },
  // Add other properties as needed
} as ReturnType<typeof createClient>;

// Storage bucket names
export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  MEDIA_LIBRARY: 'media-library',
  HERO_SLIDES: 'hero-slides',
  NEWS_IMAGES: 'news-images',
} as const;

/**
 * Upload file to Supabase Storage
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: Buffer | File | Blob,
  options?: {
    contentType?: string;
    upsert?: boolean;
  }
): Promise<{ url: string; path: string }> {
  try {
    console.log('📤 uploadToStorage called:', { bucket, path, contentType: options?.contentType, fileSize: file instanceof Buffer ? file.length : file instanceof File ? file.size : 'unknown' });
    
    const client = getSupabaseClient();
    console.log('✅ Client obtained, uploading...');
    
    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType,
        upsert: options?.upsert ?? false,
        cacheControl: '3600',
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw new Error(`Failed to upload to ${bucket}/${path}: ${error.message}`);
    }

    console.log('✅ Upload successful, getting public URL...');
    // Get public URL
    const { data: urlData } = client.storage.from(bucket).getPublicUrl(data.path);
    
    console.log('✅ Public URL obtained:', urlData.publicUrl);
    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('❌ Error in uploadToStorage:', error);
    throw error;
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromStorage(bucket: string, path: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.storage.from(bucket).remove([path]);
  
  if (error) {
    throw new Error(`Failed to delete ${bucket}/${path}: ${error.message}`);
  }
}

/**
 * Get public URL for a file in storage
 */
export function getPublicUrl(bucket: string, path: string): string {
  const client = getSupabaseClient();
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}


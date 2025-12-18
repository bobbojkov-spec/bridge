/**
 * Test Supabase Storage Connection and Buckets
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST before importing Supabase client
config({ path: resolve(process.cwd(), '.env.local') });

// Now import after env vars are loaded
import { getSupabase, STORAGE_BUCKETS } from '@/lib/supabase/client';

const supabase = getSupabase();

async function main() {
  console.log('🧪 Testing Supabase Storage\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL not set');
    process.exit(1);
  }

  if (!serviceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
    console.error('   Get it from: Supabase Dashboard → Settings → API → Service Role Key');
    process.exit(1);
  }

  console.log('✅ Environment variables configured\n');

  // List buckets
  console.log('📦 Checking buckets...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError.message);
    process.exit(1);
  }

  const requiredBuckets = Object.values(STORAGE_BUCKETS);
  const existingBuckets = buckets.map(b => b.name);

  console.log(`   Found ${buckets.length} buckets`);
  console.log(`   Required: ${requiredBuckets.join(', ')}\n`);

  for (const bucketName of requiredBuckets) {
    const exists = existingBuckets.includes(bucketName);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${bucketName}`);
  }

  const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));
  
  if (missingBuckets.length > 0) {
    console.log(`\n⚠️  Missing buckets: ${missingBuckets.join(', ')}`);
    console.log('   Create them in: Supabase Dashboard → Storage → New bucket');
  } else {
    console.log('\n✅ All required buckets exist!');
  }

  // Test upload (small test image)
  console.log('\n🧪 Testing upload...');
  const testBucket = STORAGE_BUCKETS.MEDIA_LIBRARY;
  const testPath = 'test/test.png';
  
  // Create a minimal 1x1 PNG image
  const testImage = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(testBucket)
    .upload(testPath, testImage, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) {
    console.error('❌ Upload test failed:', uploadError.message);
  } else {
    console.log('✅ Upload test successful!');
    
    // Get public URL
    const { data: urlData } = supabase.storage.from(testBucket).getPublicUrl(testPath);
    console.log(`   Public URL: ${urlData.publicUrl}`);

    // Clean up test file
    await supabase.storage.from(testBucket).remove([testPath]);
    console.log('✅ Test file cleaned up');
  }

  console.log('\n🎉 Storage test complete!');
}

main().catch(console.error);


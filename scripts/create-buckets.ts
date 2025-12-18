/**
 * Create Supabase Storage Buckets
 * This script creates all required storage buckets
 */

import { getSupabase, STORAGE_BUCKETS } from '@/lib/supabase/client';

const supabase = getSupabase();
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('🚀 Creating Supabase Storage Buckets\n');

  const buckets = Object.entries(STORAGE_BUCKETS).map(([key, name]) => ({
    name,
    description: `${key.replace(/_/g, ' ').toLowerCase()} bucket`,
  }));

  for (const bucket of buckets) {
    console.log(`📦 Creating bucket: ${bucket.name}...`);
    
    const { data, error } = await supabase.storage.createBucket(bucket.name, {
      public: true, // Make bucket public so images can be accessed via URL
      fileSizeLimit: 10485760, // 10 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`   ✅ Already exists`);
      } else {
        console.error(`   ❌ Error: ${error.message}`);
      }
    } else {
      console.log(`   ✅ Created successfully`);
    }
  }

  console.log('\n🎉 Bucket creation complete!');
  console.log('\n📝 Next: Run test script to verify');
  console.log('   npx tsx scripts/test-supabase-storage.ts');
}

main().catch(console.error);


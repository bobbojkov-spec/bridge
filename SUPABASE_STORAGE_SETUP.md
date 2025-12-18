# Supabase Storage Migration Guide

## ✅ What's Done

1. ✅ Installed `@supabase/supabase-js`
2. ✅ Created Supabase client utility (`lib/supabase/client.ts`)
3. ✅ Created Supabase Storage processor (`lib/media/processor-supabase.ts`)
4. ✅ Updated media upload API to use Supabase Storage
5. ✅ Created migration script for existing images

## 📋 Setup Steps

### Step 1: Get Supabase Credentials

1. Go to **Supabase Dashboard → Settings → API**
2. Copy:
   - **Project URL** → `https://oohmahmtzfzpweswksuh.supabase.co`
   - **Service Role Key** (secret, under "Project API keys")

### Step 2: Add Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://oohmahmtzfzpweswksuh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**For Vercel**, add these in **Vercel Dashboard → Settings → Environment Variables**

### Step 3: Create Storage Buckets

Go to **Supabase Dashboard → Storage** and create:

1. **`product-images`** (Public: ✅ Yes)
2. **`media-library`** (Public: ✅ Yes)
3. **`hero-slides`** (Public: ✅ Yes)
4. **`news-images`** (Public: ✅ Yes)

For each bucket:
- **Public bucket**: ✅ Enable
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### Step 4: Set Bucket Policies (Optional)

Since we use Service Role Key, RLS is bypassed. But for public access, ensure buckets are public.

Go to each bucket → **Policies** → Add:

**Public Read Policy:**
```sql
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'bucket-name');
```

### Step 5: Test Storage Connection

```bash
npx tsx scripts/test-supabase-storage.ts
```

### Step 6: Migrate Existing Images

Once buckets are set up and test passes:

```bash
npx tsx scripts/migrate-images-to-supabase.ts
```

This will:
- Scan `/public/uploads/images/` (256 images found)
- Upload each to Supabase Storage
- Update database paths to use Supabase URLs

## 🎯 What Changed

### Upload Flow (New)
1. User uploads image → `/api/media`
2. Image processed with Sharp (resize, optimize)
3. **Uploaded to Supabase Storage** (not filesystem)
4. Database stores Supabase Storage URLs
5. Images served from Supabase CDN

### Image URLs (New Format)
- **Old**: `/uploads/images/original/filename.jpg`
- **New**: `https://[project].supabase.co/storage/v1/object/public/media-library/original/filename.jpg`

## ✅ Testing Checklist

- [ ] Storage buckets created
- [ ] Environment variables set
- [ ] Storage test passes
- [ ] Image upload works (media library)
- [ ] Product image upload works
- [ ] Images display correctly
- [ ] Migration script runs successfully
- [ ] All images migrated

## 🚀 Next Steps After Setup

1. Run migration script
2. Test image uploads
3. Verify images display
4. Deploy to Vercel
5. (Optional) Remove `/public/uploads/` directory after verifying everything works


# Supabase Storage Setup Guide

## Step 1: Create Storage Buckets

Go to your Supabase Dashboard → Storage and create these buckets:

### 1. `product-images`
- **Public bucket**: ✅ Yes (so images can be accessed via URL)
- **File size limit**: 10 MB
- **Allowed MIME types**: image/jpeg, image/png, image/webp

### 2. `media-library`
- **Public bucket**: ✅ Yes
- **File size limit**: 10 MB
- **Allowed MIME types**: image/jpeg, image/png, image/webp

### 3. `hero-slides`
- **Public bucket**: ✅ Yes
- **File size limit**: 10 MB
- **Allowed MIME types**: image/jpeg, image/png, image/webp

### 4. `news-images`
- **Public bucket**: ✅ Yes
- **File size limit**: 10 MB
- **Allowed MIME types**: image/jpeg, image/png, image/webp

## Step 2: Set Bucket Policies

For each bucket, go to **Policies** and add:

### Public Read Policy (for all buckets)
```sql
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'bucket-name');
```

### Authenticated Write Policy (for all buckets)
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'bucket-name' AND auth.role() = 'authenticated');
```

**Note**: Since we're using service role key, RLS is bypassed. But these policies ensure public read access.

## Step 3: Get Environment Variables

1. Go to **Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Service Role Key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

Add these to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://oohmahmtzfzpweswksuh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 4: Verify Setup

Run the test script:
```bash
npx tsx scripts/test-supabase-storage.ts
```


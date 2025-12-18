# Quick Start: Supabase Storage Setup

## 🚀 5-Minute Setup

### 1. Get Service Role Key
- Go to: **Supabase Dashboard → Settings → API**
- Copy **Service Role Key** (the secret one)

### 2. Add to `.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://oohmahmtzfzpweswksuh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Create Buckets in Supabase
Go to **Storage → New bucket** and create:
- `product-images` (Public: ✅)
- `media-library` (Public: ✅)
- `hero-slides` (Public: ✅)
- `news-images` (Public: ✅)

### 4. Test
```bash
npx tsx scripts/test-supabase-storage.ts
```

### 5. Migrate Existing Images
```bash
npx tsx scripts/migrate-images-to-supabase.ts
```

## ✅ Done!

New uploads will automatically go to Supabase Storage.
Images will be served from Supabase CDN (works on Vercel!).


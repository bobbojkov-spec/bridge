# Deploy to Vercel with Supabase

## Quick Deploy Steps

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Migrate to PostgreSQL and Supabase"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository: `bobbojkov-spec/bridge`
4. Vercel will auto-detect Next.js settings

**Option B: Via Vercel CLI**
```bash
npm i -g vercel
vercel
```

### 3. Add Environment Variables in Vercel

**Critical Step!** Add these in Vercel Dashboard → Settings → Environment Variables:

```
POSTGRES_URL=postgresql://postgres:zGEYLFqJHX504E3F@db.oohmahmtzfzpweswksuh.supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:zGEYLFqJHX504E3F@db.oohmahmtzfzpweswksuh.supabase.co:5432/postgres?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://postgres:zGEYLFqJHX504E3F@db.oohmahmtzfzpweswksuh.supabase.co:5432/postgres
```

**Important:**
- Add these for **Production**, **Preview**, and **Development** environments
- After adding, **redeploy** your project

### 4. Deploy!

After adding environment variables:
- Vercel will automatically redeploy, OR
- Go to Deployments → Click "Redeploy" on latest deployment

## Verify Deployment

1. Check Vercel deployment logs for any errors
2. Visit your deployed URL
3. Test `/admin/products` to verify Supabase connection

## Troubleshooting

**Database Connection Errors?**
- Verify environment variables are set correctly
- Check Supabase dashboard to ensure database is accessible
- Review Vercel deployment logs

**Build Errors?**
- Check Next.js build logs in Vercel
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation

## Your Supabase Connection String

```
postgresql://postgres:zGEYLFqJHX504E3F@db.oohmahmtzfzpweswksuh.supabase.co:5432/postgres
```

Make sure this is added to Vercel environment variables!


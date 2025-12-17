# PostgreSQL Setup Summary

## ✅ What's Been Done

1. **Installed PostgreSQL Client**
   - Added `@vercel/postgres` package
   - Compatible with Supabase and Vercel

2. **Created PostgreSQL Connection Module**
   - `lib/db/connection-pg.ts` - PostgreSQL-specific connection
   - `lib/db/connection.ts` - Updated to use PostgreSQL
   - Automatic MySQL → PostgreSQL syntax conversion

3. **Created Database Schema**
   - `scripts/postgres-schema.sql` - Complete PostgreSQL schema
   - Includes all tables, indexes, and triggers
   - Ready to run on Supabase

4. **Created Migration Tools**
   - `scripts/migrate-data.ts` - Data migration script
   - `scripts/migrate-mysql-to-postgres.md` - Detailed guide

5. **Updated Code**
   - All repositories work with PostgreSQL (automatic conversion)
   - Migration routes updated for PostgreSQL
   - Backward compatible where possible

## 🚀 Next Steps

### 1. Set Up Supabase (5 minutes)

1. Go to https://supabase.com and create account
2. Create new project
3. Wait for database provisioning
4. Go to **Settings** → **Database**
5. Copy connection string

### 2. Create Schema (2 minutes)

**In Supabase SQL Editor:**
```sql
-- Copy and paste contents of scripts/postgres-schema.sql
-- Click "Run"
```

### 3. Migrate Data (10-30 minutes)

**Option A: Using Script**
```bash
# Set environment variables
export MYSQL_HOST=localhost
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=bridge_db
export POSTGRES_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres

# Run migration
npx tsx scripts/migrate-data.ts
```

**Option B: Manual**
- Export from MySQL
- Import to Supabase using their import tool

### 4. Update Environment Variables

**Local (.env.local):**
```env
POSTGRES_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
```

**Vercel (Dashboard → Settings → Environment Variables):**
- Add the same three variables

### 5. Test Locally

```bash
npm run dev
```

Visit http://localhost:3000 and test your app.

### 6. Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

## 📋 Files Created/Modified

### New Files
- `lib/db/connection-pg.ts` - PostgreSQL connection
- `scripts/postgres-schema.sql` - Database schema
- `scripts/migrate-data.ts` - Data migration script
- `scripts/migrate-mysql-to-postgres.md` - Migration guide
- `MIGRATION_GUIDE.md` - Complete migration guide
- `POSTGRES_SETUP.md` - This file

### Modified Files
- `lib/db/connection.ts` - Now uses PostgreSQL
- `app/api/news/migrate-schema/route.ts` - Updated for PostgreSQL
- `package.json` - Added `@vercel/postgres`

## 🔧 How It Works

The connection module automatically converts:
- MySQL `?` placeholders → PostgreSQL `$1, $2, ...`
- MySQL `` `backticks` `` → PostgreSQL `"quotes"`
- MySQL `0/1` booleans → PostgreSQL `TRUE/FALSE`
- MySQL `insertId` → PostgreSQL `RETURNING id`

Your existing code continues to work without changes!

## ⚠️ Important Notes

1. **Test Thoroughly**: Test all functionality after migration
2. **Backup First**: Always backup your MySQL database before migration
3. **Environment Variables**: Make sure all environment variables are set correctly
4. **Connection Pooling**: Vercel Postgres uses connection pooling automatically

## 🆘 Troubleshooting

**Connection Issues?**
- Check connection string format
- Verify password (may need URL encoding)
- Check Supabase firewall settings

**Data Issues?**
- Verify schema was created correctly
- Check foreign key constraints
- Review migration logs

**Query Issues?**
- Check PostgreSQL logs in Supabase
- Review converted SQL queries
- Check for MySQL-specific syntax

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Ready to deploy!** 🚀


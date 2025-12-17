# Migration Guide: MySQL to PostgreSQL

## Overview

This guide will help you migrate your Bridge project from MySQL to PostgreSQL for deployment on **Supabase** and **Vercel**.

## Quick Start

### 1. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI format)

### 2. Create Database Schema

**Option A: Using Supabase SQL Editor (Recommended)**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `scripts/postgres-schema.sql`
3. Paste and run the script

**Option B: Using psql**
```bash
psql "your-supabase-connection-string" -f scripts/postgres-schema.sql
```

### 3. Migrate Your Data

**Option A: Using the Migration Script**
```bash
# Set MySQL environment variables
export MYSQL_HOST=localhost
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=bridge_db

# Set PostgreSQL connection (Supabase)
export POSTGRES_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres

# Run migration
npx tsx scripts/migrate-data.ts
```

**Option B: Manual Export/Import**
1. Export data from MySQL to CSV
2. Import CSV files into Supabase using their import tool

### 4. Update Environment Variables

Create `.env.local`:
```env
POSTGRES_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 5. Update Code (Already Done!)

The code has been updated to use PostgreSQL:
- ✅ `lib/db/connection.ts` - Now uses PostgreSQL
- ✅ `lib/db/connection-pg.ts` - PostgreSQL connection module
- ✅ All repositories work with PostgreSQL (automatic conversion)

### 6. Test Locally

```bash
npm run dev
```

Visit http://localhost:3000 and test your application.

### 7. Deploy to Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel Dashboard:
   - Go to **Settings** → **Environment Variables**
   - Add `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`
4. Deploy!

## What Changed?

### Database Connection
- **Before**: MySQL using `mysql2` package
- **After**: PostgreSQL using `@vercel/postgres` package

### SQL Syntax (Automatically Converted)
- **Placeholders**: `?` → `$1, $2, ...` (automatic)
- **Booleans**: `0/1` → `TRUE/FALSE` (automatic)
- **Backticks**: `` `column` `` → `"column"` (automatic)
- **INSERT ID**: `insertId` → `RETURNING id` (automatic)

### Files Modified
- `lib/db/connection.ts` - Now uses PostgreSQL
- `lib/db/connection-pg.ts` - New PostgreSQL connection module
- `package.json` - Added `@vercel/postgres` dependency

### Files Created
- `scripts/postgres-schema.sql` - PostgreSQL schema
- `scripts/migrate-data.ts` - Data migration script
- `scripts/migrate-mysql-to-postgres.md` - Detailed migration guide

## Troubleshooting

### Connection Issues

**Error: "Connection refused"**
- Check your Supabase connection string
- Verify your IP is whitelisted in Supabase
- Check firewall settings

**Error: "Authentication failed"**
- Verify your password in the connection string
- Check if password has special characters (may need URL encoding)

### Data Migration Issues

**Error: "Foreign key constraint violation"**
- Ensure tables are migrated in the correct order
- Check for orphaned records

**Error: "Column does not exist"**
- Verify schema was created correctly
- Check column names match (case-sensitive in PostgreSQL)

### Query Issues

**Error: "Syntax error"**
- Check if query uses MySQL-specific syntax
- Review converted SQL in logs

## Next Steps

1. ✅ Test all functionality locally
2. ✅ Verify data migration completed successfully
3. ✅ Deploy to Vercel
4. ✅ Monitor for any issues
5. ✅ Update documentation

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Review Vercel deployment logs
3. Check browser console for errors
4. Review PostgreSQL query logs

## Rollback Plan

If you need to rollback to MySQL:
1. Keep your MySQL database running
2. Revert `lib/db/connection.ts` to use MySQL
3. Reinstall `mysql2` package
4. Update environment variables

---

**Note**: The migration maintains backward compatibility where possible. Most code changes are handled automatically by the connection module.


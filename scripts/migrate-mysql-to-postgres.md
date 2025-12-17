# MySQL to PostgreSQL Migration Guide

This guide will help you migrate your Bridge project from MySQL to PostgreSQL for deployment on Supabase and Vercel.

## Prerequisites

1. **Supabase Account**: Sign up at https://supabase.com
2. **PostgreSQL Client**: Install `psql` or use Supabase's SQL Editor
3. **Node.js**: Ensure you have Node.js installed

## Step 1: Set Up Supabase Database

1. Create a new project in Supabase
2. Go to **Settings** → **Database**
3. Copy the **Connection string** (URI format)
4. Note your database password

## Step 2: Create PostgreSQL Schema

1. Open Supabase SQL Editor
2. Copy and paste the contents of `scripts/postgres-schema.sql`
3. Run the script to create all tables

Alternatively, use psql:
```bash
psql "your-supabase-connection-string" -f scripts/postgres-schema.sql
```

## Step 3: Export Data from MySQL

Run this script to export your MySQL data:

```bash
# Export all tables to CSV
mysqldump -u your_user -p your_database --skip-add-drop-table --no-create-info --tab=/tmp/mysql_export
```

Or use the Node.js migration script (see below).

## Step 4: Update Environment Variables

Create/update your `.env.local` file:

```env
# PostgreSQL (Supabase)
POSTGRES_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres

# For Vercel, add these in Vercel Dashboard → Settings → Environment Variables
```

## Step 5: Update Code to Use PostgreSQL

1. Replace `lib/db/connection.ts` imports with `lib/db/connection-pg.ts`
2. Update all repository files to use PostgreSQL connection
3. Test locally with your Supabase connection

## Step 6: Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Important Notes

### SQL Syntax Differences

- **Placeholders**: MySQL uses `?`, PostgreSQL uses `$1, $2, etc.` (handled automatically)
- **Booleans**: MySQL uses `0/1`, PostgreSQL uses `TRUE/FALSE` (handled automatically)
- **Backticks**: MySQL uses `` ` ``, PostgreSQL uses `"` (handled automatically)
- **AUTO_INCREMENT**: MySQL uses `AUTO_INCREMENT`, PostgreSQL uses `SERIAL`
- **INSERT ID**: MySQL returns `insertId`, PostgreSQL uses `RETURNING id`

### Data Type Mappings

- `TINYINT(1)` → `BOOLEAN`
- `INT` → `INTEGER` or `SERIAL`
- `VARCHAR(n)` → `VARCHAR(n)` (same)
- `TEXT` → `TEXT` (same)
- `DATETIME` → `TIMESTAMP`
- `DECIMAL(10,2)` → `DECIMAL(10,2)` (same)

## Troubleshooting

### Connection Issues
- Verify your Supabase connection string
- Check firewall settings
- Ensure IP is whitelisted in Supabase

### Data Migration Issues
- Check data types match
- Verify foreign key constraints
- Check for NULL values in NOT NULL columns

### Query Issues
- Review converted SQL queries
- Check PostgreSQL logs in Supabase dashboard


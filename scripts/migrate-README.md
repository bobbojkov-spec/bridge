# MySQL to PostgreSQL Migration Guide

## Quick Start

### 1. Set MySQL Connection Details

You need to provide your MySQL database credentials. You can either:

**Option A: Set environment variables**
```bash
export MYSQL_HOST=localhost
export MYSQL_USER=root
export MYSQL_PASSWORD=your_mysql_password
export MYSQL_DATABASE=bridge_db
```

**Option B: Edit the script directly** (if you prefer)
Edit `scripts/migrate-data.ts` and update the `mysqlConfig` object.

### 2. Verify PostgreSQL Connection

Make sure your `.env.local` file has the correct Supabase connection string:
```env
POSTGRES_URL=postgresql://postgres:[PASSWORD]@db.oohmahmtzfzpweswksuh.supabase.co:5432/postgres
```

### 3. Run the Migration

```bash
npx tsx scripts/migrate-data.ts
```

## What Gets Migrated?

The script migrates these tables in order (respecting foreign keys):
1. users
2. categories
3. products
4. product_images
5. product_categories
6. product_tags
7. product_additional_info
8. hero_slides
9. news_articles
10. pages
11. page_blocks
12. team_members
13. media_files
14. site_settings
15. orders
16. order_items

## Important Notes

- **Data Safety**: The script uses `ON CONFLICT DO NOTHING`, so it won't overwrite existing data
- **Foreign Keys**: Tables are migrated in the correct order to respect foreign key constraints
- **Booleans**: MySQL `0/1` values are automatically converted to PostgreSQL `TRUE/FALSE`
- **Dates**: Date values are converted to ISO format

## Troubleshooting

**MySQL Connection Failed?**
- Check your MySQL server is running
- Verify credentials are correct
- Check firewall/network settings

**PostgreSQL Connection Failed?**
- Verify `.env.local` has correct `POSTGRES_URL`
- Check Supabase dashboard to ensure database is accessible
- Verify password is correct (no spaces, URL-encoded if needed)

**Migration Errors?**
- Check if tables exist in Supabase (run the schema script first)
- Verify data types match between MySQL and PostgreSQL
- Check for NULL values in NOT NULL columns


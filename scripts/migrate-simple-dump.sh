#!/bin/bash

# Simple pg_dump + pg_restore migration
# Uses direct connection (session mode) as recommended by Supabase

set -e  # Exit on error

echo "🚀 Migration: Local PostgreSQL → Supabase"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep POSTGRES_URL | xargs)
fi

if [ -z "$POSTGRES_URL" ]; then
    echo "❌ POSTGRES_URL not found in .env.local"
    exit 1
fi

# PostgreSQL tools path
PG_DUMP="/opt/homebrew/Cellar/postgresql@16/16.11/bin/pg_dump"
PG_RESTORE="/opt/homebrew/Cellar/postgresql@16/16.11/bin/pg_restore"

if [ ! -f "$PG_DUMP" ]; then
    echo "❌ pg_dump not found at $PG_DUMP"
    exit 1
fi

# Local database
LOCAL_DB="bridge_db"
LOCAL_USER="${USER:-postgres}"
LOCAL_HOST="localhost"
LOCAL_PORT="5432"

# Parse Supabase URL
# Format: postgresql://user:password@host:port/database
SUPABASE_URL=$(echo "$POSTGRES_URL" | sed 's/?.*$//' | sed 's/sslmode=require//')

# Extract components
DB_USER=$(echo "$SUPABASE_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$SUPABASE_URL" | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST_PORT=$(echo "$SUPABASE_URL" | sed -n 's|postgresql://[^@]*@\([^/]*\).*|\1|p')
DB_NAME=$(echo "$SUPABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

DB_HOST=$(echo "$DB_HOST_PORT" | cut -d: -f1)
DB_PORT=$(echo "$DB_HOST_PORT" | cut -d: -f2)
DB_PORT=${DB_PORT:-5432}

echo "📦 Step 1: Dumping local database..."
echo "   Database: $LOCAL_DB"
echo ""

# Create dump
DUMP_FILE="/tmp/bridge-dump-$$.dump"
"$PG_DUMP" -Fc -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" -f "$DUMP_FILE"

DUMP_SIZE=$(stat -f%z "$DUMP_FILE" 2>/dev/null || stat -c%s "$DUMP_FILE" 2>/dev/null)
echo "✅ Dump complete! Size: $(echo "scale=2; $DUMP_SIZE/1024/1024" | bc) MB"
echo ""

echo "📤 Step 2: Restoring to Supabase..."
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT (direct connection - session mode)"
echo "   Database: $DB_NAME"
echo ""

# Restore with proper SSL and timeout settings
export PGPASSWORD="$DB_PASS"
"$PG_RESTORE" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --verbose \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    "$DUMP_FILE"

echo ""
echo "🧹 Cleaning up..."
rm -f "$DUMP_FILE"
echo "✅ Cleanup complete"
echo ""
echo "🎉 Migration completed successfully!"


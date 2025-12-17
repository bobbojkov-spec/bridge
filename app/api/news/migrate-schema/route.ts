import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

// GET /api/news/migrate-schema - Add missing columns to news_articles table
export async function GET(request: NextRequest) {
  try {
    // Check if columns already exist (PostgreSQL syntax)
    const columns = await query<any>(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'news_articles' 
       AND column_name IN ('subtitle', 'cta_text', 'cta_link', 'order', 'active')`
    );

    const existingColumns = Array.isArray(columns) 
      ? columns.map((col: any) => col.column_name)
      : [];
    const columnsToAdd = ['subtitle', 'cta_text', 'cta_link', 'order', 'active'].filter(
      (col) => !existingColumns.includes(col)
    );

    if (columnsToAdd.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Migration already completed. All columns exist.',
        existingColumns,
      });
    }

    // Add missing columns (PostgreSQL syntax - no AFTER clause)
    const alterStatements: string[] = [];
    
    if (columnsToAdd.includes('subtitle')) {
      alterStatements.push('ADD COLUMN IF NOT EXISTS subtitle VARCHAR(500)');
    }
    if (columnsToAdd.includes('cta_text')) {
      alterStatements.push('ADD COLUMN IF NOT EXISTS cta_text VARCHAR(200)');
    }
    if (columnsToAdd.includes('cta_link')) {
      alterStatements.push('ADD COLUMN IF NOT EXISTS cta_link VARCHAR(500)');
    }
    if (columnsToAdd.includes('order')) {
      alterStatements.push('ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0');
    }
    if (columnsToAdd.includes('active')) {
      alterStatements.push('ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE');
    }

    await query(`ALTER TABLE news_articles ${alterStatements.join(', ')}`);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      addedColumns: columnsToAdd,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Migration failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


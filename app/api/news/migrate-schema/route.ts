import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

// GET /api/news/migrate-schema - Add missing columns to news_articles table
export async function GET(request: NextRequest) {
  try {
    // Check if columns already exist
    const columns = await query<any>(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'news_articles' 
       AND COLUMN_NAME IN ('subtitle', 'cta_text', 'cta_link', 'order', 'active')`
    );

    const existingColumns = Array.isArray(columns) 
      ? columns.map((col: any) => col.COLUMN_NAME)
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

    // Add missing columns
    const alterStatements: string[] = [];
    
    if (columnsToAdd.includes('subtitle')) {
      alterStatements.push('ADD COLUMN `subtitle` VARCHAR(500) NULL AFTER `slug`');
    }
    if (columnsToAdd.includes('cta_text')) {
      alterStatements.push('ADD COLUMN `cta_text` VARCHAR(200) NULL AFTER `content`');
    }
    if (columnsToAdd.includes('cta_link')) {
      alterStatements.push('ADD COLUMN `cta_link` VARCHAR(500) NULL AFTER `cta_text`');
    }
    if (columnsToAdd.includes('order')) {
      alterStatements.push('ADD COLUMN `order` INT DEFAULT 0 AFTER `cta_link`');
    }
    if (columnsToAdd.includes('active')) {
      alterStatements.push('ADD COLUMN `active` TINYINT(1) DEFAULT 1 AFTER `order`');
    }

    await query(`ALTER TABLE \`news_articles\` ${alterStatements.join(', ')}`);

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


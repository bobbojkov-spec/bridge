import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

/**
 * Migration endpoint to add size variant columns to media_files table
 * GET /api/media/migrate - Run migration
 */
export async function GET(request: NextRequest) {
  try {
    // Check if columns already exist
    const columns = await query<any>(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'media_files' 
       AND COLUMN_NAME IN ('url_large', 'url_medium', 'url_thumb')`
    );

    const existingColumns = Array.isArray(columns) 
      ? columns.map((col: any) => col.COLUMN_NAME)
      : [];
    const columnsToAdd = ['url_large', 'url_medium', 'url_thumb'].filter(
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
    const alterStatements = columnsToAdd.map((col) => {
      let afterColumn = 'url';
      if (col === 'url_medium') afterColumn = 'url_large';
      if (col === 'url_thumb') afterColumn = 'url_medium';
      return `ADD COLUMN \`${col}\` VARCHAR(500) NULL AFTER \`${afterColumn}\``;
    });

    await query(`ALTER TABLE \`media_files\` ${alterStatements.join(', ')}`);

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


import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

// GET /api/settings/migrate-featured-products - Add featured product columns to site_settings
export async function GET(request: NextRequest) {
  try {
    // Check if columns exist
    const columns = await query<any>(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'site_settings' 
       AND COLUMN_NAME LIKE 'featured_product_%_id'`
    );

    const existingColumns = Array.isArray(columns) ? columns.map((col: any) => col.COLUMN_NAME) : [];
    const neededColumns = [
      'featured_product_1_id',
      'featured_product_2_id',
      'featured_product_3_id',
      'featured_product_4_id',
      'featured_product_5_id',
      'featured_product_6_id',
    ];

    const columnsToAdd = neededColumns.filter(col => !existingColumns.includes(col));
    
    if (columnsToAdd.length === 0) {
      return NextResponse.json({
        message: 'All featured product columns already exist',
        columns: neededColumns,
      });
    }

    // Add missing columns one by one
    for (const columnName of columnsToAdd) {
      // First add the column
      await query(
        `ALTER TABLE site_settings 
         ADD COLUMN \`${columnName}\` INT NULL`
      );
      
      // Then add the foreign key constraint (if products table exists)
      // Use a unique constraint name to avoid conflicts
      const fkName = `fk_site_settings_${columnName}`;
      try {
        // Check if foreign key already exists
        const existingFKs = await query<any>(
          `SELECT CONSTRAINT_NAME 
           FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = 'site_settings' 
           AND CONSTRAINT_NAME = ?`,
          [fkName]
        );
        
        if (!existingFKs || existingFKs.length === 0) {
          await query(
            `ALTER TABLE site_settings 
             ADD CONSTRAINT ${fkName} 
             FOREIGN KEY (\`${columnName}\`) REFERENCES products(id) ON DELETE SET NULL`
          );
        }
      } catch (fkError: any) {
        // If foreign key fails, log but continue (column was added)
        console.warn(`Could not add foreign key for ${columnName}:`, fkError?.message);
      }
    }

    return NextResponse.json({
      message: `Added ${columnsToAdd.length} featured product columns`,
      columnsAdded: columnsToAdd,
      allColumns: neededColumns,
    });
  } catch (error: any) {
    console.error('Error migrating featured products columns:', error);
    return NextResponse.json(
      { error: 'Failed to migrate columns', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}


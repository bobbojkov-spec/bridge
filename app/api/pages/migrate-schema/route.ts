import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

// GET /api/pages/migrate-schema - Create pages and page_blocks tables
export async function GET(request: NextRequest) {
  try {
    const results: string[] = [];

    // Check if pages table exists
    const [pagesTable] = await query<any>(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'pages'`
    );

    if (!pagesTable || pagesTable.length === 0) {
      // Create pages table
      await query(`
        CREATE TABLE pages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          status VARCHAR(50) DEFAULT 'draft',
          seo_title VARCHAR(255) NULL,
          seo_description TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_slug (slug),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push('Created pages table');
    } else {
      results.push('pages table already exists');
    }

    // Check if page_blocks table exists
    const [blocksTable] = await query<any>(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'page_blocks'`
    );

    if (!blocksTable || blocksTable.length === 0) {
      // Create page_blocks table
      await query(`
        CREATE TABLE page_blocks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          page_id INT NOT NULL,
          type VARCHAR(100) NOT NULL,
          position INT NOT NULL DEFAULT 0,
          data JSON NOT NULL,
          enabled BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
          INDEX idx_page_id (page_id),
          INDEX idx_position (position),
          INDEX idx_enabled (enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push('Created page_blocks table');
    } else {
      results.push('page_blocks table already exists');
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
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


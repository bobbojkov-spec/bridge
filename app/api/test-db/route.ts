import { NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

// Test endpoint to check database connection
export async function GET() {
  try {
    // Try to query directly to get the actual error
    await query('SELECT 1');
    
    // If we get here, connection works - try to fetch counts
    const products = await query<{ count: number }>('SELECT COUNT(*) as count FROM products');
    const categories = await query<{ count: number }>('SELECT COUNT(*) as count FROM categories');

    return NextResponse.json({
      connected: true,
      database: process.env.DB_NAME || 'bridge_db',
      products: products[0]?.count || 0,
      categories: categories[0]?.count || 0,
      message: 'Database connection successful',
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      postgresUrlPreview: process.env.POSTGRES_URL ? 
        process.env.POSTGRES_URL.substring(0, 50) + '...' : 'not set',
      isVercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error: any) {
    // Return detailed error information
    return NextResponse.json(
      {
        connected: false,
        error: error?.message || 'Unknown error',
        code: error?.code,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        postgresUrlPreview: process.env.POSTGRES_URL ? 
          process.env.POSTGRES_URL.substring(0, 50) + '...' : 'not set',
        isVercel: !!process.env.VERCEL,
        nodeEnv: process.env.NODE_ENV,
        details: error?.details,
        hint: error?.hint,
        // Always show stack in production for debugging
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}

    // Try to fetch products count
    const products = await query<{ count: number }>('SELECT COUNT(*) as count FROM products');
    const categories = await query<{ count: number }>('SELECT COUNT(*) as count FROM categories');

    return NextResponse.json({
      connected: true,
      database: process.env.DB_NAME || 'bridge_db',
      products: products[0]?.count || 0,
      categories: categories[0]?.count || 0,
      message: 'Database connection successful',
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      isVercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        error: error?.message || 'Unknown error',
        code: error?.code,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        isVercel: !!process.env.VERCEL,
        nodeEnv: process.env.NODE_ENV,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}


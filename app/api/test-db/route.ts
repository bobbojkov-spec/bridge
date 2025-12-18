import { NextResponse } from 'next/server';
import { testConnection, query } from '@/lib/db/connection';

// Test endpoint to check database connection
export async function GET() {
  try {
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          connected: false,
          hasPostgresUrl: !!process.env.POSTGRES_URL,
          isVercel: !!process.env.VERCEL,
          nodeEnv: process.env.NODE_ENV,
        },
        { status: 500 }
      );
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


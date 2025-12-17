// Database connection - PostgreSQL version
// This file has been migrated from MySQL to PostgreSQL
// Uses local PostgreSQL for development, can switch to Supabase for production

// Use local PostgreSQL for development (switch to connection-pg for Supabase/production)
import { query as pgQuery, queryOne as pgQueryOne, insertAndGetId as pgInsertAndGetId } from './connection-pg-local';

// Re-export PostgreSQL functions with MySQL-compatible names
export const query = pgQuery;
export const queryOne = pgQueryOne;

// Helper function for inserts that need to return the ID
// In PostgreSQL, we use RETURNING id instead of insertId
export async function insertAndGetId(
  sqlQuery: string,
  params?: any[]
): Promise<number> {
  return await pgInsertAndGetId(sqlQuery, params);
}

// For backward compatibility with MySQL insertId pattern
// This converts MySQL-style inserts to PostgreSQL
export async function queryWithInsertId<T = any>(
  sqlQuery: string,
  params?: any[]
): Promise<{ insertId: number; rows: T[] }> {
  // If it's an INSERT query, use insertAndGetId
  if (sqlQuery.trim().toUpperCase().startsWith('INSERT')) {
    const id = await insertAndGetId(sqlQuery, params);
    return { insertId: id, rows: [] };
  }
  
  // Otherwise, just execute the query
  const rows = await query<T>(sqlQuery, params);
  return { insertId: 0, rows };
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const { testConnection: pgTest } = await import('./connection-pg-local');
    return await pgTest();
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

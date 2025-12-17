import { Pool } from 'pg';

// Create connection pool using POSTGRES_URL from environment (Supabase)
// This works with both Supabase and local PostgreSQL
function getConnectionConfig() {
  const postgresUrl = process.env.POSTGRES_URL || 'postgresql://localhost:5432/bridge_db';
  
  // Parse connection string or use defaults
  try {
    const url = new URL(postgresUrl.replace('postgresql://', 'http://'));
    return {
      connectionString: postgresUrl,
    };
  } catch {
    return {
      host: 'localhost',
      port: 5432,
      database: 'bridge_db',
      user: process.env.USER || 'postgres',
    };
  }
}

// Create connection pool
const pool = new Pool(getConnectionConfig());

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ PostgreSQL Pool Error:', err.message);
});

// PostgreSQL connection using Vercel Postgres
// This works with Supabase and other PostgreSQL databases via connection string
// 
// Environment variables needed:
// - POSTGRES_URL (connection string from Supabase/Vercel)
// - POSTGRES_PRISMA_URL (optional, for Prisma)
// - POSTGRES_URL_NON_POOLING (optional, for migrations)

// Convert MySQL query to PostgreSQL
function convertMySQLToPostgreSQL(sqlQuery: string, params?: any[]): { query: string; pgParams: any[] } {
  let pgQuery = sqlQuery;
  const pgParams: any[] = [];
  
  if (params && params.length > 0) {
    let paramIndex = 1;
    pgQuery = sqlQuery.replace(/\?/g, () => {
      const value = params[pgParams.length];
      // Convert boolean to proper PostgreSQL boolean (not 0/1)
      if (typeof value === 'boolean') {
        pgParams.push(value);
      } else {
        pgParams.push(value);
      }
      return `$${paramIndex++}`;
    });
  }

  // Remove MySQL backticks and replace with PostgreSQL double quotes
  // PostgreSQL uses double quotes for identifiers, and "order" is a reserved word
  pgQuery = pgQuery.replace(/`([^`]+)`/g, '"$1"');
  
  // Convert MySQL-specific functions
  pgQuery = pgQuery.replace(/DATABASE\(\)/gi, 'current_database()');
  
  // Convert MySQL boolean comparisons (active = 1/0) to PostgreSQL boolean
  pgQuery = pgQuery.replace(/\bactive\s*=\s*1\b/gi, 'active = TRUE');
  pgQuery = pgQuery.replace(/\bactive\s*=\s*0\b/gi, 'active = FALSE');
  pgQuery = pgQuery.replace(/\bactive\s*=\s*TRUE\b/gi, 'active = TRUE');
  
  // Convert insertId to RETURNING id for PostgreSQL
  // This will be handled in the insert functions
  
  return { query: pgQuery, pgParams };
}

// Execute a query
export async function query<T = any>(
  sqlQuery: string,
  params?: any[]
): Promise<T[]> {
  try {
    const { query: pgQuery, pgParams } = convertMySQLToPostgreSQL(sqlQuery, params);
    
    // Execute query using the client
    // @vercel/postgres client.query() accepts query string and params array
    const result = await db.query(pgQuery, pgParams);
    
    // If query expects insertId (MySQL pattern), add it to the result
    // This handles cases where code expects { insertId: number } in the result
    if (pgQuery.trim().toUpperCase().startsWith('INSERT') && result.rows.length > 0) {
      // Check if result has 'id' field (from RETURNING id)
      const rows = result.rows.map((row: any) => {
        if (row.id !== undefined) {
          return { ...row, insertId: row.id };
        }
        return row;
      });
      return rows as T[];
    }
    
    return result.rows as T[];
  } catch (error: any) {
    console.error('Query error:', {
      originalSql: sqlQuery.substring(0, 100),
      paramsCount: params?.length || 0,
      message: error?.message,
      code: error?.code,
    });
    throw error;
  }
}

// Execute a query and return the first result
export async function queryOne<T = any>(
  sqlQuery: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T>(sqlQuery, params);
  return results.length > 0 ? results[0] : null;
}

// Execute insert and return the inserted ID (PostgreSQL style)
export async function insertAndGetId(
  sqlQuery: string,
  params?: any[]
): Promise<number> {
  try {
    // Add RETURNING id to the query
    let insertQuery = sqlQuery.trim();
    if (!insertQuery.toUpperCase().includes('RETURNING')) {
      // Find the INSERT statement and add RETURNING id
      insertQuery = insertQuery.replace(/INSERT\s+INTO\s+(\w+)/i, (match, tableName) => {
        return `${match} RETURNING id`;
      });
    }
    
    const { query: pgQuery, pgParams } = convertMySQLToPostgreSQL(insertQuery, params);
    const result = await pool.query(pgQuery.trim(), pgParams);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows[0].id;
    }
    return 0;
  } catch (error: any) {
    console.error('Insert error:', {
      sql: sqlQuery.substring(0, 100),
      message: error?.message,
    });
    throw error;
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}


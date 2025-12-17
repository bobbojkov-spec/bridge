import { Pool } from 'pg';

// Local PostgreSQL connection using 'pg' package
// This is better for local development than @vercel/postgres

// Parse connection string or use defaults
function getConnectionConfig() {
  const postgresUrl = process.env.POSTGRES_URL || 'postgresql://localhost:5432/bridge_db';
  
  // Parse connection string
  const url = new URL(postgresUrl.replace('postgresql://', 'http://'));
  
  return {
    host: url.hostname || 'localhost',
    port: parseInt(url.port || '5432'),
    database: url.pathname?.replace('/', '') || 'bridge_db',
    user: url.username || process.env.USER || 'postgres',
    password: url.password || undefined,
  };
}

// Create connection pool
const pool = new Pool(getConnectionConfig());

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ PostgreSQL Pool Error:', err.message);
});

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
  pgQuery = pgQuery.replace(/`([^`]+)`/g, '"$1"');
  
  // Convert MySQL-specific functions (but not current_database which is already PostgreSQL)
  pgQuery = pgQuery.replace(/\bDATABASE\(\)/gi, 'current_database()');
  
  // Convert MySQL boolean comparisons (active = 1/0) to PostgreSQL boolean
  pgQuery = pgQuery.replace(/\bactive\s*=\s*1\b/gi, 'active = TRUE');
  pgQuery = pgQuery.replace(/\bactive\s*=\s*0\b/gi, 'active = FALSE');
  
  return { query: pgQuery, pgParams };
}

// Execute a query
export async function query<T = any>(
  sqlQuery: string,
  params?: any[]
): Promise<T[]> {
  try {
    const { query: pgQuery, pgParams } = convertMySQLToPostgreSQL(sqlQuery, params);
    
    // Debug: log query if needed (uncomment for debugging)
    // if (pgParams.length > 0) {
    //   console.log('Query:', pgQuery.substring(0, 200));
    //   console.log('Params:', pgParams.length);
    // }
    
    // Execute query - pg library expects (text, values[])
    const result = await pool.query(pgQuery.trim(), pgParams);
    
    // If query expects insertId (MySQL pattern), add it to the result
    if (pgQuery.trim().toUpperCase().startsWith('INSERT') && result.rows.length > 0) {
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
      insertQuery = insertQuery.replace(/INSERT\s+INTO\s+(\w+)/i, (match) => {
        return `${match} RETURNING id`;
      });
    }
    
    const { query: pgQuery, pgParams } = convertMySQLToPostgreSQL(insertQuery, params);
    const result = await pool.query(pgQuery, pgParams);
    
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

// Close the connection pool
export async function closePool(): Promise<void> {
  await pool.end();
}


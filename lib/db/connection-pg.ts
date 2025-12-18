import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly (Next.js should do this, but ensure it's loaded)
if (typeof window === 'undefined') {
  config({ path: resolve(process.cwd(), '.env.local') });
}

// Create connection pool using POSTGRES_URL from environment (Supabase)
// This works with both Supabase and local PostgreSQL
function getConnectionConfig() {
  const postgresUrl = process.env.POSTGRES_URL || 'postgresql://localhost:5432/bridge_db';
  
  if (!process.env.POSTGRES_URL) {
    console.warn('⚠️  POSTGRES_URL not found in environment variables');
  }
  
  // Parse connection string or use defaults
  try {
    const url = new URL(postgresUrl.replace('postgresql://', 'http://'));
    const hostname = url.hostname;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isVercel = !!process.env.VERCEL;

    // For Supabase and production, use SSL with proper configuration
    // For localhost, skip SSL
    if (isLocalHost) {
      // Local development - no SSL needed
      return {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1) || 'postgres',
        user: decodeURIComponent(url.username || 'postgres'),
        password: decodeURIComponent(url.password || ''),
      };
    } else {
      // Production/Supabase - require SSL with relaxed certificate validation
      // This is necessary for Vercel's Node.js environment
      return {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1) || 'postgres',
        user: decodeURIComponent(url.username || 'postgres'),
        password: decodeURIComponent(url.password || ''),
        ssl: {
          rejectUnauthorized: false
        }
      };
    }
  } catch (error) {
    console.error('Error parsing connection string:', error);
    return {
      host: 'localhost',
      port: 5432,
      database: 'bridge_db',
      user: process.env.USER || 'postgres',
    };
  }
}

// Create connection pool lazily to ensure env vars are loaded
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const config = getConnectionConfig();
    console.log('🔌 Creating Supabase connection pool...', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      hasPassword: !!config.password,
      hasSSL: !!config.ssl,
      sslConfig: config.ssl,
      isVercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
    });
    
    // Add error handler before creating pool
    pool = new Pool(config);
    setupPoolErrorHandler(pool);
    
    // Add connection error handler
    pool.on('error', (err) => {
      console.error('❌ Pool error:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
    });
  }
  return pool;
}

// Handle pool errors (set after pool creation)
function setupPoolErrorHandler(p: Pool) {
  p.on('error', (err) => {
    console.error('❌ PostgreSQL Pool Error:', err.message);
  });
}

// PostgreSQL connection using Supabase
// This project now uses Supabase exclusively (no local PostgreSQL)
// 
// Environment variables needed:
// - POSTGRES_URL (connection string from Supabase)
//   Set automatically when connecting Vercel with Supabase
//   Or manually: postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres

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
    
    // Execute query using the pool
    const result = await getPool().query(pgQuery, pgParams);
    
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

// Helper function to fix sequence for a table
async function fixSequenceForTable(tableName: string): Promise<void> {
  try {
    // Get the maximum ID from the table
    const maxResult = await getPool().query<{ max: number }>(
      `SELECT COALESCE(MAX(id), 0) as max FROM ${tableName}`
    );
    
    const maxId = maxResult.rows[0]?.max || 0;
    const nextId = maxId + 1;
    
    // Reset the sequence
    const sequenceName = `${tableName}_id_seq`;
    await getPool().query(
      `SELECT setval('${sequenceName}', ${nextId}, false)`
    );
    
    console.log(`✅ Fixed sequence ${sequenceName} to ${nextId}`);
  } catch (seqError: any) {
    // If sequence doesn't exist, that's okay - it might be created automatically
    if (!seqError?.message?.includes('does not exist')) {
      console.error(`⚠️  Could not fix sequence for ${tableName}:`, seqError?.message);
    }
  }
}

// Execute insert and return the inserted ID (PostgreSQL style)
export async function insertAndGetId(
  sqlQuery: string,
  params?: any[]
): Promise<number> {
  try {
    // Add RETURNING id to the query (at the END, after VALUES clause)
    let insertQuery = sqlQuery.trim();
    if (!insertQuery.toUpperCase().includes('RETURNING')) {
      // Add RETURNING id at the end of the INSERT statement
      // This handles: INSERT INTO table (...) VALUES (...) or INSERT INTO table (...) SELECT ...
      insertQuery = insertQuery.replace(/;?\s*$/i, '') + ' RETURNING id';
    }
    
    const { query: pgQuery, pgParams } = convertMySQLToPostgreSQL(insertQuery, params);
    const result = await getPool().query(pgQuery.trim(), pgParams);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows[0].id;
    }
    return 0;
  } catch (error: any) {
    // Handle duplicate key error (sequence out of sync)
    if (error?.code === '23505' && error?.constraint?.endsWith('_pkey')) {
      // Extract table name from error or SQL query
      const tableName = error?.table || sqlQuery.match(/INSERT\s+INTO\s+["`]?(\w+)["`]?/i)?.[1];
      
      if (tableName) {
        console.log(`⚠️  Sequence out of sync for ${tableName}, attempting to fix...`);
        await fixSequenceForTable(tableName);
        
        // Retry the insert once
        try {
          let insertQuery = sqlQuery.trim();
          if (!insertQuery.toUpperCase().includes('RETURNING')) {
            insertQuery = insertQuery.replace(/;?\s*$/i, '') + ' RETURNING id';
          }
          
          const { query: pgQuery, pgParams } = convertMySQLToPostgreSQL(insertQuery, params);
          const result = await getPool().query(pgQuery.trim(), pgParams);
          
          if (result.rows && result.rows.length > 0) {
            console.log(`✅ Insert succeeded after sequence fix`);
            return result.rows[0].id;
          }
        } catch (retryError: any) {
          console.error('❌ Insert failed even after sequence fix:', retryError?.message);
          throw retryError;
        }
      }
    }
    
    console.error('Insert error:', {
      sql: sqlQuery.substring(0, 100),
      convertedSql: convertMySQLToPostgreSQL(sqlQuery.trim() + ' RETURNING id', params).query.substring(0, 150),
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

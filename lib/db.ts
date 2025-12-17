import mysql from 'mysql2/promise';

// Singleton pattern to ensure only one pool instance
let pool: mysql.Pool | null = null;

function createPool(): mysql.Pool {
  const config: mysql.PoolOptions = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bridge_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    multipleStatements: false,
  };
  return mysql.createPool(config);
}

function getPool(): mysql.Pool {
  if (!pool) {
    console.log('🔄 Creating MySQL connection pool for bridge_db...');
    pool = createPool();
  }
  return pool;
}

// Database connection pool
const dbPool = getPool();

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    if (pool) {
      await pool.end();
      pool = null;
    }
  });
  
  process.on('SIGTERM', async () => {
    if (pool) {
      await pool.end();
      pool = null;
    }
  });
}

export default dbPool;


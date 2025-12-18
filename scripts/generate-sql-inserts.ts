/**
 * Generate SQL INSERT statements for missing data
 * Outputs to desktop as plain text file
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import * as os from 'os';

config({ path: resolve(process.cwd(), '.env.local') });

// Local PostgreSQL
const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bridge_db',
  user: process.env.USER || 'postgres',
});

// Supabase
function getSupabasePool() {
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    throw new Error('POSTGRES_URL is not set');
  }
  let cleanUrl = postgresUrl.replace(/[?&]sslmode=[^&]*/g, '');
  return new Pool({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });
}

const supabasePool = getSupabasePool();

const tables = [
  'product_tags',
  'product_additional_info',
  'hero_slides',
  'news_articles',
  'media_files',
];

function escapeValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  // Escape single quotes in strings
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function generateInsertsForTable(tableName: string): Promise<string> {
  try {
    // Get all rows from local
    const localResult = await localPool.query(`SELECT * FROM "${tableName}" ORDER BY id`);
    const localRows = localResult.rows;
    
    if (localRows.length === 0) {
      return `-- ${tableName}: No data\n`;
    }
    
    // Get existing IDs from Supabase
    const supabaseResult = await supabasePool.query(`SELECT id FROM "${tableName}"`);
    const existingIds = new Set(supabaseResult.rows.map((r: any) => r.id));
    
    // Filter out rows that already exist
    const missingRows = localRows.filter((row: any) => !existingIds.has(row.id));
    
    if (missingRows.length === 0) {
      return `-- ${tableName}: All ${localRows.length} rows already exist in Supabase\n`;
    }
    
    const columns = Object.keys(missingRows[0]);
    const colNames = columns.map(c => `"${c}"`).join(', ');
    
    let sql = `-- ${tableName}: Inserting ${missingRows.length} missing rows (${localRows.length} total in local, ${existingIds.size} already in Supabase)\n`;
    sql += `-- Generated at ${new Date().toISOString()}\n\n`;
    
    for (const row of missingRows) {
      const values = columns.map(col => escapeValue(row[col])).join(', ');
      sql += `INSERT INTO "${tableName}" (${colNames}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
    }
    
    sql += '\n';
    return sql;
    
  } catch (error: any) {
    return `-- ${tableName}: Error - ${error.message}\n\n`;
  }
}

async function main() {
  console.log('📝 Generating SQL INSERT statements...\n');
  
  // Test connections
  try {
    await localPool.query('SELECT 1');
    console.log('✅ Local connected');
  } catch (error: any) {
    console.error('❌ Local failed:', error.message);
    process.exit(1);
  }
  
  try {
    await supabasePool.query('SELECT 1');
    console.log('✅ Supabase connected\n');
  } catch (error: any) {
    console.error('❌ Supabase failed:', error.message);
    process.exit(1);
  }
  
  let sqlContent = `-- SQL INSERT statements for missing data\n`;
  sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
  sqlContent += `-- Copy and paste this into Supabase SQL Editor\n\n`;
  sqlContent += `-- ============================================\n\n`;
  
  for (const table of tables) {
    console.log(`📦 Processing ${table}...`);
    const sql = await generateInsertsForTable(table);
    sqlContent += sql;
    sqlContent += `-- ============================================\n\n`;
  }
  
  // Save to desktop
  const desktopPath = path.join(os.homedir(), 'Desktop', 'supabase-inserts.sql');
  fs.writeFileSync(desktopPath, sqlContent, 'utf8');
  
  console.log(`\n✅ SQL file generated: ${desktopPath}`);
  console.log(`📊 Total size: ${(sqlContent.length / 1024).toFixed(2)} KB`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Open Supabase Dashboard`);
  console.log(`   2. Go to SQL Editor`);
  console.log(`   3. Open the file: ${desktopPath}`);
  console.log(`   4. Copy and paste the content`);
  console.log(`   5. Click "Run"`);
  
  await localPool.end();
  await supabasePool.end();
}

// Fix import
import * as path from 'path';

main().catch(console.error);


/**
 * Fast Migration using pg_dump + pg_restore
 * Uses Supavisor session mode for reliable migrations
 * 
 * This is the recommended approach for migrating to Supabase
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);
config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('🚀 Migration using pg_dump + pg_restore\n');
  
  // Get connection strings
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    console.error('❌ POSTGRES_URL is not set in .env.local');
    process.exit(1);
  }
  
  // Parse Supabase URL to get session mode connection
  // Session mode uses direct connection (not pooler) for pg_dump/pg_restore
  // Supabase recommends Supavisor session mode for migrations
  let supabaseUrl = postgresUrl.replace(/[?&]sslmode=[^&]*/g, '');
  
  // If it's a pooler URL, convert to direct connection for session mode
  // Pooler URLs: db.xxx.pooler.supabase.com
  // Direct/Session: db.xxx.supabase.co (port 5432)
  if (supabaseUrl.includes('pooler.supabase.com')) {
    // Convert pooler to direct connection for session mode
    supabaseUrl = supabaseUrl.replace('.pooler.supabase.com', '.supabase.co');
    console.log('📝 Converted pooler URL to session mode (direct connection)');
    console.log('   Using direct connection for pg_restore (recommended for migrations)\n');
  } else {
    console.log('📝 Using direct connection (session mode)\n');
  }
  
  // Local database config
  const localDb = 'bridge_db';
  const localUser = process.env.USER || 'postgres';
  const localHost = 'localhost';
  const localPort = '5432';
  
  // Create temp directory for dump file
  const tempDir = path.join(process.cwd(), 'temp-migration');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const dumpFile = path.join(tempDir, 'bridge-dump.dump');
  
  // Find pg_dump and pg_restore
  const pgDumpPath = '/opt/homebrew/Cellar/postgresql@16/16.11/bin/pg_dump';
  const pgRestorePath = '/opt/homebrew/Cellar/postgresql@16/16.11/bin/pg_restore';
  
  // Check if tools exist
  if (!fs.existsSync(pgDumpPath)) {
    console.error('❌ pg_dump not found at:', pgDumpPath);
    console.error('   Please install PostgreSQL client tools or update the path in the script');
    process.exit(1);
  }
  
  try {
    // Step 1: Dump local database (custom format)
    console.log('📦 Step 1: Dumping local database...');
    console.log(`   Database: ${localDb}`);
    console.log(`   Output: ${dumpFile}\n`);
    
    const dumpCmd = `"${pgDumpPath}" -Fc -h ${localHost} -p ${localPort} -U ${localUser} -d ${localDb} -f "${dumpFile}"`;
    
    console.log('Running:', dumpCmd.replace(/-U \w+/, '-U ***'));
    const { stdout: dumpStdout, stderr: dumpStderr } = await execAsync(dumpCmd, {
      env: { ...process.env, PGPASSWORD: '' }, // Will prompt or use .pgpass
    });
    
    if (dumpStderr && !dumpStderr.includes('password')) {
      console.warn('Dump warnings:', dumpStderr);
    }
    
    const dumpSize = fs.statSync(dumpFile).size;
    console.log(`✅ Dump complete! Size: ${(dumpSize / 1024 / 1024).toFixed(2)} MB\n`);
    
    // Step 2: Restore to Supabase (using session mode)
    console.log('📤 Step 2: Restoring to Supabase...');
    console.log('   Using session mode connection\n');
    
    // Extract password from connection string for pg_restore
    // Format: postgresql://user:password@host:port/database
    const urlMatch = supabaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
    if (!urlMatch) {
      // Try without database name
      const urlMatch2 = supabaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@(.+)/);
      if (!urlMatch2) {
        console.error('❌ Could not parse Supabase connection string');
        process.exit(1);
      }
      const [, dbUser, dbPassword, dbHostPort] = urlMatch2;
      const hostPortParts = dbHostPort.split(':');
      const dbHost = hostPortParts[0];
      const dbPort = hostPortParts[1] || '5432';
      const dbName = 'postgres';
      
      // Use these values
      var dbUserFinal = dbUser;
      var dbPasswordFinal = dbPassword;
      var dbHostFinal = dbHost;
      var dbPortFinal = dbPort;
      var dbNameFinal = dbName;
    } else {
      const [, dbUser, dbPassword, dbHostPort, dbName] = urlMatch;
      const hostPortParts = dbHostPort.split(':');
      const dbHost = hostPortParts[0];
      const dbPort = hostPortParts[1] || '5432';
      
      var dbUserFinal = dbUser;
      var dbPasswordFinal = dbPassword;
      var dbHostFinal = dbHost;
      var dbPortFinal = dbPort;
      var dbNameFinal = dbName;
    }
    
    // pg_restore command
    const restoreCmd = `"${pgRestorePath}" --no-owner --no-privileges --clean --if-exists -h ${dbHostFinal} -p ${dbPortFinal} -U ${dbUserFinal} -d ${dbNameFinal} "${dumpFile}"`;
    
    console.log('Running:', restoreCmd.replace(/-U \w+/, '-U ***'));
    
    const { stdout: restoreStdout, stderr: restoreStderr } = await execAsync(restoreCmd, {
      env: { ...process.env, PGPASSWORD: dbPasswordFinal },
    });
    
    if (restoreStdout) {
      console.log(restoreStdout);
    }
    
    if (restoreStderr) {
      // pg_restore outputs progress to stderr, which is normal
      const errorLines = restoreStderr.split('\n').filter(line => 
        line.includes('ERROR') || line.includes('FATAL')
      );
      if (errorLines.length > 0) {
        console.error('Restore errors:', errorLines.join('\n'));
      } else {
        // Show last few lines of progress
        const progressLines = restoreStderr.split('\n').slice(-5);
        console.log(progressLines.join('\n'));
      }
    }
    
    console.log('\n✅ Restore complete!\n');
    
    // Step 3: Cleanup
    console.log('🧹 Cleaning up...');
    fs.unlinkSync(dumpFile);
    fs.rmdirSync(tempDir);
    console.log('✅ Cleanup complete\n');
    
    console.log('🎉 Migration completed successfully!');
    console.log('\n📝 Your Supabase database now matches your local database.');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.stderr) {
      console.error('\nError details:', error.stderr);
    }
    
    // Cleanup on error
    if (fs.existsSync(dumpFile)) {
      try {
        fs.unlinkSync(dumpFile);
        if (fs.existsSync(tempDir)) {
          fs.rmdirSync(tempDir);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    process.exit(1);
  }
}

main().catch(console.error);


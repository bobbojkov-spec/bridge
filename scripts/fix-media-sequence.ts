/**
 * Fix PostgreSQL sequence for media_files table
 * This script resets the sequence to match the maximum ID in the table
 * Run this when you get "duplicate key value violates unique constraint" errors
 */

import { query } from '../lib/db/connection-pg';

async function fixMediaFilesSequence() {
  try {
    console.log('🔧 Fixing media_files sequence...');
    
    // Get the maximum ID from the table
    const maxResult = await query<{ max: number }>(
      'SELECT COALESCE(MAX(id), 0) as max FROM media_files'
    );
    
    const maxId = maxResult[0]?.max || 0;
    console.log(`📊 Current maximum ID: ${maxId}`);
    
    // Reset the sequence to the maximum ID (or 1 if table is empty)
    // We set it to maxId + 1 so the next insert will use maxId + 1
    const nextId = maxId + 1;
    
    // Use string interpolation for setval (it's a function call, not a regular query)
    await query(
      `SELECT setval('media_files_id_seq', ${nextId}, false)`
    );
    
    console.log(`✅ Sequence reset to: ${nextId}`);
    console.log(`✅ Next insert will use ID: ${nextId}`);
    
    // Verify the sequence value
    const seqResult = await query<{ last_value: number }>(
      "SELECT last_value FROM media_files_id_seq"
    );
    
    console.log(`✅ Verified sequence last_value: ${seqResult[0]?.last_value}`);
    
  } catch (error: any) {
    console.error('❌ Error fixing sequence:', error);
    
    // If the sequence doesn't exist, create it
    if (error?.message?.includes('does not exist')) {
      console.log('🔧 Sequence does not exist, creating it...');
      
      const maxResult = await query<{ max: number }>(
        'SELECT COALESCE(MAX(id), 0) as max FROM media_files'
      );
      const maxId = maxResult[0]?.max || 0;
      const nextId = maxId + 1;
      
      await query(`
        CREATE SEQUENCE IF NOT EXISTS media_files_id_seq;
        SELECT setval('media_files_id_seq', ${nextId}, false);
      `);
      
      console.log(`✅ Created and set sequence to: ${nextId}`);
    } else {
      throw error;
    }
  }
}

// Run the fix
fixMediaFilesSequence()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });


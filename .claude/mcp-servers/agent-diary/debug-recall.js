import { DiaryAPI } from './lib/diary-api.js';
import Database from 'better-sqlite3';
import fs from 'fs';

// Debug the recall issue
console.log('🔍 DEBUGGING RECALL ISSUE 🔍\n');

// Create fresh test database
const testDb = 'debug-recall.db';
if (fs.existsSync(testDb)) {
    fs.unlinkSync(testDb);
}

const diary = new DiaryAPI(testDb);

async function debugRecall() {
    // Save multiple entries
    console.log('Saving test entries...\n');
    
    await diary.saveEntry('test-agent', {
        title: 'Entry 1',
        content: 'First entry content',
        entryType: 'test'
    });
    
    await diary.saveEntry('test-agent', {
        title: 'Entry 2',
        content: 'Second entry content',
        entryType: 'test'
    });
    
    await diary.saveEntry('test-agent', {
        title: 'Entry 3',
        content: 'Third entry content',
        entryType: 'test'
    });
    
    // Direct database queries to debug
    const db = new Database(testDb);
    
    console.log('Direct query - All entries:');
    const entries = db.prepare('SELECT * FROM diary_entries').all();
    entries.forEach(e => console.log(`ID: ${e.id}, Title: ${e.title}`));
    
    console.log('\nDirect query - All chunks:');
    const chunks = db.prepare('SELECT * FROM diary_chunks ORDER BY entry_id, chunk_order').all();
    chunks.forEach(c => console.log(`Entry ID: ${c.entry_id}, Order: ${c.chunk_order}, Content: ${c.content}`));
    
    // Now test recall
    console.log('\n\nTesting recall through API:');
    const result = await diary.recallEntries('test-agent', {
        limit: 10,
        includeContent: true
    });
    
    console.log(`\nRecalled ${result.entries.length} entries:`);
    result.entries.forEach((entry, i) => {
        console.log(`\nEntry ${i + 1}:`);
        console.log(`  ID: ${entry.id}`);
        console.log(`  Title: ${entry.title}`);
        console.log(`  Content: ${entry.content}`);
    });
    
    // Check getChunks statement directly
    console.log('\n\nTesting getChunks directly:');
    for (let entryId = 1; entryId <= 3; entryId++) {
        const chunks = diary.stmts.getChunks.all(entryId);
        console.log(`Entry ${entryId} chunks:`, chunks.map(c => c.content));
    }
    
    // Cleanup
    diary.close();
    db.close();
    fs.unlinkSync(testDb);
}

debugRecall().catch(console.error);
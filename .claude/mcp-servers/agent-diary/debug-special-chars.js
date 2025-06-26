import { DiaryAPI } from './lib/diary-api.js';
import Database from 'better-sqlite3';
import fs from 'fs';

// Debug special characters issue
console.log('🔍 DEBUGGING SPECIAL CHARACTERS ISSUE 🔍\n');

// Create fresh test database
const testDb = 'debug-special.db';
if (fs.existsSync(testDb)) {
    fs.unlinkSync(testDb);
}

const diary = new DiaryAPI(testDb);

async function debugSpecialChars() {
    // Save an entry with special characters
    const testContent = "It's working! She said, \"Hello!\" 🚀";
    console.log(`Original content: ${testContent}`);
    
    const saveResult = await diary.saveEntry('special-test', {
        title: 'Special Test',
        content: testContent,
        entryType: 'test'
    });
    console.log(`\nSaved with entry ID: ${saveResult.entryId}`);
    
    // Direct database query to check what was saved
    const db = new Database(testDb);
    
    console.log('\nDirect database check:');
    const chunk = db.prepare('SELECT * FROM diary_chunks WHERE entry_id = ?').get(saveResult.entryId);
    console.log(`Chunk content in DB: ${chunk.content}`);
    console.log(`Content matches: ${chunk.content === testContent}`);
    
    // Test recall
    console.log('\nTesting recall:');
    const recallResult = await diary.recallEntries('special-test', {
        limit: 1,
        includeContent: true
    });
    
    if (recallResult.entries.length > 0) {
        const recalled = recallResult.entries[0].content;
        console.log(`Recalled content: ${recalled}`);
        console.log(`Matches original: ${recalled === testContent}`);
        
        // Check character by character
        if (recalled !== testContent) {
            console.log('\nCharacter comparison:');
            for (let i = 0; i < Math.max(recalled.length, testContent.length); i++) {
                if (recalled[i] !== testContent[i]) {
                    console.log(`Position ${i}: Original='${testContent[i]}' (${testContent.charCodeAt(i)}), Recalled='${recalled[i]}' (${recalled.charCodeAt(i)})`);
                }
            }
        }
    }
    
    // Cleanup
    diary.close();
    db.close();
    fs.unlinkSync(testDb);
}

debugSpecialChars().catch(console.error);
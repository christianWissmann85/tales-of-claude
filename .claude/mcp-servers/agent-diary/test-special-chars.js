import { DiaryAPI } from './lib/diary-api.js';
import fs from 'fs';

// Test special characters issue
console.log('🔍 INVESTIGATING SPECIAL CHARACTERS BUG 🔍\n');

// Create fresh test database
const testDb = 'test-special-chars.db';
if (fs.existsSync(testDb)) {
    fs.unlinkSync(testDb);
}

const diary = new DiaryAPI(testDb);

async function testSpecialChars() {
    console.log('Testing various special character scenarios...\n');
    
    const testCases = [
        {
            name: "Apostrophes",
            content: "It's working! That's great!"
        },
        {
            name: "Single quotes",
            content: "'Single quotes' should work"
        },
        {
            name: "Double quotes",
            content: 'She said, "Hello there!"'
        },
        {
            name: "Mixed quotes",
            content: `It's "working" with 'all' types`
        },
        {
            name: "Emojis",
            content: "Testing emojis: 🚀 🤖 🎮"
        },
        {
            name: "SQL-like content",
            content: "SELECT * FROM users WHERE name = 'test';"
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\nTesting: ${testCase.name}`);
        console.log(`Original: ${testCase.content}`);
        
        try {
            // Save entry
            const saveResult = await diary.saveEntry('special-test', {
                title: testCase.name,
                content: testCase.content,
                entryType: 'test'
            });
            console.log(`✓ Saved successfully (Entry ID: ${saveResult.entryId})`);
            
            // Recall entry
            const recallResult = await diary.recallEntries('special-test', {
                limit: 1,
                includeContent: true
            });
            
            if (recallResult.entries.length > 0) {
                const recalled = recallResult.entries[0].content;
                console.log(`Recalled: ${recalled}`);
                
                if (recalled === testCase.content) {
                    console.log('✅ MATCH - Content preserved correctly');
                } else {
                    console.log('❌ MISMATCH - Content was altered!');
                    console.log(`Expected: ${testCase.content}`);
                    console.log(`Got:      ${recalled}`);
                }
            } else {
                console.log('❌ ERROR - No entries recalled');
            }
            
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
    }
    
    // Cleanup
    diary.close();
    fs.unlinkSync(testDb);
}

testSpecialChars().catch(console.error);
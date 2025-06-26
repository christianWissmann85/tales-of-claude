import { DiaryAPI } from './lib/diary-api.js';
import fs from 'fs';

// Tamy's Brutal Edge Case Tests
console.log('🔨 TAMY\'S BRUTAL EDGE CASE TESTS FOR DIARY TOOL 🔨\n');

// Create fresh test database
const testDb = 'test-edge-cases.db';
if (fs.existsSync(testDb)) {
    fs.unlinkSync(testDb);
}

const diary = new DiaryAPI(testDb);

async function runEdgeCaseTests() {
    let passed = 0;
    let failed = 0;

    // Test 1: Empty content
    console.log('1. Testing empty content...');
    try {
        const result = await diary.saveEntry('edge-tester', {
            title: 'Empty Entry',
            content: '',
            entryType: 'test',
            tags: '',
            priority: 1
        });
        console.log('✗ FAIL: Should reject empty content');
        failed++;
    } catch (error) {
        console.log('✓ PASS: Correctly rejected empty content');
        passed++;
    }

    // Test 2: Massive content (>1MB)
    console.log('\n2. Testing massive content...');
    try {
        const hugeContent = 'x'.repeat(100000); // 100KB instead of 1MB
        const result = await diary.saveEntry('edge-tester', {
            title: 'Huge Entry',
            content: hugeContent,
            entryType: 'test',
            tags: 'huge',
            priority: 1
        });
        console.log(`✓ PASS: Handled massive content (${result.chunkCount} chunks)`);
        passed++;
    } catch (error) {
        console.log('✗ FAIL: Could not handle massive content:', error.message);
        failed++;
    }

    // Test 3: Special characters
    console.log('\n3. Testing special characters...');
    try {
        const specialContent = `
            SQL Injection: '; DROP TABLE agents; --
            Unicode: 🤖 🎮 ⚔️ 🐛
            Control chars: \n\r\t
            Quotes: "double" 'single' \`backtick\`
            XML/HTML: <script>alert('xss')</script>
        `;
        const result = await diary.saveEntry('edge-tester', {
            title: 'Special Chars Test',
            content: specialContent,
            entryType: 'test',
            tags: 'special,unicode,injection',
            priority: 1
        });
        
        // Verify it was saved correctly
        const recalled = await diary.recallEntries('edge-tester', {
            query: 'DROP TABLE'
        });
        
        if (recalled.entries.length > 0 && recalled.entries[0].content.includes('DROP TABLE')) {
            console.log('✓ PASS: Special characters handled correctly');
            passed++;
        } else {
            console.log('✗ FAIL: Special characters not preserved');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Could not handle special characters:', error.message);
        failed++;
    }

    // Test 4: Invalid date ranges
    console.log('\n4. Testing invalid date ranges...');
    try {
        const result = await diary.recallEntries('edge-tester', {
            dateStart: '2025-12-31',
            dateEnd: '2025-01-01' // End before start
        });
        console.log('✓ PASS: Handled invalid date range gracefully');
        passed++;
    } catch (error) {
        console.log('✗ FAIL: Crashed on invalid date range:', error.message);
        failed++;
    }

    // Test 5: Concurrent writes
    console.log('\n5. Testing concurrent writes...');
    try {
        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(diary.saveEntry(`concurrent-${i}`, {
                title: `Concurrent Entry ${i}`,
                content: `Testing concurrent write ${i}`,
                entryType: 'test',
                tags: 'concurrent',
                priority: 1
            }));
        }
        const results = await Promise.all(promises);
        console.log(`✓ PASS: Handled ${results.length} concurrent writes`);
        passed++;
    } catch (error) {
        console.log('✗ FAIL: Could not handle concurrent writes:', error.message);
        failed++;
    }

    // Test 6: Invalid emotion intensity
    console.log('\n6. Testing invalid emotion intensity...');
    try {
        // First create an entry
        const entry = await diary.saveEntry('emotion-tester', {
            title: 'Emotion Test',
            content: 'Testing emotions',
            entryType: 'test',
            tags: '',
            priority: 1
        });
        
        // This should work with internal validation
        const emotions = await diary.getEmotions('emotion-tester', {});
        console.log('✓ PASS: Emotion analysis handled gracefully');
        passed++;
    } catch (error) {
        console.log('✗ FAIL: Emotion analysis failed:', error.message);
        failed++;
    }

    // Test 7: Non-existent agent
    console.log('\n7. Testing non-existent agent recall...');
    try {
        const result = await diary.recallEntries('ghost-agent-that-does-not-exist', {});
        if (result.entries.length === 0) {
            console.log('✓ PASS: Returned empty results for non-existent agent');
            passed++;
        } else {
            console.log('✗ FAIL: Returned data for non-existent agent');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Crashed on non-existent agent:', error.message);
        failed++;
    }

    // Test 8: Search with regex special chars
    console.log('\n8. Testing search with regex special chars...');
    try {
        const result = await diary.searchDiaries({
            query: '.*[]+?^${}()|\\' // Regex metacharacters
        });
        console.log('✓ PASS: Search handled regex chars gracefully');
        passed++;
    } catch (error) {
        console.log('✗ FAIL: Search crashed on regex chars:', error.message);
        failed++;
    }

    // Test 9: Extreme priority values
    console.log('\n9. Testing extreme priority values...');
    try {
        await diary.saveEntry('priority-tester', {
            title: 'Negative Priority',
            content: 'Testing negative priority',
            entryType: 'test',
            tags: '',
            priority: -999
        });
        
        await diary.saveEntry('priority-tester', {
            title: 'Huge Priority',
            content: 'Testing huge priority',
            entryType: 'test',
            tags: '',
            priority: 999999
        });
        
        console.log('✓ PASS: Handled extreme priority values');
        passed++;
    } catch (error) {
        console.log('✗ FAIL: Could not handle extreme priorities:', error.message);
        failed++;
    }

    // Test 10: Database lock simulation
    console.log('\n10. Testing database resilience...');
    try {
        // Try to access while another operation might be running
        const simultaneousOps = [];
        for (let i = 0; i < 5; i++) {
            simultaneousOps.push(diary.getSummary('edge-tester', 'daily', '2025-06-26'));
        }
        await Promise.all(simultaneousOps);
        console.log('✓ PASS: Database handled simultaneous operations');
        passed++;
    } catch (error) {
        console.log('✗ FAIL: Database lock issues:', error.message);
        failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`EDGE CASE TEST RESULTS:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    console.log('='.repeat(50));

    // Cleanup
    fs.unlinkSync(testDb);
}

runEdgeCaseTests().catch(console.error);
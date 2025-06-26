#!/usr/bin/env node
import { DiaryAPI } from './lib/diary-api.js';

// Create test instance
const diary = new DiaryAPI('./test-diary.db');

async function runTests() {
  console.log('Testing Agent Diary MCP Server...\n');
  
  try {
    // Test 1: Save entry
    console.log('1. Testing saveEntry...');
    const saveResult = await diary.saveEntry('test-agent', {
      title: 'First Test Entry',
      content: 'This is a test diary entry. It contains multiple sentences to test chunking. The chunking algorithm should properly split this content if it gets too long. We want to make sure everything works correctly.',
      entryType: 'test',
      tags: 'test,first,demo',
      priority: 1
    });
    console.log('✓ Entry saved:', saveResult);
    
    // Test 2: Recall entries
    console.log('\n2. Testing recallEntries...');
    const entries = await diary.recallEntries('test-agent', {
      limit: 10
    });
    console.log('✓ Recalled entries:', entries);
    
    // Test 3: Search diaries
    console.log('\n3. Testing searchDiaries...');
    const searchResults = await diary.searchDiaries({
      query: 'test chunking'
    });
    console.log('✓ Search results:', searchResults);
    
    // Test 4: Track relationships
    console.log('\n4. Testing trackRelationships...');
    const relationship = await diary.trackRelationships('test-agent', 'helper-agent', {
      type: 'collaboration',
      context: 'Worked together on testing',
      strength: 0.8
    });
    console.log('✓ Relationship tracked:', relationship);
    
    // Test 5: Get emotions
    console.log('\n5. Testing getEmotions...');
    const emotions = await diary.getEmotions('test-agent', {});
    console.log('✓ Emotions analyzed:', emotions);
    
    // Test 6: Get summary
    console.log('\n6. Testing getSummary...');
    const summary = await diary.getSummary('test-agent', 'daily', new Date().toISOString().split('T')[0]);
    console.log('✓ Summary generated:', summary);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Clean up
    diary.close();
  }
}

runTests();
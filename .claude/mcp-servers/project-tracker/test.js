#!/usr/bin/env node
import { spawn } from 'child_process';
import { once } from 'events';
import { unlink } from 'fs/promises';

// Test utilities
let serverProcess;
let testsPassed = 0;
let testsFailed = 0;

async function startServer() {
  // Clean database before starting server
  try {
    await unlink('./tracker.db');
    console.log('🧹 Cleaned existing database');
  } catch (e) {
    // Database doesn't exist, which is fine
  }
  
  console.log('🚀 Starting project tracker MCP server...');
  serverProcess = spawn('node', ['index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('✅ Server started\n');
}

async function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    await once(serverProcess, 'exit');
    console.log('\n🛑 Server stopped');
  }
}

async function sendRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id: Math.random().toString(36).substring(7),
      method,
      params
    };
    
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    
    const handleResponse = (data) => {
      try {
        const lines = data.toString().split('\n').filter(line => line.trim());
        for (const line of lines) {
          const response = JSON.parse(line);
          if (response.id === request.id) {
            serverProcess.stdout.off('data', handleResponse);
            if (response.error) {
              reject(response.error);
            } else {
              resolve(response.result);
            }
          }
        }
      } catch (e) {
        // Ignore parse errors from server startup messages
      }
    };
    
    serverProcess.stdout.on('data', handleResponse);
    
    setTimeout(() => {
      serverProcess.stdout.off('data', handleResponse);
      reject(new Error('Request timeout'));
    }, 5000);
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

async function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

async function assertContains(actual, substring, message) {
  if (!actual.includes(substring)) {
    throw new Error(`${message}\nExpected to contain: ${substring}\nActual: ${actual}`);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Running Project Tracker MCP Tests\n');
  
  await startServer();
  
  try {
    // Test 1: List tools
    await test('Should list all 6 tools', async () => {
      const result = await sendRequest('tools/list');
      assertEqual(result.tools.length, 6, 'Should have 6 tools');
      const toolNames = result.tools.map(t => t.name).sort();
      assertEqual(toolNames, ['current', 'roadmap', 'search', 'session', 'track', 'update'].sort(), 'Should have correct tool names');
    });
    
    // Test 2: Track a new quest
    await test('Should track a new quest', async () => {
      const result = await sendRequest('tools/call', {
        name: 'track',
        arguments: {
          type: 'quest',
          id: 'test-quest-1',
          title: 'Test Claude\'s Awakening',
          session: 4,
          status: 'in_progress',
          progress: 50,
          notes: 'Testing the quest system'
        }
      });
      assertContains(result.content[0].text, '🎯', 'Should have quest emoji');
      assertContains(result.content[0].text, 'Quest', 'Should mention quest');
    });
    
    // Test 3: Track a feature
    await test('Should track a new feature', async () => {
      const result = await sendRequest('tools/call', {
        name: 'track',
        arguments: {
          type: 'feature',
          id: 'minimap-system',
          title: 'Implement Minimap System',
          session: 3.5,
          status: 'planned',
          progress: 0,
          priority: 'high',
          notes: 'Chris wants BIGGER MAPS!'
        }
      });
      assertContains(result.content[0].text, '🛠️', 'Should have feature emoji');
    });
    
    // Test 4: Track a bug
    await test('Should track a bug', async () => {
      const result = await sendRequest('tools/call', {
        name: 'track',
        arguments: {
          type: 'bug',
          id: 'invisible-claude',
          title: 'Claude invisible in Binary Forest',
          session: 3.8,
          status: 'completed',
          progress: 100,
          priority: 'critical'
        }
      });
      assertContains(result.content[0].text, '⚔️', 'Should have bug vanquished emoji');
      assertContains(result.content[0].text, 'Vanquished', 'Should celebrate bug fix');
    });
    
    // Test 5: Get current items
    await test('Should get current in-progress items', async () => {
      const result = await sendRequest('tools/call', {
        name: 'current',
        arguments: {}
      });
      assertContains(result.content[0].text, 'Test Claude\'s Awakening', 'Should show in-progress quest');
      assertContains(result.content[0].text, '50%', 'Should show progress');
    });
    
    // Test 6: Get session items
    await test('Should get items for session 3.5', async () => {
      const result = await sendRequest('tools/call', {
        name: 'session',
        arguments: { number: 3.5 }
      });
      assertContains(result.content[0].text, 'Minimap System', 'Should show session 3.5 feature');
    });
    
    // Test 7: Search items
    await test('Should search for items', async () => {
      const result = await sendRequest('tools/call', {
        name: 'search',
        arguments: { query: 'Claude' }
      });
      assertContains(result.content[0].text, 'Test Claude\'s Awakening', 'Should find quest');
      assertContains(result.content[0].text, 'invisible', 'Should find bug');
    });
    
    // Test 8: Update item progress
    await test('Should update item progress', async () => {
      const result = await sendRequest('tools/call', {
        name: 'update',
        arguments: {
          id: 'test-quest-1',
          updates: {
            progress: 100,
            status: 'completed'
          }
        }
      });
      assertContains(result.content[0].text, '🎉', 'Should celebrate completion');
      assertContains(result.content[0].text, 'Complete', 'Should mention completion');
    });
    
    // Test 9: Get roadmap overview
    await test('Should get roadmap overview', async () => {
      const result = await sendRequest('tools/call', {
        name: 'roadmap',
        arguments: {}
      });
      assertContains(result.content[0].text, 'Tales of Claude', 'Should show project name');
      assertContains(result.content[0].text, 'Session', 'Should show sessions');
    });
    
    // Test 10: Track a milestone
    await test('Should track a milestone', async () => {
      const result = await sendRequest('tools/call', {
        name: 'track',
        arguments: {
          type: 'milestone',
          id: 'session-4-complete',
          title: 'Session 4: Content Expansion Complete',
          session: 4,
          status: 'completed',
          progress: 100,
          notes: 'All NPCs implemented!'
        }
      });
      assertContains(result.content[0].text, '🌟', 'Should have milestone emoji');
      assertContains(result.content[0].text, 'Milestone', 'Should mention milestone');
    });
    
  } finally {
    await stopServer();
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${Math.round(testsPassed / (testsPassed + testsFailed) * 100)}%`);
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(console.error);
#!/usr/bin/env node
// Simple test script to verify the MCP server works

import { spawn } from 'child_process';
import readline from 'readline';

console.log('Starting Team Memory MCP Server test...\n');

// Start the server
const server = spawn('node', ['index.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

const rl = readline.createInterface({
  input: server.stdout,
  output: process.stdout
});

// Helper to send JSON-RPC request
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };
  
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Wait a bit for server to start
setTimeout(() => {
  console.log('Testing MCP server functions...\n');
  
  // Test sequence
  const tests = [
    () => {
      console.log('1. Testing save function...');
      sendRequest('tools/call', {
        name: 'save',
        arguments: {
          key: 'test movement bug',
          value: 'Fixed collision detection in Player.ts line 42',
          agent: 'TestAgent'
        }
      });
    },
    () => {
      console.log('\n2. Testing recall function...');
      sendRequest('tools/call', {
        name: 'recall',
        arguments: {
          query: 'movement'
        }
      });
    },
    () => {
      console.log('\n3. Testing check function...');
      sendRequest('tools/call', {
        name: 'check',
        arguments: {
          task: 'movement bug'
        }
      });
    },
    () => {
      console.log('\n4. Testing report function...');
      sendRequest('tools/call', {
        name: 'report',
        arguments: {}
      });
    },
    () => {
      console.log('\n5. Testing consolidate function...');
      sendRequest('tools/call', {
        name: 'consolidate',
        arguments: {}
      });
    }
  ];
  
  // Run tests sequentially
  let testIndex = 0;
  const runNextTest = () => {
    if (testIndex < tests.length) {
      tests[testIndex]();
      testIndex++;
      setTimeout(runNextTest, 1000);
    } else {
      console.log('\nAll tests completed!');
      server.kill();
      process.exit(0);
    }
  };
  
  runNextTest();
}, 1000);

// Handle server output
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    if (response.result) {
      console.log('Response:', JSON.stringify(response.result, null, 2));
    }
  } catch (e) {
    // Not JSON, just log it
    console.log(line);
  }
});

// Handle exit
process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});
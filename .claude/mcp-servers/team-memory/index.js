#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = path.join(__dirname, '../../../memory');

// Ensure memory directory exists
await fs.mkdir(MEMORY_DIR, { recursive: true });

// Helper functions
async function loadMemory() {
  try {
    const files = await fs.readdir(MEMORY_DIR);
    const memories = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(MEMORY_DIR, file), 'utf8');
        memories.push(...JSON.parse(content));
      }
    }
    
    return memories;
  } catch (error) {
    return [];
  }
}

async function saveMemory(memories) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `memory-${timestamp}.json`;
  await fs.writeFile(
    path.join(MEMORY_DIR, filename),
    JSON.stringify(memories, null, 2)
  );
}

// Create server
const server = new Server({
  name: 'team-memory',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'save',
      description: 'Store a solution that worked',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Problem/task identifier' },
          value: { type: 'string', description: 'Solution that worked' },
          agent: { type: 'string', description: 'Agent who found the solution' }
        },
        required: ['key', 'value', 'agent']
      }
    },
    {
      name: 'recall',
      description: 'Get relevant past solutions',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What to search for' }
        },
        required: ['query']
      }
    },
    {
      name: 'check',
      description: 'Check if we\'ve solved this before',
      inputSchema: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'Task to check' }
        },
        required: ['task']
      }
    },
    {
      name: 'consolidate',
      description: 'Merge duplicate solutions/agents',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'report',
      description: 'Show learning metrics',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }
  ]
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'save': {
      const memories = await loadMemory();
      const newMemory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        key: args.key,
        value: args.value,
        agent: args.agent,
        uses: 0
      };
      
      memories.push(newMemory);
      await saveMemory(memories);
      
      return {
        content: [{
          type: 'text',
          text: `Saved solution for "${args.key}" by ${args.agent}`
        }]
      };
    }
    
    case 'recall': {
      const memories = await loadMemory();
      const query = args.query.toLowerCase();
      
      const relevant = memories.filter(m => 
        m.key.toLowerCase().includes(query) || 
        m.value.toLowerCase().includes(query) ||
        m.agent.toLowerCase().includes(query)
      );
      
      // Update use count
      for (const memory of relevant) {
        memory.uses++;
      }
      await saveMemory(memories);
      
      if (relevant.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No relevant solutions found.'
          }]
        };
      }
      
      const results = relevant.map(m => 
        `[${m.agent}] ${m.key}: ${m.value} (used ${m.uses} times)`
      ).join('\n\n');
      
      return {
        content: [{
          type: 'text',
          text: `Found ${relevant.length} relevant solutions:\n\n${results}`
        }]
      };
    }
    
    case 'check': {
      const memories = await loadMemory();
      const task = args.task.toLowerCase();
      
      const existing = memories.filter(m => 
        m.key.toLowerCase().includes(task) || 
        m.value.toLowerCase().includes(task)
      );
      
      if (existing.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No previous solutions found for this task.'
          }]
        };
      }
      
      const solutions = existing.map(m => 
        `${m.agent} solved "${m.key}" with: ${m.value}`
      ).join('\n');
      
      return {
        content: [{
          type: 'text',
          text: `Found ${existing.length} previous solutions:\n${solutions}`
        }]
      };
    }
    
    case 'consolidate': {
      const memories = await loadMemory();
      const consolidated = [];
      const seen = new Map();
      
      for (const memory of memories) {
        const key = `${memory.key.toLowerCase()}-${memory.value.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.set(key, memory);
          consolidated.push(memory);
        } else {
          // Keep the one with more uses
          const existing = seen.get(key);
          if (memory.uses > existing.uses) {
            const index = consolidated.indexOf(existing);
            consolidated[index] = memory;
            seen.set(key, memory);
          }
        }
      }
      
      const removed = memories.length - consolidated.length;
      await saveMemory(consolidated);
      
      return {
        content: [{
          type: 'text',
          text: `Consolidation complete. Removed ${removed} duplicate solutions. ${consolidated.length} unique solutions remain.`
        }]
      };
    }
    
    case 'report': {
      const memories = await loadMemory();
      
      if (memories.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No memories stored yet.'
          }]
        };
      }
      
      // Calculate metrics
      const agentCounts = {};
      const topSolutions = memories.sort((a, b) => b.uses - a.uses).slice(0, 5);
      let totalUses = 0;
      
      for (const memory of memories) {
        agentCounts[memory.agent] = (agentCounts[memory.agent] || 0) + 1;
        totalUses += memory.uses;
      }
      
      const agentStats = Object.entries(agentCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([agent, count]) => `${agent}: ${count} solutions`)
        .join('\n');
      
      const topList = topSolutions.map(m => 
        `"${m.key}" by ${m.agent} (${m.uses} uses)`
      ).join('\n');
      
      return {
        content: [{
          type: 'text',
          text: `Team Memory Report:
          
Total Solutions: ${memories.length}
Total Uses: ${totalUses}
Average Uses per Solution: ${(totalUses / memories.length).toFixed(1)}

Top Contributors:
${agentStats}

Most Used Solutions:
${topList}`
        }]
      };
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Team Memory MCP server running...');
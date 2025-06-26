#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { DiaryAPI } from './lib/diary-api.js';

// Initialize DiaryAPI with database path from environment
const dbPath = process.env.AGENT_DIARY_DB_PATH || './memory/agent_diary.db';
const diary = new DiaryAPI(dbPath);

// Create server
const server = new Server({
  name: 'agent-diary',
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
      name: 'saveEntry',
      description: 'Save diary entry with automatic chunking',
      inputSchema: {
        type: 'object',
        properties: {
          agentName: { type: 'string', description: 'Name of the agent' },
          title: { type: 'string', description: 'Entry title' },
          content: { type: 'string', description: 'Entry content' },
          entryType: { type: 'string', description: 'Type of entry (general, task, reflection, etc.)', default: 'general' },
          tags: { type: 'string', description: 'Comma-separated tags' },
          priority: { type: 'number', description: 'Priority level (0=normal, 1=important, 2=critical)', default: 0 }
        },
        required: ['agentName', 'title', 'content']
      }
    },
    {
      name: 'recallEntries',
      description: 'Query specific entries with filters',
      inputSchema: {
        type: 'object',
        properties: {
          agentName: { type: 'string', description: 'Agent name to filter by' },
          query: { type: 'string', description: 'Search query' },
          dateStart: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          dateEnd: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          entryType: { type: 'string', description: 'Entry type filter' },
          limit: { type: 'number', description: 'Maximum number of results', default: 10 },
          offset: { type: 'number', description: 'Results offset for pagination', default: 0 }
        },
        required: ['agentName']
      }
    },
    {
      name: 'searchDiaries',
      description: 'Full-text search across all diaries',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          agentFilter: { type: 'string', description: 'Filter by agent name' },
          typeFilter: { type: 'string', description: 'Filter by entry type' },
          limit: { type: 'number', description: 'Maximum number of results', default: 10 },
          offset: { type: 'number', description: 'Results offset for pagination', default: 0 }
        },
        required: ['query']
      }
    },
    {
      name: 'getSummary',
      description: 'Get agent summaries (daily/weekly/monthly)',
      inputSchema: {
        type: 'object',
        properties: {
          agentName: { type: 'string', description: 'Agent name' },
          summaryType: { type: 'string', description: 'Summary type (daily, weekly, monthly)', default: 'daily' },
          date: { type: 'string', description: 'Date for summary (YYYY-MM-DD)' },
          autoGenerate: { type: 'boolean', description: 'Auto-generate if not exists', default: true }
        },
        required: ['agentName']
      }
    },
    {
      name: 'trackRelationships',
      description: 'Update cross-agent relationships',
      inputSchema: {
        type: 'object',
        properties: {
          fromAgent: { type: 'string', description: 'Source agent name' },
          toAgent: { type: 'string', description: 'Target agent name' },
          relationshipType: { type: 'string', description: 'Type of relationship (collaboration, mention, etc.)' },
          context: { type: 'string', description: 'Context description' },
          strength: { type: 'number', description: 'Relationship strength (0.0-1.0)', default: 0.5 }
        },
        required: ['fromAgent', 'toAgent', 'relationshipType']
      }
    },
    {
      name: 'getEmotions',
      description: 'Get emotion analysis for entries',
      inputSchema: {
        type: 'object',
        properties: {
          agentName: { type: 'string', description: 'Agent name' },
          dateStart: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          dateEnd: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          emotionType: { type: 'string', description: 'Filter by emotion type' }
        },
        required: ['agentName']
      }
    }
  ]
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'saveEntry': {
        const result = await diary.saveEntry(args.agentName, {
          title: args.title,
          content: args.content,
          entryType: args.entryType || 'general',
          tags: args.tags,
          priority: args.priority || 0
        });
        
        return {
          content: [{
            type: 'text',
            text: `Entry saved successfully! ID: ${result.entryId}, Chunks: ${result.chunkCount}, Total characters: ${result.totalChars}`
          }]
        };
      }
      
      case 'recallEntries': {
        const entries = await diary.recallEntries(args.agentName, {
          query: args.query,
          dateStart: args.dateStart,
          dateEnd: args.dateEnd,
          entryType: args.entryType,
          limit: args.limit || 10,
          offset: args.offset || 0
        });
        
        if (!entries.entries || entries.entries.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No entries found matching your criteria.'
            }]
          };
        }
        
        const formatted = entries.entries.map(entry => 
          `**${entry.title}** (${entry.entry_date}) [${entry.entry_type}]\n` +
          `Tags: ${entry.tags || 'none'}\n` +
          `${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}\n`
        ).join('\n---\n');
        
        return {
          content: [{
            type: 'text',
            text: `Found ${entries.entries.length} entries (${entries.hasMore ? 'more available' : 'all results'}):\n\n${formatted}`
          }]
        };
      }
      
      case 'searchDiaries': {
        const results = await diary.searchDiaries({
          query: args.query,
          agentFilter: args.agentFilter,
          typeFilter: args.typeFilter,
          limit: args.limit || 10,
          offset: args.offset || 0
        });
        
        if (!results.results || results.results.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No entries found matching your search.'
            }]
          };
        }
        
        const formatted = results.results.map(result => 
          `**${result.title}** by ${result.agent_name} (${result.entry_date})\n` +
          `Type: ${result.entry_type} | Tags: ${result.tags || 'none'}\n` +
          `${result.content.substring(0, 200)}${result.content.length > 200 ? '...' : ''}\n`
        ).join('\n---\n');
        
        return {
          content: [{
            type: 'text',
            text: `Found ${results.results.length} entries for query "${results.query}":\n\n${formatted}`
          }]
        };
      }
      
      case 'getSummary': {
        const summary = await diary.getSummary(
          args.agentName,
          args.summaryType || 'daily',
          args.date || new Date().toISOString().split('T')[0]
        );
        
        if (!summary) {
          return {
            content: [{
              type: 'text',
              text: 'No summary available for the specified criteria.'
            }]
          };
        }
        
        return {
          content: [{
            type: 'text',
            text: `**${summary.title}**\n\n${summary.content}\n\n` +
                  `Generated: ${summary.created_at} | Sources: ${summary.source_count} | Words: ${summary.word_count}`
          }]
        };
      }
      
      case 'trackRelationships': {
        const relationship = await diary.trackRelationships(
          args.fromAgent,
          args.toAgent,
          {
            type: args.relationshipType,
            context: args.context,
            strength: args.strength || 0.5
          }
        );
        
        return {
          content: [{
            type: 'text',
            text: `Relationship tracked: ${relationship.relationship.from} → ${relationship.relationship.to} (${relationship.relationship.type})\n` +
                  `Strength: ${relationship.relationship.strength.toFixed(2)} | Context: ${relationship.relationship.context || 'None'}`
          }]
        };
      }
      
      case 'getEmotions': {
        const emotions = await diary.getEmotions(args.agentName, {
          dateStart: args.dateStart,
          dateEnd: args.dateEnd,
          emotionType: args.emotionType
        });
        
        if (!emotions.emotions || emotions.emotions.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No emotion data found for the specified criteria.'
            }]
          };
        }
        
        const formatted = emotions.emotions.map(emotion => 
          `${emotion.emotion_type}: ${(emotion.intensity * 100).toFixed(1)}% ` +
          `(confidence: ${(emotion.confidence * 100).toFixed(1)}%) - ${emotion.entry_title}`
        ).join('\n');
        
        return {
          content: [{
            type: 'text',
            text: `Emotion analysis for ${args.agentName}:\n\n${formatted}\n\nAverage mood: ${emotions.summary.averageMood.toFixed(2)}`
          }]
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error in ${name}:`, error);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }]
    };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Agent Diary MCP server running...');
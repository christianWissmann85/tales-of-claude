#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import Database from 'better-sqlite3';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize database
const db = new Database(path.join(__dirname, 'tracker.db'));

// Load schema
const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Roadmap sessions mapping
const ROADMAP_SESSIONS = {
  3.5: "Map & Content Expansion",
  3.7: "Visual Feedback Systems", 
  3.8: "System Correction",
  3.9: "The Great Refactor",
  4: "Content & Story Expansion",
  5: "Advanced Combat Mechanics",
  6: "AI & Dynamic Systems",
  7: "Exploration Mechanics",
  8: "Social Systems",
  9: "Economy & Trading",
  10: "Endgame Content",
  11: "Companion System",
  12: "Environmental Storytelling",
  13: "Advanced UI/UX",
  14: "Multiplayer Foundation",
  15: "Community Features",
  16: "Mod Support",
  17: "Performance Optimization",
  18: "Accessibility",
  19: "Polish & Game Feel",
  20: "Marketing & Launch Prep",
  21: "Post-Launch Support"
};

// Helper functions
function getOverallProgress() {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM project_items
  `).get();
  
  if (!stats.total) return 0;
  return Math.round((stats.completed / stats.total) * 100);
}

function getMilestoneMessage(progress) {
  if (progress >= 100) return "🎉 VICTORY! The journey is complete! Tales of Claude stands triumphant!";
  if (progress >= 75) return "🌟 75% Milestone! The finish line beckons! The Code Realm's transformation nears completion!";
  if (progress >= 50) return "🌟 HALFWAY THERE! The Code Realm transformation is 50% complete! Chris's dreams are becoming reality!";
  if (progress >= 25) return "🌟 25% Milestone! The foundation is set! The adventure truly begins!";
  return null;
}

function generateNarrative(type, status, title, isNew = true) {
  // Special case: new item that's already completed
  if (isNew && status === 'completed') {
    switch (type) {
      case 'quest': return `🎉 Quest Complete! ${title} has been achieved!`;
      case 'feature': return `✨ Feature Complete! ${title} now graces the Code Realm!`;
      case 'bug': return `⚔️ Bug Vanquished! The Code Realm grows more stable!`;
      case 'milestone': return `🎊 Milestone Achieved! ${title} marks a new era!`;
      default: return `✅ ${type} completed: ${title}`;
    }
  } else if (isNew) {
    switch (type) {
      case 'quest': return `🎯 Quest Initiated! The journey to ${title} begins...`;
      case 'feature': return `🛠️ Feature Forged! New powers emerge from the digital void!`;
      case 'bug': return `🐛 Bug Detected! A glitch in the Code Realm needs fixing!`;
      case 'milestone': return `🌟 Milestone Set! A new chapter awaits!`;
      default: return `📝 New ${type} tracked: ${title}`;
    }
  } else if (status === 'completed') {
    switch (type) {
      case 'quest': return `🎉 Quest Complete! ${title} has been achieved!`;
      case 'feature': return `✨ Feature Complete! ${title} now graces the Code Realm!`;
      case 'bug': return `⚔️ Bug Vanquished! The Code Realm grows more stable!`;
      case 'milestone': return `🎊 Milestone Achieved! ${title} marks a new era!`;
      default: return `✅ ${type} completed: ${title}`;
    }
  } else if (status === 'in_progress') {
    return `🚀 Progress continues on ${title}!`;
  } else if (status === 'blocked') {
    return `🛑 ${title} has hit a roadblock!`;
  }
  return `📝 ${title} updated`;
}

// Create server
const server = new Server({
  name: 'project-tracker',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'track',
      description: 'Track a project item (quest, feature, bug, milestone)',
      inputSchema: {
        type: 'object',
        properties: {
          type: { 
            type: 'string', 
            enum: ['quest', 'feature', 'bug', 'milestone'],
            description: 'Type of project item'
          },
          id: { 
            type: 'string',
            description: 'Unique identifier for the item'
          },
          title: { 
            type: 'string',
            description: 'Title of the item'
          },
          session: { 
            type: 'number',
            description: 'Session number (e.g., 3.5, 4, 11)'
          },
          status: { 
            type: 'string', 
            enum: ['planned', 'in_progress', 'completed', 'blocked'],
            description: 'Current status'
          },
          progress: { 
            type: 'integer',
            minimum: 0,
            maximum: 100,
            description: 'Progress percentage'
          },
          notes: { 
            type: 'string',
            description: 'Additional notes'
          },
          priority: { 
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low'],
            description: 'Priority level'
          }
        },
        required: ['type', 'id', 'title']
      }
    },
    {
      name: 'current',
      description: 'Get current active items',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'session',
      description: 'Get items for a specific session',
      inputSchema: {
        type: 'object',
        properties: {
          number: { 
            type: 'number',
            description: 'Session number'
          }
        },
        required: ['number']
      }
    },
    {
      name: 'roadmap',
      description: 'Get roadmap overview with progress',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'search',
      description: 'Search items by text',
      inputSchema: {
        type: 'object',
        properties: {
          query: { 
            type: 'string',
            description: 'Search query'
          }
        },
        required: ['query']
      }
    },
    {
      name: 'update',
      description: 'Update an existing item',
      inputSchema: {
        type: 'object',
        properties: {
          id: { 
            type: 'string',
            description: 'Item ID to update'
          },
          updates: {
            type: 'object',
            properties: {
              status: { 
                type: 'string',
                enum: ['planned', 'in_progress', 'completed', 'blocked']
              },
              progress: { 
                type: 'integer',
                minimum: 0,
                maximum: 100
              },
              notes: { type: 'string' },
              priority: { 
                type: 'string',
                enum: ['critical', 'high', 'medium', 'low']
              }
            }
          }
        },
        required: ['id', 'updates']
      }
    }
  ]
}));

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'track': {
        const { type, id, title, session, status = 'planned', progress = 0, notes = '', priority = 'medium' } = args;
        
        // Check if item exists
        const existing = db.prepare('SELECT * FROM project_items WHERE id = ?').get(id);
        
        if (existing) {
          // Update existing
          db.prepare(`
            UPDATE project_items 
            SET type = ?, title = ?, session = ?, status = ?, progress = ?, 
                notes = ?, priority = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(type, title, session, status, progress, notes, priority, id);
        } else {
          // Insert new
          db.prepare(`
            INSERT INTO project_items (id, type, title, session, status, progress, notes, priority, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).run(id, type, title, session, status, progress, notes, priority);
        }
        
        // Generate appropriate narrative based on whether item is new and its status
        const narrative = generateNarrative(type, status, title, !existing);
        const overallProgress = getOverallProgress();
        const milestone = getMilestoneMessage(overallProgress);
        
        let response = narrative;
        if (milestone) response += `\n\n${milestone}`;
        response += `\n\nOverall Progress: ${overallProgress}%`;
        
        return {
          content: [{
            type: 'text',
            text: response
          }]
        };
      }
      
      case 'current': {
        const items = db.prepare(`
          SELECT * FROM project_items 
          WHERE status IN ('in_progress', 'planned')
          ORDER BY 
            CASE priority 
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              WHEN 'low' THEN 4
            END,
            session ASC
        `).all();
        
        if (!items.length) {
          return {
            content: [{
              type: 'text',
              text: '📋 No active items found. Time to plan the next adventure!'
            }]
          };
        }
        
        let response = '🎯 Current Active Items:\n\n';
        for (const item of items) {
          const sessionName = ROADMAP_SESSIONS[item.session] || `Session ${item.session}`;
          response += `• [${item.id}] ${item.title}\n`;
          response += `  Type: ${item.type} | Status: ${item.status} | Progress: ${item.progress}%\n`;
          response += `  Session: ${sessionName}\n`;
          response += `  Priority: ${item.priority}\n`;
          if (item.notes) response += `  Notes: ${item.notes}\n`;
          response += '\n';
        }
        
        return {
          content: [{
            type: 'text',
            text: response
          }]
        };
      }
      
      case 'session': {
        const { number } = args;
        const items = db.prepare(`
          SELECT * FROM project_items 
          WHERE session = ?
          ORDER BY createdAt ASC
        `).all(number);
        
        const sessionName = ROADMAP_SESSIONS[number] || `Session ${number}`;
        
        if (!items.length) {
          return {
            content: [{
              type: 'text',
              text: `📂 No items found for ${sessionName} (Session ${number})`
            }]
          };
        }
        
        // Calculate session progress
        const completed = items.filter(i => i.status === 'completed').length;
        const sessionProgress = Math.round((completed / items.length) * 100);
        
        let response = `📊 ${sessionName} (Session ${number})\n`;
        response += `Progress: ${sessionProgress}% (${completed}/${items.length} completed)\n\n`;
        
        for (const item of items) {
          const icon = item.status === 'completed' ? '✅' : 
                       item.status === 'in_progress' ? '🚀' :
                       item.status === 'blocked' ? '🛑' : '📋';
          response += `${icon} [${item.id}] ${item.title}\n`;
          response += `   Type: ${item.type} | Progress: ${item.progress}%\n`;
          if (item.notes) response += `   Notes: ${item.notes}\n`;
          response += '\n';
        }
        
        return {
          content: [{
            type: 'text',
            text: response
          }]
        };
      }
      
      case 'roadmap': {
        const items = db.prepare('SELECT * FROM project_items ORDER BY session ASC').all();
        
        if (!items.length) {
          return {
            content: [{
              type: 'text',
              text: '🗺️ The roadmap awaits! Start tracking items to see your journey unfold.'
            }]
          };
        }
        
        // Group by session
        const sessions = {};
        for (const item of items) {
          const key = item.session || 0;
          if (!sessions[key]) {
            sessions[key] = { total: 0, completed: 0, items: [] };
          }
          sessions[key].total++;
          if (item.status === 'completed') sessions[key].completed++;
          sessions[key].items.push(item);
        }
        
        let response = '🗺️ Tales of Claude - Project Roadmap\n';
        response += '═══════════════════════════════════\n\n';
        
        const overallProgress = getOverallProgress();
        response += `📊 Overall Progress: ${overallProgress}%\n`;
        response += `${'█'.repeat(Math.floor(overallProgress / 5))}${'░'.repeat(20 - Math.floor(overallProgress / 5))}\n\n`;
        
        // Sort sessions numerically
        const sortedSessions = Object.keys(sessions).map(Number).sort((a, b) => a - b);
        
        for (const sessionNum of sortedSessions) {
          const session = sessions[sessionNum];
          const sessionName = ROADMAP_SESSIONS[sessionNum] || `Session ${sessionNum}`;
          const progress = Math.round((session.completed / session.total) * 100);
          
          response += `📍 ${sessionName}`;
          if (sessionNum > 0) response += ` (Session ${sessionNum})`;
          response += '\n';
          response += `   Progress: ${progress}% (${session.completed}/${session.total})\n`;
          response += `   ${'█'.repeat(Math.floor(progress / 10))}${'░'.repeat(10 - Math.floor(progress / 10))}\n\n`;
        }
        
        const milestone = getMilestoneMessage(overallProgress);
        if (milestone) response += `\n${milestone}`;
        
        return {
          content: [{
            type: 'text',
            text: response
          }]
        };
      }
      
      case 'search': {
        const { query } = args;
        const searchPattern = `%${query}%`;
        
        const items = db.prepare(`
          SELECT * FROM project_items 
          WHERE title LIKE ? OR description LIKE ? OR notes LIKE ?
          ORDER BY updatedAt DESC
        `).all(searchPattern, searchPattern, searchPattern);
        
        if (!items.length) {
          return {
            content: [{
              type: 'text',
              text: `🔍 No items found matching "${query}"`
            }]
          };
        }
        
        let response = `🔍 Found ${items.length} items matching "${query}":\n\n`;
        for (const item of items) {
          response += `• [${item.id}] ${item.title}\n`;
          response += `  Type: ${item.type} | Status: ${item.status} | Session: ${item.session || 'N/A'}\n`;
          if (item.notes && item.notes.includes(query)) {
            response += `  Notes: ...${item.notes.substring(
              Math.max(0, item.notes.indexOf(query) - 20),
              Math.min(item.notes.length, item.notes.indexOf(query) + query.length + 20)
            )}...\n`;
          }
          response += '\n';
        }
        
        return {
          content: [{
            type: 'text',
            text: response
          }]
        };
      }
      
      case 'update': {
        const { id, updates } = args;
        
        const existing = db.prepare('SELECT * FROM project_items WHERE id = ?').get(id);
        if (!existing) {
          return {
            content: [{
              type: 'text',
              text: `❌ Item with ID "${id}" not found`
            }]
          };
        }
        
        // Build update query
        const updateFields = [];
        const values = [];
        
        if (updates.status !== undefined) {
          updateFields.push('status = ?');
          values.push(updates.status);
        }
        if (updates.progress !== undefined) {
          updateFields.push('progress = ?');
          values.push(updates.progress);
        }
        if (updates.notes !== undefined) {
          updateFields.push('notes = ?');
          values.push(updates.notes);
        }
        if (updates.priority !== undefined) {
          updateFields.push('priority = ?');
          values.push(updates.priority);
        }
        
        if (updateFields.length === 0) {
          return {
            content: [{
              type: 'text',
              text: '❌ No valid updates provided'
            }]
          };
        }
        
        updateFields.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);
        
        db.prepare(`
          UPDATE project_items 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `).run(...values);
        
        // Get updated item
        const updated = db.prepare('SELECT * FROM project_items WHERE id = ?').get(id);
        
        let response = generateNarrative(updated.type, updated.status, updated.title, false);
        
        // Check for milestone if status changed to completed
        if (updates.status === 'completed') {
          const overallProgress = getOverallProgress();
          const milestone = getMilestoneMessage(overallProgress);
          if (milestone) response += `\n\n${milestone}`;
          response += `\n\nOverall Progress: ${overallProgress}%`;
        }
        
        return {
          content: [{
            type: 'text',
            text: response
          }]
        };
      }
      
      default:
        return {
          content: [{
            type: 'text',
            text: `Unknown tool: ${name}`
          }]
        };
    }
  } catch (error) {
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
console.error('Project Tracker MCP Server running...');
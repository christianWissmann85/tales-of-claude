# 🎯 Project Tracker MCP Server

A narrative-driven project tracking system that chronicles your development journey through Tales of Claude!

## 🌟 Features

- **Persistent Tracking**: Unlike TodoWrite, tracks progress across entire project lifecycle
- **Narrative Flair**: Story-driven status messages that celebrate achievements
- **Roadmap Integration**: Links directly to 21-session development plan
- **Smart Search**: Full-text search across all project items
- **Visual Progress**: See your journey unfold with progress percentages
- **Type Support**: Quests, Features, Bugs, and Milestones

## 🚀 Installation

```bash
cd .claude/mcp-servers/project-tracker
npm install
```

## 🎮 Usage

### Start the Server
```bash
npm start
```

### Add to .mcp.json
```json
{
  "mcpServers": {
    "project-tracker": {
      "command": "node",
      "args": [".claude/mcp-servers/project-tracker/index.js"],
      "cwd": "/path/to/tales-of-claude"
    }
  }
}
```

## 📡 API Reference

### Track Progress
```javascript
await project.track({
  type: "quest",        // quest | feature | bug | milestone
  id: "companion-system",
  title: "Implement Companion System", 
  session: 11,          // Links to roadmap session
  status: "in_progress", // planned | in_progress | completed | blocked
  progress: 65,         // 0-100 percentage
  notes: "Basic AI implemented"
})
```

### Get Current Focus
```javascript
await project.current()
// Returns all active (in_progress) items
```

### Session Overview
```javascript
await project.session(11)
// Returns all items for Session 11
```

### Roadmap Status
```javascript
await project.roadmap()
// Returns roadmap overview with progress
```

### Search History
```javascript
await project.search("companion")
// Full-text search across all items
```

### Update Item
```javascript
await project.update("companion-system", {
  status: "completed",
  progress: 100
})
```

## 🎭 Narrative Messages

Instead of boring status updates, enjoy:
- 🎯 "Quest Initiated! The journey begins..."
- 🛠️ "Feature Forged! New powers emerge!"
- ⚔️ "Bug Vanquished! The Code Realm stabilizes!"
- 🌟 "Milestone Achieved! A new chapter unfolds!"

## 🏗️ Database Schema

- **project_items**: Main tracking table
- **sessions**: Session metadata
- **milestones**: Major achievements
- **items_fts**: Full-text search index

## 🧪 Testing

```bash
npm test
```

Runs comprehensive test suite covering all 6 endpoints.

## 📊 Token Efficiency

- Average query: ~500 tokens
- Full roadmap read: ~25,000 tokens
- **Savings**: 98% token reduction!

## 🎉 Milestones & Celebrations

The tracker celebrates major achievements:
- 25% - "The foundation is set!"
- 50% - "Halfway to glory!"
- 75% - "The finish line beckons!"
- 100% - "VICTORY! The journey is complete!"

## 💡 Patricia's Implementation Notes

Built with love by Patricia, focusing on:
- **Learning**: Every query teaches the system
- **Adaptation**: Narrative messages evolve
- **Intelligence**: Smart progress tracking
- **Joy**: Making development fun!

*"Every line of code tells a story. This tracker ensures no story is forgotten."*
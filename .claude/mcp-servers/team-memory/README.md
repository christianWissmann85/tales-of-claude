# Team Memory MCP Server

A simple MCP server that gives our AI team persistent memory for solutions!

## What It Does

Stores and recalls solutions that worked, preventing duplicate problem-solving across 95+ agents.

## Installation

```bash
cd .claude/mcp-servers/team-memory
npm install
```

## Usage with Claude Code CLI

### Configuration

Since you're using Claude Code CLI (not Claude Desktop), the MCP tool will be available automatically once the server is running. Claude Code CLI handles MCP discovery!

### Running the Server

```bash
cd .claude/mcp-servers/team-memory
node index.js
```

The server will start and Claude Code will detect it automatically.

### Available Functions

#### 1. Save a Solution
```
save(key: "player movement bug", value: "Fixed by updating collision detection in Player.ts", agent: "Ivan")
```

#### 2. Recall Solutions
```
recall(query: "movement")
// Returns: All solutions related to movement issues
```

#### 3. Check if Solved Before
```
check(task: "fix inventory display")
// Returns: Previous solutions for inventory display issues
```

#### 4. Consolidate Duplicates
```
consolidate()
// Removes duplicate solutions, keeping the most-used ones
```

#### 5. Get Learning Report
```
report()
// Shows metrics: total solutions, top contributors, most-used solutions
```

## Storage

Solutions are stored in `.claude/memory/*.json` files with this structure:

```json
{
  "id": "1234567890",
  "timestamp": "2025-06-25T12:00:00Z",
  "key": "problem identifier",
  "value": "solution that worked",
  "agent": "agent name",
  "uses": 5
}
```

## Examples

### Annie (Team Lead) Usage
```
// Before assigning a task
check("implement minimap")
// If solutions exist, share them with the assigned agent

// After an agent succeeds
save("minimap rendering", "Used canvas overlay with chunk-based updates", "Marcus")
```

### Agent Usage
```
// At task start
recall("quest system")
// Learn from past solutions

// After finding a solution
save("quest completion bug", "Added state validation in QuestManager", "Frank")
```

## Benefits

1. **No More Duplicate Work**: Check if someone already solved it
2. **Knowledge Sharing**: Solutions from one agent help others
3. **Learning Metrics**: See who's contributing and what's most useful
4. **Simple Storage**: Just JSON files, easy to backup/share

## Testing

```bash
# Start the server
node index.js

# In another terminal, test with MCP client
# Or use directly in Claude Desktop after configuration
```

## Future Ideas (Not Implemented)

- Semantic search (current is keyword-based)
- Auto-categorization
- Solution ratings
- Team-specific memories

Remember: Like delegate, this is built to WORK, not be perfect!
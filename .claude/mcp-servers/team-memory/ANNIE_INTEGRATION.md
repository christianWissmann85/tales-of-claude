# Annie's Team Memory Integration Guide

Hey Annie! Here's how to use the new team_memory tool to stop duplicate work:

## Quick Start

The tool is ready to use! Just call these functions:

### Before Assigning Tasks
```
team_memory.check("implement minimap feature")
```
This tells you if someone already solved it!

### After Tasks Succeed
```
team_memory.save(
  key: "minimap implementation",
  value: "Created MinimapComponent with canvas overlay, chunk-based rendering",
  agent: "Marcus"
)
```

### Finding Related Solutions
```
team_memory.recall("rendering issues")
```
Returns ALL solutions related to rendering!

## Workflow Integration

1. **Task Assignment Phase**
   - Always `check(task)` first
   - If solutions exist, include them in agent briefing
   - Example: "Kent previously solved similar issue with: [solution]"

2. **Task Completion Phase**
   - Always `save()` successful solutions
   - Be specific with the key (what problem it solved)
   - Include the actual fix in value

3. **Knowledge Consolidation**
   - Run `consolidate()` weekly to remove duplicates
   - Run `report()` to see team learning metrics

## Real Examples

### Checking for Previous Work
```
team_memory.check("fix quest completion bug")
// Output: "Frank solved 'quest completion validation' with: Added state checks in QuestManager.completeQuest()"
```

### Saving New Solutions
```
team_memory.save(
  key: "visual test timeout errors", 
  value: "Increased Puppeteer timeout to 60000ms and added retry logic",
  agent: "Martin"
)
```

### Finding All Movement Solutions
```
team_memory.recall("movement")
// Returns all solutions containing "movement" from any agent
```

## Benefits for You

1. **No more "didn't we fix this already?"**
2. **Agents start with context from previous solutions**
3. **Track which agents are solving what types of problems**
4. **Build institutional knowledge automatically**

## Storage Location

All memories are saved in `.claude/memory/*.json` - safe from token consumption!

Remember: This is version 1.0 - simple but effective, just like delegate!
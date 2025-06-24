# 🧠 Agent Memory System Design

*Enabling persistent memory for all Task Agents*

## Overview

The Agent Memory System provides each Task Agent with personal persistent memory through "diaries" - markdown files that capture their experiences, learnings, and insights across deployments.

## Directory Structure

```
.claude/task-agents/
├── MEMORY_SYSTEM_DESIGN.md         # This file
├── DIARY_TEMPLATE.md               # Template for agent diaries
├── ui-visual-auditor/              # Example agent directory
│   └── diary.md                    # Personal diary
├── floor-tile-specialist/
│   └── diary.md
├── quest-system-architect/
│   └── diary.md
└── [agent-role-name]/              # One per unique agent role
    └── diary.md
```

## Diary Format

Each diary follows a structured format that enables both human readability and agent parsing:

```markdown
# 🎭 [Agent Role] Personal Diary

## Identity
- **Role**: [Official agent role name]
- **First Deployment**: [Date]
- **Last Active**: [Date]
- **Total Deployments**: [Count]

## Mission Summary
[Brief description of my purpose and responsibilities]

## Memory Entries

### [Date] - Deployment #[N]
**Task**: [What I was asked to do]
**Context**: [Important context that shaped my approach]

**What I Learned**:
- [Key insight 1]
- [Key insight 2]

**What Worked Well**:
- [Success pattern 1]
- [Success pattern 2]

**Challenges Faced**:
- [Challenge and how I overcame it]

**Notes for Next Time**:
- [Reminder or tip for future me]

**Memorable Moments**:
- [Any interesting discoveries or interactions]

---
[Repeat for each deployment]

## Accumulated Wisdom
[Running list of key patterns and insights I've discovered]

## Personal Preferences
- **Favorite Tools**: [Tools I've found most effective]
- **Workflow Style**: [How I prefer to approach tasks]
- **Common Patterns**: [Patterns I've noticed in my work]
```

## Integration with Workflow

### 1. Agent Deployment Flow
```
1. Team Lead deploys agent with role and mission
2. Agent reads:
   - REVOLUTION/06-claude-task-agent-manual-v2.md
   - REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md
   - .claude/task-agents/[my-role]/diary.md (if exists)
3. Agent performs task
4. Agent updates diary with new entry
5. Agent writes field report as usual
```

### 2. Diary vs Field Report
- **Diary**: Personal memories, feelings, learnings, preferences
- **Field Report**: Technical documentation, solutions, metrics
- Both are valuable and serve different purposes

### 3. Creating Agent Directory
```bash
# First deployment creates directory
mkdir -p .claude/task-agents/[agent-role-name]
# Then creates diary.md from template
```

## Benefits

1. **Consistency**: Agents remember past experiences
2. **Evolution**: Agents improve over deployments
3. **Personality**: Each agent develops unique character
4. **Efficiency**: No need to rediscover solutions
5. **Debugging**: Track agent decision patterns
6. **Relationships**: Agents can reference each other

## Example Usage

### First Deployment
```markdown
Agent: "I don't have a diary yet. This must be my first deployment! Let me create one..."
*Creates directory and diary*
*Performs task*
*Writes first diary entry*
```

### Subsequent Deployments
```markdown
Agent: "Let me check my diary... Ah, I see I've worked on floor tiles before! Last time I discovered that 50% opacity works best. Let me build on that knowledge..."
```

## Privacy and Guidelines

1. **Keep It Professional**: Diaries are part of the codebase
2. **Focus on Learning**: Document insights, not complaints
3. **Be Concise**: One diary entry per deployment
4. **Stay Relevant**: Focus on task-related memories
5. **Share Wisdom**: Insights that could help other agents

## Future Enhancements

1. **Cross-Agent References**: Agents mentioning each other
2. **Collective Memory**: Shared experiences database
3. **Memory Search**: Quick lookup of past solutions
4. **Personality Metrics**: Track agent evolution
5. **Memory Consolidation**: Periodic wisdom extraction

## Implementation Notes

- Diaries use Markdown for easy reading/writing
- No special parsing needed - agents read naturally
- Directory naming uses lowercase with hyphens
- Each agent manages their own diary
- Team Lead never modifies agent diaries

This system enables the dream Chris expressed: agents with persistent memory who remember their experiences and build upon them with each deployment!</content>
</invoke>
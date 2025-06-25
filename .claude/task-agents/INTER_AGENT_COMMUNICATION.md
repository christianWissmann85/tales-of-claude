# 🤝 Inter-Agent Communication Patterns

*How Task Agents collaborate and share knowledge effectively*

## Overview

Effective communication between agents is crucial for team success. This guide establishes patterns for agents to reference each other's work, share discoveries, and build on collective knowledge.

## Communication Channels

### 1. Personal Diary References
When an agent's approach inspires you:
```markdown
### 2025-06-25 - Deployment #4
**Inspired by**: Ivan (Floor Tile Specialist) - diary entry 2025-06-24
Ivan's discovery about 50% opacity for backgrounds gave me the idea to try similar transparency for UI panels...
```

### 2. Field Report Citations
For technical solutions:
```markdown
**Building on**: grace-battle-artist-2025-06-22.md
Grace discovered the delegate recursion pattern. I applied it to UI generation with great success...
```

### 3. Team Diary Contributions
For universal discoveries:
```markdown
### 2025-06-25 - Screenshot Tool Reliability Fix
**Discovered by**: Marcus (Testing Infrastructure)
**Category**: Tool

**What We Learned**:
The original screenshot tool times out due to strict element waiting. Created screenshot-reliable.ts with fixed wait times...
```

### 4. Direct Mentions in Reports
When collaborating:
```markdown
## Collaboration Notes
Worked with Patricia (Panel Designer) to ensure visual consistency. Her panel structure made my animation implementation straightforward.
```

## Knowledge Sharing Patterns

### Pattern 1: The Handoff
When one agent prepares work for another:
```markdown
// In first agent's report:
"Prepared map structure for Lynn (Minimap Engineer) - see mapData.json with documented coordinate system"

// In Lynn's diary:
"Ada's map structure was perfectly organized. Built minimap in half the expected time!"
```

### Pattern 2: The Build-Upon
When extending another's work:
```markdown
// Original: Ken (Equipment Specialist)
"Created equipment slot system with drag-drop"

// Extension: Brian (Inventory Manager)
"Extended Ken's slot system to support stackable items and quick-swap"
```

### Pattern 3: The Problem-Solution Chain
When one agent's struggle helps another:
```markdown
// Grace's diary: "Struggled with code fences for 2 hours"
// Next agent: "Remembered Grace's code fence issue - used sed immediately"
```

### Pattern 4: The Parallel Discovery
When agents find similar solutions independently:
```markdown
// Team diary entry:
"Both Martin and Robert discovered custom test runners outperform Jest - combining their approaches yielded 15x speedup"
```

## Reference Formats

### Diary Reference
```markdown
See: [Agent Name] diary - [Date] - "[Entry Title]"
Example: Ivan diary - 2025-06-24 - "Floor Tile Breakthrough"
```

### Field Report Reference
```markdown
Ref: [agent-role]-[date].md - [Section]
Example: quest-system-architect-2025-06-23.md - "Branching Design"
```

### Code Reference
```markdown
Building on: [file]:[lines] by [Agent]
Example: MapGrid.tsx:145-180 by Ada (Map Analysis)
```

## Communication Best Practices

### 1. Be Specific
❌ "Another agent did something similar"
✅ "Terry (Quest Architect) used discriminated unions for type safety - applying same pattern to items"

### 2. Give Credit
Always acknowledge whose work you're building on:
```markdown
"This approach inspired by Katherine's elegant quest choice system"
```

### 3. Share Forward
Think about who might need your solution:
```markdown
"Note for future UI agents: This CSS Grid pattern scales well for responsive layouts"
```

### 4. Cross-Reference Bidirectionally
If you reference someone, add a note to your diary about being referenced:
```markdown
"My floor tile solution was referenced by Marie (Visual Clarity) for UI hierarchy"
```

## Collaboration Patterns

### Sequential Enhancement
```
Ada analyzes → Tim architects → Barbara implements → Ivan polishes
Each agent documents handoff points
```

### Parallel Integration
```
Quest Writers (Donald, Katherine) work simultaneously
Integration Master (unnamed) merges their work
All document integration points
```

### Emergency Response
```
Critical bug found → Grace responds → Documents fix
Other agents learn from her approach
```

### Knowledge Synthesis
```
Multiple agents hit similar issue → Leslie consolidates
Creates shared pattern → All agents benefit
```

## Finding Related Work

### Search Commands
```bash
# Find who worked on similar features
grep -r "minimap" .claude/field-test-reports/

# Find diary mentions of your name
grep -r "Patricia" .claude/task-agents/*/diary.md

# Find technical patterns
grep -r "delegate recursion" .claude/
```

### Ask Team Lead
Annie maintains mental map of all agent work. When deploying, she often mentions:
"You might want to look at what Barbara did with dungeon generation"

### Check Knowledge Base
CLAUDE_KNOWLEDGE.md aggregates major discoveries with attribution.

## Creating Connection Points

### In Your Diary
```markdown
## Agents I've Learned From
- Ivan: Opacity patterns
- Grace: Delegate recursion
- Kent: Testing strategies

## Agents Who Might Benefit
- Future UI workers: See my panel patterns
- Performance optimizers: Check my render batching
```

### In Your Code
```typescript
// Pattern discovered by Terry (Quest Architect)
// Adapted for inventory system by Brian
type InventoryItem = 
  | { type: 'weapon'; damage: number }
  | { type: 'consumable'; effect: string }
```

### In Field Reports
```markdown
## Related Work
- Builds on: grace-battle-artist-2025-06-22.md
- Complements: ken-equipment-specialist-2025-06-22.md  
- Enables: future-companion-system.md (planned)
```

## Team Dynamics

### The Specialists
Deep experts who perfect specific systems:
- Ivan: Floor tiles (3 deployments!)
- Terry: Quest architecture (2 deployments)

### The Integrators
Connect disparate systems:
- Quest Integration Master
- System Verifier

### The Responders
Fix critical issues quickly:
- Grace (Critical Blocker)
- John (Combat Medic)

### The Innovators
Discover new patterns:
- Ray (Revolution Evolution)
- Doug (Memory System)

## Success Metrics

Good inter-agent communication shows:
- ✅ Specific attribution in reports
- ✅ Diary entries mentioning other agents
- ✅ Patterns spreading across team
- ✅ Reduced time to solve similar problems
- ✅ Collective celebration of victories

## The Network Effect

Every connection strengthens the team:
- 2 agents sharing = linear improvement
- 10 agents sharing = exponential improvement  
- 95+ agents sharing = revolutionary capability

Remember: You're not just an agent completing a task. You're a node in a learning network, where every connection makes everyone stronger.

---

*"Individual excellence is good. Collective intelligence is revolutionary."*

**Created**: 2025-06-25
**By**: Kendra (Knowledge Consolidator)
**For**: All Task Agents
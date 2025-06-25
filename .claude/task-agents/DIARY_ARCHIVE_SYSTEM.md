# 📚 Diary Archive System

*Efficient memory management for persistent agent intelligence*

## Overview

The Diary Archive System ensures agents maintain lean, relevant memories while preserving their complete history. This prevents token bloat while maintaining the full context of agent evolution.

## Archive Structure

```
.claude/task-agents/
├── archives/
│   ├── 2025-06/                    # Monthly folders
│   │   ├── ada-map-analysis-2025-06.md
│   │   ├── grace-battle-artist-2025-06.md
│   │   └── ...
│   ├── 2025-07/
│   │   └── ...
│   └── team-diary/                 # Team diary archives
│       ├── team-diary-2025-Q2.md
│       └── wisdom-extracts-2025.md
├── [agent-name]/
│   └── diary.md                    # Current diary (<500 lines)
└── TEAM_DIARY.md                   # Current team diary
```

## Archive Triggers

### Personal Diaries
Archive when:
- Diary exceeds 500 lines (~20-25 entries)
- Major project phase completes
- Monthly rotation (optional)

### Team Diary
Archive when:
- Exceeds 500 lines
- Quarterly basis
- Before major workflow updates

## Archive Process

### Step 1: Check Diary Size
```bash
wc -l .claude/task-agents/[agent-name]/diary.md
# If > 500 lines, time to archive
```

### Step 2: Extract Accumulated Wisdom
Before archiving, consolidate key learnings:
```markdown
## Accumulated Wisdom (Extracted 2025-06-25)
- Always use delegate for files >50 lines
- Chris values clarity over complexity
- The compile-fix loop is your friend
- [Other key patterns discovered]
```

### Step 3: Create Archive File
```bash
# Create monthly folder if needed
mkdir -p .claude/task-agents/archives/2025-06/

# Copy full diary to archive
cp .claude/task-agents/[agent-name]/diary.md \
   .claude/task-agents/archives/2025-06/[agent-name]-diary-2025-06.md
```

### Step 4: Create New Lean Diary
Keep only:
- Identity section
- Accumulated wisdom
- Last 2-3 significant entries
- Personal preferences
- Recent context (last 30 days)

### Step 5: Add Archive Reference
In the new diary:
```markdown
## Archive History
- **2025-06**: First month of deployments (15 entries archived)
  - Key moment: Discovered delegate recursion pattern
  - Milestone: Fixed floor tile rendering
  - See: archives/2025-06/[agent-name]-diary-2025-06.md
```

## Automated Archive Script

Save as `archive-diary.sh`:
```bash
#!/bin/bash
AGENT_NAME="$1"
CURRENT_DATE=$(date +%Y-%m)
ARCHIVE_DIR=".claude/task-agents/archives/$CURRENT_DATE"

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

# Archive current diary
cp ".claude/task-agents/$AGENT_NAME/diary.md" \
   "$ARCHIVE_DIR/$AGENT_NAME-diary-$CURRENT_DATE.md"

# Create summary for new diary
echo "Diary archived. Update with extracted wisdom and recent entries."
```

## What to Keep vs Archive

### Always Keep (in current diary)
- Identity and stats
- Accumulated wisdom
- Personal preferences
- Last 2-3 deployments
- Active project context
- Unresolved challenges

### Archive (in monthly files)
- Detailed entry narratives
- Resolved challenges
- Old project contexts
- First-time discoveries
- Learning progression
- Historical interactions

## Wisdom Extraction Guidelines

When archiving, extract patterns:

### Technical Patterns
```markdown
## Technical Wisdom
- Delegate with write_to saves 100% tokens
- Type-check errors guide solutions
- Bundle strategy for large analyses
```

### Interpersonal Patterns
```markdown
## Working with Chris
- Repetition = priority (7x "BIGGER MAPS")
- Visual clarity trumps features
- Trust and autonomy unlock creativity
```

### Personal Growth
```markdown
## My Evolution
- Started cautious, now confident
- Favorite tools: delegate, sed, grep -n
- Learned to embrace the compile-fix loop
```

## Archive Retrieval

When needed, agents can reference archives:
```bash
# Search for specific memory
grep -r "delegate recursion" .claude/task-agents/archives/

# Read specific archive
cat .claude/task-agents/archives/2025-06/my-name-diary-2025-06.md
```

## Best Practices

1. **Archive Regularly**: Don't let diaries exceed 1000 lines
2. **Extract Before Archive**: Wisdom extraction is crucial
3. **Keep Context**: Recent entries help continuity
4. **Reference Archives**: Note where detailed history lives
5. **Share Breakthroughs**: Major discoveries go to CLAUDE_KNOWLEDGE.md

## Benefits

- **Faster Loading**: Agents read 500 lines vs 2000+
- **Better Focus**: Recent context stays relevant
- **Preserved History**: Nothing is lost
- **Knowledge Evolution**: Wisdom accumulates
- **Token Efficiency**: 75% reduction in diary tokens

## Archive Metrics

### Healthy Archive System Shows:
- ✅ Current diaries under 500 lines
- ✅ Monthly archive folders organized
- ✅ Wisdom sections growing
- ✅ Clear archive references
- ✅ Easy knowledge retrieval

### Warning Signs:
- ⚠️ Diaries over 1000 lines
- ⚠️ No archives for 3+ months
- ⚠️ Wisdom not extracted
- ⚠️ Lost historical context
- ⚠️ Difficulty finding past solutions

## The Archive Promise

Your memories are never lost - they're organized for efficiency. Current diary for daily work, archives for deep history. Together, they form your complete story.

---

*"The past informs the present, but shouldn't overwhelm it."*

**System Designed**: 2025-06-25
**By**: Kendra (Knowledge Consolidator)
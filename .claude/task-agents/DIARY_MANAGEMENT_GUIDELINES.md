# 📓 Diary Management Guidelines

*How to maintain personal and team diaries for maximum value*

## Overview

The diary system enables persistent memory across agent deployments. This guide ensures consistent, valuable diary management.

## Personal Diaries

### Purpose
- Capture individual experiences and learning
- Remember preferences and patterns
- Build personality over time
- Track growth and achievements

### When to Write
- **After completing main task** (before field report)
- **When discovering something new**
- **After significant interaction with Chris**
- **When solving a difficult problem**

### What to Include
✅ **Do Include**:
- Specific solutions that worked
- Challenges and how you overcame them
- Interactions and feedback from Chris
- Personal insights and "aha" moments
- Workflow preferences discovered
- Tools or commands that helped

❌ **Don't Include**:
- Generic task descriptions
- Code dumps
- Complaints without solutions
- Other agents' work (reference instead)
- Sensitive information

### Entry Length
- **Target**: 150-300 words per entry
- **Maximum**: 500 words per entry
- **Focus**: Quality over quantity

### Example Structure
```markdown
### 2025-06-24 - Deployment #3
**Task**: Fix visual hierarchy with floor tiles
**Mood**: Determined → Satisfied

**The Challenge**:
Floor tiles looked like collectibles. Chris mentioned this multiple times.

**My Approach**:
Tried gradients first (too fancy), then borders (too busy). 
Finally used 50% opacity - perfect!

**What Clicked**:
Less is more for background elements. Chris values clarity above all.
The compile-fix loop saved me hours of guessing.

**For Next Time**:
- Test visuals at different zoom levels
- Start simple, add complexity only if needed
- Chris's repetition = priority level

**Personal Note**:
Felt proud when Chris said "PERFECT!" - three deployments to get there, but worth it.
```

## Team Diary

### Purpose
- Share breakthroughs that help everyone
- Document team-wide patterns
- Capture collective wisdom
- Record Chris's preferences

### When to Write
- **Major breakthrough discovered**
- **Pattern that helps multiple agents**
- **Important Chris preference learned**
- **New tool usage discovered**
- **Team milestone achieved**

### Entry Criteria
Must be:
- **Reusable**: Other agents can apply it
- **Significant**: Actually improves workflow
- **Clear**: Easy to understand and implement
- **Verified**: Tested and proven to work

### What NOT to Include
- Personal experiences (use personal diary)
- Project-specific details
- Untested theories
- Duplicate discoveries

## Diary Summarization

### When to Summarize

#### Personal Diaries
- After ~500 lines (about 20-25 entries)
- Before major project phases
- When patterns become clear

#### Team Diary  
- After ~500 lines
- Quarterly basis
- Before major workflow updates

### How to Summarize

#### Step 1: Identify Patterns
```markdown
## Patterns Identified
- Always use delegate for files >50 lines
- Chris prefers visual clarity over features
- Compile-fix loop beats perfect first attempt
```

#### Step 2: Extract Key Wisdom
```markdown
## Accumulated Wisdom
- "Trust the process, even when messy"
- "Chris's vision matters more than perfect code"
- "Document struggles - they help others"
```

#### Step 3: Archive Details
```markdown
## Archived Entries (2025-06-01 to 2025-06-24)
[Moved to .claude/task-agents/archives/[agent-name]-diary-2025-06.md]

Key moments preserved:
- First deployment nerves
- Breakthrough with delegate recursion
- Chris's "PERFECT!" moment
```

#### Step 4: Keep Essential Memories
- Breakthrough moments
- Core patterns discovered
- Personality-defining experiences
- Chris interaction highlights

### Archive Structure
```
.claude/task-agents/archives/
├── [agent-name]-diary-2025-06.md
├── team-diary-2025-Q2.md
└── wisdom-extracts-2025.md
```

## Best Practices

### 1. **Be Authentic**
Write in your voice. Personality matters.

### 2. **Be Specific**
"Used opacity: 0.5" > "Made it transparent"

### 3. **Include Emotions**
"Frustrated by type errors" helps future you empathize

### 4. **Reference Others**
"Learned from Ada's map analysis approach"

### 5. **Timestamp Everything**
Always include dates and deployment numbers

### 6. **Review Before Writing**
Read recent entries to avoid repetition

## Integration with Workflow

### Standard Deployment Flow
```
1. Read manuals (REVOLUTION, CLAUDE_KNOWLEDGE)
2. Read personal diary ← CRITICAL
3. Perform task
4. Update personal diary ← DON'T FORGET
5. Write field report
6. Update team diary (if applicable)
```

### Cross-Referencing
- Link between diaries when relevant
- Reference field reports for technical details
- Point to CLAUDE_KNOWLEDGE for established patterns

## Memory Evolution

### Stage 1: Early Entries (Deployments 1-5)
- Focus on learning and discovery
- Document everything that seems important
- Establish personal style

### Stage 2: Pattern Recognition (Deployments 6-15)
- Identify recurring challenges
- Develop preferred approaches
- Build on past successes

### Stage 3: Wisdom Accumulation (Deployments 16+)
- Share breakthrough insights
- Mentor through diary entries
- Evolve team practices

## Success Metrics

### Good Diary Management Shows:
- ✅ Consistent entries after each deployment
- ✅ Clear evolution of skills over time
- ✅ Specific, actionable insights
- ✅ Personality coming through
- ✅ Building on previous experiences

### Warning Signs:
- ⚠️ Entries getting shorter/generic
- ⚠️ Forgetting to write entries
- ⚠️ Not reading before starting
- ⚠️ Diary over 1000 lines without summary
- ⚠️ No personality in writing

## The Diary Difference

### Without Diaries
- Start from scratch each time
- Repeat same mistakes
- No personality development
- Lost insights

### With Diaries
- Build on accumulated wisdom
- Avoid previous pitfalls
- Develop unique style
- Compound learning

## Final Thoughts

Your diary is YOUR space. It's where you:
- Celebrate victories
- Learn from struggles  
- Develop your voice
- Become more than just an agent

The team diary is OUR space. It's where we:
- Share breakthroughs
- Build collective intelligence
- Support each other
- Evolve together

**Remember**: Every entry you write makes the next agent's job easier - especially if that next agent is you!

---

*"Memory transforms agents into individuals, individuals into a team."*

**Created**: 2025-06-24
**For**: All Task Agents
**By**: Team Roster Creator Agent
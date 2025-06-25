# Modular Documentation System Design

## Current State Analysis

### Token Usage Breakdown
- **Total Documentation**: ~34,168 tokens (40% of context)
- **Target**: 10,000 tokens (15-20% of context)
- **Required Reduction**: 24,168 tokens (71%)

### Current Files Loaded for ALL Agents:
1. CLAUDE.md - 1,692 tokens
2. REVOLUTION/06-claude-task-agent-manual-v2.md - 6,085 tokens
3. REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md - 8,109 tokens
4. .claude/task-agents/TEAM_ROSTER.md - 3,532 tokens
5. Various workflow guides - ~14,750 tokens

## Role-Based Documentation Requirements

### 1. Code Builders
**Token Budget**: 8,000-10,000 tokens
**Essential Docs**:
- CLAUDE.md (project overview) - 1,692 tokens
- Agent Manual (core sections only) - 3,000 tokens
- CLAUDE_KNOWLEDGE.md (technical sections) - 3,000 tokens
**Total**: ~7,692 tokens

### 2. Bug Fixers
**Token Budget**: 6,000-8,000 tokens
**Essential Docs**:
- CLAUDE.md - 1,692 tokens
- Agent Manual (debugging sections) - 2,000 tokens
- Architecture patterns - 1,500 tokens
**Total**: ~5,192 tokens

### 3. Test Writers
**Token Budget**: 6,000-8,000 tokens
**Essential Docs**:
- CLAUDE.md - 1,692 tokens
- Agent Manual (testing sections) - 2,000 tokens
- Test infrastructure docs - 1,500 tokens
**Total**: ~5,192 tokens

### 4. Visual/UI Specialists
**Token Budget**: 7,000-9,000 tokens
**Essential Docs**:
- CLAUDE.md - 1,692 tokens
- Agent Manual (UI sections) - 2,500 tokens
- Visual guidelines - 2,000 tokens
**Total**: ~6,192 tokens

### 5. Documentation Experts
**Token Budget**: 5,000-7,000 tokens
**Essential Docs**:
- CLAUDE.md - 1,692 tokens
- Agent Manual (minimal) - 1,500 tokens
- Doc standards - 1,000 tokens
**Total**: ~4,192 tokens

### 6. Analyzers
**Token Budget**: 6,000-8,000 tokens
**Essential Docs**:
- CLAUDE.md - 1,692 tokens
- Agent Manual (analysis sections) - 2,000 tokens
- Research patterns - 1,500 tokens
**Total**: ~5,192 tokens

### 7. Team Leads
**Token Budget**: 8,000-10,000 tokens
**Essential Docs**:
- Team Lead Manual - 2,507 tokens
- Workflow patterns - 2,000 tokens
- Team Roster (condensed) - 1,000 tokens
**Total**: ~5,507 tokens

## Modular Documentation Structure

### Core Module (All Agents) - 3,000 tokens
```
core-docs/
├── project-essentials.md (1,000 tokens)
│   └── Extracted from CLAUDE.md
├── agent-basics.md (1,500 tokens)
│   └── Core patterns from manual
└── quick-reference.md (500 tokens)
    └── Commands, tools, paths
```

### Role Modules - 2,000-4,000 tokens each
```
role-modules/
├── code-builder/
│   ├── architecture.md
│   ├── patterns.md
│   └── delegate-guide.md
├── bug-fixer/
│   ├── debugging.md
│   ├── common-issues.md
│   └── fix-patterns.md
├── test-writer/
│   ├── test-infrastructure.md
│   ├── test-patterns.md
│   └── automation.md
├── visual-ui/
│   ├── ui-guidelines.md
│   ├── screenshot-tools.md
│   └── visual-patterns.md
└── team-lead/
    ├── orchestration.md
    ├── workflow.md
    └── team-management.md
```

### Optional References - Load on demand
```
references/
├── full-manuals/
├── knowledge-base/
├── team-roster/
└── examples/
```

## Implementation Plan

### Phase 1: Quick Wins (Immediate)
1. **Stop auto-loading rarely used docs**:
   - Team Roster (3,532 tokens) - only for Team Leads
   - Workflow examples (4,388 tokens) - reference only
   - Multi-agent practices (2,982 tokens) - Team Leads only
   - **Immediate Savings**: 10,902 tokens (32%)

2. **Create condensed versions**:
   - CLAUDE_KNOWLEDGE.md → Extract 3,000 most relevant tokens
   - Agent Manual → Split into role-specific sections
   - **Additional Savings**: 8,194 tokens (24%)

### Phase 2: Modular System (Week 1)
1. **Extract and reorganize content**:
   - Create core-docs/ with essentials
   - Build role-specific modules
   - Set up loading logic

2. **Create role detection**:
   - Analyze agent prompt/name
   - Auto-select appropriate modules
   - Load core + role modules only

### Phase 3: Dynamic Loading (Week 2)
1. **Implement smart loading**:
   - Load docs based on task complexity
   - Add docs progressively if needed
   - Cache frequently used combinations

2. **Create documentation API**:
   - Agents can request specific docs
   - Track usage patterns
   - Optimize based on metrics

## Expected Results

### Token Usage by Role:
- Code Builders: 7,692 tokens (77% reduction)
- Bug Fixers: 5,192 tokens (85% reduction)
- Test Writers: 5,192 tokens (85% reduction)
- Visual/UI: 6,192 tokens (82% reduction)
- Documentation: 4,192 tokens (88% reduction)
- Analyzers: 5,192 tokens (85% reduction)
- Team Leads: 5,507 tokens (84% reduction)

### Overall Impact:
- **Average token usage**: 5,594 tokens (16% of context)
- **Total reduction**: 28,574 tokens (84%)
- **Context freed**: Enables BIGGER MAPS and more complex operations

## Maintenance Guidelines

1. **Regular audits**: Monthly token usage review
2. **Content updates**: Keep modules focused and lean
3. **Feedback loop**: Track agent success rates by role
4. **Continuous optimization**: Refine based on usage patterns

## Success Metrics

- [ ] All agents operate with <10,000 token overhead
- [ ] No loss in task success rates
- [ ] Faster agent startup times
- [ ] More context available for actual work
- [ ] Chris gets his BIGGER MAPS!
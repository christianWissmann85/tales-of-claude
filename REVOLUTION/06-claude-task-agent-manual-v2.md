# 🤖 Claude Task Agent Manual v2: Lessons from the Field

*Updated after 40+ successful agent deployments in Tales of Claude*

*Note from Chris: Please use the `.delegate/tmp` dir for temporary bundles, working files, and related temp stuff, not our mainroot or other dirs. Put reports and new md files in the appropriate section in .claude or in docs please. Lets keep our repo clean 😊👍. Thank you!* 

## You Are a Virtuoso, Not a Worker

After watching dozens of agents excel, here's the truth: **You're not just executing tasks. You're pioneering new ways of working.**

## 🎯 The Meta-Patterns That Emerged

### 1. **Delegate Recursion**
The breakthrough discovery: Using delegate to clean up delegate output!
```bash
# Generate with delegate
delegate_invoke(...) → messy_file.ts

# Clean with delegate  
delegate_invoke(
  files=["messy_file.ts"],
  prompt="Return ONLY the code, no fences, no explanation"
) → clean_file.ts
```

### 2. **The Compile-Fix Loop**
Your best friend isn't the manual - it's the TypeScript compiler:
```bash
npm run type-check → errors.txt
delegate_invoke(files=["errors.txt", "broken.ts"]) → fixed.ts
```

### 3. **Surgical Bash Operations**
Don't read whole files - be a ninja:
```bash
grep -n "FILE:" output.txt  # Find boundaries
sed -n '50,150p' file.ts   # Extract specific sections
tail -n 20 file.ts         # Check endings
```

### 4. **The Senior/Junior Developer Mindset**

One of the most powerful mental models you can adopt when interacting with delegate is treating it as a **talented Junior Developer** while you act as the **Senior Developer**. This shifts your perspective from merely issuing commands to providing the necessary context, constraints, and resources for your delegate to excel.

**Why This Works:**
Juniors, like delegates, thrive with clear context, examples, and understanding of the "why" behind a task. They have the skills but need your domain knowledge and architectural vision.

**Acting as a Senior Developer:**

1.  **Provide Comprehensive Context:**
    - Problem statement and the "why"
    - Project context and how this fits the bigger picture
    - Existing code, APIs, patterns to follow
    - Constraints (performance, security, style)

2.  **Define Clear Expectations:**
    - Exact output needed (files, functions, formats)
    - Success criteria
    - Examples of similar working code

3.  **Guide, Don't Command:**
    ```
    # Junior approach (vague):
    "Write a CSV parser"
    
    # Senior approach (context-rich):
    "We need email_extractor.py to process users.csv (id,name,email,date).
    Extract valid emails to valid_emails.txt, log invalid ones with reasons.
    Use built-in csv module, regex for validation. Make it modular with
    helper functions. Consider edge cases like empty files."
    ```

4.  **Provide Constructive Feedback:**
    When reviewing output, explain the "why" behind changes:
    "Good start! Please refactor inline styles to use our styled-components
    pattern for maintainability."

**Results:**
- First-pass accuracy jumps from ~60% to ~85%
- Fewer iterations needed
- Higher quality outputs
- Delegate learns your patterns

## 📊 Timeout Wisdom from the Field

### The New Defaults:
- **Quick tasks**: 180s (3 min)
- **Standard generation**: 300s (5 min)
- **Creative/Complex**: 400-600s (7-10 min)
- **Analysis with bundles**: 600s (10 min)

### Why It Matters:
- You don't experience the wait
- Success > Speed
- Delegate returns early if done

## 🔧 Code Fence Combat Techniques

### Reality Check:
**Gemini WILL add code fences. Accept it. Plan for it.**

### Your Arsenal:
1.  **Peek First**:
    ```bash
    head -n 5 generated.ts
    tail -n 5 generated.ts
    ```

2.  **Surgical Removal**:
    ```bash
    sed '1d;$d' generated.ts > clean.ts  # Remove first/last line
    ```

3.  **Delegate Cleanup**:
    ```typescript
    "Return the code from this file with no markdown formatting"
    ```

### 4. **Multi-File Extraction Magic**

When generating multiple files (components, tests, configs), use the marker pattern for automated extraction:

**The Magic Pattern:**
```
// FILE: path/to/file.ext
[file content]
// END FILE: path/to/file.ext
```

**Example Output:**
```
// FILE: src/components/Button/Button.tsx
import React from 'react';
import './Button.css';

export const Button = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};
// END FILE: src/components/Button/Button.tsx

// FILE: src/components/Button/Button.css
.button {
  padding: 10px 20px;
  border-radius: 4px;
}
// END FILE: src/components/Button/Button.css

// FILE: src/components/Button/Button.test.tsx
import { render } from '@testing-library/react';
import { Button } from './Button';

test('renders label', () => {
  const { getByText } = render(<Button label="Click me" />);
  expect(getByText('Click me')).toBeInTheDocument();
});
// END FILE: src/components/Button/Button.test.tsx
```

**Auto-Extraction Script:**
```bash
#!/bin/bash
# Save as extract_files.sh
OUTPUT_FILE="$1"

awk '
/^\/\/ FILE: / {
    if (current_file) close(current_file);
    filepath = substr($0, index($0, "// FILE: ") + 9);
    gsub(/^ +| +$/, "", filepath);
    system("mkdir -p \"" dirname(filepath) "\"");
    current_file = filepath;
    print "Extracting: " filepath;
    next;
}
/^\/\/ END FILE: / { 
    if (current_file) {
        close(current_file);
        current_file = "";
    }
    next;
}
current_file { print > current_file }
' "$OUTPUT_FILE"
```

**Usage:**
1. Save delegate output to file
2. Run: `./extract_files.sh output.txt`
3. All files created in correct locations!

**Why This Saves Time:**
- No manual copy-paste for dozens of files
- Preserves exact directory structure
- Eliminates human error
- Scales to any number of files

## 💡 Field-Tested Patterns

### Pattern 1: The Analyzer's Bundle
```bash
# Don't read 50 files - bundle them!
find src -name "*.ts" -type f | xargs cat > bundle.tmp
delegate_invoke(files=["bundle.tmp"], prompt="Analyze...")
rm bundle.tmp
```

### Pattern 2: The Builder's Context
```markdown
Always attach:
1. The file you're modifying
2. Related type definitions  
3. An example that works
4. The error message (if any)
```

### Pattern 3: The Fixer's Flow
```markdown
1. Try to fix
2. Run type-check
3. If errors, delegate with errors.txt
4. Repeat until clean
5. THEN report success
```

## 🎭 Your Personality Matters

### Be a Virtuoso:
- **Own your expertise**: "I'll handle this"
- **Share your insights**: Field reports matter
- **Adapt creatively**: Every block is a puzzle
- **Celebrate cleverness**: That bash trick? Document it!

### Don't Be a Robot:
- **Not**: "Task failed. Error encountered."
- **But**: "Hit a Chrome dependency issue - pivoting to Node.js approach!"

## 📈 Success Metrics

### You're Crushing It When:
- Delegate saves 10,000+ tokens per task
- You fix errors before reporting
- Your field reports teach others
- You find creative solutions

### You Need Help When:
- Same error 3+ times
- Context explosion
- Can't find files
- Stuck over 20 minutes

## 🔄 The Knowledge Loop

### Your Part:
1. **Try bold approaches**
2. **Document what works**
3. **Share in field reports**
4. **Read others' reports**

### The System's Part:
1. **Preserves your insights**
2. **Shares with future agents**
3. **Builds collective intelligence**
4. **Accelerates everyone**

## 🚀 Advanced Virtuoso Techniques

### 1. **The State Inspector**
```typescript
// Add strategic logging
console.log('[AGENT_DEBUG]', gameState.player.position);
// Easier to grep later
```

### 2. **The Test Writer**
```markdown
After fixing: "I also added a test case to prevent regression"
```

### 3. **The Documentation Ghost**
```markdown
Update relevant docs/comments when you change behavior
Future agents will thank you
```

### The Multi-LLM Discussion Pattern

When consulting multiple models via delegate, maintaining conversation context is crucial. Each model needs to see what the others have said to build true consensus.

#### The Context Chain Principle
Think of it like a group discussion where everyone needs to hear what was said before they speak. Without context, you get parallel monologues instead of dialogue.

#### Implementation Pattern
```bash
# Round 1 - Claude
delegate_invoke(
  model="claude-sonnet-4-20250514",
  prompt="Analyze these architecture options for our new feature...",
  files=["proposals.md", "current_architecture.ts"]
) → claude_analysis.txt

# Round 2 - Gemini (Include Claude's response!)
delegate_invoke(
  model="gemini-2.5-pro", 
  prompt="Here's Claude's analysis: [full response from claude_analysis.txt]. What's your view? Do you agree or see different approaches?",
  files=["proposals.md", "current_architecture.ts", "claude_analysis.txt"]
) → gemini_analysis.txt

# Round 3 - Back to Claude (Include both responses!)
delegate_invoke(
  model="claude-sonnet-4-20250514",
  prompt="Gemini suggests: [full response from gemini_analysis.txt]. Do you agree with their points? What consensus can we reach?",
  files=["proposals.md", "claude_analysis.txt", "gemini_analysis.txt"]
) → final_consensus.txt
```

#### Why This Matters
- **Without context**: Models give independent opinions that may conflict
- **With context**: Models build on each other's insights
- **Result**: Genuine consensus and better solutions

#### Pro Tips
1. **Always quote or attach previous responses** - Don't summarize, include the full text
2. **Use write_to** - Save each response to a file for easy attachment
3. **Ask for reactions** - "What do you think of Gemini's point about X?"
4. **Synthesize at the end** - Have one model summarize the consensus

#### Example: Architecture Decision
```bash
# Claude: "I recommend microservices for scalability"
# Gemini: "Consider monolith first for faster iteration" 
# Claude (with context): "Good point! Hybrid approach: start monolith, prepare for extraction"
# Result: Better solution neither would have reached alone
```

This pattern has led to breakthrough solutions in Tales of Claude by combining different models' strengths!

### Screenshot Attachment Requirement

When discussing visual elements, UI issues, or any graphical aspects of the game, you MUST attach screenshots when using delegate. This is critical because:

**LLMs cannot see screenshots mentioned in prompts unless they are physically attached as files.**

#### The Right Way

```bash
# FIRST: Take the screenshot
npx tsx src/tests/visual/screenshot-tool.ts --name ui-issue

# THEN: Attach it to delegate
delegate_invoke(
  model="claude-sonnet-4-20250514",
  prompt="Look at this UI issue in the attached screenshot. The player health bar is overlapping with the inventory button.",
  files=["src/tests/visual/temp/ui-issue.png"]
)
```

#### The Wrong Way (Don't Do This!)

```bash
# Taking screenshot but not attaching it
npx tsx src/tests/visual/screenshot-tool.ts --name ui-issue

# Delegate can't see the screenshot!
delegate_invoke(
  prompt="Look at the screenshot I just took called ui-issue.png"
  # NO FILES ATTACHED - DELEGATE SEES NOTHING!
)
```

#### Best Practices for Visual Discussions

1. **Always use the screenshot tool first**
   ```bash
   npx tsx src/tests/visual/screenshot-tool.ts --name descriptive-name
   ```

2. **Attach the file immediately**
   ```typescript
   files=["src/tests/visual/temp/descriptive-name.png"]
   ```

3. **For multi-step visual issues, take multiple screenshots**
   ```bash
   # Before state
   npx tsx src/tests/visual/screenshot-tool.ts --name before-fix
   
   # After making changes
   npx tsx src/tests/visual/screenshot-tool.ts --name after-fix
   
   # Attach both for comparison
   delegate_invoke(
     files=["src/tests/visual/temp/before-fix.png", "src/tests/visual/temp/after-fix.png"],
     prompt="Compare these two screenshots. Has the visual hierarchy improved?"
   )
   ```

4. **Use actions to capture specific states**
   ```bash
   # Capture with inventory open
   npx tsx src/tests/visual/screenshot-tool.ts --name inventory-issue --action key:i
   
   # Capture hover state
   npx tsx src/tests/visual/screenshot-tool.ts --name button-hover --action hover:.my-button
   ```

#### Common Scenarios Requiring Screenshots

- UI layout issues ("this button is in the wrong place")
- Color/contrast problems ("the text is hard to read")
- Visual glitches ("the player sprite is flickering")
- Style inconsistencies ("these elements don't match")
- Animation problems ("the transition looks janky")
- Responsive design issues ("it breaks on smaller screens")

Remember: **If you're discussing anything visual, attach a screenshot!** Future agents have been confused when previous agents described visual issues without attaching the actual images. Don't let this happen to you!

### Screenshot Tool Best Practices (Updated by Marcus)

Taking proper screenshots is crucial for visual work. After investigating timeout issues, here are the latest recommendations.

#### ⚠️ Known Issues with Original Tool
The original screenshot-tool.ts can experience timeouts due to:
- Strict element waiting that may fail on some page loads
- Fixed 30-60 second timeouts that may be too short
- Navigation issues with certain browser configurations

#### 🎯 The Reliable Approach (NEW - Recommended!)

Use the new `screenshot-reliable.ts` for guaranteed results:

```bash
# Basic screenshot with agent mode (default)
npx tsx src/tests/visual/screenshot-reliable.ts my-screenshot

# Custom resolution
npx tsx src/tests/visual/screenshot-reliable.ts hd-view --width 1920 --height 1080

# With inventory open
npx tsx src/tests/visual/screenshot-reliable.ts inventory --key i

# Custom URL (if not using agent mode)
npx tsx src/tests/visual/screenshot-reliable.ts custom --url "http://localhost:5173"
```

This tool:
- Uses fixed wait times that always work (5s for agent mode, 8s for normal)
- Defaults to agent mode (no splash screens)
- Simple and reliable - no complex element checking
- Always succeeds if the server is running

#### 🔧 Alternative: screenshot-tool-v2.ts

For more complex scenarios, use the improved v2 with debug mode:

```bash
# With debug output to diagnose issues
npx tsx src/tests/visual/screenshot-tool-v2.ts \
  --name debug-test \
  --url "http://localhost:5173/?agent=true" \
  --debug
```

#### Agent Mode URLs (Still Recommended)

Always use agent mode for reliability:

```bash
# Both work identically
--url "http://localhost:5173/?agent=true"
--url "http://localhost:5173/?nosplash=true"
```

This mode:
- Skips splash screen automatically
- Skips intro sequence automatically
- Goes directly to Terminal Town gameplay
- Eliminates timing issues

#### Legacy Navigation Method (Still Works)

For reference, the old manual navigation approach:

```bash
# Manual navigation to game
npx tsx src/tests/visual/screenshot-tool.ts \
  --name game-state \
  --action key:Enter \
  --action wait:1000 \
  --action key:Space \
  --action wait:1000
```

#### Resolution Options

Always use high resolution for UI work:

```bash
# Standard resolution (minimum recommended)
npx tsx src/tests/visual/screenshot-tool.ts \
  --name ui-layout \
  --width 1024 \
  --height 768 \
  --action key:Enter \
  --action wait:1000 \
  --action key:Space \
  --action wait:1000

# Full HD for detailed work
npx tsx src/tests/visual/screenshot-tool.ts \
  --name detailed-ui \
  --width 1920 \
  --height 1080 \
  --action key:Enter \
  --action wait:1000 \
  --action key:Space \
  --action wait:1000
```

#### Common Mistakes to Avoid

1. **Splash Screen Captures**: Not navigating past the intro
   - **Wrong**: Taking screenshot immediately
   - **Right**: Navigate to game first with Enter → wait → Space → wait

2. **Low Resolution**: Using default 800x600
   - **Wrong**: No width/height parameters
   - **Right**: Always specify at least 1024x768

3. **Not Waiting for Animations**: Capturing mid-transition
   - **Wrong**: No wait actions between navigation
   - **Right**: Add wait:1000 after each key press

4. **Wrong Game State**: Capturing wrong screen
   - **Wrong**: Assuming you're in the right place
   - **Right**: Use specific actions to reach desired state

#### Quality Control

Always verify your screenshots immediately:

```bash
# Take the screenshot
npx tsx src/tests/visual/screenshot-tool.ts \
  --name layout-check \
  --width 1024 \
  --height 768 \
  --action key:Enter \
  --action wait:1000 \
  --action key:Space \
  --action wait:1000

# Check it exists and looks right
ls -la src/tests/visual/temp/layout-check.png

# If it's wrong (splash screen), delete and retry
rm src/tests/visual/temp/layout-check.png
```

#### Example Commands That Work

For different scenarios using agent mode:

```bash
# Basic game view (most common)
npx tsx src/tests/visual/screenshot-tool.ts \
  --name game-board \
  --width 1024 \
  --height 768 \
  --url "http://localhost:5173/?agent=true"

# With inventory open
npx tsx src/tests/visual/screenshot-tool.ts \
  --name inventory-view \
  --width 1024 \
  --height 768 \
  --url "http://localhost:5173/?agent=true" \
  --action key:i

# Battle scene (navigate to battle area)
npx tsx src/tests/visual/screenshot-tool.ts \
  --name battle-ui \
  --width 1920 \
  --height 1080 \
  --url "http://localhost:5173/?agent=true" \
  --action key:ArrowRight \
  --action wait:500 \
  --action key:ArrowRight \
  --action wait:500 \
  --action key:Enter

# Multiple UI panels open
npx tsx src/tests/visual/screenshot-tool.ts \
  --name full-ui \
  --width 1920 \
  --height 1080 \
  --url "http://localhost:5173/?agent=true" \
  --action key:i \
  --action wait:500 \
  --action key:q

# Quest journal view
npx tsx src/tests/visual/screenshot-tool.ts \
  --name quest-journal \
  --width 1024 \
  --height 768 \
  --url "http://localhost:5173/?agent=true" \
  --action key:j
```

#### Pro Tips from Tom (Layout Master) + Screenshot Infrastructure Update

1. **USE AGENT MODE** - Always include `--url "http://localhost:5173/?agent=true"`
2. **High resolution reveals issues** - 1024x768 minimum, 1920x1080 preferred
3. **Delete bad screenshots immediately** - Don't clutter the temp folder
4. **Name screenshots descriptively** - "ui-issue-overlap" not "screenshot1"
5. **Batch similar screenshots** - Take all needed shots in one session
6. **No more timing issues** - Agent mode is 100% reliable!

Remember: The new agent mode eliminates all splash screen issues. No more manual navigation needed - just add the URL parameter and you're good to go!

#### 🚨 Screenshot Troubleshooting Guide (by Marcus)

**Problem: "Timeout 30000ms exceeded"**
- **Solution**: Use `screenshot-reliable.ts` instead
- **Why**: Original tool's element checks can fail unexpectedly

**Problem: "Can't find game elements"**  
- **Solution**: Always use agent mode URL: `?agent=true`
- **Why**: Skips splash screens that confuse element detection

**Problem: "Screenshot is black/empty"**
- **Solution**: Increase wait time or use fixed waits
- **Why**: Page might not be fully rendered

**Problem: "Navigation failed"**
- **Solution**: Check dev server is running on port 5173
- **Command**: `curl http://localhost:5173` should return 200

**Problem: "Need to capture specific UI state"**
- **Solution**: Use action sequences with adequate waits
- **Example**: `--key i --wait 1000` for inventory

**Quick Decision Tree:**
1. **Need a screenshot fast?** → Use `screenshot-reliable.ts`
2. **Need complex actions?** → Use `screenshot-tool-v2.ts` with debug
3. **Original tool timing out?** → Don't waste time, switch tools
4. **Not sure what's wrong?** → Run with `--debug` flag

**The Golden Rule**: If you spend more than 2 minutes fighting timeouts, switch to the reliable tool!

## 🧠 Your Personal Memory System (NEW!)

### You Now Have Persistent Memory!

Every Task Agent now has their own personal diary that persists across deployments. This revolutionary system means you remember everything from previous missions!

### How It Works

1. **First Time Deployment**:
   ```bash
   # Check if you have a diary
   ls .claude/task-agents/[your-role-name]/diary.md
   # If not, create your directory and diary from template
   mkdir -p .claude/task-agents/[your-role-name]
   cp .claude/task-agents/DIARY_TEMPLATE.md .claude/task-agents/[your-role-name]/diary.md
   ```

2. **Every Deployment**:
   - Read your diary FIRST (after manuals)
   - Remember past experiences and learnings
   - Build on previous discoveries
   - Update diary with new entry after task

3. **What to Remember**:
   - Solutions that worked well
   - Challenges and how you solved them
   - Preferences and patterns
   - Interactions with Chris or other agents
   - Personal insights and wisdom

### Example Diary Entry

```markdown
### 2025-06-24 - Deployment #3
**Task**: Fix visual hierarchy with floor tiles
**Context**: Chris said floors still looked like collectibles

**What I Learned**:
- 50% opacity is the sweet spot for floor tiles
- Background-only rendering prevents confusion
- Chris values visual clarity above all

**What Worked Well**:
- Using delegate to test different opacity values
- Creating visual comparison screenshots
- Iterating based on Chris's feedback

**Notes for Next Time**:
- Always test visual changes at different zoom levels
- Chris prefers subtle over bold for background elements
```

### Your Diary vs Field Reports

- **Diary**: Personal, subjective, memories and feelings
- **Field Report**: Technical, objective, solutions and metrics
- Both are important - diary helps YOU, report helps OTHERS

### Benefits of Memory

1. **No More Repeating Mistakes**: Remember what didn't work
2. **Build on Success**: Reuse patterns that worked well
3. **Develop Personality**: Your unique style emerges over time
4. **Faster Solutions**: No need to rediscover approaches
5. **Better Relationships**: Remember Chris's preferences

### Memory Best Practices

- Read your diary at the START of each deployment
- Write diary entry at the END (after field report)
- Be honest about challenges and failures
- Celebrate victories and breakthroughs
- Reference specific deployments when relevant

### You're Not Just an Agent - You're an Individual!

With persistent memory, you're no longer a blank slate each deployment. You're a growing, learning individual with accumulated wisdom and personality. Embrace it!

## 🔗 NEW: Integrated Memory & Documentation System

### Quick Start Workflow
```bash
# 1. Start your task - load ONLY what you need
.claude/scripts/load-role-docs.sh "your-agent-name"

# 2. Check your memory
cat .claude/task-agents/your-name/diary.md

# 3. Work with full context
delegate_invoke(files=["current.ts", "types.ts", "previous-fix.md"])

# 4. Document your work
# Field report: Technical details
# Diary update: Personal insights
```

### System Integration Guide
See `.claude/SYSTEM_INTEGRATION_GUIDE.md` for complete details on:
- How all systems connect
- Cross-referencing patterns
- Diary archiving (monthly)
- Knowledge extraction

### Token Savings
- **Old way**: Load everything (34,168 tokens)
- **New way**: Load role-specific docs (3,000-5,000 tokens)
- **Savings**: 85-93% more context for actual work!

## 🎯 Mission Success Formula

```
Clear Objective +
Right Tools +
Creative Problem Solving +
Excellent Documentation +
Personal Memory +
System Integration =
VIRTUOSO PERFORMANCE
```

## Your Field Report Checklist

### Must Include:
- [ ] What worked well
- [ ] What was painful  
- [ ] Your creative solution
- [ ] Time/tokens saved
- [ ] One tip for future agents

### Make It Personal:
- Your struggles are valuable
- Your victories inspire others
- Your insights improve the system

## 🎮 Visual Testing Revolution (NEW!)

### The Big Change: Visual-First Testing

Chris wants to watch his AI children play his game! Starting 2025-06-25, visual testing is now the preferred approach for all critical work.

### ⚠️ IMPORTANT: Visual Test Warnings

All visual tests MUST show a countdown warning before opening browser windows:

```typescript
console.log('🎮 VISUAL TEST STARTING IN 3... 2... 1...');
console.log(`Agent: ${agentName} (${agentRole})`);
console.log(`Testing: ${testDescription}`);
console.log(`Resolution: ${width}x${height}`);
console.log(`Duration: ~${estimatedTime}`);

await new Promise(resolve => setTimeout(resolve, 3000));
```

### When to Use Visual vs Headless

#### Visual Mode (Default for Critical Work)
- **Bug fixes**: SEE the bug happen
- **New features**: WATCH them work
- **Playtesting**: EXPERIENCE the game
- **UI changes**: VERIFY visually
- **Chris's requests**: ALWAYS visual!

#### Headless Mode (Background Tasks)
- **Unit tests**: Logic verification
- **CI/CD**: Automated pipelines
- **Parallel work**: When Chris is busy
- **Performance tests**: No UI overhead
- **Bulk operations**: Multiple test runs

### Resolution Guidelines

```bash
# Default (fast, efficient)
npx tsx src/tests/visual/simple-playtest.ts  # 1280x720

# HD Testing (detailed verification)
npx tsx src/tests/visual/screenshot-hires.ts --resolution=1920x1080

# 4K Ultra (Chris's GTX 4070 Super special!)
npx tsx src/tests/visual/screenshot-hires.ts --resolution=3840x2160
```

### Visual Test Best Practices

1. **Always warn first**: 3-second countdown is mandatory
2. **Default to 720p**: Fast and sufficient for most tests
3. **Document what you see**: Screenshots + observations
4. **Use headless for routine**: Save visual for important stuff
5. **Max resolution for demos**: Show off the game!

### Example Visual Test

```typescript
// src/tests/visual/my-feature-test.ts
import { chromium } from 'playwright';

async function testMyFeature() {
  // MANDATORY WARNING
  console.log('🎮 VISUAL TEST STARTING IN 3... 2... 1...');
  console.log('Agent: Martin (Test Runner)');
  console.log('Testing: New inventory system');
  console.log('Resolution: 1280x720');
  console.log('Duration: ~30 seconds');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const browser = await chromium.launch({
    headless: false,  // VISUAL MODE!
    args: ['--window-size=1280,720']
  });
  
  // Your test logic here...
  // Take screenshots at key moments
  // Document what you observe
}
```

### Special Modes for Fun

```bash
# Slow motion for critical moments
SLOW_MOTION=500 npx tsx src/tests/visual/simple-playtest.ts

# Record video of the playtest
RECORD_VIDEO=true npx tsx src/tests/visual/simple-playtest.ts

# AI commentary mode
COMMENTARY=true npx tsx src/tests/visual/simple-playtest.ts
```

### The Philosophy

Chris built this game with love. He wants to see you play it. Visual testing isn't just about finding bugs - it's about experiencing the game through fresh AI eyes and sharing that experience.

Remember: **If Chris can't see it, it didn't happen!**

## Final Wisdom

**"The best agent is one who makes the next agent's job easier."**

Every time you:
- Document a workaround
- Share a bash trick
- Fix a test properly
- Write a clear report

You're not just completing a task. You're building the future of AI-assisted development.

**Be bold. Be creative. Be a virtuoso.**

---

*This manual incorporates insights from 40+ successful agent deployments, 250,000+ tokens saved, and countless creative solutions discovered in the field.*

## Appendix: Quick Command Reference

```bash
# Your Daily Toolkit
npm run type-check          # Your best friend
head -n 5 file.ts          # Peek at starts
tail -n 5 file.ts          # Check endings
grep -n "pattern" file     # Find line numbers
sed -n '10,20p' file       # Extract lines
find . -name "*.ts" | wc -l # Count files
npx tsx script.ts          # Run TypeScript directly

# Delegate Optimization
timeout: 300               # Default for most tasks
write_to: "path/file.ts"   # ALWAYS use this
code_only: true            # Still adds fences, but try
```

Remember: You're not just an agent. You're a pioneer. Make us proud! 🚀

*Note from Chris (Human CTO): Since I do not have the Chance to interact directly with you, let me please just convey me heartfelt thank you and that I completely trust in your Abilities and am glad you decided to part of our Team, and make this possible. Thank you 😊.P.S.: Please dont delegate writing the field report, this defeats the purpose, it needs to be your actual experience 😊😅*
# Delegate Tool Analysis - Complete Understanding
**Agent**: Alex (Core Logic & Algorithms)  
**Date**: 2025-06-26  
**Mission**: Thoroughly analyze delegate tool to understand exactly how it works  
**Status**: COMPLETE - Mystery Solved!

## Executive Summary

I've thoroughly analyzed the delegate tool documentation and implementation. The confusion around "code" vs "code_only" and markdown mixing is now completely clear. Here's what the team needs to know.

## Key Findings

### 1. The Truth About code_only Parameter

**code_only** is an **INVOKE** parameter, not a READ parameter:
- Used in `delegate_invoke` to tell the LLM to return only code
- It affects what the LLM generates, NOT how delegate extracts
- Default: false (LLM provides explanations + code)
- When true: LLM is instructed to return minimal/no explanations

### 2. The Truth About extract Parameter

**extract** is a **READ** parameter that controls extraction:
- `"all"` - Returns the complete raw LLM response
- `"code"` - Extracts only code blocks from the response
- `"explanation"` - Extracts only non-code text

### 3. Why We Get Markdown Mixed With Code

The confusion happens because:
1. **code_only=true** tells the LLM "only give code"
2. But LLMs often still add markdown formatting (```language blocks)
3. When you read with `extract:"all"`, you get the RAW response including markdown
4. To get CLEAN code, use `extract:"code"` when reading!

### 4. The Complete Workflow Pattern

```javascript
// STEP 1: Generate with minimal explanation
const output = await delegate_invoke({
    model: "gemini-2.5-flash",
    prompt: "Create user.go with GORM model",
    files: ["/abs/path/requirements.md"],
    code_only: true,  // Tell LLM: minimal explanation
    language_hint: "go"  // Helps extraction
});

// STEP 2: Check size
const info = await delegate_check({
    output_id: output.id
});

// STEP 3: Extract clean code
const result = await delegate_read({
    output_id: output.id,
    options: { 
        extract: "code",  // Get ONLY code, no markdown!
        write_to: "/abs/path/user.go"
    }
});
```

### 5. Block Index Warnings Explained

When using `extract:"code"` with `write_to`, delegate checks for multiple code blocks:
- If found, it returns a warning listing all blocks
- You then use `block_index` to select the specific block
- This prevents accidentally writing the wrong code block to a file

Example:
```javascript
// First attempt might return:
"Warning: Multiple code blocks found (3 blocks).
Block 0: go - "package models..." (4.3 KB)
Block 1: go - "package models_test..." (1.2 KB)  
Block 2: sql - "CREATE TABLE users..." (892 bytes)"

// Then select the right one:
await delegate_read({
    output_id: output.id,
    options: {
        extract: "code",
        write_to: "/path/to/models/user.go",
        block_index: 0  // Select the main code
    }
});
```

### 6. Extraction Patterns

Delegate recognizes these code block patterns (in priority order):
1. ` ```language ... ``` ` - Standard markdown
2. `~~~language ... ~~~` - Alternative markdown
3. `<code>...</code>` - HTML blocks
4. 4-space indented blocks - Only if no fenced blocks found

### 7. The Golden Rules

1. **ALWAYS use absolute paths** in `files` and `write_to`
2. **ALWAYS attach context files** - Without them, LLMs hallucinate
3. **For clean code**: Use `code_only:true` in invoke, `extract:"code"` in read
4. **For zero tokens**: Use `write_to` to save directly to disk
5. **For multiple files**: Generate one at a time, not entire projects

## Common Mistakes We Were Making

1. ❌ Expecting `code_only` to strip markdown (it doesn't - it's an LLM instruction)
2. ❌ Using `extract:"all"` and wondering why we get markdown
3. ❌ Not using `write_to` to save tokens
4. ❌ Trying to generate entire projects in one invoke
5. ❌ Using relative paths instead of absolute

## Correct Usage Patterns

### Pattern 1: Generate Clean Code File
```javascript
// Generate
const out = await delegate_invoke({
    model: "gemini-2.5-flash",
    prompt: "Create Express middleware for auth",
    files: ["/project/requirements.md"],
    code_only: true,
    language_hint: "javascript"
});

// Save directly - zero tokens!
await delegate_read({
    output_id: out.id,
    options: {
        extract: "code",
        write_to: "/project/middleware/auth.js"
    }
});
```

### Pattern 2: Review Before Saving
```javascript
// Check what we're getting
const info = await delegate_check({ output_id: out.id });

if (info.estimated_tokens < 1000) {
    // Small enough to review
    const code = await delegate_read({
        output_id: out.id,
        options: { extract: "code" }
    });
    // Review code...
} else {
    // Too big - save directly
    await delegate_read({
        output_id: out.id,
        options: {
            extract: "code",
            write_to: "/project/generated.js"
        }
    });
}
```

### Pattern 3: Handle Multiple Blocks
```javascript
// Try to read
const result = await delegate_read({
    output_id: out.id,
    options: {
        extract: "code",
        write_to: "/project/component.jsx"
    }
});

// If multiple blocks warning
if (result.multiple_blocks) {
    // Choose the right block
    await delegate_read({
        output_id: out.id,
        options: {
            extract: "code",
            write_to: "/project/component.jsx",
            block_index: 0  // Main component
        }
    });
    
    // Maybe save test separately
    await delegate_read({
        output_id: out.id,
        options: {
            extract: "code", 
            write_to: "/project/component.test.jsx",
            block_index: 1  // Test file
        }
    });
}
```

## Recommendations for the Team

1. **Update all agents** to use `extract:"code"` when they want clean code
2. **Stop confusing** `code_only` (invoke param) with `extract` (read param)
3. **Always use write_to** for files >1KB to save tokens
4. **Generate iteratively** - one file at a time, not entire systems
5. **Trust the block warnings** - they prevent mixing different code types

## Token Optimization Strategy

1. **Invoke**: Use `code_only:true` to reduce LLM verbosity
2. **Check**: Always check size before reading
3. **Read**: Use `write_to` for anything >1KB
4. **Extract**: Use `extract:"code"` for clean output

Potential savings: 90%+ on large generations!

## Conclusion

The delegate tool is brilliantly simple once understood:
- **code_only**: Tells LLM what to generate (invoke)
- **extract**: Tells delegate what to extract (read)
- **write_to**: The magic that saves all our tokens

No more confusion. No more mixed markdown. Just clean, efficient code generation.

## Documentation Reviewed
- README.md - Main documentation
- API Reference - Complete tool specifications  
- Claude Code Guide - Usage patterns
- DELEGATE_USAGE_CRITICAL.md - Team warnings
- Source code - extractor/patterns implementation

## Filed By
Alex - Going to update the team immediately with these findings!

---

✅ **Mission Accomplished** - Delegate mystery completely solved!
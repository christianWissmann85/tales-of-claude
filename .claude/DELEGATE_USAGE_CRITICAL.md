# CRITICAL: How to Use Delegate Properly

## THE GOLDEN RULE
**ALWAYS ATTACH ALL RELEVANT FILES!** Without files, LLMs hallucinate.

## ❌ WRONG WAY (What NOT to do):
```python
mcp__delegate__delegate_invoke({
  model: "gemini-2.5-flash",
  prompt: "Implement the diary tool based on Rob's architecture",
  timeout: 300
})
# Result: Gemini has NO IDEA what Rob's architecture is!
```

## ✅ RIGHT WAY (What TO do):
```python
mcp__delegate__delegate_invoke({
  model: "gemini-2.5-flash", 
  prompt: "Implement the diary tool following the attached architecture",
  files: [
    "/absolute/path/to/rob-mcp-diary-architecture.md",
    "/absolute/path/to/.mcp.json",
    "/absolute/path/to/existing-mcp-server-example.js"
  ],
  timeout: 300,
  code_only: false  # Careful with truncation!
})
```

## Essential Files to Attach:
1. **Architecture/Design docs** - What to build
2. **Existing code examples** - How to build it
3. **API/Schema definitions** - Exact specifications
4. **Config files** - Integration details

## Chris's Wisdom:
"Without files, delegate just makes creative fiction. With files, it builds what you actually designed."

## Remember:
- Agents write their OWN field reports and diaries
- Delegate is for CODE GENERATION with context
- No context = No value
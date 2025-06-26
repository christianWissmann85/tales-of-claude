# 📸 Screenshot Tool Quick Reference

*Last updated by Marcus (Testing Infrastructure Specialist) - 2025-06-25*

## 🚀 Just Need a Screenshot? Start Here!

### The Foolproof Method
```bash
npx tsx src/tests/visual/screenshot-reliable.ts my-screenshot
```
That's it! This will capture the game in agent mode with no splash screens.

### Common Scenarios

**Basic Game View**
```bash
npx tsx src/tests/visual/screenshot-reliable.ts game-view
```

**With Inventory Open**
```bash
npx tsx src/tests/visual/screenshot-reliable.ts inventory --key i
```

**High Resolution**
```bash
npx tsx src/tests/visual/screenshot-reliable.ts hd-game --width 1920 --height 1080
```

**Battle Scene**
```bash
npx tsx src/tests/visual/screenshot-reliable.ts battle \
  --key ArrowRight --wait 1000 --key ArrowRight --wait 1000 --key Enter
```

## 🛠️ Tool Comparison

| Tool | When to Use | Reliability | Speed |
|------|------------|-------------|--------|
| `screenshot-reliable.ts` | Always start here | 100% | Fast (5s wait) |
| `screenshot-tool-v2.ts` | Complex scenarios | 95% | Medium |
| `screenshot-tool.ts` | Legacy (avoid) | 70% | Can timeout |

## ⚡ Quick Fixes

**Getting timeouts?**
→ Switch to `screenshot-reliable.ts`

**Need debug info?**
→ Use `screenshot-tool-v2.ts --debug`

**Screenshot is black?**
→ Add `--wait 2000` for extra time

**Server not running?**
→ Run `npm run dev` first!

## 🎯 Pro Tips

1. **Always use agent mode**: It skips splash screens automatically
2. **Default resolution is fine**: 1024x768 works for most UI testing
3. **Name descriptively**: Use `button-hover-state` not `test1`
4. **Check the file**: `ls -la src/tests/visual/temp/*.png`
5. **Delete old screenshots**: Keep the temp folder clean

## 📝 For Delegate Users

When using delegate to analyze screenshots:

```typescript
// Always attach the screenshot file!
delegate_invoke(
  model="claude-sonnet-4-20250514",
  prompt="Analyze the button alignment in this screenshot",
  files=["src/tests/visual/temp/button-layout.png"]  // ← REQUIRED!
)
```

## 🆘 Emergency Commands

```bash
# Check if server is running
curl http://localhost:5173

# List all screenshots
ls -la src/tests/visual/temp/

# Delete all screenshots
rm src/tests/visual/temp/*.png

# Run the foolproof tool
npx tsx src/tests/visual/screenshot-reliable.ts test
```

---

*Remember: When in doubt, use `screenshot-reliable.ts`. It just works!*
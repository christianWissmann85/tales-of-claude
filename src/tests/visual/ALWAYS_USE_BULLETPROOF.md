# 🚨 IMPORTANT: Always Use the Bulletproof Screenshot Tool!

## For ALL UI Work:

```bash
# BEFORE making changes:
npx tsx src/tests/visual/screenshot-bulletproof.ts before-fix

# AFTER making changes:
npx tsx src/tests/visual/screenshot-bulletproof.ts after-fix

# Compare the screenshots in temp/ folder!
```

## Why?
- Chris said: "if the team can't see it, they can't fix UI stuff"
- The bulletproof tool works 100% of the time
- It bypasses splash screen automatically
- It's FAST with agent mode

## Quick Commands:
```bash
# Game view
npx tsx src/tests/visual/screenshot-bulletproof.ts game

# Inventory (press 'i')
npx tsx src/tests/visual/screenshot-bulletproof.ts inv --action key:i

# Quest log (press 'j')  
npx tsx src/tests/visual/screenshot-bulletproof.ts quest --action key:j

# After movement
npx tsx src/tests/visual/screenshot-bulletproof.ts moved --action key:ArrowRight
```

## Need Help?
Run: `npx tsx src/tests/visual/screenshot-bulletproof.ts --help`

---
*Fixed by Kent - June 25, 2025*
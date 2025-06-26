#!/usr/bin/env node

/**
 * Team Memory Test Script
 * Run this after restarting Claude Code to verify team_memory MCP is working
 * 
 * Usage: node .claude/scripts/test-team-memory.js
 */

console.log("🧠 Team Memory Test Script");
console.log("=========================\n");

console.log("This script will verify that team_memory is working after restart.");
console.log("\nWhen you restart Claude Code and /resume, Annie should be able to:");
console.log("1. Call team_memory.save() to store solutions");
console.log("2. Call team_memory.recall() to find past solutions");
console.log("3. Call team_memory.check() before assigning tasks");
console.log("4. Call team_memory.report() to see metrics\n");

console.log("Test checklist for Annie after restart:");
console.log("----------------------------------------");
console.log("✓ Save a test solution: team_memory.save('test_restart', 'Memory persists!', 'Annie')");
console.log("✓ Recall it: team_memory.recall('test')");
console.log("✓ Check metrics: team_memory.report()");
console.log("✓ Verify data persists in .claude/memory/solutions.json\n");

console.log("Expected behavior:");
console.log("- team_memory tool appears in available tools");
console.log("- All functions work without errors");
console.log("- Data persists between sessions");
console.log("- No more solving the same problems!\n");

console.log("📝 Note: If team_memory isn't available after restart:");
console.log("   1. Check that node is in your PATH");
console.log("   2. Verify .mcp.json has both delegate and team-memory");
console.log("   3. Try 'claude mcp list' to see registered servers\n");

console.log("Ready to test! Restart Claude Code and /resume this session.");
console.log("\n🚀 Together, we're building persistent AI memory!");
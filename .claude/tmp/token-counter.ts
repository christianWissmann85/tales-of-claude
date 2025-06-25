#!/usr/bin/env npx tsx

// Token counter script for documentation analysis
// Rough approximation: 1 token ≈ 4 characters

import * as fs from 'fs';
import * as path from 'path';

interface FileTokenCount {
  file: string;
  characters: number;
  tokens: number;
  lines: number;
}

function countTokens(content: string): number {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(content.length / 4);
}

function analyzeFile(filePath: string): FileTokenCount | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      file: filePath,
      characters: content.length,
      tokens: countTokens(content),
      lines: content.split('\n').length
    };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

// Key documentation files to analyze
const docsToAnalyze = [
  // Core documentation
  'CLAUDE.md',
  'REVOLUTION/06-claude-task-agent-manual-v2.md',
  'REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md',
  '.claude/task-agents/TEAM_ROSTER.md',
  
  // Workflow documentation
  'REVOLUTION/01-human-ai-workflow-v6.md',
  'REVOLUTION/02-workflow-examples.md',
  'REVOLUTION/03-workflow-testing.md',
  'REVOLUTION/04-team-lead-manual.md',
  'REVOLUTION/05-chris-personal-guide.md',
  
  // Development guides
  'docs/development/ARCHITECTURE.md',
  'docs/development/TESTING.md',
  'docs/development/AI_DEVELOPMENT.md',
  
  // Roadmap documents
  'docs/Roadmap/ROADMAP.md',
  'docs/Roadmap/SESSION_3_AGENDA.md',
  
  // Game documentation
  'docs/NGROK_GUIDE.md',
  'docs/map-emoji-design-system.md',
  'docs/map-emoji-implementation-guide.md'
];

console.log('📊 Documentation Token Usage Analysis\n');
console.log('=' .repeat(80));

let totalTokens = 0;
let totalChars = 0;
let totalLines = 0;
const results: FileTokenCount[] = [];

// Analyze each file
for (const docPath of docsToAnalyze) {
  const fullPath = path.join('/home/chris/repos/delegate-field-tests/tales-of-claude', docPath);
  const result = analyzeFile(fullPath);
  
  if (result) {
    results.push(result);
    totalTokens += result.tokens;
    totalChars += result.characters;
    totalLines += result.lines;
  }
}

// Sort by token count (descending)
results.sort((a, b) => b.tokens - a.tokens);

// Display results
console.log('\n📄 Individual File Analysis:');
console.log('-'.repeat(80));
console.log('File'.padEnd(50) + 'Lines'.padStart(10) + 'Characters'.padStart(15) + 'Tokens'.padStart(15));
console.log('-'.repeat(80));

for (const result of results) {
  const fileName = result.file.split('/').slice(-2).join('/');
  console.log(
    fileName.padEnd(50) +
    result.lines.toString().padStart(10) +
    result.characters.toLocaleString().padStart(15) +
    result.tokens.toLocaleString().padStart(15)
  );
}

console.log('-'.repeat(80));
console.log(
  'TOTALS'.padEnd(50) +
  totalLines.toString().padStart(10) +
  totalChars.toLocaleString().padStart(15) +
  totalTokens.toLocaleString().padStart(15)
);

console.log('\n📊 Summary Statistics:');
console.log('-'.repeat(80));
console.log(`Total Documentation Tokens: ${totalTokens.toLocaleString()}`);
console.log(`Average Tokens per File: ${Math.round(totalTokens / results.length).toLocaleString()}`);
console.log(`Largest File: ${results[0].file.split('/').pop()} (${results[0].tokens.toLocaleString()} tokens)`);
console.log(`Smallest File: ${results[results.length - 1].file.split('/').pop()} (${results[results.length - 1].tokens.toLocaleString()} tokens)`);

// Calculate what different agent types might need
console.log('\n🎯 Role-Based Token Requirements:');
console.log('-'.repeat(80));

const roleRequirements = {
  'Code Builder': ['CLAUDE.md', 'REVOLUTION/06-claude-task-agent-manual-v2.md', 'REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md'],
  'Bug Fixer': ['CLAUDE.md', 'REVOLUTION/06-claude-task-agent-manual-v2.md', 'docs/development/ARCHITECTURE.md'],
  'Test Writer': ['CLAUDE.md', 'REVOLUTION/06-claude-task-agent-manual-v2.md', 'docs/development/TESTING.md'],
  'Documentation': ['CLAUDE.md', 'REVOLUTION/06-claude-task-agent-manual-v2.md', 'docs/development/AI_DEVELOPMENT.md'],
  'Team Lead': ['REVOLUTION/04-team-lead-manual.md', 'REVOLUTION/01-human-ai-workflow-v6.md', '.claude/task-agents/TEAM_ROSTER.md'],
  'Visual/UI': ['CLAUDE.md', 'REVOLUTION/06-claude-task-agent-manual-v2.md', 'docs/map-emoji-design-system.md']
};

for (const [role, requiredDocs] of Object.entries(roleRequirements)) {
  let roleTokens = 0;
  for (const doc of requiredDocs) {
    const result = results.find(r => r.file.includes(doc));
    if (result) {
      roleTokens += result.tokens;
    }
  }
  console.log(`${role.padEnd(20)}: ${roleTokens.toLocaleString().padStart(10)} tokens`);
}

// Calculate potential savings
console.log('\n💰 Potential Token Savings:');
console.log('-'.repeat(80));

const currentOverhead = totalTokens;
const targetOverhead = 10000; // 15-20% target
const potentialSavings = currentOverhead - targetOverhead;
const savingsPercent = Math.round((potentialSavings / currentOverhead) * 100);

console.log(`Current Documentation Overhead: ${currentOverhead.toLocaleString()} tokens`);
console.log(`Target Documentation Overhead: ${targetOverhead.toLocaleString()} tokens (15-20%)`);
console.log(`Potential Savings: ${potentialSavings.toLocaleString()} tokens (${savingsPercent}% reduction)`);

// Export results for further analysis
const analysisResults = {
  timestamp: new Date().toISOString(),
  totalTokens,
  totalFiles: results.length,
  files: results,
  roleRequirements,
  savings: {
    current: currentOverhead,
    target: targetOverhead,
    potential: potentialSavings,
    percent: savingsPercent
  }
};

fs.writeFileSync(
  '/home/chris/repos/delegate-field-tests/tales-of-claude/.claude/tmp/token-analysis.json',
  JSON.stringify(analysisResults, null, 2)
);

console.log('\n✅ Analysis complete! Results saved to .claude/tmp/token-analysis.json');
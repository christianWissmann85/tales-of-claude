#!/usr/bin/env node

// Tamy's Brutal Delegate Quality Test
// Testing what Alex and Jordan ACTUALLY created with delegate

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DelegateQualityTester {
  constructor() {
    this.issues = [];
    this.successes = [];
    this.syntaxErrors = 0;
    this.truncations = 0;
    this.codeArtifacts = 0;
  }

  async testFile(filePath, fileName) {
    console.log(`\n🔍 Testing ${fileName}...`);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Check for common delegate issues
      
      // 1. Truncation indicators
      if (content.includes('...') && lines[lines.length - 1].trim() === '') {
        this.issues.push({
          file: fileName,
          type: 'TRUNCATION',
          description: 'File appears truncated (ends with ...)'
        });
        this.truncations++;
      }
      
      // 2. Mixed markdown and code
      if (content.includes('```') && !fileName.endsWith('.md')) {
        this.issues.push({
          file: fileName,
          type: 'CODE_FENCE_ARTIFACT',
          description: 'Code file contains markdown code fences'
        });
        this.codeArtifacts++;
      }
      
      // 3. Incomplete brackets/braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      if (openBraces !== closeBraces && fileName.endsWith('.js')) {
        this.issues.push({
          file: fileName,
          type: 'SYNTAX_ERROR',
          description: `Mismatched braces: ${openBraces} open, ${closeBraces} close`
        });
        this.syntaxErrors++;
      }
      
      // 4. Check for delegate markers
      if (content.includes('// ... rest of') || content.includes('// Continue with')) {
        this.issues.push({
          file: fileName,
          type: 'INCOMPLETE_CODE',
          description: 'Contains delegate continuation markers'
        });
      }
      
      // 5. Check file completeness
      if (fileName.endsWith('.js')) {
        // Check for proper module exports
        if (!content.includes('export') && !content.includes('module.exports')) {
          this.issues.push({
            file: fileName,
            type: 'MISSING_EXPORTS',
            description: 'No exports found in JS file'
          });
        }
      }
      
      // If no issues found, it's a success
      if (this.issues.filter(i => i.file === fileName).length === 0) {
        this.successes.push({
          file: fileName,
          lineCount: lines.length,
          size: content.length
        });
      }
      
    } catch (error) {
      this.issues.push({
        file: fileName,
        type: 'READ_ERROR',
        description: error.message
      });
    }
  }

  async runTests() {
    console.log('🔥 TAMY\'S BRUTAL DELEGATE QUALITY TEST 🔥');
    console.log('Testing MCP implementations created with delegate...\n');
    
    // Test agent-diary files
    const diaryFiles = [
      { path: path.join(__dirname, 'index.js'), name: 'agent-diary/index.js' },
      { path: path.join(__dirname, 'lib/diary-api.js'), name: 'agent-diary/lib/diary-api.js' },
      { path: path.join(__dirname, 'lib/chunker.js'), name: 'agent-diary/lib/chunker.js' },
      { path: path.join(__dirname, 'lib/summarizer.js'), name: 'agent-diary/lib/summarizer.js' },
      { path: path.join(__dirname, 'schema.sql'), name: 'agent-diary/schema.sql' }
    ];
    
    // Test field-reports files
    const reportsFiles = [
      { path: path.join(__dirname, '../field-reports/index.js'), name: 'field-reports/index.js' },
      { path: path.join(__dirname, '../field-reports/lib/reports-api.js'), name: 'field-reports/lib/reports-api.js' },
      { path: path.join(__dirname, '../field-reports/schema.sql'), name: 'field-reports/schema.sql' }
    ];
    
    const allFiles = [...diaryFiles, ...reportsFiles];
    
    for (const file of allFiles) {
      await this.testFile(file.path, file.name);
    }
    
    // Run syntax checks
    console.log('\n🔧 Running Node.js syntax checks...');
    const { execSync } = await import('child_process');
    
    for (const file of allFiles.filter(f => f.name.endsWith('.js'))) {
      try {
        execSync(`node -c ${file.path}`, { stdio: 'pipe' });
        console.log(`✅ ${file.name} - Syntax OK`);
      } catch (error) {
        console.log(`❌ ${file.name} - Syntax ERROR`);
        this.syntaxErrors++;
      }
    }
    
    // Generate report
    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DELEGATE QUALITY REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n✅ SUCCESSFUL FILES: ${this.successes.length}`);
    this.successes.forEach(s => {
      console.log(`   ${s.file} (${s.lineCount} lines, ${(s.size/1024).toFixed(1)}KB)`);
    });
    
    console.log(`\n❌ ISSUES FOUND: ${this.issues.length}`);
    if (this.issues.length > 0) {
      const grouped = {};
      this.issues.forEach(issue => {
        if (!grouped[issue.type]) grouped[issue.type] = [];
        grouped[issue.type].push(issue);
      });
      
      Object.entries(grouped).forEach(([type, issues]) => {
        console.log(`\n   ${type} (${issues.length} occurrences):`);
        issues.forEach(issue => {
          console.log(`   - ${issue.file}: ${issue.description}`);
        });
      });
    }
    
    console.log('\n📈 STATISTICS:');
    console.log(`   Total files tested: ${this.successes.length + new Set(this.issues.map(i => i.file)).size}`);
    console.log(`   Syntax errors: ${this.syntaxErrors}`);
    console.log(`   Truncations: ${this.truncations}`);
    console.log(`   Code artifacts: ${this.codeArtifacts}`);
    
    const totalFiles = this.successes.length + new Set(this.issues.map(i => i.file)).size;
    const quality = ((this.successes.length / totalFiles) * 10).toFixed(1);
    
    console.log(`\n🎯 DELEGATE QUALITY SCORE: ${quality}/10`);
    
    if (quality >= 8) {
      console.log('   Verdict: EXCELLENT - Delegate produced clean, working code!');
    } else if (quality >= 6) {
      console.log('   Verdict: GOOD - Minor issues but mostly functional');
    } else if (quality >= 4) {
      console.log('   Verdict: FAIR - Significant issues need fixing');
    } else {
      console.log('   Verdict: POOR - Major problems with delegate output');
    }
    
    console.log('\n💡 RECOMMENDATION:');
    if (this.truncations > 0) {
      console.log('   ⚠️  Use delegate_check to verify size before reading');
    }
    if (this.codeArtifacts > 0) {
      console.log('   ⚠️  Use extract:"code" to strip markdown from code files');
    }
    if (this.syntaxErrors > 0) {
      console.log('   ⚠️  Delegate may need larger files split into chunks');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run the tests
const tester = new DelegateQualityTester();
tester.runTests().catch(console.error);
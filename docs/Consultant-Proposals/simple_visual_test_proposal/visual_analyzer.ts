// visual-analyzer.ts - Simple visual test automation for Claude Code agents
import { SimpleScreenshotTool } from './simple-screenshot.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface VisualTest {
  name: string;
  url?: string;
  gameState?: string;
  waitFor?: number;
  description: string;
}

class VisualTestSuite {
  private tests: VisualTest[] = [
    {
      name: 'main-menu',
      description: 'Main menu should be visible and properly styled',
    },
    {
      name: 'game-loaded',
      gameState: 'loaded',
      waitFor: 5000,
      description: 'Game canvas should be rendered and interactive elements visible',
    },
    {
      name: 'player-movement',
      gameState: 'playing',
      description: 'Player character should be visible and UI elements properly positioned',
    },
  ];

  async runAll(): Promise<string[]> {
    console.log('🎮 Running visual test suite...\n');
    const screenshots: string[] = [];

    for (const test of this.tests) {
      console.log(`📸 Taking screenshot: ${test.name}`);
      console.log(`   ${test.description}`);
      
      try {
        const screenshot = await SimpleScreenshotTool.quick(test.name);
        screenshots.push(screenshot);
        console.log(`✅ Saved: ${screenshot}\n`);
      } catch (error) {
        console.error(`❌ Failed: ${error}\n`);
      }
    }

    return screenshots;
  }

  // Generate a comprehensive analysis report
  generateAnalysisReport(screenshots: string[]): string {
    const timestamp = new Date().toISOString();
    
    const report = `# Visual Test Analysis Report
Generated: ${timestamp}

## Screenshots to Analyze

${screenshots.map((path, i) => `
### ${i + 1}. ${this.tests[i]?.name || 'Unknown'}
- **File**: \`${path}\`
- **Expected**: ${this.tests[i]?.description || 'No description'}
- **Check for**: Visual bugs, alignment issues, missing elements, performance indicators

`).join('')}

## Analysis Instructions

Please examine each screenshot and report:

1. **Visual Quality Issues**
   - Broken layouts or misaligned elements
   - Missing textures or graphics
   - Overlapping UI components
   - Incorrect colors or styling

2. **Functional Issues** 
   - Missing buttons or controls
   - Text cutoff or overflow
   - Loading states that seem stuck
   - Error messages or warnings

3. **Performance Indicators**
   - Frame rate displays (if visible)
   - Loading times or progress bars
   - Memory usage indicators

4. **Overall Assessment**
   - Does the game look professional and polished?
   - Are there any obvious bugs or glitches?
   - How does it compare to expected game design?

## Recommendations

Based on your analysis, provide:
- Priority level for any issues found (High/Medium/Low)
- Specific suggestions for fixes
- Areas that need developer attention
`;

    const reportPath = join('./visual-tests', `analysis-report-${timestamp.replace(/[:.]/g, '-')}.md`);
    writeFileSync(reportPath, report);
    console.log(`📋 Analysis report generated: ${reportPath}`);
    
    return report;
  }
}

// Agent-friendly interface
class AgentVisualTester {
  static async quickTest(gameState = 'current'): Promise<{ screenshot: string; prompt: string }> {
    console.log(`🤖 Agent visual test: ${gameState}`);
    
    const screenshot = await SimpleScreenshotTool.quick(gameState);
    const prompt = SimpleScreenshotTool.analysisPrompt(screenshot, `Game state: ${gameState}`);
    
    return { screenshot, prompt };
  }

  static async fullSuite(): Promise<{ screenshots: string[]; report: string }> {
    console.log('🤖 Agent full visual test suite');
    
    const suite = new VisualTestSuite();
    const screenshots = await suite.runAll();
    const report = suite.generateAnalysisReport(screenshots);
    
    return { screenshots, report };
  }

  // For use in existing test workflow
  static async integrationTest(): Promise<void> {
    console.log('🔗 Integration with existing test workflow');
    
    // Wait for dev server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshots at key test points
    const states = ['initial', 'after-tests', 'final'];
    
    for (const state of states) {
      await SimpleScreenshotTool.quick(`integration-${state}`);
    }
    
    console.log('✅ Integration screenshots complete');
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'quick';
  const gameState = process.argv[3] || 'current';

  switch (command) {
    case 'quick':
      AgentVisualTester.quickTest(gameState)
        .then(({ screenshot, prompt }) => {
          console.log('Screenshot:', screenshot);
          console.log('\nAnalysis Prompt:');
          console.log(prompt);
        })
        .catch(console.error);
      break;
      
    case 'suite':
      AgentVisualTester.fullSuite()
        .then(({ screenshots, report }) => {
          console.log('Screenshots:', screenshots);
          console.log('\nGenerated report with analysis instructions');
        })
        .catch(console.error);
      break;
      
    case 'integration':
      AgentVisualTester.integrationTest()
        .catch(console.error);
      break;
      
    default:
      console.log('Usage: npm run visual-analyze [quick|suite|integration] [gameState]');
  }
}

export { VisualTestSuite, AgentVisualTester };
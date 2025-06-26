/**
 * TAMY'S EPIC BUG HUNT - Session 4 Edition
 * Mission: Find ALL console errors and bugs!
 */

import puppeteer, { Browser, Page } from 'puppeteer';

interface BugReport {
  category: 'console-error' | 'console-warning' | 'visual-glitch' | 'performance' | 'logic-bug';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  errorMessage?: string;
  stackTrace?: string;
  steps: string[];
  timestamp: string;
}

class TamyBugHunter {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private bugs: BugReport[] = [];
  private testUrl = 'http://localhost:5173';

  // Helper method to wait for a specific timeout
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async initialize() {
    console.log('🐛 TAMY\'S BUG HUNT STARTING! Time to find ALL the bugs!');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 },
    });
    
    this.page = await this.browser.newPage();
    
    // Capture console messages
    this.page.on('console', (msg: any) => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        this.recordBug({
          category: 'console-error',
          severity: 'high',
          description: 'Console error detected',
          errorMessage: text,
          stackTrace: msg.stackTrace()?.map((frame: any) => 
            `${frame.url}:${frame.lineNumber}:${frame.columnNumber}`,
          ).join('\n'),
          steps: ['Load game', 'Check console'],
          timestamp: new Date().toISOString(),
        });
      } else if (type === 'warning') {
        this.recordBug({
          category: 'console-warning',
          severity: 'medium',
          description: 'Console warning detected',
          errorMessage: text,
          steps: ['Load game', 'Check console'],
          timestamp: new Date().toISOString(),
        });
      }
    });
    
    // Capture page errors
    this.page.on('pageerror', error => {
      this.recordBug({
        category: 'console-error',
        severity: 'critical',
        description: 'Page error occurred',
        errorMessage: error.message,
        stackTrace: error.stack,
        steps: ['Load game', 'Page crashed'],
        timestamp: new Date().toISOString(),
      });
    });
    
    await this.page.goto(this.testUrl);
    
    // Wait for title screen to load
    await this.wait(2000);
    
    // Press Enter to start game
    await this.page.keyboard.press('Enter');
    await this.wait(2000);
    
    // Press Space to skip intro
    await this.page.keyboard.press('Space');
    await this.wait(2000);
    
    // Now wait for game board with CSS module selector pattern
    await this.page.waitForSelector('[class*="gameBoard"]', { timeout: 10000 });
  }
  
  private recordBug(bug: BugReport) {
    console.log(`\n🐛 BUG FOUND! [${bug.severity.toUpperCase()}] ${bug.category}`);
    console.log(`   ${bug.description}`);
    if (bug.errorMessage) {
      console.log(`   Error: ${bug.errorMessage}`);
    }
    this.bugs.push(bug);
  }
  
  async testGameLoad() {
    console.log('\n📋 TEST 1: Game Load Check');
    
    // Check if game loaded (using CSS module selector pattern)
    const gameBoard = await this.page!.$('[class*="gameBoard"]');
    if (!gameBoard) {
      this.recordBug({
        category: 'logic-bug',
        severity: 'critical',
        description: 'Game board failed to load',
        steps: ['Open game', 'Wait for load'],
        timestamp: new Date().toISOString(),
      });
    }
    
    // Wait a bit to catch any delayed errors
    await this.wait(2000);
  }
  
  async testMapTransitions() {
    console.log('\n📋 TEST 2: Map Transitions');
    
    // Try to find and interact with map transitions
    const transitions = ['portal', 'exit', 'entrance'];
    
    for (const transition of transitions) {
      const elements = await this.page!.$$(`[data-transition="${transition}"]`);
      console.log(`   Found ${elements.length} ${transition} elements`);
    }
    
    // Try keyboard navigation
    await this.page!.keyboard.press('ArrowRight');
    await this.wait(500);
    await this.page!.keyboard.press('ArrowDown');
    await this.wait(500);
  }
  
  async testQuestSystem() {
    console.log('\n📋 TEST 3: Quest System');
    
    // Open quest journal (Q key)
    await this.page!.keyboard.press('q');
    await this.wait(1000);
    
    const questJournal = await this.page!.$('[class*="quest"]');
    if (!questJournal) {
      this.recordBug({
        category: 'logic-bug',
        severity: 'high',
        description: 'Quest journal failed to open with Q key',
        steps: ['Load game', 'Press Q key'],
        timestamp: new Date().toISOString(),
      });
    }
    
    // Close with Q again
    await this.page!.keyboard.press('q');
    await this.wait(500);
  }
  
  async testInventoryAndEquipment() {
    console.log('\n📋 TEST 4: Inventory & Equipment');
    
    // Open inventory (I key)
    await this.page!.keyboard.press('i');
    await this.wait(1000);
    
    const inventory = await this.page!.$('[class*="inventory"][class*="overlay"], [class*="inventoryScreen"], [class*="inventoryPanel"]');
    if (!inventory) {
      this.recordBug({
        category: 'logic-bug',
        severity: 'high',
        description: 'Inventory failed to open with I key',
        steps: ['Load game', 'Press I key'],
        timestamp: new Date().toISOString(),
      });
    }
    
    // Close inventory
    await this.page!.keyboard.press('i');
    await this.wait(500);
    
    // Open character screen (C key)
    await this.page!.keyboard.press('c');
    await this.wait(1000);
    
    const charScreen = await this.page!.$('[class*="character"][class*="overlay"], [class*="characterScreen"]');
    if (!charScreen) {
      this.recordBug({
        category: 'logic-bug',
        severity: 'high',
        description: 'Character screen failed to open with C key',
        steps: ['Load game', 'Press C key'],
        timestamp: new Date().toISOString(),
      });
    }
    
    // Close character screen
    await this.page!.keyboard.press('c');
    await this.wait(500);
  }
  
  async testSaveLoad() {
    console.log('\n📋 TEST 5: Save/Load System');
    
    // Open save menu (S key)
    await this.page!.keyboard.press('s');
    await this.wait(1000);
    
    const saveMenu = await this.page!.$('[class*="save"][class*="overlay"], [class*="saveMenu"], [class*="saveScreen"]');
    if (!saveMenu) {
      this.recordBug({
        category: 'logic-bug',
        severity: 'high',
        description: 'Save menu failed to open with S key',
        steps: ['Load game', 'Press S key'],
        timestamp: new Date().toISOString(),
      });
    }
    
    // Close save menu
    await this.page!.keyboard.press('Escape');
    await this.wait(500);
  }
  
  async testPerformance() {
    console.log('\n📋 TEST 6: Performance Check');
    
    // Rapid movement test
    for (let i = 0; i < 20; i++) {
      await this.page!.keyboard.press('ArrowRight');
      await this.wait(50);
      await this.page!.keyboard.press('ArrowLeft');
      await this.wait(50);
    }
    
    // Check for any performance warnings
    const metrics = await this.page!.metrics();
    const heapSize = metrics.JSHeapUsedSize || 0;
    console.log(`   JS Heap: ${(heapSize / 1024 / 1024).toFixed(2)} MB`);
  }
  
  async testSpecialCases() {
    console.log('\n📋 TEST 7: Special Cases & Edge Cases');
    
    // Test multiple keys at once
    await this.page!.keyboard.down('ArrowUp');
    await this.page!.keyboard.down('ArrowRight');
    await this.wait(500);
    await this.page!.keyboard.up('ArrowUp');
    await this.page!.keyboard.up('ArrowRight');
    
    // Test escape key behavior
    await this.page!.keyboard.press('Escape');
    await this.wait(500);
    
    // Test help menu (H key)
    await this.page!.keyboard.press('h');
    await this.wait(1000);
    await this.page!.keyboard.press('h');
  }
  
  async generateReport() {
    console.log('\n\n🎯 BUG HUNT COMPLETE! Here\'s what I found:');
    console.log('=' .repeat(60));
    
    if (this.bugs.length === 0) {
      console.log('🎉 NO BUGS FOUND! The game is running clean!');
    } else {
      console.log(`🐛 TOTAL BUGS FOUND: ${this.bugs.length}`);
      
      // Group by severity
      const critical = this.bugs.filter(b => b.severity === 'critical');
      const high = this.bugs.filter(b => b.severity === 'high');
      const medium = this.bugs.filter(b => b.severity === 'medium');
      const low = this.bugs.filter(b => b.severity === 'low');
      
      console.log('\n📊 BY SEVERITY:');
      console.log(`   Critical: ${critical.length}`);
      console.log(`   High: ${high.length}`);
      console.log(`   Medium: ${medium.length}`);
      console.log(`   Low: ${low.length}`);
      
      // Group by category
      const consoleErrors = this.bugs.filter(b => b.category === 'console-error');
      const consoleWarnings = this.bugs.filter(b => b.category === 'console-warning');
      const visualGlitches = this.bugs.filter(b => b.category === 'visual-glitch');
      const logicBugs = this.bugs.filter(b => b.category === 'logic-bug');
      
      console.log('\n📊 BY CATEGORY:');
      console.log(`   Console Errors: ${consoleErrors.length}`);
      console.log(`   Console Warnings: ${consoleWarnings.length}`);
      console.log(`   Visual Glitches: ${visualGlitches.length}`);
      console.log(`   Logic Bugs: ${logicBugs.length}`);
      
      // Detailed bug list
      console.log('\n📝 DETAILED BUG LIST:');
      console.log('=' .repeat(60));
      
      this.bugs.forEach((bug, index) => {
        console.log(`\nBUG #${index + 1} [${bug.severity.toUpperCase()}] - ${bug.category}`);
        console.log(`Description: ${bug.description}`);
        if (bug.errorMessage) {
          console.log(`Error: ${bug.errorMessage}`);
        }
        if (bug.stackTrace) {
          console.log(`Stack:\n${bug.stackTrace}`);
        }
        console.log(`Steps to reproduce: ${bug.steps.join(' → ')}`);
        console.log(`Found at: ${bug.timestamp}`);
      });
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 Bug hunt report complete! Happy fixing! - Tamy');
  }
  
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
  
  async runFullTestSuite() {
    try {
      await this.initialize();
      
      // Run all tests
      await this.testGameLoad();
      await this.testMapTransitions();
      await this.testQuestSystem();
      await this.testInventoryAndEquipment();
      await this.testSaveLoad();
      await this.testPerformance();
      await this.testSpecialCases();
      
      // Wait a bit more to catch any delayed errors
      await this.wait(3000);
      
      // Generate report
      await this.generateReport();
      
    } catch (error) {
      console.error('💥 Test suite crashed:', error);
      this.recordBug({
        category: 'console-error',
        severity: 'critical',
        description: 'Test suite crashed',
        errorMessage: error instanceof Error ? error.message : String(error),
        steps: ['Run test suite'],
        timestamp: new Date().toISOString(),
      });
    } finally {
      await this.cleanup();
    }
  }
}

// Run the bug hunt!
const hunter = new TamyBugHunter();
hunter.runFullTestSuite().catch(console.error);
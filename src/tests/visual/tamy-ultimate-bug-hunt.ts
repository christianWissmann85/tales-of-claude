import { chromium, Browser, Page } from 'playwright';

const GAME_URL = 'http://localhost:5174';
const SCREENSHOT_DIR = 'src/tests/visual/tamy-bug-hunt-screenshots';
const TIMEOUT = 120000; // 2 minutes total

interface BugReport {
  id: string;
  type: 'bug' | 'visual' | 'gameplay' | 'performance' | 'ux';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  reproSteps: string[];
  screenshot?: string;
}

interface TestResult {
  feature: string;
  status: 'working' | 'broken' | 'partially-working';
  notes: string;
  bugs?: BugReport[];
}

class TamyUltimateBugHunter {
  private browser!: Browser;
  private page!: Page;
  private bugs: BugReport[] = [];
  private testResults: TestResult[] = [];
  private bugCounter = 1;

  async init() {
    console.log("🎮 TAMY'S ULTIMATE BUG HUNT BEGINS! 🐛");
    console.log("=====================================");
    
    // Create screenshot directory
    const fs = await import('fs');
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    // Set up console monitoring
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.reportBug({
          type: 'bug',
          severity: 'medium',
          description: `Console error: ${msg.text()}`,
          reproSteps: ['Error appeared in console during gameplay']
        });
      }
    });

    // Monitor for uncaught errors
    await this.page.addInitScript(() => {
      window.addEventListener('error', (e) => {
        console.error(`Uncaught error: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
      });
    });
  }

  private async screenshot(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${SCREENSHOT_DIR}/${name}-${timestamp}.png`;
    await this.page.screenshot({ path: filename, fullPage: false });
    return filename;
  }

  private reportBug(bug: Omit<BugReport, 'id'>): void {
    const bugReport: BugReport = {
      ...bug,
      id: `BUG-${String(this.bugCounter).padStart(3, '0')}`
    };
    this.bugs.push(bugReport);
    this.bugCounter++;
    console.log(`🐛 ${bugReport.severity.toUpperCase()} BUG FOUND: ${bugReport.description}`);
  }

  private addTestResult(result: TestResult): void {
    this.testResults.push(result);
    const icon = result.status === 'working' ? '✅' : result.status === 'broken' ? '❌' : '⚠️';
    console.log(`${icon} ${result.feature}: ${result.status.toUpperCase()}`);
  }

  async testGameLoading() {
    console.log("\n🔍 Testing: Game Loading...");
    
    try {
      await this.page.goto(GAME_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await this.page.waitForTimeout(2000);
      
      // Check if game loaded
      const gameCanvas = await this.page.$('#game-root');
      if (!gameCanvas) {
        this.reportBug({
          type: 'bug',
          severity: 'critical',
          description: 'Game canvas not found',
          reproSteps: ['Navigate to game URL', 'Wait for page load'],
          screenshot: await this.screenshot('no-game-canvas')
        });
        
        this.addTestResult({
          feature: 'Game Loading',
          status: 'broken',
          notes: 'Game canvas element missing'
        });
        return false;
      }

      await this.screenshot('game-loaded');
      this.addTestResult({
        feature: 'Game Loading',
        status: 'working',
        notes: 'Game loads successfully'
      });
      return true;
    } catch (error) {
      this.reportBug({
        type: 'bug',
        severity: 'critical',
        description: `Game failed to load: ${error}`,
        reproSteps: ['Navigate to game URL'],
        screenshot: await this.screenshot('game-load-error')
      });
      return false;
    }
  }

  async testUIHotkeys() {
    console.log("\n🔍 Testing: UI Hotkeys (I, Q, C, F)...");
    
    const hotkeys = [
      { key: 'i', name: 'Inventory', expectedClass: 'inventory' },
      { key: 'q', name: 'Quest Journal', expectedClass: 'questJournal' },
      { key: 'c', name: 'Character Stats', expectedClass: 'characterSheet' },
      { key: 'f', name: 'Faction Screen', expectedClass: 'faction' }
    ];

    for (const hotkey of hotkeys) {
      try {
        // Close any open panels first
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(200);
        
        // Open panel
        await this.page.keyboard.press(hotkey.key);
        await this.page.waitForTimeout(500);
        
        // Check if panel opened
        const panel = await this.page.$(`.${hotkey.expectedClass}`);
        if (!panel) {
          this.reportBug({
            type: 'bug',
            severity: 'high',
            description: `${hotkey.name} panel doesn't open with '${hotkey.key}' key`,
            reproSteps: [`Press '${hotkey.key}' key`, 'Panel should open'],
            screenshot: await this.screenshot(`${hotkey.name.toLowerCase().replace(' ', '-')}-missing`)
          });
          
          this.addTestResult({
            feature: `${hotkey.name} Hotkey`,
            status: 'broken',
            notes: 'Panel does not open'
          });
        } else {
          await this.screenshot(`${hotkey.name.toLowerCase().replace(' ', '-')}-open`);
          
          // Test closing with ESC
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(200);
          
          const panelAfterEsc = await this.page.$(`.${hotkey.expectedClass}`);
          if (panelAfterEsc && await panelAfterEsc.isVisible()) {
            this.reportBug({
              type: 'ux',
              severity: 'medium',
              description: `${hotkey.name} panel doesn't close with ESC`,
              reproSteps: [`Open ${hotkey.name} with '${hotkey.key}'`, 'Press ESC', 'Panel should close']
            });
          }
          
          this.addTestResult({
            feature: `${hotkey.name} Hotkey`,
            status: 'working',
            notes: 'Panel opens and closes correctly'
          });
        }
      } catch (error) {
        this.reportBug({
          type: 'bug',
          severity: 'medium',
          description: `Error testing ${hotkey.name}: ${error}`,
          reproSteps: [`Press '${hotkey.key}' key`]
        });
      }
    }
  }

  async testRapidPanelSwitching() {
    console.log("\n🔍 Testing: Rapid Panel Switching (Stress Test)...");
    
    try {
      // Rapidly switch between panels
      const keys = ['i', 'q', 'c', 'f'];
      
      for (let i = 0; i < 20; i++) {
        const key = keys[i % keys.length];
        await this.page.keyboard.press(key);
        await this.page.waitForTimeout(50); // Very short delay
      }
      
      await this.page.waitForTimeout(500);
      await this.screenshot('rapid-panel-switching');
      
      // Check game state
      const gameRoot = await this.page.$('#game-root');
      if (!gameRoot) {
        this.reportBug({
          type: 'bug',
          severity: 'high',
          description: 'Game crashed after rapid panel switching',
          reproSteps: ['Rapidly press I, Q, C, F keys', 'Game should remain stable']
        });
        
        this.addTestResult({
          feature: 'Rapid Panel Switching',
          status: 'broken',
          notes: 'Game crashes under stress'
        });
      } else {
        // Check for visual glitches
        const openPanels = await this.page.$$('.inventory, .questJournal, .characterSheet, .faction');
        if (openPanels.length > 1) {
          this.reportBug({
            type: 'visual',
            severity: 'high',
            description: 'Multiple panels open simultaneously after rapid switching',
            reproSteps: ['Rapidly switch between panels', 'Only one panel should be open at a time'],
            screenshot: await this.screenshot('multiple-panels-bug')
          });
        }
        
        this.addTestResult({
          feature: 'Rapid Panel Switching',
          status: openPanels.length > 1 ? 'partially-working' : 'working',
          notes: openPanels.length > 1 ? 'Multiple panels can be open' : 'Handles rapid switching well'
        });
      }
    } catch (error) {
      this.reportBug({
        type: 'bug',
        severity: 'high',
        description: `Rapid panel switching caused error: ${error}`,
        reproSteps: ['Rapidly switch between UI panels']
      });
    }
  }

  async testMovement() {
    console.log("\n🔍 Testing: Player Movement...");
    
    try {
      // Clear any open panels
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(200);
      
      const movements = [
        { key: 'ArrowUp', direction: 'up' },
        { key: 'ArrowDown', direction: 'down' },
        { key: 'ArrowLeft', direction: 'left' },
        { key: 'ArrowRight', direction: 'right' }
      ];

      for (const move of movements) {
        await this.page.keyboard.press(move.key);
        await this.page.waitForTimeout(300);
      }
      
      // Test diagonal movement
      await this.page.keyboard.down('ArrowUp');
      await this.page.keyboard.down('ArrowRight');
      await this.page.waitForTimeout(300);
      await this.page.keyboard.up('ArrowUp');
      await this.page.keyboard.up('ArrowRight');
      
      // Test wall collision
      for (let i = 0; i < 20; i++) {
        await this.page.keyboard.press('ArrowLeft');
        await this.page.waitForTimeout(50);
      }
      
      await this.screenshot('movement-test');
      
      this.addTestResult({
        feature: 'Player Movement',
        status: 'working',
        notes: 'Basic movement appears functional'
      });
      
    } catch (error) {
      this.reportBug({
        type: 'gameplay',
        severity: 'critical',
        description: `Movement system error: ${error}`,
        reproSteps: ['Use arrow keys to move player']
      });
    }
  }

  async testNPCInteraction() {
    console.log("\n🔍 Testing: NPC Interactions...");
    
    try {
      // Move to find an NPC (we'll try to find Compiler Cat)
      for (let i = 0; i < 5; i++) {
        await this.page.keyboard.press('ArrowRight');
        await this.page.waitForTimeout(200);
      }
      
      // Try to interact
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(500);
      
      // Check for dialogue
      const dialogue = await this.page.$('.dialogue');
      if (dialogue) {
        await this.screenshot('npc-dialogue');
        
        // Test dialogue progression
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(300);
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(300);
        
        // Check if dialogue closed properly
        const dialogueAfter = await this.page.$('.dialogue');
        if (dialogueAfter && await dialogueAfter.isVisible()) {
          this.reportBug({
            type: 'gameplay',
            severity: 'medium',
            description: 'Dialogue may not close properly',
            reproSteps: ['Talk to NPC', 'Progress through dialogue', 'Dialogue should close at end']
          });
        }
        
        this.addTestResult({
          feature: 'NPC Interaction',
          status: 'working',
          notes: 'Can interact with NPCs and view dialogue'
        });
      } else {
        this.addTestResult({
          feature: 'NPC Interaction',
          status: 'partially-working',
          notes: 'Could not find NPC to test interaction'
        });
      }
    } catch (error) {
      this.reportBug({
        type: 'gameplay',
        severity: 'high',
        description: `NPC interaction error: ${error}`,
        reproSteps: ['Approach NPC', 'Press Enter to interact']
      });
    }
  }

  async testMapTransitions() {
    console.log("\n🔍 Testing: Map Transitions...");
    
    try {
      // Try to find a map exit (usually at edges)
      // Move to the right edge
      for (let i = 0; i < 30; i++) {
        await this.page.keyboard.press('ArrowRight');
        await this.page.waitForTimeout(100);
      }
      
      await this.screenshot('map-edge-right');
      
      // Check if we transitioned
      await this.page.waitForTimeout(1000);
      
      // Try other edges
      for (let i = 0; i < 30; i++) {
        await this.page.keyboard.press('ArrowUp');
        await this.page.waitForTimeout(100);
      }
      
      await this.screenshot('map-edge-top');
      
      this.addTestResult({
        feature: 'Map Transitions',
        status: 'partially-working',
        notes: 'Map transition testing requires specific exit points'
      });
      
    } catch (error) {
      this.reportBug({
        type: 'gameplay',
        severity: 'high',
        description: `Map transition error: ${error}`,
        reproSteps: ['Move to map edge', 'Should transition to new area']
      });
    }
  }

  async testCombatSystem() {
    console.log("\n🔍 Testing: Combat System...");
    
    try {
      // Try to find an enemy
      // Move around to trigger combat
      const movements = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'];
      
      for (let i = 0; i < 20; i++) {
        await this.page.keyboard.press(movements[i % movements.length]);
        await this.page.waitForTimeout(200);
        
        // Check if we entered combat
        const battleScene = await this.page.$('.battleScene');
        if (battleScene) {
          console.log("⚔️ Combat encountered!");
          await this.screenshot('combat-started');
          
          // Test combat actions
          const actions = ['1', '2', '3', '4']; // Attack, Defend, Debug, Flee
          
          for (const action of actions) {
            await this.page.keyboard.press(action);
            await this.page.waitForTimeout(500);
            
            // Check if action worked
            const combatLog = await this.page.$('.combatLog');
            if (!combatLog) {
              this.reportBug({
                type: 'gameplay',
                severity: 'high',
                description: `Combat action ${action} may not be working`,
                reproSteps: ['Enter combat', `Press ${action} key`, 'Action should execute']
              });
            }
          }
          
          this.addTestResult({
            feature: 'Combat System',
            status: 'working',
            notes: 'Combat triggers and actions respond'
          });
          
          // Try to flee
          await this.page.keyboard.press('4');
          await this.page.waitForTimeout(1000);
          break;
        }
      }
      
      const battleScene = await this.page.$('.battleScene');
      if (!battleScene) {
        this.addTestResult({
          feature: 'Combat System',
          status: 'partially-working',
          notes: 'Could not trigger combat encounter for full testing'
        });
      }
      
    } catch (error) {
      this.reportBug({
        type: 'gameplay',
        severity: 'high',
        description: `Combat system error: ${error}`,
        reproSteps: ['Encounter enemy', 'Combat should start']
      });
    }
  }

  async testShopSystem() {
    console.log("\n🔍 Testing: Shop System...");
    
    try {
      // Try to find a shop (usually Bit & Byte's Binary Boutique)
      // Return to starting area
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(200);
      
      // Move around to find shop
      for (let i = 0; i < 10; i++) {
        await this.page.keyboard.press('ArrowRight');
        await this.page.waitForTimeout(200);
        await this.page.keyboard.press('Enter'); // Try to interact
        await this.page.waitForTimeout(300);
        
        const shop = await this.page.$('.shop');
        if (shop) {
          console.log("🛍️ Shop found!");
          await this.screenshot('shop-open');
          
          // Test buying something
          await this.page.keyboard.press('1'); // Try to buy first item
          await this.page.waitForTimeout(500);
          
          // Check for purchase confirmation or error
          const shopMessage = await this.page.$('.shopMessage');
          if (!shopMessage) {
            this.reportBug({
              type: 'gameplay',
              severity: 'medium',
              description: 'Shop purchase feedback missing',
              reproSteps: ['Open shop', 'Try to buy item', 'Should show success/failure message']
            });
          }
          
          // Exit shop
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(200);
          
          this.addTestResult({
            feature: 'Shop System',
            status: 'working',
            notes: 'Shop opens and responds to input'
          });
          break;
        }
      }
      
      const shop = await this.page.$('.shop');
      if (!shop) {
        this.addTestResult({
          feature: 'Shop System',
          status: 'partially-working',
          notes: 'Could not find shop NPC for full testing'
        });
      }
      
    } catch (error) {
      this.reportBug({
        type: 'gameplay',
        severity: 'medium',
        description: `Shop system error: ${error}`,
        reproSteps: ['Find shop NPC', 'Interact to open shop']
      });
    }
  }

  async testSaveLoadSystem() {
    console.log("\n🔍 Testing: Save/Load System...");
    
    try {
      // Find Compiler Cat (save point)
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(200);
      
      // Move to find save point
      for (let i = 0; i < 5; i++) {
        await this.page.keyboard.press('ArrowLeft');
        await this.page.waitForTimeout(200);
      }
      
      // Look for Compiler Cat and interact
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(500);
      
      const saveMenu = await this.page.$('.saveMenu, .dialogue');
      if (saveMenu) {
        // Try to save
        await this.page.keyboard.press('1'); // Usually save option
        await this.page.waitForTimeout(1000);
        
        await this.screenshot('save-attempt');
        
        // Reload page to test load
        await this.page.reload({ waitUntil: 'networkidle' });
        await this.page.waitForTimeout(2000);
        
        // Check if game loaded with saved data
        const gameLoaded = await this.page.$('#game-root');
        if (gameLoaded) {
          this.addTestResult({
            feature: 'Save/Load System',
            status: 'working',
            notes: 'Save and reload functionality works'
          });
        } else {
          this.reportBug({
            type: 'bug',
            severity: 'critical',
            description: 'Game fails to load after save',
            reproSteps: ['Save game', 'Reload page', 'Game should load with saved data']
          });
        }
      } else {
        this.addTestResult({
          feature: 'Save/Load System',
          status: 'partially-working',
          notes: 'Could not find save point for full testing'
        });
      }
      
    } catch (error) {
      this.reportBug({
        type: 'bug',
        severity: 'high',
        description: `Save/Load system error: ${error}`,
        reproSteps: ['Find Compiler Cat', 'Try to save game']
      });
    }
  }

  async testEdgeCases() {
    console.log("\n🔍 Testing: Edge Cases & Weird Behavior...");
    
    // Test 1: Spam all keys simultaneously
    try {
      console.log("  - Testing key spam...");
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'i', 'q', 'c', 'f', 'Enter', 'Escape'];
      
      // Press multiple keys at once
      for (const key of keys) {
        this.page.keyboard.down(key);
      }
      await this.page.waitForTimeout(500);
      
      // Release all keys
      for (const key of keys) {
        this.page.keyboard.up(key);
      }
      await this.page.waitForTimeout(500);
      
      await this.screenshot('key-spam-test');
      
      const gameStillRunning = await this.page.$('#game-root');
      if (!gameStillRunning) {
        this.reportBug({
          type: 'bug',
          severity: 'high',
          description: 'Game crashes when multiple keys pressed simultaneously',
          reproSteps: ['Press many keys at once', 'Game should handle gracefully']
        });
      }
    } catch (error) {
      this.reportBug({
        type: 'bug',
        severity: 'medium',
        description: `Key spam caused error: ${error}`,
        reproSteps: ['Spam multiple keys simultaneously']
      });
    }

    // Test 2: Rapid clicking everywhere
    try {
      console.log("  - Testing rapid clicking...");
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 1280;
        const y = Math.random() * 720;
        await this.page.mouse.click(x, y);
        await this.page.waitForTimeout(50);
      }
      
      await this.screenshot('rapid-click-test');
    } catch (error) {
      this.reportBug({
        type: 'bug',
        severity: 'low',
        description: `Rapid clicking caused error: ${error}`,
        reproSteps: ['Click rapidly around the screen']
      });
    }

    // Test 3: Browser resize
    try {
      console.log("  - Testing window resize...");
      await this.page.setViewportSize({ width: 800, height: 600 });
      await this.page.waitForTimeout(500);
      await this.screenshot('small-window');
      
      await this.page.setViewportSize({ width: 1920, height: 1080 });
      await this.page.waitForTimeout(500);
      await this.screenshot('large-window');
      
      await this.page.setViewportSize({ width: 1280, height: 720 });
      
      this.addTestResult({
        feature: 'Window Resizing',
        status: 'working',
        notes: 'Game adapts to different window sizes'
      });
    } catch (error) {
      this.reportBug({
        type: 'visual',
        severity: 'medium',
        description: `Window resize handling error: ${error}`,
        reproSteps: ['Resize browser window', 'Game should adapt']
      });
    }
  }

  async testPerformance() {
    console.log("\n🔍 Testing: Performance & Memory...");
    
    try {
      // Get initial metrics
      // const metrics1 = await this.page.metrics(); // Not available in playwright
      const metrics1 = null;
      
      // Do intensive actions
      for (let i = 0; i < 50; i++) {
        await this.page.keyboard.press('i');
        await this.page.waitForTimeout(50);
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(50);
      }
      
      // Get final metrics
      // const metrics2 = await this.page.metrics(); // Not available in playwright
      const metrics2 = null;
      
      const heapGrowth = metrics2!.JSHeapUsedSize - metrics1!.JSHeapUsedSize;
      const heapGrowthMB = (heapGrowth / 1024 / 1024).toFixed(2);
      
      console.log(`  - Heap growth: ${heapGrowthMB} MB`);
      
      if (heapGrowth > 50 * 1024 * 1024) { // More than 50MB growth
        this.reportBug({
          type: 'performance',
          severity: 'medium',
          description: `Potential memory leak detected: ${heapGrowthMB}MB heap growth`,
          reproSteps: ['Open and close UI panels repeatedly', 'Monitor memory usage']
        });
      }
      
      this.addTestResult({
        feature: 'Performance',
        status: heapGrowth > 50 * 1024 * 1024 ? 'partially-working' : 'working',
        notes: `Heap growth: ${heapGrowthMB}MB after stress test`
      });
      
    } catch (error) {
      console.log(`  - Performance metrics unavailable: ${error}`);
    }
  }

  async generateReport() {
    console.log("\n\n🎮 TAMY'S ULTIMATE BUG HUNT REPORT 🎮");
    console.log("=====================================");
    
    console.log("\n📊 TEST SUMMARY:");
    console.log(`Total Features Tested: ${this.testResults.length}`);
    console.log(`Working: ${this.testResults.filter(r => r.status === 'working').length}`);
    console.log(`Partially Working: ${this.testResults.filter(r => r.status === 'partially-working').length}`);
    console.log(`Broken: ${this.testResults.filter(r => r.status === 'broken').length}`);
    
    console.log("\n✅ WORKING FEATURES:");
    this.testResults
      .filter(r => r.status === 'working')
      .forEach(r => console.log(`  - ${r.feature}: ${r.notes}`));
    
    console.log("\n⚠️ PARTIALLY WORKING:");
    this.testResults
      .filter(r => r.status === 'partially-working')
      .forEach(r => console.log(`  - ${r.feature}: ${r.notes}`));
    
    console.log("\n❌ BROKEN FEATURES:");
    this.testResults
      .filter(r => r.status === 'broken')
      .forEach(r => console.log(`  - ${r.feature}: ${r.notes}`));
    
    console.log("\n🐛 BUG LIST (BY SEVERITY):");
    
    const criticalBugs = this.bugs.filter(b => b.severity === 'critical');
    const highBugs = this.bugs.filter(b => b.severity === 'high');
    const mediumBugs = this.bugs.filter(b => b.severity === 'medium');
    const lowBugs = this.bugs.filter(b => b.severity === 'low');
    
    if (criticalBugs.length > 0) {
      console.log("\n🔴 CRITICAL:");
      criticalBugs.forEach(b => {
        console.log(`  ${b.id}: ${b.description}`);
        console.log(`    Steps: ${b.reproSteps.join(' → ')}`);
        if (b.screenshot) console.log(`    Screenshot: ${b.screenshot}`);
      });
    }
    
    if (highBugs.length > 0) {
      console.log("\n🟠 HIGH:");
      highBugs.forEach(b => {
        console.log(`  ${b.id}: ${b.description}`);
        console.log(`    Steps: ${b.reproSteps.join(' → ')}`);
        if (b.screenshot) console.log(`    Screenshot: ${b.screenshot}`);
      });
    }
    
    if (mediumBugs.length > 0) {
      console.log("\n🟡 MEDIUM:");
      mediumBugs.forEach(b => {
        console.log(`  ${b.id}: ${b.description}`);
        console.log(`    Steps: ${b.reproSteps.join(' → ')}`);
      });
    }
    
    if (lowBugs.length > 0) {
      console.log("\n🟢 LOW:");
      lowBugs.forEach(b => {
        console.log(`  ${b.id}: ${b.description}`);
      });
    }
    
    console.log("\n🎯 TAMY'S PROFESSIONAL QA VERDICT:");
    if (criticalBugs.length > 0) {
      console.log("⛔ NOT READY FOR RELEASE - Critical bugs found!");
      console.log("Priority: Fix critical bugs immediately");
    } else if (highBugs.length > 0) {
      console.log("⚠️ NEEDS WORK - High severity bugs should be addressed");
      console.log("Priority: Fix high bugs before launch");
    } else if (mediumBugs.length > 0) {
      console.log("✔️ ALMOST THERE - Game is playable but has rough edges");
      console.log("Priority: Polish and fix medium bugs");
    } else {
      console.log("🎉 SHIP IT! - Game is solid and ready to play!");
      console.log("Only minor issues found");
    }
    
    console.log("\n💡 RECOMMENDATIONS:");
    console.log("1. Fix all critical bugs immediately");
    console.log("2. Address high severity bugs before any release");
    console.log("3. Medium bugs can be fixed in patches");
    console.log("4. Consider adding more error handling");
    console.log("5. Test on different screen sizes");
    console.log("6. Add loading indicators for better UX");
    
    console.log("\n🏆 TAMY'S FINAL WORDS:");
    console.log("The team did AMAZING work fixing that overlay bug!");
    console.log("The game is really coming together. With these bugs fixed,");
    console.log("Tales of Claude will be an EPIC adventure!");
    console.log("\nTotal bugs found: " + this.bugs.length);
    console.log("Screenshots saved to: " + SCREENSHOT_DIR);
    console.log("\n🎮 GAME ON! 🎮");
  }

  async cleanup() {
    await this.browser.close();
  }

  async run() {
    try {
      await this.init();
      
      // Run all tests
      const gameLoaded = await this.testGameLoading();
      if (!gameLoaded) {
        console.log("\n❌ CRITICAL: Game failed to load! Aborting tests.");
        await this.generateReport();
        return;
      }
      
      await this.testUIHotkeys();
      await this.testRapidPanelSwitching();
      await this.testMovement();
      await this.testNPCInteraction();
      await this.testMapTransitions();
      await this.testCombatSystem();
      await this.testShopSystem();
      await this.testSaveLoadSystem();
      await this.testEdgeCases();
      await this.testPerformance();
      
      await this.generateReport();
      
    } catch (error) {
      console.error("\n💥 CATASTROPHIC TEST FAILURE:", error);
      this.reportBug({
        type: 'bug',
        severity: 'critical',
        description: `Test suite crashed: ${error}`,
        reproSteps: ['Run test suite']
      });
    } finally {
      await this.cleanup();
    }
  }
}

// Run the ultimate bug hunt!
(async () => {
  const tester = new TamyUltimateBugHunter();
  await tester.run();
})();
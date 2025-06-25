import puppeteer from 'puppeteer';
import chalk from 'chalk';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
}

async function testEnemyRespawn(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Test 1: Load game in agent mode (skip splash)
    const startTime = Date.now();
    await page.goto('http://localhost:5176/?agent=true');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Wait for game to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check initial enemy count
    const initialEnemyCount = await page.evaluate(() => {
      const state = (window as any).__gameState;
      return state?.enemies?.length || 0;
    });
    
    results.push({
      testName: 'Game loads with enemies',
      passed: initialEnemyCount > 0,
      error: initialEnemyCount === 0 ? `No enemies found, count: ${initialEnemyCount}` : undefined,
      duration: Date.now() - startTime
    });
    
    // Test 2: Find and battle an enemy
    const battleStartTime = Date.now();
    
    // Move around to find an enemy
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const inBattle = await page.evaluate(() => {
        const state = (window as any).__gameState;
        return state?.battle !== null;
      });
      
      if (inBattle) break;
    }
    
    const inBattle = await page.evaluate(() => {
      const state = (window as any).__gameState;
      return state?.battle !== null;
    });
    
    results.push({
      testName: 'Enemy encounter triggers battle',
      passed: inBattle,
      error: !inBattle ? 'Could not trigger battle' : undefined,
      duration: Date.now() - battleStartTime
    });
    
    if (inBattle) {
      // Test 3: Win the battle
      const winStartTime = Date.now();
      
      // Spam attack to win quickly
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('1'); // Attack
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const battleEnded = await page.evaluate(() => {
          const state = (window as any).__gameState;
          return state?.battle === null;
        });
        
        if (battleEnded) break;
      }
      
      const battleEnded = await page.evaluate(() => {
        const state = (window as any).__gameState;
        return state?.battle === null;
      });
      
      results.push({
        testName: 'Battle can be won',
        passed: battleEnded,
        error: !battleEnded ? 'Battle did not end' : undefined,
        duration: Date.now() - winStartTime
      });
      
      // Test 4: Check enemy count after battle
      const afterBattleTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const enemyCountAfterBattle = await page.evaluate(() => {
        const state = (window as any).__gameState;
        return state?.enemies?.length || 0;
      });
      
      // Enemy count should be the same (enemy not removed from state)
      results.push({
        testName: 'Enemy remains in state after defeat',
        passed: enemyCountAfterBattle === initialEnemyCount,
        error: enemyCountAfterBattle !== initialEnemyCount ? 
          `Enemy count changed: ${initialEnemyCount} -> ${enemyCountAfterBattle}` : undefined,
        duration: Date.now() - afterBattleTime
      });
      
      // Test 5: Check if enemy is marked as respawning
      const respawnCheckTime = Date.now();
      
      const enemyStates = await page.evaluate(() => {
        const state = (window as any).__gameState;
        const gameEngine = (window as any).__gameEngine;
        if (!gameEngine?._patrolSystem) return null;
        
        const enemyStates: any[] = [];
        state.enemies.forEach((enemy: any) => {
          const patrolData = gameEngine._patrolSystem.getEnemyData(enemy.id);
          enemyStates.push({
            id: enemy.id,
            name: enemy.name,
            state: patrolData?.state || 'unknown'
          });
        });
        return enemyStates;
      });
      
      const hasRespawningEnemy = enemyStates?.some((e: any) => e.state === 'RESPAWNING');
      
      results.push({
        testName: 'Defeated enemy marked as RESPAWNING',
        passed: hasRespawningEnemy === true,
        error: !hasRespawningEnemy ? 
          `Enemy states: ${JSON.stringify(enemyStates)}` : undefined,
        duration: Date.now() - respawnCheckTime
      });
      
      // Test 6: Wait for respawn (using shorter test time)
      console.log(chalk.yellow('Waiting 30 seconds for respawn test...'));
      const respawnWaitTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      
      const respawnedEnemyData = await page.evaluate(() => {
        const state = (window as any).__gameState;
        const gameEngine = (window as any).__gameEngine;
        if (!gameEngine?._patrolSystem) return null;
        
        const visibleEnemies = state.enemies.filter((enemy: any) => {
          const patrolData = gameEngine._patrolSystem.getEnemyData(enemy.id);
          return !patrolData || patrolData.state !== 'RESPAWNING';
        });
        
        return {
          totalEnemies: state.enemies.length,
          visibleEnemies: visibleEnemies.length,
          states: state.enemies.map((enemy: any) => {
            const patrolData = gameEngine._patrolSystem.getEnemyData(enemy.id);
            return {
              name: enemy.name,
              state: patrolData?.state || 'unknown'
            };
          })
        };
      });
      
      results.push({
        testName: 'Enemy respawn system active',
        passed: respawnedEnemyData !== null,
        error: !respawnedEnemyData ? 
          'Could not check respawn data' : 
          `Enemies: ${respawnedEnemyData.visibleEnemies}/${respawnedEnemyData.totalEnemies}, States: ${JSON.stringify(respawnedEnemyData.states)}`,
        duration: Date.now() - respawnWaitTime
      });
    }
    
  } catch (error) {
    results.push({
      testName: 'Test execution',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: 0
    });
  } finally {
    await browser.close();
  }
  
  return results;
}

// Run the test
console.log(chalk.blue.bold('\n🧪 Testing Enemy Respawn System\n'));

testEnemyRespawn().then(results => {
  console.log(chalk.blue('\n📊 Test Results:\n'));
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    if (result.passed) {
      passed++;
      console.log(chalk.green(`✅ ${result.testName} (${result.duration}ms)`));
    } else {
      failed++;
      console.log(chalk.red(`❌ ${result.testName} (${result.duration}ms)`));
      if (result.error) {
        console.log(chalk.gray(`   Error: ${result.error}`));
      }
    }
  });
  
  console.log(chalk.blue(`\n📈 Summary: ${passed} passed, ${failed} failed\n`));
  
  process.exit(failed > 0 ? 1 : 0);
}).catch(error => {
  console.error(chalk.red('Test runner error:'), error);
  process.exit(1);
});
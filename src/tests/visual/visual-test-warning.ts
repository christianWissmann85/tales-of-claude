/**
 * Standard Visual Test Warning System
 * 
 * All visual tests MUST use this warning system before opening browser windows
 * This gives Chris and other users time to prepare for the window appearing
 */

export interface VisualTestConfig {
  agentName: string;
  agentRole: string;
  testDescription: string;
  resolution?: { width: number; height: number };
  estimatedDuration?: string;
}

/**
 * Display standard warning before visual test
 * @param config Test configuration
 * @param countdownSeconds Seconds to count down (default: 3)
 */
export async function showVisualTestWarning(
  config: VisualTestConfig,
  countdownSeconds: number = 3
): Promise<void> {
  const {
    agentName,
    agentRole,
    testDescription,
    resolution = { width: 1280, height: 720 },
    estimatedDuration = '~30 seconds'
  } = config;

  console.log('\n' + '='.repeat(60));
  console.log('🎮 VISUAL TEST STARTING IN 3... 2... 1...');
  console.log(`Agent: ${agentName} (${agentRole})`);
  console.log(`Testing: ${testDescription}`);
  console.log(`Resolution: ${resolution.width}x${resolution.height}`);
  console.log(`Duration: ${estimatedDuration}`);
  console.log('='.repeat(60) + '\n');

  // Countdown
  for (let i = countdownSeconds; i > 0; i--) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (i > 1) {
      console.log(`Starting in ${i}...`);
    }
  }
  
  console.log('🚀 Launching browser window now!');
}

/**
 * Quick warning for simple tests
 */
export async function quickVisualWarning(testName: string): Promise<void> {
  await showVisualTestWarning({
    agentName: process.env.AGENT_NAME || 'Unknown Agent',
    agentRole: process.env.AGENT_ROLE || 'Test Runner',
    testDescription: testName,
  });
}

// Example usage:
/*
import { showVisualTestWarning } from './visual-test-warning';

async function runMyTest() {
  await showVisualTestWarning({
    agentName: 'Martin',
    agentRole: 'Test Runner Specialist',
    testDescription: 'Inventory system verification',
    resolution: { width: 1920, height: 1080 },
    estimatedDuration: '~45 seconds'
  });
  
  // Now safe to open browser
  const browser = await chromium.launch({ headless: false });
  // ... rest of test
}
*/
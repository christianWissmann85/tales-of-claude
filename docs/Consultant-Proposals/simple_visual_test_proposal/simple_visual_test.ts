// simple-screenshot.ts - Ultra-lightweight screenshot tool for agents
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ScreenshotOptions {
  url?: string;
  outputDir?: string;
  name?: string;
  wait?: number;
}

class SimpleScreenshotTool {
  private defaultOptions: Required<ScreenshotOptions> = {
    url: 'http://localhost:5173',
    outputDir: './visual-tests',
    name: 'game-screenshot',
    wait: 3000,
  };

  async takeScreenshot(options: ScreenshotOptions = {}): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Ensure output directory exists
    if (!existsSync(opts.outputDir)) {
      mkdirSync(opts.outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${opts.name}-${timestamp}.png`;
    const filepath = join(opts.outputDir, filename);

    console.log(`Taking screenshot of ${opts.url}...`);

    try {
      // Use puppeteer-core for minimal overhead (no Chromium download)
      const { default: puppeteer } = await import('puppeteer-core');
      
      // Try common Chrome paths
      const chromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
        '/usr/bin/google-chrome-stable', // Linux
        '/usr/bin/google-chrome', // Linux alt
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', // Windows 32-bit
      ];

      const executablePath = chromePaths.find(path => {
        try {
          return existsSync(path);
        } catch {
          return false;
        }
      });

      if (!executablePath) {
        throw new Error('Chrome not found. Please install Google Chrome.');
      }

      const browser = await puppeteer.launch({
        executablePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      
      // Navigate and wait
      await page.goto(opts.url, { waitUntil: 'networkidle0', timeout: 10000 });
      await page.waitForTimeout(opts.wait);

      // Take screenshot
      await page.screenshot({ 
        path: filepath, 
        fullPage: true,
        type: 'png',
      });

      await browser.close();

      console.log(`Screenshot saved: ${filepath}`);
      return filepath;

    } catch (puppeteerError) {
      console.warn('Puppeteer failed, trying system screenshot tools...');
      
      // Fallback to system tools
      try {
        await this.systemScreenshot(opts.url, filepath);
        return filepath;
      } catch (systemError) {
        throw new Error(`Both Puppeteer and system screenshot failed. Puppeteer: ${puppeteerError}. System: ${systemError}`);
      }
    }
  }

  private async systemScreenshot(url: string, filepath: string): Promise<void> {
    const platform = process.platform;

    if (platform === 'darwin') {
      // macOS - use built-in screencapture with Safari
      execSync(`osascript -e 'tell application "Safari" to make new document with properties {URL:"${url}"}' && sleep 3`);
      execSync(`screencapture -x "${filepath}"`);
      execSync('osascript -e \'tell application "Safari" to close front document\'');
    } else if (platform === 'linux') {
      // Linux - use xvfb + chromium if available
      try {
        execSync(`xvfb-run -a chromium-browser --headless --disable-gpu --window-size=1280,720 --screenshot="${filepath}" "${url}"`, { stdio: 'pipe' });
      } catch {
        throw new Error('Linux screenshot requires xvfb and chromium-browser');
      }
    } else {
      throw new Error('System screenshot not supported on this platform');
    }
  }

  // Quick method for agents to call
  static async quick(gameState?: string): Promise<string> {
    const tool = new SimpleScreenshotTool();
    const name = gameState ? `game-${gameState}` : 'game-current';
    return await tool.takeScreenshot({ name });
  }

  // Generate a simple analysis prompt for the agent
  static analysisPrompt(screenshotPath: string, context?: string): string {
    return `Please analyze this game screenshot: ${screenshotPath}

${context ? `Context: ${context}` : ''}

Look for:
- Visual bugs or glitches
- UI alignment issues  
- Missing elements
- Performance indicators (if visible)
- Overall visual quality
- Anything that looks wrong or unexpected

Provide specific feedback about what you observe.`;
  }
}

// CLI interface for agents
if (require.main === module) {
  const args = process.argv.slice(2);
  const gameState = args[0] || 'current';
  
  SimpleScreenshotTool.quick(gameState)
    .then(filepath => {
      console.log(`SUCCESS: ${filepath}`);
      console.log(SimpleScreenshotTool.analysisPrompt(filepath));
    })
    .catch(error => {
      console.error(`FAILED: ${error.message}`);
      process.exit(1);
    });
}

export { SimpleScreenshotTool };
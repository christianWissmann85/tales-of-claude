Here's the Puppeteer script `src/tests/visual/screenshot-new-ui.ts` that fulfills all your requirements.

This script will:
1.  Launch a headless browser.
2.  Navigate to `http://localhost:5173`.
3.  Click a button containing the text "Start".
4.  Press the `Space` key multiple times to skip through the opening scene.
5.  Wait for an element with the ID `#game-board` to appear, signifying the game board has loaded.
6.  Take a full-page screenshot of the game board UI.
7.  Press the `i` key to open the inventory.
8.  Wait for an element with the ID `#inventory-panel` to appear.
9.  Take another full-page screenshot with the inventory open.
10. Save both screenshots to `src/tests/visual/temp/`.
11. Include robust error handling and informative console logs.

**Before you run:**
*   Make sure you have Puppeteer installed: `npm install puppeteer` or `yarn add puppeteer`.
*   Ensure your local development server is running at `http://localhost:5173`.
*   The script assumes the "Start" button has the text "Start", the game board has an ID `game-board`, and the inventory panel has an ID `inventory-panel`. Adjust these selectors (`button`, `#game-board`, `#inventory-panel`) if your UI uses different IDs or classes.

---

**File: `src/tests/visual/screenshot-new-ui.ts`**

```typescript
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

// Define the output directory relative to the project root
// This ensures screenshots are saved correctly regardless of where the script is executed from.
const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, 'src', 'tests', 'visual', 'temp');

// Define paths for the screenshots
const screenshot1Path = path.join(outputDir, 'game-board-new-ui.png');
const screenshot2Path = path.join(outputDir, 'inventory-open-new-ui.png');

async function runScreenshotScript() {
    let browser: puppeteer.Browser | undefined;
    try {
        // --- 0. Ensure output directory exists ---
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`[Puppeteer] Created output directory: ${outputDir}`);
        } else {
            console.log(`[Puppeteer] Output directory already exists: ${outputDir}`);
        }

        console.log('[Puppeteer] Launching browser...');
        // Launch browser in headless mode (true for no visible UI, false for debugging)
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        // Set a consistent viewport size for reproducible screenshots
        await page.setViewport({ width: 1280, height: 800 });

        // --- 1. Navigate to http://localhost:5173 ---
        console.log('[Puppeteer] Navigating to http://localhost:5173...');
        // 'networkidle0' waits until there are no more than 0 network connections for at least 500 ms.
        // This helps ensure the page is fully loaded, including dynamic content and assets.
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 }); // 30 sec timeout
        console.log('[Puppeteer] Navigation complete.');

        // --- 2. Click the Start button on splash screen ---
        console.log('[Puppeteer] Waiting for Start button on splash screen...');
        // Wait for any button element to appear, then evaluate to find and click the one with "Start" text.
        // This is more robust than relying on a specific class/ID if it might change.
        await page.waitForSelector('button', { timeout: 10000 }); // Wait up to 10 seconds for a button
        await page.evaluate(() => {
            const startButton = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.includes('Start'));
            if (startButton) {
                startButton.click();
            } else {
                // If the button isn't found, throw an error to be caught by the try/catch block
                throw new Error('Start button with "Start" text not found on splash screen!');
            }
        });
        console.log('[Puppeteer] Clicked Start button.');

        // --- 3. Skip through the opening scene by pressing Space ---
        console.log('[Puppeteer] Skipping through opening scene (pressing Space multiple times)...');
        // Press Space multiple times with a small delay to ensure scene progression.
        // Adjust the loop count (e.g., 5) based on how many presses are needed to skip your scene.
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Space');
            await page.waitForTimeout(200); // Small delay between presses
        }
        console.log('[Puppeteer] Finished pressing Space keys to skip scene.');

        // --- 4. Wait for the game board to load ---
        console.log('[Puppeteer] Waiting for the game board to load (#game-board)...');
        // Wait for a specific element that signifies the game board is fully loaded.
        // Replace '#game-board' with the actual selector for your game board container.
        await page.waitForSelector('#game-board', { timeout: 15000 }); // Wait up to 15 seconds
        console.log('[Puppeteer] Game board loaded successfully.');

        // --- 5. Take a screenshot showing the new UI layout ---
        console.log(`[Puppeteer] Taking screenshot of new UI layout: ${screenshot1Path}`);
        // Take a full page screenshot to capture the entire UI layout.
        await page.screenshot({ path: screenshot1Path, fullPage: true });
        console.log('[Puppeteer] Screenshot 1 taken successfully.');

        // --- 6. Press 'i' to test the inventory key ---
        console.log("[Puppeteer] Pressing 'i' to open inventory...");
        await page.keyboard.press('i');
        console.log("[Puppeteer] Pressed 'i'.");

        // --- 7. Take another screenshot with inventory open ---
        console.log('[Puppeteer] Waiting for inventory to open (#inventory-panel)...');
        // Wait for the inventory panel element to appear.
        // Replace '#inventory-panel' with the actual selector for your inventory UI.
        await page.waitForSelector('#inventory-panel', { timeout: 10000 }); // Wait up to 10 seconds
        console.log('[Puppeteer] Inventory opened successfully.');

        console.log(`[Puppeteer] Taking another screenshot with inventory open: ${screenshot2Path}`);
        await page.screenshot({ path: screenshot2Path, fullPage: true });
        console.log('[Puppeteer] Screenshot 2 taken successfully.');

        console.log('[Puppeteer] Script completed successfully.');

    } catch (error) {
        console.error('[Puppeteer] An error occurred during the screenshot process:');
        if (error instanceof Error) {
            console.error(`[Puppeteer] Error: ${error.message}`);
            if (error.stack) {
                console.error(`[Puppeteer] Stack: ${error.stack}`);
            }
        } else {
            console.error(`[Puppeteer] Unknown error: ${error}`);
        }

        // --- Error Handling: Take a screenshot on error for debugging ---
        if (browser) {
            try {
                const page = (await browser.pages())[0]; // Get the first page
                if (page) {
                    const errorScreenshotPath = path.join(outputDir, 'error-screenshot.png');
                    console.log(`[Puppeteer] Taking error screenshot: ${errorScreenshotPath}`);
                    await page.screenshot({ path: errorScreenshotPath, fullPage: true });
                    console.log('[Puppeteer] Error screenshot taken.');
                }
            } catch (screenshotError) {
                console.error(`[Puppeteer] Failed to take error screenshot: ${screenshotError}`);
            }
        }
    } finally {
        // --- Cleanup: Close the browser ---
        if (browser) {
            console.log('[Puppeteer] Closing browser.');
            await browser.close();
        }
    }
}

// Execute the script
runScreenshotScript();
```

---

**To run this script:**

1.  **Save the code:** Save the content above as `src/tests/visual/screenshot-new-ui.ts` in your project.
2.  **Install dependencies:** If you haven't already, install Puppeteer:
    ```bash
    npm install puppeteer
    # or
    yarn add puppeteer
    ```
3.  **Compile (if using TypeScript directly):**
    If you're running this as a TypeScript file directly (e.g., using `ts-node`), you might need to install it:
    ```bash
    npm install -g ts-node
    ```
    Then run:
    ```bash
    ts-node src/tests/visual/screenshot-new-ui.ts
    ```
4.  **Compile and Run (standard Node.js project):**
    If you have a `tsconfig.json` and a build process (e.g., `tsc`), compile your project first:
    ```bash
    tsc
    ```
    Then run the compiled JavaScript file from your project root:
    ```bash
    node dist/src/tests/visual/screenshot-new-ui.js
    # (Adjust 'dist' path based on your tsconfig.json 'outDir')
    ```
    A common way to run this is to add a script to your `package.json`:
    ```json
    {
      "name": "your-project",
      "version": "1.0.0",
      "scripts": {
        "screenshot:ui": "ts-node src/tests/visual/screenshot-new-ui.ts"
      },
      "devDependencies": {
        "puppeteer": "^X.Y.Z",
        "ts-node": "^X.Y.Z",
        "typescript": "^X.Y.Z"
      }
    }
    ```
    Then you can simply run:
    ```bash
    npm run screenshot:ui
    ```

After execution, you will find `game-board-new-ui.png` and `inventory-open-new-ui.png` in the `src/tests/visual/temp/` directory. If an error occurs, `error-screenshot.png` might also be present for debugging.
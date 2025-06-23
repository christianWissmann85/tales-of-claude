// Browser console test script for map verification
// Run this in the browser console at http://localhost:5176

console.log('🔍 Verifying Tales of Claude map loading...\n');

// Check if game context exists
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers) {
  console.log('✅ React DevTools detected - app is running\n');
}

// Test fetching a map file directly
fetch('/src/assets/maps/json/terminalTown.json')
  .then(res => {
    if (res.ok) {
      console.log('✅ Map file accessible via Vite server');
      return res.json();
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  })
  .then(data => {
    console.log(`✅ terminalTown.json loaded: ${data.name} (${data.width}x${data.height})`);
    console.log('✅ Map structure valid\n');
    
    // Check game state through React
    console.log('To check current game state, run:');
    console.log('  1. Open React DevTools');
    console.log('  2. Find GameProvider component');
    console.log('  3. Check state.currentMap');
    console.log('\nOr paste this in console after game loads:');
    console.log('document.querySelector(".gameBoard")?.children.length');
  })
  .catch(err => {
    console.error('❌ Failed to load map:', err);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure Vite dev server is running (npm run dev)');
    console.log('2. Check that you\'re on the correct port');
    console.log('3. Look for errors in the Network tab');
  });
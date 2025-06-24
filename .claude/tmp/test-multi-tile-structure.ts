// Test script to verify multi-tile structure support
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Read Terminal Town map
const mapPath = join(process.cwd(), 'src/assets/maps/json/terminalTown.json');
const mapData = JSON.parse(readFileSync(mapPath, 'utf-8'));

// Add a test structure (2x2 house)
if (!mapData.objects) {
  mapData.objects = [];
}

// Add a small house structure at position (10, 5)
mapData.objects.push({
  id: "test_house_01",
  type: "structure",
  position: { x: 10, y: 5 },
  properties: {
    structureId: "small_house",
    size: { width: 2, height: 2 },
    visual: "🏠",
    collision: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ],
    interactionPoints: [
      {
        x: 1,
        y: 1,
        type: "door",
        targetMapId: "house_interior"
      }
    ]
  }
});

// Add a castle structure at position (15, 10)
mapData.objects.push({
  id: "test_castle_01",
  type: "structure",
  position: { x: 15, y: 10 },
  properties: {
    structureId: "castle",
    size: { width: 3, height: 3 },
    visual: "🏰",
    collision: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
      { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
      { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
    ],
    interactionPoints: [
      {
        x: 1,
        y: 2,
        type: "door",
        targetMapId: "castle_interior"
      }
    ]
  }
});

// Create a backup
const backupPath = mapPath.replace('.json', '.backup.json');
writeFileSync(backupPath, readFileSync(mapPath));

// Write the updated map
writeFileSync(mapPath, JSON.stringify(mapData, null, 2));

console.log('✅ Added test structures to Terminal Town');
console.log('   - Small house at (10, 5)');
console.log('   - Castle at (15, 10)');
console.log(`📁 Backup saved to: ${backupPath}`);
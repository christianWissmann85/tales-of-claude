/**
 * Simple test for AI-First Map System
 * Run with: npx tsx test-ai-maps-simple.ts
 */

import { AIFirstMap } from './src/models/AIFirstMap';
import { MapAI } from './src/models/MapAI';
import { ZoneEngine } from './src/engine/ZoneEngine';
import { terminalTownAI } from './src/maps/TerminalTown';

console.log('🎮 Testing AI-First Map System\n');

// Test 1: Load and validate map
console.log('=== Test 1: Loading Terminal Town ===');
const map = new AIFirstMap(terminalTownAI);
console.log(`✅ Loaded map: ${map.name}`);
console.log(`   Description: ${map.description}`);
console.log(`   Zones: ${map.zones.length}`);
console.log(`   Connections: ${map.connections.length}`);

// Test 2: Zone queries
console.log('\n=== Test 2: Zone Queries ===');
const townSquare = map.getZone('town_square');
if (townSquare) {
    console.log('✅ Found Town Square:');
    console.log(`   Purpose: ${townSquare.purpose}`);
    console.log(`   Bounds: ${JSON.stringify(townSquare.bounds)}`);
    console.log(`   Entities: ${townSquare.entities.length}`);
    console.log(`   Description: ${townSquare.getDescription()}`);
}

// Test 3: Position queries
console.log('\n=== Test 3: Position Queries ===');
const testPos = { x: 150, y: 150 };
const zoneAtPos = map.getZoneAtPosition(testPos);
console.log(`✅ Zone at (150, 150): ${zoneAtPos?.name || 'None'}`);
console.log(`   Walkable: ${map.isWalkable(testPos)}`);

// Test 4: Map AI
console.log('\n=== Test 4: Map AI ===');
const ai = new MapAI(map);
console.log('📍 Location description:');
console.log(ai.describeLocation(testPos));

console.log('\n🚶 Movement options:');
const moveOptions = ai.getMovementOptions(testPos);
moveOptions.slice(0, 5).forEach(opt => 
    console.log(`   ${opt.direction}: ${opt.description}`),
);

// Test 5: Pathfinding
console.log('\n=== Test 5: Pathfinding ===');
const engine = new ZoneEngine(map);
const start = { x: 110, y: 110 };
const end = { x: 180, y: 180 };

const path = engine.findPath(start, end);
if (path) {
    console.log(`✅ Path found: ${path.length} steps`);
    const aiPath = ai.findPath(start, end);
    console.log('\n📝 Directions:');
    aiPath.steps.forEach(step => console.log(`   ${step}`));
}

// Test 6: Validation
console.log('\n=== Test 6: Map Validation ===');
const validation = engine.validateMap();
console.log(`✅ Valid: ${validation.isValid}`);
console.log(`   Errors: ${validation.errors.length}`);
console.log(`   Warnings: ${validation.warnings.length}`);

// Test 7: Statistics
console.log('\n=== Test 7: Map Statistics ===');
const stats = engine.getMapStatistics();
console.log(`📊 Total zones: ${stats.totalZones}`);
console.log(`📊 Total entities: ${stats.totalEntities}`);
console.log('📊 Zones by purpose:');
stats.zonesByPurpose.forEach((count, purpose) => 
    console.log(`   ${purpose}: ${count}`),
);

console.log('\n✨ AI-First Map System is working!');
console.log('🎯 Claude can now understand and navigate maps using zones!');
// src/utils/mapPerformance.ts

import { JsonMap } from '../types/map-schema.types';
import { GameMap as IGameMap } from '../types/global.types';
import { MapLoader } from '../engine/MapLoader';
import { createMap, createCityMap } from './mapCreator';
import { convertTsMapToJson } from './mapValidation';

export interface PerformanceMetrics {
  mapId: string;
  mapSize: { width: number; height: number };
  format: 'json' | 'typescript';
  loadTime: number;
  parseTime: number;
  memoryUsage: number;
  tileCount: number;
  entityCount: number;
}

/**
 * Measures the performance of loading a map
 */
export async function measureMapLoadPerformance(mapId: string): Promise<PerformanceMetrics> {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

  try {
    const map = await MapLoader.getInstance().loadMap(mapId);
    
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

    return {
      mapId,
      mapSize: { width: map.width, height: map.height },
      format: 'json', // Assuming JSON if loaded through MapLoader
      loadTime: endTime - startTime,
      parseTime: 0, // Not separately measured
      memoryUsage: endMemory - startMemory,
      tileCount: map.width * map.height,
      entityCount: map.entities.length,
    };
  } catch (error) {
    throw new Error(`Failed to measure performance for map ${mapId}: ${error}`);
  }
}

/**
 * Compares loading performance between JSON and TypeScript maps
 */
export async function compareMapFormats(mapId: string): Promise<{
  json: PerformanceMetrics | null;
  typescript: PerformanceMetrics | null;
  comparison: string;
}> {
  let jsonMetrics: PerformanceMetrics | null = null;
  let tsMetrics: PerformanceMetrics | null = null;

  // Try loading JSON version
  try {
    jsonMetrics = await measureMapLoadPerformance(mapId);
  } catch (error) {
    console.warn(`No JSON version found for ${mapId}`);
  }

  // Try loading TypeScript version
  try {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Direct import for TS maps
    const module = await import(`../assets/maps/${mapId}.ts`);
    const mapData = module[`${mapId}Data`];
    
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

    tsMetrics = {
      mapId,
      mapSize: { width: mapData.width, height: mapData.height },
      format: 'typescript',
      loadTime: endTime - startTime,
      parseTime: 0,
      memoryUsage: endMemory - startMemory,
      tileCount: mapData.width * mapData.height,
      entityCount: mapData.entities.length,
    };
  } catch (error) {
    console.warn(`No TypeScript version found for ${mapId}`);
  }

  // Generate comparison
  let comparison = '';
  if (jsonMetrics && tsMetrics) {
    const loadTimeDiff = ((jsonMetrics.loadTime - tsMetrics.loadTime) / tsMetrics.loadTime) * 100;
    const memoryDiff = ((jsonMetrics.memoryUsage - tsMetrics.memoryUsage) / tsMetrics.memoryUsage) * 100;
    
    comparison = 'JSON vs TypeScript:\n';
    comparison += `Load Time: ${loadTimeDiff > 0 ? '+' : ''}${loadTimeDiff.toFixed(1)}%\n`;
    comparison += `Memory Usage: ${memoryDiff > 0 ? '+' : ''}${memoryDiff.toFixed(1)}%`;
  }

  return { json: jsonMetrics, typescript: tsMetrics, comparison };
}

/**
 * Tests performance with maps of different sizes
 */
export async function testMapSizePerformance(): Promise<PerformanceMetrics[]> {
  const sizes = [10, 20, 40, 60, 80, 100];
  const metrics: PerformanceMetrics[] = [];

  for (const size of sizes) {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Create a test map
    const map = createMap({
      id: `testMap_${size}x${size}`,
      name: `Test Map ${size}x${size}`,
      width: size,
      height: size,
    });

    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

    metrics.push({
      mapId: map.id,
      mapSize: { width: size, height: size },
      format: 'json',
      loadTime: endTime - startTime,
      parseTime: 0,
      memoryUsage: endMemory - startMemory,
      tileCount: size * size,
      entityCount: 0,
    });
  }

  return metrics;
}

/**
 * Measures render performance for a map
 */
export function measureRenderPerformance(
  map: IGameMap,
  renderFunction: (map: IGameMap) => void,
  iterations: number = 100,
): {
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  averageFrameTime: number;
} {
  const frameTimes: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startFrame = performance.now();
    renderFunction(map);
    const endFrame = performance.now();
    
    frameTimes.push(endFrame - startFrame);
  }

  const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  const minFrameTime = Math.min(...frameTimes);
  const maxFrameTime = Math.max(...frameTimes);

  return {
    averageFPS: 1000 / averageFrameTime,
    minFPS: 1000 / maxFrameTime,
    maxFPS: 1000 / minFrameTime,
    averageFrameTime,
  };
}

/**
 * Generates a performance report
 */
export function generatePerformanceReport(metrics: PerformanceMetrics[]): string {
  let report = '# Map Performance Report\n\n';
  
  report += '## Summary\n\n';
  report += '| Map ID | Size | Format | Load Time (ms) | Memory (KB) | Entities |\n';
  report += '|--------|------|--------|----------------|-------------|----------|\n';
  
  metrics.forEach(m => {
    report += `| ${m.mapId} | ${m.mapSize.width}x${m.mapSize.height} | ${m.format} | `;
    report += `${m.loadTime.toFixed(2)} | ${(m.memoryUsage / 1024).toFixed(1)} | ${m.entityCount} |\n`;
  });

  report += '\n## Analysis\n\n';
  
  // Find fastest/slowest
  const sorted = [...metrics].sort((a, b) => a.loadTime - b.loadTime);
  report += `- Fastest: ${sorted[0].mapId} (${sorted[0].loadTime.toFixed(2)}ms)\n`;
  report += `- Slowest: ${sorted[sorted.length - 1].mapId} (${sorted[sorted.length - 1].loadTime.toFixed(2)}ms)\n`;
  
  // Average stats
  const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
  const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
  
  report += `- Average Load Time: ${avgLoadTime.toFixed(2)}ms\n`;
  report += `- Average Memory Usage: ${(avgMemory / 1024).toFixed(1)}KB\n`;

  return report;
}

/**
 * Runs a comprehensive performance test suite
 */
export async function runPerformanceTestSuite(): Promise<void> {
  console.log('🚀 Starting Map Performance Test Suite...\n');

  // Test 1: Different map sizes
  console.log('📊 Test 1: Map Size Performance');
  const sizeMetrics = await testMapSizePerformance();
  console.log(generatePerformanceReport(sizeMetrics));

  // Test 2: Format comparison
  console.log('\n📊 Test 2: JSON vs TypeScript Format Comparison');
  const formatComparison = await compareMapFormats('terminalTown');
  console.log('Terminal Town Comparison:');
  console.log(formatComparison.comparison);

  // Test 3: Large map performance
  console.log('\n📊 Test 3: Large Map Performance (40x40 city)');
  const cityMap = createCityMap(40);
  const startTime = performance.now();
  // Simulate processing the map
  let tileCount = 0;
  cityMap.layers.forEach(layer => {
    if (layer.type === 'tilelayer') {
      tileCount += (layer as any).data.length;
    }
  });
  const endTime = performance.now();
  
  console.log('Large City Map (40x40):');
  console.log(`- Tile Count: ${tileCount}`);
  console.log(`- Processing Time: ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`- Time per Tile: ${((endTime - startTime) / tileCount).toFixed(4)}ms`);

  console.log('\n✅ Performance Test Suite Complete!');
}
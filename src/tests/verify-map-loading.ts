
import { MapLoader } from '../engine/MapLoader';

async function testMapLoading() {
  console.log('Testing map loading...');
  
  try {
    // Test loading terminalTown
    console.log('\n1. Testing terminalTown load...');
    const terminalTown = await MapLoader.loadMap('terminalTown');
    console.log(`✅ terminalTown loaded: ${terminalTown.name} (${terminalTown.width}x${terminalTown.height})`);
    
    // Test loading other maps
    const mapsToTest = ['binaryForest', 'debugDungeon', 'terminalFields'];
    
    for (const mapId of mapsToTest) {
      console.log(`\n2. Testing ${mapId} load...`);
      try {
        const map = await MapLoader.loadMap(mapId);
        console.log(`✅ ${mapId} loaded: ${map.name} (${map.width}x${map.height})`);
      } catch (error: unknown) { // Explicitly type error as unknown
        console.log(`❌ ${mapId} failed: ${(error as Error).message}`); // Cast to Error to access message
      }
    }
    
    console.log('\n✅ Map loading test completed successfully!');
  } catch (error: unknown) { // Explicitly type error as unknown
    console.error('❌ Map loading test failed:', (error as Error).message); // Cast to Error to access message
  }
}

testMapLoading();

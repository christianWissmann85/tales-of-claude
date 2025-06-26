// src/assets/maps/index.ts

import { binaryForestData } from './binaryForest';
import { debugDungeonData } from './debugDungeon';
import { terminalTownData } from './terminalTown';
import { GameMap as IGameMap } from '../../types/global.types';
import { MapLoader } from '../../engine/MapLoader';

// A central index for all map data
// Only legacy TS maps are here - all others loaded from JSON
export const mapDataIndex: { [key: string]: IGameMap | Promise<IGameMap> } = {
  // Legacy TypeScript maps (for backward compatibility)
  terminalTown: terminalTownData,
  binaryForest: binaryForestData,
  debugDungeon: debugDungeonData,
  // All other maps (terminalTownExpanded, crystalCaverns, syntaxSwamp, overworld)
  // are now loaded from JSON files by MapLoader
};

// Export a function to get maps that handles both sync and async loading
export async function getMap(mapId: string): Promise<IGameMap> {
  // First check if it's a legacy map in the index
  const indexedMap = mapDataIndex[mapId];
  if (indexedMap && !(indexedMap instanceof Promise)) {
    return indexedMap;
  }
  
  // Otherwise use MapLoader which will try JSON first, then TS
  // This handles terminalTown and all other JSON maps
  return MapLoader.loadMap(mapId);
}
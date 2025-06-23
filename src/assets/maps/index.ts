// src/assets/maps/index.ts

import { terminalTownData } from './terminalTown';
import { terminalTownExpandedData } from './terminalTownExpanded';
import { binaryForestData } from './binaryForest';
import { debugDungeonData } from './debugDungeon';
import { GameMap as IGameMap } from '../../types/global.types';
import { MapLoader } from '../../engine/MapLoader';

// A central index for all map data
// This now supports both legacy TS maps and new JSON maps
export const mapDataIndex: { [key: string]: IGameMap | Promise<IGameMap> } = {
  // Legacy TypeScript maps (for backward compatibility)
  terminalTown: terminalTownData,
  terminal_town_expanded: terminalTownExpandedData,
  terminalTownExpanded: terminalTownExpandedData, // Both naming conventions
  binaryForest: binaryForestData,
  debugDungeon: debugDungeonData,
  // New JSON-based maps are loaded dynamically by MapLoader
  // crystalCaverns and syntaxSwamp will be loaded from JSON
};

// Export a function to get maps that handles both sync and async loading
export async function getMap(mapId: string): Promise<IGameMap> {
  // First check if it's a legacy map in the index
  const indexedMap = mapDataIndex[mapId];
  if (indexedMap && !(indexedMap instanceof Promise)) {
    return indexedMap;
  }
  
  // Otherwise use MapLoader which will try JSON first, then TS
  return MapLoader.getInstance().loadMap(mapId);
}
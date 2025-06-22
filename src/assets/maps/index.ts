// src/assets/maps/index.ts

import { terminalTownData } from './terminalTown';
import { binaryForestData } from './binaryForest';
import { debugDungeonData } from './debugDungeon';
import { GameMap as IGameMap } from '../../types/global.types';

// A central index for all map data
export const mapDataIndex: { [key: string]: IGameMap } = {
  terminalTown: terminalTownData,
  binaryForest: binaryForestData,
  debugDungeon: debugDungeonData,
};
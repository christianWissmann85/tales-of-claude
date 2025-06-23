// src/assets/maps/terminalTownExpanded.ts

import { Position, Tile, TileType, Exit, Enemy, NPC, NPCRole, Item, GameMap as IGameMap } from '../../types/global.types';
import { GameMap } from '../../models/Map';
import { Enemy as EnemyClass, EnemyVariant } from '../../models/Enemy';
import { Item as ItemClass, ItemVariant } from '../../models/Item';
import terminalTownExpandedJson from './json/terminalTownExpanded.json';

// Convert JSON to game format
const MAP_WIDTH = terminalTownExpandedJson.width;
const MAP_HEIGHT = terminalTownExpandedJson.height;

// Find the layers
const baseLayer = terminalTownExpandedJson.layers.find(l => l.name === 'base' && l.type === 'tilelayer') as any;
const collisionLayer = terminalTownExpandedJson.layers.find(l => l.name === 'collision' && l.type === 'tilelayer') as any;
const objectsLayer = terminalTownExpandedJson.layers.find(l => l.name === 'objects' && l.type === 'objectgroup') as any;

// Initialize tiles from JSON data
const tiles: Tile[][] = [];
for (let y = 0; y < MAP_HEIGHT; y++) {
  tiles[y] = [];
  for (let x = 0; x < MAP_WIDTH; x++) {
    const index = y * MAP_WIDTH + x;
    const tileType = baseLayer.data[index] as TileType;
    const collisionType = collisionLayer.data[index];
    
    tiles[y][x] = {
      walkable: collisionType === 'walkable',
      type: tileType
    };
  }
}

// Extract NPCs from objects layer
const npcs: NPC[] = objectsLayer.objects
  .filter((obj: any) => obj.type === 'npc')
  .map((obj: any) => ({
    id: obj.id,
    name: obj.properties.name || obj.name,
    position: { x: obj.x, y: obj.y },
    role: obj.properties.role as NPCRole,
    dialogueId: obj.properties.dialogueId,
    statusEffects: []
  }));

// Extract enemies from objects layer  
const enemies: Enemy[] = objectsLayer.objects
  .filter((obj: any) => obj.type === 'enemy')
  .map((obj: any) => {
    const variant = obj.properties.variant as keyof typeof EnemyVariant;
    return new EnemyClass(
      obj.id,
      EnemyVariant[variant],
      { x: obj.x, y: obj.y }
    );
  });

// Extract items from objects layer
const items: Item[] = objectsLayer.objects
  .filter((obj: any) => obj.type === 'item')
  .map((obj: any) => {
    const variant = obj.properties.variant as keyof typeof ItemVariant;
    const baseItem = ItemClass.createItem(ItemVariant[variant]);
    return {
      ...baseItem,
      id: obj.id,
      position: { x: obj.x, y: obj.y }
    };
  });

// Extract exits from objects layer
const exits: Exit[] = objectsLayer.objects
  .filter((obj: any) => obj.type === 'exit')
  .map((obj: any) => ({
    position: { x: obj.x, y: obj.y },
    targetMapId: obj.properties.targetMap || obj.properties.targetMapId,
    targetPosition: { 
      x: obj.properties.targetX, 
      y: obj.properties.targetY 
    }
  }));

// Set spawn point from properties if available
if (terminalTownExpandedJson.properties?.spawnPoint) {
  const spawn = terminalTownExpandedJson.properties.spawnPoint;
  // Could add a special marker or note in the map data
}

export const terminalTownExpandedData: IGameMap = {
  id: terminalTownExpandedJson.id,
  name: terminalTownExpandedJson.name,
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  tiles: tiles,
  entities: [...npcs, ...enemies, ...items],
  exits: exits,
};
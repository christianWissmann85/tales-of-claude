// src/engine/MovementSystem.ts

import { Direction, Position } from '../types/global.types';
import { Player } from '../models/Player'; // Assuming Player is a concrete class implementing the Player interface
import { GameMap } from '../models/Map';   // Assuming GameMap is a concrete class implementing the GameMap interface

export class MovementSystem {

  /**
   * Returns the change in x and y coordinates for a given direction.
   * In a typical 2D grid, y increases downwards.
   * @param direction The direction of movement.
   * @returns An object with dx (change in x) and dy (change in y).
   */
  static getDirectionOffset(direction: Direction): { dx: number, dy: number } {
    switch (direction) {
      case 'up':
        return { dx: 0, dy: -1 };
      case 'down':
        return { dx: 0, dy: 1 };
      case 'left':
        return { dx: -1, dy: 0 };
      case 'right':
        return { dx: 1, dy: 0 };
      default:
        // This case should ideally not be reached due to TypeScript's strict typing for Direction.
        // However, for robustness, return no movement for an unrecognized direction.
        return { dx: 0, dy: 0 };
    }
  }

  /**
   * Calculates the new position based on a current position and a direction.
   * This method only calculates the coordinates and does not perform any boundary or collision checks.
   * @param current The current position.
   * @param direction The direction to move.
   * @returns A new Position object representing the calculated next position.
   */
  static calculateNewPosition(current: Position, direction: Direction): Position {
    const { dx, dy } = MovementSystem.getDirectionOffset(direction);
    return { x: current.x + dx, y: current.y + dy };
  }

  /**
   * Checks if a given position is valid and clear for movement on the map.
   * This includes checking map boundaries, tile walkability, and for occupying entities.
   * @param position The target position to check.
   * @param map The game map.
   * @returns True if the position is valid and clear for movement, false otherwise.
   */
  static canMoveTo(position: Position, map: GameMap): boolean {
    // 1. Check map boundaries
    if (position.x < 0 || position.x >= map.width || position.y < 0 || position.y >= map.height) {
      return false; // Out of bounds
    }

    // 2. Check tile walkability
    const tile = map.getTile(position.x, position.y); // Assuming map.getTile exists and returns a Tile object
    if (!tile || !tile.walkable) {
      return false; // Tile is not walkable (e.g., a wall)
    }

    // 3. Check for entity collisions
    // `map.getEntityAt` is assumed to return an `Enemy | NPC | Item | undefined` based on `GameMap.entities` type.
    // Since `canMoveTo` is called *before* the player's position is updated, `occupyingEntity` at `newPosition`
    // cannot be the player. If it exists, it must be another entity (Enemy, NPC, or Item).
    // Therefore, if `occupyingEntity` is found, it should block movement.
    const occupyingEntity = map.getEntityAt(position.x, position.y); // Assuming map.getEntityAt exists
    if (occupyingEntity) {
      return false; // Another entity is occupying this tile
    }

    return true; // All checks passed, position is valid for movement
  }

  /**
   * Attempts to move the player in the specified direction on the given map.
   * If the move is valid (within boundaries, on a walkable tile, and no collisions),
   * the player's position is updated, and the map's entity occupancy is adjusted.
   * @param player The player object to move.
   * @param direction The direction to move.
   * @param map The game map.
   * @returns True if the movement succeeded, false otherwise (e.g., blocked by wall, boundary, or entity).
   */
  static movePlayer(player: Player, direction: Direction, map: GameMap): boolean {
    const oldPosition = { ...player.position }; // Create a copy of the current position
    const newPosition = MovementSystem.calculateNewPosition(oldPosition, direction);

    if (MovementSystem.canMoveTo(newPosition, map)) {
      // If the new position is valid:

      // 1. Clear the player's ID from the old tile's occupyingEntityId.
      //    The map.getTile method is assumed to return a mutable Tile object.
      const oldTile = map.getTile(oldPosition.x, oldPosition.y);
      if (oldTile) { // Defensive check, though oldPosition should always be valid
        oldTile.occupyingEntityId = undefined;
      }

      // 2. Update the player's internal position.
      player.position = newPosition;

      // 3. Set the player's ID on the new tile's occupyingEntityId.
      //    The new position is guaranteed to be valid and walkable by canMoveTo.
      const newTile = map.getTile(newPosition.x, newPosition.y);
      if (newTile) { // Defensive check, though newPosition should be valid after canMoveTo
        newTile.occupyingEntityId = player.id;
      }

      // The original calls to map.removeEntity and map.addEntity were causing the TypeScript error.
      // Based on GameMap interface, these methods are likely intended for Enemy | NPC | Item types,
      // not for the Player. The player's presence on the map is managed directly via tile.occupyingEntityId.
      // map.removeEntity(player.id); // Removed: This call was incorrect for Player
      // map.addEntity(player);       // Removed: This call was the source of the error

      return true; // Movement successful
    }

    return false; // Movement failed (e.g., blocked)
  }
}

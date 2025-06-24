// src/constants/TileVisuals.ts

import { TileType } from '../types/global.types';

/**
 * Visual Hierarchy Design Principles:
 * 
 * 1. FLOORS (Background) - Should recede visually
 *    - Use subtle patterns: ░ ▒ · ⋅ ∙
 *    - Avoid solid blocks that compete with entities
 *    - Low visual weight
 * 
 * 2. WALLS (Barriers) - Should be obvious
 *    - Keep bold: 🧱 🌲 🌊
 *    - High contrast with floors
 *    - Clear "you can't walk here" message
 * 
 * 3. NPCs (Characters) - Should stand out
 *    - Use character emojis with faces: 🧙 🐱
 *    - Different from environmental elements
 *    - Medium-high visual weight
 * 
 * 4. ITEMS (Pickupables) - Should feel special
 *    - Add sparkle effects: ✨ 💫
 *    - Clear "lootable" visual language
 *    - High visual weight
 * 
 * 5. PLAYER - Most important
 *    - Unique emoji: 🤖
 *    - Highest visual weight
 *    - Can't be confused with anything else
 */

// Visual categories for easy reference
export const VISUAL_CATEGORIES = {
  SUBTLE_FLOORS: {
    dots: ['·', '⋅', '∙', '‥', '⁘'],
    shades: ['░', '▒', '▓'],
    patterns: ['⠂', '⠄', '⠆', '⠒', '⠢'],
    punctuation: ['､', '、', '｡'],
  },
  
  BOLD_BARRIERS: {
    walls: ['🧱', '🪨', '🗿'],
    nature: ['🌲', '🌳', '🌴'],
    liquids: ['🌊', '💧', '🏞️'],
  },
  
  CHARACTER_NPCS: {
    humanoid: ['🧙', '👷', '💂', '🧑‍💻'],
    creatures: ['🐱', '🦉', '🐉', '🦝'],
    special: ['👻', '🤖', '👽'],
  },
  
  INTERACTIVE_ITEMS: {
    sparkles: ['✨', '💫', '🌟'],
    treasures: ['💎', '💰', '🏆'],
    equipment: ['⚔️', '🛡️', '👑'],
    consumables: ['🧪', '🍎', '💊'],
  },
  
  INTERFACE_ELEMENTS: {
    directions: ['➡️', '⬆️', '⬇️', '⬅️'],
    actions: ['🚪', '🔒', '🔑'],
    locations: ['🏪', '🏥', '🏠'],
  },
};

// Floor tile visual weight guide
export const FLOOR_VISUAL_WEIGHT = {
  LOWEST: [' ', '·', '⋅'],      // Almost invisible
  LOW: ['∙', '､', '⠂'],         // Barely visible
  MEDIUM_LOW: ['░', '▒', '⁘'],  // Subtle texture
  MEDIUM: ['▓', '▫️', '◽'],     // More visible but still background
};

// Helper function to test visual hierarchy
export function getVisualWeight(emoji: string): 'lowest' | 'low' | 'medium' | 'high' | 'highest' {
  // Floors should be lowest/low
  if (FLOOR_VISUAL_WEIGHT.LOWEST.includes(emoji)) return 'lowest';
  if (FLOOR_VISUAL_WEIGHT.LOW.includes(emoji)) return 'low';
  if (FLOOR_VISUAL_WEIGHT.MEDIUM_LOW.includes(emoji)) return 'low';
  if (FLOOR_VISUAL_WEIGHT.MEDIUM.includes(emoji)) return 'medium';
  
  // Player is highest
  if (emoji === '🤖') return 'highest';
  
  // Items with sparkles are high
  if (emoji.includes('✨') || emoji.includes('💫')) return 'high';
  
  // NPCs and walls are medium-high
  if (Object.values(VISUAL_CATEGORIES.CHARACTER_NPCS).flat().includes(emoji)) return 'high';
  if (Object.values(VISUAL_CATEGORIES.BOLD_BARRIERS).flat().includes(emoji)) return 'high';
  
  return 'medium';
}

// Animation frames for special tiles
export const ANIMATED_TILES = {
  water: ['🌊', '💧', '💦', '🌊'],
  tech_floor: ['⚙️', '⚡', '💡', '⚙️'],
  hidden_area: ['❓', '❔', '❓', '❔'],
  item_sparkle: ['✨', '💫', '🌟', '✨'],
};

// Biome-specific overrides
export const BIOME_TILES = {
  forest: {
    grass: ['🌿', '🍀', '🌼'],
    tree: ['🌲', '🌳', '🍄'],
    path: ['🍂', '🍃'],
  },
  desert: {
    grass: ['🏜️', '🌵'],
    tree: ['🌴', '🌵'],
    water: ['💧'],  // Oasis
  },
  dungeon: {
    floor: ['▒', '▓', '⠿'],
    wall: ['🪨', '⛓️'],
    water: ['🧪'],  // Toxic
  },
  tech: {
    floor: ['⚙️', '🔌', '💡'],
    wall: ['💻', '📊'],
  },
};
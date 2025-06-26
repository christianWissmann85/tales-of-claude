# Technical Specification - Tales of Claude

## Technology Stack

### Core
- **Language**: TypeScript 5.x (strict mode)
- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Package Manager**: npm

### Libraries
- **State Management**: React Context + useReducer
- **Routing**: React Router v6 (for game scenes)
- **Styling**: CSS Modules
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

### Development Tools
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting

## Architecture

### Project Structure
```
tales-of-claude/
├── src/
│   ├── models/              # Game data models
│   │   ├── Player.ts
│   │   ├── Enemy.ts
│   │   ├── Item.ts
│   │   └── Map.ts
│   ├── engine/              # Core game engine
│   │   ├── GameEngine.ts
│   │   ├── MovementSystem.ts
│   │   ├── CombatSystem.ts
│   │   └── DialogueSystem.ts
│   ├── components/          # React components
│   │   ├── GameBoard/
│   │   ├── StatusBar/
│   │   ├── ActionMenu/
│   │   └── DialogueBox/
│   ├── scenes/              # Game scenes
│   │   ├── TitleScreen.tsx
│   │   ├── WorldMap.tsx
│   │   ├── Battle.tsx
│   │   └── GameOver.tsx
│   ├── utils/               # Utility functions
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── storage.ts
│   ├── assets/              # ASCII art and emoji maps
│   │   ├── maps/
│   │   ├── sprites.ts
│   │   └── dialogues.json
│   ├── types/               # TypeScript type definitions
│   │   └── global.types.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useGameLoop.ts
│   │   └── useKeyboard.ts
│   ├── context/             # React contexts
│   │   └── GameContext.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/                  # Static assets
├── tests/                   # Test files
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

## Core Systems

### 1. Game State Management
```typescript
interface GameState {
  player: Player;
  currentMap: GameMap;
  enemies: Enemy[];
  npcs: NPC[];
  items: Item[];
  dialogue: DialogueState | null;
  battle: BattleState | null;
}
```

### 2. Grid System
- 20x15 grid (can be adjusted)
- Each cell: 32x32 logical pixels
- Coordinate system: (x, y) where (0,0) is top-left

### 3. Movement System
```typescript
interface Position {
  x: number;
  y: number;
}

interface MovementSystem {
  movePlayer(direction: Direction): void;
  checkCollision(position: Position): boolean;
  checkInteraction(position: Position): Interaction | null;
}
```

### 4. Rendering Pipeline
1. Clear canvas/update DOM
2. Render map layer
3. Render entities (enemies, NPCs, items)
4. Render player
5. Render UI overlay

### 5. Game Loop
```typescript
function gameLoop(timestamp: number) {
  const deltaTime = timestamp - lastTimestamp;
  
  updateGame(deltaTime);
  renderGame();
  
  requestAnimationFrame(gameLoop);
}
```

## Data Models

### Player Model
```typescript
interface Player {
  id: string;
  name: string;
  position: Position;
  stats: {
    level: number;
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
    exp: number;
  };
  inventory: Item[];
  abilities: Ability[];
}
```

### Map Model
```typescript
interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: Tile[][];
  entities: MapEntity[];
  exits: Exit[];
}
```

### Combat Model
```typescript
interface BattleState {
  player: CombatEntity;
  enemies: CombatEntity[];
  currentTurn: 'player' | 'enemy';
  turnOrder: string[];
}
```

## Rendering Strategy

### Option 1: DOM-Based (Recommended for simplicity)
- Use CSS Grid for game board
- Each cell is a div with emoji/ASCII content
- CSS classes for animations
- Easy to style and debug

### Option 2: Canvas-Based
- Single canvas element
- Custom sprite rendering
- Better performance for complex scenes
- More complex to implement

**Recommendation**: Start with DOM-based, optimize later if needed.

## Storage & Persistence

### LocalStorage Schema
```javascript
{
  "tales-of-claude-save": {
    "player": { /* player data */ },
    "currentMap": "map_id",
    "gameFlags": { /* story progress */ },
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Performance Considerations

### Optimizations
1. Use React.memo for static components
2. Implement viewport culling (only render visible tiles)
3. Debounce keyboard input
4. Lazy load maps and assets

### Target Performance
- 60 FPS gameplay
- < 100ms scene transitions
- < 50ms input response

## Input Handling

### Keyboard Controls
```
Movement: Arrow Keys or WASD
Confirm: Space or Enter
Cancel: Escape or X
Menu: M or Tab
Interact: E or Space (context-sensitive)
```

### Touch Controls (Future)
- Virtual D-pad for movement
- Tap to interact
- Swipe for menus

## Build Configuration

### TypeScript Config (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

### Vite Config (vite.config.ts)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

## Development Phases

### Phase 1: Foundation (Week 1)
1. Project setup
2. Basic models
3. Movement system
4. Simple rendering

### Phase 2: Core Gameplay (Week 1-2)
1. Combat system
2. Dialogue system
3. Map transitions
4. Basic enemies

### Phase 3: Content & Polish (Week 2)
1. Multiple maps
2. NPCs and quests
3. Items and inventory
4. Save/load system

## Testing Strategy

### Unit Tests
- Models and utilities
- Game logic functions
- State reducers

### Integration Tests
- Movement system
- Combat calculations
- Save/load functionality

### E2E Tests (Optional)
- Complete game flows
- Victory conditions

## Error Handling

### Development
- Comprehensive error boundaries
- Detailed console logging
- TypeScript strict mode

### Production
- Graceful fallbacks
- User-friendly error messages
- Automatic save recovery

## Remember
This is a Delegate field test! Keep the scope manageable:
- Start simple, iterate
- Use Delegate for everything
- Let TypeScript errors guide the compile-fix loop
- Have fun with it!
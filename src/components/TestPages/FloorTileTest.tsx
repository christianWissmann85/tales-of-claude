import React, { useState } from 'react';
import styles from './FloorTileTest.module.css';

// --- Data Definitions (Mock Data for testing) ---

const floorColorMap: Record<string, string> = {
    floor: '#4a4a4a',
    grass: '#3e5c3e',
    dirt: '#6b4d3a',
    sand: '#d4a76a',
    stone: '#696969',
    wood: '#8b6f47',
    carpet: '#8b4513',
    metal: '#708090',
    ice: '#b0e0e6',
    lava: '#ff4500',
    water: '#4682b4',
    bridge: '#a0522d'
};

const ASCII_MODE: Record<string, string> = {
    floor: '.',
    grass: ',',
    dirt: ':',
    sand: '~',
    stone: '#',
    wood: '=',
    carpet: '%',
    metal: '+',
    ice: '*',
    lava: '&',
    water: '~',
    bridge: '='
};

const EMOJI_MODE: Record<string, string> = {
    floor: '⬜',
    grass: '🌿',
    dirt: '🟫',
    sand: '🟨',
    stone: '⬛',
    wood: '🟫',
    carpet: '🟥',
    metal: '⬜',
    ice: '🧊',
    lava: '🔥',
    water: '💧',
    bridge: '🌉'
};

// Sample NPCs, Items, and Player
const sampleEntities = {
    player: { symbol: '🤖', position: { x: 2, y: 2 } },
    npcs: [
        { symbol: '👨‍💻', position: { x: 1, y: 1 } },
        { symbol: '🐛', position: { x: 3, y: 3 } }
    ],
    items: [
        { symbol: '💾', position: { x: 0, y: 4 } },
        { symbol: '⚔️', position: { x: 4, y: 0 } }
    ]
};

// Sample map data
const sampleMaps = {
    terminalTown: [
        ['floor', 'floor', 'metal', 'floor', 'floor'],
        ['floor', 'carpet', 'carpet', 'carpet', 'floor'],
        ['metal', 'carpet', 'wood', 'carpet', 'metal'],
        ['floor', 'carpet', 'carpet', 'carpet', 'floor'],
        ['floor', 'floor', 'stone', 'floor', 'floor']
    ],
    binaryForest: [
        ['grass', 'grass', 'dirt', 'grass', 'grass'],
        ['grass', 'wood', 'dirt', 'wood', 'grass'],
        ['dirt', 'dirt', 'bridge', 'dirt', 'dirt'],
        ['grass', 'wood', 'dirt', 'wood', 'grass'],
        ['grass', 'grass', 'water', 'grass', 'grass']
    ],
    debugDungeon: [
        ['stone', 'stone', 'stone', 'stone', 'stone'],
        ['stone', 'floor', 'floor', 'floor', 'stone'],
        ['stone', 'floor', 'lava', 'floor', 'stone'],
        ['stone', 'floor', 'floor', 'floor', 'stone'],
        ['stone', 'ice', 'ice', 'ice', 'stone']
    ]
};

// --- Component Definitions ---

interface TileProps {
    type: string;
    isASCII: boolean;
    brightness: number;
    contrast: number;
    entity?: string;
}

const Tile: React.FC<TileProps> = ({ type, isASCII, brightness, contrast, entity }) => {
    const baseColor = floorColorMap[type] || '#4a4a4a';
    
    // Apply brightness and contrast adjustments
    const adjustColor = (color: string, brightness: number, contrast: number) => {
        // Convert hex to RGB
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        // Apply contrast
        const applyContrast = (value: number) => {
            return ((value / 255 - 0.5) * contrast + 0.5) * 255;
        };
        
        // Apply brightness
        const applyBrightness = (value: number) => {
            return Math.min(255, Math.max(0, value + brightness));
        };
        
        const newR = Math.round(applyBrightness(applyContrast(r)));
        const newG = Math.round(applyBrightness(applyContrast(g)));
        const newB = Math.round(applyBrightness(applyContrast(b)));
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    };
    
    const adjustedColor = adjustColor(baseColor, brightness, contrast);
    
    return (
        <div 
            className={styles.tile}
            style={{ 
                backgroundColor: isASCII ? '#1a1a1a' : adjustedColor,
                color: isASCII ? adjustedColor : '#ffffff'
            }}
        >
            {entity || (isASCII ? ASCII_MODE[type] || '?' : '')}
        </div>
    );
};

interface GridDisplayProps {
    title: string;
    grid: string[][];
    isASCII: boolean;
    brightness: number;
    contrast: number;
    showEntities?: boolean;
}

const GridDisplay: React.FC<GridDisplayProps> = ({ 
    title, 
    grid, 
    isASCII, 
    brightness, 
    contrast, 
    showEntities = false 
}) => {
    const getEntityAt = (x: number, y: number) => {
        if (!showEntities) return undefined;
        
        if (sampleEntities.player.position.x === x && sampleEntities.player.position.y === y) {
            return sampleEntities.player.symbol;
        }
        
        const npc = sampleEntities.npcs.find(n => n.position.x === x && n.position.y === y);
        if (npc) return npc.symbol;
        
        const item = sampleEntities.items.find(i => i.position.x === x && i.position.y === y);
        if (item) return item.symbol;
        
        return undefined;
    };
    
    return (
        <div className={styles.gridSection}>
            <h3>{title}</h3>
            <div className={styles.grid}>
                {grid.map((row, y) => (
                    <div key={y} className={styles.gridRow}>
                        {row.map((type, x) => (
                            <Tile 
                                key={`${x}-${y}`}
                                type={type}
                                isASCII={isASCII}
                                brightness={brightness}
                                contrast={contrast}
                                entity={getEntityAt(x, y)}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Component ---

const FloorTileTest: React.FC = () => {
    const [isASCII, setIsASCII] = useState(false);
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(1);
    
    return (
        <div className={styles.container}>
            <h1 className={styles.header}>Floor Tile Color System Test</h1>
            <p className={styles.description}>
                This page demonstrates the new floor tile color system for Tales of Claude.
                Use the controls below to test different viewing modes and adjustments.
            </p>
            
            {/* Controls */}
            <div className={styles.controls}>
                <label className={styles.controlItem}>
                    <input 
                        type="checkbox" 
                        checked={isASCII}
                        onChange={(e) => setIsASCII(e.target.checked)}
                    />
                    ASCII Mode
                </label>
                
                <label className={styles.controlItem}>
                    Brightness: {brightness}
                    <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                    />
                </label>
                
                <label className={styles.controlItem}>
                    Contrast: {contrast.toFixed(2)}
                    <input 
                        type="range" 
                        min="0.5" 
                        max="2" 
                        step="0.1"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                    />
                </label>
            </div>
            
            {/* Floor Type Comparison */}
            <section className={styles.section}>
                <h2>Floor Type Comparison</h2>
                <div className={styles.comparisonGrid}>
                    {Object.keys(floorColorMap).map(type => (
                        <div key={type} className={styles.comparisonItem}>
                            <div className={styles.typeLabel}>{type}</div>
                            <div className={styles.comparisonTiles}>
                                <div className={styles.oldStyle}>
                                    {EMOJI_MODE[type] || '⬜'}
                                </div>
                                <div className={styles.arrow}>→</div>
                                <Tile 
                                    type={type}
                                    isASCII={isASCII}
                                    brightness={brightness}
                                    contrast={contrast}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            
            {/* Sample Maps */}
            <section className={styles.section}>
                <h2>Sample Map Areas</h2>
                <div className={styles.mapsContainer}>
                    <GridDisplay 
                        title="Terminal Town"
                        grid={sampleMaps.terminalTown}
                        isASCII={isASCII}
                        brightness={brightness}
                        contrast={contrast}
                    />
                    <GridDisplay 
                        title="Binary Forest"
                        grid={sampleMaps.binaryForest}
                        isASCII={isASCII}
                        brightness={brightness}
                        contrast={contrast}
                    />
                    <GridDisplay 
                        title="Debug Dungeon"
                        grid={sampleMaps.debugDungeon}
                        isASCII={isASCII}
                        brightness={brightness}
                        contrast={contrast}
                    />
                </div>
            </section>
            
            {/* Entity Visibility Test */}
            <section className={styles.section}>
                <h2>Entity Visibility Test</h2>
                <p className={styles.note}>
                    Shows how player (🤖), NPCs (👨‍💻, 🐛), and items (💾, ⚔️) appear on different floor types.
                </p>
                <div className={styles.mapsContainer}>
                    <GridDisplay 
                        title="Terminal Town with Entities"
                        grid={sampleMaps.terminalTown}
                        isASCII={isASCII}
                        brightness={brightness}
                        contrast={contrast}
                        showEntities={true}
                    />
                    <GridDisplay 
                        title="Binary Forest with Entities"
                        grid={sampleMaps.binaryForest}
                        isASCII={isASCII}
                        brightness={brightness}
                        contrast={contrast}
                        showEntities={true}
                    />
                    <GridDisplay 
                        title="Debug Dungeon with Entities"
                        grid={sampleMaps.debugDungeon}
                        isASCII={isASCII}
                        brightness={brightness}
                        contrast={contrast}
                        showEntities={true}
                    />
                </div>
            </section>
        </div>
    );
};

export default FloorTileTest;
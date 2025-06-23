export interface Item {
    id: string;
    name: string;
    type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'quest';
    description: string;
    stats?: {
        attack?: number;
        defense?: number;
        magicAttack?: number;
        magicDefense?: number;
        speed?: number;
        hp?: number;
        mp?: number;
        criticalChance?: number;
        evasion?: number;
        // Add other relevant stats as needed
    };
    specialEffects: string[];
    value: number;
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Unique';
}

export const secretItems: Item[] = [
    // --- Terminal Town Secret Items ---
    {
        id: 'item_quantum_blade',
        name: 'Quantum Blade',
        type: 'weapon',
        description: 'A shimmering blade forged from unstable quantum particles. It phases in and out of reality, making its strikes unpredictable and devastating. Said to be a prototype weapon from a forgotten era of advanced technology.',
        stats: {
            attack: 120,
            speed: 15
        },
        specialEffects: [
            '20% chance to ignore enemy defense on hit',
            'Deals 25% bonus damage to mechanical foes'
        ],
        value: 15000,
        rarity: 'Legendary'
    },
    {
        id: 'item_neural_net_armor',
        name: 'Neural Net Armor',
        type: 'armor',
        description: 'Lightweight, flexible armor integrated with a self-learning neural network. It adapts to incoming attacks, constantly optimizing its defensive properties.',
        stats: {
            defense: 80,
            magicDefense: 70
        },
        specialEffects: [
            'Increases evasion by 10%',
            '15% chance to reflect magic attacks back at the caster'
        ],
        value: 12000,
        rarity: 'Epic'
    },
    {
        id: 'item_overclocked_chip',
        name: 'Overclocked Chip',
        type: 'accessory',
        description: 'A small, humming chip designed to push systems beyond their limits. It radiates a faint heat, a testament to its raw processing power.',
        stats: {
            speed: 25,
            magicAttack: 15
        },
        specialEffects: [
            'Grants "Haste" status (20% Speed increase) for the first 2 turns of combat',
            'Reduces MP cost of all abilities by 10%'
        ],
        value: 9000,
        rarity: 'Epic'
    },
    {
        id: 'item_snes_cartridge',
        name: 'SNES Cartridge',
        type: 'accessory',
        description: 'An ancient relic from a bygone era of entertainment. It hums with nostalgic energy, reminding one of simpler times and pixelated adventures. *Insert into the console in your room for a surprise!*',
        stats: {
            hp: 50,
            mp: 50
        },
        specialEffects: [
            'Increases EXP gain by 5% for the party',
            'Unlocks a retro mini-game in the player\'s home base'
        ],
        value: 7500,
        rarity: 'Unique'
    },
    {
        id: 'item_hackers_toolkit',
        name: 'Hacker\'s Toolkit',
        type: 'accessory',
        description: 'A compact set of digital tools, wires, and a portable terminal. Essential for bypassing security systems and uncovering hidden data.',
        stats: {
            magicAttack: 10,
            speed: 10
        },
        specialEffects: [
            'Grants access to certain locked terminals and data nodes',
            'Increases success rate of "Steal" ability by 10%'
        ],
        value: 6000,
        rarity: 'Rare'
    },

    // --- Binary Forest Secret Items ---
    {
        id: 'item_natures_wrath',
        name: 'Nature\'s Wrath',
        type: 'weapon',
        description: 'A staff carved from the heartwood of the oldest tree in the Binary Forest, pulsating with raw elemental energy. It channels the untamed power of the wilderness.',
        stats: {
            magicAttack: 110,
            hp: 50
        },
        specialEffects: [
            'Grants access to the "Thorn Barrage" spell (AoE Earth/Nature damage)',
            '15% chance to inflict "Entangle" status (prevents movement) on hit',
            'Restores 2 MP to the wielder at the start of each turn'
        ],
        value: 14000,
        rarity: 'Legendary'
    },
    {
        id: 'item_forest_gem',
        name: 'Forest Gem',
        type: 'accessory',
        description: 'A smooth, moss-covered gem found deep within a hidden waterfall. It resonates with the life force of the forest, granting vitality to its bearer.',
        stats: {
            hp: 100,
            mp: 50
        },
        specialEffects: [
            'Increases HP regeneration by 2 HP per turn',
            'Grants 50% resistance to Poison status effects'
        ],
        value: 8000,
        rarity: 'Epic'
    },
    {
        id: 'item_bark_armor',
        name: 'Bark Armor',
        type: 'armor',
        description: 'Armor crafted from hardened, enchanted tree bark. Surprisingly light yet incredibly resilient, it offers natural protection.',
        stats: {
            defense: 75,
            magicDefense: 60
        },
        specialEffects: [
            'Reduces damage from Nature-based attacks by 20%',
            'Grants immunity to "Rooted" status'
        ],
        value: 10000,
        rarity: 'Rare'
    },
    {
        id: 'item_elven_cloak',
        name: 'Elven Cloak',
        type: 'accessory',
        description: 'A finely woven cloak, imbued with ancient elven magic. It shimmers subtly, allowing the wearer to blend seamlessly with their surroundings.',
        stats: {
            speed: 10,
            evasion: 5
        },
        specialEffects: [
            'Grants temporary invisibility when entering a new area (briefly avoids enemy detection)',
            'Increases "Stealth" skill effectiveness by 20%'
        ],
        value: 9500,
        rarity: 'Epic'
    },
    {
        id: 'item_ancient_seed',
        name: 'Ancient Seed',
        type: 'quest',
        description: 'A large, petrified seed, radiating a faint, ancient energy. It feels incredibly old, as if it holds the memory of countless seasons. *Perhaps the Elder Druid knows its purpose.*',
        stats: {},
        specialEffects: [
            'Required for the "Heart of the Forest" quest'
        ],
        value: 0,
        rarity: 'Unique'
    },

    // --- Debug Dungeon Secret Items ---
    {
        id: 'item_debuggers_blade',
        name: 'Debugger\'s Blade',
        type: 'weapon',
        description: 'A sleek, glowing sword crafted from pure debug code. It can identify and exploit weaknesses in enemy programming.',
        stats: {
            attack: 105,
            magicAttack: 20
        },
        specialEffects: [
            'Deals 30% bonus damage to "Bugged" or "Corrupted" enemies',
            '10% chance to inflict "Vulnerability" status (reduces enemy defenses by 15%) on hit'
        ],
        value: 13000,
        rarity: 'Epic'
    },
    {
        id: 'item_exception_handler',
        name: 'Exception Handler',
        type: 'armor', // Shield
        description: 'A sturdy shield that glows with a protective aura. It automatically intercepts and mitigates critical errors, both digital and physical.',
        stats: {
            defense: 60,
            magicDefense: 50
        },
        specialEffects: [
            'Reduces critical damage taken by 30%',
            '15% chance to nullify a debuff at the start of the wearer\'s turn'
        ],
        value: 11000,
        rarity: 'Epic'
    },
    {
        id: 'item_stack_overflow',
        name: 'Stack Overflow',
        type: 'consumable', // Spell Scroll
        description: 'A forbidden scroll containing a highly volatile spell. It unleashes a cascade of recursive energy, overwhelming targets but risking backlash.',
        stats: {},
        specialEffects: [
            'Consumable: Casts a powerful AoE spell dealing massive non-elemental damage to all enemies (Requires 50 MP)',
            'Self-inflicts "Confusion" status for 1 turn after use'
        ],
        value: 7000,
        rarity: 'Legendary'
    },
    {
        id: 'item_memory_leak_potion',
        name: 'Memory Leak Potion',
        type: 'consumable',
        description: 'A murky, unstable concoction that seems to absorb ambient energy. Drinking it allows you to siphon mental resources from others.',
        stats: {},
        specialEffects: [
            'Consumable: Drains 30% of target enemy\'s current MP and restores 50% of that amount to the user (Can only be used in combat)'
        ],
        value: 2500,
        rarity: 'Rare'
    },
    {
        id: 'item_breakpoint_boots',
        name: 'Breakpoint Boots',
        type: 'accessory',
        description: 'Boots designed for rapid traversal through complex code. They allow the wearer to momentarily \'pause\' and \'resume\' their movement, granting bursts of speed.',
        stats: {
            speed: 30
        },
        specialEffects: [
            'Grants "Sprint" status (doubles out-of-combat movement speed) for 10 seconds (1-minute cooldown)',
            'Increases initiative in combat by 10%'
        ],
        value: 8500,
        rarity: 'Epic'
    },

    // --- Crystal Caverns Secret Items ---
    {
        id: 'item_prismatic_staff',
        name: 'Prismatic Staff',
        type: 'weapon',
        description: 'A staff crafted from a single, perfectly cut crystal, refracting light into a dazzling spectrum. It channels pure elemental energy, capable of unleashing a rainbow of destruction.',
        stats: {
            magicAttack: 115,
            mp: 75
        },
        specialEffects: [
            'Grants access to the "Prismatic Ray" spell (deals random elemental damage: Fire, Ice, Lightning, or Holy)',
            'Increases resistance to all elemental damage by 10%'
        ],
        value: 14500,
        rarity: 'Legendary'
    },
    {
        id: 'item_crystal_pickaxe',
        name: 'Crystal Pickaxe',
        type: 'weapon', // Also functions as a tool
        description: 'A sturdy pickaxe with a head made of reinforced crystal. It\'s exceptionally sharp and durable, perfect for breaking through tough mineral formations.',
        stats: {
            attack: 30 // Basic attack, primarily for utility
        },
        specialEffects: [
            'Allows mining of rare crystal nodes in the Crystal Caverns',
            'Increases chance of finding rare ores by 20%'
        ],
        value: 4000,
        rarity: 'Rare'
    },
    {
        id: 'item_refraction_ring',
        name: 'Refraction Ring',
        type: 'accessory',
        description: 'A delicate ring that subtly bends light around its wearer. It can distort perceptions and enhance light-based abilities.',
        stats: {
            magicDefense: 15,
            evasion: 5
        },
        specialEffects: [
            '20% chance to evade light-based attacks',
            'Increases effectiveness of light-elemental spells by 15%'
        ],
        value: 7000,
        rarity: 'Epic'
    },
    {
        id: 'item_scholars_blessing',
        name: 'Scholar\'s Blessing',
        type: 'consumable',
        description: 'A shimmering vial containing a concentrated essence of knowledge. Drinking it expands the mind and sharpens intellect.',
        stats: {},
        specialEffects: [
            'Consumable: Increases Magic Attack and Magic Defense by 20% for 3 turns',
            'Increases EXP gain by 10% for the next 5 battles'
        ],
        value: 3000,
        rarity: 'Rare'
    },
    {
        id: 'item_geode_heart',
        name: 'Geode Heart',
        type: 'accessory',
        description: 'A small, perfectly formed geode, still pulsing with the raw energy of the earth. It strengthens the body and resonates with inner vitality.',
        stats: {
            hp: 150,
            defense: 10
        },
        specialEffects: [
            'Increases maximum HP by 15%',
            'Grants 75% resistance to "Petrify" status'
        ],
        value: 10000,
        rarity: 'Epic'
    },

    // --- Syntax Swamp Secret Items ---
    {
        id: 'item_compilers_codex',
        name: 'Compiler\'s Codex',
        type: 'weapon', // Spellbook
        description: 'A thick, water-damaged tome filled with arcane symbols and complex programming syntax. It allows the wielder to \'compile\' raw magic into devastating spells.',
        stats: {
            magicAttack: 125,
            mp: 100
        },
        specialEffects: [
            'Grants access to the "Syntax Error" spell (deals non-elemental damage with a 20% chance to inflict "Silence")',
            'Reduces MP cost of all spells by 15%'
        ],
        value: 16000,
        rarity: 'Legendary'
    },
    {
        id: 'item_bog_boots',
        name: 'Bog Boots',
        type: 'armor', // Boots
        description: 'Thick, waterproof boots designed for navigating treacherous wetlands. They seem to repel the muck and mire of the swamp.',
        stats: {
            defense: 20,
            speed: 5
        },
        specialEffects: [
            'Prevents movement speed reduction in swamp terrain',
            'Grants immunity to "Slow" status from environmental effects'
        ],
        value: 5000,
        rarity: 'Uncommon'
    },
    {
        id: 'item_amphibian_amulet',
        name: 'Amphibian Amulet',
        type: 'accessory',
        description: 'A smooth, green amulet that feels cool to the touch. It allows the wearer to breathe effortlessly underwater and move with surprising agility in aquatic environments.',
        stats: {
            magicDefense: 10,
            hp: 20
        },
        specialEffects: [
            'Grants "Water Breathing" ability',
            'Increases movement speed in water by 50%',
            'Reduces damage from Water-based attacks by 15%'
        ],
        value: 7500,
        rarity: 'Rare'
    },
    {
        id: 'item_witchs_brew_set',
        name: 'Witch\'s Brew Set',
        type: 'consumable',
        description: 'A collection of small, corked vials containing various potent, and sometimes unpredictable, concoctions. Brewed by a reclusive swamp witch.',
        stats: {},
        specialEffects: [
            'Consumable: Contains 3 random potions (e.g., Potion of Strength, Potion of Healing, Potion of Confusion). Each potion is consumed separately.'
        ],
        value: 4000,
        rarity: 'Rare'
    },
    {
        id: 'item_corrupted_code',
        name: 'Corrupted Code',
        type: 'accessory',
        description: 'A fragment of highly unstable, malicious code. It pulses with dark energy, offering immense power at a terrible cost.',
        stats: {
            attack: 30,
            magicAttack: 30
        },
        specialEffects: [
            'Increases all damage dealt by 20%',
            'Inflicts "Curse" status on the wearer at the start of combat (reduces Defense by 10% for 3 turns)',
            'Cannot be unequipped during combat'
        ],
        value: 11000,
        rarity: 'Unique'
    }
];

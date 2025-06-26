#!/bin/bash

# Tales of Claude - AI-First Map System Implementation
# Extracted and cleaned from Genesis's design

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== AI-First Map System Implementation ===${NC}"
echo "This will DELETE the old tile-based system entirely!"
echo "Press CTRL+C to cancel, or wait 5 seconds to continue..."
sleep 5

# Phase 1: Clean out old system
echo -e "${YELLOW}Phase 1: Removing old map system...${NC}"

# Remove old map-related files
OLD_FILES=(
    "src/models/Map.ts"
    "src/engine/MapLoader.ts"
    "src/utils/mapValidation.ts"
    "src/utils/mapPerformance.ts"
    "src/utils/mapCreator.ts"
    "src/types/map-schema.types.ts"
)

for file in "${OLD_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo -e "${GREEN}✓${NC} Deleted: $file"
    fi
done

# Archive old JSON maps
if [ -d "src/assets/maps/json" ]; then
    mkdir -p "archives/old-maps"
    mv src/assets/maps/json/* archives/old-maps/ 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Archived old JSON maps"
fi

echo -e "${BLUE}Phase 2: Implementing new system...${NC}"
echo -e "${YELLOW}Note: Core implementation will be done by Alex!${NC}"

# Create directory structure
mkdir -p src/maps
mkdir -p src/engine/ai

echo -e "${GREEN}✓${NC} Created new directory structure"

# Summary
echo -e "${BLUE}=== Implementation Plan ===${NC}"
echo "1. ✓ Old system removed"
echo "2. ✓ Directories prepared"
echo "3. Next: Deploy Alex to implement:"
echo "   - /src/types/ai-map.types.ts"
echo "   - /src/models/MapAI.ts"
echo "   - /src/models/Zone.ts"
echo "   - /src/models/AIFirstMap.ts"
echo "   - /src/engine/ZoneEngine.ts"
echo "   - /src/maps/TerminalTown.ts"
echo ""
echo -e "${GREEN}Ready for clean implementation!${NC}"
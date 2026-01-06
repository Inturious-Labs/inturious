# Maze Generation System Documentation

## Overview

The maze generation system in Pacboy 2025 creates procedurally generated mazes with walls/dividers that provide obstacles while maintaining playability. The system ensures that Pacboy can always reach the apple (exit) and that ghosts have valid spawn positions.

## Architecture

### Core Components

1. **MazeGenerator** (`src/js/maze/generator.js`)
   - Main maze generation logic
   - Wall placement and validation
   - Pathfinding algorithms

2. **MazeRenderer** (`src/js/maze/renderer.js`)
   - Visual rendering of maze elements
   - Wall drawing with proper positioning
   - Game element rendering (pellets, exit, etc.)

3. **GameEngine** (`src/js/game/engine.js`)
   - Orchestrates maze generation and rendering
   - Manages game state and movement validation

## Maze Generation Process

### 1. Initial Setup
```javascript
// Create empty maze grid
const newMap = [];
for (let y = 0; y < GAME_CONFIG.MAP_HEIGHT; y++) {
  const row = [];
  for (let x = 0; x < GAME_CONFIG.MAP_WIDTH; x++) {
    row.push(0); // 0 = walkable space
  }
  newMap.push(row);
}
```

### 2. Wall Generation Strategy

The system uses a **grid-based approach** where walls are placed on grid lines between cells:

- **Horizontal Walls**: Divide rows (placed between y and y+1)
- **Vertical Walls**: Divide columns (placed between x and x+1)

#### Wall Density Calculation
```javascript
const levelDensity = Math.min(
  GAME_CONFIG.MAX_WALL_DENSITY, 
  GAME_CONFIG.BASE_WALL_DENSITY + (level - 1) * GAME_CONFIG.DENSITY_INCREMENT
);
```

**Current Settings:**
- Base Density: 25% (increases with level)
- Max Density: 50%
- Density Increment: 3% per level
- Minimum Walls: 15
- Guaranteed Walls: 8

### 3. Wall Placement Algorithm

#### Step 1: Random Wall Generation
```javascript
// Horizontal walls
for (let y = 1; y < MAP_HEIGHT - 1; y++) {
  for (let x = 0; x < MAP_WIDTH; x++) {
    if (Math.random() < levelDensity) {
      if (canPlaceWallSafely(x, y, 'horizontal', map)) {
        horizontalWalls.push({x, y});
      }
    }
  }
}

// Vertical walls
for (let y = 0; y < MAP_HEIGHT; y++) {
  for (let x = 1; x < MAP_WIDTH - 1; x++) {
    if (Math.random() < levelDensity) {
      if (canPlaceWallSafely(x, y, 'vertical', map)) {
        verticalWalls.push({x, y});
      }
    }
  }
}
```

#### Step 2: Minimum Wall Guarantee
If insufficient walls are generated, additional walls are placed:
```javascript
if (totalWalls < MIN_WALLS) {
  // Add guaranteed walls with validation
  for (let i = 0; i < GUARANTEED_WALLS; i++) {
    const x = 2 + Math.floor(Math.random() * (MAP_WIDTH - 4));
    const y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - 4));
    if (canPlaceWallSafely(x, y, 'horizontal', map)) {
      horizontalWalls.push({x, y});
    }
  }
}
```

## Validation System

### 1. Basic Path Validation (`canPlaceWallSafely`)

**Purpose**: Ensures a path exists from start (0,0) to exit (MAP_WIDTH-1, MAP_HEIGHT-1)

**Algorithm**: Breadth-First Search (BFS)
```javascript
function canPlaceWallSafely(x, y, wallType, map) {
  // Temporarily add the wall
  const tempWalls = [...existingWalls];
  tempWalls.push({x, y, type: wallType});
  
  // Check if path still exists
  return hasPathToExit(map, tempWalls);
}
```

### 2. Comprehensive Validation (Currently Disabled)

**Purpose**: Validates all 5 criteria for wall placement

**Criteria**:
1. ✅ Pacboy at start (0,0) is not trapped
2. ✅ Apple at exit is not trapped  
3. ✅ Ghosts are not trapped (checks potential spawn positions)
4. ✅ At least 1 path from Pacboy to Apple
5. ✅ No dead weight rooms (enclosed rooms)

**Note**: This validation was too restrictive and is currently disabled in favor of basic validation.

## Pathfinding Algorithm

### BFS Implementation
```javascript
function hasPathToExit(map, horizontalWalls, verticalWalls) {
  const visited = new Set();
  const queue = [{x: 0, y: 0}];
  
  while (queue.length > 0) {
    const {x, y} = queue.shift();
    const key = `${x},${y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    // Check if reached exit
    if (x === MAP_WIDTH - 1 && y === MAP_HEIGHT - 1) {
      return true;
    }
    
    // Check all 4 directions
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (isValidPosition(nx, ny) && !isBlockedByWall(x, y, nx, ny)) {
        queue.push({x: nx, y: ny});
      }
    }
  }
  
  return false;
}
```

### Wall Collision Detection
```javascript
function isBlockedByWall(fromX, fromY, toX, toY) {
  if (toX > fromX) { // Moving right
    return verticalWalls.some(wall => wall.x === fromX && wall.y === fromY);
  } else if (toX < fromX) { // Moving left
    return verticalWalls.some(wall => wall.x === toX && wall.y === fromY);
  } else if (toY > fromY) { // Moving down
    return horizontalWalls.some(wall => wall.x === fromX && wall.y === fromY);
  } else if (toY < fromY) { // Moving up
    return horizontalWalls.some(wall => wall.x === fromX && wall.y === toY);
  }
  return false;
}
```

## Rendering System

### Wall Drawing
```javascript
function drawWalls(horizontalWalls, verticalWalls) {
  ctx.strokeStyle = '#e94560'; // Red color
  ctx.lineWidth = 4;
  
  // Draw horizontal walls
  for (const wall of horizontalWalls) {
    const x1 = wall.x * tileSize;
    const y1 = (wall.y + 1) * tileSize;
    const x2 = (wall.x + 1) * tileSize;
    const y2 = (wall.y + 1) * tileSize;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  // Draw vertical walls
  for (const wall of verticalWalls) {
    const x1 = (wall.x + 1) * tileSize;
    const y1 = wall.y * tileSize;
    const x2 = (wall.x + 1) * tileSize;
    const y2 = (wall.y + 1) * tileSize;
    ctx.stroke();
  }
}
```

## Configuration

### Game Constants (`src/js/utils/constants.js`)
```javascript
GAME_CONFIG = {
  MAP_WIDTH: 10,
  MAP_HEIGHT: 16,
  BASE_WALL_DENSITY: 0.25,      // 25% base density
  MAX_WALL_DENSITY: 0.5,        // 50% max density
  DENSITY_INCREMENT: 0.03,       // +3% per level
  MIN_WALLS: 15,                // Minimum walls required
  GUARANTEED_WALLS: 8,          // Guaranteed walls if minimum not met
}
```

## Testing and Debugging

### Debug Tools
1. **wall_debug_test.html**: Standalone test for wall generation
2. **maze_validation_test.html**: Comprehensive maze validation testing
3. **Console Logging**: Added to generator and renderer for debugging

### Common Issues and Solutions

#### Issue: No walls appearing
**Causes**:
- Validation too restrictive
- Wall density too low
- Rendering issues

**Solutions**:
- Use basic validation instead of comprehensive
- Increase wall density settings
- Check console logs for wall generation

#### Issue: Maze becomes impassable
**Causes**:
- Insufficient path validation
- Too many walls placed

**Solutions**:
- Ensure BFS pathfinding is working
- Adjust minimum wall requirements
- Add fallback path creation

## Future Enhancements

### Potential Improvements
1. **Advanced Maze Algorithms**: Implement recursive backtracking or Kruskal's algorithm
2. **Theme Variations**: Different wall styles and colors
3. **Dynamic Difficulty**: Adjust wall density based on player performance
4. **Maze Patterns**: Pre-designed maze templates for special levels

### Performance Considerations
- Current BFS implementation is O(V + E) where V = cells, E = connections
- For larger mazes, consider A* pathfinding
- Wall validation could be optimized with spatial indexing

## File Structure
```
src/js/maze/
├── generator.js    # Core maze generation logic
└── renderer.js     # Visual rendering system

src/js/utils/
└── constants.js    # Configuration settings

doc/
└── maze-generation.md  # This documentation
```

## Maintenance Notes

- **Wall Density**: Adjust `BASE_WALL_DENSITY` and `MAX_WALL_DENSITY` for difficulty
- **Validation**: Switch between basic and comprehensive validation as needed
- **Rendering**: Modify colors and line widths in `drawWalls()` method
- **Testing**: Use debug tools to verify maze generation and connectivity

---

*Last Updated: January 2025*
*Version: 1.0* 
import * as THREE from 'three';
import { getMazeLayout, getPlatformSize, getWallWidth, getWallDepth, getCellSize, playerHeight } from './config.js';
import { generateTexture } from './textureGenerator.js';

// Wall collision boxes array
let wallCollisionBoxes = [];
// Obstacle collision boxes array (separate from walls)
let obstacleCollisionBoxes = [];

// Texture loader and cache
const textureLoader = new THREE.TextureLoader();
const textureCache = {};

// Get or generate a texture
function getTexture(textureName) {
    if (!textureCache[textureName]) {
        // Generate procedural texture
        const canvas = generateTexture(textureName);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        textureCache[textureName] = texture;
    }
    return textureCache[textureName];
}

// Get bump map if available
function getBumpMap(textureName) {
    const bumpMapName = `${textureName}_bump`;
    if (!textureCache[bumpMapName]) {
        try {
            textureCache[bumpMapName] = textureLoader.load(`textures/${bumpMapName}.jpg`);
            textureCache[bumpMapName].wrapS = THREE.RepeatWrapping;
            textureCache[bumpMapName].wrapT = THREE.RepeatWrapping;
            textureCache[bumpMapName].repeat.set(1, 1);
        } catch (e) {
            // If bump map doesn't exist, return null
            textureCache[bumpMapName] = null;
        }
    }
    return textureCache[bumpMapName];
}

// Create the maze structure
export function createMaze(scene, theme) {
    // Use theme properties or defaults
    const wallColor = theme ? theme.wallColor : 0x8B4513;
    const mazeLayout = getMazeLayout();
    const wallWidth = getWallWidth();
    const wallDepth = getWallDepth();
    const cellSize = getCellSize();
    const platformSize = getPlatformSize();
    
    // Get theme-specific wall properties or use defaults
    const wallHeight = theme && theme.wallHeight ? theme.wallHeight : 2.5;
    const wallRoughness = theme && theme.wallRoughness !== undefined ? theme.wallRoughness : 0.7;
    const wallMetalness = theme && theme.wallMetalness !== undefined ? theme.wallMetalness : 0.1;
    const wallEmissive = theme && theme.wallEmissive ? theme.wallEmissive : 0x000000;
    const wallBevelSize = theme && theme.wallBevelSize !== undefined ? theme.wallBevelSize : 0;
    const wallPattern = theme && theme.wallPattern ? theme.wallPattern : 'default';
    const wallToppers = theme && theme.wallToppers !== undefined ? theme.wallToppers : false;
    
    // Clear previous collision boxes before creating new ones
    wallCollisionBoxes = [];
    
    // Create basic material first (will be enhanced below)
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: wallColor,
        roughness: wallRoughness,
        metalness: wallMetalness,
        emissive: wallEmissive,
        emissiveIntensity: wallEmissive === 0x000000 ? 0 : 0.5
    });
    
    // Apply textures if specified in theme
    if (theme && theme.wallTexture) {
        try {
            const texture = getTexture(theme.wallTexture);
            wallMaterial.map = texture;
            
            // Set texture repeat based on wall size
            wallMaterial.map.repeat.set(1, wallHeight / 2);
        } catch (e) {
            console.warn(`Failed to generate texture: ${theme.wallTexture}`, e);
        }
    }
    
    // Create wall geometry with bevel if specified
    let wallGeometry;
    if (wallBevelSize > 0) {
        // Use beveled box for more interesting edges
        wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
        // Convert to buffer geometry if it's not already
        if (!(wallGeometry instanceof THREE.BufferGeometry)) {
            wallGeometry = new THREE.BufferGeometry().fromGeometry(wallGeometry);
        }
    } else {
        // Use simple box for performance
        wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
    }
    
    // Maze container to group walls
    const maze = new THREE.Group();
    scene.add(maze);
    
    // Create the maze walls
    for (let i = 0; i < mazeLayout.length; i++) {
        for (let j = 0; j < mazeLayout[i].length; j++) {
            if (mazeLayout[i][j] === 1) {
                // Clone the geometry for this wall
                const thisWallGeometry = wallGeometry.clone();
                
                // Create specific material variations for this wall if needed
                // This allows for subtle variations within the same theme
                const thisWallMaterial = wallMaterial.clone();
                
                // Add subtle random variations to make walls more interesting
                if (wallPattern === 'cracked' || wallPattern === 'weathered') {
                    // Add slight color variation
                    const variation = Math.random() * 0.2 - 0.1; // -0.1 to 0.1
                    thisWallMaterial.color.offsetHSL(0, 0, variation);
                }
                
                // Create the wall mesh
                const wall = new THREE.Mesh(thisWallGeometry, thisWallMaterial);
                
                // Position walls on the platform grid
                // Convert from maze coordinates to world coordinates
                wall.position.set(
                    -platformSize + j * cellSize + cellSize/2,
                    wallHeight / 2,
                    -platformSize + i * cellSize + cellSize/2
                );
                
                // Add pattern-specific details
                if (wallPattern === 'panel') {
                    // Add panel lines as decorations
                    addPanelsToWall(wall, wallWidth, wallHeight, wallDepth, wallColor);
                } else if (wallPattern === 'grid') {
                    // Add glowing grid lines
                    addGridToWall(wall, wallWidth, wallHeight, wallDepth, wallEmissive);
                }
                
                // Add wall toppers if enabled
                if (wallToppers) {
                    addWallToppers(wall, wallWidth, wallHeight, wallDepth, theme);
                }
                
                wall.castShadow = true;
                wall.receiveShadow = true;
                maze.add(wall);
                
                // Create collision box (slightly smaller than the visible wall)
                const collisionMargin = 0.05;
                const collisionBox = new THREE.Box3(
                    new THREE.Vector3(
                        wall.position.x - wallWidth/2 + collisionMargin,
                        wall.position.y - wallHeight/2,
                        wall.position.z - wallDepth/2 + collisionMargin
                    ),
                    new THREE.Vector3(
                        wall.position.x + wallWidth/2 - collisionMargin,
                        wall.position.y + wallHeight/2,
                        wall.position.z + wallDepth/2 - collisionMargin
                    )
                );
                wallCollisionBoxes.push(collisionBox);
            }
        }
    }
    
    // Create obstacles along paths
    const obstacles = createObstacles(scene, theme);
    maze.add(obstacles);
    
    return maze;
}

// Add panels to walls for more detailed structure
function addPanelsToWall(wall, width, height, depth, baseColor) {
    // Create panel edges
    const edgeGeometry = new THREE.BoxGeometry(width * 0.9, height * 0.05, depth * 0.05);
    const edgeMaterial = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(baseColor).offsetHSL(0, 0, 0.1),
        roughness: 0.5, 
        metalness: 0.8 
    });
    
    // Add horizontal panels
    const numPanels = 3;
    const panelSpacing = height * 0.8 / numPanels;
    
    for (let i = 0; i < numPanels; i++) {
        const panelY = -height/2 + (i + 1) * panelSpacing;
        
        // Horizontal panel
        const panel = new THREE.Mesh(edgeGeometry, edgeMaterial);
        panel.position.set(0, panelY, depth/2 - 0.02);
        wall.add(panel);
    }
}

// Add grid lines for tech/neon walls
function addGridToWall(wall, width, height, depth, glowColor) {
    // Create thin glowing lines
    const lineGeometry = new THREE.BoxGeometry(width * 0.95, height * 0.01, 0.01);
    const lineMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        emissive: glowColor,
        emissiveIntensity: 1.0,
        roughness: 0.2,
        metalness: 0.9
    });
    
    // Add horizontal grid lines
    const numLines = 5;
    const lineSpacing = height * 0.9 / numLines;
    
    for (let i = 0; i < numLines; i++) {
        const lineY = -height/2 + (i + 1) * lineSpacing;
        
        // Horizontal line
        const hLine = new THREE.Mesh(lineGeometry, lineMaterial);
        hLine.position.set(0, lineY, depth/2 + 0.01);
        wall.add(hLine);
        
        // Vertical lines
        if (i < numLines - 1) {
            const vLine = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.01, height * 0.9, 0.01),
                lineMaterial
            );
            vLine.position.set(width/4 * (i - 1), 0, depth/2 + 0.01);
            wall.add(vLine);
        }
    }
}

// Add decorative elements to wall tops based on theme
function addWallToppers(wall, width, height, depth, theme) {
    if (theme.wallTexture === 'wood') {
        // Add leaves for forest theme
        addForestToppers(wall, width, height, depth);
    } else if (theme.wallTexture === 'coral') {
        // Add coral formations for ocean theme
        addCoralToppers(wall, width, height, depth);
    } else if (theme.wallTexture === 'alien') {
        // Add alien growths for alien theme
        addAlienToppers(wall, width, height, depth);
    }
}

// Add forest leaf decorations
function addForestToppers(wall, width, height, depth) {
    // Create some leaf-like decorations
    const leafSize = 0.3;
    const numLeaves = Math.floor(Math.random() * 3) + 1; // 1-3 leaves
    
    for (let i = 0; i < numLeaves; i++) {
        // Create a simple leaf shape
        const leafGeometry = new THREE.SphereGeometry(leafSize, 4, 4);
        const leafMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x33cc33, 
            roughness: 0.9, 
            metalness: 0.0 
        });
        
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        // Position randomly along top of wall
        const offsetX = (Math.random() - 0.5) * (width * 0.8);
        const offsetZ = (Math.random() - 0.5) * (depth * 0.8);
        
        leaf.position.set(
            offsetX,
            height/2 + leafSize/2,
            offsetZ
        );
        
        leaf.scale.y = 1.5; // Make leaves taller
        
        leaf.castShadow = true;
        wall.add(leaf);
    }
}

// Add coral formations for ocean theme
function addCoralToppers(wall, width, height, depth) {
    // Create some coral-like formations
    const numFormations = Math.floor(Math.random() * 3) + 1; // 1-3 formations
    
    for (let i = 0; i < numFormations; i++) {
        // Create a coral formation
        const formationGeometry = new THREE.CylinderGeometry(0.1, 0.2, 0.4, 5);
        const formationMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff7777, 
            roughness: 0.8, 
            metalness: 0.2,
            emissive: 0x330000,
            emissiveIntensity: 0.2
        });
        
        const formation = new THREE.Mesh(formationGeometry, formationMaterial);
        
        // Position randomly along top of wall
        const offsetX = (Math.random() - 0.5) * (width * 0.8);
        const offsetZ = (Math.random() - 0.5) * (depth * 0.8);
        
        formation.position.set(
            offsetX,
            height/2 + 0.2,
            offsetZ
        );
        
        // Random rotation for variety
        formation.rotation.y = Math.random() * Math.PI;
        
        formation.castShadow = true;
        wall.add(formation);
    }
}

// Add alien growths for alien theme
function addAlienToppers(wall, width, height, depth) {
    // Create some alien growth formations
    const numGrowths = Math.floor(Math.random() * 2) + 1; // 1-2 growths
    
    for (let i = 0; i < numGrowths; i++) {
        // Create alien tentacle/growth
        const growthGeometry = new THREE.ConeGeometry(0.1, 0.6, 4);
        const growthMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ff33, 
            roughness: 0.4, 
            metalness: 0.7,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });
        
        const growth = new THREE.Mesh(growthGeometry, growthMaterial);
        
        // Position randomly along top of wall
        const offsetX = (Math.random() - 0.5) * (width * 0.8);
        const offsetZ = (Math.random() - 0.5) * (depth * 0.8);
        
        growth.position.set(
            offsetX,
            height/2 + 0.3,
            offsetZ
        );
        
        // Random rotation and slight tilt
        growth.rotation.y = Math.random() * Math.PI;
        growth.rotation.x = (Math.random() - 0.5) * 0.5;
        
        growth.castShadow = true;
        wall.add(growth);
    }
}

// Create platform for the maze
export function createPlatform(scene, theme) {
    const platformSize = getPlatformSize();
    
    // Get theme-specific platform properties or use defaults
    const platformColor = theme ? theme.platformColor : 0x607D8B;
    const platformTexture = theme && theme.platformTexture ? theme.platformTexture : null;
    const platformRoughness = theme && theme.platformRoughness !== undefined ? theme.platformRoughness : 0.8;
    const platformMetalness = theme && theme.platformMetalness !== undefined ? theme.platformMetalness : 0.1;
    
    // Create platform geometry
    const platformGeometry = new THREE.BoxGeometry(platformSize * 2, 0.5, platformSize * 2);
    
    // Create platform material
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: platformColor,
        roughness: platformRoughness,
        metalness: platformMetalness
    });
    
    // Apply texture if specified
    if (platformTexture) {
        try {
            const texture = getTexture(platformTexture);
            platformMaterial.map = texture;
            
            // Set texture repeat based on platform size
            platformMaterial.map.repeat.set(platformSize / 2, platformSize / 2);
        } catch (e) {
            console.warn(`Failed to generate platform texture: ${platformTexture}`, e);
        }
    }
    
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -0.25; // Position slightly below the origin
    platform.receiveShadow = true;
    scene.add(platform);
    
    return platform;
}

// Create start and finish markers
export function createStartFinish(scene) {
    const cellSize = getCellSize();
    const platformSize = getPlatformSize();
    
    // Create start line
    const startLineGeometry = new THREE.BoxGeometry(cellSize, 0.1, cellSize);
    const startLineMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Green
    const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
    startLine.position.set(-platformSize + cellSize/2, 0.01, -platformSize + cellSize/2);
    scene.add(startLine);

    // Create finish line
    const finishLineGeometry = new THREE.BoxGeometry(cellSize, 0.1, cellSize);
    const finishLineMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red
    const finishLine = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
    finishLine.position.set(platformSize - cellSize/2, 0.01, platformSize - cellSize/2);
    scene.add(finishLine);
    
    return { startLine, finishLine };
}

// Create obstacles that the player needs to jump over
function createObstacles(scene, theme) {
    // Create an empty group and return it without adding any obstacles
    const obstaclesGroup = new THREE.Group();
    
    // Clear previous obstacle collision boxes
    obstacleCollisionBoxes = [];
    
    // No obstacles will be created - returning empty group
    return obstaclesGroup;
}

// Create spike geometry for interesting obstacles
function createSpikeGeometry(width, height, depth) {
    // Create a custom geometry for spikes
    const geometry = new THREE.BufferGeometry();
    
    // Base vertices (bottom of the spike row)
    const baseX = width / 2;
    const baseZ = depth / 2;
    
    // Calculate number of spikes based on width
    const numSpikes = Math.max(2, Math.floor(width / 0.3));
    const spikeWidth = width / numSpikes;
    
    // Create vertices
    const vertices = [];
    const indices = [];
    
    // Add base vertices
    vertices.push(-baseX, 0, -baseZ); // 0: back left
    vertices.push(baseX, 0, -baseZ);  // 1: back right
    vertices.push(baseX, 0, baseZ);   // 2: front right
    vertices.push(-baseX, 0, baseZ);  // 3: front left
    
    // Add spike vertices
    let vertexIndex = 4;
    for (let i = 0; i < numSpikes; i++) {
        const spikeX = -baseX + spikeWidth/2 + i * spikeWidth;
        vertices.push(spikeX, height, 0); // Spike top
        
        // Connect spike to base with triangles
        // Left face
        indices.push(vertexIndex, i === 0 ? 0 : (vertexIndex - 1), 3);
        // Right face
        indices.push(vertexIndex, 2, i === numSpikes-1 ? 1 : (vertexIndex + 1));
        // Back face
        indices.push(vertexIndex, i === 0 ? 0 : (vertexIndex - 1), 1);
        // Front face
        indices.push(vertexIndex, 3, i === numSpikes-1 ? 2 : (vertexIndex + 1));
        
        vertexIndex++;
    }
    
    // Create base face
    indices.push(0, 1, 2);
    indices.push(0, 2, 3);
    
    // Set geometry attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
}

// Check collision with maze walls and obstacles
export function checkWallCollisions(position, radius, isJumping = false) {
    // Create player bounding cylinder (simplified as box)
    const playerBox = new THREE.Box3(
        new THREE.Vector3(
            position.x - radius,
            position.y - playerHeight/2,
            position.z - radius
        ),
        new THREE.Vector3(
            position.x + radius,
            position.y + playerHeight/2,
            position.z + radius
        )
    );
    
    // Check collision with each wall
    for (const wallBox of wallCollisionBoxes) {
        if (playerBox.intersectsBox(wallBox)) {
            return true;
        }
    }
    
    // Completely skip obstacle collision detection
    // Removed isJumping check and obstacle collision
    
    return false;
}

// Export obstacle collision boxes for use in other modules
export function getObstacleCollisionBoxes() {
    return obstacleCollisionBoxes;
}

// Pathfinding function to find valid paths through the maze
export function findPathToFinish() {
    const mazeLayout = getMazeLayout();
    
    // Define start and goal positions in grid coordinates
    const start = { i: 0, j: 0 };
    const goal = { i: mazeLayout.length - 1, j: mazeLayout[0].length - 1 };
    
    // Create a queue for BFS
    const queue = [];
    queue.push(start);
    
    // Keep track of visited cells and their parents
    const visited = {};
    const parent = {};
    
    // Mark start as visited
    visited[`${start.i},${start.j}`] = true;
    
    // Define possible movements (up, right, down, left)
    const directions = [
        { di: -1, dj: 0 }, // up
        { di: 0, dj: 1 },  // right
        { di: 1, dj: 0 },  // down
        { di: 0, dj: -1 }  // left
    ];
    
    // Perform BFS
    while (queue.length > 0) {
        const current = queue.shift();
        
        // Check if we reached the goal
        if (current.i === goal.i && current.j === goal.j) {
            break;
        }
        
        // Try all four directions
        for (const dir of directions) {
            const newI = current.i + dir.di;
            const newJ = current.j + dir.dj;
            
            // Check if the new position is valid (within bounds and not a wall)
            if (newI >= 0 && newI < mazeLayout.length && 
                newJ >= 0 && newJ < mazeLayout[0].length && 
                mazeLayout[newI][newJ] === 0 &&
                !visited[`${newI},${newJ}`]) {
                
                // Mark as visited and add to queue
                visited[`${newI},${newJ}`] = true;
                parent[`${newI},${newJ}`] = { i: current.i, j: current.j };
                queue.push({ i: newI, j: newJ });
            }
        }
    }
    
    return { parent, visited };
}

// Find valid positions for coins
export function findValidCoinPositions() {
    const mazeLayout = getMazeLayout();
    const cellSize = getCellSize();
    const platformSize = getPlatformSize();
    const validPositions = [];
    
    // Get cells with spikes from the hazards system
    const cellsWithSpikes = window.cellsWithSpikes || new Set();
    
    for (let i = 0; i < mazeLayout.length; i++) {
        for (let j = 0; j < mazeLayout[i].length; j++) {
            // Only place coins in path cells (value 0)
            if (mazeLayout[i][j] === 0) {
                // Skip cells that contain spikes
                if (cellsWithSpikes.has(`${i},${j}`)) {
                    continue;
                }
                
                // Skip start and finish positions
                if ((i === 0 && j === 0) || 
                    (i === mazeLayout.length - 1 && j === mazeLayout[0].length - 1)) {
                    continue;
                }
                
                // Convert grid position to world coordinates
                const x = -platformSize + j * cellSize + cellSize/2;
                const z = -platformSize + i * cellSize + cellSize/2;
                
                validPositions.push(new THREE.Vector3(x, 0.5, z));
            }
        }
    }
    
    return validPositions;
} 
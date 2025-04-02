import * as THREE from 'three';
import { getPlatformSize, getCellSize, playerHeight, playerRadius, getCurrentLevel } from './config.js';
import { getMazeLayout } from './config.js';
import { getCollectionState } from './coins.js';

// Hazard variables
const spikes = [];
let spikesGroup = null;
let hazardsActive = true;
let playerHealth = 100;
let lastHitTime = 0;
const hitCooldown = 1000; // 1 second between hits
let healthBar = null;

// Store whether spikes are currently activated (for timed spikes)
let spikesActivated = true;
let lastSpikeToggleTime = 0;

// Track whether the player has seen the spike tutorial message
let hasShownSpikeTutorial = false;

// Initialize hazards system
export function createHazards(scene, theme) {
    // Reset health - make it level-dependent
    const level = getCurrentLevel();
    const baseHealth = 100;
    playerHealth = Math.max(50, baseHealth - (level * 5)); // Less health in higher levels
    hazardsActive = true;
    spikesActivated = true;
    lastSpikeToggleTime = 0;
    
    // Create group to hold hazards
    spikesGroup = new THREE.Group();
    scene.add(spikesGroup);
    
    // Create health bar UI
    createHealthBar();
    
    // Generate spike traps
    generateSpikeTraps(scene, theme);
    
    return { spikesGroup };
}

// Create health bar UI
function createHealthBar() {
    // Remove existing health bar if it exists
    if (document.getElementById('healthBar')) {
        document.getElementById('healthBar').remove();
    }
    
    // Create container
    const container = document.createElement('div');
    container.id = 'healthBarContainer';
    container.style.position = 'absolute';
    container.style.bottom = '20px';
    container.style.left = '20px';
    container.style.width = '200px';
    container.style.height = '20px';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    container.style.borderRadius = '10px';
    container.style.padding = '3px';
    container.style.zIndex = '1000';
    
    // Create health bar
    healthBar = document.createElement('div');
    healthBar.id = 'healthBar';
    healthBar.style.width = '100%';
    healthBar.style.height = '100%';
    healthBar.style.backgroundColor = '#00cc00';
    healthBar.style.borderRadius = '8px';
    healthBar.style.transition = 'width 0.3s ease-in-out';
    
    // Health text
    const healthText = document.createElement('div');
    healthText.id = 'healthText';
    healthText.style.position = 'absolute';
    healthText.style.top = '50%';
    healthText.style.left = '50%';
    healthText.style.transform = 'translate(-50%, -50%)';
    healthText.style.color = 'white';
    healthText.style.fontFamily = 'Arial, sans-serif';
    healthText.style.fontSize = '12px';
    healthText.style.fontWeight = 'bold';
    healthText.style.textShadow = '1px 1px 2px black';
    healthText.textContent = `Health: ${playerHealth}%`;
    
    container.appendChild(healthBar);
    container.appendChild(healthText);
    document.body.appendChild(container);
    
    // Update health bar immediately
    updateHealthBar();
}

// Update health bar UI
function updateHealthBar() {
    if (!healthBar) return;
    
    healthBar.style.width = `${playerHealth}%`;
    
    // Update color based on health
    if (playerHealth > 60) {
        healthBar.style.backgroundColor = '#00cc00'; // Green
    } else if (playerHealth > 30) {
        healthBar.style.backgroundColor = '#ffcc00'; // Yellow
    } else {
        healthBar.style.backgroundColor = '#cc0000'; // Red
    }
    
    // Update text
    const healthText = document.getElementById('healthText');
    if (healthText) {
        healthText.textContent = `Health: ${playerHealth}%`;
    }
}

// Function to check if cell is in a narrow corridor (only one path)
function isInNarrowCorridor(i, j, mazeLayout) {
    // Count walls around this cell (N, E, S, W)
    let wallCount = 0;
    
    // Check all four directions for walls
    if (i <= 0 || i >= mazeLayout.length - 1 || mazeLayout[i-1][j] === 1) wallCount++; // North
    if (j >= mazeLayout[0].length - 1 || mazeLayout[i][j+1] === 1) wallCount++; // East
    if (i >= mazeLayout.length - 1 || mazeLayout[i+1][j] === 1) wallCount++; // South
    if (j <= 0 || mazeLayout[i][j-1] === 1) wallCount++; // West
    
    // If there are 3 walls, this is a dead end
    if (wallCount >= 3) return true;
    
    // If there are only 2 walls opposite each other, this is a narrow corridor
    const hasNorthWall = (i <= 0 || mazeLayout[i-1][j] === 1);
    const hasSouthWall = (i >= mazeLayout.length - 1 || mazeLayout[i+1][j] === 1);
    const hasEastWall = (j >= mazeLayout[0].length - 1 || mazeLayout[i][j+1] === 1);
    const hasWestWall = (j <= 0 || mazeLayout[i][j-1] === 1);
    
    // Check if walls are on opposite sides (creating a corridor with only one path)
    const isNorthSouthCorridor = hasNorthWall && hasSouthWall && !hasEastWall && !hasWestWall;
    const isEastWestCorridor = hasEastWall && hasWestWall && !hasNorthWall && !hasSouthWall;
    
    return isNorthSouthCorridor || isEastWestCorridor;
}

// Generate spike traps in the maze
function generateSpikeTraps(scene, theme) {
    const mazeLayout = getMazeLayout();
    const cellSize = getCellSize();
    const platformSize = getPlatformSize();
    const currentLevel = getCurrentLevel();
    
    // Clear existing spikes
    spikes.length = 0;
    
    // Remove all children from spike group
    while (spikesGroup.children.length) {
        spikesGroup.remove(spikesGroup.children[0]);
    }
    
    // Define spike properties based on theme
    const spikeColor = theme && theme.wallColor ? theme.wallColor : 0x777777;
    const spikeMetalness = 0.8;
    const spikeRoughness = 0.2;
    
    // Material for spikes - create even if theme is undefined
    const spikeMaterial = new THREE.MeshStandardMaterial({
        color: spikeColor,
        metalness: spikeMetalness,
        roughness: spikeRoughness,
        emissive: new THREE.Color(0x330000),
        emissiveIntensity: 0.2
    });
    
    // Material for visual indicators
    const indicatorMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4500,  // Orange-red
        transparent: true,
        opacity: 0.5,
        emissive: new THREE.Color(0xff4500),
        emissiveIntensity: 0.8
    });
    
    // Find valid cells for spike placement (path cells)
    const validCells = [];
    
    for (let i = 0; i < mazeLayout.length; i++) {
        for (let j = 0; j < mazeLayout[i].length; j++) {
            // Valid cells are path cells (value 0)
            if (mazeLayout[i][j] === 0) {
                // Avoid start and finish positions
                if ((i === 0 && j === 0) || 
                    (i === 1 && j === 0) || // Avoid cell right after start
                    (i === 0 && j === 1) || // Avoid cell right after start
                    (i === mazeLayout.length - 1 && j === mazeLayout[0].length - 1) ||
                    (i === mazeLayout.length - 2 && j === mazeLayout[0].length - 1) || // Avoid cell before finish
                    (i === mazeLayout.length - 1 && j === mazeLayout[0].length - 2) ||
                    isInNarrowCorridor(i, j, mazeLayout)) { // Also avoid narrow corridors
                    continue;
                }
                
                validCells.push({ i, j });
            }
        }
    }
    
    // Shuffle valid cells to randomly select
    const shuffledCells = validCells.sort(() => Math.random() - 0.5);
    
    // Select a percentage of cells for spike placement - increase with level
    const baseSpikePercentage = 0.10;
    const spikePercentage = Math.min(0.25, baseSpikePercentage + (currentLevel * 0.015));
    const numSpikeCells = Math.ceil(shuffledCells.length * spikePercentage);
    
    // Track cells with spikes to avoid consecutive placements
    const cellsWithSpikes = new Set();
    
    // Function to check if a spike would create too many consecutive spikes
    function wouldCreateTooManyConsecutiveSpikes(row, col) {
        // Check horizontal (left side)
        let consecutiveLeft = 0;
        for (let j = 1; j <= 2; j++) {
            if (cellsWithSpikes.has(`${row},${col-j}`)) {
                consecutiveLeft++;
            } else {
                break;
            }
        }
        
        // Check horizontal (right side)
        let consecutiveRight = 0;
        for (let j = 1; j <= 2; j++) {
            if (cellsWithSpikes.has(`${row},${col+j}`)) {
                consecutiveRight++;
            } else {
                break;
            }
        }
        
        // Check vertical (up)
        let consecutiveUp = 0;
        for (let i = 1; i <= 2; i++) {
            if (cellsWithSpikes.has(`${row-i},${col}`)) {
                consecutiveUp++;
            } else {
                break;
            }
        }
        
        // Check vertical (down)
        let consecutiveDown = 0;
        for (let i = 1; i <= 2; i++) {
            if (cellsWithSpikes.has(`${row+i},${col}`)) {
                consecutiveDown++;
            } else {
                break;
            }
        }
        
        // Horizontal issue: Check if placing this spike would create more than 2 consecutive spikes
        // in any horizontal sequence
        const horizontalProblem = 
            // Case 1: Already 2 consecutive spikes to the left
            consecutiveLeft >= 2 || 
            // Case 2: Already 2 consecutive spikes to the right
            consecutiveRight >= 2 || 
            // Case 3: 1 spike left + this + 1 spike right would make 3 consecutive
            (consecutiveLeft >= 1 && consecutiveRight >= 1) ||
            // Case 4: 1 spike left + this would connect to another sequence
            (consecutiveLeft >= 1 && cellsWithSpikes.has(`${row},${col+1}`)) ||
            // Case 5: this + 1 spike right would connect to another sequence
            (consecutiveRight >= 1 && cellsWithSpikes.has(`${row},${col-1}`));
            
        // Vertical issue: Check if placing this spike would create more than 2 consecutive spikes
        // in any vertical sequence
        const verticalProblem = 
            // Case 1: Already 2 consecutive spikes above
            consecutiveUp >= 2 || 
            // Case 2: Already 2 consecutive spikes below
            consecutiveDown >= 2 || 
            // Case 3: 1 spike above + this + 1 spike below would make 3 consecutive
            (consecutiveUp >= 1 && consecutiveDown >= 1) ||
            // Case 4: 1 spike above + this would connect to another sequence
            (consecutiveUp >= 1 && cellsWithSpikes.has(`${row+1},${col}`)) ||
            // Case 5: this + 1 spike below would connect to another sequence
            (consecutiveDown >= 1 && cellsWithSpikes.has(`${row-1},${col}`));
            
        // Diagonal checks (prevent spike clusters that would be impossible to navigate)
        const diagonalProblem = 
            // Check diagonals for possible L-shapes or blocks of spikes
            (cellsWithSpikes.has(`${row-1},${col-1}`) && cellsWithSpikes.has(`${row-1},${col}`) && cellsWithSpikes.has(`${row},${col-1}`)) ||
            (cellsWithSpikes.has(`${row-1},${col+1}`) && cellsWithSpikes.has(`${row-1},${col}`) && cellsWithSpikes.has(`${row},${col+1}`)) ||
            (cellsWithSpikes.has(`${row+1},${col-1}`) && cellsWithSpikes.has(`${row+1},${col}`) && cellsWithSpikes.has(`${row},${col-1}`)) ||
            (cellsWithSpikes.has(`${row+1},${col+1}`) && cellsWithSpikes.has(`${row+1},${col}`) && cellsWithSpikes.has(`${row},${col+1}`));
        
        return horizontalProblem || verticalProblem || diagonalProblem;
    }
    
    // Count the spikes actually placed
    let spikesPlaced = 0;
    const maxSpikesToPlace = numSpikeCells;
    
    // Try to place spikes, limiting to max attempts to avoid infinite loop
    const maxAttempts = shuffledCells.length * 2;
    let attempts = 0;
    
    while (spikesPlaced < maxSpikesToPlace && attempts < maxAttempts) {
        attempts++;
        
        // Get next candidate cell (cycling if needed)
        const cellIndex = attempts % shuffledCells.length;
        const cell = shuffledCells[cellIndex];
        
        // Skip if this cell already has a spike
        if (cellsWithSpikes.has(`${cell.i},${cell.j}`)) {
            continue;
        }
        
        // Skip if this would create too many consecutive spikes
        if (wouldCreateTooManyConsecutiveSpikes(cell.i, cell.j)) {
            continue;
        }
        
        // This cell is good for a spike trap - mark it
        cellsWithSpikes.add(`${cell.i},${cell.j}`);
        spikesPlaced++;
        
        // Calculate position in world space
        const x = -platformSize + (cell.j * cellSize) + (cellSize / 2);
        const z = -platformSize + (cell.i * cellSize) + (cellSize / 2);
        
        // Create full cell of spikes
        const spikeHeight = 0.15 + (Math.random() * 0.05);
        const spikeSet = createFullCellSpikes(spikeMaterial, cellSize, currentLevel);
        
        // Position spikes
        spikeSet.position.set(x, 0.01, z);
        
        // Add spike set to group
        spikesGroup.add(spikeSet);
        
        // Store spike info for collision detection
        spikes.push({
            position: new THREE.Vector3(x, 0, z),
            radius: cellSize / 2 * 0.8, // Slightly smaller than cell
            damage: 10 + (currentLevel * 2),  // Damage increases with level
            mesh: spikeSet,
            activated: true, // Start with activated spikes
            type: 'spikes',
            cell: { i: cell.i, j: cell.j }
        });
    }
    
    console.log(`Placed ${spikesPlaced} spike traps out of ${numSpikeCells} desired`);
    
    // Add the spikes group to the scene
    scene.add(spikesGroup);
    
    // Function to find connected groups of spikes
    function findConnectedSpikes() {
        // Group spikes that are adjacent to each other
        const connectedGroups = [];
        const visited = new Set();
        
        // For each cell with spikes
        for (const cellKey of cellsWithSpikes) {
            // Skip if already processed
            if (visited.has(cellKey)) continue;
            
            // Parse coordinates
            const [i, j] = cellKey.split(',').map(Number);
            
            // Start a new group
            const group = [{ i, j }];
            visited.add(cellKey);
            
            // Add connected cells using a queue
            const queue = [{i, j}];
            
            while (queue.length > 0) {
                const {i: ci, j: cj} = queue.shift();
                
                // Check adjacent cells (horizontal and vertical)
                const neighbors = [
                    {i: ci-1, j: cj}, // up
                    {i: ci+1, j: cj}, // down
                    {i: ci, j: cj-1}, // left
                    {i: ci, j: cj+1}  // right
                ];
                
                for (const {i: ni, j: nj} of neighbors) {
                    const neighborKey = `${ni},${nj}`;
                    
                    // If this is a spike and not visited yet
                    if (cellsWithSpikes.has(neighborKey) && !visited.has(neighborKey)) {
                        // Add to group
                        group.push({i: ni, j: nj});
                        visited.add(neighborKey);
                        queue.push({i: ni, j: nj});
                    }
                }
            }
            
            // Only add groups with more than 1 spike
            if (group.length > 1) {
                connectedGroups.push(group);
            }
        }
        
        return connectedGroups;
    }
    
    // Create visual indicators for connected spike groups
    const connectedGroups = findConnectedSpikes();
    
    for (const group of connectedGroups) {
        // Create a merged indicator for the group
        if (group.length > 1) {
            // Highlight cells with connected spikes
            for (const {i, j} of group) {
                // Calculate position in world space
                const x = -platformSize + j * cellSize + cellSize/2;
                const z = -platformSize + i * cellSize + cellSize/2;
                
                // Create a visual indicator above the spikes
                const indicatorGeometry = new THREE.BoxGeometry(cellSize * 0.9, 0.05, cellSize * 0.9);
                const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
                
                // Position indicator above spikes
                indicator.position.set(x, 0.4, z);
                
                // Add to scene
                spikesGroup.add(indicator);
            }
            
            // Also add a text hint
            // Convert to world coordinates for the first cell in the group
            const firstCell = group[0];
            const x = -platformSize + firstCell.j * cellSize + cellSize/2;
            const z = -platformSize + firstCell.i * cellSize + cellSize/2;
            
            // Create helpful text sprite
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 512; // Larger canvas for better quality
            canvas.height = 256;
            
            // Create gradient background
            const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 50, 0, 0.8)');
            
            // Clear the canvas with gradient
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add border
            context.strokeStyle = 'yellow';
            context.lineWidth = 5;
            context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            // Add text
            context.font = 'bold 80px Arial';
            context.fillStyle = 'yellow';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.shadowColor = 'black';
            context.shadowBlur = 10;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.fillText('JUMP!', canvas.width/2, canvas.height/2);
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            
            // Position above the spikes
            sprite.position.set(x, 2.0, z);
            sprite.scale.set(2.0, 1.0, 1.0);
            
            // Add animation data to make it float up and down
            sprite.userData = {
                baseY: 2.0,
                animationPhase: Math.random() * Math.PI * 2
            };
            
            // Store reference for animation
            group[0].userData.jumpSprite = sprite;
            
            // Add to scene
            spikesGroup.add(sprite);
        }
    }
    
    return spikes;
}

// Create spikes that fill the entire cell
function createFullCellSpikes(material, cellSize, level) {
    // Create the main group to hold everything
    const group = new THREE.Group();
    
    // IMPORTANT: Initialize userData object to prevent the Object.keys null error
    group.userData = {
        // Pre-populate with empty objects to prevent null reference errors
        originalColor: null,
        spikeMaterial: null,
        baseMaterial: null
    };
    
    // Safety check for material
    if (!material) {
        material = new THREE.MeshStandardMaterial({
            color: 0x777777,
            metalness: 0.8,
            roughness: 0.2
        });
    }
    
    // Spike size - multiple small spikes to fill the cell
    const spikeHeight = level < 4 ? 0.3 : 0.3 + (level * 0.03);
    const spikeBaseRadius = 0.05;
    const coverage = 0.8; // How much of the cell to cover with spikes
    
    // Create a visual indicator that these are dangerous
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    
    const glowRing = new THREE.Mesh(
        new THREE.RingGeometry(cellSize * 0.3, cellSize * 0.4, 16),
        glowMaterial
    );
    glowRing.rotation.x = -Math.PI / 2; // Lay flat
    glowRing.position.y = 0.01;
    group.add(glowRing);
    
    // Store reference to modify later
    group.userData.glowRing = glowRing;
    
    // Create a grid of spikes
    const gridSize = 5; // 5x5 grid of spikes
    const spacing = (cellSize * coverage) / gridSize;
    
    // Make main spike material - create a new one to avoid modifying the original
    const spikeMaterial = new THREE.MeshStandardMaterial({
        color: material.color ? material.color : 0x777777,
        metalness: material.metalness !== undefined ? material.metalness : 0.8,
        roughness: material.roughness !== undefined ? material.roughness : 0.2,
        emissive: new THREE.Color(0x330000),
        emissiveIntensity: 0.2
    });
    
    // Store the material for animations
    group.userData.spikeMaterial = spikeMaterial;
    
    // Store initial color for animation (safely create a new color)
    if (spikeMaterial && spikeMaterial.color) {
        group.userData.originalColor = new THREE.Color(spikeMaterial.color.getHex());
    } else {
        group.userData.originalColor = new THREE.Color(0x777777);
    }
    
    // Group to hold all spike pieces
    const spikePieces = new THREE.Group();
    group.add(spikePieces);
    
    // Store reference
    group.userData.spikePieces = spikePieces;
    
    // Create the spikes in a grid pattern
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            // Calculate position within cell
            const xPos = (i - (gridSize-1)/2) * spacing;
            const zPos = (j - (gridSize-1)/2) * spacing;
            
            // Create spike geometry
            const spikeGeometry = new THREE.ConeGeometry(spikeBaseRadius, spikeHeight, 4);
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            
            // Position within the group
            spike.position.set(xPos, spikeHeight/2, zPos);
            
            // Rotate to point upward
            spike.rotation.x = Math.PI;
            
            // Add some random rotation for variety
            spike.rotation.z = Math.random() * 0.3;
            
            // Add to group
            spikePieces.add(spike);
        }
    }
    
    // Create base plate covering the entire cell
    const baseSize = cellSize * 0.9;
    
    // Create the base geometry for the plate
    const baseGeometry = new THREE.BoxGeometry(baseSize, 0.05, baseSize);
    
    // Create base material with safety checks
    let baseMaterial;
    if (level >= 6) {
        // Higher levels get a more menacing base
        const baseColor = material && material.color ? 
            new THREE.Color(material.color).offsetHSL(0, 0, -0.1) : 
            new THREE.Color(0x666666);
            
        baseMaterial = new THREE.MeshStandardMaterial({
            color: baseColor,
            metalness: material && material.metalness !== undefined ? material.metalness + 0.1 : 0.9,
            roughness: material && material.roughness !== undefined ? material.roughness - 0.1 : 0.1,
            emissive: new THREE.Color(0x330000),
            emissiveIntensity: 0.3
        });
    } else {
        // Basic material for lower levels
        baseMaterial = new THREE.MeshStandardMaterial({
            color: material && material.color ? material.color : 0x777777,
            metalness: material && material.metalness !== undefined ? material.metalness : 0.8,
            roughness: material && material.roughness !== undefined ? material.roughness : 0.2
        });
    }
    
    // Create and position the base
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.01;
    group.add(base);
    
    // Store reference to base material
    group.userData.baseMaterial = baseMaterial;
    
    return group;
}

// Update spike animations and states
export function updateSpikes(deltaTime) {
    // Safety check
    if (!hazardsActive || !spikes || spikes.length === 0) return;
    
    const currentTime = Date.now();
    
    // Toggle timed spikes every 2 seconds (gets faster with higher levels)
    const level = getCurrentLevel();
    const toggleInterval = Math.max(800, 2500 - (level * 200));
    
    if (currentTime - lastSpikeToggleTime > toggleInterval) {
        spikesActivated = !spikesActivated;
        lastSpikeToggleTime = currentTime;
        
        // Play sound effect for spike state change
        if (typeof playSoundEffect === 'function') {
            playSoundEffect('spikeToggle');
        }
    }
    
    // Animate all jump sprites
    animateJumpSprites(currentTime);
    
    // Update individual spike animations
    for (let i = 0; i < spikes.length; i++) {
        const spike = spikes[i];
        
        // Skip if not activated or mesh doesn't exist
        if (!spike || !spike.activated || !spike.mesh) continue;
        
        // Safety check - make sure the mesh is valid
        const mesh = spike.mesh;
        if (!mesh) continue;
        
        // Safety check - ensure visibility and userData
        if (!mesh.visible) {
            mesh.visible = true;
        }
        
        // Initialize userData if it doesn't exist
        if (!mesh.userData) {
            mesh.userData = {};
        }
        
        // Get references to userData properties with fallbacks
        const spikePieces = mesh.userData.spikePieces || mesh;
        const glowRing = mesh.userData.glowRing;
        const spikeMaterial = mesh.userData.spikeMaterial;
        const originalColor = mesh.userData.originalColor || 
                             (spikeMaterial && spikeMaterial.color ? 
                                new THREE.Color(spikeMaterial.color.getHex()) : 
                                new THREE.Color(0x777777));
        
        // Handle timed spikes
        if (spike.isTimed) {
            // Check if this specific spike should be on or off
            // Use the timing offset to create variety in activation patterns
            const adjustedTime = (currentTime + (spike.timingOffset || 0)) % (toggleInterval * 2);
            const thisSpikeActivated = adjustedTime < toggleInterval;
            
            try {
                // Update visibility with animation
                if (thisSpikeActivated) {
                    // If becoming visible, animate moving up
                    if (!mesh.visible) {
                        mesh.visible = true;
                        
                        // Animate spike coming up with a quick transition
                        if (spikePieces && spikePieces.position) {
                            spikePieces.position.y = -0.3; // Start below ground
                        }
                        
                        // Use a tween-like approach
                        spike.animatingUp = true;
                        spike.animationStartTime = currentTime;
                        spike.animationDuration = 150; // 150ms animation
                        
                        // Animate glow and color
                        if (glowRing && glowRing.material) {
                            glowRing.material.opacity = 0;
                            if (glowRing.scale) {
                                glowRing.scale.set(0.5, 0.5, 0.5);
                            }
                        }
                        
                        // Make spikes red/dangerous
                        if (spikeMaterial && spikeMaterial.emissive) {
                            spikeMaterial.emissive.setRGB(0.3, 0, 0);
                        }
                    }
                    
                    // Continue animation if needed
                    if (spike.animatingUp && spikePieces && spikePieces.position) {
                        const elapsed = currentTime - spike.animationStartTime;
                        const progress = Math.min(1.0, elapsed / spike.animationDuration);
                        
                        // Ease-out function for smooth animation
                        const easeOut = 1 - Math.pow(1 - progress, 2);
                        spikePieces.position.y = -0.3 + (easeOut * 0.31);
                        
                        // Animate glow and color
                        if (glowRing && glowRing.material && glowRing.scale) {
                            glowRing.material.opacity = easeOut * 0.4;
                            glowRing.scale.set(0.5 + easeOut * 0.5, 0.5 + easeOut * 0.5, 1);
                            
                            // Pulse the glow
                            glowRing.material.opacity *= (0.7 + Math.sin(currentTime * 0.01) * 0.3);
                        }
                        
                        // Gradually increase emissive
                        if (spikeMaterial) {
                            if (spikeMaterial.emissiveIntensity !== undefined) {
                                spikeMaterial.emissiveIntensity = 0.1 + easeOut * 0.3;
                            }
                            
                            // Add color pulsing for visibility
                            if (spikeMaterial.color && originalColor) {
                                const pulseAmt = Math.sin(currentTime * 0.01) * 0.1 + 0.1;
                                spikeMaterial.color.copy(originalColor);
                                spikeMaterial.color.offsetHSL(0, 0, pulseAmt);
                            }
                        }
                        
                        if (progress >= 1.0) {
                            spike.animatingUp = false;
                        }
                    }
                } else {
                    // If becoming invisible, animate moving down
                    if (mesh.visible && !spike.animatingDown && spikePieces && spikePieces.position) {
                        // Animate spike going down with a quick transition
                        spikePieces.position.y = 0.01; // Start at normal position
                        spike.animatingDown = true;
                        spike.animationStartTime = currentTime;
                        spike.animationDuration = 150; // 150ms animation
                    }
                    
                    // Continue animation if needed
                    if (spike.animatingDown && spikePieces && spikePieces.position) {
                        const elapsed = currentTime - spike.animationStartTime;
                        const progress = Math.min(1.0, elapsed / spike.animationDuration);
                        
                        // Ease-in function for smooth animation
                        const easeIn = Math.pow(progress, 2);
                        spikePieces.position.y = 0.01 - (easeIn * 0.31);
                        
                        // Animate glow and color
                        if (glowRing && glowRing.material && glowRing.scale) {
                            glowRing.material.opacity = 0.4 * (1 - easeIn);
                            glowRing.scale.set(1 - easeIn * 0.5, 1 - easeIn * 0.5, 1);
                        }
                        
                        // Fade out emissive
                        if (spikeMaterial && spikeMaterial.emissiveIntensity !== undefined) {
                            spikeMaterial.emissiveIntensity = 0.4 * (1 - easeIn);
                        }
                        
                        if (progress >= 1.0) {
                            spike.animatingDown = false;
                            mesh.visible = false;
                        }
                    }
                }
            } catch (e) {
                // Ignore animation errors - just make spike visible if it should be
                if (thisSpikeActivated) {
                    mesh.visible = true;
                    if (spikePieces && spikePieces.position) {
                        spikePieces.position.y = 0.01;
                    }
                } else {
                    mesh.visible = false;
                }
            }
        }
        
        // Handle moving spikes
        if (spike.isMoving) {
            try {
                // Calculate new Y position with sin wave - larger amplitude
                const baseY = spike.originalY || 0.01;
                const amplitude = 0.4; // Increase amplitude for more visible movement
                const newY = baseY + Math.sin((spike.phase || 0) + currentTime * 0.002 * (spike.speed || 1)) * amplitude;
                
                // Apply position change to spike pieces, not the whole group
                if (spikePieces && spikePieces.position) {
                    spikePieces.position.y = newY;
                } else if (mesh.position) {
                    mesh.position.y = newY;
                }
                
                // Add color pulsing for visibility
                if (spikeMaterial && spikeMaterial.emissiveIntensity !== undefined) {
                    const pulseAmt = (Math.sin(currentTime * 0.004) * 0.15) + 0.15;
                    spikeMaterial.emissiveIntensity = 0.2 + pulseAmt;
                    
                    // Make color pulse too - safely handle color operations
                    if (originalColor && spikeMaterial.color) {
                        spikeMaterial.color.copy(originalColor);
                        spikeMaterial.color.offsetHSL(0, 0, pulseAmt * 0.2);
                    }
                }
                
                // Animate glow ring
                if (glowRing && glowRing.material && glowRing.scale) {
                    glowRing.material.opacity = 0.2 + Math.sin((spike.phase || 0) + currentTime * 0.003) * 0.1;
                    const pulseScale = 0.9 + Math.sin((spike.phase || 0) + currentTime * 0.005) * 0.1;
                    glowRing.scale.set(pulseScale, pulseScale, 1);
                }
                
                // Update phase for next frame
                spike.phase = (spike.phase || 0) + deltaTime * (spike.speed || 1);
            } catch (e) {
                // Ignore movement errors
                console.log("Error animating moving spike:", e);
            }
        }
    }
}

// Animate the JUMP! sprites to make them more noticeable
function animateJumpSprites(currentTime) {
    if (!spikesGroup) return;
    
    // Find all sprites in the spikes group
    spikesGroup.traverse((object) => {
        // Check if this is a sprite with jump animation data
        if (object instanceof THREE.Sprite && 
            object.userData && 
            object.userData.baseY !== undefined) {
            
            // Calculate bobbing motion (up and down)
            const frequency = 1.5; // Speed of animation
            const amplitude = 0.3; // Height of bobbing
            const phase = object.userData.animationPhase || 0;
            
            // Calculate new Y position with sine wave
            const newY = object.userData.baseY + Math.sin((currentTime * 0.001 * frequency) + phase) * amplitude;
            
            // Apply new position
            object.position.y = newY;
            
            // Also pulse the scale a bit for attention
            const scalePulse = 1.0 + Math.sin((currentTime * 0.002 * frequency) + phase) * 0.1;
            object.scale.set(2.0 * scalePulse, 1.0 * scalePulse, 1.0);
        }
    });
}

// Check for spike collisions
export function checkSpikeCollisions(playerPosition) {
    // Only proceed if hazards are active
    if (!hazardsActive) return false;
    
    // Find the nearest spike to player for tutorial purposes
    let nearestSpike = null;
    let nearestDistance = Infinity;
    
    for (const spike of spikes) {
        const distance = new THREE.Vector2(
            playerPosition.x - spike.position.x,
            playerPosition.z - spike.position.z
        ).length();
        
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestSpike = spike;
        }
    }
    
 
    
    // If player was recently hit, don't check for collisions again
    if (Date.now() - lastHitTime < hitCooldown) {
        return false;
    }
    
    // Get the cell size and platform size for grid calculations
    const cellSize = getCellSize();
    const platformSize = getPlatformSize();
    
    // Calculate the player's grid coordinates
    const playerGridX = Math.floor((playerPosition.x + platformSize) / cellSize);
    const playerGridZ = Math.floor((playerPosition.z + platformSize) / cellSize);
    
    // Check collision only if player is on the ground (y near 0)
    if (playerPosition.y < 0.1) {
        // Check each spike for collision
        for (let i = 0; i < spikes.length; i++) {
            const spike = spikes[i];
            
            // Skip inactive spikes
            if (!spike.activated) continue;
            
            // Get spike grid coordinates
            const spikeGridZ = spike.cell.i;
            const spikeGridX = spike.cell.j;
            
            // Check if player is in the same cell as this spike
            if (playerGridZ === spikeGridZ && playerGridX === spikeGridX) {
                // Damage player
                damagePlayer(spike.damage);
                lastHitTime = Date.now();
                
                // Play sound effect
                playSoundEffect('spike');
                
                // Flash screen
                flashScreen();
                
                return true;
            }
        }
    }
    
    return false;
}

// Damage player function
export function damagePlayer(amount) {
    // Avoid damage if on cooldown
    if (Date.now() - lastHitTime < hitCooldown) return;
    
    // Set cooldown
    lastHitTime = Date.now();
    
    // Apply damage
    playerHealth = Math.max(0, playerHealth - amount);
    updateHealthBar();
    
    // Visual and audio feedback
    playSoundEffect('hit');
    flashScreen();
    
    // Check if player died
    if (playerHealth <= 0) {
        playerDied();
    }
}

// Play sound effect
function playSoundEffect(effect) {
    if (window.playSound) {
        window.playSound(effect);
    }
}

// Flash screen red when taking damage
function flashScreen() {
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '999';
    flash.style.transition = 'opacity 0.5s ease-out';
    
    document.body.appendChild(flash);
    
    // Fade out and remove
    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 500);
    }, 100);
}

// Handle player death
function playerDied() {
    hazardsActive = false;
    
    // Show death message
    const deathMessage = document.createElement('div');
    deathMessage.id = 'deathMessage';
    deathMessage.style.position = 'absolute';
    deathMessage.style.top = '50%';
    deathMessage.style.left = '50%';
    deathMessage.style.transform = 'translate(-50%, -50%)';
    deathMessage.style.color = 'red';
    deathMessage.style.fontFamily = 'Arial, sans-serif';
    deathMessage.style.fontSize = '48px';
    deathMessage.style.fontWeight = 'bold';
    deathMessage.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    deathMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    deathMessage.style.padding = '20px';
    deathMessage.style.borderRadius = '10px';
    deathMessage.style.zIndex = '1000';
    deathMessage.innerHTML = 'You died!<br>Restarting level...';
    document.body.appendChild(deathMessage);
    
    // Restart level after delay
    setTimeout(() => {
        if (window.restartLevel) {
            window.restartLevel();
        } else {
            location.reload();
        }
    }, 3000);
}

// Check if all coins collected (to possibly disable hazards)
export function updateHazardStatus() {
    const { coinsCollected, numCoins } = getCollectionState();
    
    if (coinsCollected >= numCoins) {
        // If all coins collected, disable hazards
        hazardsActive = false;
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.id = 'safetyMessage';
        successMessage.style.position = 'absolute';
        successMessage.style.top = '30%';
        successMessage.style.left = '50%';
        successMessage.style.transform = 'translate(-50%, -50%)';
        successMessage.style.color = 'green';
        successMessage.style.fontFamily = 'Arial, sans-serif';
        successMessage.style.fontSize = '24px';
        successMessage.style.fontWeight = 'bold';
        successMessage.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        successMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        successMessage.style.padding = '15px';
        successMessage.style.borderRadius = '10px';
        successMessage.style.zIndex = '999';
        successMessage.style.opacity = '1';
        successMessage.style.transition = 'opacity 0.5s ease-out';
        successMessage.innerHTML = 'All coins collected!<br>The maze is now safe.';
        document.body.appendChild(successMessage);
        
        // Fade out and remove message after delay
        setTimeout(() => {
            successMessage.style.opacity = '0';
            setTimeout(() => {
                if (successMessage.parentNode) {
                    successMessage.parentNode.removeChild(successMessage);
                }
            }, 500);
        }, 3000);
    }
    
    return hazardsActive;
}

// Clean up resources when level changes
export function cleanupHazards() {
    // Clear arrays
    spikes.length = 0;
    
    // Remove health bar
    if (document.getElementById('healthBarContainer')) {
        document.getElementById('healthBarContainer').remove();
    }
    
    // Remove any death message
    if (document.getElementById('deathMessage')) {
        document.getElementById('deathMessage').remove();
    }
    
    // Remove any safety message
    if (document.getElementById('safetyMessage')) {
        document.getElementById('safetyMessage').remove();
    }
}

// Dummy function to maintain compatibility with the game loop
export function updateFallingObjects() {
    // This function is intentionally empty, as falling objects are removed
    return;
} 
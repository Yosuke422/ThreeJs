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
                    (i === mazeLayout.length - 1 && j === mazeLayout[0].length - 2)) { // Avoid cell before finish
                    continue;
                }
                
                validCells.push({ i, j });
            }
        }
    }
    
    // Shuffle valid cells to randomly select
    const shuffledCells = validCells.sort(() => Math.random() - 0.5);
    
    // Select a percentage of cells for spike placement - increase with level
    const baseSpikePercentage = 0.15;
    const spikePercentage = Math.min(0.35, baseSpikePercentage + (currentLevel * 0.02));
    const numSpikeCells = Math.ceil(shuffledCells.length * spikePercentage);
    
    // Track cells with spikes to avoid consecutive row placements
    const cellsWithSpikes = new Set();
    
    for (let idx = 0; idx < numSpikeCells; idx++) {
        const cell = shuffledCells[idx];
        
        // Check if placing a spike here would create 3 or more consecutive spikes
        // by checking all 4 directions (horizontal and vertical)
        const hasConsecutiveHorizontal = 
            (cellsWithSpikes.has(`${cell.i},${cell.j-1}`) && cellsWithSpikes.has(`${cell.i},${cell.j-2}`)) || 
            (cellsWithSpikes.has(`${cell.i},${cell.j+1}`) && cellsWithSpikes.has(`${cell.i},${cell.j+2}`)) ||
            (cellsWithSpikes.has(`${cell.i},${cell.j-1}`) && cellsWithSpikes.has(`${cell.i},${cell.j+1}`));
            
        const hasConsecutiveVertical = 
            (cellsWithSpikes.has(`${cell.i-1},${cell.j}`) && cellsWithSpikes.has(`${cell.i-2},${cell.j}`)) || 
            (cellsWithSpikes.has(`${cell.i+1},${cell.j}`) && cellsWithSpikes.has(`${cell.i+2},${cell.j}`)) ||
            (cellsWithSpikes.has(`${cell.i-1},${cell.j}`) && cellsWithSpikes.has(`${cell.i+1},${cell.j}`));
            
        // STRICT ENFORCEMENT: If this would create 3 consecutive spikes, always skip
        if (hasConsecutiveHorizontal || hasConsecutiveVertical) {
            continue;
        }
        
        // Also check adjacent cells - 50% chance to skip if adjacent to avoid double spikes
        const hasAdjacentSpikes = 
            cellsWithSpikes.has(`${cell.i},${cell.j-1}`) || 
            cellsWithSpikes.has(`${cell.i},${cell.j+1}`) ||
            cellsWithSpikes.has(`${cell.i-1},${cell.j}`) ||
            cellsWithSpikes.has(`${cell.i+1},${cell.j}`);
        
        // Always 50% chance to place adjacent spikes, regardless of level
        if (hasAdjacentSpikes && Math.random() < 0.5) {
            continue;
        }
        
        // Convert grid position to world coordinates
        const x = -platformSize + cell.j * cellSize + cellSize/2;
        const z = -platformSize + cell.i * cellSize + cellSize/2;
        
        // Create spike trap that fills the entire cell
        const spikeGroup = createFullCellSpikes(spikeMaterial, cellSize, currentLevel);
        
        // Position spike trap
        spikeGroup.position.set(x, 0.01, z); // Slightly above floor to avoid z-fighting
        
        // Add to spikes group
        spikesGroup.add(spikeGroup);
        
        // Set collision radius to match nearly the full cell size 
        const collisionRadius = cellSize * 0.45;
        
        // Determine spike properties based on level
        let spikeDamage = 10; // Base damage
        let spikeSpeed = 0; // Speed for moving spikes
        let spikeIsTimed = false; // Whether spike is timed (on/off)
        let spikeTimingOffset = 0; // Offset for timed spikes
        
        // Add level-based enhancements
        if (currentLevel >= 3) {
            // Increase damage with level
            spikeDamage += Math.min(15, Math.floor(currentLevel * 2));
        }
        
        // Add timed spikes after level 5 - increase chance with level
        if (currentLevel >= 3) {
            // 40% chance for timed spikes at level 5, increasing with level
            const timedChance = Math.min(0.7, 0.2 + (currentLevel * 0.05));
            if (Math.random() < timedChance) {
                spikeIsTimed = true;
                spikeTimingOffset = Math.random() * 3000; // Random offset for variety
            }
        }
        
        // Add moving spikes after level 7 - increase chance with level
        if (currentLevel >= 4) {
            // 20% chance for moving spikes at level 7, increasing with level
            const movingChance = Math.min(0.6, (currentLevel - 3) * 0.1);
            if (Math.random() < movingChance) {
                // Moving spikes - oscillate up and down
                spikeSpeed = 0.8 + (Math.random() * 0.7); // Faster random speed
            }
        }
        
        // Store spike data for collision detection
        spikes.push({
            position: new THREE.Vector3(x, 0, z),
            radius: collisionRadius,
            damage: spikeDamage,
            active: true,
            cell: { i: cell.i, j: cell.j }, // Store cell coordinates
            
            // Advanced features
            isTimed: spikeIsTimed,
            timingOffset: spikeTimingOffset,
            isMoving: spikeSpeed > 0,
            speed: spikeSpeed,
            phase: Math.random() * Math.PI * 2, // Random starting phase
            originalY: 0.01,
            
            // Reference to the mesh
            mesh: spikeGroup,
            
            // Defaults for animation state
            animatingUp: false,
            animatingDown: false,
            animationStartTime: 0,
            animationDuration: 150
        });
        
        // Mark this cell as having spikes
        cellsWithSpikes.add(`${cell.i},${cell.j}`);
    }
    
    // Store cells with spikes globally for coin placement
    window.cellsWithSpikes = cellsWithSpikes;
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
    
    // Update individual spike animations
    for (let i = 0; i < spikes.length; i++) {
        const spike = spikes[i];
        
        // Skip if not active or mesh doesn't exist
        if (!spike || !spike.active || !spike.mesh) continue;
        
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

// Check for spike collisions
export function checkSpikeCollisions(playerPosition) {
    if (!hazardsActive || Date.now() - lastHitTime < hitCooldown) return false;
    
    // Get the cell size and platform size
    const cellSize = getCellSize();
    const platformSize = getPlatformSize();
    
    // Calculate the player's grid coordinates
    const playerGridX = Math.floor((playerPosition.x + platformSize) / cellSize);
    const playerGridZ = Math.floor((playerPosition.z + platformSize) / cellSize);
    
    // Direct collision check with each spike
    let hitSpike = false;
    
    // If player is on ground (y=0), check for spikes at their grid position
    if (playerPosition.y < 0.1) {
        for (let i = 0; i < spikes.length; i++) {
            const spike = spikes[i];
            if (!spike.active) continue;
            
            // For timed spikes, only check collision if currently activated
            if (spike.isTimed) {
                // Check if this specific spike is currently visible
                if (!spike.mesh || !spike.mesh.visible) {
                    continue;
                }
            }
            
            // Get spike grid coordinates
            const spikeGridZ = spike.cell.i;
            const spikeGridX = spike.cell.j;
            
            // Check if player is in the same cell as this spike
            if (playerGridZ === spikeGridZ && playerGridX === spikeGridX) {
                hitSpike = true;
                damagePlayer(spike.damage);
                break;
            }
        }
    }
    
    return hitSpike;
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
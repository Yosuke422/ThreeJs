import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { getCellSize, getPlatformSize, getMazeLayout, playerHeight, playerRadius } from './config.js';

// Spear trap variables
let spearTraps = [];
let spearGroup = null;
let spearModel = null;
let isModelLoaded = false;
let spearCooldown = 3000; // 3 seconds between firing
let spearSpeed = 12.0; // Units per second
let spearDamage = 25; // Damage on hit
let spearRange = 30; // How far spears can travel
let activeSpears = [];

// Trigger distance for spear traps
const triggerDistance = 6.0;

// Load the spear trap model
function loadSpearTrapModel() {
    return new Promise((resolve, reject) => {
        const loader = new FBXLoader();
        loader.load('assets/SpearTrap.fbx', (fbx) => {
            // Scale the model appropriately
            fbx.scale.set(0.02, 0.02, 0.02);
            
            // Apply materials
            fbx.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Create a metallic material for the spear
                    const spearMaterial = new THREE.MeshStandardMaterial({
                        color: 0x8C8C8C,
                        metalness: 0.9,
                        roughness: 0.2,
                        envMapIntensity: 1.0
                    });
                    
                    child.material = spearMaterial;
                }
            });
            
            // Store the model for cloning later
            spearModel = fbx.clone();
            isModelLoaded = true;
            resolve(spearModel);
        }, undefined, (error) => {
            console.error('Error loading spear trap model:', error);
            reject(error);
        });
    });
}

// Create spear traps in the maze
export function createSpearTraps(scene, theme) {
    // Create a group to hold all spear traps
    spearGroup = new THREE.Group();
    scene.add(spearGroup);
    
    // Reset arrays
    spearTraps = [];
    activeSpears = [];
    
    // If model isn't loaded yet, start loading it
    if (!isModelLoaded) {
        loadSpearTrapModel()
            .then(() => {
                // Once loaded, place spear traps in the maze
                placeSpearTraps(scene, theme);
            })
            .catch(error => {
                console.error('Failed to load spear trap model:', error);
            });
    } else {
        // If model is already loaded, place spear traps immediately
        placeSpearTraps(scene, theme);
    }
    
    return spearGroup;
}

// Place spear traps in the maze
function placeSpearTraps(scene, theme) {
    const mazeLayout = getMazeLayout();
    const cellSize = getCellSize();
    const platformSize = getPlatformSize();
    
    // Find valid wall cells for placement
    const validWallCells = [];
    
    // Look for walls that have an adjacent path
    for (let i = 1; i < mazeLayout.length - 1; i++) {
        for (let j = 1; j < mazeLayout[i].length - 1; j++) {
            // If this is a wall...
            if (mazeLayout[i][j] === 1) {
                // Check if any adjacent cell is a path
                const hasAdjacentPath = 
                    mazeLayout[i-1][j] === 0 || 
                    mazeLayout[i+1][j] === 0 || 
                    mazeLayout[i][j-1] === 0 || 
                    mazeLayout[i][j+1] === 0;
                
                if (hasAdjacentPath) {
                    validWallCells.push({ i, j });
                }
            }
        }
    }
    
    // Shuffle and select a subset of walls for placing traps
    const shuffledWalls = validWallCells.sort(() => Math.random() - 0.5);
    
    // Number of traps scales with maze size, approximately 1 trap per 5x5 area
    const numTraps = Math.min(10, Math.max(2, Math.floor(mazeLayout.length * mazeLayout[0].length / 25)));
    
    for (let idx = 0; idx < Math.min(numTraps, shuffledWalls.length); idx++) {
        const wall = shuffledWalls[idx];
        
        // Check surrounding cells to determine trap orientation
        let direction = null;
        let orientationAngle = 0;
        
        // Try to find a path cell adjacent to this wall
        if (mazeLayout[wall.i-1][wall.j] === 0) { 
            direction = 'north';
            orientationAngle = Math.PI;
        } else if (mazeLayout[wall.i+1][wall.j] === 0) {
            direction = 'south';
            orientationAngle = 0;
        } else if (mazeLayout[wall.i][wall.j-1] === 0) {
            direction = 'west'; 
            orientationAngle = Math.PI / 2;
        } else if (mazeLayout[wall.i][wall.j+1] === 0) {
            direction = 'east';
            orientationAngle = -Math.PI / 2;
        }
        
        if (!direction) continue; // Skip if no adjacent path found
        
        // Convert grid position to world coordinates
        const x = -platformSize + wall.j * cellSize + cellSize/2;
        const z = -platformSize + wall.i * cellSize + cellSize/2;
        
        // Create a trap instance if model is loaded
        if (isModelLoaded && spearModel) {
            const trap = spearModel.clone();
            
            // Position the trap on the wall
            trap.position.set(x, 1.5, z);
            
            // Orient the trap to point toward the path
            trap.rotation.y = orientationAngle;
            
            // Add to the group
            spearGroup.add(trap);
            
            // Store trap data
            spearTraps.push({
                position: new THREE.Vector3(x, 1.5, z),
                direction: direction,
                rotation: orientationAngle,
                lastFired: 0,
                mesh: trap,
                cell: { i: wall.i, j: wall.j }
            });
        }
    }
    
    // If the model wasn't loaded, try again with a plain box representation
    if (!isModelLoaded) {
        createFallbackTraps(scene, shuffledWalls, numTraps, cellSize, platformSize);
    }
}

// Create fallback traps if model loading fails
function createFallbackTraps(scene, shuffledWalls, numTraps, cellSize, platformSize) {
    const mazeLayout = getMazeLayout();
    
    for (let idx = 0; idx < Math.min(numTraps, shuffledWalls.length); idx++) {
        const wall = shuffledWalls[idx];
        
        // Check surrounding cells to determine trap orientation
        let direction = null;
        let orientationAngle = 0;
        
        // Try to find a path cell adjacent to this wall
        if (wall.i > 0 && mazeLayout[wall.i-1][wall.j] === 0) { 
            direction = 'north';
            orientationAngle = Math.PI;
        } else if (wall.i < mazeLayout.length - 1 && mazeLayout[wall.i+1][wall.j] === 0) {
            direction = 'south';
            orientationAngle = 0;
        } else if (wall.j > 0 && mazeLayout[wall.i][wall.j-1] === 0) {
            direction = 'west'; 
            orientationAngle = Math.PI / 2;
        } else if (wall.j < mazeLayout[0].length - 1 && mazeLayout[wall.i][wall.j+1] === 0) {
            direction = 'east';
            orientationAngle = -Math.PI / 2;
        }
        
        if (!direction) continue; // Skip if no adjacent path found
        
        // Convert grid position to world coordinates
        const x = -platformSize + wall.j * cellSize + cellSize/2;
        const z = -platformSize + wall.i * cellSize + cellSize/2;
        
        // Create a simple box as fallback
        const trapGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.6);
        const trapMaterial = new THREE.MeshStandardMaterial({ color: 0x8C8C8C, metalness: 0.9, roughness: 0.2 });
        const trap = new THREE.Mesh(trapGeometry, trapMaterial);
        
        // Position the trap on the wall
        trap.position.set(x, 1.5, z);
        
        // Orient the trap to point toward the path
        trap.rotation.y = orientationAngle;
        
        // Add to the group
        spearGroup.add(trap);
        
        // Store trap data
        spearTraps.push({
            position: new THREE.Vector3(x, 1.5, z),
            direction: direction,
            rotation: orientationAngle,
            lastFired: 0,
            mesh: trap,
            cell: { i: wall.i, j: wall.j }
        });
    }
}

// Fire a spear from a trap
function fireSpear(trap, scene, theme) {
    // Safety checks
    if (!trap || !scene) {
        console.warn("Missing trap or scene in fireSpear");
        return;
    }
    
    try {
        // Get theme-specific properties or use defaults
        const spearColor = theme && theme.spearColor ? theme.spearColor : 0x8C8C8C;
        const spearMetalness = theme && theme.spearMetalness !== undefined ? theme.spearMetalness : 0.9;
        const spearRoughness = theme && theme.spearRoughness !== undefined ? theme.spearRoughness : 0.2;
        const spearEmissive = theme && theme.spearEmissive ? theme.spearEmissive : 0x222222;
        
        // Create a spear model
        const spearGeometry = new THREE.CylinderGeometry(0.05, 0.1, 2.0, 8);
        const spearMaterial = new THREE.MeshStandardMaterial({
            color: spearColor,
            metalness: spearMetalness,
            roughness: spearRoughness,
            emissive: new THREE.Color(spearEmissive),
            emissiveIntensity: 0.2
        });
        const spear = new THREE.Mesh(spearGeometry, spearMaterial);
        
        // Rotate properly to point in the direction of travel
        spear.rotation.x = Math.PI / 2;
        
        // Position at the trap location
        spear.position.copy(trap.position);
        
        // Apply the trap's rotation
        spear.rotation.y = trap.rotation;
        
        // Add to scene
        scene.add(spear);
        
        // Calculate velocity based on direction
        let velocity;
        switch(trap.direction) {
            case 'north':
                velocity = new THREE.Vector3(0, 0, -spearSpeed);
                break;
            case 'south':
                velocity = new THREE.Vector3(0, 0, spearSpeed);
                break;
            case 'east':
                velocity = new THREE.Vector3(spearSpeed, 0, 0);
                break;
            case 'west':
                velocity = new THREE.Vector3(-spearSpeed, 0, 0);
                break;
            default:
                velocity = new THREE.Vector3(0, 0, 0);
        }
        
        // Add to active spears
        activeSpears.push({
            mesh: spear,
            position: spear.position.clone(),
            velocity: velocity,
            distanceTraveled: 0,
            direction: trap.direction,
            hasHit: false
        });
        
        // Play sound effect if available
        if (window.playSound) {
            try {
                window.playSound('spearFire');
            } catch (soundError) {
                console.warn("Error playing spear fire sound:", soundError);
            }
        }
        
        // Flash the trap briefly to indicate firing
        if (trap.mesh) {
            try {
                // Store original material
                let originalMaterial = null;
                if (trap.mesh.material) {
                    originalMaterial = trap.mesh.material.clone();
                }
                
                // Apply a glowing material temporarily
                trap.mesh.traverse(child => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xFF0000,
                            emissive: 0xFF0000,
                            emissiveIntensity: 0.5
                        });
                    }
                });
                
                // Restore original material after a short delay
                setTimeout(() => {
                    if (trap.mesh) {
                        try {
                            if (originalMaterial) {
                                trap.mesh.traverse(child => {
                                    if (child.isMesh) {
                                        child.material = originalMaterial;
                                    }
                                });
                            }
                        } catch (restoreError) {
                            console.warn("Error restoring trap material:", restoreError);
                        }
                    }
                }, 200);
            } catch (materialError) {
                console.warn("Error changing trap material:", materialError);
            }
        }
    } catch (error) {
        console.error("Error firing spear:", error);
    }
}

// Update all spear traps and active spears
export function updateSpearTraps(playerPosition, delta, scene, damageFunction) {
    // Skip if no traps
    if (!spearTraps || spearTraps.length === 0) return;
    
    const currentTime = Date.now();
    
    // Check if any trap is triggered by player proximity
    for (const trap of spearTraps) {
        // Skip if on cooldown
        if (currentTime - trap.lastFired < spearCooldown) continue;
        
        // Calculate distance to player
        const distanceToPlayer = trap.position.distanceTo(playerPosition);
        
        // If player is within trigger distance, fire a spear
        if (distanceToPlayer <= triggerDistance) {
            trap.lastFired = currentTime;
            fireSpear(trap, scene);
        }
    }
    
    // Update all active spears
    for (let i = activeSpears.length - 1; i >= 0; i--) {
        const spear = activeSpears[i];
        
        // Skip if mesh is missing
        if (!spear || !spear.mesh) {
            activeSpears.splice(i, 1);
            continue;
        }
        
        // Move the spear
        spear.position.add(spear.velocity.clone().multiplyScalar(delta));
        spear.mesh.position.copy(spear.position);
        
        // Update distance traveled
        spear.distanceTraveled += spear.velocity.length() * delta;
        
        // Check if the spear has hit the player
        if (!spear.hasHit) {
            const distanceToPlayer = spear.position.distanceTo(playerPosition);
            
            // Only count hits if the spear is close to player height
            if (Math.abs(spear.position.y - playerPosition.y) < playerHeight && 
                distanceToPlayer < playerRadius) {
                
                // Mark as hit to prevent multiple hits
                spear.hasHit = true;
                
                // Apply damage to player if the damage function is available
                if (typeof damageFunction === 'function') {
                    try {
                        damageFunction(spearDamage);
                        
                        // Add impact effect
                        createImpactEffect(spear.position, scene);
                    } catch (error) {
                        console.error("Error applying damage:", error);
                    }
                } else {
                    console.warn("Damage function not available for spear trap");
                    // Still create impact effect even if damage function is missing
                    createImpactEffect(spear.position, scene);
                }
            }
        }
        
        // Remove spears that have traveled too far
        if (spear.distanceTraveled > spearRange) {
            scene.remove(spear.mesh);
            activeSpears.splice(i, 1);
        }
    }
}

// Create a visual effect when a spear hits something
function createImpactEffect(position, scene) {
    // Safety check
    if (!scene || !position) {
        console.warn("Scene or position not provided to createImpactEffect");
        return;
    }
    
    try {
        // Create particles for impact
        const particleCount = 10;
        const particleGeometry = new THREE.SphereGeometry(0.03, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFAA00,
            emissive: 0xFFAA00,
            emissiveIntensity: 1
        });
        
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // Random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                Math.random() * 2,
                (Math.random() - 0.5) * 4
            );
            
            scene.add(particle);
            particles.push({
                mesh: particle,
                velocity: velocity,
                life: 1.0  // 1 second lifetime
            });
        }
        
        // Create a light flash
        const flash = new THREE.PointLight(0xFFAA00, 1, 3);
        flash.position.copy(position);
        scene.add(flash);
        
        // Fade out the flash
        let flashIntensity = 1.0;
        
        // Animation function for particles and flash
        const animateImpact = function(time) {
            try {
                // Update particles
                let allDone = true;
                
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    
                    // Skip if particle is invalid
                    if (!p || !p.mesh) {
                        particles.splice(i, 1);
                        continue;
                    }
                    
                    // Move particle
                    p.mesh.position.add(p.velocity.clone().multiplyScalar(0.016)); // Assume ~60fps
                    
                    // Apply gravity
                    p.velocity.y -= 9.8 * 0.016;
                    
                    // Reduce life
                    p.life -= 0.016;
                    
                    // Remove dead particles
                    if (p.life <= 0) {
                        scene.remove(p.mesh);
                        
                        // Dispose geometry and material
                        if (p.mesh.geometry) p.mesh.geometry.dispose();
                        if (p.mesh.material) p.mesh.material.dispose();
                        
                        particles.splice(i, 1);
                    } else {
                        allDone = false;
                    }
                }
                
                // Fade flash
                flashIntensity -= 0.05;
                if (flashIntensity > 0 && flash) {
                    flash.intensity = flashIntensity;
                    allDone = false;
                } else if (flash) {
                    scene.remove(flash);
                }
                
                // Continue animation if needed
                if (!allDone) {
                    requestAnimationFrame(animateImpact);
                } else {
                    // Clean up any remaining resources
                    particles.length = 0;
                    particleGeometry.dispose();
                    particleMaterial.dispose();
                }
            } catch (error) {
                console.error("Error in impact animation:", error);
                // Clean up on error
                try {
                    particles.forEach(p => {
                        if (p && p.mesh) {
                            scene.remove(p.mesh);
                            if (p.mesh.geometry) p.mesh.geometry.dispose();
                            if (p.mesh.material) p.mesh.material.dispose();
                        }
                    });
                    particles.length = 0;
                    
                    if (flash) scene.remove(flash);
                    
                    particleGeometry.dispose();
                    particleMaterial.dispose();
                } catch (cleanupError) {
                    console.error("Error during cleanup:", cleanupError);
                }
            }
        };
        
        // Start animation
        requestAnimationFrame(animateImpact);
    } catch (error) {
        console.error("Error creating impact effect:", error);
    }
}

// Clean up all spear traps and spears
export function cleanupSpearTraps(scene) {
    // Safety check
    if (!scene) {
        console.warn("Scene not provided to cleanupSpearTraps");
        return;
    }
    
    // Remove all active spears
    try {
        for (let i = activeSpears.length - 1; i >= 0; i--) {
            const spear = activeSpears[i];
            if (spear && spear.mesh) {
                scene.remove(spear.mesh);
                // Dispose of geometries and materials to free memory
                if (spear.mesh.geometry) spear.mesh.geometry.dispose();
                if (spear.mesh.material) {
                    if (Array.isArray(spear.mesh.material)) {
                        spear.mesh.material.forEach(material => material.dispose());
                    } else {
                        spear.mesh.material.dispose();
                    }
                }
            }
        }
        activeSpears = [];
    } catch (error) {
        console.error("Error cleaning up active spears:", error);
    }
    
    // Remove all traps
    try {
        if (spearGroup) {
            // Dispose of all children geometries and materials
            spearGroup.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
            
            // Remove the group from the scene
            scene.remove(spearGroup);
            spearGroup = null;
        }
        spearTraps = [];
    } catch (error) {
        console.error("Error cleaning up spear traps:", error);
    }
} 
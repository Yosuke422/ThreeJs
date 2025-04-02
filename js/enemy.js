import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { playerHeight, playerRadius, getPlatformSize, getCellSize } from './config.js';
import { getCollectionState } from './coins.js';

// Enemy variables
let mutant = null;
let mutantMixer = null;
let runningAnimation = null;
let dyingAnimation = null;
let isChasing = false;
let chaseCooldown = 2000; // 2 seconds before starting to chase
let chaseTimeout = null;
let isDead = false;
let mutantRadius = playerRadius; // Use the same radius as the player for collisions
let debugHelper = null; // For visualizing collision body
let hasSpawned = false; // Flag to track if mutant has been spawned
let allCoinsCollected = false; // Track if all coins have been collected

// Update whether all coins have been collected
export function updateCoinCollectionStatus() {
    const { coinsCollected, numCoins } = getCollectionState();
    const previousStatus = allCoinsCollected;
    allCoinsCollected = coinsCollected >= numCoins;
    
    // If we just collected all coins, stop the mutant from chasing
    if (allCoinsCollected && !previousStatus && isChasing) {
        stopChasing();
        console.log("All coins collected! Mutant has stopped chasing.");
    }
    
    return allCoinsCollected;
}

// Function to stop the mutant from chasing
function stopChasing() {
    isChasing = false;
    
    // Play idle animation instead of running
    if (runningAnimation) {
        runningAnimation.stop();
        runningAnimation.enabled = false;
    }
    
    // Debug helper visual indication removed (no longer needed)
}

// Create the mutant enemy - but don't position it yet
export function createMutant(scene) {
    console.log("Creating mutant enemy...");
    
    // Reset collection status
    allCoinsCollected = false;
    
    // Load the mutant model
    const fbxLoader = new FBXLoader();
    
    // Create a container for the mutant
    const mutantContainer = new THREE.Object3D();
    // Don't add to scene yet - we'll add it when player starts moving
    
    // Debug helper is now disabled to prevent floating appearance
    // No longer creating and adding the debug wireframe helper
    
    // Load the model using the correct path
    const modelPath = 'assets/Mutant.fbx';
    console.log(`Loading main model from: ${modelPath}`);
    
    fbxLoader.load(
        modelPath,
        // Success callback
        (fbx) => {
            console.log(`Successfully loaded model from: ${modelPath}`);
            // Scale the model to match player size
            const scale = playerHeight / 2;
            fbx.scale.set(scale * 0.01, scale * 0.01, scale * 0.01);
            
            // Create animation mixer
            mutantMixer = new THREE.AnimationMixer(fbx);
            
            // Position the model correctly within the container
            // Adjust the Y position so it sits properly on the ground
            fbx.position.y = 0; // Changed to 0 to eliminate floating effect
            
            // Add to container (but not to scene yet)
            mutantContainer.add(fbx);
            mutant = mutantContainer;
            
            // Load running animation
            const runningPath = 'assets/Running.fbx';
            console.log(`Loading running animation from: ${runningPath}`);
            
            fbxLoader.load(
                runningPath,
                // Success callback for running animation
                (runFbx) => {
                    console.log(`Successfully loaded running animation from: ${runningPath}`);
                    runningAnimation = mutantMixer.clipAction(runFbx.animations[0]);
                    runningAnimation.play();
                    runningAnimation.enabled = false;
                    
                    // Load dying animation
                    const dyingPath = 'assets/Dying.fbx';
                    console.log(`Loading dying animation from: ${dyingPath}`);
                    
                    fbxLoader.load(
                        dyingPath,
                        // Success callback for dying animation
                        (dyingFbx) => {
                            console.log(`Successfully loaded dying animation from: ${dyingPath}`);
                            dyingAnimation = mutantMixer.clipAction(dyingFbx.animations[0]);
                            dyingAnimation.setLoop(THREE.LoopOnce);
                            dyingAnimation.clampWhenFinished = true;
                            dyingAnimation.enabled = false;
                            
                            console.log("All mutant models and animations loaded successfully!");
                        },
                        // Error callback for dying animation
                        (error) => {
                            console.error(`Error loading dying animation: ${error}`);
                        }
                    );
                },
                // Error callback for running animation
                (error) => {
                    console.error(`Error loading running animation: ${error}`);
                }
            );
        },
        // Error callback
        (error) => {
            console.error(`Error loading model: ${error}`);
        }
    );
    
    return mutantContainer;
}

// Spawn the mutant at the maze start when player starts moving
export function spawnMutantAtStart(scene, playerHasMoved) {
    console.log("Attempt to spawn mutant. Has moved:", playerHasMoved, "Has spawned:", hasSpawned, "Mutant exists:", !!mutant);
    
    if (!mutant || hasSpawned || !playerHasMoved) return;
    
    // Position at start of maze (at the exact player starting position)
    const platformSize = getPlatformSize();
    const cellSize = getCellSize();
    
    // Position exactly at the player's starting position
    mutant.position.set(
        -platformSize + cellSize/2,               // Same X as player start
        0,                                        // Place directly on the ground (no Y offset)
        -platformSize + cellSize + cellSize/2     // EXACT same Z as player start position
    );
    
    // Add to scene now
    scene.add(mutant);
    hasSpawned = true;
    
    console.log("Mutant spawned at player starting position:", mutant.position);
    
    // Start chase countdown
    startChaseCountdown();
    
    return mutant;
}

// Start countdown until mutant starts chasing
function startChaseCountdown() {
    console.log("Starting chase countdown for", chaseCooldown, "ms");
    chaseTimeout = setTimeout(() => {
        // Only start chasing if player hasn't collected all coins
        if (!allCoinsCollected) {
            isChasing = true;
            if (runningAnimation) {
                runningAnimation.enabled = true;
                runningAnimation.play();
                console.log("Running animation started");
            } else {
                console.warn("Running animation not available");
            }
            console.log("Mutant started chasing!");
        } else {
            console.log("All coins already collected. Mutant will not chase.");
        }
    }, chaseCooldown);
}

// Update the mutant position and animation
export function updateMutant(delta, playerPosition, checkWallCollisions, playerHasMoved, scene) {
    // Check coin collection status
    updateCoinCollectionStatus();
    
    // If player moved but mutant not spawned yet, spawn it
    if (playerHasMoved && !hasSpawned) {
        console.log("Player has moved, attempting to spawn mutant");
        spawnMutantAtStart(scene, playerHasMoved);
        return; // Skip this frame's update since we just spawned
    }
    
    if (!mutant || !mutantMixer || isDead || !hasSpawned) {
        // Only log this once in a while to avoid console spam
        if (Math.random() < 0.01) {
            console.log("Skipping mutant update. Mutant:", !!mutant, "Mixer:", !!mutantMixer, "IsDead:", isDead, "HasSpawned:", hasSpawned);
        }
        return;
    }
    
    // Update animations
    mutantMixer.update(delta);
    
    // If all coins are collected, stop chasing
    if (allCoinsCollected && isChasing) {
        stopChasing();
    }
    
    // If not chasing, just stay in place and look at player
    if (!isChasing) {
        // Make mutant face the player even when not chasing
        const direction = new THREE.Vector3();
        direction.subVectors(playerPosition, mutant.position);
        direction.y = 0;
        
        if (direction.length() > 0.1) {
            const angle = Math.atan2(direction.x, direction.z);
            mutant.rotation.y = angle;
        }
        return;
    }
    
    // Calculate direction to player
    const direction = new THREE.Vector3();
    direction.subVectors(playerPosition, mutant.position);
    direction.y = 0; // Keep mutant on the ground
    
    // Normalize direction and set speed
    const distance = direction.length();
    direction.normalize();
    
    // Make mutant face the player
    if (distance > 0.1) {
        const angle = Math.atan2(direction.x, direction.z);
        mutant.rotation.y = angle;
    }
    
    // Increase speed - make mutant faster than before
    const speed = 3.5; // Faster than player speed (player is 3.0)
    
    // IMPROVED PATHFINDING: Try multiple directions when stuck
    const pathfindingDelta = Math.min(delta, 0.1) * speed; // Cap delta for safety

    // First try moving directly toward player
    let moveAmount = pathfindingDelta;
    let hasMoved = false;
    
    // Define a larger collision radius for obstacle detection
    // This helps the mutant to avoid walls better
    const pathfindingRadius = mutantRadius * 1.5;

    // Try to move toward player in small steps
    // Also use a simple A* pathfinding concept 
    
    // First, try moving directly toward player
    if (tryMoveInDirection(direction, moveAmount, pathfindingRadius, checkWallCollisions)) {
        hasMoved = true;
    } else {
        // If direct path is blocked, try indirect movements
        // This enhanced pathfinding will make the mutant navigate around obstacles
        hasMoved = tryAlternativeDirections(moveAmount, pathfindingRadius, checkWallCollisions, playerPosition);
    }
    
    // Position at correct Y level
    mutant.position.y = 0;
    
    // Check if close enough to catch player
    if (distance < mutantRadius + playerRadius) {
        mutantCatchPlayer();
    }
    
    // Helper function to try moving in a specific direction
    function tryMoveInDirection(dir, amount, radius, collisionCheck) {
        // Store current position
        const originalPosition = mutant.position.clone();
        
        // Calculate new position
        const newPosition = originalPosition.clone().add(dir.clone().multiplyScalar(amount));
        
        // Try to move there
        mutant.position.copy(newPosition);
        
        // Check for collisions
        if (collisionCheck(mutant.position, radius)) {
            // Revert if collision
            mutant.position.copy(originalPosition);
            return false;
        }
        
        return true;
    }
    
    // Helper function to try alternative directions when stuck
    function tryAlternativeDirections(amount, radius, collisionCheck, targetPosition) {
        // Create a set of alternative directions to try
        // These are based on the original direction to the player but with variations
        
        // Get maze grid coordinates of the mutant
        const platformSize = getPlatformSize();
        const cellSize = getCellSize();
        
        const mutantX = mutant.position.x;
        const mutantZ = mutant.position.z;
        
        // Calculate grid position
        const gridI = Math.floor((mutantZ + platformSize) / cellSize);
        const gridJ = Math.floor((mutantX + platformSize) / cellSize);
        
        // Get the target (player) grid position
        const targetX = targetPosition.x;
        const targetZ = targetPosition.z;
        const targetGridI = Math.floor((targetZ + platformSize) / cellSize);
        const targetGridJ = Math.floor((targetX + platformSize) / cellSize);
        
        // Determine which cardinal direction is most promising
        // (based on which grid direction leads closer to the player)
        const directions = [];
        
        // Priority: First try directions that lead toward the player in grid coordinates
        if (targetGridI < gridI) directions.push(new THREE.Vector3(0, 0, -1)); // North
        if (targetGridI > gridI) directions.push(new THREE.Vector3(0, 0, 1));  // South
        if (targetGridJ < gridJ) directions.push(new THREE.Vector3(-1, 0, 0)); // West
        if (targetGridJ > gridJ) directions.push(new THREE.Vector3(1, 0, 0));  // East
        
        // Add diagonal directions as fallback options
        directions.push(new THREE.Vector3(-1, 0, -1).normalize()); // Northwest
        directions.push(new THREE.Vector3(1, 0, -1).normalize());  // Northeast
        directions.push(new THREE.Vector3(-1, 0, 1).normalize());  // Southwest
        directions.push(new THREE.Vector3(1, 0, 1).normalize());   // Southeast
        
        // Try each direction
        for (const dir of directions) {
            if (tryMoveInDirection(dir, amount, radius, collisionCheck)) {
                return true;
            }
        }
        
        // If all simple directions fail, try smaller steps in the original direction
        const originalDir = new THREE.Vector3().subVectors(targetPosition, mutant.position).normalize();
        
        // Try with progressively smaller steps
        for (let factor = 0.8; factor >= 0.2; factor -= 0.2) {
            if (tryMoveInDirection(originalDir, amount * factor, radius, collisionCheck)) {
                return true;
            }
        }
        
        return false;
    }
}

// Handle what happens when the mutant catches the player
function mutantCatchPlayer() {
    if (isDead || allCoinsCollected) return; // Don't catch if all coins collected
    
    console.log("Mutant caught player!");
    
    // Stop chasing
    isChasing = false;
    isDead = true;
    
    // Play dying animation on the player (in real game)
    // Here we're just doing a simple restart with a timeout
    
    // Show caught message
    const caughtMessage = document.createElement('div');
    caughtMessage.id = 'caughtMessage';
    caughtMessage.style.position = 'absolute';
    caughtMessage.style.top = '50%';
    caughtMessage.style.left = '50%';
    caughtMessage.style.transform = 'translate(-50%, -50%)';
    caughtMessage.style.color = 'red';
    caughtMessage.style.fontFamily = 'Arial, sans-serif';
    caughtMessage.style.fontSize = '48px';
    caughtMessage.style.fontWeight = 'bold';
    caughtMessage.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    caughtMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    caughtMessage.style.padding = '20px';
    caughtMessage.style.borderRadius = '10px';
    caughtMessage.style.zIndex = '1000';
    caughtMessage.innerHTML = 'Caught by the mutant!<br>Restarting level...';
    document.body.appendChild(caughtMessage);
    
    // Restart level after delay
    setTimeout(() => {
        // In a real implementation, this would call the game's restart function
        if (window.restartLevel) {
            window.restartLevel();
        } else {
            // Fallback if no restart function exists
            location.reload();
        }
    }, 3000);
}

// Clean up enemy resources
export function cleanupEnemy() {
    console.log("Cleaning up enemy resources");
    
    if (chaseTimeout) {
        clearTimeout(chaseTimeout);
        chaseTimeout = null;
    }
    
    isChasing = false;
    isDead = false;
    hasSpawned = false;
    allCoinsCollected = false;
    
    if (mutant && mutant.parent) {
        mutant.parent.remove(mutant);
    }
    
    // Debug helper cleanup removed (no longer needed)
    
    mutant = null;
    mutantMixer = null;
    runningAnimation = null;
    dyingAnimation = null;
    debugHelper = null;
} 
import * as THREE from 'three';
import { mazeLevels, getCurrentLevel, setCurrentLevel, getMazeLayout, 
         getNumCoins, getNumCoinsForLevel, getPlatformSize, getCellSize, 
         getWallWidth, getWallDepth, playerHeight } from './config.js';
import { createPlayer, setupControls, updatePlayer, hasPlayerMoved, resetPlayerMovement, getPlayerState } from './player.js';
import { createMaze, createPlatform, createStartFinish, checkWallCollisions, findValidCoinPositions } from './maze.js';
import { createCoins, updateCoins, updateParticles, getCollectionState } from './coins.js';
import { createLighting, updateSpotlight, updateLighting } from './lighting.js';
import { createLevelUI, createNextLevelButton, createLevelCompleteMessage, 
         updateLevelIndicator, cleanupLevelUI, hasNextLevel, 
         getNextLevel, createGameCompleteMessage, getLevelTheme } from './level.js';
import { createHazards, checkSpikeCollisions, updateHazardStatus, cleanupHazards, updateSpikes, damagePlayer } from './hazards.js';
import { generateTexture } from './textureGenerator.js';
import { initSounds, toggleSound, isSoundEnabled } from './sound.js';
import { createSpearTraps, updateSpearTraps, cleanupSpearTraps } from './spearTrap.js';

// Game state
let scene, camera, renderer, cameraContainer, player;
let finishLine, coinSpotlight, levelIndicator;
let prevTime, validCoinPositions;
let isPaused = false;
let gameObjects = {
    walls: [],
    coins: [],
    platform: null,
    lights: [],
    obstacles: [],
    hazards: null,
    spearTraps: null,
    finishLine: null
};

let levelCompleted = false;

// Initialize the game
export function initGame() {
    // Initialize scene and renderer
    scene = new THREE.Scene();
    
    // Apply theme for level 0
    const initialTheme = getLevelTheme(getCurrentLevel());
    
    // Check if theme is valid before accessing properties
    if (initialTheme) {
        scene.background = new THREE.Color(initialTheme.skyColor || 0x87ceeb);
        
        // Add fog for atmosphere with increased density to limit view distance
        const fogDensity = initialTheme.fogDensity ? initialTheme.fogDensity * 3.5 : 0.035; // Make fog much denser
        scene.fog = new THREE.FogExp2(initialTheme.fogColor || 0x87ceeb, fogDensity);
    } else {
        // Set default values if theme is undefined
        scene.background = new THREE.Color(0x87ceeb);
        scene.fog = new THREE.FogExp2(0x87ceeb, 0.035);
    }
    
    // Store scene reference globally for other modules
    window.gameScene = scene;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Initialize sound system
    initSounds();
    
    // Create UI
    levelIndicator = createLevelUI();
    
    // Add sound toggle UI
    createSoundToggle();
    
    // Reset level completion status
    levelCompleted = false;
    
    // Load the first level
    loadLevel(getCurrentLevel());
    
    // Start the animation loop
    prevTime = performance.now();
    animate();
}

// Create a toggle button for sound
function createSoundToggle() {
    const soundToggle = document.createElement('button');
    soundToggle.id = 'soundToggle';
    soundToggle.style.position = 'absolute';
    soundToggle.style.bottom = '20px';
    soundToggle.style.right = '20px';
    soundToggle.style.width = '40px';
    soundToggle.style.height = '40px';
    soundToggle.style.background = 'rgba(0,0,0,0.5)';
    soundToggle.style.border = 'none';
    soundToggle.style.borderRadius = '50%';
    soundToggle.style.color = 'white';
    soundToggle.style.fontSize = '20px';
    soundToggle.style.cursor = 'pointer';
    soundToggle.style.zIndex = '1000';
    
    // Set initial icon based on sound state
    soundToggle.innerHTML = isSoundEnabled() ? '🔊' : '🔇';
    
    // Add click event
    soundToggle.addEventListener('click', () => {
        const newState = toggleSound(!isSoundEnabled());
        soundToggle.innerHTML = newState ? '🔊' : '🔇';
    });
    
    document.body.appendChild(soundToggle);
}

// Load a specific level
export function loadLevel(levelIndex) {
    // Update current level
    setCurrentLevel(levelIndex);
    const cellSize = getCellSize();
    const platformSize = getPlatformSize();
    
    // Reset level completion status
    levelCompleted = false;
    
    // Reset player movement tracking
    resetPlayerMovement();
    
    // Remove next level button if it exists
    const nextLevelButton = document.getElementById('nextLevelButton');
    if (nextLevelButton) {
        nextLevelButton.remove();
    }
    
    // Remove reset button if it exists
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.remove();
    }
    
    // Remove level or game complete message if it exists
    const levelCompleteMessage = document.getElementById('levelCompleteMessage');
    if (levelCompleteMessage) {
        levelCompleteMessage.remove();
    }
    
    const gameCompleteMessage = document.getElementById('gameCompleteMessage');
    if (gameCompleteMessage) {
        gameCompleteMessage.remove();
    }
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
    
    // Get the appropriate theme for this level
    const theme = getLevelTheme(levelIndex);
    if (!document.getElementById('levelName')) {
        // Create a UI element for the level name
        const nameElement = document.createElement('div');
        nameElement.id = 'levelName';
        nameElement.style.position = 'absolute';
        nameElement.style.top = '50px';
        nameElement.style.right = '20px';
        nameElement.style.color = 'white';
        nameElement.style.fontFamily = 'Arial, sans-serif';
        nameElement.style.fontSize = '20px';
        nameElement.style.fontWeight = 'bold';
        nameElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        document.body.appendChild(nameElement);
    }
    
    // Safe access to theme properties
    if (theme) {
        document.getElementById('levelName').textContent = `Theme: ${theme.name || 'Default'}`;
        
        // Update scene with theme
        scene.background = new THREE.Color(theme.skyColor || 0x87ceeb);
        // Set dense fog to limit view distance
        const fogDensity = theme.fogDensity ? theme.fogDensity * 3.5 : 0.035;
        scene.fog = new THREE.FogExp2(theme.fogColor || 0x87ceeb, fogDensity);
    } else {
        document.getElementById('levelName').textContent = 'Theme: Default';
        scene.background = new THREE.Color(0x87ceeb);
        scene.fog = new THREE.FogExp2(0x87ceeb, 0.035);
    }
    
    // Clear previous level objects
    clearLevel();
    
    // Create player if it doesn't exist
    if (!player) {
        const playerObjects = createPlayer(scene);
        cameraContainer = playerObjects.cameraContainer;
        camera = playerObjects.camera;
        player = playerObjects.player;
        setupControls(cameraContainer, camera);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    } else {
        // If player exists, just reset the movement tracking
        resetPlayerMovement();
    }
    
    // Position player at the maze start for the new level
    cameraContainer.position.set(
        -platformSize + cellSize/2, 
        playerHeight, 
        -platformSize + cellSize + cellSize/2
    );
    
    // Reset player rotation
    cameraContainer.rotation.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    
    // Create maze elements with theme
    const maze = createMaze(scene, theme);
    gameObjects.walls.push(maze);
    
    const platform = createPlatform(scene, theme);
    gameObjects.platform = platform;
    
    const { startLine, finishLine: newFinishLine } = createStartFinish(scene);
    gameObjects.walls.push(startLine);
    finishLine = newFinishLine;
    gameObjects.finishLine = finishLine;
    gameObjects.walls.push(finishLine);
    
    // Add lighting
    const { ambientLight, directionalLight } = createLighting(scene, theme);
    gameObjects.lights.push(ambientLight, directionalLight);
    
    // Find valid positions for coins
    validCoinPositions = findValidCoinPositions();
    
    // Create coins
    const { coins, coinSpotlight: newCoinSpotlight } = createCoins(scene, validCoinPositions);
    gameObjects.coins = coins;
    coinSpotlight = newCoinSpotlight;
    gameObjects.lights.push(coinSpotlight, coinSpotlight.target);
    
    // Create hazards
    const hazards = createHazards(scene, theme || {
        wallColor: 0x777777,
        name: 'Default'
    });
    gameObjects.hazards = hazards;
    
    // Create spear traps
    const spearTraps = createSpearTraps(scene, theme);
    gameObjects.spearTraps = spearTraps;
    
    // Make restart level function available globally
    window.restartLevel = () => {
        loadLevel(getCurrentLevel());
    };
    
    // Update level indicator
    updateLevelIndicator(levelIndicator);
    
    // Show a notification about the level
    showLevelStartMessage(levelIndex + 1);
}

// Show a message when starting a new level
function showLevelStartMessage(levelNumber) {
    const startMessage = document.createElement('div');
    startMessage.id = 'levelStartMessage';
    startMessage.style.position = 'absolute';
    startMessage.style.top = '50%';
    startMessage.style.left = '50%';
    startMessage.style.transform = 'translate(-50%, -50%)';
    startMessage.style.color = 'white';
    startMessage.style.fontFamily = 'Arial, sans-serif';
    startMessage.style.fontSize = '48px';
    startMessage.style.fontWeight = 'bold';
    startMessage.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    startMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    startMessage.style.padding = '20px';
    startMessage.style.borderRadius = '10px';
    startMessage.style.textAlign = 'center';
    startMessage.style.transition = 'opacity 0.5s';
    startMessage.innerHTML = `Level ${levelNumber}<br>Collect all coins!<br><span style="font-size: 24px">Watch out for spike traps! Avoid stepping on them.</span>`;
    document.body.appendChild(startMessage);
    
    // Fade out and remove after a few seconds
    setTimeout(() => {
        startMessage.style.opacity = '0';
        setTimeout(() => {
            if (startMessage.parentNode) {
                startMessage.parentNode.removeChild(startMessage);
            }
        }, 500);
    }, 3000);
}

// Clear level objects
function clearLevel() {
    // Remove walls
    gameObjects.walls.forEach(wall => {
        if (wall && wall.parent) {
            scene.remove(wall);
        }
    });
    gameObjects.walls = [];
    
    // Remove coins
    gameObjects.coins.forEach(coin => {
        if (coin && coin.parent) {
            scene.remove(coin);
        }
    });
    gameObjects.coins = [];
    
    // Remove platform
    if (gameObjects.platform && gameObjects.platform.parent) {
        scene.remove(gameObjects.platform);
    }
    gameObjects.platform = null;
    
    // Remove lights
    gameObjects.lights.forEach(light => {
        if (light && light.parent) {
            scene.remove(light);
        }
    });
    gameObjects.lights = [];
    
    // Clear UI elements - use the function from level.js
    cleanupLevelUI();
    
    // Clean up hazards
    cleanupHazards();
    
    // Clean up spear traps
    cleanupSpearTraps(scene);
    
    // Remove any DOM elements from previous level
    const elementIdsToRemove = [
        'coinCountElement',
        'levelStartMessage',
        'nextLevelButton',
        'resetButton',
        'levelCompleteMessage',
        'gameCompleteMessage',
        'coinMessage',
        'winMessage',
        'caughtMessage'
    ];
    
    elementIdsToRemove.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    });
    
    // Remove finishLine reference
    finishLine = null;
    gameObjects.finishLine = null;
}

// Check if level is complete
function checkLevelComplete() {
    const { coinsCollected, numCoins } = getCollectionState();
    
    // If all coins are collected
    if (coinsCollected >= numCoins) {
        // Only show completion UI if it doesn't already exist
        if (!document.getElementById('levelCompleteMessage')) {
            // Release the pointer lock so the mouse cursor appears again
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
            
            // Show level complete message
            const levelMessage = createLevelCompleteMessage(getCurrentLevel());
            
            // Show next level button if there are more levels
            if (hasNextLevel()) {
                const nextButton = createNextLevelButton(() => {
                    // Add a visual loading indicator
                    const loadingIndicator = document.createElement('div');
                    loadingIndicator.id = 'loadingIndicator';
                    loadingIndicator.style.position = 'absolute';
                    loadingIndicator.style.top = '50%';
                    loadingIndicator.style.left = '50%';
                    loadingIndicator.style.transform = 'translate(-50%, -50%)';
                    loadingIndicator.style.color = 'white';
                    loadingIndicator.style.fontFamily = 'Arial, sans-serif';
                    loadingIndicator.style.fontSize = '24px';
                    loadingIndicator.style.fontWeight = 'bold';
                    loadingIndicator.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
                    loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                    loadingIndicator.style.padding = '20px';
                    loadingIndicator.style.borderRadius = '10px';
                    loadingIndicator.style.zIndex = '9999';
                    loadingIndicator.innerHTML = 'Loading next level...';
                    document.body.appendChild(loadingIndicator);
                    
                    // Load the next level after a short timeout to allow the UI to update
                    const nextLevel = getNextLevel();
                    if (nextLevel) {
                        // Use requestAnimationFrame to make sure UI updates before loading level
                        requestAnimationFrame(() => {
                            loadLevel(nextLevel.level);
                            
                            // Remove loading indicator after level loads
                            if (loadingIndicator.parentNode) {
                                loadingIndicator.parentNode.removeChild(loadingIndicator);
                            }
                        });
                    }
                });
                
                // Make sure the button is visible and clickable
                setTimeout(() => {
                    if (nextButton) {
                        nextButton.style.display = 'block';
                        nextButton.focus();
                    }
                }, 500);
            } else {
                // Game completed - all levels done
                const { resetButton } = createGameCompleteMessage();
                
                // Add event listener directly to the reset button here
                if (resetButton) {
                    resetButton.addEventListener('click', () => {
                        // Show loading indication
                        const loadingIndicator = document.createElement('div');
                        loadingIndicator.id = 'loadingIndicator';
                        loadingIndicator.style.position = 'absolute';
                        loadingIndicator.style.top = '50%';
                        loadingIndicator.style.left = '50%';
                        loadingIndicator.style.transform = 'translate(-50%, -50%)';
                        loadingIndicator.style.color = 'white';
                        loadingIndicator.style.fontFamily = 'Arial, sans-serif';
                        loadingIndicator.style.fontSize = '24px';
                        loadingIndicator.style.fontWeight = 'bold';
                        loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                        loadingIndicator.style.padding = '20px';
                        loadingIndicator.style.borderRadius = '10px';
                        loadingIndicator.style.zIndex = '9999';
                        loadingIndicator.innerHTML = 'Restarting game...';
                        document.body.appendChild(loadingIndicator);
                        
                        // Restart the game from level 1 using requestAnimationFrame
                        requestAnimationFrame(() => {
                            loadLevel(0);
                            
                            // Remove loading indicator
                            if (loadingIndicator.parentNode) {
                                loadingIndicator.parentNode.removeChild(loadingIndicator);
                            }
                        });
                    });
                    
                    // Make sure the button is visible and clickable
                    setTimeout(() => {
                        if (resetButton) {
                            resetButton.style.display = 'block';
                            resetButton.focus();
                        }
                    }, 500);
                }
            }
            
            // Make finish line green
            gameObjects.finishLine.material.color.set(0x00ff00);
            
            // Flag that level is complete
            levelCompleted = true;
        }
        
        return true;
    }
    
    return false;
}

// Check if player reached the finish line and collected all coins
function checkFinishLineReached() {
    if (!gameObjects.finishLine || !gameObjects.finishLine.material) return;
    
    const { coinsCollected, numCoins } = getCollectionState();
    
    if (coinsCollected >= numCoins) {
        // Change finish line to green
        gameObjects.finishLine.material.color.set(0x00ff00);
        
        // Level is completed
        levelCompleted = true;
        
        // The checkLevelComplete function will handle showing completion UI
    } else {
        // Player reached finish but didn't collect all coins
        gameObjects.finishLine.material.color.set(0xffff00); // Change to yellow
        
        // Show message to collect more coins if it doesn't exist
        if (!document.getElementById('coinMessage')) {
            const coinMessage = document.createElement('div');
            coinMessage.id = 'coinMessage';
            coinMessage.style.position = 'absolute';
            coinMessage.style.top = '50%';
            coinMessage.style.left = '50%';
            coinMessage.style.transform = 'translate(-50%, -50%)';
            coinMessage.style.color = 'white';
            coinMessage.style.fontFamily = 'Arial, sans-serif';
            coinMessage.style.fontSize = '32px';
            coinMessage.style.fontWeight = 'bold';
            coinMessage.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
            coinMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            coinMessage.style.padding = '15px';
            coinMessage.style.borderRadius = '10px';
            coinMessage.style.zIndex = '999';
            coinMessage.innerHTML = `Collect all coins before finishing!<br>Coins: ${coinsCollected} / ${numCoins}`;
            document.body.appendChild(coinMessage);
            
            // Remove the message after 3 seconds
            setTimeout(() => {
                if (coinMessage.parentNode) {
                    coinMessage.parentNode.removeChild(coinMessage);
                }
            }, 3000);
        }
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    const now = performance.now();
    const delta = (now - prevTime) / 1000; // Delta in seconds
    prevTime = now;
    
    // Update player
    if (player && !isPaused) {
        // Update player and get state
        const playerState = updatePlayer(delta, cameraContainer, player, checkWallCollisions);
        
        // Also get complete player state (which has more reliable jumping info)
        const completePlayerState = getPlayerState();
        const isJumping = completePlayerState.isJumping;
    
        // Update lighting effects
        updateLighting(delta, getLevelTheme(getCurrentLevel()));
    
        // Update coins
        if (gameObjects.coins.length > 0) {
            const { nearestCoin, nearestCoinDistance } = updateCoins(now, cameraContainer);
            
            // Update spotlight to follow the nearest coin
            if (nearestCoin && coinSpotlight) {
                coinSpotlight.position.set(
                    nearestCoin.position.x,
                    nearestCoin.position.y + 3,
                    nearestCoin.position.z
                );
                coinSpotlight.target.position.copy(nearestCoin.position);
            }
        }
        
        // Update hazards
        if (gameObjects.hazards) {
            // Check if all coins collected and update hazard status
            updateHazardStatus();
            
            // Create a fixed ground position for hazard detection
            const groundPosition = cameraContainer.position.clone();
            
            // Set y=0 if on ground, otherwise adjust for jumping
            if (isJumping) {
                // Keep a non-zero y value while jumping
                groundPosition.y = 1.0; 
            } else {
                // On ground - set y to 0
                groundPosition.y = 0;
            }
            
            // Update spike animations
            updateSpikes(delta);
            
            // Check for spike collisions with the corrected position
            checkSpikeCollisions(groundPosition);
        }
        
        // Update obstacles animation
        scene.traverse(object => {
            if (object.userData && object.userData.animationId && window[object.userData.animationId]) {
                window[object.userData.animationId](now / 1000);
            }
        });
        
        // Update particle effects
        updateParticles(delta);
        
        // Update spear traps
        if (gameObjects.spearTraps) {
            // Get player position for trap triggering and collision
            const playerPosition = cameraContainer.position.clone();
            
            // Update all spear traps and active spears
            updateSpearTraps(playerPosition, delta, scene, (damage) => {
                // This is the damage callback function when player is hit
                damagePlayer(damage);
            });
        }
        
        // Check for level completion
        checkLevelComplete();
        
        // Check for reaching the finish line
        if (gameObjects.finishLine && gameObjects.finishLine.position) {
            const distanceToFinish = gameObjects.finishLine.position.distanceTo(cameraContainer.position);
            if (distanceToFinish < 3 && !levelCompleted) {
                checkFinishLineReached();
            }
        }
    }
    
    // Render the scene
    renderer.render(scene, camera);
} 
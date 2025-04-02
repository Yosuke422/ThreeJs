import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// Create a camera container to separate rotation and position
const cameraContainer = new THREE.Object3D();
scene.add(cameraContainer);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0); // Camera is at the center of the container
cameraContainer.add(camera); // Add camera to container

// Define maze walls
// 1 represents a wall, 0 represents an empty space
const mazeLayout = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Calculate cell size based on platform size and maze dimensions
const platformSize = 10; // Half of the platform size (total platform is 20x20)
const cellSize = (platformSize * 2) / mazeLayout[0].length;
const wallWidth = cellSize;
const wallDepth = cellSize;

// Position player at the maze start, adjusted to cell center
// For a 10x10 maze with cellSize = 2, the first walkable cell is at [1,0] in the maze grid
// Convert this to world coordinates with proper offset
cameraContainer.position.set(-platformSize + cellSize/2, 2, -platformSize + cellSize + cellSize/2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// First person view variables
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let playerHeight = 2.0; // Player height
let isOnGround = true;

// Create player collision body
const playerRadius = 0.4; // Slightly smaller to navigate maze
const playerGeometry = new THREE.CapsuleGeometry(playerRadius, playerHeight - playerRadius * 2, 1, 8);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = playerHeight / 2;
player.visible = false; // Make player mesh invisible
scene.add(player);

// Player physics parameters
const gravity = 30.0;
const jumpVelocity = 10.0;
const playerSpeed = 5.0; // Slower speed for maze navigation

// Create lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Create a big square platform
const platformGeometry = new THREE.BoxGeometry(platformSize * 2, 1, platformSize * 2);
const platformMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x808080,
    roughness: 0.7,
    metalness: 0.1
});
const platform = new THREE.Mesh(platformGeometry, platformMaterial);
platform.receiveShadow = true;
platform.position.y = -0.5; // Position slightly below the origin
scene.add(platform);

// Add grid helper
const gridHelper = new THREE.GridHelper(platformSize * 2, 20);
scene.add(gridHelper);

// Create start and finish lines
const startLineGeometry = new THREE.BoxGeometry(cellSize, 0.1, cellSize);
const startLineMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Green
const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
startLine.position.set(-platformSize + cellSize/2, 0.01, -platformSize + cellSize/2);
scene.add(startLine);

const finishLineGeometry = new THREE.BoxGeometry(cellSize, 0.1, cellSize);
const finishLineMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red
const finishLine = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
finishLine.position.set(platformSize - cellSize/2, 0.01, platformSize - cellSize/2);
scene.add(finishLine);

// Define the finish position (for reference)
const finishPos = {
    x: platformSize - cellSize/2,
    z: platformSize - cellSize/2
};

// Define pathfinding function
function findPathToFinish() {
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

// Find all valid empty spaces in the maze for potential coin placement
const validCoinPositions = [];
for (let i = 0; i < mazeLayout.length; i++) {
    for (let j = 0; j < mazeLayout[i].length; j++) {
        if (mazeLayout[i][j] === 0) {
            // Skip the starting and ending positions
            if ((i === 0 && j === 0) || (i === mazeLayout.length-1 && j === mazeLayout[0].length-1)) {
                continue;
            }
            
            // Convert maze grid position to world position
            const x = -platformSize + j * cellSize + cellSize/2;
            const z = -platformSize + i * cellSize + cellSize/2;
            
            validCoinPositions.push({ x, z, i, j });
        }
    }
}

// Shuffle the array of valid positions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

shuffleArray(validCoinPositions);

// Select 20 positions for coins
const numCoins = 10; // Reduced from 20 to match smaller maze
const coinPositions = validCoinPositions.slice(0, numCoins);

// Run pathfinding once to create the solution data
const pathData = findPathToFinish();

// Create coins and add them to the scene
const coins = [];
let coinsCollected = 0;

// Create a text element to display the count of collected coins
const coinCountElement = document.createElement('div');
coinCountElement.style.position = 'absolute';
coinCountElement.style.top = '20px';
coinCountElement.style.left = '20px';
coinCountElement.style.color = 'white';
coinCountElement.style.fontFamily = 'Arial, sans-serif';
coinCountElement.style.fontSize = '24px';
coinCountElement.style.fontWeight = 'bold';
coinCountElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
coinCountElement.innerHTML = 'Coins: 0 / 10'; // Updated to show 10 total coins
document.body.appendChild(coinCountElement);

// Create the coins
coinPositions.forEach((pos, index) => {
    // Create coin geometry (a simple gold coin)
    const coinGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 32);
    const coinMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700, // Gold color
        emissive: 0xFFD700,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2
    });
    
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    
    // Position coin at position
    coin.position.set(pos.x, 1.2, pos.z);
    
    // Rotate coin to be flat (facing upward)
    coin.rotation.x = Math.PI / 2;
    
    coin.castShadow = true;
    coin.receiveShadow = true;
    
    // Add custom properties for animation
    coin.userData = {
        baseY: 1.2,
        phaseOffset: index * (Math.PI / 3),
        rotationSpeed: 0.02 + Math.random() * 0.01,
        isCollected: false,
        position: pos,
        collectionRadius: 0.8 // Increased collection radius
    };
    
    scene.add(coin);
    coins.push(coin);
});

// Add a single moving spotlight instead of one per coin
const coinSpotlight = new THREE.SpotLight(0xFFD700, 1, 5, Math.PI / 4, 0.5, 1);
coinSpotlight.position.set(0, 4, 0);
coinSpotlight.target.position.set(0, 0, 0);
// Disable shadow casting for the spotlight to reduce texture units
coinSpotlight.castShadow = false;
scene.add(coinSpotlight);
scene.add(coinSpotlight.target);

// Reduce texture usage by disabling shadow maps for some lights
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024; // Reduced from 2048
directionalLight.shadow.mapSize.height = 1024; // Reduced from 2048

// Create maze walls
const wallHeight = 2.5;
const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513, // Brown color for walls
    roughness: 0.9,
    metalness: 0.1
});

// Maze container to group walls
const maze = new THREE.Group();
scene.add(maze);

// Wall collision boxes array
const wallCollisionBoxes = [];

// Create the maze walls
for (let i = 0; i < mazeLayout.length; i++) {
    for (let j = 0; j < mazeLayout[i].length; j++) {
        if (mazeLayout[i][j] === 1) {
            const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            
            // Position walls on the platform grid
            // Convert from maze coordinates to world coordinates
            wall.position.set(
                -platformSize + j * cellSize + cellSize/2,
                wallHeight / 2,
                -platformSize + i * cellSize + cellSize/2
            );
            
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

// Input handling
const keys = {
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false,
    Space: false
};

document.addEventListener('keydown', (event) => {
    if (keys.hasOwnProperty(event.code)) {
        keys[event.code] = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (keys.hasOwnProperty(event.code)) {
        keys[event.code] = false;
    }
});

// Implement pointer lock for camera control (looking around only)
const onMouseMove = (event) => {
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    // Rotate container horizontally (for looking left and right)
    cameraContainer.rotation.y -= movementX * 0.002;
    
    // Rotate camera vertically (for looking up and down)
    const verticalRotation = camera.rotation.x - movementY * 0.002;
    camera.rotation.x = Math.max(Math.min(verticalRotation, Math.PI / 2), -Math.PI / 2);
};

// Set up pointer lock controls
document.addEventListener('click', () => {
    document.body.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement) {
        document.addEventListener('mousemove', onMouseMove, false);
    } else {
        document.removeEventListener('mousemove', onMouseMove, false);
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Check collision with maze walls
function checkWallCollisions(position, radius) {
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
    
    return false;
}

// Animation loop with player movement and collision detection
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000; // Delta time in seconds
    
    // Find the nearest non-collected coin to follow with the spotlight
    let nearestCoinDistance = Infinity;
    let nearestCoin = null;
    
    // Animate coins (floating and rotating)
    coins.forEach(coin => {
        if (!coin.userData.isCollected) {
            // Floating animation
            coin.position.y = coin.userData.baseY + Math.sin(time * 0.001 + coin.userData.phaseOffset) * 0.1;
            
            // Rotation animation
            coin.rotation.z += coin.userData.rotationSpeed;
            
            // Enhanced coin collection detection - check horizontal and vertical distances separately
            const horizontalDistance = new THREE.Vector2(
                coin.position.x - cameraContainer.position.x,
                coin.position.z - cameraContainer.position.z
            ).length();
            
            const verticalDistance = Math.abs(coin.position.y - cameraContainer.position.y);
            
            // Check if player is close enough to collect the coin using improved detection
            if (horizontalDistance < coin.userData.collectionRadius && verticalDistance < 1.5) {
                // Log collection for debugging
                console.log("Coin collected! Distance:", horizontalDistance, verticalDistance);
                
                // Collect the coin
                coin.userData.isCollected = true;
                coin.visible = false;
                coinsCollected++;
                
                // Update coin counter display
                coinCountElement.innerHTML = `Coins: ${coinsCollected} / ${numCoins}`;
                
                // Add visual feedback
                createCollectionEffect(coin.position.clone());
            }
            
            // Check if this is the nearest coin to the player
            if (horizontalDistance < nearestCoinDistance) {
                nearestCoinDistance = horizontalDistance;
                nearestCoin = coin;
            }
        }
    });
    
    // Update particle effects
    updateParticles(delta);
    
    // Check if player reached the finish line and collected all coins
    const distanceToFinish = cameraContainer.position.distanceTo(finishLine.position);
    if (distanceToFinish < cellSize) {
        if (coinsCollected >= numCoins && !document.getElementById('winMessage')) {
            // Player won! All coins collected and reached the finish
            finishLine.material.color.set(0x00ff00); // Change to bright green
            
            // Show win message 
            const winMessage = document.createElement('div');
            winMessage.id = 'winMessage';
            winMessage.style.position = 'absolute';
            winMessage.style.top = '50%';
            winMessage.style.left = '50%';
            winMessage.style.transform = 'translate(-50%, -50%)';
            winMessage.style.color = 'white';
            winMessage.style.fontFamily = 'Arial, sans-serif';
            winMessage.style.fontSize = '48px';
            winMessage.style.fontWeight = 'bold';
            winMessage.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
            winMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            winMessage.style.padding = '20px';
            winMessage.style.borderRadius = '10px';
            winMessage.innerHTML = 'YOU WIN!<br>All coins collected!';
            document.body.appendChild(winMessage);
        } else if (coinsCollected < numCoins && !document.getElementById('coinMessage')) {
            // Player reached finish but didn't collect all coins
            finishLine.material.color.set(0xffff00); // Change to yellow
            
            // Show message to collect more coins
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
    
    // Add win condition when all coins are collected even without reaching finish
    if (coinsCollected >= numCoins && !document.getElementById('winMessage')) {
        // Player won! All coins collected
        finishLine.material.color.set(0x00ff00); // Change to bright green
        
        // Show win message
        const winMessage = document.createElement('div');
        winMessage.id = 'winMessage';
        winMessage.style.position = 'absolute';
        winMessage.style.top = '50%';
        winMessage.style.left = '50%';
        winMessage.style.transform = 'translate(-50%, -50%)';
        winMessage.style.color = 'white';
        winMessage.style.fontFamily = 'Arial, sans-serif';
        winMessage.style.fontSize = '48px';
        winMessage.style.fontWeight = 'bold';
        winMessage.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        winMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        winMessage.style.padding = '20px';
        winMessage.style.borderRadius = '10px';
        winMessage.innerHTML = 'YOU WIN!<br>All coins collected!';
        document.body.appendChild(winMessage);
    }
    
    // Move the spotlight to follow the nearest non-collected coin
    if (nearestCoin) {
        // Position the spotlight above the nearest coin
        coinSpotlight.position.set(nearestCoin.position.x, 4, nearestCoin.position.z);
        coinSpotlight.target.position.set(nearestCoin.position.x, 0, nearestCoin.position.z);
        
        // Adjust intensity based on distance to player
        const intensity = THREE.MathUtils.clamp(2.0 - nearestCoinDistance * 0.3, 0.2, 1);
        coinSpotlight.intensity = intensity;
    }
    
    // Apply gravity
    velocity.y -= gravity * delta;

    // Reset direction vector
    direction.x = 0;
    direction.z = 0;

    // Check keys for movement
    if (keys.KeyW) direction.z = -1;
    if (keys.KeyS) direction.z = 1;
    if (keys.KeyA) direction.x = -1;
    if (keys.KeyD) direction.x = 1;

    // Normalize direction vector if moving diagonally
    if (direction.x !== 0 && direction.z !== 0) {
        direction.normalize();
    }

    // Calculate movement based on camera container rotation (horizontal plane only)
    if (direction.z !== 0) {
        velocity.x = direction.z * Math.sin(cameraContainer.rotation.y) * playerSpeed;
        velocity.z = direction.z * Math.cos(cameraContainer.rotation.y) * playerSpeed;
    }

    // Sideways movement
    if (direction.x !== 0) {
        velocity.x = direction.x * Math.sin(cameraContainer.rotation.y + Math.PI/2) * playerSpeed;
        velocity.z = direction.x * Math.cos(cameraContainer.rotation.y + Math.PI/2) * playerSpeed;
    }

    // Jump when on ground and space pressed
    if (keys.Space && isOnGround) {
        velocity.y = jumpVelocity;
        isOnGround = false;
    }

    // Calculate new position
    const newPositionX = cameraContainer.position.x + velocity.x * delta;
    const newPositionZ = cameraContainer.position.z + velocity.z * delta;
    
    // Store current position for reverting if collision occurs
    const currentPosition = cameraContainer.position.clone();
    
    // Try moving on X axis
    if (Math.abs(newPositionX) < platformSize) {
        cameraContainer.position.x = newPositionX;
        // Check collisions and revert if needed
        if (checkWallCollisions(cameraContainer.position, playerRadius)) {
            cameraContainer.position.x = currentPosition.x;
        }
    }
    
    // Try moving on Z axis
    if (Math.abs(newPositionZ) < platformSize) {
        cameraContainer.position.z = newPositionZ;
        // Check collisions and revert if needed
        if (checkWallCollisions(cameraContainer.position, playerRadius)) {
            cameraContainer.position.z = currentPosition.z;
        }
    }
    
    // Update vertical position for jumping
    const newPositionY = cameraContainer.position.y + velocity.y * delta;
    
    // Store current Y position for reverting if collision occurs
    const currentY = cameraContainer.position.y;
    
    // Try moving on Y axis
    cameraContainer.position.y = newPositionY;
    
    // Check for collisions after vertical movement
    if (checkWallCollisions(cameraContainer.position, playerRadius)) {
        // If collision detected, revert to previous Y position
        cameraContainer.position.y = currentY;
        // Reset vertical velocity to prevent further attempts
        velocity.y = 0;
    }

    // Floor collision (keep this after wall collision)
    if (cameraContainer.position.y < playerHeight) {
        cameraContainer.position.y = playerHeight;
        velocity.y = 0;
        isOnGround = true;
    } else {
        // Only set to false if we're above the ground level
        // and not already on ground (to handle wall collisions)
        if (velocity.y !== 0) {
            isOnGround = false;
        }
    }

    // Update player mesh position
    player.position.copy(cameraContainer.position);
    player.position.y -= playerHeight / 2;
    
    // Reset horizontal velocity (for WASD control)
    velocity.x = 0;
    velocity.z = 0;
    
    prevTime = time;
    renderer.render(scene, camera);
}

// Add visual feedback for coin collection
function createCollectionEffect(position) {
    // Create particle effect for coin collection
    const particleCount = 15;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xFFD700 })
        );
        
        // Random position around coin
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.1 + Math.random() * 0.2;
        particle.position.set(
            position.x + Math.cos(angle) * radius,
            position.y,
            position.z + Math.sin(angle) * radius
        );
        
        // Random velocity
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 3 + 1,
                (Math.random() - 0.5) * 2
            ),
            age: 0,
            maxAge: 1 + Math.random() * 0.5
        };
        
        particles.add(particle);
    }
    
    scene.add(particles);
    
    // Remove particles after animation
    setTimeout(() => {
        scene.remove(particles);
    }, 1000);
    
    // Animate particles in the animation loop
    particles.userData = {
        update: function(delta) {
            let allDead = true;
            
            particles.children.forEach(particle => {
                if (particle.userData.age < particle.userData.maxAge) {
                    // Update position
                    particle.position.x += particle.userData.velocity.x * delta;
                    particle.position.y += particle.userData.velocity.y * delta;
                    particle.position.z += particle.userData.velocity.z * delta;
                    
                    // Apply gravity
                    particle.userData.velocity.y -= 9.8 * delta;
                    
                    // Age the particle
                    particle.userData.age += delta;
                    
                    // Fade out
                    const fadeRatio = 1 - (particle.userData.age / particle.userData.maxAge);
                    particle.material.opacity = fadeRatio;
                    particle.scale.set(fadeRatio, fadeRatio, fadeRatio);
                    
                    allDead = false;
                } else {
                    particle.visible = false;
                }
            });
            
            return !allDead;
        }
    };
    
    // Add to active particles list
    activeParticles.push(particles);
}

// Track active particle systems
const activeParticles = [];

// Update the animate function to also update particles
function updateParticles(delta) {
    for (let i = activeParticles.length - 1; i >= 0; i--) {
        const isAlive = activeParticles[i].userData.update(delta);
        if (!isAlive) {
            scene.remove(activeParticles[i]);
            activeParticles.splice(i, 1);
        }
    }
}

animate(); 
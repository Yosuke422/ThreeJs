import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { playerHeight, playerRadius, gravity, jumpVelocity, playerSpeed, getPlatformSize } from './config.js';
import { getLevelTheme, levelThemes } from './level.js';
import { getCurrentLevel } from './config.js';

// First person view variables
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let isOnGround = true;
let isJumping = false;
let jumpHeight = 0;
const maxJumpHeight = 1.0; // Maximum height player can jump

// Key mapping for controls
const keys = {
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false,
    Space: false
};

// Track if any movement has occurred
let hasMovementOccurred = false;

// Add a variable to track current theme
let currentTheme = null;

// Initialize footstep effects based on theme
const footstepEffects = {
    particles: [],
    lastStep: 0,
    stepInterval: 0.5,
    enabled: true
};

// Variables for Remy model and animations
let remyModel = null;
let remyMixer = null;
let runningAnimation = null;
let idleAnimation = null;
let jumpingAnimation = null;

// Create player in the scene
export function createPlayer(scene) {
    // Reset movement tracking when creating a new player
    hasMovementOccurred = false;
    
    // Create a camera container to separate rotation and position
    const cameraContainer = new THREE.Object3D();
    scene.add(cameraContainer);

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 25);
    camera.position.set(0, playerHeight * 0.3, 0); // Set camera very low - 30% of player height
    cameraContainer.add(camera); // Add camera to container

    // Create a container for Remy model
    const playerContainer = new THREE.Object3D();
    playerContainer.visible = false; // Hide the entire player model in first-person view
    scene.add(playerContainer);
    
    // Load Remy model
    const fbxLoader = new FBXLoader();
    console.log("Loading Remy model...");
    
    fbxLoader.load(
        'assets/Remy.fbx',
        (fbx) => {
            console.log("Remy model loaded successfully");
            
            // Scale the model to make it much smaller
            const scale = playerHeight / 10; // Make extremely small (1/10 of player height)
            fbx.scale.set(scale * 0.01, scale * 0.01, scale * 0.01);
            
            // Create animation mixer
            remyMixer = new THREE.AnimationMixer(fbx);
            
            // Add model to container
            playerContainer.add(fbx);
            remyModel = fbx;
            
            // Load running animation
            fbxLoader.load(
                'assets/Running.fbx',
                (runFbx) => {
                    console.log("Running animation loaded");
                    runningAnimation = remyMixer.clipAction(runFbx.animations[0]);
                    runningAnimation.play();
                    runningAnimation.enabled = false;
                }
            );
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error("Error loading Remy model:", error);
            
            // Fallback to basic geometry if model fails to load
            const playerGeometry = new THREE.CapsuleGeometry(playerRadius, playerHeight - playerRadius * 2, 1, 8);
            const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
            const player = new THREE.Mesh(playerGeometry, playerMaterial);
            player.position.y = playerHeight / 2;
            playerContainer.add(player);
        }
    );
    
    // Position the player container
    playerContainer.position.y = playerHeight / 2;

    // Return player objects
    return { cameraContainer, camera, player: playerContainer };
}

// Set up player controls
export function setupControls(cameraContainer, camera) {
    // Input handling
    document.addEventListener('keydown', (event) => {
        if (keys.hasOwnProperty(event.code)) {
            keys[event.code] = true;
            
            // Mark that movement has occurred when any movement key is pressed
            if (['KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(event.code)) {
                hasMovementOccurred = true;
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        if (keys.hasOwnProperty(event.code)) {
            keys[event.code] = false;
        }
    });

    // Mouse look controls for first-person view
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
    document.addEventListener('click', (event) => {
        // Don't request pointer lock if clicking on buttons, game completion messages, or loading indicators
        const clickedElement = event.target;
        const skipLockElements = ['BUTTON', 'INPUT'];
        
        if (skipLockElements.includes(clickedElement.tagName)) {
            console.log('Skipping pointer lock on button/input click');
            return;
        }
        
        // Check for UI elements that indicate level completion
        const uiElements = [
            'nextLevelButton', 
            'resetButton', 
            'levelCompleteMessage',
            'gameCompleteMessage',
            'loadingIndicator'
        ];
        
        // Don't lock if any of these UI elements exist (level is complete)
        for (const id of uiElements) {
            if (document.getElementById(id)) {
                console.log('Skipping pointer lock - UI elements for level completion exist');
                return;
            }
        }
        
        // Also prevent pointer lock if the click was inside a UI element even if it doesn't match by ID
        let parent = clickedElement;
        while (parent) {
            if (parent.style && 
                (parent.style.zIndex === '999' || parent.style.zIndex === '1000' || 
                 parent.id && uiElements.includes(parent.id))) {
                console.log('Skipping pointer lock - click was inside a UI element');
                return;
            }
            parent = parent.parentElement;
        }
        
        // If we made it here, it's safe to request pointer lock
        document.body.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement) {
            document.addEventListener('mousemove', onMouseMove, false);
        } else {
            document.removeEventListener('mousemove', onMouseMove, false);
        }
    });
}

// Check if player has moved
export function hasPlayerMoved() {
    return hasMovementOccurred;
}

// Reset player movement tracking (used when loading a new level)
export function resetPlayerMovement() {
    hasMovementOccurred = false;
}

// Update player position with physics and collision detection
export function updatePlayer(deltaTime, cameraContainer, player, checkWallCollisions) {
    const platformSize = getPlatformSize();
    
    // Apply gravity
    velocity.y -= gravity * deltaTime;

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
        isJumping = true;
        jumpHeight = 0;
        
        // Play jump sound effect if available
        if (window.playSound) {
            window.playSound('jump');
        }
    }

    // Track jump height - the maximum height reached during current jump
    if (!isOnGround) {
        jumpHeight = Math.max(jumpHeight, cameraContainer.position.y - playerHeight);
    } else {
        jumpHeight = 0;
        isJumping = false;
    }

    // Calculate new position
    const newPositionX = cameraContainer.position.x + velocity.x * deltaTime;
    const newPositionZ = cameraContainer.position.z + velocity.z * deltaTime;
    
    // Store current position for reverting if collision occurs
    const currentPosition = cameraContainer.position.clone();
    
    // We're not checking for obstacles anymore, only walls
    
    // Try moving on X axis
    if (Math.abs(newPositionX) < platformSize) {
        cameraContainer.position.x = newPositionX;
        // Check for wall collisions only
        if (checkWallCollisions(cameraContainer.position, playerRadius, false)) {
            cameraContainer.position.x = currentPosition.x;
        }
    }
    
    // Try moving on Z axis
    if (Math.abs(newPositionZ) < platformSize) {
        cameraContainer.position.z = newPositionZ;
        // Check for wall collisions only
        if (checkWallCollisions(cameraContainer.position, playerRadius, false)) {
            cameraContainer.position.z = currentPosition.z;
        }
    }
    
    // Update vertical position for jumping/falling
    const newPositionY = cameraContainer.position.y + velocity.y * deltaTime;
    
    // Store current Y position for reverting if collision occurs
    const currentY = cameraContainer.position.y;
    
    // Try moving on Y axis
    cameraContainer.position.y = newPositionY;
    
    // Check for wall collisions after vertical movement
    if (checkWallCollisions(cameraContainer.position, playerRadius, false)) {
        // If collision detected, revert to previous Y position
        cameraContainer.position.y = currentY;
        // Reset vertical velocity to prevent further attempts
        velocity.y = 0;
    }

    // Use a smaller playerHeight for collision with floor
    const adjustedPlayerHeight = playerHeight * 0.7;
    
    // Floor collision (keep this after wall collision)
    if (cameraContainer.position.y < adjustedPlayerHeight) {
        cameraContainer.position.y = adjustedPlayerHeight;
        velocity.y = 0;
        isOnGround = true;
        isJumping = false;
        
        // Play landing sound if we were jumping
        if (jumpHeight > 0.1 && window.playSound) {
            window.playSound('land');
        }
    } else {
        // Only set to false if we're above the ground level
        // and not already on ground (to handle wall collisions)
        if (velocity.y !== 0) {
            isOnGround = false;
        }
    }

    // Update Remy model position to match camera container
    // Since we're in first-person, we don't actually need to see the model,
    // but we'll update it anyway for collision detection and animations
    player.position.copy(cameraContainer.position);
    player.position.y -= adjustedPlayerHeight / 2; // Adjust to ground level
    
    // Update Remy's rotation to match movement direction
    if ((velocity.x !== 0 || velocity.z !== 0) && remyModel) {
        // Calculate angle based on movement direction
        const angle = Math.atan2(velocity.x, velocity.z);
        player.rotation.y = angle;
    }
    
    // Update Remy's animations - even though we don't see them,
    // the animation mixer still needs to be updated
    if (remyMixer) {
        // Update animation mixer
        remyMixer.update(deltaTime);
        
        // Control running animation based on movement
        const isMoving = Math.abs(velocity.x) > 0.01 || Math.abs(velocity.z) > 0.01;
        
        if (runningAnimation) {
            if (isMoving && isOnGround) {
                // Enable running animation when moving on ground
                if (!runningAnimation.isRunning()) {
                    runningAnimation.play();
                    runningAnimation.enabled = true;
                }
            } else {
                // Disable running animation when not moving
                if (runningAnimation.isRunning()) {
                    runningAnimation.enabled = false;
                }
            }
        }
    }
    
    // Reset horizontal velocity (for WASD control)
    velocity.x = 0;
    velocity.z = 0;

    // Update current theme reference
    if (!currentTheme) {
        currentTheme = getLevelTheme(getCurrentLevel());
    }

    // Check if we've moved significantly
    const movedDistance = Math.sqrt(
        Math.pow(velocity.x, 2) + 
        Math.pow(velocity.z, 2));
    
    // If player is moving, create footstep effects
    if (movedDistance > 0.001 && footstepEffects.enabled) {
        footstepEffects.lastStep += deltaTime;
        
        // Create footstep effect every stepInterval seconds
        if (footstepEffects.lastStep >= footstepEffects.stepInterval) {
            // Reset timer
            footstepEffects.lastStep = 0;
            
            // Only create footstep effects when on ground
            if (isOnGround) {
                createFootstepEffect(cameraContainer.position, currentTheme);
            }
        }
    }
    
    // Return player state including if jumping
    return {
        isJumping,
        isOnGround,
        jumpHeight,
        position: cameraContainer.position.clone()
    };
}

// Create a visual effect when player takes a step
function createFootstepEffect(position, theme) {
    if (!theme || !window.gameScene) return;
    
    const scene = window.gameScene;
    
    // Choose the effect based on theme
    switch(theme.name) {
        case "Forest":
            createDustPuff(scene, position, 0x33522D, 0.3);
            break;
        case "Desert":
            createDustPuff(scene, position, 0xD2B48C, 0.5);
            break;
        case "Cave":
            createDustPuff(scene, position, 0x555555, 0.3);
            break;
        case "Ice":
            createIceCrack(scene, position);
            break;
        case "Volcano":
            createHeatWave(scene, position);
            break;
        case "Alien":
            createGlowRipple(scene, position, 0x00ff77);
            break;
        case "Ocean":
            createWaterRipple(scene, position);
            break;
        case "Neon":
            createGlowRipple(scene, position, 0x00ffff);
            break;
        case "Sunset":
            createDustPuff(scene, position, 0xBA6E5D, 0.3);
            break;
        case "Space":
            createGlowRipple(scene, position, 0x6666ff);
            break;
    }
}

// Create a dust puff effect
function createDustPuff(scene, position, color = 0xD2B48C, intensity = 0.5) {
    const count = 5 + Math.floor(Math.random() * 5);
    const particles = [];
    
    for (let i = 0; i < count; i++) {
        // Create dust particle
        const geometry = new THREE.SphereGeometry(0.03, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7 * intensity
        });
        
        const particle = new THREE.Mesh(geometry, material);
        
        // Position at player's feet
        particle.position.set(
            position.x + (Math.random() * 0.3 - 0.15),
            0.05 + Math.random() * 0.1,
            position.z + (Math.random() * 0.3 - 0.15)
        );
        
        // Random scale
        const scale = 0.5 + Math.random() * 1.0;
        particle.scale.set(scale, scale, scale);
        
        // Store movement data
        particle.userData = {
            velocity: {
                x: (Math.random() * 2 - 1) * 0.2,
                y: 0.1 + Math.random() * 0.2,
                z: (Math.random() * 2 - 1) * 0.2
            },
            age: 0,
            lifetime: 0.5 + Math.random() * 0.5
        };
        
        scene.add(particle);
        particles.push(particle);
        footstepEffects.particles.push(particle);
    }
}

// Create ice crack effect
function createIceCrack(scene, position) {
    // Create circle geometry for ice crack
    const geometry = new THREE.CircleGeometry(0.2, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0xADEEFF,
        transparent: true,
        opacity: 0.7
    });
    
    const crack = new THREE.Mesh(geometry, material);
    crack.rotation.x = -Math.PI / 2; // Lay flat
    crack.position.set(position.x, 0.01, position.z);
    
    // Store animation data
    crack.userData = {
        age: 0,
        lifetime: 1.0,
        initialScale: 0.1
    };
    
    // Start small
    crack.scale.set(0.1, 0.1, 0.1);
    
    scene.add(crack);
    footstepEffects.particles.push(crack);
}

// Create heat wave effect
function createHeatWave(scene, position) {
    const geometry = new THREE.CircleGeometry(0.15, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0xFF3300,
        transparent: true,
        opacity: 0.3
    });
    
    const wave = new THREE.Mesh(geometry, material);
    wave.rotation.x = -Math.PI / 2; // Lay flat
    wave.position.set(position.x, 0.05, position.z);
    
    // Store animation data
    wave.userData = {
        age: 0,
        lifetime: 0.7,
        initialScale: 0.2
    };
    
    // Start small
    wave.scale.set(0.2, 0.2, 0.2);
    
    scene.add(wave);
    footstepEffects.particles.push(wave);
}

// Create glowing ripple effect
function createGlowRipple(scene, position, color) {
    const geometry = new THREE.RingGeometry(0.1, 0.15, 16);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    const ripple = new THREE.Mesh(geometry, material);
    ripple.rotation.x = -Math.PI / 2; // Lay flat
    ripple.position.set(position.x, 0.02, position.z);
    
    // Store animation data
    ripple.userData = {
        age: 0,
        lifetime: 0.8,
        initialScale: 0.5
    };
    
    // Start small
    ripple.scale.set(0.5, 0.5, 0.5);
    
    scene.add(ripple);
    footstepEffects.particles.push(ripple);
}

// Create water ripple effect
function createWaterRipple(scene, position) {
    // Create multiple expanding rings
    const count = 2;
    
    for (let i = 0; i < count; i++) {
        const delay = i * 0.2; // Stagger the ripples
        const size = 0.1 + i * 0.05;
        
        const geometry = new THREE.RingGeometry(size, size + 0.02, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00AAFF,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const ripple = new THREE.Mesh(geometry, material);
        ripple.rotation.x = -Math.PI / 2; // Lay flat
        ripple.position.set(position.x, 0.02, position.z);
        
        // Store animation data with delay
        ripple.userData = {
            age: -delay, // Negative age for delay
            lifetime: 1.0,
            initialScale: 0.4
        };
        
        // Start small
        ripple.scale.set(0.4, 0.4, 0.4);
        
        scene.add(ripple);
        footstepEffects.particles.push(ripple);
    }
}

// Update all footstep effects
export function updateFootstepEffects(deltaTime) {
    // Update each particle
    for (let i = footstepEffects.particles.length - 1; i >= 0; i--) {
        const particle = footstepEffects.particles[i];
        
        // Update age
        particle.userData.age += deltaTime;
        
        // Check if expired
        if (particle.userData.age >= particle.userData.lifetime) {
            // Remove from scene and list
            if (particle.parent) particle.parent.remove(particle);
            footstepEffects.particles.splice(i, 1);
            continue;
        }
        
        // If age is negative, this is a delayed effect
        if (particle.userData.age < 0) continue;
        
        // Calculate life progress (0 to 1)
        const lifeProgress = particle.userData.age / particle.userData.lifetime;
        
        // Handle different effect types
        if (particle.geometry.type === 'SphereGeometry') {
            // Dust puff particles
            
            // Move upward and outward
            if (particle.userData.velocity) {
                particle.position.x += particle.userData.velocity.x * deltaTime;
                particle.position.y += particle.userData.velocity.y * deltaTime;
                particle.position.z += particle.userData.velocity.z * deltaTime;
            }
            
            // Fade out
            particle.material.opacity = 0.7 * (1 - lifeProgress);
            
        } else if (particle.geometry.type === 'CircleGeometry') {
            // Ice crack or heat wave
            
            // Grow larger
            const newScale = particle.userData.initialScale + lifeProgress * 1.5;
            particle.scale.set(newScale, newScale, newScale);
            
            // Fade out
            particle.material.opacity = 0.7 * (1 - lifeProgress);
            
        } else if (particle.geometry.type === 'RingGeometry') {
            // Ripple effect
            
            // Expand outward
            const newScale = particle.userData.initialScale + lifeProgress * 3.0;
            particle.scale.set(newScale, newScale, newScale);
            
            // Fade out
            particle.material.opacity = 0.7 * (1 - lifeProgress);
        }
    }
}

// Check if player is jumping
export function isPlayerJumping() {
    return isJumping;
}

// Get current jump height
export function getJumpHeight() {
    return jumpHeight;
}

// Show a hint to jump when hitting an obstacle
function showJumpHint() {
    // Remove existing hint if it exists
    const existingHint = document.getElementById('jumpHint');
    if (existingHint) {
        existingHint.remove();
    }
    
    // Create hint element
    const hint = document.createElement('div');
    hint.id = 'jumpHint';
    hint.style.position = 'absolute';
    hint.style.top = '30%';
    hint.style.left = '50%';
    hint.style.transform = 'translate(-50%, -50%)';
    hint.style.color = 'white';
    hint.style.fontFamily = 'Arial, sans-serif';
    hint.style.fontSize = '24px';
    hint.style.fontWeight = 'bold';
    hint.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    hint.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hint.style.padding = '15px';
    hint.style.borderRadius = '10px';
    hint.style.zIndex = '999';
    hint.style.pointerEvents = 'none'; // Don't interfere with clicking
    hint.innerHTML = 'Press SPACE to jump over obstacles!';
    
    // Add to body
    document.body.appendChild(hint);
    
    // Remove after 2 seconds
    setTimeout(() => {
        if (hint.parentNode) {
            hint.style.opacity = '0';
            hint.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (hint.parentNode) {
                    hint.parentNode.removeChild(hint);
                }
            }, 500);
        }
    }, 2000);
}

// Export function to get player jumping state
export function getPlayerState() {
    return {
        isJumping,
        isOnGround,
        jumpHeight
    };
} 
import * as THREE from 'three';
import { getNumCoins } from './config.js';

// Coin-related variables
let coins = [];
let coinsCollected = 0;
let activeParticles = [];
let coinCountElement;

// Create coins based on valid positions
export function createCoins(scene, validCoinPositions) {
    // Get the current number of coins for this level
    const numCoins = getNumCoins();
    
    // Shuffle the array of valid positions
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Shuffle the positions first
    const shuffledPositions = shuffleArray([...validCoinPositions]);
    
    // Select positions that aren't too close to each other
    const minDistanceBetweenCoins = 4.0; // Minimum distance between coins in world units
    const selectedPositions = [];
    
    // Try to find enough positions that satisfy the minimum distance requirement
    for (const pos of shuffledPositions) {
        // Check if this position is far enough from all previously selected positions
        let isFarEnough = true;
        
        for (const selectedPos of selectedPositions) {
            const distance = Math.sqrt(
                Math.pow(pos.x - selectedPos.x, 2) + 
                Math.pow(pos.z - selectedPos.z, 2)
            );
            
            if (distance < minDistanceBetweenCoins) {
                isFarEnough = false;
                break;
            }
        }
        
        // If this position is far enough from others, add it to the selected positions
        if (isFarEnough) {
            selectedPositions.push(pos);
            
            // Stop once we have enough positions
            if (selectedPositions.length >= numCoins) {
                break;
            }
        }
    }
    
    // If we couldn't find enough positions with the minimum distance,
    // fill the remaining slots with positions closest to satisfying the requirement
    if (selectedPositions.length < numCoins) {
        console.log("Warning: Could not find enough positions with the minimum distance requirement. Using fallback positions.");
        
        // For each remaining shuffled position
        for (const pos of shuffledPositions) {
            // Skip if this position is already selected
            if (selectedPositions.some(selected => selected.x === pos.x && selected.z === pos.z)) {
                continue;
            }
            
            // Find the minimum distance to any already selected position
            let minDistance = Infinity;
            for (const selectedPos of selectedPositions) {
                const distance = Math.sqrt(
                    Math.pow(pos.x - selectedPos.x, 2) + 
                    Math.pow(pos.z - selectedPos.z, 2)
                );
                minDistance = Math.min(minDistance, distance);
            }
            
            // Add it as a candidate position with its minimum distance
            const candidate = { pos, minDistance };
            
            // Add candidates to a list, sort by distance (descending), and take what we need
            const candidates = [];
            candidates.push(candidate);
            candidates.sort((a, b) => b.minDistance - a.minDistance);
            
            // Take this position if it's the best we've seen so far
            if (candidates.length > 0) {
                selectedPositions.push(pos);
                
                // Stop once we have enough positions
                if (selectedPositions.length >= numCoins) {
                    break;
                }
            }
        }
    }
    
    // Create coins and add them to the scene
    coins = [];
    coinsCollected = 0;
    
    // Create a text element to display the count of collected coins
    coinCountElement = document.createElement('div');
    coinCountElement.style.position = 'absolute';
    coinCountElement.style.top = '20px';
    coinCountElement.style.left = '20px';
    coinCountElement.style.color = 'white';
    coinCountElement.style.fontFamily = 'Arial, sans-serif';
    coinCountElement.style.fontSize = '24px';
    coinCountElement.style.fontWeight = 'bold';
    coinCountElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    coinCountElement.id = 'coinCountElement';
    coinCountElement.innerHTML = `Coins: 0 / ${numCoins}`;
    document.body.appendChild(coinCountElement);
    
    // Create the coins using the selected positions
    selectedPositions.forEach((pos, index) => {
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
        
        // Position coin at the selected position
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
    
    return { coins, coinSpotlight };
}

// Update coins (animation and collection)
export function updateCoins(time, cameraContainer) {
    // Get the current number of coins for this level
    const numCoins = getNumCoins();
    
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
                
                // Add visual feedback - pass coin's position as clone
                const coinPosition = coin.position.clone();
                createCollectionEffect(coinPosition);
            }
            
            // Check if this is the nearest coin to the player
            if (horizontalDistance < nearestCoinDistance) {
                nearestCoinDistance = horizontalDistance;
                nearestCoin = coin;
            }
        }
    });
    
    return { nearestCoin, nearestCoinDistance, coinsCollected };
}

// Add visual feedback for coin collection
export function createCollectionEffect(position) {
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
    
    // We need to access the scene from outside
    // Using a global variable to store the scene reference
    if (window.gameScene) {
        window.gameScene.add(particles);
    }
    
    // Remove particles after animation
    setTimeout(() => {
        if (window.gameScene && particles.parent) {
            window.gameScene.remove(particles);
        }
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

// Update particle effects
export function updateParticles(delta) {
    for (let i = activeParticles.length - 1; i >= 0; i--) {
        const isAlive = activeParticles[i].userData.update(delta);
        if (!isAlive) {
            if (window.gameScene && activeParticles[i].parent) {
                window.gameScene.remove(activeParticles[i]);
            }
            activeParticles.splice(i, 1);
        }
    }
}

// Get current collection state
export function getCollectionState() {
    const numCoins = getNumCoins();
    return { coinsCollected, numCoins };
} 
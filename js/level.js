import * as THREE from 'three';
import { mazeLevels, getCurrentLevel, getMazeLayout, getNumCoins, getNumCoinsForLevel } from './config.js';

// Define level themes - color schemes for each level
export const levelThemes = {
    // Forest theme
    "Forest": {
        name: "Forest",
        skyColor: 0x90C3D4,
        platformColor: 0x2E4D1B,
        wallColor: 0x5D4037,
        fogColor: 0xB4D88E,
        fogDensity: 0.03,
        wallTexture: 'wood',
        wallHeight: 2.8,
        wallRoughness: 0.9,
        wallMetalness: 0.1,
        wallBevelSize: 0.05,
        wallToppers: true,
        wallEmissive: 0x000000,
        wallPattern: 'default',
        wallBumpScale: 0.2,
        platformTexture: 'stone',
        platformRoughness: 0.9,
        platformMetalness: 0.1,
        obstacleColor: 0x3E2723, // Dark brown for fallen logs
        spearColor: 0x6D4C41, // Wooden spears
        spearMetalness: 0.1,
        spearRoughness: 0.9,
        spearEmissive: 0x000000
    },
    // Desert theme
    "Desert": {
        name: "Desert",
        skyColor: 0xFFE6B3,
        platformColor: 0xE8C39E,
        wallColor: 0xD2B48C,
        fogColor: 0xFFE6B3,
        fogDensity: 0.02,
        wallTexture: 'sand',
        wallHeight: 2.3,
        wallRoughness: 1.0,
        wallMetalness: 0.0,
        wallBevelSize: 0.0,
        wallToppers: false,
        wallEmissive: 0x000000,
        wallPattern: 'weathered',
        wallBumpScale: 0.05,
        platformTexture: 'sand',
        platformRoughness: 1.0,
        platformMetalness: 0.0,
        obstacleColor: 0xBF8040 // Sand dune color
    },
    // Cave theme
    "Cave": {
        name: "Cave",
        skyColor: 0x2C2C2F,
        platformColor: 0x2E2E32,
        wallColor: 0x52545A,
        fogColor: 0x000000,
        fogDensity: 0.06,
        wallTexture: 'stone',
        wallHeight: 3.0,
        wallRoughness: 0.95,
        wallMetalness: 0.2,
        wallBevelSize: 0.0,
        wallToppers: false,
        wallEmissive: 0x000000,
        wallPattern: 'cracked',
        wallBumpScale: 0.3,
        platformTexture: 'stone',
        platformRoughness: 0.95,
        platformMetalness: 0.2,
        obstacleColor: 0x36454F // Dark slate for stalagmites
    },
    // Ice theme
    "Ice": {
        name: "Ice",
        skyColor: 0xD0E7F5,
        platformColor: 0xA1D6E2,
        wallColor: 0xBCE5F9,
        fogColor: 0xECF9FF,
        fogDensity: 0.04,
        wallTexture: 'ice',
        wallHeight: 2.6,
        wallRoughness: 0.3,
        wallMetalness: 0.7,
        wallBevelSize: 0.0,
        wallToppers: false,
        wallEmissive: 0x88CCFF,
        wallPattern: 'default',
        wallBumpScale: 0.05,
        platformTexture: 'ice',
        platformRoughness: 0.1,
        platformMetalness: 0.9,
        obstacleColor: 0xADD8E6 // Ice blocks with high transparency
    },
    // Volcano theme
    "Volcano": {
        name: "Volcano",
        skyColor: 0x3C1518,
        platformColor: 0x5E2129,
        wallColor: 0x932020,
        fogColor: 0x280C0B,
        fogDensity: 0.05,
        wallTexture: 'lava',
        wallHeight: 2.9,
        wallRoughness: 0.8,
        wallMetalness: 0.3,
        wallBevelSize: 0.1,
        wallToppers: false,
        wallEmissive: 0xFF5500,
        wallPattern: 'cracked',
        wallBumpScale: 0.15,
        platformTexture: 'stone',
        platformRoughness: 0.9,
        platformMetalness: 0.3,
        obstacleColor: 0x800000 // Dark red for cooled lava
    },
    // Alien theme
    "Alien": {
        name: "Alien",
        skyColor: 0x0A1A2A,
        platformColor: 0x143642,
        wallColor: 0x1A472A,
        fogColor: 0x0F2F2F,
        fogDensity: 0.05,
        wallTexture: 'alien',
        wallHeight: 3.1,
        wallRoughness: 0.4,
        wallMetalness: 0.7,
        wallBevelSize: 0.1,
        wallToppers: true,
        wallEmissive: 0x00FF77,
        wallPattern: 'panel',
        wallBumpScale: 0.1,
        platformTexture: 'alien',
        platformRoughness: 0.5,
        platformMetalness: 0.6,
        obstacleColor: 0x00FF55 // Bright alien green
    },
    // Ocean theme
    "Ocean": {
        name: "Ocean",
        skyColor: 0x7EC0EE,
        platformColor: 0x4A6670,
        wallColor: 0xFF6F61,
        fogColor: 0x7FCDFF,
        fogDensity: 0.02,
        wallTexture: 'coral',
        wallHeight: 2.5,
        wallRoughness: 0.8,
        wallMetalness: 0.2,
        wallBevelSize: 0.0,
        wallToppers: true,
        wallEmissive: 0xFF0000,
        wallPattern: 'default',
        wallBumpScale: 0.2,
        platformTexture: 'sand',
        platformRoughness: 0.9,
        platformMetalness: 0.1,
        obstacleColor: 0x4682B4 // Steel blue for coral formations
    },
    // Neon theme
    "Neon": {
        name: "Neon",
        skyColor: 0x000000,
        platformColor: 0x282828,
        wallColor: 0x252525,
        fogColor: 0x000000,
        fogDensity: 0.05,
        wallTexture: 'neon',
        wallHeight: 2.7,
        wallRoughness: 0.2,
        wallMetalness: 0.9,
        wallBevelSize: 0.0,
        wallToppers: false,
        wallEmissive: 0x00FFFF,
        wallPattern: 'grid',
        wallBumpScale: 0.0,
        platformTexture: 'neon',
        platformRoughness: 0.2,
        platformMetalness: 0.9,
        obstacleColor: 0xFF00FF // Bright magenta for neon barriers
    },
    // Sunset theme
    "Sunset": {
        name: "Sunset",
        skyColor: 0xFF9966,
        platformColor: 0x896E69,
        wallColor: 0xBA6E5D,
        fogColor: 0xFFCB8E,
        fogDensity: 0.04,
        wallTexture: 'brick',
        wallHeight: 2.6,
        wallRoughness: 0.7,
        wallMetalness: 0.1,
        wallBevelSize: 0.05,
        wallToppers: false,
        wallEmissive: 0xFF6A00,
        wallPattern: 'panel',
        wallBumpScale: 0.1,
        platformTexture: 'stone',
        platformRoughness: 0.8,
        platformMetalness: 0.1,
        obstacleColor: 0xDAA520 // Golden obstacles
    },
    // Space theme
    "Space": {
        name: "Space",
        skyColor: 0x000011,
        platformColor: 0x1A1A2E,
        wallColor: 0x16213E,
        fogColor: 0x000000,
        fogDensity: 0.01,
        wallTexture: 'metal',
        wallHeight: 3.0,
        wallRoughness: 0.3,
        wallMetalness: 0.9,
        wallBevelSize: 0.1,
        wallToppers: false,
        wallEmissive: 0x0066FF,
        wallPattern: 'panel',
        wallBumpScale: 0.05,
        platformTexture: 'metal',
        platformRoughness: 0.3,
        platformMetalness: 0.9,
        obstacleColor: 0x6A5ACD // Slate blue for space debris
    }
};

// Level management
export function createLevelUI() {
    // Create level indicator
    const levelIndicator = document.createElement('div');
    levelIndicator.id = 'levelIndicator';
    levelIndicator.style.position = 'absolute';
    levelIndicator.style.top = '20px';
    levelIndicator.style.right = '20px';
    levelIndicator.style.color = 'white';
    levelIndicator.style.fontFamily = 'Arial, sans-serif';
    levelIndicator.style.fontSize = '24px';
    levelIndicator.style.fontWeight = 'bold';
    levelIndicator.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    levelIndicator.innerHTML = `Level: ${getCurrentLevel() + 1} / ${mazeLevels.length}`;
    document.body.appendChild(levelIndicator);
    
    return levelIndicator;
}

// Create next level button
export function createNextLevelButton(callback) {
    // Remove existing button if present
    const existingButton = document.getElementById('nextLevelButton');
    if (existingButton) {
        existingButton.remove();
    }
    
    const nextLevelButton = document.createElement('button');
    nextLevelButton.id = 'nextLevelButton';
    nextLevelButton.innerText = 'Next Level';
    nextLevelButton.style.position = 'absolute';
    nextLevelButton.style.top = 'calc(50% + 100px)'; // Below win message
    nextLevelButton.style.left = '50%';
    nextLevelButton.style.transform = 'translateX(-50%)';
    nextLevelButton.style.padding = '15px 30px';
    nextLevelButton.style.backgroundColor = '#4CAF50';
    nextLevelButton.style.color = 'white';
    nextLevelButton.style.border = 'none';
    nextLevelButton.style.borderRadius = '5px';
    nextLevelButton.style.fontSize = '20px';
    nextLevelButton.style.fontWeight = 'bold';
    nextLevelButton.style.cursor = 'pointer';
    nextLevelButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    nextLevelButton.style.zIndex = '1000'; // Ensure button is on top
    nextLevelButton.style.pointerEvents = 'auto'; // Ensure click events are captured
    
    // Add text to show it's clickable
    nextLevelButton.innerHTML = 'Next Level ►';
    
    // Add a loading state
    let isLoading = false;
    
    // Hover effects
    nextLevelButton.onmouseenter = () => {
        if (!isLoading) {
            nextLevelButton.style.backgroundColor = '#45a049';
            nextLevelButton.style.transform = 'translateX(-50%) scale(1.05)';
        }
    };
    nextLevelButton.onmouseleave = () => {
        if (!isLoading) {
            nextLevelButton.style.backgroundColor = '#4CAF50';
            nextLevelButton.style.transform = 'translateX(-50%) scale(1)';
        }
    };
    
    // Create a global click handler that works with any click method
    const handleButtonClick = (event) => {
        // Prevent any propagation and default behaviors
        event.preventDefault();
        event.stopPropagation();
        
        // Prevent multiple clicks
        if (isLoading) return;
        isLoading = true;
        
        // Show loading state
        nextLevelButton.style.backgroundColor = '#999999';
        nextLevelButton.innerHTML = 'Loading...';
        nextLevelButton.style.cursor = 'wait';
        
        console.log('Next level button clicked - loading next level');
        
        // Remove button from DOM immediately to prevent further clicks
        setTimeout(() => {
            if (nextLevelButton.parentNode) {
                nextLevelButton.parentNode.removeChild(nextLevelButton);
            }
            
            // Remove level complete message
            const levelCompleteMessage = document.getElementById('levelCompleteMessage');
            if (levelCompleteMessage && levelCompleteMessage.parentNode) {
                levelCompleteMessage.parentNode.removeChild(levelCompleteMessage);
            }
            
            // Execute callback immediately - no delay needed
            if (typeof callback === 'function') {
                callback();
            }
        }, 10);
    };
    
    // Add all possible event listeners for maximum compatibility
    nextLevelButton.addEventListener('click', handleButtonClick);
    nextLevelButton.addEventListener('mousedown', handleButtonClick);
    nextLevelButton.addEventListener('touchstart', handleButtonClick);
    
    // Make the button a direct child of body for better click handling
    document.body.appendChild(nextLevelButton);
    
    // Set tabindex and focus to ensure it can be activated with keyboard too
    nextLevelButton.tabIndex = 0;
    nextLevelButton.focus();
    
    return nextLevelButton;
}

// Create level complete message
export function createLevelCompleteMessage(level) {
    // Remove existing message if present
    const existingMessage = document.getElementById('levelCompleteMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const levelCompleteMessage = document.createElement('div');
    levelCompleteMessage.id = 'levelCompleteMessage';
    levelCompleteMessage.style.position = 'absolute';
    levelCompleteMessage.style.top = '50%';
    levelCompleteMessage.style.left = '50%';
    levelCompleteMessage.style.transform = 'translate(-50%, -50%)';
    levelCompleteMessage.style.color = 'white';
    levelCompleteMessage.style.fontFamily = 'Arial, sans-serif';
    levelCompleteMessage.style.fontSize = '48px';
    levelCompleteMessage.style.fontWeight = 'bold';
    levelCompleteMessage.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    levelCompleteMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    levelCompleteMessage.style.padding = '20px';
    levelCompleteMessage.style.borderRadius = '10px';
    levelCompleteMessage.style.textAlign = 'center';
    levelCompleteMessage.style.zIndex = '999'; // High z-index to ensure visibility
    
    if (level === mazeLevels.length - 1) {
        // Final level completed
        levelCompleteMessage.innerHTML = 'CONGRATULATIONS!<br>You completed all levels!';
    } else {
        levelCompleteMessage.innerHTML = `LEVEL ${level + 1} COMPLETE!<br>All coins collected!`;
    }
    
    document.body.appendChild(levelCompleteMessage);
    return levelCompleteMessage;
}

// Helper function to update the level indicator
export function updateLevelIndicator(levelIndicator) {
    if (levelIndicator) {
        levelIndicator.innerHTML = `Level: ${getCurrentLevel() + 1} / ${mazeLevels.length}`;
    }
}

// Helper function to clean up UI elements between levels
export function cleanupLevelUI() {
    // Remove win message if present
    const winMessage = document.getElementById('winMessage');
    if (winMessage) {
        winMessage.remove();
    }
    
    // Remove coin message if present
    const coinMessage = document.getElementById('coinMessage');
    if (coinMessage) {
        coinMessage.remove();
    }
    
    // Remove level complete message if present
    const levelCompleteMessage = document.getElementById('levelCompleteMessage');
    if (levelCompleteMessage) {
        levelCompleteMessage.remove();
    }
}

// Check if there are more levels
export function hasNextLevel() {
    return getCurrentLevel() < mazeLevels.length - 1;
}

// Get next level details
export function getNextLevel() {
    if (hasNextLevel()) {
        return {
            level: getCurrentLevel() + 1,
            layout: mazeLevels[getCurrentLevel() + 1],
            numCoins: getNumCoinsForLevel(getCurrentLevel() + 1)
        };
    }
    return null;
}

// Create game complete message (for finishing all levels)
export function createGameCompleteMessage() {
    const gameCompleteMessage = document.createElement('div');
    gameCompleteMessage.id = 'gameCompleteMessage';
    gameCompleteMessage.style.position = 'absolute';
    gameCompleteMessage.style.top = '50%';
    gameCompleteMessage.style.left = '50%';
    gameCompleteMessage.style.transform = 'translate(-50%, -50%)';
    gameCompleteMessage.style.color = 'white';
    gameCompleteMessage.style.fontFamily = 'Arial, sans-serif';
    gameCompleteMessage.style.fontSize = '48px';
    gameCompleteMessage.style.fontWeight = 'bold';
    gameCompleteMessage.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    gameCompleteMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    gameCompleteMessage.style.padding = '20px';
    gameCompleteMessage.style.borderRadius = '10px';
    gameCompleteMessage.style.textAlign = 'center';
    gameCompleteMessage.style.zIndex = '999'; // High z-index to ensure visibility
    gameCompleteMessage.innerHTML = 'CONGRATULATIONS!<br>You completed all levels!<br>You are a maze master!';
    
    document.body.appendChild(gameCompleteMessage);
    
    // Add a reset button to start over
    const resetButton = document.createElement('button');
    resetButton.id = 'resetButton';
    resetButton.innerText = 'Play Again';
    resetButton.style.position = 'absolute';
    resetButton.style.top = 'calc(50% + 100px)';
    resetButton.style.left = '50%';
    resetButton.style.transform = 'translateX(-50%)';
    resetButton.style.padding = '15px 30px';
    resetButton.style.backgroundColor = '#4CAF50';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '5px';
    resetButton.style.fontSize = '20px';
    resetButton.style.fontWeight = 'bold';
    resetButton.style.cursor = 'pointer';
    resetButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    resetButton.style.zIndex = '1000'; // Higher z-index than message
    
    // Hover effects
    resetButton.onmouseenter = () => {
        resetButton.style.backgroundColor = '#45a049';
    };
    resetButton.onmouseleave = () => {
        resetButton.style.backgroundColor = '#4CAF50';
    };
    
    // Click effect
    resetButton.onmousedown = () => {
        resetButton.style.transform = 'translateX(-50%) scale(0.95)';
    };
    resetButton.onmouseup = () => {
        resetButton.style.transform = 'translateX(-50%) scale(1)';
    };
    
    document.body.appendChild(resetButton);
    
    // Focus the button to ensure it can be activated
    setTimeout(() => {
        resetButton.focus();
    }, 100);
    
    return { gameCompleteMessage, resetButton };
}

// Function to get the theme for the current level
export function getLevelTheme(level) {
    // Add null check for levelThemes
    if (!levelThemes) {
        // Return a default theme if levelThemes is undefined
        return {
            name: "Default",
            skyColor: 0x87ceeb,
            platformColor: 0x444444,
            wallColor: 0x777777,
            fogColor: 0x87ceeb,
            fogDensity: 0.01,
            darknessLevel: 0.2,
            hasFogOfWar: false,
            hasLightningFlashes: false,
            hasReducedVisibility: false
        };
    }
    
    // Get the available theme keys, handle empty object case
    const themes = Object.keys(levelThemes);
    if (!themes || themes.length === 0) {
        // Return default theme if there are no themes
        return {
            name: "Default",
            skyColor: 0x87ceeb,
            platformColor: 0x444444,
            wallColor: 0x777777,
            fogColor: 0x87ceeb,
            fogDensity: 0.01,
            darknessLevel: 0.2
        };
    }
    
    const themeIndex = level % themes.length;
    const themeName = themes[themeIndex];
    const theme = levelThemes[themeName] || {
        name: "Default",
        skyColor: 0x87ceeb,
        platformColor: 0x444444,
        wallColor: 0x777777,
        fogColor: 0x87ceeb,
        fogDensity: 0.01
    };
    
    // Apply level-based difficulty modifiers to the theme
    const difficultyModifiers = {
        // Default values for level 1
        fogDensity: theme.fogDensity || 0.01,
        visibility: 20,
        
        // Special level features
        hasFogOfWar: level >= 6,
        hasLightningFlashes: level >= 8,
        hasReducedVisibility: level >= 4,
        
        // Visual difficulty settings
        darknessLevel: Math.min(0.7, 0.2 + (level * 0.05)),
        
        // Gameplay modifiers
        coinShrinkFactor: Math.max(0.5, 1 - (level * 0.05)), // Coins get smaller
        coinRotationSpeed: 1 + (level * 0.2), // Coins spin faster
        jumpControl: Math.max(0.6, 1 - (level * 0.04)), // Less air control
    };
    
    // Modify fog density based on level (gets denser in higher levels)
    if (level >= 4) {
        difficultyModifiers.fogDensity = theme.fogDensity * (1 + (level - 3) * 0.3);
    }
    
    // Reduce visibility in higher levels
    if (level >= 4) {
        difficultyModifiers.visibility = Math.max(10, 20 - (level - 3) * 1.5);
    }
    
    // Create a new theme object with the base theme and difficulty modifiers
    return {
        ...theme,
        ...difficultyModifiers,
        level // Include the level number for reference
    };
} 
import { initGame } from './game.js';
import * as THREE from 'three';

let menuScene, menuCamera, menuRenderer, menuCube;
let animationFrameId;

// Initialize a basic Three.js scene for the menu background
function initMenuBackground() {
    // Create scene
    menuScene = new THREE.Scene();
    
    // Create camera
    menuCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    menuCamera.position.z = 5;
    
    // Create renderer
    menuRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    menuRenderer.setSize(window.innerWidth, window.innerHeight);
    menuRenderer.setClearColor(0x000000, 0); // transparent background
    document.body.appendChild(menuRenderer.domElement);
    
    // Create a maze-like structure in the background
    createMazeBackground();
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    menuScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    menuScene.add(directionalLight);
    
    // Start animation
    animateMenuBackground();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        menuCamera.aspect = window.innerWidth / window.innerHeight;
        menuCamera.updateProjectionMatrix();
        menuRenderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Create a maze-like structure for the background
function createMazeBackground() {
    // Create a group to hold all maze elements
    const mazeGroup = new THREE.Group();
    
    // Create a simple maze-like structure with cubes
    const size = 0.5;
    const spacing = 1.2;
    const matrix = [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
    ];
    
    const cubeGeometry = new THREE.BoxGeometry(size, size, size);
    
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] === 1) {
                const wallMaterial = new THREE.MeshStandardMaterial({
                    color: 0x4CAF50,
                    roughness: 0.7,
                    metalness: 0.2
                });
                
                const cube = new THREE.Mesh(cubeGeometry, wallMaterial);
                cube.position.set(
                    (j - matrix[i].length / 2) * spacing,
                    (i - matrix.length / 2) * spacing,
                    0
                );
                
                mazeGroup.add(cube);
            }
        }
    }
    
    // Add maze group to scene
    menuScene.add(mazeGroup);
    
    // Store reference for animation
    menuCube = mazeGroup;
}

// Animate the menu background
function animateMenuBackground() {
    animationFrameId = requestAnimationFrame(animateMenuBackground);
    
    if (menuCube) {
        menuCube.rotation.x += 0.002;
        menuCube.rotation.y += 0.003;
    }
    
    menuRenderer.render(menuScene, menuCamera);
}

// Create and display the main menu
export function createMainMenu() {
    // Initialize the 3D background
    initMenuBackground();
    
    // Create menu container
    const menuContainer = document.createElement('div');
    menuContainer.id = 'mainMenu';
    menuContainer.style.position = 'absolute';
    menuContainer.style.top = '0';
    menuContainer.style.left = '0';
    menuContainer.style.width = '100%';
    menuContainer.style.height = '100%';
    menuContainer.style.display = 'flex';
    menuContainer.style.flexDirection = 'column';
    menuContainer.style.justifyContent = 'center';
    menuContainer.style.alignItems = 'center';
    menuContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    menuContainer.style.zIndex = '1000';
    
    // Create game title
    const gameTitle = document.createElement('h1');
    gameTitle.textContent = '3D Maze Game';
    gameTitle.style.color = 'white';
    gameTitle.style.fontFamily = 'Arial, sans-serif';
    gameTitle.style.fontSize = '48px';
    gameTitle.style.marginBottom = '40px';
    gameTitle.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    menuContainer.appendChild(gameTitle);
    
    // Create start game button
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Game';
    startButton.style.padding = '12px 24px';
    startButton.style.fontSize = '24px';
    startButton.style.backgroundColor = '#4CAF50';
    startButton.style.color = 'white';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '5px';
    startButton.style.cursor = 'pointer';
    startButton.style.marginBottom = '20px';
    startButton.style.transition = 'all 0.3s ease';
    
    // Button hover effect
    startButton.addEventListener('mouseover', () => {
        startButton.style.backgroundColor = '#45a049';
        startButton.style.transform = 'scale(1.05)';
    });
    
    startButton.addEventListener('mouseout', () => {
        startButton.style.backgroundColor = '#4CAF50';
        startButton.style.transform = 'scale(1)';
    });
    
    // Start game on click
    startButton.addEventListener('click', () => {
        hideMainMenu();
        initGame();
    });
    
    menuContainer.appendChild(startButton);
    
    // Create instructions button
    const instructionsButton = document.createElement('button');
    instructionsButton.textContent = 'How to Play';
    instructionsButton.style.padding = '10px 20px';
    instructionsButton.style.fontSize = '20px';
    instructionsButton.style.backgroundColor = '#2196F3';
    instructionsButton.style.color = 'white';
    instructionsButton.style.border = 'none';
    instructionsButton.style.borderRadius = '5px';
    instructionsButton.style.cursor = 'pointer';
    instructionsButton.style.marginBottom = '20px';
    instructionsButton.style.transition = 'all 0.3s ease';
    
    // Button hover effect
    instructionsButton.addEventListener('mouseover', () => {
        instructionsButton.style.backgroundColor = '#0b7dda';
        instructionsButton.style.transform = 'scale(1.05)';
    });
    
    instructionsButton.addEventListener('mouseout', () => {
        instructionsButton.style.backgroundColor = '#2196F3';
        instructionsButton.style.transform = 'scale(1)';
    });
    
    // Show instructions on click
    instructionsButton.addEventListener('click', () => {
        showInstructions();
    });
    
    menuContainer.appendChild(instructionsButton);
    
    // Add menu to the document
    document.body.appendChild(menuContainer);
}

// Hide the main menu
function hideMainMenu() {
    const menuContainer = document.getElementById('mainMenu');
    if (menuContainer) {
        menuContainer.style.display = 'none';
    }
    
    // Stop the menu animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Remove the menu renderer element
    if (menuRenderer) {
        document.body.removeChild(menuRenderer.domElement);
    }
}

// Show game instructions
function showInstructions() {
    // Create instructions modal
    const instructionsModal = document.createElement('div');
    instructionsModal.id = 'instructionsModal';
    instructionsModal.style.position = 'absolute';
    instructionsModal.style.top = '50%';
    instructionsModal.style.left = '50%';
    instructionsModal.style.transform = 'translate(-50%, -50%)';
    instructionsModal.style.width = '80%';
    instructionsModal.style.maxWidth = '600px';
    instructionsModal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    instructionsModal.style.color = 'white';
    instructionsModal.style.padding = '20px';
    instructionsModal.style.borderRadius = '10px';
    instructionsModal.style.zIndex = '1100';
    
    // Create instructions title
    const instructionsTitle = document.createElement('h2');
    instructionsTitle.textContent = 'How to Play';
    instructionsTitle.style.textAlign = 'center';
    instructionsTitle.style.marginBottom = '20px';
    instructionsModal.appendChild(instructionsTitle);
    
    // Create instructions content
    const instructionsContent = document.createElement('div');
    instructionsContent.innerHTML = `
        <p>- Use <strong>W, A, S, D</strong> keys to move</p>
        <p>- Use the <strong>mouse</strong> to look around</p>
        <p>- Collect all coins in each level to complete it</p>
        <p>- Avoid hazards and traps</p>
        <p>- Find the exit to progress to the next level</p>
    `;
    instructionsContent.style.marginBottom = '20px';
    instructionsContent.style.lineHeight = '1.6';
    instructionsModal.appendChild(instructionsContent);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '8px 16px';
    closeButton.style.backgroundColor = '#f44336';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.display = 'block';
    closeButton.style.margin = '0 auto';
    
    closeButton.addEventListener('click', () => {
        instructionsModal.remove();
    });
    
    instructionsModal.appendChild(closeButton);
    
    // Add instructions modal to the document
    document.body.appendChild(instructionsModal);
}

// Show main menu
export function showMainMenu() {
    const menuContainer = document.getElementById('mainMenu');
    if (menuContainer) {
        menuContainer.style.display = 'flex';
    } else {
        createMainMenu();
    }
} 
import * as THREE from "three";
import { initGame } from "./game.js";

let menuScene, menuCamera, menuRenderer, menuCube;
let animationFrameId;

function initMenuBackground() {
  menuScene = new THREE.Scene();

  // Create a more dynamic camera with wider field of view
  menuCamera = new THREE.PerspectiveCamera(
    85,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  menuCamera.position.z = 5;
  menuCamera.position.y = 0.5;

  // Enhanced renderer with better antialiasing and precision
  menuRenderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true,
    precision: "highp",
    powerPreference: "high-performance"
  });
  menuRenderer.setSize(window.innerWidth, window.innerHeight);
  menuRenderer.setClearColor(0x000000, 0);
  menuRenderer.shadowMap.enabled = true;
  menuRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(menuRenderer.domElement);

  // Add fog to create depth
  menuScene.fog = new THREE.FogExp2(0x0a0a0a, 0.055);

  // Create enhanced maze background
  createMazeBackground();

  // Improved lighting setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  menuScene.add(ambientLight);

  // Main directional light with shadows
  const directionalLight = new THREE.DirectionalLight(0x4caf50, 1);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  
  // Optimize shadow map
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.bias = -0.001;
  menuScene.add(directionalLight);
  
  // Add point lights for more depth and interest
  const pointLight1 = new THREE.PointLight(0x4fc3f7, 1, 20);
  pointLight1.position.set(-5, 2, 2);
  menuScene.add(pointLight1);
  
  const pointLight2 = new THREE.PointLight(0x1de9b6, 1, 20);
  pointLight2.position.set(5, -2, -5);
  menuScene.add(pointLight2);

  // Add subtle particle system to the scene
  addParticleSystem();

  // Start animation loop
  animateMenuBackground();

  // Responsive resize handler
  window.addEventListener("resize", () => {
    menuCamera.aspect = window.innerWidth / window.innerHeight;
    menuCamera.updateProjectionMatrix();
    menuRenderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function addParticleSystem() {
  const particleCount = 200;
  const particleGeometry = new THREE.BufferGeometry();
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x4fc3f7,
    size: 0.1,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  
  // Create random particle positions in a sphere
  const positions = new Float32Array(particleCount * 3);
  const velocities = []; // Store velocity for animation
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    
    // Position particles in a large sphere
    const radius = 15;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
    
    // Random velocity for animation
    velocities.push({
      x: (Math.random() - 0.5) * 0.01,
      y: (Math.random() - 0.5) * 0.01,
      z: (Math.random() - 0.5) * 0.01
    });
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.userData.velocities = velocities;
  menuScene.add(particles);
  
  // Store reference for animation
  menuScene.userData.particles = particles;
}

function createMazeBackground() {
  const mazeGroup = new THREE.Group();

  const size = 0.5;
  const spacing = 1.2;
  const matrix = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

  // Enhanced materials for better visual quality
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x4caf50,
    roughness: 0.7,
    metalness: 0.2,
    flatShading: false,
  });
  
  // Add subtle animation to the material
  wallMaterial.userData = {
    originalColor: new THREE.Color(0x4caf50)
  };

  // Create more detailed geometry for the walls
  const cubeGeometry = new THREE.BoxGeometry(size, size, size, 2, 2, 2);
  
  // Add beveled edges
  const edgeGeometry = new THREE.EdgesGeometry(cubeGeometry);
  
  // Make maze creation more interesting with different heights
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] === 1) {
        // Random height variation for more interesting maze
        const heightVar = Math.random() * 0.4 + 0.8;
        
        const cube = new THREE.Mesh(cubeGeometry, wallMaterial.clone());
        cube.position.set(
          (j - matrix[i].length / 2) * spacing,
          (i - matrix.length / 2) * spacing,
          0
        );
        
        // Scale the cube to have different heights
        cube.scale.y = heightVar;
        
        // Randomly rotate some cubes slightly for more visual interest
        if (Math.random() > 0.7) {
          cube.rotation.z = (Math.random() - 0.5) * 0.2;
        }
        
        // Add subtle random color variation to each cube
        const hueShift = (Math.random() - 0.5) * 0.1;
        const color = new THREE.Color(0x4caf50);
        color.offsetHSL(hueShift, 0, (Math.random() - 0.5) * 0.1);
        cube.material.color = color;
        
        // Store original color for animations
        cube.userData.originalColor = color.clone();
        cube.userData.pulsePhase = Math.random() * Math.PI * 2;
        
        // Cast and receive shadows
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        mazeGroup.add(cube);
      }
    }
  }

  // Add a flat platform underneath to catch shadows
  const platformGeometry = new THREE.PlaneGeometry(spacing * matrix.length * 1.2, spacing * matrix.length * 1.2);
  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.8,
    metalness: 0.2,
  });
  
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.rotation.x = -Math.PI / 2;
  platform.position.y = -spacing * matrix.length / 2 - 0.25;
  platform.receiveShadow = true;
  
  mazeGroup.add(platform);
  
  // Add to scene and store reference
  menuScene.add(mazeGroup);
  menuCube = mazeGroup;
}

function animateMenuBackground() {
  animationFrameId = requestAnimationFrame(animateMenuBackground);

  const time = performance.now() * 0.001; // Convert to seconds
  
  if (menuCube) {
    // Smooth, dynamic rotation
    menuCube.rotation.x += 0.002;
    menuCube.rotation.y += 0.003;
    
    // Add subtle "breathing" animation to the maze
    menuCube.position.y = Math.sin(time * 0.5) * 0.1;
    
    // Animate individual cubes
    menuCube.children.forEach((child, index) => {
      if (child.userData.originalColor && child.material) {
        // Subtle color pulsing
        const pulseIntensity = 0.05;
        const pulseSpeed = 0.5;
        const phase = child.userData.pulsePhase || 0;
        
        // Create a subtle pulsing effect
        const pulseFactor = (Math.sin(time * pulseSpeed + phase) * 0.5 + 0.5) * pulseIntensity;
        child.material.emissive.setRGB(pulseFactor, pulseFactor, pulseFactor);
      }
    });
  }
  
  // Animate particle system
  if (menuScene.userData.particles) {
    const particles = menuScene.userData.particles;
    const positions = particles.geometry.attributes.position.array;
    const velocities = particles.userData.velocities;
    
    for (let i = 0; i < positions.length / 3; i++) {
      const i3 = i * 3;
      
      // Update positions based on velocity
      positions[i3] += velocities[i].x;
      positions[i3 + 1] += velocities[i].y;
      positions[i3 + 2] += velocities[i].z;
      
      // Reset particles that go too far from center
      const distance = Math.sqrt(
        positions[i3] * positions[i3] + 
        positions[i3 + 1] * positions[i3 + 1] + 
        positions[i3 + 2] * positions[i3 + 2]
      );
      
      if (distance > 20) {
        // Reset to position on sphere with radius 15
        const radius = 15;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
      }
    }
    
    // Update points geometry
    particles.geometry.attributes.position.needsUpdate = true;
    
    // Slowly rotate the entire particle system
    particles.rotation.y += 0.0003;
  }
  
  // Slowly move camera for a more dynamic feel
  menuCamera.position.x = Math.sin(time * 0.2) * 0.5;
  menuCamera.position.y = Math.cos(time * 0.3) * 0.3 + 0.8;
  menuCamera.lookAt(0, 0, 0);

  menuRenderer.render(menuScene, menuCamera);
}

export function createMainMenu() {
  initMenuBackground();

  const menuContainer = document.createElement("div");
  menuContainer.id = "mainMenu";
  menuContainer.style.position = "absolute";
  menuContainer.style.top = "0";
  menuContainer.style.left = "0";
  menuContainer.style.width = "100%";
  menuContainer.style.height = "100%";
  menuContainer.style.display = "flex";
  menuContainer.style.flexDirection = "column";
  menuContainer.style.justifyContent = "center";
  menuContainer.style.alignItems = "center";
  menuContainer.style.background = "radial-gradient(circle at center, rgba(15, 25, 35, 0.7) 0%, rgba(5, 10, 15, 0.9) 100%)";
  menuContainer.style.backdropFilter = "blur(10px)";
  menuContainer.style.zIndex = "1000";
  
  // Create a modern UI container with glassmorphism
  const menuContent = document.createElement("div");
  menuContent.style.backgroundColor = "rgba(20, 30, 40, 0.8)";
  menuContent.style.borderRadius = "24px";
  menuContent.style.boxShadow = "0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(79, 195, 247, 0.15)";
  menuContent.style.padding = "45px";
  menuContent.style.maxWidth = "850px";
  menuContent.style.width = "90%";
  menuContent.style.display = "flex";
  menuContent.style.flexDirection = "column";
  menuContent.style.alignItems = "center";
  menuContent.style.border = "1px solid rgba(255, 255, 255, 0.15)";
  menuContent.style.position = "relative";
  menuContent.style.overflow = "hidden";
  menuContent.style.backdropFilter = "blur(8px)";
  
  // Add animated accent border
  const accentBorder = document.createElement("div");
  accentBorder.style.position = "absolute";
  accentBorder.style.top = "0";
  accentBorder.style.left = "0";
  accentBorder.style.width = "100%";
  accentBorder.style.height = "6px";
  accentBorder.style.background = "linear-gradient(90deg, #4fc3f7, #1de9b6, #4fc3f7)";
  accentBorder.style.backgroundSize = "300% 100%";
  accentBorder.style.animation = "gradientMove 8s ease infinite";
  menuContent.appendChild(accentBorder);
  
  // Add gradient style
  const gradientStyle = document.createElement("style");
  gradientStyle.textContent = `
    @keyframes gradientMove {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes float {
      0% { transform: translateY(0) rotate(0deg); opacity: 0; }
      10% { opacity: 0.8; }
      90% { opacity: 0.8; }
      100% { transform: translateY(-600px) rotate(360deg); opacity: 0; }
    }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    @keyframes shine {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(gradientStyle);
  
  // Add animated particle effects
  const particles = document.createElement("div");
  particles.style.position = "absolute";
  particles.style.top = "0";
  particles.style.left = "0";
  particles.style.width = "100%";
  particles.style.height = "100%";
  particles.style.pointerEvents = "none";
  particles.style.overflow = "hidden";
  particles.style.zIndex = "0";
  
  // Create floating particles with varied colors and sizes
  for (let i = 0; i < 25; i++) {
    const particle = document.createElement("div");
    particle.style.position = "absolute";
    particle.style.bottom = "-30px";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.width = Math.random() * 20 + 5 + "px";
    particle.style.height = Math.random() * 20 + 5 + "px";
    particle.style.borderRadius = "50%";
    
    // Randomly choose between circle and polygon shapes
    if (Math.random() > 0.7) {
      particle.style.clipPath = "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)";
    }
    
    // Use theme colors with low opacity
    const hue = Math.floor(Math.random() * 60) + 180; // Blue to cyan range
    particle.style.backgroundColor = `hsla(${hue}, 80%, 70%, 0.15)`;
    particle.style.boxShadow = `0 0 8px hsla(${hue}, 100%, 70%, 0.2)`;
    
    // Animation with random duration and delay
    const duration = Math.random() * 15 + 10;
    particle.style.animation = `float ${duration}s linear infinite`;
    particle.style.animationDelay = Math.random() * 10 + "s";
    
    particles.appendChild(particle);
  }
  menuContent.appendChild(particles);

  // Game title with enhanced styling
  const titleContainer = document.createElement("div");
  titleContainer.style.position = "relative";
  titleContainer.style.marginBottom = "30px";
  titleContainer.style.textAlign = "center";
  titleContainer.style.zIndex = "2";
  
  const gameTitle = document.createElement("h1");
  gameTitle.textContent = "3D MAZE RUNNER";
  gameTitle.style.color = "white";
  gameTitle.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  gameTitle.style.fontSize = "60px";
  gameTitle.style.fontWeight = "800";
  gameTitle.style.textShadow = "0 5px 15px rgba(0, 0, 0, 0.7)";
  gameTitle.style.margin = "0 0 10px 0";
  gameTitle.style.letterSpacing = "3px";
  gameTitle.style.position = "relative";
  
  // Add gradient text effect with animation
  gameTitle.style.background = "linear-gradient(90deg, #4fc3f7, #ffffff, #1de9b6)";
  gameTitle.style.backgroundSize = "300% 100%";
  gameTitle.style.animation = "gradientMove 8s ease infinite";
  gameTitle.style.WebkitBackgroundClip = "text";
  gameTitle.style.WebkitTextFillColor = "transparent";
  gameTitle.style.backgroundClip = "text";
  titleContainer.appendChild(gameTitle);
  
  // 3D text shadow effect
  const titleShadow = document.createElement("h1");
  titleShadow.textContent = gameTitle.textContent;
  titleShadow.style.position = "absolute";
  titleShadow.style.left = "0";
  titleShadow.style.top = "4px";
  titleShadow.style.color = "rgba(79, 195, 247, 0.2)";
  titleShadow.style.fontFamily = gameTitle.style.fontFamily;
  titleShadow.style.fontSize = gameTitle.style.fontSize;
  titleShadow.style.fontWeight = gameTitle.style.fontWeight;
  titleShadow.style.letterSpacing = gameTitle.style.letterSpacing;
  titleShadow.style.margin = "0 0 10px 0";
  titleShadow.style.zIndex = "-1";
  titleContainer.appendChild(titleShadow);
  
  // Subtitle with improved styling
  const subtitle = document.createElement("div");
  subtitle.textContent = "NAVIGATE • COLLECT • ESCAPE";
  subtitle.style.color = "rgba(255, 255, 255, 0.8)";
  subtitle.style.fontSize = "18px";
  subtitle.style.fontWeight = "300";
  subtitle.style.letterSpacing = "4px";
  subtitle.style.marginTop = "15px";
  subtitle.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  titleContainer.appendChild(subtitle);
  
  menuContent.appendChild(titleContainer);

  // Theme selector with enhanced styling
  const themeContainer = document.createElement("div");
  themeContainer.style.display = "flex";
  themeContainer.style.flexDirection = "column";
  themeContainer.style.alignItems = "center";
  themeContainer.style.width = "100%";
  themeContainer.style.marginBottom = "40px";
  themeContainer.style.position = "relative";
  themeContainer.style.zIndex = "2";
  
  const themeLabel = document.createElement("h3");
  themeLabel.textContent = "SELECT YOUR WORLD";
  themeLabel.style.color = "white";
  themeLabel.style.marginBottom = "20px";
  themeLabel.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  themeLabel.style.fontWeight = "500";
  themeLabel.style.fontSize = "24px";
  themeLabel.style.letterSpacing = "2px";
  themeLabel.style.textAlign = "center";
  themeContainer.appendChild(themeLabel);
  
  const themesRow = document.createElement("div");
  themesRow.style.display = "flex";
  themesRow.style.flexWrap = "wrap";
  themesRow.style.justifyContent = "center";
  themesRow.style.gap = "20px";
  themesRow.style.width = "100%";
  themeContainer.appendChild(themesRow);
  
  const themes = [
    { name: "Forest", color: "#4CAF50", trimColor: "#2e7d32", gridColor: "#1b5e20", gridOpacity: 0.4, icon: "🌲" },
    { name: "Desert", color: "#FFC107", trimColor: "#FF8F00", gridColor: "#F57F17", gridOpacity: 0.3, icon: "🏜️" },
    { name: "Cave", color: "#607D8B", trimColor: "#455A64", gridColor: "#263238", gridOpacity: 0.5, icon: "🕳️" },
    { name: "Ice", color: "#90CAF9", trimColor: "#42A5F5", gridColor: "#1565C0", gridOpacity: 0.3, icon: "❄️" },
    { name: "Volcano", color: "#F44336", trimColor: "#D32F2F", gridColor: "#B71C1C", gridOpacity: 0.4, icon: "🌋" },
    { name: "Alien", color: "#8BC34A", trimColor: "#689F38", gridColor: "#33691E", gridOpacity: 0.4, icon: "👽" },
    { name: "Neon", color: "#E040FB", trimColor: "#D500F9", gridColor: "#AA00FF", gridOpacity: 0.5, icon: "🔮" },
    { name: "Ocean", color: "#00BCD4", trimColor: "#0097A7", gridColor: "#006064", gridOpacity: 0.3, icon: "🌊" }
  ];
  
  // Store the selected theme in localStorage
  let selectedTheme = localStorage.getItem("selectedTheme") || "Forest";
  
  themes.forEach(theme => {
    const themeButton = document.createElement("div");
    themeButton.classList.add("theme-button");
    themeButton.dataset.theme = theme.name;
    themeButton.style.width = "80px";
    themeButton.style.height = "80px";
    themeButton.style.background = `linear-gradient(135deg, ${theme.color}, ${theme.trimColor})`;
    themeButton.style.borderRadius = "16px";
    themeButton.style.cursor = "pointer";
    themeButton.style.transition = "all 0.3s cubic-bezier(0.19, 1, 0.22, 1)";
    themeButton.style.position = "relative";
    themeButton.style.boxShadow = theme.name === selectedTheme 
      ? `0 8px 25px ${theme.color}80, 0 0 0 3px ${theme.color}` 
      : `0 5px 15px rgba(0, 0, 0, 0.3)`;
    themeButton.style.transform = theme.name === selectedTheme ? "scale(1.1)" : "scale(1)";
    
    // Inner container for content
    const innerContainer = document.createElement("div");
    innerContainer.style.position = "absolute";
    innerContainer.style.top = "0";
    innerContainer.style.left = "0";
    innerContainer.style.width = "100%";
    innerContainer.style.height = "100%";
    innerContainer.style.display = "flex";
    innerContainer.style.flexDirection = "column";
    innerContainer.style.justifyContent = "center";
    innerContainer.style.alignItems = "center";
    innerContainer.style.borderRadius = "16px";
    innerContainer.style.backgroundColor = "transparent";
    innerContainer.style.overflow = "hidden";
    innerContainer.style.zIndex = "1";
    
    // Add theme pattern
    const pattern = document.createElement("div");
    pattern.style.position = "absolute";
    pattern.style.top = "0";
    pattern.style.left = "0";
    pattern.style.width = "100%";
    pattern.style.height = "100%";
    pattern.style.borderRadius = "16px";
    pattern.style.opacity = "0.4";
    pattern.style.backgroundImage = `radial-gradient(circle at 20% 20%, transparent 0%, transparent 40%, ${theme.trimColor}40 40%, ${theme.trimColor}40 60%, transparent 60%, transparent 100%)`;
    pattern.style.backgroundSize = "50px 50px";
    innerContainer.appendChild(pattern);
    
    // Add theme icon
    const themeIcon = document.createElement("div");
    themeIcon.textContent = theme.icon;
    themeIcon.style.fontSize = "30px";
    themeIcon.style.marginBottom = "5px";
    themeIcon.style.textShadow = "0 2px 5px rgba(0, 0, 0, 0.3)";
    themeIcon.style.transition = "transform 0.3s ease";
    innerContainer.appendChild(themeIcon);
    
    // Add glossy highlight
    const highlight = document.createElement("div");
    highlight.style.position = "absolute";
    highlight.style.top = "0";
    highlight.style.left = "0";
    highlight.style.width = "100%";
    highlight.style.height = "50%";
    highlight.style.borderRadius = "16px 16px 0 0";
    highlight.style.background = "linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)";
    highlight.style.pointerEvents = "none";
    innerContainer.appendChild(highlight);
    
    themeButton.appendChild(innerContainer);
    
    const themeName = document.createElement("div");
    themeName.textContent = theme.name;
    themeName.style.position = "absolute";
    themeName.style.bottom = "-30px";
    themeName.style.left = "0";
    themeName.style.width = "100%";
    themeName.style.textAlign = "center";
    themeName.style.color = "white";
    themeName.style.fontSize = "14px";
    themeName.style.fontWeight = theme.name === selectedTheme ? "600" : "400";
    themeName.style.textShadow = "1px 1px 2px rgba(0, 0, 0, 0.8)";
    themeName.style.transition = "all 0.3s ease";
    themeName.style.opacity = theme.name === selectedTheme ? "1" : "0.7";
    themeButton.appendChild(themeName);
    
    // Selected indicator
    if (theme.name === selectedTheme) {
      const selectedIndicator = document.createElement("div");
      selectedIndicator.style.position = "absolute";
      selectedIndicator.style.top = "-8px";
      selectedIndicator.style.right = "-8px";
      selectedIndicator.style.width = "25px";
      selectedIndicator.style.height = "25px";
      selectedIndicator.style.borderRadius = "50%";
      selectedIndicator.style.backgroundColor = "white";
      selectedIndicator.style.display = "flex";
      selectedIndicator.style.justifyContent = "center";
      selectedIndicator.style.alignItems = "center";
      selectedIndicator.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.3)";
      selectedIndicator.style.zIndex = "2";
      
      const checkmark = document.createElement("div");
      checkmark.textContent = "✓";
      checkmark.style.color = theme.color;
      checkmark.style.fontSize = "16px";
      checkmark.style.fontWeight = "bold";
      selectedIndicator.appendChild(checkmark);
      
      themeButton.appendChild(selectedIndicator);
    }
    
    themeButton.addEventListener("mouseover", () => {
      if (theme.name !== selectedTheme) {
        themeButton.style.transform = "scale(1.05) translateY(-5px)";
        themeButton.style.boxShadow = `0 8px 20px rgba(0, 0, 0, 0.4), 0 0 0 2px ${theme.color}80`;
        themeName.style.opacity = "1";
        innerContainer.querySelector("div:first-of-type").style.transform = "scale(1.1)";
      }
    });
    
    themeButton.addEventListener("mouseout", () => {
      if (theme.name !== selectedTheme) {
        themeButton.style.transform = "scale(1) translateY(0)";
        themeButton.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.3)";
        themeName.style.opacity = "0.7";
        innerContainer.querySelector("div:first-of-type").style.transform = "scale(1)";
      }
    });
    
    themeButton.addEventListener("click", () => {
      // Add click animation
      themeButton.style.transform = "scale(0.95)";
      setTimeout(() => {
        // Reset all theme buttons
        document.querySelectorAll(".theme-button").forEach(btn => {
          const btnThemeName = btn.dataset.theme;
          const currentTheme = themes.find(t => t.name === btnThemeName);
          btn.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.3)";
          btn.style.transform = "scale(1)";
          
          // Remove selected indicator if it exists
          const existingIndicator = btn.querySelector("div:last-child");
          if (existingIndicator && existingIndicator.contains(btn.querySelector("div:last-child div"))) {
            btn.removeChild(existingIndicator);
          }
          
          // Update theme name style
          const nameElement = btn.querySelector("div:last-child");
          if (nameElement) {
            nameElement.style.opacity = "0.7";
            nameElement.style.fontWeight = "400";
          }
        });
        
        // Update selected theme
        themeButton.style.boxShadow = `0 8px 25px ${theme.color}80, 0 0 0 3px ${theme.color}`;
        themeButton.style.transform = "scale(1.1)";
        themeName.style.opacity = "1";
        themeName.style.fontWeight = "600";
        selectedTheme = theme.name;
        localStorage.setItem("selectedTheme", theme.name);
        
        // Add selected indicator
        const selectedIndicator = document.createElement("div");
        selectedIndicator.style.position = "absolute";
        selectedIndicator.style.top = "-8px";
        selectedIndicator.style.right = "-8px";
        selectedIndicator.style.width = "25px";
        selectedIndicator.style.height = "25px";
        selectedIndicator.style.borderRadius = "50%";
        selectedIndicator.style.backgroundColor = "white";
        selectedIndicator.style.display = "flex";
        selectedIndicator.style.justifyContent = "center";
        selectedIndicator.style.alignItems = "center";
        selectedIndicator.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.3)";
        selectedIndicator.style.zIndex = "2";
        
        const checkmark = document.createElement("div");
        checkmark.textContent = "✓";
        checkmark.style.color = theme.color;
        checkmark.style.fontSize = "16px";
        checkmark.style.fontWeight = "bold";
        selectedIndicator.appendChild(checkmark);
        
        themeButton.appendChild(selectedIndicator);
        
        // Add a brief flash effect
        const flashEffect = document.createElement("div");
        flashEffect.style.position = "absolute";
        flashEffect.style.top = "0";
        flashEffect.style.left = "0";
        flashEffect.style.width = "100%";
        flashEffect.style.height = "100%";
        flashEffect.style.borderRadius = "16px";
        flashEffect.style.backgroundColor = "white";
        flashEffect.style.opacity = "0.6";
        flashEffect.style.transition = "opacity 0.5s ease";
        flashEffect.style.pointerEvents = "none";
        flashEffect.style.zIndex = "1";
        themeButton.appendChild(flashEffect);
        
        setTimeout(() => {
          flashEffect.style.opacity = "0";
          setTimeout(() => {
            themeButton.removeChild(flashEffect);
          }, 500);
        }, 100);
        
        // Update the menu background to match the selected theme
        updateMenuBackground(theme);
      }, 100);
    });
    
    themesRow.appendChild(themeButton);
  });
  
  menuContent.appendChild(themeContainer);

  // Button container with enhanced styling
  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.flexDirection = "column";
  buttonContainer.style.alignItems = "center";
  buttonContainer.style.gap = "20px";
  buttonContainer.style.width = "100%";
  buttonContainer.style.position = "relative";
  buttonContainer.style.zIndex = "2";
  buttonContainer.style.marginTop = "10px";
  
  // Start Game button with enhanced styling
  const startButton = document.createElement("button");
  startButton.textContent = "START ADVENTURE";
  startButton.style.padding = "18px 45px";
  startButton.style.fontSize = "26px";
  startButton.style.fontWeight = "700";
  startButton.style.background = "linear-gradient(90deg, #4CAF50, #8BC34A)";
  startButton.style.color = "white";
  startButton.style.border = "none";
  startButton.style.borderRadius = "50px";
  startButton.style.cursor = "pointer";
  startButton.style.boxShadow = "0 10px 25px rgba(76, 175, 80, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.2)";
  startButton.style.transition = "all 0.3s ease";
  startButton.style.marginBottom = "10px";
  startButton.style.width = "300px";
  startButton.style.position = "relative";
  startButton.style.overflow = "hidden";
  startButton.style.letterSpacing = "1px";
  startButton.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  startButton.style.animation = "pulse 2s infinite";

  // Add shimmer effect to start button
  const startButtonShimmer = document.createElement("div");
  startButtonShimmer.style.position = "absolute";
  startButtonShimmer.style.top = "0";
  startButtonShimmer.style.left = "0";
  startButtonShimmer.style.width = "100%";
  startButtonShimmer.style.height = "100%";
  startButtonShimmer.style.backgroundImage = "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)";
  startButtonShimmer.style.backgroundSize = "200% 100%";
  startButtonShimmer.style.animation = "shine 3s infinite";
  startButton.appendChild(startButtonShimmer);

  startButton.addEventListener("mouseover", () => {
    startButton.style.transform = "translateY(-5px)";
    startButton.style.boxShadow = "0 15px 30px rgba(76, 175, 80, 0.4)";
  });

  startButton.addEventListener("mouseout", () => {
    startButton.style.transform = "translateY(0)";
    startButton.style.boxShadow = "0 10px 20px rgba(76, 175, 80, 0.3)";
  });

  startButton.addEventListener("click", () => {
    // Add click animation
    startButton.style.transform = "scale(0.95)";
    setTimeout(() => {
      startButton.style.transform = "scale(1)";
      
      // Fade out animation for menu
      menuContainer.style.transition = "opacity 0.5s ease";
      menuContainer.style.opacity = "0";
      
      setTimeout(() => {
        hideMainMenu();
        // Pass the selected theme to initGame
        const theme = themes.find(t => t.name === selectedTheme);
        initGame(theme);
      }, 500);
    }, 100);
  });

  buttonContainer.appendChild(startButton);

  // How to Play button with modern styling
  const instructionsButton = document.createElement("button");
  instructionsButton.textContent = "How to Play";
  instructionsButton.style.padding = "12px 30px";
  instructionsButton.style.fontSize = "18px";
  instructionsButton.style.fontWeight = "600";
  instructionsButton.style.background = "rgba(33, 150, 243, 0.2)";
  instructionsButton.style.color = "#42A5F5";
  instructionsButton.style.border = "2px solid #42A5F5";
  instructionsButton.style.borderRadius = "50px";
  instructionsButton.style.cursor = "pointer";
  instructionsButton.style.transition = "all 0.3s ease";
  instructionsButton.style.backdropFilter = "blur(5px)";
  instructionsButton.style.width = "200px";

  instructionsButton.addEventListener("mouseover", () => {
    instructionsButton.style.background = "rgba(33, 150, 243, 0.3)";
    instructionsButton.style.transform = "translateY(-3px)";
  });

  instructionsButton.addEventListener("mouseout", () => {
    instructionsButton.style.background = "rgba(33, 150, 243, 0.2)";
    instructionsButton.style.transform = "translateY(0)";
  });

  instructionsButton.addEventListener("click", () => {
    instructionsButton.style.transform = "scale(0.95)";
    setTimeout(() => {
      instructionsButton.style.transform = "scale(1)";
      showInstructions();
    }, 100);
  });

  buttonContainer.appendChild(instructionsButton);
  menuContent.appendChild(buttonContainer);
  
  // Footer with enhanced styling
  const footer = document.createElement("div");
  footer.style.marginTop = "40px";
  footer.style.textAlign = "center";
  footer.style.color = "rgba(255, 255, 255, 0.5)";
  footer.style.fontSize = "14px";
  footer.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  footer.style.position = "relative";
  footer.style.zIndex = "2";
  footer.style.width = "100%";
  footer.style.display = "flex";
  footer.style.flexDirection = "column";
  footer.style.alignItems = "center";
  footer.style.gap = "10px";
  
  const divider = document.createElement("div");
  divider.style.width = "60%";
  divider.style.height = "1px";
  divider.style.background = "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)";
  divider.style.margin = "0 auto 10px auto";
  footer.appendChild(divider);
  
  const credits = document.createElement("div");
  credits.textContent = "© 2023 3D MAZE RUNNER • ALL RIGHTS RESERVED";
  credits.style.fontSize = "12px";
  credits.style.letterSpacing = "1px";
  footer.appendChild(credits);
  
  menuContent.appendChild(footer);
  menuContainer.appendChild(menuContent);
  
  // Animation for menu appearance
  menuContent.style.opacity = "0";
  menuContent.style.transform = "translateY(30px)";
  menuContent.style.transition = "opacity 0.8s ease, transform 0.8s ease";
  
  setTimeout(() => {
    menuContent.style.opacity = "1";
    menuContent.style.transform = "translateY(0)";
  }, 100);
  
  document.body.appendChild(menuContainer);
}

function hideMainMenu() {
  const menuContainer = document.getElementById("mainMenu");
  if (menuContainer) {
    menuContainer.style.display = "none";
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  if (menuRenderer) {
    document.body.removeChild(menuRenderer.domElement);
  }
}

function showInstructions() {
  const instructionsModal = document.createElement("div");
  instructionsModal.id = "instructionsModal";
  instructionsModal.style.position = "absolute";
  instructionsModal.style.top = "50%";
  instructionsModal.style.left = "50%";
  instructionsModal.style.transform = "translate(-50%, -50%) scale(0.9)";
  instructionsModal.style.width = "80%";
  instructionsModal.style.maxWidth = "650px";
  instructionsModal.style.backgroundColor = "rgba(20, 30, 40, 0.95)";
  instructionsModal.style.backdropFilter = "blur(15px)";
  instructionsModal.style.color = "white";
  instructionsModal.style.padding = "40px";
  instructionsModal.style.borderRadius = "24px";
  instructionsModal.style.zIndex = "1100";
  instructionsModal.style.boxShadow = "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(33, 150, 243, 0.2)";
  instructionsModal.style.border = "1px solid rgba(255, 255, 255, 0.15)";
  instructionsModal.style.opacity = "0";
  instructionsModal.style.transition = "all 0.4s cubic-bezier(0.19, 1, 0.22, 1)";
  instructionsModal.style.overflow = "hidden";

  // Add decorative top gradient
  const topGradient = document.createElement("div");
  topGradient.style.position = "absolute";
  topGradient.style.top = "0";
  topGradient.style.left = "0";
  topGradient.style.width = "100%";
  topGradient.style.height = "6px";
  topGradient.style.background = "linear-gradient(90deg, #42A5F5, #64B5F6, #90CAF9)";
  topGradient.style.backgroundSize = "300% 100%";
  topGradient.style.animation = "gradientMove 8s ease infinite";
  topGradient.style.borderRadius = "24px 24px 0 0";
  instructionsModal.appendChild(topGradient);
  
  // Add decorative elements
  const bgPattern = document.createElement("div");
  bgPattern.style.position = "absolute";
  bgPattern.style.top = "0";
  bgPattern.style.left = "0";
  bgPattern.style.width = "100%";
  bgPattern.style.height = "100%";
  bgPattern.style.backgroundImage = "radial-gradient(circle at 10% 20%, rgba(66, 165, 245, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(144, 202, 249, 0.1) 0%, transparent 20%)";
  bgPattern.style.opacity = "0.5";
  bgPattern.style.pointerEvents = "none";
  instructionsModal.appendChild(bgPattern);

  // Header with enhanced styling
  const headerContainer = document.createElement("div");
  headerContainer.style.textAlign = "center";
  headerContainer.style.marginBottom = "30px";
  headerContainer.style.position = "relative";
  
  const instructionsTitle = document.createElement("h2");
  instructionsTitle.textContent = "HOW TO PLAY";
  instructionsTitle.style.textAlign = "center";
  instructionsTitle.style.fontSize = "36px";
  instructionsTitle.style.fontWeight = "700";
  instructionsTitle.style.marginBottom = "0";
  instructionsTitle.style.letterSpacing = "2px";
  instructionsTitle.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  instructionsTitle.style.color = "#90CAF9";
  instructionsTitle.style.textShadow = "0 2px 5px rgba(33, 150, 243, 0.3)";
  headerContainer.appendChild(instructionsTitle);
  
  const divider = document.createElement("div");
  divider.style.width = "80px";
  divider.style.height = "3px";
  divider.style.background = "linear-gradient(90deg, #42A5F5, #90CAF9)";
  divider.style.margin = "10px auto 0";
  divider.style.borderRadius = "3px";
  headerContainer.appendChild(divider);
  
  instructionsModal.appendChild(headerContainer);

  // Content container with modern styling
  const instructionsContent = document.createElement("div");
  instructionsContent.style.display = "flex";
  instructionsContent.style.flexDirection = "column";
  instructionsContent.style.gap = "25px";
  instructionsContent.style.padding = "10px 5px";
  
  // Controls section
  const controlsSection = document.createElement("div");
  controlsSection.style.background = "rgba(33, 150, 243, 0.1)";
  controlsSection.style.borderRadius = "16px";
  controlsSection.style.padding = "20px";
  controlsSection.style.border = "1px solid rgba(33, 150, 243, 0.2)";
  
  const controlsTitle = document.createElement("h3");
  controlsTitle.textContent = "CONTROLS";
  controlsTitle.style.fontSize = "20px";
  controlsTitle.style.fontWeight = "600";
  controlsTitle.style.color = "#64B5F6";
  controlsTitle.style.margin = "0 0 15px 0";
  controlsTitle.style.letterSpacing = "1px";
  controlsTitle.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  controlsSection.appendChild(controlsTitle);
  
  const controls = [
    { key: "W, A, S, D", action: "Move around the maze" },
    { key: "Mouse", action: "Look around" },
    { key: "Space", action: "Jump over obstacles" },
    { key: "Shift", action: "Sprint (run faster)" }
  ];
  
  const controlsGrid = document.createElement("div");
  controlsGrid.style.display = "grid";
  controlsGrid.style.gridTemplateColumns = "auto 1fr";
  controlsGrid.style.gap = "12px 15px";
  controlsGrid.style.alignItems = "center";
  
  controls.forEach(control => {
    const keyElement = document.createElement("div");
    keyElement.textContent = control.key;
    keyElement.style.backgroundColor = "rgba(33, 150, 243, 0.15)";
    keyElement.style.color = "#90CAF9";
    keyElement.style.padding = "10px 15px";
    keyElement.style.borderRadius = "8px";
    keyElement.style.fontWeight = "600";
    keyElement.style.textAlign = "center";
    keyElement.style.fontSize = "16px";
    keyElement.style.border = "1px solid rgba(33, 150, 243, 0.3)";
    keyElement.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
    keyElement.style.fontFamily = "'Segoe UI', Arial, sans-serif";
    controlsGrid.appendChild(keyElement);
    
    const actionElement = document.createElement("div");
    actionElement.textContent = control.action;
    actionElement.style.fontSize = "16px";
    actionElement.style.color = "rgba(255, 255, 255, 0.9)";
    actionElement.style.fontFamily = "'Segoe UI', Arial, sans-serif";
    controlsGrid.appendChild(actionElement);
  });
  
  controlsSection.appendChild(controlsGrid);
  instructionsContent.appendChild(controlsSection);
  
  // Objectives section with modern styling
  const objectivesSection = document.createElement("div");
  objectivesSection.style.background = "rgba(76, 175, 80, 0.1)";
  objectivesSection.style.borderRadius = "16px";
  objectivesSection.style.padding = "20px";
  objectivesSection.style.border = "1px solid rgba(76, 175, 80, 0.2)";
  
  const objectiveTitle = document.createElement("h3");
  objectiveTitle.textContent = "OBJECTIVES";
  objectiveTitle.style.fontSize = "20px";
  objectiveTitle.style.fontWeight = "600";
  objectiveTitle.style.color = "#81C784";
  objectiveTitle.style.margin = "0 0 15px 0";
  objectiveTitle.style.letterSpacing = "1px";
  objectiveTitle.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  objectivesSection.appendChild(objectiveTitle);
  
  const objectives = [
    "Collect all coins in each level to unlock the exit",
    "Avoid hazards and traps as you navigate the maze",
    "Find the exit to progress to the next level",
    "Complete all levels to win the game"
  ];
  
  const objectivesList = document.createElement("div");
  objectivesList.style.display = "flex";
  objectivesList.style.flexDirection = "column";
  objectivesList.style.gap = "12px";
  
  objectives.forEach(objective => {
    const objectiveItem = document.createElement("div");
    objectiveItem.style.display = "flex";
    objectiveItem.style.alignItems = "center";
    objectiveItem.style.gap = "12px";
    
    const checkIcon = document.createElement("div");
    checkIcon.innerHTML = "✓";
    checkIcon.style.backgroundColor = "rgba(76, 175, 80, 0.2)";
    checkIcon.style.color = "#81C784";
    checkIcon.style.width = "24px";
    checkIcon.style.height = "24px";
    checkIcon.style.borderRadius = "50%";
    checkIcon.style.display = "flex";
    checkIcon.style.alignItems = "center";
    checkIcon.style.justifyContent = "center";
    checkIcon.style.fontWeight = "bold";
    objectiveItem.appendChild(checkIcon);
    
    const objectiveText = document.createElement("div");
    objectiveText.textContent = objective;
    objectiveText.style.fontSize = "16px";
    objectiveText.style.color = "rgba(255, 255, 255, 0.9)";
    objectiveText.style.fontFamily = "'Segoe UI', Arial, sans-serif";
    objectiveItem.appendChild(objectiveText);
    
    objectivesList.appendChild(objectiveItem);
  });
  
  objectivesSection.appendChild(objectivesList);
  instructionsContent.appendChild(objectivesSection);
  
  // Tips section
  const tipsSection = document.createElement("div");
  tipsSection.style.background = "rgba(255, 193, 7, 0.1)";
  tipsSection.style.borderRadius = "16px";
  tipsSection.style.padding = "20px";
  tipsSection.style.border = "1px solid rgba(255, 193, 7, 0.2)";
  
  const tipsTitle = document.createElement("h3");
  tipsTitle.textContent = "TIPS";
  tipsTitle.style.fontSize = "20px";
  tipsTitle.style.fontWeight = "600";
  tipsTitle.style.color = "#FFD54F";
  tipsTitle.style.margin = "0 0 15px 0";
  tipsTitle.style.letterSpacing = "1px";
  tipsTitle.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  tipsSection.appendChild(tipsTitle);
  
  const tipsList = document.createElement("div");
  tipsList.style.display = "flex";
  tipsList.style.flexDirection = "column";
  tipsList.style.gap = "10px";
  
  const tips = [
    "Listen for audio cues that signal coin collection and traps",
    "The exit will glow green when all coins have been collected"
  ];
  
  tips.forEach(tip => {
    const tipItem = document.createElement("div");
    tipItem.style.display = "flex";
    tipItem.style.alignItems = "center";
    tipItem.style.gap = "10px";
    
    const tipIcon = document.createElement("div");
    tipIcon.innerHTML = "💡";
    tipIcon.style.fontSize = "16px";
    tipItem.appendChild(tipIcon);
    
    const tipText = document.createElement("div");
    tipText.textContent = tip;
    tipText.style.fontSize = "16px";
    tipText.style.color = "rgba(255, 255, 255, 0.9)";
    tipText.style.fontFamily = "'Segoe UI', Arial, sans-serif";
    tipItem.appendChild(tipText);
    
    tipsList.appendChild(tipItem);
  });
  
  tipsSection.appendChild(tipsList);
  instructionsContent.appendChild(tipsSection);
  
  instructionsModal.appendChild(instructionsContent);

  // Close button with enhanced styling
  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "center";
  buttonContainer.style.marginTop = "30px";
  
  const closeButton = document.createElement("button");
  closeButton.textContent = "RETURN TO MENU";
  closeButton.style.padding = "14px 30px";
  closeButton.style.backgroundColor = "rgba(244, 67, 54, 0.9)";
  closeButton.style.color = "white";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "50px";
  closeButton.style.cursor = "pointer";
  closeButton.style.fontWeight = "600";
  closeButton.style.fontSize = "16px";
  closeButton.style.transition = "all 0.3s ease";
  closeButton.style.boxShadow = "0 5px 15px rgba(244, 67, 54, 0.3)";
  closeButton.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  closeButton.style.letterSpacing = "1px";
  closeButton.style.position = "relative";
  closeButton.style.overflow = "hidden";
  
  // Add shine effect to button
  const closeButtonShine = document.createElement("div");
  closeButtonShine.style.position = "absolute";
  closeButtonShine.style.top = "0";
  closeButtonShine.style.left = "0";
  closeButtonShine.style.width = "100%";
  closeButtonShine.style.height = "100%";
  closeButtonShine.style.background = "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)";
  closeButtonShine.style.backgroundSize = "200% 100%";
  closeButtonShine.style.transform = "translateX(-100%)";
  closeButtonShine.style.animation = "shine 3s infinite";
  closeButton.appendChild(closeButtonShine);

  closeButton.addEventListener("mouseover", () => {
    closeButton.style.backgroundColor = "rgba(229, 57, 53, 0.95)";
    closeButton.style.transform = "translateY(-3px)";
    closeButton.style.boxShadow = "0 8px 20px rgba(244, 67, 54, 0.4)";
  });
  
  closeButton.addEventListener("mouseout", () => {
    closeButton.style.backgroundColor = "rgba(244, 67, 54, 0.9)";
    closeButton.style.transform = "translateY(0)";
    closeButton.style.boxShadow = "0 5px 15px rgba(244, 67, 54, 0.3)";
  });

  closeButton.addEventListener("click", () => {
    closeButton.style.transform = "scale(0.95)";
    setTimeout(() => {
      instructionsModal.style.opacity = "0";
      instructionsModal.style.transform = "translate(-50%, -50%) scale(0.9)";
      
      setTimeout(() => {
        instructionsModal.remove();
      }, 300);
    }, 100);
  });

  buttonContainer.appendChild(closeButton);
  instructionsModal.appendChild(buttonContainer);
  document.body.appendChild(instructionsModal);
  
  // Animate modal appearance
  setTimeout(() => {
    instructionsModal.style.opacity = "1";
    instructionsModal.style.transform = "translate(-50%, -50%) scale(1)";
  }, 50);
}

function updateMenuBackground(theme) {
  // Create a flash effect across the entire menu
  const flash = document.createElement("div");
  flash.style.position = "fixed";
  flash.style.top = "0";
  flash.style.left = "0";
  flash.style.width = "100%";
  flash.style.height = "100%";
  flash.style.backgroundColor = theme.color;
  flash.style.opacity = "0.15";
  flash.style.pointerEvents = "none";
  flash.style.transition = "opacity 0.8s ease";
  flash.style.zIndex = "1500";
  document.body.appendChild(flash);
  
  // Add particles with theme color
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const particle = document.createElement("div");
      particle.style.position = "fixed";
      particle.style.width = Math.random() * 40 + 10 + "px";
      particle.style.height = particle.style.width;
      particle.style.borderRadius = "50%";
      particle.style.backgroundColor = theme.color;
      particle.style.opacity = "0.2";
      particle.style.pointerEvents = "none";
      
      // Position at random location at bottom of screen
      particle.style.bottom = "-50px";
      particle.style.left = Math.random() * 100 + "vw";
      
      // Set animation
      particle.style.animation = `floatUpFade ${Math.random() * 2 + 2}s forwards ease-out`;
      
      // Add animation keyframes if they don't exist
      if (!document.getElementById("particleAnimation")) {
        const style = document.createElement("style");
        style.id = "particleAnimation";
        style.textContent = `
          @keyframes floatUpFade {
            0% { transform: translateY(0) scale(1); opacity: 0.2; }
            100% { transform: translateY(-80vh) scale(0); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 3000);
    }, i * 100);
  }
  
  // Fade out flash effect
  setTimeout(() => {
    flash.style.opacity = "0";
    setTimeout(() => {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash);
      }
    }, 800);
  }, 200);

  // Update the menu cube colors with animated transition
  if (menuCube) {
    menuCube.children.forEach(cube => {
      if (cube.material) {
        // Create a smooth color transition
        const startColor = cube.material.color.clone();
        const endColor = new THREE.Color(theme.color);
        const colorDuration = 1; // seconds
        
        // Animate the color change
        let startTime = performance.now();
        function animateColor() {
          const elapsedTime = (performance.now() - startTime) / 1000;
          const progress = Math.min(elapsedTime / colorDuration, 1);
          
          if (progress < 1) {
            // Interpolate between colors
            cube.material.color.copy(startColor).lerp(endColor, progress);
            requestAnimationFrame(animateColor);
          } else {
            // Ensure final color is set exactly
            cube.material.color.copy(endColor);
          }
        }
        
        animateColor();
        
        // Update material properties
        cube.material.roughness = 0.7;
        cube.material.metalness = 0.3;
        cube.material.envMapIntensity = 1.2;
        
        // Add a subtle emission effect
        cube.material.emissive = new THREE.Color(theme.color);
        cube.material.emissiveIntensity = 0.1;
      }
    });
    
    // Add a slight acceleration to rotation for a brief moment
    const originalRotationX = menuCube.rotation.x;
    const originalRotationY = menuCube.rotation.y;
    const boostFactor = 2;
    const boostDuration = 1; // seconds
    
    let boostStartTime = performance.now();
    function animateBoost() {
      const elapsedTime = (performance.now() - boostStartTime) / 1000;
      const progress = Math.min(elapsedTime / boostDuration, 1);
      
      if (progress < 1) {
        // Calculate easing factor (ease-out)
        const easeOutFactor = 1 - Math.pow(1 - progress, 3);
        const currentBoost = boostFactor * (1 - easeOutFactor);
        
        // Apply rotation boost
        menuCube.rotation.x += 0.002 * (1 + currentBoost);
        menuCube.rotation.y += 0.003 * (1 + currentBoost);
        
        requestAnimationFrame(animateBoost);
      }
    }
    
    animateBoost();
  }
  
  // Update background gradient based on theme
  const menuContainer = document.getElementById("mainMenu");
  if (menuContainer) {
    menuContainer.style.transition = "background 1s ease";
    menuContainer.style.background = `radial-gradient(circle at center, rgba(15, 25, 35, 0.7) 0%, rgba(5, 10, 15, 0.9) 100%)`;
  }
}

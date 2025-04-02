import * as THREE from 'three';

// Lighting variables
let ambientLight = null;
let directionalLight = null;
let hemisphereLight = null;
let flashLight = null;
let lastLightningTime = 0;
let lightningActive = false;

// Create appropriate lighting based on the theme
export function createLighting(scene, theme) {
    // Calculate darkness level based on theme/level
    const darknessLevel = theme && theme.darknessLevel !== undefined ? theme.darknessLevel : 0.2;
    const hasLightningFlashes = theme && theme.hasLightningFlashes !== undefined ? theme.hasLightningFlashes : false;
    
    // Create ambient light - darker in higher levels
    const ambientIntensity = Math.max(0.3, 0.7 - darknessLevel);
    ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    scene.add(ambientLight);
    
    // Create directional light (sun)
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1, 1, 0.5);
    directionalLight.castShadow = true;
    
    // Configure shadow
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    
    // Adjust shadow camera based on platform size
    const shadowSize = 15;
    directionalLight.shadow.camera.left = -shadowSize;
    directionalLight.shadow.camera.right = shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;
    
    scene.add(directionalLight);
    
    // Create hemisphere light (sky and ground color)
    const skyColor = theme && theme.skyColor ? theme.skyColor : 0x87ceeb;
    const groundColor = theme && theme.platformColor ? theme.platformColor : 0x444444;
    hemisphereLight = new THREE.HemisphereLight(skyColor, groundColor, 0.6);
    scene.add(hemisphereLight);
    
    // If level has lightning flashes, create a flash light (initially off)
    if (hasLightningFlashes) {
        flashLight = new THREE.PointLight(0xaaccff, 0, 100); // Intensity 0 = off
        flashLight.position.set(0, 20, 0);
        scene.add(flashLight);
    }
    
    return {
        ambientLight,
        directionalLight,
        hemisphereLight,
        flashLight
    };
}

// Update lighting effects
export function updateLighting(deltaTime, currentTheme) {
    // If no theme or lights, exit
    if (!currentTheme || !ambientLight) return;
    
    // Handle lightning flashes in higher levels
    if (currentTheme && currentTheme.hasLightningFlashes && flashLight) {
        const currentTime = Date.now();
        
        // Check if it's time for a new lightning flash
        if (!lightningActive && currentTime - lastLightningTime > 5000 + Math.random() * 15000) {
            // Begin a lightning sequence
            lightningActive = true;
            lastLightningTime = currentTime;
            triggerLightningFlash();
        }
    }
}

// Creates a lightning flash effect
function triggerLightningFlash() {
    if (!flashLight) return;
    
    // First flash
    flashLight.intensity = 1.0 + Math.random() * 0.5;
    
    // Play thunder sound if available
    if (window.playSound) {
        window.playSound('thunder');
    }
    
    // Schedule second flash
    setTimeout(() => {
        flashLight.intensity = 0;
        
        // Small delay between flashes
        setTimeout(() => {
            flashLight.intensity = 0.8 + Math.random() * 0.7;
            
            // Turn off after short duration
            setTimeout(() => {
                flashLight.intensity = 0;
                lightningActive = false;
            }, 100 + Math.random() * 100);
        }, 50 + Math.random() * 50);
    }, 100 + Math.random() * 100);
}

// Add special lighting effects based on the theme
function addThemeSpecificLighting(scene, theme) {
    if (!theme) return [];
    
    const themeLights = [];
    
    switch(theme.name) {
        case "Cave":
            // Add point lights to simulate glowing crystals
            themeLights.push(...addCaveLights(scene));
            break;
        case "Volcano":
            // Add flickering lava light
            themeLights.push(...addVolcanoLights(scene));
            break;
        case "Neon":
            // Add colorful neon lights
            themeLights.push(...addNeonLights(scene));
            break;
        case "Ice":
            // Add subtle blue reflection lights
            themeLights.push(...addIceLights(scene));
            break;
        case "Ocean":
            // Add underwater caustics effect
            themeLights.push(...addOceanLights(scene));
            break;
        case "Alien":
            // Add pulsing alien lights
            themeLights.push(...addAlienLights(scene));
            break;
    }
    
    return themeLights;
}

// Cave theme special lighting
function addCaveLights(scene) {
    const lights = [];
    
    // Add a few point lights to simulate glowing crystals
    const colors = [0x6084BE, 0x5050ff, 0x9988ff];
    
    for (let i = 0; i < 5; i++) {
        const light = new THREE.PointLight(
            colors[Math.floor(Math.random() * colors.length)],
            0.6,
            10
        );
        
        // Position randomly
        light.position.set(
            (Math.random() * 20) - 10,
            1 + Math.random() * 3,
            (Math.random() * 20) - 10
        );
        
        scene.add(light);
        lights.push(light);
    }
    
    return lights;
}

// Volcano theme special lighting
function addVolcanoLights(scene) {
    const lights = [];
    
    // Add a flickering orange/red light from below
    const lavaLight = new THREE.PointLight(0xff3300, 1.5, 20);
    lavaLight.position.set(0, -5, 0);
    scene.add(lavaLight);
    
    // Store initial intensity for flickering effect
    lavaLight.userData = {
        baseIntensity: 1.5,
        flickerSpeed: 0.1,
        flickerAmount: 0.3
    };
    
    lights.push(lavaLight);
    
    // Add a few smaller lava lights
    for (let i = 0; i < 3; i++) {
        const smallLava = new THREE.PointLight(0xff5500, 0.7, 8);
        smallLava.position.set(
            (Math.random() * 16) - 8,
            -1,
            (Math.random() * 16) - 8
        );
        
        // Store initial intensity for flickering effect
        smallLava.userData = {
            baseIntensity: 0.7,
            flickerSpeed: 0.2 + Math.random() * 0.2,
            flickerAmount: 0.3
        };
        
        scene.add(smallLava);
        lights.push(smallLava);
    }
    
    return lights;
}

// Neon theme special lighting
function addNeonLights(scene) {
    const lights = [];
    
    // Add colorful spotlights for neon effect
    const colors = [0x00ffff, 0xff00ff, 0x00ff99, 0xffff00];
    
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const spotLight = new THREE.SpotLight(
            colors[i % colors.length],
            0.8,
            20,
            Math.PI / 6,
            0.5
        );
        
        spotLight.position.set(
            Math.cos(angle) * 12,
            5,
            Math.sin(angle) * 12
        );
        
        // Point toward center
        spotLight.target.position.set(0, 0, 0);
        scene.add(spotLight.target);
        
        spotLight.castShadow = true;
        scene.add(spotLight);
        lights.push(spotLight);
    }
    
    return lights;
}

// Ice theme special lighting
function addIceLights(scene) {
    const lights = [];
    
    // Add subtle blue lights to simulate ice reflections
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const light = new THREE.PointLight(0x88ccff, 0.4, 8);
        
        light.position.set(
            Math.cos(angle) * 8,
            0.5,
            Math.sin(angle) * 8
        );
        
        scene.add(light);
        lights.push(light);
    }
    
    return lights;
}

// Ocean theme special lighting
function addOceanLights(scene) {
    const lights = [];
    
    // Simulate underwater caustics with moving lights
    for (let i = 0; i < 4; i++) {
        const light = new THREE.SpotLight(0x00aaff, 0.6, 15, Math.PI / 4, 0.8);
        
        // Position lights above
        const angle = (i / 4) * Math.PI * 2;
        const radius = 5 + Math.random() * 3;
        
        light.position.set(
            Math.cos(angle) * radius,
            8,
            Math.sin(angle) * radius
        );
        
        light.target.position.set(
            Math.cos(angle + 0.5) * 3,
            0,
            Math.sin(angle + 0.5) * 3
        );
        
        scene.add(light.target);
        
        // Store animation data
        light.userData = {
            angle: angle,
            radius: radius,
            speed: 0.2 + Math.random() * 0.3
        };
        
        scene.add(light);
        lights.push(light);
    }
    
    return lights;
}

// Alien theme special lighting
function addAlienLights(scene) {
    const lights = [];
    
    // Add pulsing green/purple lights
    const alienLight = new THREE.PointLight(0x00ff77, 0.8, 15);
    alienLight.position.set(0, 5, 0);
    
    // Store pulsing data
    alienLight.userData = {
        baseIntensity: 0.8,
        pulseSpeed: 0.7,
        pulseAmount: 0.4
    };
    
    scene.add(alienLight);
    lights.push(alienLight);
    
    // Add secondary colored lights
    const colors = [0x00ff77, 0xaa00ff, 0x0077ff];
    
    for (let i = 0; i < 3; i++) {
        const light = new THREE.PointLight(colors[i], 0.5, 10);
        
        // Position around the scene
        const angle = (i / 3) * Math.PI * 2;
        
        light.position.set(
            Math.cos(angle) * 7,
            1 + i,
            Math.sin(angle) * 7
        );
        
        // Store pulsing data
        light.userData = {
            baseIntensity: 0.5,
            pulseSpeed: 0.3 + Math.random() * 0.5,
            pulseAmount: 0.3
        };
        
        scene.add(light);
        lights.push(light);
    }
    
    return lights;
}

// Update spotlight position to follow player
export function updateSpotlight(spotlight, position) {
    if (spotlight) {
        spotlight.position.set(position.x, position.y + 5, position.z);
    }
}

// Update theme-specific lighting effects
export function updateThemeLighting(themeLights, deltaTime) {
    if (!themeLights || themeLights.length === 0) return;
    
    themeLights.forEach(light => {
        if (!light.userData) return;
        
        // Handle flickering lights (for Volcano theme)
        if (light.userData.flickerSpeed) {
            light.intensity = light.userData.baseIntensity + 
                              (Math.sin(Date.now() * light.userData.flickerSpeed) * 
                               light.userData.flickerAmount);
        }
        
        // Handle pulsing lights (for Alien theme)
        if (light.userData.pulseSpeed) {
            light.intensity = light.userData.baseIntensity + 
                             (Math.sin(Date.now() * 0.001 * light.userData.pulseSpeed) * 
                              light.userData.pulseAmount);
        }
        
        // Handle moving caustic lights (for Ocean theme)
        if (light.userData.angle !== undefined && light.userData.radius) {
            light.userData.angle += deltaTime * light.userData.speed;
            
            light.position.x = Math.cos(light.userData.angle) * light.userData.radius;
            light.position.z = Math.sin(light.userData.angle) * light.userData.radius;
            
            // Move target as well for dynamic caustic effect
            if (light.target) {
                light.target.position.x = Math.cos(light.userData.angle + 0.5) * 3;
                light.target.position.z = Math.sin(light.userData.angle + 0.5) * 3;
            }
        }
    });
} 
import * as THREE from "three";


let ambientLight = null;
let directionalLight = null;
let hemisphereLight = null;
let flashLight = null;
let lastLightningTime = 0;
let lightningActive = false;


export function createLighting(scene, theme) {
  
  const darknessLevel =
    theme && theme.darknessLevel !== undefined ? theme.darknessLevel : 0.2;
  const hasLightningFlashes =
    theme && theme.hasLightningFlashes !== undefined
      ? theme.hasLightningFlashes
      : false;

  
  const ambientIntensity = Math.max(0.3, 0.7 - darknessLevel);
  ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
  scene.add(ambientLight);

  
  directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(1, 1, 0.5);
  directionalLight.castShadow = true;

  
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;

  
  const shadowSize = 15;
  directionalLight.shadow.camera.left = -shadowSize;
  directionalLight.shadow.camera.right = shadowSize;
  directionalLight.shadow.camera.top = shadowSize;
  directionalLight.shadow.camera.bottom = -shadowSize;

  scene.add(directionalLight);

  
  const skyColor = theme && theme.skyColor ? theme.skyColor : 0x87ceeb;
  const groundColor =
    theme && theme.platformColor ? theme.platformColor : 0x444444;
  hemisphereLight = new THREE.HemisphereLight(skyColor, groundColor, 0.6);
  scene.add(hemisphereLight);

  
  if (hasLightningFlashes) {
    flashLight = new THREE.PointLight(0xaaccff, 0, 100); 
    flashLight.position.set(0, 20, 0);
    scene.add(flashLight);
  }

  return {
    ambientLight,
    directionalLight,
    hemisphereLight,
    flashLight,
  };
}


export function updateLighting(deltaTime, currentTheme) {
  
  if (!currentTheme || !ambientLight) return;

  
  if (currentTheme && currentTheme.hasLightningFlashes && flashLight) {
    const currentTime = Date.now();

    
    if (
      !lightningActive &&
      currentTime - lastLightningTime > 5000 + Math.random() * 15000
    ) {
      
      lightningActive = true;
      lastLightningTime = currentTime;
      triggerLightningFlash();
    }
  }
}


function triggerLightningFlash() {
  if (!flashLight) return;

  
  flashLight.intensity = 1.0 + Math.random() * 0.5;

  
  if (window.playSound) {
    window.playSound("thunder");
  }

  
  setTimeout(() => {
    flashLight.intensity = 0;

    
    setTimeout(() => {
      flashLight.intensity = 0.8 + Math.random() * 0.7;

      
      setTimeout(() => {
        flashLight.intensity = 0;
        lightningActive = false;
      }, 100 + Math.random() * 100);
    }, 50 + Math.random() * 50);
  }, 100 + Math.random() * 100);
}


function addThemeSpecificLighting(scene, theme) {
  if (!theme) return [];

  const themeLights = [];

  switch (theme.name) {
    case "Cave":
      
      themeLights.push(...addCaveLights(scene));
      break;
    case "Volcano":
      
      themeLights.push(...addVolcanoLights(scene));
      break;
    case "Neon":
      
      themeLights.push(...addNeonLights(scene));
      break;
    case "Ice":
      
      themeLights.push(...addIceLights(scene));
      break;
    case "Ocean":
      
      themeLights.push(...addOceanLights(scene));
      break;
    case "Alien":
      
      themeLights.push(...addAlienLights(scene));
      break;
  }

  return themeLights;
}


function addCaveLights(scene) {
  const lights = [];

  
  const colors = [0x6084be, 0x5050ff, 0x9988ff];

  for (let i = 0; i < 5; i++) {
    const light = new THREE.PointLight(
      colors[Math.floor(Math.random() * colors.length)],
      0.6,
      10
    );

    
    light.position.set(
      Math.random() * 20 - 10,
      1 + Math.random() * 3,
      Math.random() * 20 - 10
    );

    scene.add(light);
    lights.push(light);
  }

  return lights;
}


function addVolcanoLights(scene) {
  const lights = [];

  
  const lavaLight = new THREE.PointLight(0xff3300, 1.5, 20);
  lavaLight.position.set(0, -5, 0);
  scene.add(lavaLight);

  
  lavaLight.userData = {
    baseIntensity: 1.5,
    flickerSpeed: 0.1,
    flickerAmount: 0.3,
  };

  lights.push(lavaLight);

  
  for (let i = 0; i < 3; i++) {
    const smallLava = new THREE.PointLight(0xff5500, 0.7, 8);
    smallLava.position.set(Math.random() * 16 - 8, -1, Math.random() * 16 - 8);

    
    smallLava.userData = {
      baseIntensity: 0.7,
      flickerSpeed: 0.2 + Math.random() * 0.2,
      flickerAmount: 0.3,
    };

    scene.add(smallLava);
    lights.push(smallLava);
  }

  return lights;
}


function addNeonLights(scene) {
  const lights = [];

  
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

    spotLight.position.set(Math.cos(angle) * 12, 5, Math.sin(angle) * 12);

    
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight.target);

    spotLight.castShadow = true;
    scene.add(spotLight);
    lights.push(spotLight);
  }

  return lights;
}


function addIceLights(scene) {
  const lights = [];

  
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const light = new THREE.PointLight(0x88ccff, 0.4, 8);

    light.position.set(Math.cos(angle) * 8, 0.5, Math.sin(angle) * 8);

    scene.add(light);
    lights.push(light);
  }

  return lights;
}


function addOceanLights(scene) {
  const lights = [];

  
  for (let i = 0; i < 4; i++) {
    const light = new THREE.SpotLight(0x00aaff, 0.6, 15, Math.PI / 4, 0.8);

    
    const angle = (i / 4) * Math.PI * 2;
    const radius = 5 + Math.random() * 3;

    light.position.set(Math.cos(angle) * radius, 8, Math.sin(angle) * radius);

    light.target.position.set(
      Math.cos(angle + 0.5) * 3,
      0,
      Math.sin(angle + 0.5) * 3
    );

    scene.add(light.target);

    
    light.userData = {
      angle: angle,
      radius: radius,
      speed: 0.2 + Math.random() * 0.3,
    };

    scene.add(light);
    lights.push(light);
  }

  return lights;
}


function addAlienLights(scene) {
  const lights = [];

  
  const alienLight = new THREE.PointLight(0x00ff77, 0.8, 15);
  alienLight.position.set(0, 5, 0);

  
  alienLight.userData = {
    baseIntensity: 0.8,
    pulseSpeed: 0.7,
    pulseAmount: 0.4,
  };

  scene.add(alienLight);
  lights.push(alienLight);

  
  const colors = [0x00ff77, 0xaa00ff, 0x0077ff];

  for (let i = 0; i < 3; i++) {
    const light = new THREE.PointLight(colors[i], 0.5, 10);

    
    const angle = (i / 3) * Math.PI * 2;

    light.position.set(Math.cos(angle) * 7, 1 + i, Math.sin(angle) * 7);

    
    light.userData = {
      baseIntensity: 0.5,
      pulseSpeed: 0.3 + Math.random() * 0.5,
      pulseAmount: 0.3,
    };

    scene.add(light);
    lights.push(light);
  }

  return lights;
}


export function updateSpotlight(spotlight, position) {
  if (spotlight) {
    spotlight.position.set(position.x, position.y + 5, position.z);
  }
}


export function updateThemeLighting(themeLights, deltaTime) {
  if (!themeLights || themeLights.length === 0) return;

  themeLights.forEach((light) => {
    if (!light.userData) return;

    
    if (light.userData.flickerSpeed) {
      light.intensity =
        light.userData.baseIntensity +
        Math.sin(Date.now() * light.userData.flickerSpeed) *
          light.userData.flickerAmount;
    }

    
    if (light.userData.pulseSpeed) {
      light.intensity =
        light.userData.baseIntensity +
        Math.sin(Date.now() * 0.001 * light.userData.pulseSpeed) *
          light.userData.pulseAmount;
    }

    
    if (light.userData.angle !== undefined && light.userData.radius) {
      light.userData.angle += deltaTime * light.userData.speed;

      light.position.x = Math.cos(light.userData.angle) * light.userData.radius;
      light.position.z = Math.sin(light.userData.angle) * light.userData.radius;

      
      if (light.target) {
        light.target.position.x = Math.cos(light.userData.angle + 0.5) * 3;
        light.target.position.z = Math.sin(light.userData.angle + 0.5) * 3;
      }
    }
  });
}

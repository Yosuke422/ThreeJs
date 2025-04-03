import * as THREE from "three";
import {
    getCellSize,
    getMazeLayout,
    getPlatformSize,
    getWallDepth,
    getWallWidth,
    playerHeight,
} from "./config.js";
import { generateTexture } from "./textureGenerator.js";

let wallCollisionBoxes = [];

let obstacleCollisionBoxes = [];

const textureLoader = new THREE.TextureLoader();
const textureCache = {};

function getTexture(textureName) {
  if (!textureCache[textureName]) {
    const canvas = generateTexture(textureName);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    textureCache[textureName] = texture;
  }
  return textureCache[textureName];
}

function getBumpMap(textureName) {
  const bumpMapName = `${textureName}_bump`;
  if (!textureCache[bumpMapName]) {
    try {
      textureCache[bumpMapName] = textureLoader.load(
        `textures/${bumpMapName}.jpg`
      );
      textureCache[bumpMapName].wrapS = THREE.RepeatWrapping;
      textureCache[bumpMapName].wrapT = THREE.RepeatWrapping;
      textureCache[bumpMapName].repeat.set(1, 1);
    } catch (e) {
      textureCache[bumpMapName] = null;
    }
  }
  return textureCache[bumpMapName];
}

export function createMaze(scene, theme) {
  const mazeLayout = getMazeLayout();
  const wallWidth = getWallWidth();
  const wallDepth = getWallDepth();
  const cellSize = getCellSize();
  const platformSize = getPlatformSize();
  const wallHeight = theme && theme.wallHeight ? theme.wallHeight : 2.5;

  wallCollisionBoxes = [];

  const maze = new THREE.Group();
  scene.add(maze);

  for (let i = 0; i < mazeLayout.length; i++) {
    for (let j = 0; j < mazeLayout[i].length; j++) {
      if (mazeLayout[i][j] === 1) {
        const wallX = -platformSize + j * cellSize + cellSize / 2;
        const wallZ = -platformSize + i * cellSize + cellSize / 2;
        
        // Use the enhanced createWall function
        const wall = createWall(
          scene, 
          wallX, 
          wallZ, 
          wallWidth, 
          wallDepth, 
          wallHeight, 
          theme
        );
        
        // Remove from scene as we'll add it to the maze group
        scene.remove(wall);
        maze.add(wall);

        const collisionMargin = 0.05;
        const collisionBox = new THREE.Box3(
          new THREE.Vector3(
            wall.position.x - wallWidth / 2 + collisionMargin,
            wall.position.y - wallHeight / 2,
            wall.position.z - wallDepth / 2 + collisionMargin
          ),
          new THREE.Vector3(
            wall.position.x + wallWidth / 2 - collisionMargin,
            wall.position.y + wallHeight / 2,
            wall.position.z + wallDepth / 2 - collisionMargin
          )
        );
        wallCollisionBoxes.push(collisionBox);
      }
    }
  }

  const obstacles = createObstacles(scene, theme);
  maze.add(obstacles);

  return maze;
}

function addPanelsToWall(wall, width, height, depth, baseColor) {
  const edgeGeometry = new THREE.BoxGeometry(
    width * 0.9,
    height * 0.05,
    depth * 0.05
  );
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(baseColor).offsetHSL(0, 0, 0.1),
    roughness: 0.5,
    metalness: 0.8,
  });

  const numPanels = 3;
  const panelSpacing = (height * 0.8) / numPanels;

  for (let i = 0; i < numPanels; i++) {
    const panelY = -height / 2 + (i + 1) * panelSpacing;

    const panel = new THREE.Mesh(edgeGeometry, edgeMaterial);
    panel.position.set(0, panelY, depth / 2 - 0.02);
    wall.add(panel);
  }
}

function addGridToWall(wall, width, height, depth, glowColor) {
  const lineGeometry = new THREE.BoxGeometry(width * 0.95, height * 0.01, 0.01);
  const lineMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: glowColor,
    emissiveIntensity: 1.0,
    roughness: 0.2,
    metalness: 0.9,
  });

  const numLines = 5;
  const lineSpacing = (height * 0.9) / numLines;

  for (let i = 0; i < numLines; i++) {
    const lineY = -height / 2 + (i + 1) * lineSpacing;

    const hLine = new THREE.Mesh(lineGeometry, lineMaterial);
    hLine.position.set(0, lineY, depth / 2 + 0.01);
    wall.add(hLine);

    if (i < numLines - 1) {
      const vLine = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.01, height * 0.9, 0.01),
        lineMaterial
      );
      vLine.position.set((width / 4) * (i - 1), 0, depth / 2 + 0.01);
      wall.add(vLine);
    }
  }
}

function addWallToppers(wall, width, height, depth, theme) {
  if (theme.wallTexture === "wood") {
    addForestToppers(wall, width, height, depth);
  } else if (theme.wallTexture === "coral") {
    addCoralToppers(wall, width, height, depth);
  } else if (theme.wallTexture === "alien") {
    addAlienToppers(wall, width, height, depth);
  }
}

function addForestToppers(wall, width, height, depth) {
  const leafSize = 0.3;
  const numLeaves = Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < numLeaves; i++) {
    const leafGeometry = new THREE.SphereGeometry(leafSize, 4, 4);
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x33cc33,
      roughness: 0.9,
      metalness: 0.0,
    });

    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

    const offsetX = (Math.random() - 0.5) * (width * 0.8);
    const offsetZ = (Math.random() - 0.5) * (depth * 0.8);

    leaf.position.set(offsetX, height / 2 + leafSize / 2, offsetZ);

    leaf.scale.y = 1.5;

    leaf.castShadow = true;
    wall.add(leaf);
  }
}

function addCoralToppers(wall, width, height, depth) {
  const numFormations = Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < numFormations; i++) {
    const formationGeometry = new THREE.CylinderGeometry(0.1, 0.2, 0.4, 5);
    const formationMaterial = new THREE.MeshStandardMaterial({
      color: 0xff7777,
      roughness: 0.8,
      metalness: 0.2,
      emissive: 0x330000,
      emissiveIntensity: 0.2,
    });

    const formation = new THREE.Mesh(formationGeometry, formationMaterial);

    const offsetX = (Math.random() - 0.5) * (width * 0.8);
    const offsetZ = (Math.random() - 0.5) * (depth * 0.8);

    formation.position.set(offsetX, height / 2 + 0.2, offsetZ);

    formation.rotation.y = Math.random() * Math.PI;

    formation.castShadow = true;
    wall.add(formation);
  }
}

function addAlienToppers(wall, width, height, depth) {
  const numGrowths = Math.floor(Math.random() * 2) + 1;

  for (let i = 0; i < numGrowths; i++) {
    const growthGeometry = new THREE.ConeGeometry(0.1, 0.6, 4);
    const growthMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff33,
      roughness: 0.4,
      metalness: 0.7,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
    });

    const growth = new THREE.Mesh(growthGeometry, growthMaterial);

    const offsetX = (Math.random() - 0.5) * (width * 0.8);
    const offsetZ = (Math.random() - 0.5) * (depth * 0.8);

    growth.position.set(offsetX, height / 2 + 0.3, offsetZ);

    growth.rotation.y = Math.random() * Math.PI;
    growth.rotation.x = (Math.random() - 0.5) * 0.5;

    growth.castShadow = true;
    wall.add(growth);
  }
}

export function createPlatform(scene, theme) {
  const platformSize = getPlatformSize();
  const floorTexture = new THREE.CanvasTexture(
    theme && theme.name 
      ? generateTexture(getThemeTexture(theme.name), 1024)
      : generateTexture("marble", 1024)
  );
  
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(6, 6);

  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.6,
    metalness: 0.2,
    bumpMap: floorTexture,
    bumpScale: 0.05
  });

  const floorGeometry = new THREE.BoxGeometry(
    platformSize * 2, 
    1, 
    platformSize * 2
  );
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, -0.5, 0);
  floor.receiveShadow = true;
  
  // Add decorative floor pattern
  if (theme) {
    // Add grid pattern or other floor details
    const gridSize = 5;
    const lineWidth = 0.05;
    const lineColor = theme.gridColor || 0x333333;
    const lineOpacity = theme.gridOpacity || 0.3;
    
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: lineOpacity
    });
    
    for (let x = -platformSize; x <= platformSize; x += gridSize) {
      const lineGeometry = new THREE.BoxGeometry(lineWidth, 0.01, platformSize * 2);
      const line = new THREE.Mesh(lineGeometry, gridMaterial);
      line.position.set(x, 0.001, 0);
      floor.add(line);
    }
    
    for (let z = -platformSize; z <= platformSize; z += gridSize) {
      const lineGeometry = new THREE.BoxGeometry(platformSize * 2, 0.01, lineWidth);
      const line = new THREE.Mesh(lineGeometry, gridMaterial);
      line.position.set(0, 0.001, z);
      floor.add(line);
    }
  }
  
  scene.add(floor);
  return floor;
}

function getThemeTexture(themeName) {
  switch (themeName) {
    case "Forest": return "wood";
    case "Desert": return "sand";
    case "Cave": return "stone";
    case "Ice": return "ice";
    case "Volcano": return "lava";
    case "Alien": return "alien";
    case "Neon": return "neon";
    case "Ocean": return "coral";
    default: return "marble";
  }
}

export function createStartFinish(scene) {
  const cellSize = getCellSize();
  const platformSize = getPlatformSize();

  const startLineGeometry = new THREE.BoxGeometry(cellSize, 0.1, cellSize);
  const startLineMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
  startLine.position.set(
    -platformSize + cellSize / 2,
    0.01,
    -platformSize + cellSize / 2
  );
  scene.add(startLine);

  const finishLineGeometry = new THREE.BoxGeometry(cellSize, 0.1, cellSize);
  const finishLineMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
  });
  const finishLine = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
  finishLine.position.set(
    platformSize - cellSize / 2,
    0.01,
    platformSize - cellSize / 2
  );
  scene.add(finishLine);

  return { startLine, finishLine };
}

function createObstacles(scene, theme) {
  const obstaclesGroup = new THREE.Group();

  obstacleCollisionBoxes = [];

  return obstaclesGroup;
}

function createSpikeGeometry(width, height, depth) {
  const geometry = new THREE.BufferGeometry();

  const baseX = width / 2;
  const baseZ = depth / 2;

  const numSpikes = Math.max(2, Math.floor(width / 0.3));
  const spikeWidth = width / numSpikes;

  const vertices = [];
  const indices = [];

  vertices.push(-baseX, 0, -baseZ);
  vertices.push(baseX, 0, -baseZ);
  vertices.push(baseX, 0, baseZ);
  vertices.push(-baseX, 0, baseZ);

  let vertexIndex = 4;
  for (let i = 0; i < numSpikes; i++) {
    const spikeX = -baseX + spikeWidth / 2 + i * spikeWidth;
    vertices.push(spikeX, height, 0);

    indices.push(vertexIndex, i === 0 ? 0 : vertexIndex - 1, 3);

    indices.push(vertexIndex, 2, i === numSpikes - 1 ? 1 : vertexIndex + 1);

    indices.push(vertexIndex, i === 0 ? 0 : vertexIndex - 1, 1);

    indices.push(vertexIndex, 3, i === numSpikes - 1 ? 2 : vertexIndex + 1);

    vertexIndex++;
  }

  indices.push(0, 1, 2);
  indices.push(0, 2, 3);

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function checkWallCollisions(position, radius, isJumping = false) {
  const playerBox = new THREE.Box3(
    new THREE.Vector3(
      position.x - radius,
      position.y - playerHeight / 2,
      position.z - radius
    ),
    new THREE.Vector3(
      position.x + radius,
      position.y + playerHeight / 2,
      position.z + radius
    )
  );

  for (const wallBox of wallCollisionBoxes) {
    if (playerBox.intersectsBox(wallBox)) {
      return true;
    }
  }

  return false;
}

export function getObstacleCollisionBoxes() {
  return obstacleCollisionBoxes;
}

export function findPathToFinish() {
  const mazeLayout = getMazeLayout();

  const start = { i: 0, j: 0 };
  const goal = { i: mazeLayout.length - 1, j: mazeLayout[0].length - 1 };

  const queue = [];
  queue.push(start);

  const visited = {};
  const parent = {};

  visited[`${start.i},${start.j}`] = true;

  const directions = [
    { di: -1, dj: 0 },
    { di: 0, dj: 1 },
    { di: 1, dj: 0 },
    { di: 0, dj: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.i === goal.i && current.j === goal.j) {
      break;
    }

    for (const dir of directions) {
      const newI = current.i + dir.di;
      const newJ = current.j + dir.dj;

      if (
        newI >= 0 &&
        newI < mazeLayout.length &&
        newJ >= 0 &&
        newJ < mazeLayout[0].length &&
        mazeLayout[newI][newJ] === 0 &&
        !visited[`${newI},${newJ}`]
      ) {
        visited[`${newI},${newJ}`] = true;
        parent[`${newI},${newJ}`] = { i: current.i, j: current.j };
        queue.push({ i: newI, j: newJ });
      }
    }
  }

  return { parent, visited };
}

export function findValidCoinPositions() {
  const mazeLayout = getMazeLayout();
  const cellSize = getCellSize();
  const platformSize = getPlatformSize();
  const validPositions = [];

  const cellsWithSpikes = window.cellsWithSpikes || new Set();

  for (let i = 0; i < mazeLayout.length; i++) {
    for (let j = 0; j < mazeLayout[i].length; j++) {
      if (mazeLayout[i][j] === 0) {
        if (cellsWithSpikes.has(`${i},${j}`)) {
          continue;
        }

        if (
          (i === 0 && j === 0) ||
          (i === mazeLayout.length - 1 && j === mazeLayout[0].length - 1)
        ) {
          continue;
        }

        const x = -platformSize + j * cellSize + cellSize / 2;
        const z = -platformSize + i * cellSize + cellSize / 2;

        validPositions.push(new THREE.Vector3(x, 0.5, z));
      }
    }
  }

  return validPositions;
}

export function createWall(scene, x, z, width, depth, height, theme) {
  let wallTexture;
  let wallMaterial;
  
  const hasTheme = theme && theme.name;
  
  // Create a more realistic wall based on theme
  if (hasTheme) {
    switch (theme.name) {
      case "Forest":
        wallTexture = new THREE.CanvasTexture(generateTexture("wood", 512));
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(width/2, height/2);
        
        wallMaterial = new THREE.MeshStandardMaterial({
          map: wallTexture,
          roughness: 0.8,
          metalness: 0.2,
          bumpMap: wallTexture,
          bumpScale: 0.05,
          envMapIntensity: 0.5
        });
        break;
        
      case "Desert":
        wallTexture = new THREE.CanvasTexture(generateTexture("sand", 512));
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(width, height);
        
        wallMaterial = new THREE.MeshStandardMaterial({
          map: wallTexture,
          roughness: 0.9,
          metalness: 0.1,
          bumpMap: wallTexture,
          bumpScale: 0.03
        });
        break;
        
      case "Cave":
        wallTexture = new THREE.CanvasTexture(generateTexture("stone", 512));
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(width/2, height/2);
        
        wallMaterial = new THREE.MeshStandardMaterial({
          map: wallTexture,
          roughness: 0.9,
          metalness: 0.2,
          bumpMap: wallTexture,
          bumpScale: 0.1,
          aoMapIntensity: 0.8
        });
        break;
        
      case "Ice":
        wallTexture = new THREE.CanvasTexture(generateTexture("ice", 512));
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(width/1.5, height/1.5);
        
        wallMaterial = new THREE.MeshPhysicalMaterial({
          map: wallTexture,
          roughness: 0.1,
          metalness: 0.2,
          transmission: 0.4,
          thickness: 0.5,
          clearcoat: 0.8,
          clearcoatRoughness: 0.2,
          envMapIntensity: 1.0
        });
        break;
        
      case "Volcano":
        wallTexture = new THREE.CanvasTexture(generateTexture("lava", 512));
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(width/1.5, height/1.5);
        
        wallMaterial = new THREE.MeshStandardMaterial({
          map: wallTexture,
          roughness: 0.8,
          metalness: 0.5,
          emissive: new THREE.Color(0xff5500),
          emissiveIntensity: 0.2,
          bumpMap: wallTexture,
          bumpScale: 0.08
        });
        break;
        
      case "Alien":
        wallTexture = new THREE.CanvasTexture(generateTexture("alien", 512));
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(width/2, height/2);
        
        wallMaterial = new THREE.MeshStandardMaterial({
          map: wallTexture,
          roughness: 0.5,
          metalness: 0.8,
          emissive: new THREE.Color(0x00ff77),
          emissiveIntensity: 0.1,
          bumpMap: wallTexture,
          bumpScale: 0.05
        });
        break;
        
      case "Neon":
        wallTexture = new THREE.CanvasTexture(generateTexture("neon", 512));
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(width/1.5, height/1.5);
        
        wallMaterial = new THREE.MeshStandardMaterial({
          map: wallTexture,
          roughness: 0.3,
          metalness: 0.7,
          emissive: new THREE.Color(0x00ffff),
          emissiveIntensity: 0.2,
          envMapIntensity: 1.0
        });
        break;
        
      case "Ocean":
        wallTexture = new THREE.CanvasTexture(generateTexture("coral", 512));
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(width/1.5, height/1.5);
        
        wallMaterial = new THREE.MeshStandardMaterial({
          map: wallTexture,
          roughness: 0.7,
          metalness: 0.3,
          bumpMap: wallTexture,
          bumpScale: 0.07
        });
        break;
        
      default:
        // Use modernUI for a sleek default style
        wallTexture = new THREE.CanvasTexture(generateTexture("modernUI", 512));
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(width/2, height/2);
        
        wallMaterial = new THREE.MeshStandardMaterial({
          map: wallTexture,
          roughness: 0.3,
          metalness: 0.7,
          envMapIntensity: 0.8
        });
    }
  } else {
    wallTexture = new THREE.CanvasTexture(generateTexture("modernUI", 512));
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(width/2, height/2);
    
    wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.3,
      metalness: 0.7,
      envMapIntensity: 0.8
    });
  }

  // Create the wall geometry with beveled edges for a more modern look
  const wallGeometry = new THREE.BoxGeometry(width, height, depth);
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  
  wall.position.set(x, height / 2, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  
  // Add wall details based on theme
  if (hasTheme) {
    // Add edge highlights/trim to walls
    const edgeWidth = 0.1;
    const edgeGeometry = new THREE.BoxGeometry(
      width + 0.02, 
      height, 
      depth + 0.02
    );
    
    let edgeMaterial;
    
    switch (theme.name) {
      case "Neon":
        edgeMaterial = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 0.5,
          roughness: 0.3,
          metalness: 0.8
        });
        break;
      case "Alien":
        edgeMaterial = new THREE.MeshStandardMaterial({
          color: 0x00ff77,
          emissive: 0x00ff77,
          emissiveIntensity: 0.3,
          roughness: 0.4,
          metalness: 0.7
        });
        break;
      case "Ice":
        edgeMaterial = new THREE.MeshStandardMaterial({
          color: 0x88ccff,
          emissive: 0x88ccff,
          emissiveIntensity: 0.2,
          roughness: 0.1,
          metalness: 0.9,
          transparent: true,
          opacity: 0.7
        });
        break;
      case "Volcano":
        edgeMaterial = new THREE.MeshStandardMaterial({
          color: 0xff3300,
          emissive: 0xff3300,
          emissiveIntensity: 0.4,
          roughness: 0.7,
          metalness: 0.5
        });
        break;
      default:
        // Default edge material - subtle metal trim
        edgeMaterial = new THREE.MeshStandardMaterial({
          color: theme.trimColor || 0x333333,
          roughness: 0.5,
          metalness: 0.8
        });
    }
    
    // Create edge/trim mesh
    const edges = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edges.scale.set(1.02, 0.98, 1.02); // Slightly larger on x/z, slightly smaller on y
    wall.add(edges);
  }

  scene.add(wall);
  return wall;
}

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
  const wallColor = theme ? theme.wallColor : 0x8b4513;
  const mazeLayout = getMazeLayout();
  const wallWidth = getWallWidth();
  const wallDepth = getWallDepth();
  const cellSize = getCellSize();
  const platformSize = getPlatformSize();

  const wallHeight = theme && theme.wallHeight ? theme.wallHeight : 2.5;
  const wallRoughness =
    theme && theme.wallRoughness !== undefined ? theme.wallRoughness : 0.7;
  const wallMetalness =
    theme && theme.wallMetalness !== undefined ? theme.wallMetalness : 0.1;
  const wallEmissive =
    theme && theme.wallEmissive ? theme.wallEmissive : 0x000000;
  const wallBevelSize =
    theme && theme.wallBevelSize !== undefined ? theme.wallBevelSize : 0;
  const wallPattern =
    theme && theme.wallPattern ? theme.wallPattern : "default";
  const wallToppers =
    theme && theme.wallToppers !== undefined ? theme.wallToppers : false;

  wallCollisionBoxes = [];

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: wallRoughness,
    metalness: wallMetalness,
    emissive: wallEmissive,
    emissiveIntensity: wallEmissive === 0x000000 ? 0 : 0.5,
  });

  if (theme && theme.wallTexture) {
    try {
      const texture = getTexture(theme.wallTexture);
      wallMaterial.map = texture;

      wallMaterial.map.repeat.set(1, wallHeight / 2);
    } catch (e) {
      console.warn(`Failed to generate texture: ${theme.wallTexture}`, e);
    }
  }

  let wallGeometry;
  if (wallBevelSize > 0) {
    wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);

    if (!(wallGeometry instanceof THREE.BufferGeometry)) {
      wallGeometry = new THREE.BufferGeometry().fromGeometry(wallGeometry);
    }
  } else {
    wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
  }

  const maze = new THREE.Group();
  scene.add(maze);

  for (let i = 0; i < mazeLayout.length; i++) {
    for (let j = 0; j < mazeLayout[i].length; j++) {
      if (mazeLayout[i][j] === 1) {
        const thisWallGeometry = wallGeometry.clone();

        const thisWallMaterial = wallMaterial.clone();

        if (wallPattern === "cracked" || wallPattern === "weathered") {
          const variation = Math.random() * 0.2 - 0.1;
          thisWallMaterial.color.offsetHSL(0, 0, variation);
        }

        const wall = new THREE.Mesh(thisWallGeometry, thisWallMaterial);

        wall.position.set(
          -platformSize + j * cellSize + cellSize / 2,
          wallHeight / 2,
          -platformSize + i * cellSize + cellSize / 2
        );

        if (wallPattern === "panel") {
          addPanelsToWall(wall, wallWidth, wallHeight, wallDepth, wallColor);
        } else if (wallPattern === "grid") {
          addGridToWall(wall, wallWidth, wallHeight, wallDepth, wallEmissive);
        }

        if (wallToppers) {
          addWallToppers(wall, wallWidth, wallHeight, wallDepth, theme);
        }

        wall.castShadow = true;
        wall.receiveShadow = true;
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

  const platformColor = theme ? theme.platformColor : 0x607d8b;
  const platformTexture =
    theme && theme.platformTexture ? theme.platformTexture : null;
  const platformRoughness =
    theme && theme.platformRoughness !== undefined
      ? theme.platformRoughness
      : 0.8;
  const platformMetalness =
    theme && theme.platformMetalness !== undefined
      ? theme.platformMetalness
      : 0.1;

  const platformGeometry = new THREE.BoxGeometry(
    platformSize * 2,
    0.5,
    platformSize * 2
  );

  const platformMaterial = new THREE.MeshStandardMaterial({
    color: platformColor,
    roughness: platformRoughness,
    metalness: platformMetalness,
  });

  if (platformTexture) {
    try {
      const texture = getTexture(platformTexture);
      platformMaterial.map = texture;

      platformMaterial.map.repeat.set(platformSize / 2, platformSize / 2);
    } catch (e) {
      console.warn(
        `Failed to generate platform texture: ${platformTexture}`,
        e
      );
    }
  }

  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.y = -0.25;
  platform.receiveShadow = true;
  scene.add(platform);

  return platform;
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

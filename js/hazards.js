import * as THREE from "three";
import { getCollectionState } from "./coins.js";
import {
  getCellSize,
  getCurrentLevel,
  getMazeLayout,
  getPlatformSize,
} from "./config.js";

const spikes = [];
let spikesGroup = null;
let hazardsActive = true;
let playerHealth = 100;
let lastHitTime = 0;
const hitCooldown = 1000;
let healthBar = null;

let spikesActivated = true;
let lastSpikeToggleTime = 0;

export function createHazards(scene, theme) {
  const level = getCurrentLevel();
  const baseHealth = 100;
  playerHealth = Math.max(50, baseHealth - level * 5);
  hazardsActive = true;
  spikesActivated = true;
  lastSpikeToggleTime = 0;

  spikesGroup = new THREE.Group();
  scene.add(spikesGroup);

  createHealthBar();

  generateSpikeTraps(scene, theme);

  return { spikesGroup };
}

function createHealthBar() {
  if (document.getElementById("healthBar")) {
    document.getElementById("healthBar").remove();
  }

  const container = document.createElement("div");
  container.id = "healthBarContainer";
  container.style.position = "absolute";
  container.style.bottom = "20px";
  container.style.left = "20px";
  container.style.width = "200px";
  container.style.height = "20px";
  container.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  container.style.borderRadius = "10px";
  container.style.padding = "3px";
  container.style.zIndex = "1000";

  healthBar = document.createElement("div");
  healthBar.id = "healthBar";
  healthBar.style.width = "100%";
  healthBar.style.height = "100%";
  healthBar.style.backgroundColor = "#00cc00";
  healthBar.style.borderRadius = "8px";
  healthBar.style.transition = "width 0.3s ease-in-out";

  const healthText = document.createElement("div");
  healthText.id = "healthText";
  healthText.style.position = "absolute";
  healthText.style.top = "50%";
  healthText.style.left = "50%";
  healthText.style.transform = "translate(-50%, -50%)";
  healthText.style.color = "white";
  healthText.style.fontFamily = "Arial, sans-serif";
  healthText.style.fontSize = "12px";
  healthText.style.fontWeight = "bold";
  healthText.style.textShadow = "1px 1px 2px black";
  healthText.textContent = `Health: ${playerHealth}%`;

  container.appendChild(healthBar);
  container.appendChild(healthText);
  document.body.appendChild(container);

  updateHealthBar();
}

function updateHealthBar() {
  if (!healthBar) return;

  healthBar.style.width = `${playerHealth}%`;

  if (playerHealth > 60) {
    healthBar.style.backgroundColor = "#00cc00";
  } else if (playerHealth > 30) {
    healthBar.style.backgroundColor = "#ffcc00";
  } else {
    healthBar.style.backgroundColor = "#cc0000";
  }

  const healthText = document.getElementById("healthText");
  if (healthText) {
    healthText.textContent = `Health: ${playerHealth}%`;
  }
}

function isInNarrowCorridor(i, j, mazeLayout) {
  let wallCount = 0;

  if (i <= 0 || i >= mazeLayout.length - 1 || mazeLayout[i - 1][j] === 1)
    wallCount++;
  if (j >= mazeLayout[0].length - 1 || mazeLayout[i][j + 1] === 1) wallCount++;
  if (i >= mazeLayout.length - 1 || mazeLayout[i + 1][j] === 1) wallCount++;
  if (j <= 0 || mazeLayout[i][j - 1] === 1) wallCount++;

  if (wallCount >= 3) return true;

  const hasNorthWall = i <= 0 || mazeLayout[i - 1][j] === 1;
  const hasSouthWall = i >= mazeLayout.length - 1 || mazeLayout[i + 1][j] === 1;
  const hasEastWall =
    j >= mazeLayout[0].length - 1 || mazeLayout[i][j + 1] === 1;
  const hasWestWall = j <= 0 || mazeLayout[i][j - 1] === 1;

  const isNorthSouthCorridor =
    hasNorthWall && hasSouthWall && !hasEastWall && !hasWestWall;
  const isEastWestCorridor =
    hasEastWall && hasWestWall && !hasNorthWall && !hasSouthWall;

  return isNorthSouthCorridor || isEastWestCorridor;
}

function generateSpikeTraps(scene, theme) {
  const mazeLayout = getMazeLayout();
  const cellSize = getCellSize();
  const platformSize = getPlatformSize();
  const currentLevel = getCurrentLevel();

  spikes.length = 0;

  while (spikesGroup.children.length) {
    spikesGroup.remove(spikesGroup.children[0]);
  }

  const spikeColor = theme && theme.wallColor ? theme.wallColor : 0x777777;
  const spikeMetalness = 0.8;
  const spikeRoughness = 0.2;

  const spikeMaterial = new THREE.MeshStandardMaterial({
    color: spikeColor,
    metalness: spikeMetalness,
    roughness: spikeRoughness,
    emissive: new THREE.Color(0x330000),
    emissiveIntensity: 0.2,
  });

  const indicatorMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4500,
    transparent: true,
    opacity: 0.5,
    emissive: new THREE.Color(0xff4500),
    emissiveIntensity: 0.8,
  });

  const validCells = [];

  for (let i = 0; i < mazeLayout.length; i++) {
    for (let j = 0; j < mazeLayout[i].length; j++) {
      if (mazeLayout[i][j] === 0) {
        if (
          (i === 0 && j === 0) ||
          (i === 1 && j === 0) ||
          (i === 0 && j === 1) ||
          (i === mazeLayout.length - 1 && j === mazeLayout[0].length - 1) ||
          (i === mazeLayout.length - 2 && j === mazeLayout[0].length - 1) ||
          (i === mazeLayout.length - 1 && j === mazeLayout[0].length - 2) ||
          isInNarrowCorridor(i, j, mazeLayout)
        ) {
          continue;
        }

        validCells.push({ i, j });
      }
    }
  }

  const shuffledCells = validCells.sort(() => Math.random() - 0.5);

  const baseSpikePercentage = 0.1;
  const spikePercentage = Math.min(
    0.25,
    baseSpikePercentage + currentLevel * 0.015
  );
  const numSpikeCells = Math.ceil(shuffledCells.length * spikePercentage);

  const cellsWithSpikes = new Set();

  function wouldCreateTooManyConsecutiveSpikes(row, col) {
    let consecutiveLeft = 0;
    for (let j = 1; j <= 2; j++) {
      if (cellsWithSpikes.has(`${row},${col - j}`)) {
        consecutiveLeft++;
      } else {
        break;
      }
    }

    let consecutiveRight = 0;
    for (let j = 1; j <= 2; j++) {
      if (cellsWithSpikes.has(`${row},${col + j}`)) {
        consecutiveRight++;
      } else {
        break;
      }
    }

    let consecutiveUp = 0;
    for (let i = 1; i <= 2; i++) {
      if (cellsWithSpikes.has(`${row - i},${col}`)) {
        consecutiveUp++;
      } else {
        break;
      }
    }

    let consecutiveDown = 0;
    for (let i = 1; i <= 2; i++) {
      if (cellsWithSpikes.has(`${row + i},${col}`)) {
        consecutiveDown++;
      } else {
        break;
      }
    }

    const horizontalProblem =
      consecutiveLeft >= 2 ||
      consecutiveRight >= 2 ||
      (consecutiveLeft >= 1 && consecutiveRight >= 1) ||
      (consecutiveLeft >= 1 && cellsWithSpikes.has(`${row},${col + 1}`)) ||
      (consecutiveRight >= 1 && cellsWithSpikes.has(`${row},${col - 1}`));

    const verticalProblem =
      consecutiveUp >= 2 ||
      consecutiveDown >= 2 ||
      (consecutiveUp >= 1 && consecutiveDown >= 1) ||
      (consecutiveUp >= 1 && cellsWithSpikes.has(`${row + 1},${col}`)) ||
      (consecutiveDown >= 1 && cellsWithSpikes.has(`${row - 1},${col}`));

    const diagonalProblem =
      (cellsWithSpikes.has(`${row - 1},${col - 1}`) &&
        cellsWithSpikes.has(`${row - 1},${col}`) &&
        cellsWithSpikes.has(`${row},${col - 1}`)) ||
      (cellsWithSpikes.has(`${row - 1},${col + 1}`) &&
        cellsWithSpikes.has(`${row - 1},${col}`) &&
        cellsWithSpikes.has(`${row},${col + 1}`)) ||
      (cellsWithSpikes.has(`${row + 1},${col - 1}`) &&
        cellsWithSpikes.has(`${row + 1},${col}`) &&
        cellsWithSpikes.has(`${row},${col - 1}`)) ||
      (cellsWithSpikes.has(`${row + 1},${col + 1}`) &&
        cellsWithSpikes.has(`${row + 1},${col}`) &&
        cellsWithSpikes.has(`${row},${col + 1}`));

    return horizontalProblem || verticalProblem || diagonalProblem;
  }

  let spikesPlaced = 0;
  const maxSpikesToPlace = numSpikeCells;

  const maxAttempts = shuffledCells.length * 2;
  let attempts = 0;

  while (spikesPlaced < maxSpikesToPlace && attempts < maxAttempts) {
    attempts++;

    const cellIndex = attempts % shuffledCells.length;
    const cell = shuffledCells[cellIndex];

    if (cellsWithSpikes.has(`${cell.i},${cell.j}`)) {
      continue;
    }

    if (wouldCreateTooManyConsecutiveSpikes(cell.i, cell.j)) {
      continue;
    }

    cellsWithSpikes.add(`${cell.i},${cell.j}`);
    spikesPlaced++;

    const x = -platformSize + cell.j * cellSize + cellSize / 2;
    const z = -platformSize + cell.i * cellSize + cellSize / 2;

    const spikeHeight = 0.15 + Math.random() * 0.05;
    const spikeSet = createFullCellSpikes(
      spikeMaterial,
      cellSize,
      currentLevel
    );

    spikeSet.position.set(x, 0.01, z);

    spikesGroup.add(spikeSet);

    spikes.push({
      position: new THREE.Vector3(x, 0, z),
      radius: (cellSize / 2) * 0.8,
      damage: 10 + currentLevel * 2,
      mesh: spikeSet,
      activated: true,
      type: "spikes",
      cell: { i: cell.i, j: cell.j },
    });
  }

  console.log(
    `Placed ${spikesPlaced} spike traps out of ${numSpikeCells} desired`
  );

  scene.add(spikesGroup);

  function findConnectedSpikes() {
    const connectedGroups = [];
    const visited = new Set();

    for (const cellKey of cellsWithSpikes) {
      if (visited.has(cellKey)) continue;

      const [i, j] = cellKey.split(",").map(Number);

      const group = [{ i, j }];
      visited.add(cellKey);

      const queue = [{ i, j }];

      while (queue.length > 0) {
        const { i: ci, j: cj } = queue.shift();

        const neighbors = [
          { i: ci - 1, j: cj },
          { i: ci + 1, j: cj },
          { i: ci, j: cj - 1 },
          { i: ci, j: cj + 1 },
        ];

        for (const { i: ni, j: nj } of neighbors) {
          const neighborKey = `${ni},${nj}`;

          if (cellsWithSpikes.has(neighborKey) && !visited.has(neighborKey)) {
            group.push({ i: ni, j: nj });
            visited.add(neighborKey);
            queue.push({ i: ni, j: nj });
          }
        }
      }

      if (group.length > 1) {
        connectedGroups.push(group);
      }
    }

    return connectedGroups;
  }

  const connectedGroups = findConnectedSpikes();

  for (const group of connectedGroups) {
    if (group.length > 1) {
      for (const { i, j } of group) {
        const x = -platformSize + j * cellSize + cellSize / 2;
        const z = -platformSize + i * cellSize + cellSize / 2;

        const indicatorGeometry = new THREE.BoxGeometry(
          cellSize * 0.9,
          0.05,
          cellSize * 0.9
        );
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);

        indicator.position.set(x, 0.4, z);

        spikesGroup.add(indicator);
      }

      const firstCell = group[0];
      const x = -platformSize + firstCell.j * cellSize + cellSize / 2;
      const z = -platformSize + firstCell.i * cellSize + cellSize / 2;

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = 512;
      canvas.height = 256;

      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
      gradient.addColorStop(1, "rgba(255, 50, 0, 0.8)");

      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.strokeStyle = "yellow";
      context.lineWidth = 5;
      context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      context.font = "bold 80px Arial";
      context.fillStyle = "yellow";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.shadowColor = "black";
      context.shadowBlur = 10;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.fillText("JUMP!", canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
      });
      const sprite = new THREE.Sprite(spriteMaterial);

      sprite.position.set(x, 2.0, z);
      sprite.scale.set(2.0, 1.0, 1.0);

      sprite.userData = {
        baseY: 2.0,
        animationPhase: Math.random() * Math.PI * 2,
      };

      group[0].userData.jumpSprite = sprite;

      spikesGroup.add(sprite);
    }
  }

  return spikes;
}

function createFullCellSpikes(material, cellSize, level) {
  const group = new THREE.Group();

  group.userData = {
    originalColor: null,
    spikeMaterial: null,
    baseMaterial: null,
  };

  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color: 0x777777,
      metalness: 0.8,
      roughness: 0.2,
    });
  }

  const spikeHeight = level < 4 ? 0.3 : 0.3 + level * 0.03;
  const spikeBaseRadius = 0.05;
  const coverage = 0.8;

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });

  const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(cellSize * 0.3, cellSize * 0.4, 16),
    glowMaterial
  );
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = 0.01;
  group.add(glowRing);

  group.userData.glowRing = glowRing;

  const gridSize = 5;
  const spacing = (cellSize * coverage) / gridSize;

  const spikeMaterial = new THREE.MeshStandardMaterial({
    color: material.color ? material.color : 0x777777,
    metalness: material.metalness !== undefined ? material.metalness : 0.8,
    roughness: material.roughness !== undefined ? material.roughness : 0.2,
    emissive: new THREE.Color(0x330000),
    emissiveIntensity: 0.2,
  });

  group.userData.spikeMaterial = spikeMaterial;

  if (spikeMaterial && spikeMaterial.color) {
    group.userData.originalColor = new THREE.Color(
      spikeMaterial.color.getHex()
    );
  } else {
    group.userData.originalColor = new THREE.Color(0x777777);
  }

  const spikePieces = new THREE.Group();
  group.add(spikePieces);

  group.userData.spikePieces = spikePieces;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const xPos = (i - (gridSize - 1) / 2) * spacing;
      const zPos = (j - (gridSize - 1) / 2) * spacing;

      const spikeGeometry = new THREE.ConeGeometry(
        spikeBaseRadius,
        spikeHeight,
        4
      );
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);

      spike.position.set(xPos, spikeHeight / 2, zPos);

      spike.rotation.x = Math.PI;

      spike.rotation.z = Math.random() * 0.3;

      spikePieces.add(spike);
    }
  }

  const baseSize = cellSize * 0.9;

  const baseGeometry = new THREE.BoxGeometry(baseSize, 0.05, baseSize);

  let baseMaterial;
  if (level >= 6) {
    const baseColor =
      material && material.color
        ? new THREE.Color(material.color).offsetHSL(0, 0, -0.1)
        : new THREE.Color(0x666666);

    baseMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness:
        material && material.metalness !== undefined
          ? material.metalness + 0.1
          : 0.9,
      roughness:
        material && material.roughness !== undefined
          ? material.roughness - 0.1
          : 0.1,
      emissive: new THREE.Color(0x330000),
      emissiveIntensity: 0.3,
    });
  } else {
    baseMaterial = new THREE.MeshStandardMaterial({
      color: material && material.color ? material.color : 0x777777,
      metalness:
        material && material.metalness !== undefined ? material.metalness : 0.8,
      roughness:
        material && material.roughness !== undefined ? material.roughness : 0.2,
    });
  }

  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = -0.01;
  group.add(base);

  group.userData.baseMaterial = baseMaterial;

  return group;
}

export function updateSpikes(deltaTime) {
  if (!hazardsActive || !spikes || spikes.length === 0) return;

  const currentTime = Date.now();

  const level = getCurrentLevel();
  const toggleInterval = Math.max(800, 2500 - level * 200);

  if (currentTime - lastSpikeToggleTime > toggleInterval) {
    spikesActivated = !spikesActivated;
    lastSpikeToggleTime = currentTime;

    if (typeof playSoundEffect === "function") {
      playSoundEffect("spikeToggle");
    }
  }

  animateJumpSprites(currentTime);

  for (let i = 0; i < spikes.length; i++) {
    const spike = spikes[i];

    if (!spike || !spike.activated || !spike.mesh) continue;

    const mesh = spike.mesh;
    if (!mesh) continue;

    if (!mesh.visible) {
      mesh.visible = true;
    }

    if (!mesh.userData) {
      mesh.userData = {};
    }

    const spikePieces = mesh.userData.spikePieces || mesh;
    const glowRing = mesh.userData.glowRing;
    const spikeMaterial = mesh.userData.spikeMaterial;
    const originalColor =
      mesh.userData.originalColor ||
      (spikeMaterial && spikeMaterial.color
        ? new THREE.Color(spikeMaterial.color.getHex())
        : new THREE.Color(0x777777));

    if (spike.isTimed) {
      const adjustedTime =
        (currentTime + (spike.timingOffset || 0)) % (toggleInterval * 2);
      const thisSpikeActivated = adjustedTime < toggleInterval;

      try {
        if (thisSpikeActivated) {
          if (!mesh.visible) {
            mesh.visible = true;

            if (spikePieces && spikePieces.position) {
              spikePieces.position.y = -0.3;
            }

            spike.animatingUp = true;
            spike.animationStartTime = currentTime;
            spike.animationDuration = 150;

            if (glowRing && glowRing.material) {
              glowRing.material.opacity = 0;
              if (glowRing.scale) {
                glowRing.scale.set(0.5, 0.5, 0.5);
              }
            }

            if (spikeMaterial && spikeMaterial.emissive) {
              spikeMaterial.emissive.setRGB(0.3, 0, 0);
            }
          }

          if (spike.animatingUp && spikePieces && spikePieces.position) {
            const elapsed = currentTime - spike.animationStartTime;
            const progress = Math.min(1.0, elapsed / spike.animationDuration);

            const easeOut = 1 - Math.pow(1 - progress, 2);
            spikePieces.position.y = -0.3 + easeOut * 0.31;

            if (glowRing && glowRing.material && glowRing.scale) {
              glowRing.material.opacity = easeOut * 0.4;
              glowRing.scale.set(0.5 + easeOut * 0.5, 0.5 + easeOut * 0.5, 1);

              glowRing.material.opacity *=
                0.7 + Math.sin(currentTime * 0.01) * 0.3;
            }

            if (spikeMaterial) {
              if (spikeMaterial.emissiveIntensity !== undefined) {
                spikeMaterial.emissiveIntensity = 0.1 + easeOut * 0.3;
              }

              if (spikeMaterial.color && originalColor) {
                const pulseAmt = Math.sin(currentTime * 0.01) * 0.1 + 0.1;
                spikeMaterial.color.copy(originalColor);
                spikeMaterial.color.offsetHSL(0, 0, pulseAmt);
              }
            }

            if (progress >= 1.0) {
              spike.animatingUp = false;
            }
          }
        } else {
          if (
            mesh.visible &&
            !spike.animatingDown &&
            spikePieces &&
            spikePieces.position
          ) {
            spikePieces.position.y = 0.01;
            spike.animatingDown = true;
            spike.animationStartTime = currentTime;
            spike.animationDuration = 150;
          }

          if (spike.animatingDown && spikePieces && spikePieces.position) {
            const elapsed = currentTime - spike.animationStartTime;
            const progress = Math.min(1.0, elapsed / spike.animationDuration);

            const easeIn = Math.pow(progress, 2);
            spikePieces.position.y = 0.01 - easeIn * 0.31;

            if (glowRing && glowRing.material && glowRing.scale) {
              glowRing.material.opacity = 0.4 * (1 - easeIn);
              glowRing.scale.set(1 - easeIn * 0.5, 1 - easeIn * 0.5, 1);
            }

            if (
              spikeMaterial &&
              spikeMaterial.emissiveIntensity !== undefined
            ) {
              spikeMaterial.emissiveIntensity = 0.4 * (1 - easeIn);
            }

            if (progress >= 1.0) {
              spike.animatingDown = false;
              mesh.visible = false;
            }
          }
        }
      } catch (e) {
        if (thisSpikeActivated) {
          mesh.visible = true;
          if (spikePieces && spikePieces.position) {
            spikePieces.position.y = 0.01;
          }
        } else {
          mesh.visible = false;
        }
      }
    }

    if (spike.isMoving) {
      try {
        const baseY = spike.originalY || 0.01;
        const amplitude = 0.4;
        const newY =
          baseY +
          Math.sin(
            (spike.phase || 0) + currentTime * 0.002 * (spike.speed || 1)
          ) *
            amplitude;

        if (spikePieces && spikePieces.position) {
          spikePieces.position.y = newY;
        } else if (mesh.position) {
          mesh.position.y = newY;
        }

        if (spikeMaterial && spikeMaterial.emissiveIntensity !== undefined) {
          const pulseAmt = Math.sin(currentTime * 0.004) * 0.15 + 0.15;
          spikeMaterial.emissiveIntensity = 0.2 + pulseAmt;

          if (originalColor && spikeMaterial.color) {
            spikeMaterial.color.copy(originalColor);
            spikeMaterial.color.offsetHSL(0, 0, pulseAmt * 0.2);
          }
        }

        if (glowRing && glowRing.material && glowRing.scale) {
          glowRing.material.opacity =
            0.2 + Math.sin((spike.phase || 0) + currentTime * 0.003) * 0.1;
          const pulseScale =
            0.9 + Math.sin((spike.phase || 0) + currentTime * 0.005) * 0.1;
          glowRing.scale.set(pulseScale, pulseScale, 1);
        }

        spike.phase = (spike.phase || 0) + deltaTime * (spike.speed || 1);
      } catch (e) {
        console.log("Error animating moving spike:", e);
      }
    }
  }
}

function animateJumpSprites(currentTime) {
  if (!spikesGroup) return;

  spikesGroup.traverse((object) => {
    if (
      object instanceof THREE.Sprite &&
      object.userData &&
      object.userData.baseY !== undefined
    ) {
      const frequency = 1.5;
      const amplitude = 0.3;
      const phase = object.userData.animationPhase || 0;

      const newY =
        object.userData.baseY +
        Math.sin(currentTime * 0.001 * frequency + phase) * amplitude;

      object.position.y = newY;

      const scalePulse =
        1.0 + Math.sin(currentTime * 0.002 * frequency + phase) * 0.1;
      object.scale.set(2.0 * scalePulse, 1.0 * scalePulse, 1.0);
    }
  });
}

export function checkSpikeCollisions(playerPosition) {
  if (!hazardsActive) return false;

  let nearestSpike = null;
  let nearestDistance = Infinity;

  for (const spike of spikes) {
    const distance = new THREE.Vector2(
      playerPosition.x - spike.position.x,
      playerPosition.z - spike.position.z
    ).length();

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestSpike = spike;
    }
  }

  if (Date.now() - lastHitTime < hitCooldown) {
    return false;
  }

  const cellSize = getCellSize();
  const platformSize = getPlatformSize();

  const playerGridX = Math.floor((playerPosition.x + platformSize) / cellSize);
  const playerGridZ = Math.floor((playerPosition.z + platformSize) / cellSize);

  if (playerPosition.y < 0.1) {
    for (let i = 0; i < spikes.length; i++) {
      const spike = spikes[i];

      if (!spike.activated) continue;

      const spikeGridZ = spike.cell.i;
      const spikeGridX = spike.cell.j;

      if (playerGridZ === spikeGridZ && playerGridX === spikeGridX) {
        damagePlayer(spike.damage);

        if (typeof playSoundEffect === "function") {
          playSoundEffect("spike");
        }

        flashScreen();

        return true;
      }
    }
  }

  return false;
}

export function damagePlayer(amount) {
  if (Date.now() - lastHitTime < hitCooldown) return;

  lastHitTime = Date.now();

  playerHealth = Math.max(0, playerHealth - amount);
  updateHealthBar();

  playSoundEffect("hit");
  flashScreen();

  if (playerHealth <= 0) {
    playerDied();
  }
}

function playSoundEffect(effect) {
  if (window.playSound) {
    window.playSound(effect);
  }
}

function flashScreen() {
  const flash = document.createElement("div");
  flash.style.position = "absolute";
  flash.style.top = "0";
  flash.style.left = "0";
  flash.style.width = "100%";
  flash.style.height = "100%";
  flash.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
  flash.style.pointerEvents = "none";
  flash.style.zIndex = "999";
  flash.style.transition = "opacity 0.5s ease-out";

  document.body.appendChild(flash);

  setTimeout(() => {
    flash.style.opacity = "0";
    setTimeout(() => {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash);
      }
    }, 500);
  }, 100);
}

function playerDied() {
  hazardsActive = false;

  const deathMessage = document.createElement("div");
  deathMessage.id = "deathMessage";
  deathMessage.style.position = "absolute";
  deathMessage.style.top = "50%";
  deathMessage.style.left = "50%";
  deathMessage.style.transform = "translate(-50%, -50%)";
  deathMessage.style.color = "red";
  deathMessage.style.fontFamily = "Arial, sans-serif";
  deathMessage.style.fontSize = "48px";
  deathMessage.style.fontWeight = "bold";
  deathMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  deathMessage.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  deathMessage.style.padding = "20px";
  deathMessage.style.borderRadius = "10px";
  deathMessage.style.zIndex = "1000";
  deathMessage.innerHTML = "You died!<br>Restarting level...";
  document.body.appendChild(deathMessage);

  setTimeout(() => {
    if (window.restartLevel) {
      window.restartLevel();
    } else {
      location.reload();
    }
  }, 3000);
}

export function updateHazardStatus() {
  const { coinsCollected, numCoins } = getCollectionState();

  if (coinsCollected >= numCoins) {
    hazardsActive = false;

    const successMessage = document.createElement("div");
    successMessage.id = "safetyMessage";
    successMessage.style.position = "absolute";
    successMessage.style.top = "30%";
    successMessage.style.left = "50%";
    successMessage.style.transform = "translate(-50%, -50%)";
    successMessage.style.color = "green";
    successMessage.style.fontFamily = "Arial, sans-serif";
    successMessage.style.fontSize = "24px";
    successMessage.style.fontWeight = "bold";
    successMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
    successMessage.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    successMessage.style.padding = "15px";
    successMessage.style.borderRadius = "10px";
    successMessage.style.zIndex = "999";
    successMessage.style.opacity = "1";
    successMessage.style.transition = "opacity 0.5s ease-out";
    successMessage.innerHTML = "All coins collected!<br>The maze is now safe.";
    document.body.appendChild(successMessage);

    setTimeout(() => {
      successMessage.style.opacity = "0";
      setTimeout(() => {
        if (successMessage.parentNode) {
          successMessage.parentNode.removeChild(successMessage);
        }
      }, 500);
    }, 3000);
  }

  return hazardsActive;
}

export function cleanupHazards() {
  spikes.length = 0;

  if (document.getElementById("healthBarContainer")) {
    document.getElementById("healthBarContainer").remove();
  }

  if (document.getElementById("deathMessage")) {
    document.getElementById("deathMessage").remove();
  }

  if (document.getElementById("safetyMessage")) {
    document.getElementById("safetyMessage").remove();
  }
}

export function updateFallingObjects() {
  return;
}

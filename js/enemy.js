import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import {
  playerHeight,
  playerRadius,
  getPlatformSize,
  getCellSize,
} from "./config.js";
import { getCollectionState } from "./coins.js";

let mutant = null;
let mutantMixer = null;
let runningAnimation = null;
let dyingAnimation = null;
let isChasing = false;
let chaseCooldown = 2000;
let chaseTimeout = null;
let isDead = false;
let mutantRadius = playerRadius;
let debugHelper = null;
let hasSpawned = false;
let allCoinsCollected = false;

export function updateCoinCollectionStatus() {
  const { coinsCollected, numCoins } = getCollectionState();
  const previousStatus = allCoinsCollected;
  allCoinsCollected = coinsCollected >= numCoins;

  if (allCoinsCollected && !previousStatus && isChasing) {
    stopChasing();
    console.log("All coins collected! Mutant has stopped chasing.");
  }

  return allCoinsCollected;
}

function stopChasing() {
  isChasing = false;

  if (runningAnimation) {
    runningAnimation.stop();
    runningAnimation.enabled = false;
  }
}

export function createMutant(scene) {
  console.log("Creating mutant enemy...");

  allCoinsCollected = false;

  const fbxLoader = new FBXLoader();

  const mutantContainer = new THREE.Object3D();

  const modelPath = "assets/Mutant.fbx";
  console.log(`Loading main model from: ${modelPath}`);

  fbxLoader.load(
    modelPath,

    (fbx) => {
      console.log(`Successfully loaded model from: ${modelPath}`);

      const scale = playerHeight / 2;
      fbx.scale.set(scale * 0.01, scale * 0.01, scale * 0.01);

      mutantMixer = new THREE.AnimationMixer(fbx);

      fbx.position.y = 0;

      mutantContainer.add(fbx);
      mutant = mutantContainer;

      const runningPath = "assets/Running.fbx";
      console.log(`Loading running animation from: ${runningPath}`);

      fbxLoader.load(
        runningPath,

        (runFbx) => {
          console.log(
            `Successfully loaded running animation from: ${runningPath}`
          );
          runningAnimation = mutantMixer.clipAction(runFbx.animations[0]);
          runningAnimation.play();
          runningAnimation.enabled = false;

          const dyingPath = "assets/Dying.fbx";
          console.log(`Loading dying animation from: ${dyingPath}`);

          fbxLoader.load(
            dyingPath,

            (dyingFbx) => {
              console.log(
                `Successfully loaded dying animation from: ${dyingPath}`
              );
              dyingAnimation = mutantMixer.clipAction(dyingFbx.animations[0]);
              dyingAnimation.setLoop(THREE.LoopOnce);
              dyingAnimation.clampWhenFinished = true;
              dyingAnimation.enabled = false;

              console.log(
                "All mutant models and animations loaded successfully!"
              );
            },

            (error) => {
              console.error(`Error loading dying animation: ${error}`);
            }
          );
        },

        (error) => {
          console.error(`Error loading running animation: ${error}`);
        }
      );
    },

    (error) => {
      console.error(`Error loading model: ${error}`);
    }
  );

  return mutantContainer;
}

export function spawnMutantAtStart(scene, playerHasMoved) {
  console.log(
    "Attempt to spawn mutant. Has moved:",
    playerHasMoved,
    "Has spawned:",
    hasSpawned,
    "Mutant exists:",
    !!mutant
  );

  if (!mutant || hasSpawned || !playerHasMoved) return;

  const platformSize = getPlatformSize();
  const cellSize = getCellSize();

  mutant.position.set(
    -platformSize + cellSize / 2,
    0,
    -platformSize + cellSize + cellSize / 2
  );

  scene.add(mutant);
  hasSpawned = true;

  console.log("Mutant spawned at player starting position:", mutant.position);

  startChaseCountdown();

  return mutant;
}

function startChaseCountdown() {
  console.log("Starting chase countdown for", chaseCooldown, "ms");
  chaseTimeout = setTimeout(() => {
    if (!allCoinsCollected) {
      isChasing = true;
      if (runningAnimation) {
        runningAnimation.enabled = true;
        runningAnimation.play();
        console.log("Running animation started");
      } else {
        console.warn("Running animation not available");
      }
      console.log("Mutant started chasing!");
    } else {
      console.log("All coins already collected. Mutant will not chase.");
    }
  }, chaseCooldown);
}

export function updateMutant(
  delta,
  playerPosition,
  checkWallCollisions,
  playerHasMoved,
  scene
) {
  updateCoinCollectionStatus();

  if (playerHasMoved && !hasSpawned) {
    console.log("Player has moved, attempting to spawn mutant");
    spawnMutantAtStart(scene, playerHasMoved);
    return;
  }

  if (!mutant || !mutantMixer || isDead || !hasSpawned) {
    if (Math.random() < 0.01) {
      console.log(
        "Skipping mutant update. Mutant:",
        !!mutant,
        "Mixer:",
        !!mutantMixer,
        "IsDead:",
        isDead,
        "HasSpawned:",
        hasSpawned
      );
    }
    return;
  }

  mutantMixer.update(delta);

  if (allCoinsCollected && isChasing) {
    stopChasing();
  }

  if (!isChasing) {
    const direction = new THREE.Vector3();
    direction.subVectors(playerPosition, mutant.position);
    direction.y = 0;

    if (direction.length() > 0.1) {
      const angle = Math.atan2(direction.x, direction.z);
      mutant.rotation.y = angle;
    }
    return;
  }

  const direction = new THREE.Vector3();
  direction.subVectors(playerPosition, mutant.position);
  direction.y = 0;

  const distance = direction.length();
  direction.normalize();

  if (distance > 0.1) {
    const angle = Math.atan2(direction.x, direction.z);
    mutant.rotation.y = angle;
  }

  const speed = 3.5;

  const pathfindingDelta = Math.min(delta, 0.1) * speed;

  let moveAmount = pathfindingDelta;
  let hasMoved = false;

  const pathfindingRadius = mutantRadius * 1.5;

  if (
    tryMoveInDirection(
      direction,
      moveAmount,
      pathfindingRadius,
      checkWallCollisions
    )
  ) {
    hasMoved = true;
  } else {
    hasMoved = tryAlternativeDirections(
      moveAmount,
      pathfindingRadius,
      checkWallCollisions,
      playerPosition
    );
  }

  mutant.position.y = 0;

  if (distance < mutantRadius + playerRadius) {
    mutantCatchPlayer();
  }

  function tryMoveInDirection(dir, amount, radius, collisionCheck) {
    const originalPosition = mutant.position.clone();

    const newPosition = originalPosition
      .clone()
      .add(dir.clone().multiplyScalar(amount));

    mutant.position.copy(newPosition);

    if (collisionCheck(mutant.position, radius)) {
      mutant.position.copy(originalPosition);
      return false;
    }

    return true;
  }

  function tryAlternativeDirections(
    amount,
    radius,
    collisionCheck,
    targetPosition
  ) {
    const platformSize = getPlatformSize();
    const cellSize = getCellSize();

    const mutantX = mutant.position.x;
    const mutantZ = mutant.position.z;

    const gridI = Math.floor((mutantZ + platformSize) / cellSize);
    const gridJ = Math.floor((mutantX + platformSize) / cellSize);

    const targetX = targetPosition.x;
    const targetZ = targetPosition.z;
    const targetGridI = Math.floor((targetZ + platformSize) / cellSize);
    const targetGridJ = Math.floor((targetX + platformSize) / cellSize);

    const directions = [];

    if (targetGridI < gridI) directions.push(new THREE.Vector3(0, 0, -1));
    if (targetGridI > gridI) directions.push(new THREE.Vector3(0, 0, 1));
    if (targetGridJ < gridJ) directions.push(new THREE.Vector3(-1, 0, 0));
    if (targetGridJ > gridJ) directions.push(new THREE.Vector3(1, 0, 0));

    directions.push(new THREE.Vector3(-1, 0, -1).normalize());
    directions.push(new THREE.Vector3(1, 0, -1).normalize());
    directions.push(new THREE.Vector3(-1, 0, 1).normalize());
    directions.push(new THREE.Vector3(1, 0, 1).normalize());

    for (const dir of directions) {
      if (tryMoveInDirection(dir, amount, radius, collisionCheck)) {
        return true;
      }
    }

    const originalDir = new THREE.Vector3()
      .subVectors(targetPosition, mutant.position)
      .normalize();

    for (let factor = 0.8; factor >= 0.2; factor -= 0.2) {
      if (
        tryMoveInDirection(originalDir, amount * factor, radius, collisionCheck)
      ) {
        return true;
      }
    }

    return false;
  }
}

function mutantCatchPlayer() {
  if (isDead || allCoinsCollected) return;

  console.log("Mutant caught player!");

  isChasing = false;
  isDead = true;

  const caughtMessage = document.createElement("div");
  caughtMessage.id = "caughtMessage";
  caughtMessage.style.position = "absolute";
  caughtMessage.style.top = "50%";
  caughtMessage.style.left = "50%";
  caughtMessage.style.transform = "translate(-50%, -50%)";
  caughtMessage.style.color = "red";
  caughtMessage.style.fontFamily = "Arial, sans-serif";
  caughtMessage.style.fontSize = "48px";
  caughtMessage.style.fontWeight = "bold";
  caughtMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  caughtMessage.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  caughtMessage.style.padding = "20px";
  caughtMessage.style.borderRadius = "10px";
  caughtMessage.style.zIndex = "1000";
  caughtMessage.innerHTML = "Caught by the mutant!<br>Restarting level...";
  document.body.appendChild(caughtMessage);

  setTimeout(() => {
    if (window.restartLevel) {
      window.restartLevel();
    } else {
      location.reload();
    }
  }, 3000);
}

export function cleanupEnemy() {
  console.log("Cleaning up enemy resources");

  if (chaseTimeout) {
    clearTimeout(chaseTimeout);
    chaseTimeout = null;
  }

  isChasing = false;
  isDead = false;
  hasSpawned = false;
  allCoinsCollected = false;

  if (mutant && mutant.parent) {
    mutant.parent.remove(mutant);
  }

  mutant = null;
  mutantMixer = null;
  runningAnimation = null;
  dyingAnimation = null;
  debugHelper = null;
}

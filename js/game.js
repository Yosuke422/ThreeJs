import * as THREE from "three";
import {
  createCoins,
  getCollectionState,
  updateCoins,
  updateParticles,
} from "./coins.js";
import {
  getCellSize,
  getCurrentLevel,
  getPlatformSize,
  playerHeight,
  setCurrentLevel,
} from "./config.js";
import {
  checkSpikeCollisions,
  cleanupHazards,
  createHazards,
  damagePlayer,
  updateHazardStatus,
  updateSpikes,
} from "./hazards.js";
import {
  cleanupLevelUI,
  createGameCompleteMessage,
  createLevelCompleteMessage,
  createLevelUI,
  createNextLevelButton,
  getLevelTheme,
  getNextLevel,
  hasNextLevel,
  updateLevelIndicator,
} from "./level.js";
import { createLighting, updateLighting } from "./lighting.js";
import {
  checkWallCollisions,
  createMaze,
  createPlatform,
  createStartFinish,
  findValidCoinPositions,
} from "./maze.js";
import {
  createPlayer,
  getPlayerState,
  resetPlayerMovement,
  setupControls,
  updatePlayer,
} from "./player.js";
import { initSounds, isSoundEnabled, toggleSound } from "./sound.js";
import {
  cleanupSpearTraps,
  createSpearTraps,
  updateSpearTraps,
} from "./spearTrap.js";

let scene, camera, renderer, cameraContainer, player;
let finishLine, coinSpotlight, levelIndicator;
let prevTime, validCoinPositions;
let isPaused = false;
let gameObjects = {
  walls: [],
  coins: [],
  platform: null,
  lights: [],
  obstacles: [],
  hazards: null,
  spearTraps: null,
  finishLine: null,
};

let levelCompleted = false;

export function initGame() {
  scene = new THREE.Scene();

  const initialTheme = getLevelTheme(getCurrentLevel());

  if (initialTheme) {
    scene.background = new THREE.Color(initialTheme.skyColor || 0x87ceeb);

    const fogDensity = initialTheme.fogDensity
      ? initialTheme.fogDensity * 3.5
      : 0.035;
    scene.fog = new THREE.FogExp2(
      initialTheme.fogColor || 0x87ceeb,
      fogDensity
    );
  } else {
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.035);
  }

  window.gameScene = scene;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  initSounds();

  levelIndicator = createLevelUI();

  createSoundToggle();

  levelCompleted = false;

  loadLevel(getCurrentLevel());

  prevTime = performance.now();
  animate();
}

function createSoundToggle() {
  const soundToggle = document.createElement("button");
  soundToggle.id = "soundToggle";
  soundToggle.style.position = "absolute";
  soundToggle.style.bottom = "20px";
  soundToggle.style.right = "20px";
  soundToggle.style.width = "40px";
  soundToggle.style.height = "40px";
  soundToggle.style.background = "rgba(0,0,0,0.5)";
  soundToggle.style.border = "none";
  soundToggle.style.borderRadius = "50%";
  soundToggle.style.color = "white";
  soundToggle.style.fontSize = "20px";
  soundToggle.style.cursor = "pointer";
  soundToggle.style.zIndex = "1000";

  soundToggle.innerHTML = isSoundEnabled() ? "🔊" : "🔇";

  soundToggle.addEventListener("click", () => {
    const newState = toggleSound(!isSoundEnabled());
    soundToggle.innerHTML = newState ? "🔊" : "🔇";
  });

  document.body.appendChild(soundToggle);
}

function cleanupGame() {
  if (window.gameAnimationFrame) {
    cancelAnimationFrame(window.gameAnimationFrame);
  }

  if (renderer && renderer.domElement) {
    document.body.removeChild(renderer.domElement);
  }

  const menuButton = document.getElementById("menuButton");
  if (menuButton) menuButton.remove();

  const soundToggle = document.getElementById("soundToggle");
  if (soundToggle) soundToggle.remove();

  const levelName = document.getElementById("levelName");
  if (levelName) levelName.remove();

  const levelIndicatorElem = document.getElementById("levelIndicator");
  if (levelIndicatorElem) levelIndicatorElem.remove();

  const nextLevelButton = document.getElementById("nextLevelButton");
  if (nextLevelButton) nextLevelButton.remove();

  const resetButton = document.getElementById("resetButton");
  if (resetButton) resetButton.remove();

  const levelCompleteMessage = document.getElementById("levelCompleteMessage");
  if (levelCompleteMessage) levelCompleteMessage.remove();

  const gameCompleteMessage = document.getElementById("gameCompleteMessage");
  if (gameCompleteMessage) gameCompleteMessage.remove();

  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  gameObjects = {
    walls: [],
    coins: [],
    platform: null,
    lights: [],
    obstacles: [],
    hazards: null,
    spearTraps: null,
    finishLine: null,
  };
}

export function loadLevel(levelIndex) {
  setCurrentLevel(levelIndex);
  const cellSize = getCellSize();
  const platformSize = getPlatformSize();

  levelCompleted = false;

  resetPlayerMovement();

  const nextLevelButton = document.getElementById("nextLevelButton");
  if (nextLevelButton) {
    nextLevelButton.remove();
  }

  const resetButton = document.getElementById("resetButton");
  if (resetButton) {
    resetButton.remove();
  }

  const levelCompleteMessage = document.getElementById("levelCompleteMessage");
  if (levelCompleteMessage) {
    levelCompleteMessage.remove();
  }

  const gameCompleteMessage = document.getElementById("gameCompleteMessage");
  if (gameCompleteMessage) {
    gameCompleteMessage.remove();
  }

  const loadingIndicator = document.getElementById("loadingIndicator");
  if (loadingIndicator) {
    loadingIndicator.remove();
  }

  const theme = getLevelTheme(levelIndex);
  if (!document.getElementById("levelName")) {
    const nameElement = document.createElement("div");
    nameElement.id = "levelName";
    nameElement.style.position = "absolute";
    nameElement.style.top = "50px";
    nameElement.style.right = "20px";
    nameElement.style.color = "white";
    nameElement.style.fontFamily = "Arial, sans-serif";
    nameElement.style.fontSize = "20px";
    nameElement.style.fontWeight = "bold";
    nameElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
    document.body.appendChild(nameElement);
  }

  if (theme) {
    document.getElementById("levelName").textContent = `Theme: ${
      theme.name || "Default"
    }`;

    scene.background = new THREE.Color(theme.skyColor || 0x87ceeb);

    const fogDensity = theme.fogDensity ? theme.fogDensity * 3.5 : 0.035;
    scene.fog = new THREE.FogExp2(theme.fogColor || 0x87ceeb, fogDensity);
  } else {
    document.getElementById("levelName").textContent = "Theme: Default";
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.035);
  }

  clearLevel();

  if (!player) {
    const playerObjects = createPlayer(scene);
    cameraContainer = playerObjects.cameraContainer;
    camera = playerObjects.camera;
    player = playerObjects.player;
    setupControls(cameraContainer, camera);

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  } else {
    resetPlayerMovement();
  }

  cameraContainer.position.set(
    -platformSize + cellSize / 2,
    playerHeight,
    -platformSize + cellSize + cellSize / 2
  );

  cameraContainer.rotation.set(0, 0, 0);
  camera.rotation.set(0, 0, 0);

  const maze = createMaze(scene, theme);
  gameObjects.walls.push(maze);

  const platform = createPlatform(scene, theme);
  gameObjects.platform = platform;

  const { startLine, finishLine: newFinishLine } = createStartFinish(scene);
  gameObjects.walls.push(startLine);
  finishLine = newFinishLine;
  gameObjects.finishLine = finishLine;
  gameObjects.walls.push(finishLine);

  const { ambientLight, directionalLight } = createLighting(scene, theme);
  gameObjects.lights.push(ambientLight, directionalLight);

  validCoinPositions = findValidCoinPositions();

  const { coins, coinSpotlight: newCoinSpotlight } = createCoins(
    scene,
    validCoinPositions
  );
  gameObjects.coins = coins;
  coinSpotlight = newCoinSpotlight;
  gameObjects.lights.push(coinSpotlight, coinSpotlight.target);

  const hazards = createHazards(
    scene,
    theme || {
      wallColor: 0x777777,
      name: "Default",
    }
  );
  gameObjects.hazards = hazards;

  const spearTraps = createSpearTraps(scene, theme);
  gameObjects.spearTraps = spearTraps;

  window.restartLevel = () => {
    loadLevel(getCurrentLevel());
  };

  updateLevelIndicator(levelIndicator);

  showLevelStartMessage(levelIndex + 1);
}

function showLevelStartMessage(levelNumber) {
  const startMessage = document.createElement("div");
  startMessage.id = "levelStartMessage";
  startMessage.style.position = "absolute";
  startMessage.style.top = "50%";
  startMessage.style.left = "50%";
  startMessage.style.transform = "translate(-50%, -50%)";
  startMessage.style.color = "white";
  startMessage.style.fontFamily = "Arial, sans-serif";
  startMessage.style.fontSize = "48px";
  startMessage.style.fontWeight = "bold";
  startMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  startMessage.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  startMessage.style.padding = "20px";
  startMessage.style.borderRadius = "10px";
  startMessage.style.textAlign = "center";
  startMessage.style.transition = "opacity 0.5s";
  startMessage.style.zIndex = "1001";
  startMessage.innerHTML = `Level ${levelNumber}<br>Collect all coins!<br>
    <span style="font-size: 24px">
        Watch out for traps!<br>
        - Jump over spike traps<br>
        - Dodge spear traps from walls
    </span>`;
  document.body.appendChild(startMessage);

  setTimeout(() => {
    startMessage.style.opacity = "0";
    setTimeout(() => {
      if (startMessage.parentNode) {
        startMessage.parentNode.removeChild(startMessage);
      }
    }, 500);
  }, 3000);
}

function clearLevel() {
  gameObjects.walls.forEach((wall) => {
    if (wall && wall.parent) {
      scene.remove(wall);
    }
  });
  gameObjects.walls = [];

  gameObjects.coins.forEach((coin) => {
    if (coin && coin.parent) {
      scene.remove(coin);
    }
  });
  gameObjects.coins = [];

  if (gameObjects.platform && gameObjects.platform.parent) {
    scene.remove(gameObjects.platform);
  }
  gameObjects.platform = null;

  gameObjects.lights.forEach((light) => {
    if (light && light.parent) {
      scene.remove(light);
    }
  });
  gameObjects.lights = [];

  cleanupLevelUI();

  cleanupHazards();

  cleanupSpearTraps(scene);

  const elementIdsToRemove = [
    "coinCountElement",
    "levelStartMessage",
    "nextLevelButton",
    "resetButton",
    "levelCompleteMessage",
    "gameCompleteMessage",
    "coinMessage",
    "winMessage",
    "caughtMessage",
  ];

  elementIdsToRemove.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
    }
  });

  finishLine = null;
  gameObjects.finishLine = null;
}

function checkLevelComplete() {
  const { coinsCollected, numCoins } = getCollectionState();

  if (coinsCollected >= numCoins) {
    if (!document.getElementById("levelCompleteMessage")) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }

      const levelMessage = createLevelCompleteMessage(getCurrentLevel());

      if (hasNextLevel()) {
        const nextButton = createNextLevelButton(() => {
          const loadingIndicator = document.createElement("div");
          loadingIndicator.id = "loadingIndicator";
          loadingIndicator.style.position = "absolute";
          loadingIndicator.style.top = "50%";
          loadingIndicator.style.left = "50%";
          loadingIndicator.style.transform = "translate(-50%, -50%)";
          loadingIndicator.style.color = "white";
          loadingIndicator.style.fontFamily = "Arial, sans-serif";
          loadingIndicator.style.fontSize = "24px";
          loadingIndicator.style.fontWeight = "bold";
          loadingIndicator.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
          loadingIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
          loadingIndicator.style.padding = "20px";
          loadingIndicator.style.borderRadius = "10px";
          loadingIndicator.style.zIndex = "9999";
          loadingIndicator.innerHTML = "Loading next level...";
          document.body.appendChild(loadingIndicator);

          const nextLevel = getNextLevel();
          if (nextLevel) {
            requestAnimationFrame(() => {
              loadLevel(nextLevel.level);

              if (loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
              }
            });
          }
        });

        setTimeout(() => {
          if (nextButton) {
            nextButton.style.display = "block";
            nextButton.focus();
          }
        }, 500);
      } else {
        const { resetButton } = createGameCompleteMessage();

        if (resetButton) {
          resetButton.addEventListener("click", () => {
            const loadingIndicator = document.createElement("div");
            loadingIndicator.id = "loadingIndicator";
            loadingIndicator.style.position = "absolute";
            loadingIndicator.style.top = "50%";
            loadingIndicator.style.left = "50%";
            loadingIndicator.style.transform = "translate(-50%, -50%)";
            loadingIndicator.style.color = "white";
            loadingIndicator.style.fontFamily = "Arial, sans-serif";
            loadingIndicator.style.fontSize = "24px";
            loadingIndicator.style.fontWeight = "bold";
            loadingIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            loadingIndicator.style.padding = "20px";
            loadingIndicator.style.borderRadius = "10px";
            loadingIndicator.style.zIndex = "9999";
            loadingIndicator.innerHTML = "Restarting game...";
            document.body.appendChild(loadingIndicator);

            requestAnimationFrame(() => {
              loadLevel(0);

              if (loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
              }
            });
          });

          setTimeout(() => {
            if (resetButton) {
              resetButton.style.display = "block";
              resetButton.focus();
            }
          }, 500);
        }
      }

      gameObjects.finishLine.material.color.set(0x00ff00);

      levelCompleted = true;
    }

    return true;
  }

  return false;
}

function checkFinishLineReached() {
  if (!gameObjects.finishLine || !gameObjects.finishLine.material) return;

  const { coinsCollected, numCoins } = getCollectionState();

  if (coinsCollected >= numCoins) {
    gameObjects.finishLine.material.color.set(0x00ff00);

    levelCompleted = true;
  } else {
    gameObjects.finishLine.material.color.set(0xffff00);

    if (!document.getElementById("coinMessage")) {
      const coinMessage = document.createElement("div");
      coinMessage.id = "coinMessage";
      coinMessage.style.position = "absolute";
      coinMessage.style.top = "50%";
      coinMessage.style.left = "50%";
      coinMessage.style.transform = "translate(-50%, -50%)";
      coinMessage.style.color = "white";
      coinMessage.style.fontFamily = "Arial, sans-serif";
      coinMessage.style.fontSize = "32px";
      coinMessage.style.fontWeight = "bold";
      coinMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
      coinMessage.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      coinMessage.style.padding = "15px";
      coinMessage.style.borderRadius = "10px";
      coinMessage.style.zIndex = "999";
      coinMessage.innerHTML = `Collect all coins before finishing!<br>Coins: ${coinsCollected} / ${numCoins}`;
      document.body.appendChild(coinMessage);

      setTimeout(() => {
        if (coinMessage.parentNode) {
          coinMessage.parentNode.removeChild(coinMessage);
        }
      }, 3000);
    }
  }
}

function animate() {
  window.gameAnimationFrame = requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - prevTime) / 1000;
  prevTime = now;

  if (player && !isPaused) {
    const playerState = updatePlayer(
      delta,
      cameraContainer,
      player,
      checkWallCollisions
    );

    const completePlayerState = getPlayerState();
    const isJumping = completePlayerState.isJumping;

    updateLighting(delta, getLevelTheme(getCurrentLevel()));

    if (gameObjects.coins.length > 0) {
      const { nearestCoin, nearestCoinDistance } = updateCoins(
        now,
        cameraContainer
      );

      if (nearestCoin && coinSpotlight) {
        coinSpotlight.position.set(
          nearestCoin.position.x,
          nearestCoin.position.y + 3,
          nearestCoin.position.z
        );
        coinSpotlight.target.position.copy(nearestCoin.position);
      }
    }

    if (gameObjects.hazards) {
      updateHazardStatus();

      const groundPosition = cameraContainer.position.clone();

      if (isJumping) {
        groundPosition.y = 1.0;
      } else {
        groundPosition.y = 0;
      }

      updateSpikes(delta);

      checkSpikeCollisions(groundPosition);
    }

    scene.traverse((object) => {
      if (
        object.userData &&
        object.userData.animationId &&
        window[object.userData.animationId]
      ) {
        window[object.userData.animationId](now / 1000);
      }
    });

    updateParticles(delta);

    if (gameObjects.spearTraps) {
      const playerPosition = cameraContainer.position.clone();

      updateSpearTraps(playerPosition, delta, scene, (damage) => {
        damagePlayer(damage);
      });
    }

    checkLevelComplete();

    if (gameObjects.finishLine && gameObjects.finishLine.position) {
      const distanceToFinish = gameObjects.finishLine.position.distanceTo(
        cameraContainer.position
      );
      if (distanceToFinish < 3 && !levelCompleted) {
        checkFinishLineReached();
      }
    }
  }

  renderer.render(scene, camera);
}

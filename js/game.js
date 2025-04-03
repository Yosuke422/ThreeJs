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
  updateFootstepEffects,
  hasPlayerMoved,
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

export function initGame(customTheme) {
    scene = new THREE.Scene();
    
  const initialTheme = customTheme || getLevelTheme(getCurrentLevel());
    
    if (initialTheme) {
    scene.background = new THREE.Color(initialTheme.color || initialTheme.skyColor || 0x87ceeb);

    const fogDensity = initialTheme.fogDensity
      ? initialTheme.fogDensity * 3.5
      : 0.035;
    scene.fog = new THREE.FogExp2(
      initialTheme.color || initialTheme.fogColor || 0x87ceeb,
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
    
  loadLevel(getCurrentLevel(), customTheme);
    
    prevTime = performance.now();
    animate();

  window.addEventListener("keydown", (e) => {
    if (e.key === "c" || e.key === "C") {
      console.log("Testing coin sound via 'C' key press");
      if (window.playSound) {
        window.playSound("coin");
      }
      try {
        const testSound = new Audio("sounds/coin-recieved-230517.mp3");
        testSound.volume = 1.0;
        testSound
          .play()
          .catch((err) => console.warn("Direct test sound failed:", err));
      } catch (e) {
        console.error("Test sound error:", e);
      }
    }
  });
}

function createSoundToggle() {
  const soundToggle = document.createElement("button");
  soundToggle.id = "soundToggle";
  soundToggle.style.position = "absolute";
  soundToggle.style.bottom = "20px";
  soundToggle.style.right = "20px";
  soundToggle.style.width = "50px";
  soundToggle.style.height = "50px";
  soundToggle.style.background = "rgba(0,0,0,0.7)";
  soundToggle.style.border = "2px solid rgba(255,255,255,0.5)";
  soundToggle.style.borderRadius = "50%";
  soundToggle.style.color = "white";
  soundToggle.style.fontSize = "24px";
  soundToggle.style.cursor = "pointer";
  soundToggle.style.zIndex = "1000";
  soundToggle.style.transition = "transform 0.2s, background 0.3s";
  soundToggle.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";

  soundToggle.innerHTML = isSoundEnabled() ? "🔊" : "🔇";
  
  soundToggle.onmouseover = () => {
    soundToggle.style.transform = "scale(1.1)";
    soundToggle.style.background = "rgba(50,50,70,0.8)";
  };
  
  soundToggle.onmouseout = () => {
    soundToggle.style.transform = "scale(1)";
    soundToggle.style.background = "rgba(0,0,0,0.7)";
  };

  soundToggle.addEventListener("click", () => {
        const newState = toggleSound(!isSoundEnabled());
    soundToggle.innerHTML = newState ? "🔊" : "🔇";
    });
    
    document.body.appendChild(soundToggle);

  const coinSoundTest = document.createElement("button");
  coinSoundTest.id = "coinSoundTest";
  coinSoundTest.style.position = "absolute";
  coinSoundTest.style.bottom = "20px";
  coinSoundTest.style.right = "80px";
  coinSoundTest.style.width = "50px";
  coinSoundTest.style.height = "50px";
  coinSoundTest.style.background = "rgba(0,0,0,0.7)";
  coinSoundTest.style.border = "2px solid rgba(255,215,0,0.5)";
  coinSoundTest.style.borderRadius = "50%";
  coinSoundTest.style.color = "gold";
  coinSoundTest.style.fontSize = "24px";
  coinSoundTest.style.cursor = "pointer";
  coinSoundTest.style.zIndex = "1000";
  coinSoundTest.style.transition = "transform 0.2s, background 0.3s";
  coinSoundTest.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
  coinSoundTest.innerHTML = "🪙";
  coinSoundTest.title = "Test Coin Sound";
  
  coinSoundTest.onmouseover = () => {
    coinSoundTest.style.transform = "scale(1.1)";
    coinSoundTest.style.background = "rgba(50,50,20,0.8)";
  };
  
  coinSoundTest.onmouseout = () => {
    coinSoundTest.style.transform = "scale(1)";
    coinSoundTest.style.background = "rgba(0,0,0,0.7)";
  };

  coinSoundTest.addEventListener("click", () => {
    console.log("Coin sound test button clicked");
    if (window.forceCoinSound) {
      window.forceCoinSound();
    } else if (window.playSound) {
      window.playSound("coin");
    } else {
      try {
        const testSound = new Audio("sounds/coin-recieved-230517.mp3");
        testSound.volume = 1.0;
        testSound.play().catch((e) => console.warn("Test sound failed:", e));
      } catch (e) {
        console.error("Error creating test sound:", e);
      }
    }
  });

  document.body.appendChild(coinSoundTest);
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

  const coinSoundTest = document.getElementById("coinSoundTest");
  if (coinSoundTest) coinSoundTest.remove();

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

export function loadLevel(levelIndex, customTheme) {
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
    
  const theme = customTheme || getLevelTheme(levelIndex);
  
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
        
    scene.background = new THREE.Color(theme.color || theme.skyColor || 0x87ceeb);

        const fogDensity = theme.fogDensity ? theme.fogDensity * 3.5 : 0.035;
    scene.fog = new THREE.FogExp2(theme.color || theme.fogColor || 0x87ceeb, fogDensity);
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
    
  // Initialize coin counter
  updateCoinCounter();

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
    loadLevel(getCurrentLevel(), customTheme);
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
  startMessage.style.fontSize = "36px";
  startMessage.style.fontWeight = "bold";
  startMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  startMessage.style.backgroundColor = "rgba(20, 30, 40, 0.85)";
  startMessage.style.backdropFilter = "blur(10px)";
  startMessage.style.padding = "30px 40px";
  startMessage.style.borderRadius = "15px";
  startMessage.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.5)";
  startMessage.style.textAlign = "center";
  startMessage.style.transition = "opacity 0.5s, transform 0.5s";
  startMessage.style.zIndex = "1001";
  startMessage.style.border = "1px solid rgba(255, 255, 255, 0.1)";
  startMessage.style.overflow = "hidden";

  // Modern UI elements
  const levelHeader = document.createElement("div");
  levelHeader.style.fontSize = "48px";
  levelHeader.style.marginBottom = "10px";
  levelHeader.style.color = "#4fc3f7";
  levelHeader.style.textTransform = "uppercase";
  levelHeader.style.letterSpacing = "2px";
  levelHeader.innerText = `Level ${levelNumber}`;
  
  const objective = document.createElement("div");
  objective.style.fontSize = "24px";
  objective.style.marginBottom = "20px";
  objective.style.opacity = "0.9";
  objective.innerText = "Collect all coins!";
  
  const warningContainer = document.createElement("div");
  warningContainer.style.fontSize = "18px";
  warningContainer.style.backgroundColor = "rgba(255, 87, 34, 0.1)";
  warningContainer.style.border = "1px solid rgba(255, 87, 34, 0.3)";
  warningContainer.style.borderRadius = "8px";
  warningContainer.style.padding = "15px";
  warningContainer.style.marginTop = "15px";
  warningContainer.style.marginBottom = "15px";
  
  const warningTitle = document.createElement("div");
  warningTitle.style.fontSize = "20px";
  warningTitle.style.color = "#ff9800";
  warningTitle.style.marginBottom = "8px";
  warningTitle.style.fontWeight = "bold";
  warningTitle.innerText = "⚠️ Watch out for traps!";
  
  const warningList = document.createElement("ul");
  warningList.style.textAlign = "left";
  warningList.style.margin = "0";
  warningList.style.padding = "0 0 0 20px";
  warningList.style.opacity = "0.85";
  
  const trap1 = document.createElement("li");
  trap1.innerText = "Jump over spike traps";
  trap1.style.marginBottom = "5px";
  
  const trap2 = document.createElement("li");
  trap2.innerText = "Dodge spear traps from walls";
  
  warningList.appendChild(trap1);
  warningList.appendChild(trap2);
  warningContainer.appendChild(warningTitle);
  warningContainer.appendChild(warningList);
  
  // Decorative elements
  const topDecoration = document.createElement("div");
  topDecoration.style.position = "absolute";
  topDecoration.style.top = "0";
  topDecoration.style.left = "0";
  topDecoration.style.width = "100%";
  topDecoration.style.height = "5px";
  topDecoration.style.background = "linear-gradient(90deg, #4fc3f7, #3949ab)";
  
  const bottomGlow = document.createElement("div");
  bottomGlow.style.position = "absolute";
  bottomGlow.style.bottom = "-10px";
  bottomGlow.style.left = "50%";
  bottomGlow.style.transform = "translateX(-50%)";
  bottomGlow.style.width = "80%";
  bottomGlow.style.height = "15px";
  bottomGlow.style.borderRadius = "50%";
  bottomGlow.style.background = "rgba(79, 195, 247, 0.3)";
  bottomGlow.style.filter = "blur(10px)";
  
  startMessage.appendChild(topDecoration);
  startMessage.appendChild(bottomGlow);
  startMessage.appendChild(levelHeader);
  startMessage.appendChild(objective);
  startMessage.appendChild(warningContainer);
  
    document.body.appendChild(startMessage);
    
  // Animate in
  startMessage.style.opacity = "0";
  startMessage.style.transform = "translate(-50%, -40%)";
    setTimeout(() => {
    startMessage.style.opacity = "1";
    startMessage.style.transform = "translate(-50%, -50%)";
  }, 100);

  setTimeout(() => {
    startMessage.style.opacity = "0";
    startMessage.style.transform = "translate(-50%, -60%)";
        setTimeout(() => {
            if (startMessage.parentNode) {
                startMessage.parentNode.removeChild(startMessage);
            }
        }, 500);
  }, 4000);
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
    
  if (gameObjects.finishSpotlight) {
    scene.remove(gameObjects.finishSpotlight);
    if (gameObjects.finishSpotlight.target) {
      scene.remove(gameObjects.finishSpotlight.target);
    }
    gameObjects.finishSpotlight = null;
  }

  if (gameObjects.finishParticles && gameObjects.finishParticles.length > 0) {
    gameObjects.finishParticles.forEach((particle) => {
      if (particle && particle.parent) {
        scene.remove(particle);
      }
    });
    gameObjects.finishParticles = [];
  }

  if (gameObjects.finishParticleInterval) {
    clearInterval(gameObjects.finishParticleInterval);
    gameObjects.finishParticleInterval = null;
  }

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
            
      if (window.playSound) {
        window.playSound("levelComplete");
      }

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
          loadingIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
          loadingIndicator.style.padding = "20px";
          loadingIndicator.style.borderRadius = "10px";
          loadingIndicator.style.zIndex = "9999";
          loadingIndicator.innerHTML = "Loading next level...";
                    document.body.appendChild(loadingIndicator);
                    
                    const nextLevel = getNextLevel();
                    if (nextLevel) {
                        requestAnimationFrame(() => {
              loadLevel(nextLevel.level, getLevelTheme(nextLevel.level));
                            
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
              loadLevel(0, getLevelTheme(0));
                            
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
        
    if (!levelCompleted && window.playSound) {
      window.playSound("levelComplete");
    }
        
    levelCompleted = true;
    } else {
    gameObjects.finishLine.material.color.set(0xffff00);

    if (window.playSound) {
      window.playSound("hit");
    }

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
      
      // Update the coin counter after updating coins
      updateCoinCounter();
        }
        
        if (gameObjects.hazards) {
      const { coinsCollected, numCoins } = getCollectionState();
      const hazardsDisabled = updateHazardStatus();

      if (coinsCollected >= numCoins && gameObjects.finishLine) {
        gameObjects.finishLine.material.emissive = new THREE.Color(0x00ff00);
        gameObjects.finishLine.material.emissiveIntensity = 0.5;

        const pulseIntensity = 0.5 + Math.sin(now * 0.003) * 0.3;
        gameObjects.finishLine.material.emissiveIntensity = pulseIntensity;

        if (!gameObjects.finishSpotlight) {
          const finishSpotlight = new THREE.SpotLight(0x00ff00, 5);
          finishSpotlight.position.set(
            gameObjects.finishLine.position.x,
            gameObjects.finishLine.position.y + 5,
            gameObjects.finishLine.position.z
          );
          finishSpotlight.target = gameObjects.finishLine;
          finishSpotlight.angle = 0.3;
          finishSpotlight.penumbra = 0.2;
          finishSpotlight.distance = 10;
          finishSpotlight.castShadow = true;
          scene.add(finishSpotlight);
          scene.add(finishSpotlight.target);

          gameObjects.finishSpotlight = finishSpotlight;

          showFinishLineHint();
        }

        if (Math.random() < 0.1) {
          createFinishParticle(gameObjects.finishLine.position);
        }
      }

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
        
    if (gameObjects.finishParticles && gameObjects.finishParticles.length > 0) {
      updateFinishParticles(delta);
    }

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

function showFinishLineHint() {
  const hintMessage = document.createElement("div");
  hintMessage.id = "finishLineHint";
  hintMessage.style.position = "absolute";
  hintMessage.style.top = "30%";
  hintMessage.style.left = "50%";
  hintMessage.style.transform = "translate(-50%, -50%) scale(0.9)";
  hintMessage.style.color = "white";
  hintMessage.style.fontFamily = "Arial, sans-serif";
  hintMessage.style.fontSize = "24px";
  hintMessage.style.fontWeight = "bold";
  hintMessage.style.backgroundColor = "rgba(20, 30, 40, 0.85)";
  hintMessage.style.backdropFilter = "blur(8px)";
  hintMessage.style.padding = "20px 30px";
  hintMessage.style.borderRadius = "15px";
  hintMessage.style.zIndex = "999";
  hintMessage.style.textAlign = "center";
  hintMessage.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.3)";
  hintMessage.style.border = "1px solid rgba(255, 255, 255, 0.1)";
  hintMessage.style.opacity = "0";
  hintMessage.style.transition = "all 0.5s cubic-bezier(0.19, 1, 0.22, 1)";
  
  // Decorative elements
  const topBorder = document.createElement("div");
  topBorder.style.position = "absolute";
  topBorder.style.top = "0";
  topBorder.style.left = "0";
  topBorder.style.width = "100%";
  topBorder.style.height = "4px";
  topBorder.style.background = "linear-gradient(90deg, #4caf50, #8bc34a)";
  topBorder.style.borderRadius = "15px 15px 0 0";
  hintMessage.appendChild(topBorder);
  
  // Coin icon and success message
  const contentContainer = document.createElement("div");
  contentContainer.style.display = "flex";
  contentContainer.style.flexDirection = "column";
  contentContainer.style.alignItems = "center";
  contentContainer.style.position = "relative";
  contentContainer.style.zIndex = "1";
  
  const coinIcon = document.createElement("div");
  coinIcon.innerHTML = "✅";
  coinIcon.style.fontSize = "32px";
  coinIcon.style.marginBottom = "10px";
  contentContainer.appendChild(coinIcon);
  
  const successText = document.createElement("div");
  successText.innerText = "ALL COINS COLLECTED!";
  successText.style.color = "#4caf50";
  successText.style.fontSize = "22px";
  successText.style.fontWeight = "bold";
  successText.style.marginBottom = "10px";
  successText.style.letterSpacing = "1px";
  contentContainer.appendChild(successText);
  
  const instructionText = document.createElement("div");
  instructionText.innerText = "You did it! The maze is now safe.";
  instructionText.style.opacity = "0.9";
  contentContainer.appendChild(instructionText);
  
  // Arrow pointing animation
  const arrowContainer = document.createElement("div");
  arrowContainer.style.marginTop = "15px";
  const arrow = document.createElement("div");
  arrow.innerHTML = "⬇️";
  arrow.style.fontSize = "24px";
  arrow.style.animation = "bounce 1s infinite";
  
  const style = document.createElement("style");
  style.textContent = `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(10px); }
    }
  `;
  document.head.appendChild(style);
  
  arrowContainer.appendChild(arrow);
  contentContainer.appendChild(arrowContainer);
  
  hintMessage.appendChild(contentContainer);
  document.body.appendChild(hintMessage);
  
  // Animate entry
  setTimeout(() => {
    hintMessage.style.opacity = "1";
    hintMessage.style.transform = "translate(-50%, -50%) scale(1)";
  }, 100);

  setTimeout(() => {
    hintMessage.style.opacity = "0";
    hintMessage.style.transform = "translate(-50%, -50%) scale(0.9)";
    setTimeout(() => {
      if (hintMessage.parentNode) {
        hintMessage.parentNode.removeChild(hintMessage);
      }
    }, 1000);
  }, 5000);
}

function createFinishParticle(position) {
  if (!window.gameScene) return;

  const scene = window.gameScene;

  const geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 8, 8);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.7,
  });

  const particle = new THREE.Mesh(geometry, material);

  particle.position.set(
    position.x + (Math.random() * 0.8 - 0.4),
    position.y + 0.1,
    position.z + (Math.random() * 0.8 - 0.4)
  );

  particle.userData = {
    velocity: {
      x: Math.random() * 0.2 - 0.1,
      y: 0.5 + Math.random() * 0.5,
      z: Math.random() * 0.2 - 0.1,
    },
    age: 0,
    lifetime: 1.5 + Math.random() * 1.0,
    type: "finishParticle",
  };

  scene.add(particle);

  if (!gameObjects.finishParticles) {
    gameObjects.finishParticles = [];
  }
  gameObjects.finishParticles.push(particle);
}

function updateFinishParticles(deltaTime) {
  for (let i = gameObjects.finishParticles.length - 1; i >= 0; i--) {
    const particle = gameObjects.finishParticles[i];

    particle.userData.age += deltaTime;

    if (particle.userData.age >= particle.userData.lifetime) {
      scene.remove(particle);
      gameObjects.finishParticles.splice(i, 1);
      continue;
    }

    if (particle.userData.velocity) {
      particle.position.x += particle.userData.velocity.x * deltaTime;
      particle.position.y += particle.userData.velocity.y * deltaTime;
      particle.position.z += particle.userData.velocity.z * deltaTime;
    }

    const lifeProgress = particle.userData.age / particle.userData.lifetime;
    particle.material.opacity = 0.7 * (1 - lifeProgress);

    const pulseScale = 1.0 + Math.sin(particle.userData.age * 5) * 0.1;
    particle.scale.set(pulseScale, pulseScale, pulseScale);
  }
}

function collectCoin(coin) {
  const index = gameObjects.coins.indexOf(coin);
  if (index !== -1) {
    scene.remove(coin);
    gameObjects.coins.splice(index, 1);
    updateCoinCounter();

    console.log("===== COIN COLLECTED - DEBUG INFO =====");
    console.log("Coin found at index:", index);
    console.log("Remaining coins:", gameObjects.coins.length);
    console.log("coinSoundPreloaded exists:", !!window.coinSoundPreloaded);
    console.log("playSound function exists:", !!window.playSound);
    console.log("forceCoinSound exists:", !!window.forceCoinSound);
    console.log("Sound already played:", coin.userData?.soundPlayed);

    // Create modern coin feedback
    const coinFeedback = document.createElement("div");
    coinFeedback.style.position = "absolute";
    coinFeedback.style.top = "50%";
    coinFeedback.style.left = "50%";
    coinFeedback.style.transform = "translate(-50%, -50%) scale(0.8)";
    coinFeedback.style.backgroundColor = "rgba(20, 30, 40, 0.6)";
    coinFeedback.style.backdropFilter = "blur(4px)";
    coinFeedback.style.borderRadius = "50px";
    coinFeedback.style.padding = "10px 25px";
    coinFeedback.style.boxShadow = "0 5px 15px rgba(255, 215, 0, 0.3)";
    coinFeedback.style.border = "1px solid rgba(255, 215, 0, 0.3)";
    coinFeedback.style.display = "flex";
    coinFeedback.style.alignItems = "center";
    coinFeedback.style.pointerEvents = "none";
    coinFeedback.style.zIndex = "1000";
    coinFeedback.style.opacity = "0";
    coinFeedback.style.transition = "all 0.4s cubic-bezier(0.19, 1, 0.22, 1)";
    
    // Coin icon
    const coinIcon = document.createElement("div");
    coinIcon.innerHTML = "🪙";
    coinIcon.style.fontSize = "32px";
    coinIcon.style.marginRight = "10px";
    coinIcon.style.animation = "spin 1s ease";
    
    // Add spin animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotateY(0deg); }
        100% { transform: rotateY(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    // Coin text
    const coinText = document.createElement("div");
    coinText.innerHTML = `<span style="color: #ffd700; font-size: 28px; font-weight: bold;">+1</span>
                          <span style="color: white; font-size: 16px; display: block; opacity: 0.9; margin-top: -5px;">COIN</span>`;
    coinText.style.fontFamily = "Arial, sans-serif";
    
    coinFeedback.appendChild(coinIcon);
    coinFeedback.appendChild(coinText);
    document.body.appendChild(coinFeedback);
    
    // Animation sequence
    setTimeout(() => {
      coinFeedback.style.opacity = "1";
      coinFeedback.style.transform = "translate(-50%, -50%) scale(1)";
      
      setTimeout(() => {
        coinFeedback.style.opacity = "0";
        coinFeedback.style.transform = "translate(-50%, -100%) scale(0.8)";
        setTimeout(() => {
          if (coinFeedback.parentNode) {
            coinFeedback.parentNode.removeChild(coinFeedback);
          }
        }, 500);
      }, 800);
    }, 50);

    if (gameObjects.coins.length === 0 && gameObjects.finishLine) {
      if (gameObjects.finishLine.material) {
        gameObjects.finishLine.material.emissive.set(0, 1, 0);
        gameObjects.finishLine.material.emissiveIntensity = 2;

        if (!gameObjects.finishSpotlight) {
          const spotlight = new THREE.SpotLight(
            0x00ff00,
            10,
            50,
            Math.PI / 6,
            0.5,
            1
          );
          spotlight.position.set(
            gameObjects.finishLine.position.x,
            gameObjects.finishLine.position.y + 15,
            gameObjects.finishLine.position.z
          );

          const spotlightTarget = new THREE.Object3D();
          spotlightTarget.position.copy(gameObjects.finishLine.position);
          scene.add(spotlightTarget);
          spotlight.target = spotlightTarget;

          scene.add(spotlight);
          gameObjects.finishSpotlight = spotlight;

          showFinishLineHint();

          gameObjects.finishParticles = [];

          gameObjects.finishParticleInterval = setInterval(() => {
            if (gameObjects.finishLine && gameObjects.finishParticles) {
              createFinishParticle(gameObjects.finishLine.position);
            }
          }, 200);
        }
      }
    }
  }
}

// Function to update the coin counter UI
export function updateCoinCounter() {
  const { coinsCollected, numCoins } = getCollectionState();
  
  // Check if coin counter exists
  let coinCounter = document.getElementById('coinCounter');
  
  // Create coin counter if it doesn't exist
  if (!coinCounter) {
    // Create a container for the coin counter
    coinCounter = document.createElement('div');
    coinCounter.id = 'coinCounter';
    coinCounter.style.position = 'absolute';
    coinCounter.style.top = '20px';
    coinCounter.style.left = '50%';
    coinCounter.style.transform = 'translateX(-50%)';
    coinCounter.style.backgroundColor = 'rgba(20, 30, 40, 0.8)';
    coinCounter.style.color = 'white';
    coinCounter.style.padding = '10px 20px';
    coinCounter.style.borderRadius = '50px';
    coinCounter.style.display = 'flex';
    coinCounter.style.alignItems = 'center';
    coinCounter.style.gap = '10px';
    coinCounter.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3), 0 0 5px rgba(255, 215, 0, 0.2)';
    coinCounter.style.border = '1px solid rgba(255, 215, 0, 0.3)';
    coinCounter.style.backdropFilter = 'blur(5px)';
    coinCounter.style.zIndex = '1000';
    coinCounter.style.fontFamily = "'Segoe UI', Arial, sans-serif";
    coinCounter.style.fontSize = '18px';
    coinCounter.style.fontWeight = '600';
    
    // Add coin icon
    const coinIcon = document.createElement('div');
    coinIcon.textContent = '🪙';
    coinIcon.style.fontSize = '22px';
    coinIcon.style.marginRight = '5px';
    coinCounter.appendChild(coinIcon);
    
    // Add count display
    const coinCount = document.createElement('div');
    coinCount.id = 'coinCount';
    coinCount.style.background = 'linear-gradient(90deg, #FFD700, #FFC107)';
    coinCount.style.WebkitBackgroundClip = 'text';
    coinCount.style.WebkitTextFillColor = 'transparent';
    coinCount.style.backgroundClip = 'text';
    coinCount.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    coinCounter.appendChild(coinCount);
    
    // Add separator
    const separator = document.createElement('div');
    separator.textContent = '/';
    separator.style.margin = '0 5px';
    separator.style.opacity = '0.7';
    coinCounter.appendChild(separator);
    
    // Add total count
    const totalCoins = document.createElement('div');
    totalCoins.id = 'totalCoins';
    totalCoins.style.opacity = '0.7';
    coinCounter.appendChild(totalCoins);
    
    // Add shine effect
    const shine = document.createElement('div');
    shine.style.position = 'absolute';
    shine.style.top = '0';
    shine.style.left = '0';
    shine.style.width = '100%';
    shine.style.height = '100%';
    shine.style.borderRadius = '50px';
    shine.style.background = 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)';
    shine.style.backgroundSize = '200% 100%';
    shine.style.animation = 'shine 3s infinite';
    shine.style.pointerEvents = 'none';
    coinCounter.appendChild(shine);
    
    document.body.appendChild(coinCounter);
  }
  
  // Update the counter text
  document.getElementById('coinCount').textContent = coinsCollected;
  document.getElementById('totalCoins').textContent = numCoins;
  
  // Add special effect when all coins are collected
  if (coinsCollected === numCoins && numCoins > 0) {
    coinCounter.style.boxShadow = '0 5px 20px rgba(255, 215, 0, 0.5), 0 0 10px rgba(255, 215, 0, 0.7)';
    coinCounter.style.backgroundColor = 'rgba(50, 40, 10, 0.9)';
    coinCounter.style.border = '1px solid rgba(255, 215, 0, 0.6)';
    
    // Add pulse animation if not already added
    if (!coinCounter.style.animation) {
      coinCounter.style.animation = 'pulse 2s infinite';
    }
  } else {
    coinCounter.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3), 0 0 5px rgba(255, 215, 0, 0.2)';
    coinCounter.style.backgroundColor = 'rgba(20, 30, 40, 0.8)';
    coinCounter.style.border = '1px solid rgba(255, 215, 0, 0.3)';
    coinCounter.style.animation = '';
  }
}

import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import {
  getCurrentLevel,
  getPlatformSize,
  gravity,
  jumpVelocity,
  playerHeight,
  playerRadius,
  playerSpeed,
} from "./config.js";
import { getLevelTheme } from "./level.js";

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let isOnGround = true;
let isJumping = false;
let jumpHeight = 0;
const maxJumpHeight = 1.0;

const keys = {
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
  Space: false,
};

let hasMovementOccurred = false;

let currentTheme = null;

const footstepEffects = {
  particles: [],
  lastStep: 0,
  stepInterval: 0.5,
  enabled: true,
};

let remyModel = null;
let remyMixer = null;
let runningAnimation = null;
let idleAnimation = null;
let jumpingAnimation = null;

let player, cameraContainer, camera;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;

let isFalling = false;
let isHurt = false;
let velocityY = 0;
let playerHealth = 100;

let cameraMode = "firstPerson";

let animationsLoaded = {
  idle: false,
  running: false,
  jumping: false,
};

export function createPlayer(scene) {
  hasMovementOccurred = false;

  const playerContainer = new THREE.Object3D();
  scene.add(playerContainer);

  const playerGeometry = new THREE.CylinderGeometry(
    playerRadius,
    playerRadius,
    playerHeight,
    32
  );
  const playerMaterial = new THREE.MeshStandardMaterial({
    color: 0x0000ff,
    roughness: 0.7,
    metalness: 0.3,
    transparent: true,
    opacity: 0.0,
  });
  player = new THREE.Mesh(playerGeometry, playerMaterial);
  player.position.y = playerHeight / 2;
  player.castShadow = false;
  player.receiveShadow = false;
  player.visible = false;

  playerContainer.add(player);

  window.playerContainer = playerContainer;

  cameraContainer = new THREE.Object3D();
  cameraContainer.position.set(0, playerHeight - 0.2, 0);
  scene.add(cameraContainer);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.set(0, 0, 0);
  camera.rotation.set(0, 0, 0);

  cameraContainer.add(camera);

  const fbxLoader = new FBXLoader();
  console.log("Loading Remy model...");

  fbxLoader.load(
    "assets/Remy.fbx",
    (fbx) => {
      console.log("Remy model loaded successfully");

      const scale = playerHeight / 10;
      fbx.scale.set(scale * 0.03, scale * 0.03, scale * 0.03);

      fbx.position.y = 0.5;

      remyMixer = new THREE.AnimationMixer(fbx);

      player.visible = false;

      playerContainer.add(fbx);
      remyModel = fbx;

      remyModel.visible = false;

      console.log("Setting up animation system for Remy");

      remyMixer = new THREE.AnimationMixer(fbx);

      let totalAnimationsLoaded = 0;
      const totalAnimations = 3;

      const checkAllAnimationsLoaded = () => {
        totalAnimationsLoaded++;
        console.log(
          `Animation ${totalAnimationsLoaded}/${totalAnimations} loaded`
        );

        if (totalAnimationsLoaded === totalAnimations) {
          console.log("All animations loaded, applying idle animation");

          if (idleAnimation) {
            if (runningAnimation) {
              runningAnimation.stop();
              runningAnimation.enabled = false;
            }
            if (jumpingAnimation) {
              jumpingAnimation.stop();
              jumpingAnimation.enabled = false;
            }

            idleAnimation.reset();
            idleAnimation.enabled = true;
            idleAnimation.play();

            for (let i = 0; i < 10; i++) {
              remyMixer.update(0.01);
            }

            console.log("Initial idle animation applied");
          }
        }
      };

      fbxLoader.load(
        "assets/Breathing_Idle.fbx",
        (idleFbx) => {
          console.log("Breathing idle animation loaded");

          try {
            if (idleFbx.animations && idleFbx.animations.length > 0) {
              const idleClip = idleFbx.animations[0];

              idleAnimation = remyMixer.clipAction(idleClip);
              idleAnimation.setEffectiveTimeScale(1.0);
              idleAnimation.setEffectiveWeight(1.0);
              idleAnimation.clampWhenFinished = true;
              idleAnimation.setLoop(THREE.LoopRepeat, Infinity);

              console.log("Idle animation created", idleClip);
              animationsLoaded.idle = true;

              checkAllAnimationsLoaded();
            } else {
              console.error("No animations found in the idle FBX file");
              animationsLoaded.idle = false;
              checkAllAnimationsLoaded();
            }
          } catch (error) {
            console.error("Error setting up idle animation:", error);
            animationsLoaded.idle = false;
            checkAllAnimationsLoaded();
          }
        },
        (xhr) => {
          console.log(
            `Idle animation ${(xhr.loaded / xhr.total) * 100}% loaded`
          );
        },
        (error) => {
          console.error("Error loading idle animation:", error);
          animationsLoaded.idle = false;
          checkAllAnimationsLoaded();
        }
      );

      fbxLoader.load(
        "assets/Running.fbx",
        (runFbx) => {
          console.log("Running animation loaded");

          try {
            if (runFbx.animations && runFbx.animations.length > 0) {
              const runClip = runFbx.animations[0];

              runningAnimation = remyMixer.clipAction(runClip);
              runningAnimation.setEffectiveTimeScale(1.0);
              runningAnimation.setEffectiveWeight(1.0);
              runningAnimation.clampWhenFinished = true;
              runningAnimation.setLoop(THREE.LoopRepeat, Infinity);
              runningAnimation.enabled = false;

              console.log("Running animation created", runClip);
              animationsLoaded.running = true;

              checkAllAnimationsLoaded();
            } else {
              console.error("No animations found in the running FBX file");
              animationsLoaded.running = false;
              checkAllAnimationsLoaded();
            }
          } catch (error) {
            console.error("Error setting up running animation:", error);
            animationsLoaded.running = false;
            checkAllAnimationsLoaded();
          }
        },
        (xhr) => {
          console.log(
            `Running animation ${(xhr.loaded / xhr.total) * 100}% loaded`
          );
        },
        (error) => {
          console.error("Error loading running animation:", error);
          animationsLoaded.running = false;
          checkAllAnimationsLoaded();
        }
      );

      fbxLoader.load(
        "assets/Jumping_Up.fbx",
        (jumpFbx) => {
          console.log("Jumping animation loaded");

          try {
            if (jumpFbx.animations && jumpFbx.animations.length > 0) {
              const jumpClip = jumpFbx.animations[0];

              jumpingAnimation = remyMixer.clipAction(jumpClip);
              jumpingAnimation.setEffectiveTimeScale(1.0);
              jumpingAnimation.setEffectiveWeight(1.0);
              jumpingAnimation.clampWhenFinished = true;
              jumpingAnimation.setLoop(THREE.LoopOnce, 1);
              jumpingAnimation.enabled = false;

              console.log("Jumping animation created", jumpClip);
              animationsLoaded.jumping = true;

              checkAllAnimationsLoaded();
            } else {
              console.error("No animations found in the jumping FBX file");
              animationsLoaded.jumping = false;
              checkAllAnimationsLoaded();
            }
          } catch (error) {
            console.error("Error setting up jumping animation:", error);
            animationsLoaded.jumping = false;
            checkAllAnimationsLoaded();
          }
        },
        (xhr) => {
          console.log(
            `Jumping animation ${(xhr.loaded / xhr.total) * 100}% loaded`
          );
        },
        (error) => {
          console.error("Error loading jumping animation:", error);
          animationsLoaded.jumping = false;
          checkAllAnimationsLoaded();
        }
      );
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    (error) => {
      console.error("Error loading Remy model:", error);

      const fallbackGeometry = new THREE.CapsuleGeometry(
        playerRadius,
        playerHeight - playerRadius * 2,
        1,
        8
      );
      const fallbackMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
      });
      const fallbackModel = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
      fallbackModel.position.y = playerHeight / 2;
      playerContainer.add(fallbackModel);

      player.visible = true;
    }
  );

  playerContainer.position.y = 0;

  return { player: playerContainer, cameraContainer, camera };
}

export function setupControls(cameraContainer, camera) {
  document.addEventListener("keydown", (event) => {
    if (keys.hasOwnProperty(event.code)) {
      keys[event.code] = true;

      if (["KeyW", "KeyS", "KeyA", "KeyD"].includes(event.code)) {
        hasMovementOccurred = true;
      }
    }
  });

  document.addEventListener("keyup", (event) => {
    if (keys.hasOwnProperty(event.code)) {
      keys[event.code] = false;
    }
  });

  const onMouseMove = (event) => {
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    cameraContainer.rotation.y -= movementX * 0.002;

    const verticalRotation = camera.rotation.x - movementY * 0.002;
    camera.rotation.x = Math.max(
      Math.min(verticalRotation, Math.PI / 2),
      -Math.PI / 2
    );
  };

  document.addEventListener("click", (event) => {
    const clickedElement = event.target;
    const skipLockElements = ["BUTTON", "INPUT"];

    if (skipLockElements.includes(clickedElement.tagName)) {
      console.log("Skipping pointer lock on button/input click");
      return;
    }

    const uiElements = [
      "nextLevelButton",
      "resetButton",
      "levelCompleteMessage",
      "gameCompleteMessage",
      "loadingIndicator",
    ];

    for (const id of uiElements) {
      if (document.getElementById(id)) {
        console.log(
          "Skipping pointer lock - UI elements for level completion exist"
        );
        return;
      }
    }

    let parent = clickedElement;
    while (parent) {
      if (
        parent.style &&
        (parent.style.zIndex === "999" ||
          parent.style.zIndex === "1000" ||
          (parent.id && uiElements.includes(parent.id)))
      ) {
        console.log("Skipping pointer lock - click was inside a UI element");
        return;
      }
      parent = parent.parentElement;
    }

    document.body.requestPointerLock();
  });

  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement) {
      document.addEventListener("mousemove", onMouseMove, false);
    } else {
      document.removeEventListener("mousemove", onMouseMove, false);
    }
  });
}

export function hasPlayerMoved() {
  return hasMovementOccurred;
}

export function resetPlayerMovement() {
  hasMovementOccurred = false;
}

export function updatePlayer(
  deltaTime,
  cameraContainer,
  player,
  checkWallCollisions
) {
  const platformSize = getPlatformSize();

  velocity.y -= gravity * deltaTime;

  direction.x = 0;
  direction.z = 0;

  if (keys.KeyW) direction.z = -1;
  if (keys.KeyS) direction.z = 1;
  if (keys.KeyA) direction.x = -1;
  if (keys.KeyD) direction.x = 1;

  if (direction.x !== 0 && direction.z !== 0) {
    direction.normalize();
  }

  if (direction.z !== 0) {
    velocity.x =
      direction.z * Math.sin(cameraContainer.rotation.y) * playerSpeed;
    velocity.z =
      direction.z * Math.cos(cameraContainer.rotation.y) * playerSpeed;
  }

  if (direction.x !== 0) {
    velocity.x =
      direction.x *
      Math.sin(cameraContainer.rotation.y + Math.PI / 2) *
      playerSpeed;
    velocity.z =
      direction.x *
      Math.cos(cameraContainer.rotation.y + Math.PI / 2) *
      playerSpeed;
  }

  const playerPosBeforeJump = cameraContainer.position.clone();

  if (keys.Space && isOnGround) {
    velocity.y = jumpVelocity;
    isOnGround = false;
    isJumping = true;
    jumpHeight = 0;

    if (remyMixer && jumpingAnimation && animationsLoaded.jumping) {
      console.log("Playing jump animation");

      if (idleAnimation && idleAnimation.enabled) {
        idleAnimation.fadeOut(0.1);
        idleAnimation.enabled = false;
      }
      if (runningAnimation && runningAnimation.enabled) {
        runningAnimation.fadeOut(0.1);
        runningAnimation.enabled = false;
      }

      jumpingAnimation.reset();
      jumpingAnimation.enabled = true;
      jumpingAnimation.fadeIn(0.1);
      jumpingAnimation.play();
    }

    if (window.playSound) {
      window.playSound("jump");
    }
  }

  if (!isOnGround) {
    jumpHeight = Math.max(
      jumpHeight,
      cameraContainer.position.y - playerHeight
    );
  } else {
    jumpHeight = 0;
    isJumping = false;
  }

  const newPositionX = cameraContainer.position.x + velocity.x * deltaTime;
  const newPositionZ = cameraContainer.position.z + velocity.z * deltaTime;

  const currentPosition = cameraContainer.position.clone();

  if (Math.abs(newPositionX) < platformSize) {
    cameraContainer.position.x = newPositionX;

    if (checkWallCollisions(cameraContainer.position, playerRadius, false)) {
      cameraContainer.position.x = currentPosition.x;
    }
  }

  if (Math.abs(newPositionZ) < platformSize) {
    cameraContainer.position.z = newPositionZ;

    if (checkWallCollisions(cameraContainer.position, playerRadius, false)) {
      cameraContainer.position.z = currentPosition.z;
    }
  }

  const newPositionY = cameraContainer.position.y + velocity.y * deltaTime;

  const currentY = cameraContainer.position.y;

  cameraContainer.position.y = newPositionY;

  if (checkWallCollisions(cameraContainer.position, playerRadius, false)) {
    cameraContainer.position.y = currentY;

    velocity.y = 0;
  }

  const adjustedPlayerHeight = playerHeight * 0.7;

  if (cameraContainer.position.y < adjustedPlayerHeight) {
    cameraContainer.position.y = adjustedPlayerHeight;
    velocity.y = 0;
    isOnGround = true;
    isJumping = false;
  } else {
    if (velocity.y !== 0) {
      isOnGround = false;
    }
  }

  const playerObj = window.playerContainer || player;

  playerObj.position.x = cameraContainer.position.x;
  playerObj.position.z = cameraContainer.position.z;

  playerObj.position.y = 0;

  if (velocity.x !== 0 || velocity.z !== 0) {
    const angle = Math.atan2(velocity.x, velocity.z);
    playerObj.rotation.y = angle;
  }

  if (remyMixer) {
    remyMixer.update(deltaTime);

    const isMoving = Math.abs(velocity.x) > 0.01 || Math.abs(velocity.z) > 0.01;

    if (isJumping) {
      if (
        jumpingAnimation &&
        !jumpingAnimation.enabled &&
        animationsLoaded.jumping
      ) {
        console.log("Ensuring jump animation plays");
        jumpingAnimation.reset();
        jumpingAnimation.enabled = true;
        jumpingAnimation.play();

        if (idleAnimation) idleAnimation.enabled = false;
        if (runningAnimation) runningAnimation.enabled = false;
      }

      if (isOnGround) {
        isJumping = false;
        if (jumpingAnimation) {
          jumpingAnimation.fadeOut(0.1);
          jumpingAnimation.enabled = false;

          if (isMoving && runningAnimation) {
            runningAnimation.reset();
            runningAnimation.fadeIn(0.1);
            runningAnimation.enabled = true;
            runningAnimation.play();
          } else if (idleAnimation) {
            idleAnimation.reset();
            idleAnimation.fadeIn(0.1);
            idleAnimation.enabled = true;
            idleAnimation.play();
          }
        }
      }
    } else {
      if (isMoving) {
        if (runningAnimation && !runningAnimation.enabled) {
          console.log("Switching to running animation");

          if (idleAnimation && idleAnimation.enabled) {
            idleAnimation.fadeOut(0.2);
            idleAnimation.enabled = false;
          }

          runningAnimation.reset();
          runningAnimation.fadeIn(0.2);
          runningAnimation.enabled = true;
          runningAnimation.play();
        }
      } else {
        if (idleAnimation && !idleAnimation.enabled) {
          console.log("Switching to idle animation");

          if (runningAnimation && runningAnimation.enabled) {
            runningAnimation.fadeOut(0.2);
            runningAnimation.enabled = false;
          }

          idleAnimation.reset();
          idleAnimation.fadeIn(0.2);
          idleAnimation.enabled = true;
          idleAnimation.play();

          remyMixer.update(0);
        }
      }
    }
  }

  velocity.x = 0;
  velocity.z = 0;

  if (!currentTheme) {
    currentTheme = getLevelTheme(getCurrentLevel());
  }

  const movedDistance = Math.sqrt(
    Math.pow(velocity.x, 2) + Math.pow(velocity.z, 2)
  );

  if (movedDistance > 0.001 && footstepEffects.enabled) {
    footstepEffects.lastStep += deltaTime;

    if (footstepEffects.lastStep >= footstepEffects.stepInterval) {
      footstepEffects.lastStep = 0;

      if (isOnGround) {
        createFootstepEffect(cameraContainer.position, currentTheme);
      }
    }
  }

  return {
    isJumping,
    isOnGround,
    jumpHeight,
    position: cameraContainer.position.clone(),
  };
}

function createFootstepEffect(position, theme) {
  if (!theme || !window.gameScene) return;

  const scene = window.gameScene;

  switch (theme.name) {
    case "Forest":
      createDustPuff(scene, position, 0x33522d, 0.3);
      break;
    case "Desert":
      createDustPuff(scene, position, 0xd2b48c, 0.5);
      break;
    case "Cave":
      createDustPuff(scene, position, 0x555555, 0.3);
      break;
    case "Ice":
      createIceCrack(scene, position);
      break;
    case "Volcano":
      createHeatWave(scene, position);
      break;
    case "Alien":
      createGlowRipple(scene, position, 0x00ff77);
      break;
    case "Ocean":
      createWaterRipple(scene, position);
      break;
    case "Neon":
      createGlowRipple(scene, position, 0x00ffff);
      break;
    case "Sunset":
      createDustPuff(scene, position, 0xba6e5d, 0.3);
      break;
    case "Space":
      createGlowRipple(scene, position, 0x6666ff);
      break;
  }
}

function createDustPuff(scene, position, color = 0xd2b48c, intensity = 0.5) {
  const count = 5 + Math.floor(Math.random() * 5);
  const particles = [];

  for (let i = 0; i < count; i++) {
    const geometry = new THREE.SphereGeometry(0.03, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7 * intensity,
    });

    const particle = new THREE.Mesh(geometry, material);

    particle.position.set(
      position.x + (Math.random() * 0.3 - 0.15),
      0.05 + Math.random() * 0.1,
      position.z + (Math.random() * 0.3 - 0.15)
    );

    const scale = 0.5 + Math.random() * 1.0;
    particle.scale.set(scale, scale, scale);

    particle.userData = {
      velocity: {
        x: (Math.random() * 2 - 1) * 0.2,
        y: 0.1 + Math.random() * 0.2,
        z: (Math.random() * 2 - 1) * 0.2,
      },
      age: 0,
      lifetime: 0.5 + Math.random() * 0.5,
    };

    scene.add(particle);
    particles.push(particle);
    footstepEffects.particles.push(particle);
  }
}

function createIceCrack(scene, position) {
  const geometry = new THREE.CircleGeometry(0.2, 16);
  const material = new THREE.MeshBasicMaterial({
    color: 0xadeeff,
    transparent: true,
    opacity: 0.7,
  });

  const crack = new THREE.Mesh(geometry, material);
  crack.rotation.x = -Math.PI / 2;
  crack.position.set(position.x, 0.01, position.z);

  crack.userData = {
    age: 0,
    lifetime: 1.0,
    initialScale: 0.1,
  };

  crack.scale.set(0.1, 0.1, 0.1);

  scene.add(crack);
  footstepEffects.particles.push(crack);
}

function createHeatWave(scene, position) {
  const geometry = new THREE.CircleGeometry(0.15, 16);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff3300,
    transparent: true,
    opacity: 0.3,
  });

  const wave = new THREE.Mesh(geometry, material);
  wave.rotation.x = -Math.PI / 2;
  wave.position.set(position.x, 0.05, position.z);

  wave.userData = {
    age: 0,
    lifetime: 0.7,
    initialScale: 0.2,
  };

  wave.scale.set(0.2, 0.2, 0.2);

  scene.add(wave);
  footstepEffects.particles.push(wave);
}

function createGlowRipple(scene, position, color) {
  const geometry = new THREE.RingGeometry(0.1, 0.15, 16);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });

  const ripple = new THREE.Mesh(geometry, material);
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(position.x, 0.02, position.z);

  ripple.userData = {
    age: 0,
    lifetime: 0.8,
    initialScale: 0.5,
  };

  ripple.scale.set(0.5, 0.5, 0.5);

  scene.add(ripple);
  footstepEffects.particles.push(ripple);
}

function createWaterRipple(scene, position) {
  const count = 2;

  for (let i = 0; i < count; i++) {
    const delay = i * 0.2;
    const size = 0.1 + i * 0.05;

    const geometry = new THREE.RingGeometry(size, size + 0.02, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const ripple = new THREE.Mesh(geometry, material);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(position.x, 0.02, position.z);

    ripple.userData = {
      age: -delay,
      lifetime: 1.0,
      initialScale: 0.4,
    };

    ripple.scale.set(0.4, 0.4, 0.4);

    scene.add(ripple);
    footstepEffects.particles.push(ripple);
  }
}

export function updateFootstepEffects(deltaTime) {
  for (let i = footstepEffects.particles.length - 1; i >= 0; i--) {
    const particle = footstepEffects.particles[i];

    particle.userData.age += deltaTime;

    if (particle.userData.age >= particle.userData.lifetime) {
      if (particle.parent) particle.parent.remove(particle);
      footstepEffects.particles.splice(i, 1);
      continue;
    }

    if (particle.userData.age < 0) continue;

    const lifeProgress = particle.userData.age / particle.userData.lifetime;

    if (particle.geometry.type === "SphereGeometry") {
      if (particle.userData.velocity) {
        particle.position.x += particle.userData.velocity.x * deltaTime;
        particle.position.y += particle.userData.velocity.y * deltaTime;
        particle.position.z += particle.userData.velocity.z * deltaTime;
      }

      particle.material.opacity = 0.7 * (1 - lifeProgress);
    } else if (particle.geometry.type === "CircleGeometry") {
      const newScale = particle.userData.initialScale + lifeProgress * 1.5;
      particle.scale.set(newScale, newScale, newScale);

      particle.material.opacity = 0.7 * (1 - lifeProgress);
    } else if (particle.geometry.type === "RingGeometry") {
      const newScale = particle.userData.initialScale + lifeProgress * 3.0;
      particle.scale.set(newScale, newScale, newScale);

      particle.material.opacity = 0.7 * (1 - lifeProgress);
    }
  }
}

export function isPlayerJumping() {
  return isJumping;
}

export function getJumpHeight() {
  return jumpHeight;
}

function showJumpHint() {
  const existingHint = document.getElementById("jumpHint");
  if (existingHint) {
    existingHint.remove();
  }

  const hint = document.createElement("div");
  hint.id = "jumpHint";
  hint.style.position = "absolute";
  hint.style.top = "30%";
  hint.style.left = "50%";
  hint.style.transform = "translate(-50%, -50%)";
  hint.style.color = "white";
  hint.style.fontFamily = "Arial, sans-serif";
  hint.style.fontSize = "24px";
  hint.style.fontWeight = "bold";
  hint.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  hint.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  hint.style.padding = "15px";
  hint.style.borderRadius = "10px";
  hint.style.zIndex = "999";
  hint.style.pointerEvents = "none";
  hint.innerHTML = "Press SPACE to jump over obstacles!";

  document.body.appendChild(hint);

  setTimeout(() => {
    if (hint.parentNode) {
      hint.style.opacity = "0";
      hint.style.transition = "opacity 0.5s";
      setTimeout(() => {
        if (hint.parentNode) {
          hint.parentNode.removeChild(hint);
        }
      }, 500);
    }
  }, 2000);
}

export function getPlayerState() {
  return {
    isJumping,
    isOnGround,
    jumpHeight,
  };
}


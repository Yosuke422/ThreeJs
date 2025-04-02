import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import {
  getCellSize,
  getPlatformSize,
  getMazeLayout,
  playerHeight,
  playerRadius,
} from "./config.js";

let spearTraps = [];
let spearGroup = null;
let spearModel = null;
let isModelLoaded = false;
let spearCooldown = 3000;
let spearSpeed = 12.0;
let spearDamage = 25;
let spearRange = 30;
let activeSpears = [];

const triggerDistance = 6.0;

function loadSpearTrapModel() {
  return new Promise((resolve, reject) => {
    const loader = new FBXLoader();
    loader.load(
      "assets/SpearTrap.fbx",
      (fbx) => {
        fbx.scale.set(0.02, 0.02, 0.02);

        fbx.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            const spearMaterial = new THREE.MeshStandardMaterial({
              color: 0x8c8c8c,
              metalness: 0.9,
              roughness: 0.2,
              envMapIntensity: 1.0,
            });

            child.material = spearMaterial;
          }
        });

        spearModel = fbx.clone();
        isModelLoaded = true;
        resolve(spearModel);
      },
      undefined,
      (error) => {
        console.error("Error loading spear trap model:", error);
        reject(error);
      }
    );
  });
}

export function createSpearTraps(scene, theme) {
  spearGroup = new THREE.Group();
  scene.add(spearGroup);

  spearTraps = [];
  activeSpears = [];

  if (!isModelLoaded) {
    loadSpearTrapModel()
      .then(() => {
        placeSpearTraps(scene, theme);
      })
      .catch((error) => {
        console.error("Failed to load spear trap model:", error);
      });
  } else {
    placeSpearTraps(scene, theme);
  }

  return spearGroup;
}

function placeSpearTraps(scene, theme) {
  const mazeLayout = getMazeLayout();
  const cellSize = getCellSize();
  const platformSize = getPlatformSize();

  const validWallCells = [];

  for (let i = 1; i < mazeLayout.length - 1; i++) {
    for (let j = 1; j < mazeLayout[i].length - 1; j++) {
      if (mazeLayout[i][j] === 1) {
        const hasAdjacentPath =
          mazeLayout[i - 1][j] === 0 ||
          mazeLayout[i + 1][j] === 0 ||
          mazeLayout[i][j - 1] === 0 ||
          mazeLayout[i][j + 1] === 0;

        if (hasAdjacentPath) {
          validWallCells.push({ i, j });
        }
      }
    }
  }

  const shuffledWalls = validWallCells.sort(() => Math.random() - 0.5);

  const numTraps = Math.min(
    10,
    Math.max(2, Math.floor((mazeLayout.length * mazeLayout[0].length) / 25))
  );

  for (let idx = 0; idx < Math.min(numTraps, shuffledWalls.length); idx++) {
    const wall = shuffledWalls[idx];

    let direction = null;
    let orientationAngle = 0;

    if (mazeLayout[wall.i - 1][wall.j] === 0) {
      direction = "north";
      orientationAngle = Math.PI;
    } else if (mazeLayout[wall.i + 1][wall.j] === 0) {
      direction = "south";
      orientationAngle = 0;
    } else if (mazeLayout[wall.i][wall.j - 1] === 0) {
      direction = "west";
      orientationAngle = Math.PI / 2;
    } else if (mazeLayout[wall.i][wall.j + 1] === 0) {
      direction = "east";
      orientationAngle = -Math.PI / 2;
    }

    if (!direction) continue;

    const x = -platformSize + wall.j * cellSize + cellSize / 2;
    const z = -platformSize + wall.i * cellSize + cellSize / 2;

    if (isModelLoaded && spearModel) {
      const trap = spearModel.clone();

      trap.position.set(x, 1.5, z);

      trap.rotation.y = orientationAngle;

      spearGroup.add(trap);

      spearTraps.push({
        position: new THREE.Vector3(x, 1.5, z),
        direction: direction,
        rotation: orientationAngle,
        lastFired: 0,
        mesh: trap,
        cell: { i: wall.i, j: wall.j },
      });
    }
  }

  if (!isModelLoaded) {
    createFallbackTraps(scene, shuffledWalls, numTraps, cellSize, platformSize);
  }
}

function createFallbackTraps(
  scene,
  shuffledWalls,
  numTraps,
  cellSize,
  platformSize
) {
  const mazeLayout = getMazeLayout();

  for (let idx = 0; idx < Math.min(numTraps, shuffledWalls.length); idx++) {
    const wall = shuffledWalls[idx];

    let direction = null;
    let orientationAngle = 0;

    if (wall.i > 0 && mazeLayout[wall.i - 1][wall.j] === 0) {
      direction = "north";
      orientationAngle = Math.PI;
    } else if (
      wall.i < mazeLayout.length - 1 &&
      mazeLayout[wall.i + 1][wall.j] === 0
    ) {
      direction = "south";
      orientationAngle = 0;
    } else if (wall.j > 0 && mazeLayout[wall.i][wall.j - 1] === 0) {
      direction = "west";
      orientationAngle = Math.PI / 2;
    } else if (
      wall.j < mazeLayout[0].length - 1 &&
      mazeLayout[wall.i][wall.j + 1] === 0
    ) {
      direction = "east";
      orientationAngle = -Math.PI / 2;
    }

    if (!direction) continue;

    const x = -platformSize + wall.j * cellSize + cellSize / 2;
    const z = -platformSize + wall.i * cellSize + cellSize / 2;

    const trapGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.6);
    const trapMaterial = new THREE.MeshStandardMaterial({
      color: 0x8c8c8c,
      metalness: 0.9,
      roughness: 0.2,
    });
    const trap = new THREE.Mesh(trapGeometry, trapMaterial);

    trap.position.set(x, 1.5, z);

    trap.rotation.y = orientationAngle;

    spearGroup.add(trap);

    spearTraps.push({
      position: new THREE.Vector3(x, 1.5, z),
      direction: direction,
      rotation: orientationAngle,
      lastFired: 0,
      mesh: trap,
      cell: { i: wall.i, j: wall.j },
    });
  }
}

function fireSpear(trap, scene, theme) {
  if (!trap || !scene) {
    console.warn("Missing trap or scene in fireSpear");
    return;
  }

  try {
    const spearColor = theme && theme.spearColor ? theme.spearColor : 0x8c8c8c;
    const spearMetalness =
      theme && theme.spearMetalness !== undefined ? theme.spearMetalness : 0.9;
    const spearRoughness =
      theme && theme.spearRoughness !== undefined ? theme.spearRoughness : 0.2;
    const spearEmissive =
      theme && theme.spearEmissive ? theme.spearEmissive : 0x222222;

    const spearGeometry = new THREE.CylinderGeometry(0.05, 0.1, 2.0, 8);
    const spearMaterial = new THREE.MeshStandardMaterial({
      color: spearColor,
      metalness: spearMetalness,
      roughness: spearRoughness,
      emissive: new THREE.Color(spearEmissive),
      emissiveIntensity: 0.2,
    });
    const spear = new THREE.Mesh(spearGeometry, spearMaterial);

    spear.rotation.x = Math.PI / 2;

    spear.position.copy(trap.position);

    spear.rotation.y = trap.rotation;

    scene.add(spear);

    let velocity;
    switch (trap.direction) {
      case "north":
        velocity = new THREE.Vector3(0, 0, -spearSpeed);
        break;
      case "south":
        velocity = new THREE.Vector3(0, 0, spearSpeed);
        break;
      case "east":
        velocity = new THREE.Vector3(spearSpeed, 0, 0);
        break;
      case "west":
        velocity = new THREE.Vector3(-spearSpeed, 0, 0);
        break;
      default:
        velocity = new THREE.Vector3(0, 0, 0);
    }

    activeSpears.push({
      mesh: spear,
      position: spear.position.clone(),
      velocity: velocity,
      distanceTraveled: 0,
      direction: trap.direction,
      hasHit: false,
    });

    if (window.playSound) {
      try {
        window.playSound("spearFire");
      } catch (soundError) {
        console.warn("Error playing spear fire sound:", soundError);
      }
    }

    if (trap.mesh) {
      try {
        let originalMaterial = null;
        if (trap.mesh.material) {
          originalMaterial = trap.mesh.material.clone();
        }

        trap.mesh.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xff0000,
              emissive: 0xff0000,
              emissiveIntensity: 0.5,
            });
          }
        });

        setTimeout(() => {
          if (trap.mesh) {
            try {
              if (originalMaterial) {
                trap.mesh.traverse((child) => {
                  if (child.isMesh) {
                    child.material = originalMaterial;
                  }
                });
              }
            } catch (restoreError) {
              console.warn("Error restoring trap material:", restoreError);
            }
          }
        }, 200);
      } catch (materialError) {
        console.warn("Error changing trap material:", materialError);
      }
    }
  } catch (error) {
    console.error("Error firing spear:", error);
  }
}

export function updateSpearTraps(playerPosition, delta, scene, damageFunction) {
  if (!spearTraps || spearTraps.length === 0) return;

  const currentTime = Date.now();

  for (const trap of spearTraps) {
    if (currentTime - trap.lastFired < spearCooldown) continue;

    const distanceToPlayer = trap.position.distanceTo(playerPosition);

    if (distanceToPlayer <= triggerDistance) {
      trap.lastFired = currentTime;
      fireSpear(trap, scene);
    }
  }

  for (let i = activeSpears.length - 1; i >= 0; i--) {
    const spear = activeSpears[i];

    if (!spear || !spear.mesh) {
      activeSpears.splice(i, 1);
      continue;
    }

    spear.position.add(spear.velocity.clone().multiplyScalar(delta));
    spear.mesh.position.copy(spear.position);

    spear.distanceTraveled += spear.velocity.length() * delta;

    if (!spear.hasHit) {
      const distanceToPlayer = spear.position.distanceTo(playerPosition);

      if (
        Math.abs(spear.position.y - playerPosition.y) < playerHeight &&
        distanceToPlayer < playerRadius
      ) {
        spear.hasHit = true;

        if (typeof damageFunction === "function") {
          try {
            damageFunction(spearDamage);

            createImpactEffect(spear.position, scene);
          } catch (error) {
            console.error("Error applying damage:", error);
          }
        } else {
          console.warn("Damage function not available for spear trap");

          createImpactEffect(spear.position, scene);
        }
      }
    }

    if (spear.distanceTraveled > spearRange) {
      scene.remove(spear.mesh);
      activeSpears.splice(i, 1);
    }
  }
}

function createImpactEffect(position, scene) {
  if (!scene || !position) {
    console.warn("Scene or position not provided to createImpactEffect");
    return;
  }

  try {
    const particleCount = 10;
    const particleGeometry = new THREE.SphereGeometry(0.03, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 1,
    });

    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 2,
        (Math.random() - 0.5) * 4
      );

      scene.add(particle);
      particles.push({
        mesh: particle,
        velocity: velocity,
        life: 1.0,
      });
    }

    const flash = new THREE.PointLight(0xffaa00, 1, 3);
    flash.position.copy(position);
    scene.add(flash);

    let flashIntensity = 1.0;

    const animateImpact = function (time) {
      try {
        let allDone = true;

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];

          if (!p || !p.mesh) {
            particles.splice(i, 1);
            continue;
          }

          p.mesh.position.add(p.velocity.clone().multiplyScalar(0.016));

          p.velocity.y -= 9.8 * 0.016;

          p.life -= 0.016;

          if (p.life <= 0) {
            scene.remove(p.mesh);

            if (p.mesh.geometry) p.mesh.geometry.dispose();
            if (p.mesh.material) p.mesh.material.dispose();

            particles.splice(i, 1);
          } else {
            allDone = false;
          }
        }

        flashIntensity -= 0.05;
        if (flashIntensity > 0 && flash) {
          flash.intensity = flashIntensity;
          allDone = false;
        } else if (flash) {
          scene.remove(flash);
        }

        if (!allDone) {
          requestAnimationFrame(animateImpact);
        } else {
          particles.length = 0;
          particleGeometry.dispose();
          particleMaterial.dispose();
        }
      } catch (error) {
        console.error("Error in impact animation:", error);

        try {
          particles.forEach((p) => {
            if (p && p.mesh) {
              scene.remove(p.mesh);
              if (p.mesh.geometry) p.mesh.geometry.dispose();
              if (p.mesh.material) p.mesh.material.dispose();
            }
          });
          particles.length = 0;

          if (flash) scene.remove(flash);

          particleGeometry.dispose();
          particleMaterial.dispose();
        } catch (cleanupError) {
          console.error("Error during cleanup:", cleanupError);
        }
      }
    };

    requestAnimationFrame(animateImpact);
  } catch (error) {
    console.error("Error creating impact effect:", error);
  }
}

export function cleanupSpearTraps(scene) {
  if (!scene) {
    console.warn("Scene not provided to cleanupSpearTraps");
    return;
  }

  try {
    for (let i = activeSpears.length - 1; i >= 0; i--) {
      const spear = activeSpears[i];
      if (spear && spear.mesh) {
        scene.remove(spear.mesh);

        if (spear.mesh.geometry) spear.mesh.geometry.dispose();
        if (spear.mesh.material) {
          if (Array.isArray(spear.mesh.material)) {
            spear.mesh.material.forEach((material) => material.dispose());
          } else {
            spear.mesh.material.dispose();
          }
        }
      }
    }
    activeSpears = [];
  } catch (error) {
    console.error("Error cleaning up active spears:", error);
  }

  try {
    if (spearGroup) {
      spearGroup.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });

      scene.remove(spearGroup);
      spearGroup = null;
    }
    spearTraps = [];
  } catch (error) {
    console.error("Error cleaning up spear traps:", error);
  }
}

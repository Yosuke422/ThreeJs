import * as THREE from "three";
import { getNumCoins } from "./config.js";
import { updateCoinCounter } from "./game.js";

let coins = [];
let coinsCollected = 0;
let activeParticles = [];
let coinCountElement;

export function createCoins(scene, validCoinPositions) {
  const numCoins = getNumCoins();

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const shuffledPositions = shuffleArray([...validCoinPositions]);

  const minDistanceBetweenCoins = 4.0;
  const selectedPositions = [];

  for (const pos of shuffledPositions) {
    let isFarEnough = true;

    for (const selectedPos of selectedPositions) {
      const distance = Math.sqrt(
        Math.pow(pos.x - selectedPos.x, 2) + Math.pow(pos.z - selectedPos.z, 2)
      );

      if (distance < minDistanceBetweenCoins) {
        isFarEnough = false;
        break;
      }
    }

    if (isFarEnough) {
      selectedPositions.push(pos);

      if (selectedPositions.length >= numCoins) {
        break;
      }
    }
  }

  if (selectedPositions.length < numCoins) {
    console.log(
      "Warning: Could not find enough positions with the minimum distance requirement. Using fallback positions."
    );

    for (const pos of shuffledPositions) {
      if (
        selectedPositions.some(
          (selected) => selected.x === pos.x && selected.z === pos.z
        )
      ) {
        continue;
      }

      let minDistance = Infinity;
      for (const selectedPos of selectedPositions) {
        const distance = Math.sqrt(
          Math.pow(pos.x - selectedPos.x, 2) +
            Math.pow(pos.z - selectedPos.z, 2)
        );
        minDistance = Math.min(minDistance, distance);
      }

      const candidate = { pos, minDistance };

      const candidates = [];
      candidates.push(candidate);
      candidates.sort((a, b) => b.minDistance - a.minDistance);

      if (candidates.length > 0) {
        selectedPositions.push(pos);

        if (selectedPositions.length >= numCoins) {
          break;
        }
      }
    }
  }

  coins = [];
  coinsCollected = 0;

  coinCountElement = document.createElement("div");
  coinCountElement.style.position = "absolute";
  coinCountElement.style.top = "20px";
  coinCountElement.style.left = "20px";
  coinCountElement.style.color = "white";
  coinCountElement.style.fontFamily = "Arial, sans-serif";
  coinCountElement.style.fontSize = "24px";
  coinCountElement.style.fontWeight = "bold";
  coinCountElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  coinCountElement.id = "coinCountElement";
  document.body.appendChild(coinCountElement);

  selectedPositions.forEach((pos, index) => {
    const coinGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 32);
    const coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });

    const coin = new THREE.Mesh(coinGeometry, coinMaterial);

    coin.position.set(pos.x, 1.2, pos.z);

    coin.rotation.x = Math.PI / 2;

    coin.castShadow = true;
    coin.receiveShadow = true;

    coin.userData = {
      baseY: 1.2,
      phaseOffset: index * (Math.PI / 3),
      rotationSpeed: 0.02 + Math.random() * 0.01,
      isCollected: false,
      soundPlayed: false,
      position: pos,
      collectionRadius: 0.8,
    };

    scene.add(coin);
    coins.push(coin);
  });

  const coinSpotlight = new THREE.SpotLight(
    0xffd700,
    1,
    5,
    Math.PI / 4,
    0.5,
    1
  );
  coinSpotlight.position.set(0, 4, 0);
  coinSpotlight.target.position.set(0, 0, 0);

  coinSpotlight.castShadow = false;
  scene.add(coinSpotlight);
  scene.add(coinSpotlight.target);

  return { coins, coinSpotlight };
}

export function updateCoins(time, cameraContainer) {
  const numCoins = getNumCoins();

  let nearestCoinDistance = Infinity;
  let nearestCoin = null;

  coins.forEach((coin) => {
    if (!coin.userData.isCollected) {
      coin.position.y =
        coin.userData.baseY +
        Math.sin(time * 0.001 + coin.userData.phaseOffset) * 0.1;

      coin.rotation.z += coin.userData.rotationSpeed;

      const horizontalDistance = new THREE.Vector2(
        coin.position.x - cameraContainer.position.x,
        coin.position.z - cameraContainer.position.z
      ).length();

      const verticalDistance = Math.abs(
        coin.position.y - cameraContainer.position.y
      );

      if (
        horizontalDistance < coin.userData.collectionRadius &&
        verticalDistance < 1.5
      ) {
        console.log(
          "Coin collected! Distance:",
          horizontalDistance,
          verticalDistance
        );

        coin.userData.isCollected = true;
        coin.visible = false;
        coinsCollected++;

        coinCountElement.innerHTML = `Coins: ${coinsCollected} / ${numCoins}`;

        const coinPosition = coin.position.clone();
        createCollectionEffect(coinPosition);

        if (window.forceCoinSound) {
          coin.userData.soundPlayed = true;
          console.log(
            "Playing coin sound via forceCoinSound (now prioritizes MP3 file)"
          );
          window.forceCoinSound();
        } else if (window.playSound) {
          coin.userData.soundPlayed = true;
          window.playSound("coin");
        } else {
          try {
            console.log("Direct coin sound play on collection");
            const sound = new Audio("sounds/coin-recieved-230517.mp3");
            sound.volume = 1.0;
            console.log(
              "Playing direct MP3 file: sounds/coin-recieved-230517.mp3"
            );

            sound.addEventListener("canplaythrough", () => {
              console.log("Coin MP3 loaded successfully, playing now");
            });

            sound.addEventListener("playing", () => {
              console.log("Coin MP3 playback started");
            });

            sound.addEventListener("error", (e) => {
              console.error("Coin MP3 error:", e);
            });

            const playPromise = sound.play();
            if (playPromise) {
              playPromise
                .then(() =>
                  console.log("Coin MP3 play promise resolved successfully")
                )
                .catch((e) => console.warn("Coin MP3 play failed:", e));
            }

            coin.userData.soundPlayed = true;
          } catch (e) {
            console.error("Error playing direct coin sound:", e);
          }
        }
      }

      if (horizontalDistance < nearestCoinDistance) {
        nearestCoinDistance = horizontalDistance;
        nearestCoin = coin;
      }
    }
  });

  if (nearestCoinDistance < 0.7) {
    if (
      typeof window.collectCoin === "function" &&
      nearestCoin &&
      !nearestCoin.userData.isCollected
    ) {
      window.collectCoin(nearestCoin);
    } else if (nearestCoin && !nearestCoin.userData.isCollected) {
      if (window.gameScene) {
        window.gameScene.remove(nearestCoin);
      }
      coins.splice(coins.indexOf(nearestCoin), 1);
      coinsCollected++;

      let totalCoins = coins.length + coinsCollected;

      if (!nearestCoin.userData.soundPlayed && window.playSound) {
        window.playSound("coin");
      }

      updateCoinCounter();
    }
  }

  return { nearestCoin, nearestCoinDistance, coinsCollected };
}

export function createCollectionEffect(position) {
  const particleCount = 15;
  const particles = new THREE.Group();

  for (let i = 0; i < particleCount; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd700 })
    );

    const angle = Math.random() * Math.PI * 2;
    const radius = 0.1 + Math.random() * 0.2;
    particle.position.set(
      position.x + Math.cos(angle) * radius,
      position.y,
      position.z + Math.sin(angle) * radius
    );

    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 2
      ),
      age: 0,
      maxAge: 1 + Math.random() * 0.5,
    };

    particles.add(particle);
  }

  if (window.gameScene) {
    window.gameScene.add(particles);
  }

  setTimeout(() => {
    if (window.gameScene && particles.parent) {
      window.gameScene.remove(particles);
    }
  }, 1000);

  particles.userData = {
    update: function (delta) {
      let allDead = true;

      particles.children.forEach((particle) => {
        if (particle.userData.age < particle.userData.maxAge) {
          particle.position.x += particle.userData.velocity.x * delta;
          particle.position.y += particle.userData.velocity.y * delta;
          particle.position.z += particle.userData.velocity.z * delta;

          particle.userData.velocity.y -= 9.8 * delta;

          particle.userData.age += delta;

          const fadeRatio =
            1 - particle.userData.age / particle.userData.maxAge;
          particle.material.opacity = fadeRatio;
          particle.scale.set(fadeRatio, fadeRatio, fadeRatio);

          allDead = false;
        } else {
          particle.visible = false;
        }
      });

      return !allDead;
    },
  };

  activeParticles.push(particles);
}

export function updateParticles(delta) {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const isAlive = activeParticles[i].userData.update(delta);
    if (!isAlive) {
      if (window.gameScene && activeParticles[i].parent) {
        window.gameScene.remove(activeParticles[i]);
      }
      activeParticles.splice(i, 1);
    }
  }
}

export function getCollectionState() {
  const numCoins = getNumCoins();
  return { coinsCollected, numCoins };
}

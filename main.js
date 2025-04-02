import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const cameraContainer = new THREE.Object3D();
scene.add(cameraContainer);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 0);
cameraContainer.add(camera);

const mazeLayout = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const platformSize = 10;
const cellSize = (platformSize * 2) / mazeLayout[0].length;
const wallWidth = cellSize;
const wallDepth = cellSize;

cameraContainer.position.set(
  -platformSize + cellSize / 2,
  2,
  -platformSize + cellSize + cellSize / 2
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let playerHeight = 2.0;
let isOnGround = true;

const playerRadius = 0.4;
const playerGeometry = new THREE.CapsuleGeometry(
  playerRadius,
  playerHeight - playerRadius * 2,
  1,
  8
);
const playerMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: true,
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = playerHeight / 2;
player.visible = false;
scene.add(player);

const gravity = 30.0;
const jumpVelocity = 10.0;
const playerSpeed = 5.0;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

const platformGeometry = new THREE.BoxGeometry(
  platformSize * 2,
  1,
  platformSize * 2
);
const platformMaterial = new THREE.MeshStandardMaterial({
  color: 0x808080,
  roughness: 0.7,
  metalness: 0.1,
});
const platform = new THREE.Mesh(platformGeometry, platformMaterial);
platform.receiveShadow = true;
platform.position.y = -0.5;
scene.add(platform);

const gridHelper = new THREE.GridHelper(platformSize * 2, 20);
scene.add(gridHelper);

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
const finishLineMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const finishLine = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
finishLine.position.set(
  platformSize - cellSize / 2,
  0.01,
  platformSize - cellSize / 2
);
scene.add(finishLine);

const finishPos = {
  x: platformSize - cellSize / 2,
  z: platformSize - cellSize / 2,
};

function findPathToFinish() {
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

const validCoinPositions = [];
for (let i = 0; i < mazeLayout.length; i++) {
  for (let j = 0; j < mazeLayout[i].length; j++) {
    if (mazeLayout[i][j] === 0) {
      if (
        (i === 0 && j === 0) ||
        (i === mazeLayout.length - 1 && j === mazeLayout[0].length - 1)
      ) {
        continue;
      }

      const x = -platformSize + j * cellSize + cellSize / 2;
      const z = -platformSize + i * cellSize + cellSize / 2;

      validCoinPositions.push({ x, z, i, j });
    }
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

shuffleArray(validCoinPositions);

const numCoins = 10;
const coinPositions = validCoinPositions.slice(0, numCoins);

const pathData = findPathToFinish();

const coins = [];
let coinsCollected = 0;

const coinCountElement = document.createElement("div");
coinCountElement.style.position = "absolute";
coinCountElement.style.top = "20px";
coinCountElement.style.left = "20px";
coinCountElement.style.color = "white";
coinCountElement.style.fontFamily = "Arial, sans-serif";
coinCountElement.style.fontSize = "24px";
coinCountElement.style.fontWeight = "bold";
coinCountElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
coinCountElement.innerHTML = "Coins: 0 / 10";
document.body.appendChild(coinCountElement);

coinPositions.forEach((pos, index) => {
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
    position: pos,
    collectionRadius: 0.8,
  };

  scene.add(coin);
  coins.push(coin);
});

const coinSpotlight = new THREE.SpotLight(0xffd700, 1, 5, Math.PI / 4, 0.5, 1);
coinSpotlight.position.set(0, 4, 0);
coinSpotlight.target.position.set(0, 0, 0);

coinSpotlight.castShadow = false;
scene.add(coinSpotlight);
scene.add(coinSpotlight.target);

directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;

const wallHeight = 2.5;
const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0x8b4513,
  roughness: 0.9,
  metalness: 0.1,
});

const maze = new THREE.Group();
scene.add(maze);

const wallCollisionBoxes = [];

for (let i = 0; i < mazeLayout.length; i++) {
  for (let j = 0; j < mazeLayout[i].length; j++) {
    if (mazeLayout[i][j] === 1) {
      const wallGeometry = new THREE.BoxGeometry(
        wallWidth,
        wallHeight,
        wallDepth
      );
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);

      wall.position.set(
        -platformSize + j * cellSize + cellSize / 2,
        wallHeight / 2,
        -platformSize + i * cellSize + cellSize / 2
      );

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

const keys = {
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
  Space: false,
};

document.addEventListener("keydown", (event) => {
  if (keys.hasOwnProperty(event.code)) {
    keys[event.code] = true;
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

document.addEventListener("click", () => {
  document.body.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement) {
    document.addEventListener("mousemove", onMouseMove, false);
  } else {
    document.removeEventListener("mousemove", onMouseMove, false);
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function checkWallCollisions(position, radius) {
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

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  const delta = (time - prevTime) / 1000;

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

        createCollectionEffect(coin.position.clone());
      }

      if (horizontalDistance < nearestCoinDistance) {
        nearestCoinDistance = horizontalDistance;
        nearestCoin = coin;
      }
    }
  });

  updateParticles(delta);

  const distanceToFinish = cameraContainer.position.distanceTo(
    finishLine.position
  );
  if (distanceToFinish < cellSize) {
    if (coinsCollected >= numCoins && !document.getElementById("winMessage")) {
      finishLine.material.color.set(0x00ff00);

      const winMessage = document.createElement("div");
      winMessage.id = "winMessage";
      winMessage.style.position = "absolute";
      winMessage.style.top = "50%";
      winMessage.style.left = "50%";
      winMessage.style.transform = "translate(-50%, -50%)";
      winMessage.style.color = "white";
      winMessage.style.fontFamily = "Arial, sans-serif";
      winMessage.style.fontSize = "48px";
      winMessage.style.fontWeight = "bold";
      winMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
      winMessage.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      winMessage.style.padding = "20px";
      winMessage.style.borderRadius = "10px";
      winMessage.innerHTML = "YOU WIN!<br>All coins collected!";
      document.body.appendChild(winMessage);
    } else if (
      coinsCollected < numCoins &&
      !document.getElementById("coinMessage")
    ) {
      finishLine.material.color.set(0xffff00);

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
      coinMessage.innerHTML = `Collect all coins before finishing!<br>Coins: ${coinsCollected} / ${numCoins}`;
      document.body.appendChild(coinMessage);

      setTimeout(() => {
        if (coinMessage.parentNode) {
          coinMessage.parentNode.removeChild(coinMessage);
        }
      }, 3000);
    }
  }

  if (coinsCollected >= numCoins && !document.getElementById("winMessage")) {
    finishLine.material.color.set(0x00ff00);

    const winMessage = document.createElement("div");
    winMessage.id = "winMessage";
    winMessage.style.position = "absolute";
    winMessage.style.top = "50%";
    winMessage.style.left = "50%";
    winMessage.style.transform = "translate(-50%, -50%)";
    winMessage.style.color = "white";
    winMessage.style.fontFamily = "Arial, sans-serif";
    winMessage.style.fontSize = "48px";
    winMessage.style.fontWeight = "bold";
    winMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
    winMessage.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    winMessage.style.padding = "20px";
    winMessage.style.borderRadius = "10px";
    winMessage.innerHTML = "YOU WIN!<br>All coins collected!";
    document.body.appendChild(winMessage);
  }

  if (nearestCoin) {
    coinSpotlight.position.set(
      nearestCoin.position.x,
      4,
      nearestCoin.position.z
    );
    coinSpotlight.target.position.set(
      nearestCoin.position.x,
      0,
      nearestCoin.position.z
    );

    const intensity = THREE.MathUtils.clamp(
      2.0 - nearestCoinDistance * 0.3,
      0.2,
      1
    );
    coinSpotlight.intensity = intensity;
  }

  velocity.y -= gravity * delta;

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

  if (keys.Space && isOnGround) {
    velocity.y = jumpVelocity;
    isOnGround = false;
  }

  const newPositionX = cameraContainer.position.x + velocity.x * delta;
  const newPositionZ = cameraContainer.position.z + velocity.z * delta;

  const currentPosition = cameraContainer.position.clone();

  if (Math.abs(newPositionX) < platformSize) {
    cameraContainer.position.x = newPositionX;

    if (checkWallCollisions(cameraContainer.position, playerRadius)) {
      cameraContainer.position.x = currentPosition.x;
    }
  }

  if (Math.abs(newPositionZ) < platformSize) {
    cameraContainer.position.z = newPositionZ;

    if (checkWallCollisions(cameraContainer.position, playerRadius)) {
      cameraContainer.position.z = currentPosition.z;
    }
  }

  const newPositionY = cameraContainer.position.y + velocity.y * delta;

  const currentY = cameraContainer.position.y;

  cameraContainer.position.y = newPositionY;

  if (checkWallCollisions(cameraContainer.position, playerRadius)) {
    cameraContainer.position.y = currentY;

    velocity.y = 0;
  }

  if (cameraContainer.position.y < playerHeight) {
    cameraContainer.position.y = playerHeight;
    velocity.y = 0;
    isOnGround = true;
  } else {
    if (velocity.y !== 0) {
      isOnGround = false;
    }
  }

  player.position.copy(cameraContainer.position);
  player.position.y -= playerHeight / 2;

  velocity.x = 0;
  velocity.z = 0;

  prevTime = time;
  renderer.render(scene, camera);
}

function createCollectionEffect(position) {
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

  scene.add(particles);

  setTimeout(() => {
    scene.remove(particles);
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

const activeParticles = [];

function updateParticles(delta) {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const isAlive = activeParticles[i].userData.update(delta);
    if (!isAlive) {
      scene.remove(activeParticles[i]);
      activeParticles.splice(i, 1);
    }
  }
}

animate();

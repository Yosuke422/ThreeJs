import { getCurrentLevel, getNumCoinsForLevel, mazeLevels } from "./config.js";

export const levelThemes = {
  Forest: {
    name: "Forest",
    skyColor: 0x90c3d4,
    platformColor: 0x2e4d1b,
    wallColor: 0x5d4037,
    fogColor: 0xb4d88e,
    fogDensity: 0.03,
    wallTexture: "wood",
    wallHeight: 2.8,
    wallRoughness: 0.9,
    wallMetalness: 0.1,
    wallBevelSize: 0.05,
    wallToppers: true,
    wallEmissive: 0x000000,
    wallPattern: "default",
    wallBumpScale: 0.2,
    platformTexture: "stone",
    platformRoughness: 0.9,
    platformMetalness: 0.1,
    obstacleColor: 0x3e2723,
    spearColor: 0x6d4c41,
    spearMetalness: 0.1,
    spearRoughness: 0.9,
    spearEmissive: 0x000000,
  },

  Desert: {
    name: "Desert",
    skyColor: 0xffe6b3,
    platformColor: 0xe8c39e,
    wallColor: 0xd2b48c,
    fogColor: 0xffe6b3,
    fogDensity: 0.02,
    wallTexture: "sand",
    wallHeight: 2.3,
    wallRoughness: 1.0,
    wallMetalness: 0.0,
    wallBevelSize: 0.0,
    wallToppers: false,
    wallEmissive: 0x000000,
    wallPattern: "weathered",
    wallBumpScale: 0.05,
    platformTexture: "sand",
    platformRoughness: 1.0,
    platformMetalness: 0.0,
    obstacleColor: 0xbf8040,
  },

  Cave: {
    name: "Cave",
    skyColor: 0x2c2c2f,
    platformColor: 0x2e2e32,
    wallColor: 0x52545a,
    fogColor: 0x000000,
    fogDensity: 0.06,
    wallTexture: "stone",
    wallHeight: 3.0,
    wallRoughness: 0.95,
    wallMetalness: 0.2,
    wallBevelSize: 0.0,
    wallToppers: false,
    wallEmissive: 0x000000,
    wallPattern: "cracked",
    wallBumpScale: 0.3,
    platformTexture: "stone",
    platformRoughness: 0.95,
    platformMetalness: 0.2,
    obstacleColor: 0x36454f,
  },

  Ice: {
    name: "Ice",
    skyColor: 0xd0e7f5,
    platformColor: 0xa1d6e2,
    wallColor: 0xbce5f9,
    fogColor: 0xecf9ff,
    fogDensity: 0.04,
    wallTexture: "ice",
    wallHeight: 2.6,
    wallRoughness: 0.3,
    wallMetalness: 0.7,
    wallBevelSize: 0.0,
    wallToppers: false,
    wallEmissive: 0x88ccff,
    wallPattern: "default",
    wallBumpScale: 0.05,
    platformTexture: "ice",
    platformRoughness: 0.1,
    platformMetalness: 0.9,
    obstacleColor: 0xadd8e6,
  },

  Volcano: {
    name: "Volcano",
    skyColor: 0x3c1518,
    platformColor: 0x5e2129,
    wallColor: 0x932020,
    fogColor: 0x280c0b,
    fogDensity: 0.05,
    wallTexture: "lava",
    wallHeight: 2.9,
    wallRoughness: 0.8,
    wallMetalness: 0.3,
    wallBevelSize: 0.1,
    wallToppers: false,
    wallEmissive: 0xff5500,
    wallPattern: "cracked",
    wallBumpScale: 0.15,
    platformTexture: "stone",
    platformRoughness: 0.9,
    platformMetalness: 0.3,
    obstacleColor: 0x800000,
  },

  Alien: {
    name: "Alien",
    skyColor: 0x0a1a2a,
    platformColor: 0x143642,
    wallColor: 0x1a472a,
    fogColor: 0x0f2f2f,
    fogDensity: 0.05,
    wallTexture: "alien",
    wallHeight: 3.1,
    wallRoughness: 0.4,
    wallMetalness: 0.7,
    wallBevelSize: 0.1,
    wallToppers: true,
    wallEmissive: 0x00ff77,
    wallPattern: "panel",
    wallBumpScale: 0.1,
    platformTexture: "alien",
    platformRoughness: 0.5,
    platformMetalness: 0.6,
    obstacleColor: 0x00ff55,
  },

  Ocean: {
    name: "Ocean",
    skyColor: 0x7ec0ee,
    platformColor: 0x4a6670,
    wallColor: 0xff6f61,
    fogColor: 0x7fcdff,
    fogDensity: 0.02,
    wallTexture: "coral",
    wallHeight: 2.5,
    wallRoughness: 0.8,
    wallMetalness: 0.2,
    wallBevelSize: 0.0,
    wallToppers: true,
    wallEmissive: 0xff0000,
    wallPattern: "default",
    wallBumpScale: 0.2,
    platformTexture: "sand",
    platformRoughness: 0.9,
    platformMetalness: 0.1,
    obstacleColor: 0x4682b4,
  },

  Neon: {
    name: "Neon",
    skyColor: 0x000000,
    platformColor: 0x282828,
    wallColor: 0x252525,
    fogColor: 0x000000,
    fogDensity: 0.05,
    wallTexture: "neon",
    wallHeight: 2.7,
    wallRoughness: 0.2,
    wallMetalness: 0.9,
    wallBevelSize: 0.0,
    wallToppers: false,
    wallEmissive: 0x00ffff,
    wallPattern: "grid",
    wallBumpScale: 0.0,
    platformTexture: "neon",
    platformRoughness: 0.2,
    platformMetalness: 0.9,
    obstacleColor: 0xff00ff,
  },

  Sunset: {
    name: "Sunset",
    skyColor: 0xff9966,
    platformColor: 0x896e69,
    wallColor: 0xba6e5d,
    fogColor: 0xffcb8e,
    fogDensity: 0.04,
    wallTexture: "brick",
    wallHeight: 2.6,
    wallRoughness: 0.7,
    wallMetalness: 0.1,
    wallBevelSize: 0.05,
    wallToppers: false,
    wallEmissive: 0xff6a00,
    wallPattern: "panel",
    wallBumpScale: 0.1,
    platformTexture: "stone",
    platformRoughness: 0.8,
    platformMetalness: 0.1,
    obstacleColor: 0xdaa520,
  },

  Space: {
    name: "Space",
    skyColor: 0x000011,
    platformColor: 0x1a1a2e,
    wallColor: 0x16213e,
    fogColor: 0x000000,
    fogDensity: 0.01,
    wallTexture: "metal",
    wallHeight: 3.0,
    wallRoughness: 0.3,
    wallMetalness: 0.9,
    wallBevelSize: 0.1,
    wallToppers: false,
    wallEmissive: 0x0066ff,
    wallPattern: "panel",
    wallBumpScale: 0.05,
    platformTexture: "metal",
    platformRoughness: 0.3,
    platformMetalness: 0.9,
    obstacleColor: 0x6a5acd,
  },
};

export function createLevelUI() {
  const levelIndicator = document.createElement("div");
  levelIndicator.id = "levelIndicator";
  levelIndicator.style.position = "absolute";
  levelIndicator.style.top = "20px";
  levelIndicator.style.right = "20px";
  levelIndicator.style.color = "white";
  levelIndicator.style.fontFamily = "Arial, sans-serif";
  levelIndicator.style.fontSize = "24px";
  levelIndicator.style.fontWeight = "bold";
  levelIndicator.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  levelIndicator.innerHTML = `Level: ${getCurrentLevel() + 1} / ${
    mazeLevels.length
  }`;
  document.body.appendChild(levelIndicator);

  return levelIndicator;
}

export function createNextLevelButton(callback) {
  const existingButton = document.getElementById("nextLevelButton");
  if (existingButton) {
    existingButton.remove();
  }

  const nextLevelButton = document.createElement("button");
  nextLevelButton.id = "nextLevelButton";
  nextLevelButton.innerText = "Next Level";
  nextLevelButton.style.position = "absolute";
  nextLevelButton.style.top = "calc(50% + 100px)";
  nextLevelButton.style.left = "50%";
  nextLevelButton.style.transform = "translateX(-50%)";
  nextLevelButton.style.padding = "15px 30px";
  nextLevelButton.style.backgroundColor = "#4CAF50";
  nextLevelButton.style.color = "white";
  nextLevelButton.style.border = "none";
  nextLevelButton.style.borderRadius = "5px";
  nextLevelButton.style.fontSize = "20px";
  nextLevelButton.style.fontWeight = "bold";
  nextLevelButton.style.cursor = "pointer";
  nextLevelButton.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  nextLevelButton.style.zIndex = "1000";
  nextLevelButton.style.pointerEvents = "auto";

  nextLevelButton.innerHTML = "Next Level ►";

  let isLoading = false;

  nextLevelButton.onmouseenter = () => {
    if (!isLoading) {
      nextLevelButton.style.backgroundColor = "#45a049";
      nextLevelButton.style.transform = "translateX(-50%) scale(1.05)";
    }
  };
  nextLevelButton.onmouseleave = () => {
    if (!isLoading) {
      nextLevelButton.style.backgroundColor = "#4CAF50";
      nextLevelButton.style.transform = "translateX(-50%) scale(1)";
    }
  };

  const handleButtonClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isLoading) return;
    isLoading = true;

    nextLevelButton.style.backgroundColor = "#999999";
    nextLevelButton.innerHTML = "Loading...";
    nextLevelButton.style.cursor = "wait";

    console.log("Next level button clicked - loading next level");

    setTimeout(() => {
      if (nextLevelButton.parentNode) {
        nextLevelButton.parentNode.removeChild(nextLevelButton);
      }

      const levelCompleteMessage = document.getElementById(
        "levelCompleteMessage"
      );
      if (levelCompleteMessage && levelCompleteMessage.parentNode) {
        levelCompleteMessage.parentNode.removeChild(levelCompleteMessage);
      }

      if (typeof callback === "function") {
        callback();
      }
    }, 10);
  };

  nextLevelButton.addEventListener("click", handleButtonClick);
  nextLevelButton.addEventListener("mousedown", handleButtonClick);
  nextLevelButton.addEventListener("touchstart", handleButtonClick);

  document.body.appendChild(nextLevelButton);

  nextLevelButton.tabIndex = 0;
  nextLevelButton.focus();

  return nextLevelButton;
}

export function createLevelCompleteMessage(level) {
  const existingMessage = document.getElementById("levelCompleteMessage");
  if (existingMessage) {
    existingMessage.remove();
  }

  const levelCompleteMessage = document.createElement("div");
  levelCompleteMessage.id = "levelCompleteMessage";
  levelCompleteMessage.style.position = "absolute";
  levelCompleteMessage.style.top = "50%";
  levelCompleteMessage.style.left = "50%";
  levelCompleteMessage.style.transform = "translate(-50%, -50%)";
  levelCompleteMessage.style.color = "white";
  levelCompleteMessage.style.fontFamily = "Arial, sans-serif";
  levelCompleteMessage.style.fontSize = "48px";
  levelCompleteMessage.style.fontWeight = "bold";
  levelCompleteMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  levelCompleteMessage.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  levelCompleteMessage.style.padding = "20px";
  levelCompleteMessage.style.borderRadius = "10px";
  levelCompleteMessage.style.textAlign = "center";
  levelCompleteMessage.style.zIndex = "999";

  if (level === mazeLevels.length - 1) {
    levelCompleteMessage.innerHTML =
      "CONGRATULATIONS!<br>You completed all levels!";
  } else {
    levelCompleteMessage.innerHTML = `LEVEL ${
      level + 1
    } COMPLETE!<br>All coins collected!`;
  }

  document.body.appendChild(levelCompleteMessage);
  return levelCompleteMessage;
}

export function updateLevelIndicator(levelIndicator) {
  if (levelIndicator) {
    levelIndicator.innerHTML = `Level: ${getCurrentLevel() + 1} / ${
      mazeLevels.length
    }`;
  }
}

export function cleanupLevelUI() {
  const winMessage = document.getElementById("winMessage");
  if (winMessage) {
    winMessage.remove();
  }

  const coinMessage = document.getElementById("coinMessage");
  if (coinMessage) {
    coinMessage.remove();
  }

  const levelCompleteMessage = document.getElementById("levelCompleteMessage");
  if (levelCompleteMessage) {
    levelCompleteMessage.remove();
  }
}

export function hasNextLevel() {
  return getCurrentLevel() < mazeLevels.length - 1;
}

export function getNextLevel() {
  if (hasNextLevel()) {
    return {
      level: getCurrentLevel() + 1,
      layout: mazeLevels[getCurrentLevel() + 1],
      numCoins: getNumCoinsForLevel(getCurrentLevel() + 1),
    };
  }
  return null;
}

export function createGameCompleteMessage() {
  const gameCompleteMessage = document.createElement("div");
  gameCompleteMessage.id = "gameCompleteMessage";
  gameCompleteMessage.style.position = "absolute";
  gameCompleteMessage.style.top = "50%";
  gameCompleteMessage.style.left = "50%";
  gameCompleteMessage.style.transform = "translate(-50%, -50%)";
  gameCompleteMessage.style.color = "white";
  gameCompleteMessage.style.fontFamily = "Arial, sans-serif";
  gameCompleteMessage.style.fontSize = "48px";
  gameCompleteMessage.style.fontWeight = "bold";
  gameCompleteMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  gameCompleteMessage.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  gameCompleteMessage.style.padding = "20px";
  gameCompleteMessage.style.borderRadius = "10px";
  gameCompleteMessage.style.textAlign = "center";
  gameCompleteMessage.style.zIndex = "999";
  gameCompleteMessage.innerHTML =
    "CONGRATULATIONS!<br>You completed all levels!<br>You are a maze master!";

  document.body.appendChild(gameCompleteMessage);

  const resetButton = document.createElement("button");
  resetButton.id = "resetButton";
  resetButton.innerText = "Play Again";
  resetButton.style.position = "absolute";
  resetButton.style.top = "calc(50% + 100px)";
  resetButton.style.left = "50%";
  resetButton.style.transform = "translateX(-50%)";
  resetButton.style.padding = "15px 30px";
  resetButton.style.backgroundColor = "#4CAF50";
  resetButton.style.color = "white";
  resetButton.style.border = "none";
  resetButton.style.borderRadius = "5px";
  resetButton.style.fontSize = "20px";
  resetButton.style.fontWeight = "bold";
  resetButton.style.cursor = "pointer";
  resetButton.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  resetButton.style.zIndex = "1000";

  resetButton.onmouseenter = () => {
    resetButton.style.backgroundColor = "#45a049";
  };
  resetButton.onmouseleave = () => {
    resetButton.style.backgroundColor = "#4CAF50";
  };

  resetButton.onmousedown = () => {
    resetButton.style.transform = "translateX(-50%) scale(0.95)";
  };
  resetButton.onmouseup = () => {
    resetButton.style.transform = "translateX(-50%) scale(1)";
  };

  document.body.appendChild(resetButton);

  setTimeout(() => {
    resetButton.focus();
  }, 100);

  return { gameCompleteMessage, resetButton };
}

export function getLevelTheme(level) {
  if (!levelThemes) {
    return {
      name: "Default",
      skyColor: 0x87ceeb,
      platformColor: 0x444444,
      wallColor: 0x777777,
      fogColor: 0x87ceeb,
      fogDensity: 0.01,
      darknessLevel: 0.2,
      hasFogOfWar: false,
      hasLightningFlashes: false,
      hasReducedVisibility: false,
    };
  }

  const themes = Object.keys(levelThemes);
  if (!themes || themes.length === 0) {
    return {
      name: "Default",
      skyColor: 0x87ceeb,
      platformColor: 0x444444,
      wallColor: 0x777777,
      fogColor: 0x87ceeb,
      fogDensity: 0.01,
      darknessLevel: 0.2,
    };
  }

  const themeIndex = level % themes.length;
  const themeName = themes[themeIndex];
  const theme = levelThemes[themeName] || {
    name: "Default",
    skyColor: 0x87ceeb,
    platformColor: 0x444444,
    wallColor: 0x777777,
    fogColor: 0x87ceeb,
    fogDensity: 0.01,
  };

  const difficultyModifiers = {
    fogDensity: theme.fogDensity || 0.01,
    visibility: 20,

    hasFogOfWar: level >= 6,
    hasLightningFlashes: level >= 8,
    hasReducedVisibility: level >= 4,

    darknessLevel: Math.min(0.7, 0.2 + level * 0.05),

    coinShrinkFactor: Math.max(0.5, 1 - level * 0.05),
    coinRotationSpeed: 1 + level * 0.2,
    jumpControl: Math.max(0.6, 1 - level * 0.04),
  };

  if (level >= 4) {
    difficultyModifiers.fogDensity = theme.fogDensity * (1 + (level - 3) * 0.3);
  }

  if (level >= 4) {
    difficultyModifiers.visibility = Math.max(10, 20 - (level - 3) * 1.5);
  }

  return {
    ...theme,
    ...difficultyModifiers,
    level,
  };
}

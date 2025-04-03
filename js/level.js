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
  levelIndicator.style.left = "20px";
  levelIndicator.style.color = "white";
  levelIndicator.style.fontFamily = "Arial, sans-serif";
  levelIndicator.style.fontSize = "18px";
  levelIndicator.style.fontWeight = "bold";
  levelIndicator.style.padding = "10px 15px";
  levelIndicator.style.backgroundColor = "rgba(20, 30, 40, 0.75)";
  levelIndicator.style.borderRadius = "10px";
  levelIndicator.style.backdropFilter = "blur(5px)";
  levelIndicator.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.3)";
  levelIndicator.style.zIndex = "1000";
  levelIndicator.style.display = "flex";
  levelIndicator.style.alignItems = "center";
  levelIndicator.style.border = "1px solid rgba(255, 255, 255, 0.1)";
  levelIndicator.style.textShadow = "1px 1px 2px rgba(0, 0, 0, 0.5)";
  
  // Add a small game icon
  const gameIcon = document.createElement("span");
  gameIcon.innerHTML = "🎮";
  gameIcon.style.marginRight = "8px";
  gameIcon.style.fontSize = "20px";
  levelIndicator.appendChild(gameIcon);
  
  // Add level text
  const levelText = document.createElement("span");
  levelText.id = "levelText";
  levelText.innerHTML = `Level: ${getCurrentLevel() + 1} / ${mazeLevels.length}`;
  levelIndicator.appendChild(levelText);
  
  document.body.appendChild(levelIndicator);
  return levelText;
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
  nextLevelButton.style.backgroundColor = "#4fc3f7";
  nextLevelButton.style.color = "white";
  nextLevelButton.style.border = "none";
  nextLevelButton.style.borderRadius = "50px";
  nextLevelButton.style.fontSize = "20px";
  nextLevelButton.style.fontWeight = "bold";
  nextLevelButton.style.cursor = "pointer";
  nextLevelButton.style.boxShadow = "0 4px 15px rgba(79, 195, 247, 0.4)";
  nextLevelButton.style.zIndex = "1000";
  nextLevelButton.style.transition = "all 0.3s ease";
  nextLevelButton.style.opacity = "0";
  
  // Add arrow icon
  nextLevelButton.innerHTML = 'Next Level <span style="margin-left: 8px;">➡️</span>';

  nextLevelButton.onmouseenter = () => {
    nextLevelButton.style.backgroundColor = "#039be5";
    nextLevelButton.style.transform = "translateX(-50%) scale(1.05)";
    nextLevelButton.style.boxShadow = "0 6px 20px rgba(79, 195, 247, 0.6)";
  };
  
  nextLevelButton.onmouseleave = () => {
    nextLevelButton.style.backgroundColor = "#4fc3f7";
    nextLevelButton.style.transform = "translateX(-50%) scale(1)";
    nextLevelButton.style.boxShadow = "0 4px 15px rgba(79, 195, 247, 0.4)";
  };

  nextLevelButton.onmousedown = () => {
    nextLevelButton.style.transform = "translateX(-50%) scale(0.95)";
  };
  
  nextLevelButton.onmouseup = () => {
    nextLevelButton.style.transform = "translateX(-50%) scale(1.05)";
  };

  document.body.appendChild(nextLevelButton);
  
  // Animate button appearance
  setTimeout(() => {
    nextLevelButton.style.opacity = "1";
    nextLevelButton.focus();
  }, 800);

  const handleButtonClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    nextLevelButton.disabled = true;
    nextLevelButton.style.opacity = "0.7";
    nextLevelButton.style.cursor = "not-allowed";
    nextLevelButton.style.transform = "translateX(-50%) scale(0.95)";
    
    // Show loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.id = "loadingIndicator";
    loadingIndicator.style.position = "absolute";
    loadingIndicator.style.top = "50%";
    loadingIndicator.style.left = "50%";
    loadingIndicator.style.transform = "translate(-50%, -50%)";
    loadingIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    loadingIndicator.style.color = "white";
    loadingIndicator.style.padding = "15px 30px";
    loadingIndicator.style.borderRadius = "10px";
    loadingIndicator.style.fontFamily = "Arial, sans-serif";
    loadingIndicator.style.fontSize = "24px";
    loadingIndicator.style.zIndex = "1100";
    loadingIndicator.style.display = "flex";
    loadingIndicator.style.alignItems = "center";
    loadingIndicator.style.justifyContent = "center";
    loadingIndicator.style.gap = "15px";
    loadingIndicator.style.minWidth = "200px";
    
    const spinner = document.createElement("div");
    spinner.style.width = "24px";
    spinner.style.height = "24px";
    spinner.style.border = "3px solid rgba(255, 255, 255, 0.3)";
    spinner.style.borderRadius = "50%";
    spinner.style.borderTop = "3px solid white";
    spinner.style.animation = "spin 1s linear infinite";
    
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);
    
    loadingIndicator.appendChild(spinner);
    loadingIndicator.appendChild(document.createTextNode("Loading Next Level..."));
    document.body.appendChild(loadingIndicator);

    if (typeof callback === "function") {
      callback();
    }
  };

  nextLevelButton.addEventListener("click", handleButtonClick);
  nextLevelButton.addEventListener("touchstart", handleButtonClick);

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
  levelCompleteMessage.style.fontSize = "36px";
  levelCompleteMessage.style.fontWeight = "bold";
  levelCompleteMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  levelCompleteMessage.style.backgroundColor = "rgba(20, 30, 40, 0.85)";
  levelCompleteMessage.style.backdropFilter = "blur(10px)";
  levelCompleteMessage.style.padding = "30px 40px";
  levelCompleteMessage.style.borderRadius = "15px";
  levelCompleteMessage.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.5)";
  levelCompleteMessage.style.textAlign = "center";
  levelCompleteMessage.style.zIndex = "999";
  levelCompleteMessage.style.border = "1px solid rgba(255, 255, 255, 0.1)";
  levelCompleteMessage.style.opacity = "0";
  levelCompleteMessage.style.transition = "opacity 0.5s, transform 0.5s";
  
  // Top decoration bar
  const topDecoration = document.createElement("div");
  topDecoration.style.position = "absolute";
  topDecoration.style.top = "0";
  topDecoration.style.left = "0";
  topDecoration.style.width = "100%";
  topDecoration.style.height = "5px";
  topDecoration.style.background = "linear-gradient(90deg, #4fc3f7, #1de9b6)";
  levelCompleteMessage.appendChild(topDecoration);
  
  // Bottom glow effect
  const bottomGlow = document.createElement("div");
  bottomGlow.style.position = "absolute";
  bottomGlow.style.bottom = "-10px";
  bottomGlow.style.left = "50%";
  bottomGlow.style.transform = "translateX(-50%)";
  bottomGlow.style.width = "80%";
  bottomGlow.style.height = "15px";
  bottomGlow.style.borderRadius = "50%";
  bottomGlow.style.background = "rgba(29, 233, 182, 0.3)";
  bottomGlow.style.filter = "blur(10px)";
  levelCompleteMessage.appendChild(bottomGlow);
  
  // Content container
  const contentContainer = document.createElement("div");
  contentContainer.style.position = "relative";
  contentContainer.style.zIndex = "1";
  
  // Success icon
  const successIcon = document.createElement("div");
  successIcon.innerHTML = "🎉";
  successIcon.style.fontSize = "48px";
  successIcon.style.marginBottom = "10px";
  contentContainer.appendChild(successIcon);
  
  // Header text
  const headerText = document.createElement("div");
  headerText.style.fontSize = "42px";
  headerText.style.color = "#1de9b6";
  headerText.style.fontWeight = "bold";
  headerText.style.marginBottom = "5px";
  headerText.style.textTransform = "uppercase";
  headerText.style.letterSpacing = "2px";
  
  if (level === mazeLevels.length - 1) {
    headerText.innerText = "CONGRATULATIONS!";
  } else {
    headerText.innerText = `LEVEL ${level + 1} COMPLETE!`;
  }
  contentContainer.appendChild(headerText);
  
  // Subheader
  const subheader = document.createElement("div");
  subheader.style.fontSize = "24px";
  subheader.style.marginBottom = "20px";
  subheader.style.opacity = "0.85";
  
  if (level === mazeLevels.length - 1) {
    subheader.innerText = "You completed all levels!";
  } else {
    subheader.innerText = "All coins collected!";
  }
  contentContainer.appendChild(subheader);
  
  // Add contentContainer to message
  levelCompleteMessage.appendChild(contentContainer);

  document.body.appendChild(levelCompleteMessage);
  
  // Animation
  setTimeout(() => {
    levelCompleteMessage.style.opacity = "1";
    levelCompleteMessage.style.transform = "translate(-50%, -50%) scale(1)";
  }, 100);
  
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
  gameCompleteMessage.style.fontSize = "36px";
  gameCompleteMessage.style.fontWeight = "bold";
  gameCompleteMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  gameCompleteMessage.style.backgroundColor = "rgba(20, 30, 40, 0.85)";
  gameCompleteMessage.style.backdropFilter = "blur(10px)";
  gameCompleteMessage.style.padding = "40px 50px";
  gameCompleteMessage.style.borderRadius = "15px";
  gameCompleteMessage.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.5)";
  gameCompleteMessage.style.textAlign = "center";
  gameCompleteMessage.style.zIndex = "999";
  gameCompleteMessage.style.border = "1px solid rgba(255, 255, 255, 0.1)";
  gameCompleteMessage.style.opacity = "0";
  gameCompleteMessage.style.transition = "opacity 0.5s, transform 0.5s";
  
  // Decorative elements
  const topDecoration = document.createElement("div");
  topDecoration.style.position = "absolute";
  topDecoration.style.top = "0";
  topDecoration.style.left = "0";
  topDecoration.style.width = "100%";
  topDecoration.style.height = "5px";
  topDecoration.style.background = "linear-gradient(90deg, #ffeb3b, #ff9800, #f44336)";
  gameCompleteMessage.appendChild(topDecoration);
  
  const bottomGlow = document.createElement("div");
  bottomGlow.style.position = "absolute";
  bottomGlow.style.bottom = "-10px";
  bottomGlow.style.left = "50%";
  bottomGlow.style.transform = "translateX(-50%)";
  bottomGlow.style.width = "80%";
  bottomGlow.style.height = "15px";
  bottomGlow.style.borderRadius = "50%";
  bottomGlow.style.background = "rgba(255, 152, 0, 0.3)";
  bottomGlow.style.filter = "blur(10px)";
  gameCompleteMessage.appendChild(bottomGlow);
  
  // Content container
  const contentContainer = document.createElement("div");
  contentContainer.style.position = "relative";
  contentContainer.style.zIndex = "1";
  
  // Trophy icon
  const trophyIcon = document.createElement("div");
  trophyIcon.innerHTML = "🏆";
  trophyIcon.style.fontSize = "64px";
  trophyIcon.style.marginBottom = "20px";
  contentContainer.appendChild(trophyIcon);
  
  // Title
  const titleText = document.createElement("div");
  titleText.innerText = "CONGRATULATIONS!";
  titleText.style.fontSize = "42px";
  titleText.style.fontWeight = "bold";
  titleText.style.color = "#ffeb3b";
  titleText.style.marginBottom = "15px";
  titleText.style.textTransform = "uppercase";
  titleText.style.letterSpacing = "2px";
  contentContainer.appendChild(titleText);
  
  // Subtitle
  const subtitleText = document.createElement("div");
  subtitleText.innerText = "You completed all levels!";
  subtitleText.style.fontSize = "28px";
  subtitleText.style.marginBottom = "15px";
  subtitleText.style.opacity = "0.9";
  contentContainer.appendChild(subtitleText);
  
  // Message
  const message = document.createElement("div");
  message.innerText = "You are a maze master!";
  message.style.fontSize = "22px";
  message.style.opacity = "0.8";
  message.style.fontStyle = "italic";
  contentContainer.appendChild(message);
  
  gameCompleteMessage.appendChild(contentContainer);
  document.body.appendChild(gameCompleteMessage);
  
  // Reset button with improved styling
  const resetButton = document.createElement("button");
  resetButton.id = "resetButton";
  resetButton.innerText = "Play Again";
  resetButton.style.position = "absolute";
  resetButton.style.top = "calc(50% + 180px)";
  resetButton.style.left = "50%";
  resetButton.style.transform = "translateX(-50%)";
  resetButton.style.padding = "15px 30px";
  resetButton.style.backgroundColor = "#ff9800";
  resetButton.style.color = "white";
  resetButton.style.border = "none";
  resetButton.style.borderRadius = "50px";
  resetButton.style.fontSize = "20px";
  resetButton.style.fontWeight = "bold";
  resetButton.style.cursor = "pointer";
  resetButton.style.boxShadow = "0 4px 15px rgba(255, 152, 0, 0.4)";
  resetButton.style.zIndex = "1000";
  resetButton.style.transition = "all 0.3s ease";
  resetButton.style.opacity = "0";

  resetButton.onmouseenter = () => {
    resetButton.style.backgroundColor = "#f57c00";
    resetButton.style.transform = "translateX(-50%) scale(1.05)";
    resetButton.style.boxShadow = "0 6px 20px rgba(255, 152, 0, 0.6)";
  };
  
  resetButton.onmouseleave = () => {
    resetButton.style.backgroundColor = "#ff9800";
    resetButton.style.transform = "translateX(-50%) scale(1)";
    resetButton.style.boxShadow = "0 4px 15px rgba(255, 152, 0, 0.4)";
  };

  resetButton.onmousedown = () => {
    resetButton.style.transform = "translateX(-50%) scale(0.95)";
  };
  
  resetButton.onmouseup = () => {
    resetButton.style.transform = "translateX(-50%) scale(1.05)";
  };

  document.body.appendChild(resetButton);

  // Animations
  setTimeout(() => {
    gameCompleteMessage.style.opacity = "1";
    gameCompleteMessage.style.transform = "translate(-50%, -50%) scale(1)";
    
    setTimeout(() => {
      resetButton.style.opacity = "1";
      resetButton.focus();
    }, 500);
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

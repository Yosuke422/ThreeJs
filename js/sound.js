let soundsEnabled = true;

const soundCache = {};

const soundURLs = {
  coin: "sounds/coin-recieved-230517.mp3",
  jump: "sounds/cartoon-jump-6462.mp3",
  hurt: "sounds/classic_hurt.mp3",
  levelComplete: "sounds/game-level-complete-143022.mp3",
  gameComplete: "sounds/game-level-complete-143022.mp3",
  hit: "sounds/classic_hurt.mp3",
  spikeToggle: "sounds/cartoon-jump-6462.mp3",
};

let lastPlayerHealth = 100;

const preloadedSounds = {};

function isAudioSupported() {
  try {
    const audio = new Audio();
    return typeof audio.canPlayType === "function";
  } catch (e) {
    console.warn("Audio not supported:", e);
    return false;
  }
}



export function initSounds() {
  console.log("Initializing sounds...");

  initAudioContextOnInteraction();

  const coinSound = new Audio();
  coinSound.src = soundURLs.coin;
  coinSound.preload = "auto";
  window.coinSoundPreloaded = coinSound;

  coinSound.addEventListener(
    "canplaythrough",
    () => {
      console.log("COIN SOUND LOADED SUCCESSFULLY!");
      window.coinSoundLoaded = true;
    },
    { once: true }
  );

  coinSound.addEventListener("error", (e) => {
    console.error("CRITICAL: Coin sound failed to load:", e);
    window.coinSoundLoadError = e;
  });

  coinSound.load();

  window.forceCoinSound = forceCoinSound;

  if (!isAudioSupported()) {
    console.warn("Audio not supported in this browser");
    return;
  }

  for (const key in soundCache) {
    delete soundCache[key];
  }

  preloadCoinSound();

  let successfullyLoaded = 0;
  const totalSounds = Object.keys(soundURLs).length;

  for (const soundName in soundURLs) {
    try {
      const sound = new Audio();
      const soundSrc = soundURLs[soundName];
      console.log(`Loading sound: ${soundName} from ${soundSrc}...`);

      sound.src = soundSrc;
      sound.preload = "auto";

      sound.addEventListener(
        "canplaythrough",
        () => {
          console.log(`Sound loaded successfully: ${soundName}`);
          successfullyLoaded++;
          console.log(`Loaded ${successfullyLoaded}/${totalSounds} sounds`);

          preloadedSounds[soundName] = sound;
        },
        { once: true }
      );

      sound.addEventListener("error", (e) => {
        console.warn(`Error loading sound ${soundName}:`, e);

        const fallbackSound = new Audio();
        fallbackSound.src = soundSrc;
        preloadedSounds[soundName] = fallbackSound;
      });

      soundCache[soundName] = sound;
    } catch (e) {
      console.warn(`Error creating audio for ${soundName}:`, e);
    }
  }

  window.playSound = function (soundName) {
    if (!soundsEnabled) return;

    console.log(`Attempting to play sound: ${soundName}`);

    if (soundName === "coin") {
      playCoinSound();
      return;
    }

    if (preloadedSounds[soundName]) {
      try {
        const soundClone = preloadedSounds[soundName].cloneNode();
        soundClone.volume = 0.5;
        soundClone.play().catch((e) => {
          console.warn(`Failed to play preloaded sound ${soundName}:`, e);
        });
        return;
      } catch (e) {
        console.warn(`Error playing preloaded sound ${soundName}:`, e);
      }
    }

    if (soundCache[soundName]) {
      try {
        const soundClone = soundCache[soundName].cloneNode();
        soundClone.volume = 0.5;
        soundClone.play().catch((e) => {
          console.warn(`Failed to play cached sound ${soundName}:`, e);
        });
      } catch (e) {
        console.warn(`Error playing cached sound ${soundName}:`, e);
      }
    } else {
      console.warn(`Sound '${soundName}' not found in sound cache`);
    }
  };

  window.updateLastPlayerHealth = function (newHealth) {
    lastPlayerHealth = newHealth;
    console.log(`Updated last player health to: ${lastPlayerHealth}`);
  };
}

function preloadCoinSound() {
  try {
    const coinSound = new Audio(soundURLs.coin);
    coinSound.preload = "auto";

    coinSound.addEventListener(
      "canplaythrough",
      () => {
        console.log("Coin sound loaded successfully!");
        preloadedSounds.coin = coinSound;
      },
      { once: true }
    );

    coinSound.addEventListener("error", (e) => {
      console.warn("Error loading coin sound:", e);
    });

    coinSound.load();
  } catch (e) {
    console.error("Error preloading coin sound:", e);
  }
}

function initAudioContextOnInteraction() {
  window.gameAudioContext = null;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      console.log("AudioContext is supported, will initialize on interaction");

      const initContext = () => {
        if (!window.gameAudioContext) {
          try {
            console.log("Initializing AudioContext on user interaction");
            window.gameAudioContext = new AudioContextClass();

            const silentOscillator = window.gameAudioContext.createOscillator();
            const gain = window.gameAudioContext.createGain();
            gain.gain.value = 0.001;
            silentOscillator.connect(gain);
            gain.connect(window.gameAudioContext.destination);
            silentOscillator.start();
            silentOscillator.stop(window.gameAudioContext.currentTime + 0.001);

            console.log("AudioContext initialized successfully");

            setTimeout(() => {
              try {
                if (window.forceCoinSound) {
                  window.forceCoinSound();
                }
              } catch (e) {
                console.warn("Test sound after context init failed:", e);
              }
            }, 500);
          } catch (e) {
            console.error("Error initializing AudioContext:", e);
          }
        }
      };

      const interactionEvents = ["click", "touchstart", "keydown"];
      interactionEvents.forEach((eventType) => {
        document.addEventListener(eventType, initContext, { once: true });
      });

      console.log("Added AudioContext initialization listeners");
    }
  } catch (e) {
    console.warn("AudioContext initialization setup failed:", e);
  }
}

export function forceCoinSound() {
  console.log("FORCE COIN SOUND: Attempting with multiple methods");

  const attempts = [];

  const tryDirectMP3 = () => {
    try {
      console.log("Trying direct MP3 file playback for coin sound");
      const audio = new Audio("sounds/coin-recieved-230517.mp3");
      audio.volume = 1.0;

      console.log("Playing direct MP3 file: sounds/coin-recieved-230517.mp3");
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((e) => {
          console.warn("Direct MP3 playback failed:", e);
        });
      }
      return true;
    } catch (e) {
      console.warn("Direct MP3 approach failed:", e);
      return false;
    }
  };

  attempts.push(
    tryDirectMP3
  );

  for (let attempt of attempts) {
    if (attempt()) {
      console.log("Successfully played coin sound");
      return true;
    }
  }

  console.error("All coin sound playback methods failed");
  return false;
}

function playCoinSound() {
  console.log("Playing coin sound");

  if (window.forceCoinSound) {
    try {
      if (window.forceCoinSound()) {
        return;
      }
    } catch (e) {
      console.error("Force coin sound failed:", e);
    }
  }

  if (preloadedSounds.coin) {
    try {
      const coinClone = preloadedSounds.coin.cloneNode();
      coinClone.volume = 0.8;
      coinClone.play().catch((e) => {
        console.warn("Failed to play preloaded coin sound:", e);
        fallbackCoinSound();
      });
      return;
    } catch (e) {
      console.warn("Error playing preloaded coin sound:", e);
    }
  }

  fallbackCoinSound();
}

function fallbackCoinSound() {
  try {
    const coinSound = new Audio();
    coinSound.src = soundURLs.coin;
    coinSound.volume = 0.9;

    coinSound.play().catch((e) => {
      console.warn("Failed to play fallback coin sound:", e);
    });
  } catch (e) {
    console.error("Error with fallback coin sound:", e);
  }
}

export function toggleSound(enabled) {
  soundsEnabled = enabled;
  return soundsEnabled;
}

export function isSoundEnabled() {
  return soundsEnabled;
}

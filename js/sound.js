let soundsEnabled = true;

const soundCache = {};

const soundURLs = {
  coin: "sounds/coin.mp3",
  jump: "sounds/jump.mp3",
  hurt: "sounds/hurt.mp3",
  levelComplete: "sounds/level_complete.mp3",
  gameComplete: "sounds/game_complete.mp3",
  buttonHover: "sounds/button_hover.mp3",
  buttonClick: "sounds/button_click.mp3",
  hit: "sounds/hit.mp3",
  spikeToggle: "sounds/spike_toggle.mp3",
  spearFire: "sounds/spear_fire.mp3",
  thunder: "sounds/thunder.mp3",
};

const placeholderSounds = {
  jump: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAoAAAkIAAiIiIiIiIiNjY2NjY2NkpKSkpKSkpeXl5eXl5ecnJycnJycnJycnKGhoaGhoaGmpqampqamq6urq6urq7CwsLCwsLCwsLCwsLCwsLW1tbW1tbW6urq6urq6v////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAUaAAAAAAAAJCBE9jCVAAAAAAD/+xDEAAPAAAGkAAAAIAAANIAAAARkSmtJJJJJRXWkkkKdDpsTLEjjjjj8sf/LOEPVAxyVhE8BgD+C+H+D/4P4v//ygIAgCAIBAEAwf/BA/KAgCAIAgBAEAQBAEAQB8o",
  land: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAoAAAyMgAQEBAQEBAQHx8fHx8fHy8vLy8vLy8/Pz8/Pz8/Pz8/Pz8/Pz9OTk5OTk5OXl5eXl5eXm5ubm5ubm5+fn5+fn5+fn5+fn5+fn6Ojo6Ojo6Onp6enp6env///wAAAABMYXZjNTguMTMAAAAAAAAAAAAAAAAkBmMAAAAAAAAyMnmpBBYAAAAAAP/7EMQABMgABpAAAACAAANIAAAATq21tEQQpwowUjAchIgA4PiDeD+CHhEP/q3///QEBAIAgCAQBAQD//wfB8HwfB8HwfQBISP/+U63XmYBNEAt1uo72gAPCJ7rjxo61wdadQPGj/BBmkD1p1A9a",
  hit: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAoAAAyMgAQEBAQEBAQHx8fHx8fHy8vLy8vLy8/Pz8/Pz8/Pz8/Pz8/Pz9OTk5OTk5OXl5eXl5eXm5ubm5ubm5+fn5+fn5+fn5+fn5+fn6Ojo6Ojo6Onp6enp6env///wAAAABMYXZjNTguMTMAAAAAAAAAAAAAAAAkBmMAAAAAAAAyMnmpBBYAAAAAAP/7EMQABMgABpAAAACAAANIAAAATq21tEQQpwowUjAchIgA4PiDeD+CHhEP/q3///QEBAIAgCAQBAQD//wfB8HwfB8HwfQBISP/+U63XmYBNEAt1uo72gAPCJ7rjxo61wdadQPGj/BBmkD1p1A9a",
};

export function initSounds() {
  for (const soundName in placeholderSounds) {
    const sound = new Audio();
    sound.src = placeholderSounds[soundName];
    sound.preload = "auto";
    soundCache[soundName] = sound;
  }

  window.playSound = function (soundName) {
    if (soundsEnabled && soundCache[soundName]) {
      try {
        const soundClone = soundCache[soundName].cloneNode();
        soundClone.volume = 0.3;
        soundClone
          .play()
          .catch((e) => console.warn("Failed to play sound:", e));
      } catch (e) {
        console.warn("Error playing sound:", e);
      }
    }
  };
}

export function toggleSound(enabled) {
  soundsEnabled = enabled;
  return soundsEnabled;
}

export function isSoundEnabled() {
  return soundsEnabled;
}

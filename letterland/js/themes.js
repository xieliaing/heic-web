/* LetterLand — Visual Theme System (PRD 10.3, 16.x, 17.2).
 * Themes are a presentation layer ONLY. They change color, decoration, avatars,
 * completion effects and audio flavor. They never change words, difficulty,
 * mastery thresholds, hints, or correctness evaluation.
 */
(function () {
  WB.THEMES = {
    sparkle: {
      id: "sparkle",
      name: "Sparkle Garden",
      tagline: "Flowers, gems and magic",
      icon: "🌸",
      // CSS custom properties applied to <body data-theme>
      vars: {
        "--bg": "linear-gradient(160deg,#ffd9ec 0%,#e6d3ff 45%,#fff0d9 100%)",
        "--panel": "rgba(255,255,255,0.82)",
        "--ink": "#5a2a52",
        "--muted": "#9a6d92",
        "--primary": "#e85fa8",
        "--primary-ink": "#ffffff",
        "--accent": "#b06cff",
        "--key": "#ffffff",
        "--key-ink": "#5a2a52",
        "--key-border": "#f3b6d8",
        "--good": "#2fb872",
        "--bad": "#ff6f8b",
        "--ring": "#ffb3d9"
      },
      decor: ["🌸", "✨", "🌷", "💖", "🦋", "⭐", "💎", "🎀"],
      avatars: ["🧚", "👸", "🦄", "🐱", "🦋", "🌷"],
      companion: "🦄",
      completeEmoji: "🌟",
      complete: "A glowing star rises over the garden and releases sparkles!",
      chime: [523.25, 659.25, 783.99, 1046.5]
    },
    mechanical: {
      id: "mechanical",
      name: "Mechanical Lab",
      tagline: "Gears, robots and machines",
      icon: "⚙️",
      vars: {
        "--bg": "linear-gradient(160deg,#2b3a55 0%,#3d5170 50%,#1f2a3d 100%)",
        "--panel": "rgba(233,240,250,0.94)",
        "--ink": "#1f2a3d",
        "--muted": "#5b6b82",
        "--primary": "#ff8a3d",
        "--primary-ink": "#20140a",
        "--accent": "#3d8bff",
        "--key": "#eef3fb",
        "--key-ink": "#1f2a3d",
        "--key-border": "#9fb4d1",
        "--good": "#2fb872",
        "--bad": "#ff6f5b",
        "--ring": "#ffb27a"
      },
      decor: ["⚙️", "🔩", "🔧", "🤖", "🔋", "🛠️", "💡", "🔌"],
      avatars: ["🤖", "🚜", "👨‍🚀", "🦖", "🚀", "🛠️"],
      companion: "🤖",
      completeEmoji: "⚙️",
      complete: "Mechanical arms lock the piece in place with a satisfying clunk!",
      chime: [392, 523.25, 659.25, 784]
    },
    animal: {
      id: "animal",
      name: "Animal Adventure",
      tagline: "Forests, farms and friends",
      icon: "🐾",
      vars: {
        "--bg": "linear-gradient(160deg,#cdeeb0 0%,#a9e5d6 50%,#bfe3ff 100%)",
        "--panel": "rgba(255,255,255,0.9)",
        "--ink": "#2c4a2e",
        "--muted": "#5e7d5f",
        "--primary": "#3fae5a",
        "--primary-ink": "#ffffff",
        "--accent": "#f2a63d",
        "--key": "#ffffff",
        "--key-ink": "#2c4a2e",
        "--key-border": "#a9d6a0",
        "--good": "#2fb872",
        "--bad": "#ff7a5b",
        "--ring": "#b6e6a0"
      },
      decor: ["🌿", "🐾", "🍃", "🌳", "🐿️", "🦋", "🌼", "☁️"],
      avatars: ["🐱", "🐶", "🐻", "🦊", "🐧", "🦁"],
      companion: "🦊",
      completeEmoji: "🎉",
      complete: "Your animal friends cheer and hop across the meadow!",
      chime: [440, 554.37, 659.25, 880]
    },
    space: {
      id: "space",
      name: "Space Explorer",
      tagline: "Rockets, planets and stars",
      icon: "🚀",
      vars: {
        "--bg": "linear-gradient(160deg,#1b1145 0%,#2a1a63 50%,#0d0a2b 100%)",
        "--panel": "rgba(230,232,255,0.94)",
        "--ink": "#221a4d",
        "--muted": "#5c548a",
        "--primary": "#7c5cff",
        "--primary-ink": "#ffffff",
        "--accent": "#39d3ff",
        "--key": "#f0f0ff",
        "--key-ink": "#221a4d",
        "--key-border": "#b0a8e6",
        "--good": "#37d17a",
        "--bad": "#ff6f9b",
        "--ring": "#a99bff"
      },
      decor: ["⭐", "🚀", "🪐", "🛰️", "✨", "🌟", "🌌", "👽"],
      avatars: ["👨‍🚀", "👽", "🤖", "🚀", "🪐", "⭐"],
      companion: "👽",
      completeEmoji: "🚀",
      complete: "A rocket flies to the moon and plants the LetterLand flag!",
      chime: [329.63, 493.88, 659.25, 987.77]
    },
    neutral: {
      id: "neutral",
      name: "Calm Start",
      tagline: "A gentle default world",
      icon: "🌈",
      vars: {
        "--bg": "linear-gradient(160deg,#eef2f7 0%,#e3ecf5 100%)",
        "--panel": "rgba(255,255,255,0.92)",
        "--ink": "#2b3547",
        "--muted": "#6b7688",
        "--primary": "#4a7cf0",
        "--primary-ink": "#ffffff",
        "--accent": "#f0a04a",
        "--key": "#ffffff",
        "--key-ink": "#2b3547",
        "--key-border": "#c4d2e6",
        "--good": "#2fb872",
        "--bad": "#ff6f6f",
        "--ring": "#b9cdf0"
      },
      decor: ["🌈", "☁️", "⭐", "🌤️", "✨", "🍀"],
      avatars: ["🙂", "🐱", "🐶", "⭐", "🌈", "🦋"],
      companion: "🌈",
      completeEmoji: "🌈",
      complete: "Great job! A rainbow arcs across the sky.",
      chime: [523.25, 659.25, 783.99]
    }
  };

  WB.THEME_ORDER = ["sparkle", "mechanical", "animal", "space"];

  WB.applyTheme = function (themeId) {
    var t = WB.THEMES[themeId] || WB.THEMES.neutral;
    var root = document.body;
    root.setAttribute("data-theme", t.id);
    Object.keys(t.vars).forEach(function (k) {
      root.style.setProperty(k, t.vars[k]);
    });
    return t;
  };
})();

/* LetterLand — local, on-device storage (PRD: no account, data on-device).
 * Progress and settings persist in localStorage. No network is used.
 */
(function () {
  var KEY = "letterland.v1";

  var DEFAULTS = {
    setupDone: false,
    settings: {
      lang: null,             // interface language; null = detect on first run
      ageBand: "3-4",        // "2-3" | "3-4" | "4-5"
      sessionMinutes: 5,      // 3 | 5 | 8
      keyboard: "onscreen",   // "onscreen" | "external"
      theme: "neutral",
      availableThemes: ["sparkle", "mechanical", "animal", "space"],
      childCanSwitch: true,   // PRD 15.5 world selector
      decoration: "standard", // "simple" | "standard" | "extra"
      motion: "full",         // "full" | "reduced"
      sound: "full",          // "off" | "low" | "full"
      avatar: "🙂",
      interest: "any"         // vocabulary interest category filter
    },
    progress: {},             // wordId -> { mastery:0-5, seen, correct, wrong, last }
    stats: {
      totalStars: 0,
      sessions: 0,
      themeUsage: {},         // themeId -> sessions started
      lastSession: null
    }
  };

  function deepMerge(base, over) {
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (!over) return out;
    Object.keys(over).forEach(function (k) {
      if (over[k] && typeof over[k] === "object" && !Array.isArray(over[k]) && typeof base[k] === "object") {
        out[k] = deepMerge(base[k], over[k]);
      } else {
        out[k] = over[k];
      }
    });
    return out;
  }

  WB.storage = {
    load: function () {
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { saved = null; }
      return deepMerge(DEFAULTS, saved || {});
    },
    save: function (state) {
      try {
        localStorage.setItem(KEY, JSON.stringify({
          setupDone: state.setupDone,
          settings: state.settings,
          progress: state.progress,
          stats: state.stats
        }));
      } catch (e) { /* ignore quota */ }
    },
    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      return deepMerge(DEFAULTS, {});
    },
    defaults: DEFAULTS
  };
})();

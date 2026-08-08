/* LetterLand — Deterministic adaptive learning engine (PRD 33: local scheduler).
 *
 * Contract: identical curriculum for every theme. This module knows nothing
 * about visuals. It selects the next (word + mode), tracks mastery, and awards
 * stars. Same seed + same progress => same schedule (deterministic).
 *
 * Early modes, ages 2-5 (mapped to mastery so difficulty ramps per word):
 *   find    - "Find the Letter": tap a spoken single letter (easiest)
 *   first   - "First Letter": tap the first letter of a pictured word
 *   missing - "Missing Letter": fill the one blank in the word
 *   spell   - "Spell the Word": type the whole word, target shown on screen
 *
 * Explorer modes, ages 6-9 — the word is never shown while it is being
 * spelled, so the child recalls it instead of copying it:
 *   study      - first meeting: photo, word and meaning shown, child copies it
 *   spellblind - photo + spoken word only, spelled from memory
 *   clue       - meaning and a gapped sentence only, no picture (hardest)
 */
(function () {
  var MASTER_AT = 5;

  function prog(state, id) {
    if (!state.progress[id]) {
      state.progress[id] = { mastery: 0, seen: 0, correct: 0, wrong: 0, last: 0 };
    }
    return state.progress[id];
  }

  // The bank in play is decided by the age band alone.
  function bank(state) {
    return WB.bankFor(state.settings.ageBand);
  }

  // Words filtered by the parent's chosen vocabulary interest (never changes
  // difficulty or mastery — only which concrete words appear first).
  function pool(state) {
    var interest = state.settings.interest;
    var words = bank(state).words;
    if (interest && interest !== "any") {
      var filtered = words.filter(function (w) { return w.category === interest; });
      if (filtered.length >= 8) return filtered;
    }
    return words;
  }

  /* ------------------------------------------------------------------ *
   *  Progressive path
   *
   *  Previously every word in the bank competed for every turn, sorted by
   *  mastery and last-seen. With a mostly-unseen bank those keys are all
   *  equal, so the same handful of words won the sort session after session
   *  and the child met a tiny slice of the vocabulary over and over.
   *
   *  Instead the pool is cut into fixed levels. A child works inside one
   *  level, meets its words, and moves on when most of them are known. New
   *  words arrive every session; old levels come back only as review.
   * ------------------------------------------------------------------ */
  var LEVEL_SIZE = 20;      // words per level, for display and pacing
  var NEW_EVERY = 2;        // 1 in every NEW_EVERY turns revises instead

  // The curriculum order: easiest first, dealt round-robin across categories
  // so a level is a varied mix rather than twenty animals in a row.
  function orderedFor(words) {
    if (words._ordered) return words._ordered;

    var byCat = {};
    words.forEach(function (w) { (byCat[w.category] = byCat[w.category] || []).push(w); });
    Object.keys(byCat).forEach(function (c) {
      byCat[c].sort(function (a, b) {
        return a.difficulty - b.difficulty || a.word.length - b.word.length
            || (a.word < b.word ? -1 : 1);
      });
    });

    var cats = Object.keys(byCat).sort();
    var ordered = [], remaining = true;
    while (remaining) {
      remaining = false;
      for (var i = 0; i < cats.length; i++) {
        var list = byCat[cats[i]];
        if (list.length) { ordered.push(list.shift()); remaining = true; }
      }
    }

    try {
      Object.defineProperty(words, "_ordered", { value: ordered, enumerable: false });
    } catch (e) { /* frozen array: recompute next time */ }
    return ordered;
  }

  function introducedCount(state, ordered) {
    var n = 0;
    for (var i = 0; i < ordered.length; i++) {
      if (prog(state, ordered[i].id).seen > 0) n += 1;
    }
    return n;
  }

  // Least-known first, then least-recently-seen, then a stable order.
  function weakestFirst(state, list) {
    return list.slice().sort(function (a, b) {
      var pa = prog(state, a.id), pb = prog(state, b.id);
      if (pa.mastery !== pb.mastery) return pa.mastery - pb.mastery;
      if (pa.last !== pb.last) return pa.last - pb.last;
      return a.difficulty - b.difficulty;
    });
  }

  var Engine = {
    LEVEL_SIZE: LEVEL_SIZE,

    ordered: function (state) { return orderedFor(pool(state)); },

    levelSummary: function (state) {
      var ordered = orderedFor(pool(state));
      var introduced = introducedCount(state, ordered);
      var mastered = 0;
      ordered.forEach(function (w) {
        if (prog(state, w.id).mastery >= MASTER_AT) mastered += 1;
      });
      var total = Math.max(1, Math.ceil(ordered.length / LEVEL_SIZE));
      return {
        // Once every word has been introduced the pointer would run past the
        // last level, so hold it at the end rather than showing "6 of 5".
        number: Math.min(total, Math.floor(introduced / LEVEL_SIZE) + 1),
        total: total,
        withinLevel: introduced % LEVEL_SIZE,
        size: LEVEL_SIZE,
        introduced: introduced,
        mastered: mastered
      };
    },

    /* Pick the next word.
     *
     * Two rules do the work:
     *
     *  - A word already used in this session is never offered again, so a
     *    sitting cannot repeat itself.
     *  - New vocabulary is introduced at a steady rate rather than being
     *    gated behind mastering what came before. Roughly every other turn
     *    takes the next unseen word in curriculum order; the turns between
     *    revise the weakest word already in progress.
     *
     * The earlier design only unlocked new words once 75% of a level was
     * mastered, which meant a child could spend ten sessions on the same two
     * dozen words — the very thing being complained about.
     */
    nextWord: function (state, sessionSeen) {
      var ordered = orderedFor(pool(state));
      var seen = sessionSeen || {};
      var count = state._sessionCount || 0;
      var wantReview = (count % NEW_EVERY) === 1;

      var fresh = [], review = [];
      for (var i = 0; i < ordered.length; i++) {
        var w = ordered[i];
        if (seen[w.id]) continue;
        var p = prog(state, w.id);
        if (p.seen === 0) fresh.push(w);
        else if (p.mastery < MASTER_AT) review.push(w);
      }

      if (wantReview && review.length) return weakestFirst(state, review)[0];
      if (fresh.length) return fresh[0];              // next in curriculum order
      if (review.length) return weakestFirst(state, review)[0];

      // Everything is either mastered or already used this session: fall back
      // to the least recently practised word not yet used.
      var rest = ordered.filter(function (x) { return !seen[x.id]; });
      if (rest.length) return weakestFirst(state, rest)[0];
      return weakestFirst(state, ordered)[0];
    },

    modeFor: function (state, word) {
      var p = prog(state, word.id);

      // Explorer (6-9): meet the word once with everything visible, then spell
      // it from the picture alone, then from the meaning alone.
      if (WB.bankIdFor(state.settings.ageBand) === "explorer") {
        if (p.mastery === 0 && p.seen === 0) return "study";
        if (p.mastery <= 2) return "spellblind";
        return "clue";
      }

      // Early (2-5): the app reads the whole word and the child spells it
      // letter by letter. Toddlers (2-3) get a gentle recognition ramp first.
      if (state.settings.ageBand === "2-3") {
        if (p.mastery <= 1) return "find";     // tap a single spoken letter
        if (p.mastery <= 3) return "missing";  // fill one blank
        return "spell";                        // full word
      }
      return "spell";
    },

    // Explorer modes let the child type freely (wrong letters land in the
    // slots and can be erased), which is real spelling practice rather than
    // a keyboard that only accepts the correct next key.
    isFreeTyping: function (mode) {
      return mode === "study" || mode === "spellblind" || mode === "clue";
    },

    // Build a concrete question object for the UI.
    buildQuestion: function (state, word, mode) {
      var q = { word: word, mode: mode };
      if (mode === "find") {
        q.target = word.first_letter;
        q.prompt = "Find the letter " + word.first_letter;
        q.options = distractors(word.first_letter, 5);
      } else if (mode === "first") {
        q.target = word.first_letter;
        q.prompt = "What letter does " + word.word + " start with?";
        q.options = distractors(word.first_letter, 5);
      } else if (mode === "missing") {
        // Hide one interior/least-obvious position (not always the first).
        var pos = word.word.length <= 3 ? 1 : (word.word.length % (word.word.length - 1)) + 1;
        if (pos >= word.word.length) pos = word.word.length - 1;
        q.blankPos = pos;
        q.target = word.word[pos];
        q.masked = word.word.split("").map(function (c, i) { return i === pos ? "_" : c; }).join("");
        q.prompt = "Which letter is missing?";
        q.options = distractors(q.target, 5);
      } else if (mode === "study") {
        q.target = word.word;
        q.typed = "";
        q.showWord = true;   // the word stays on screen — this is the introduction
        q.showImage = true;
        q.showMeaning = true;
        q.prompt = "A new word: " + word.word;
      } else if (mode === "spellblind") {
        q.target = word.word;
        q.typed = "";
        q.showWord = false;  // spelled from memory
        q.showImage = true;
        q.showMeaning = false;
        q.prompt = "Spell what you see";
      } else if (mode === "clue") {
        q.target = word.word;
        q.typed = "";
        q.showWord = false;
        q.showImage = false; // meaning only — the hardest step
        q.showMeaning = true;
        q.prompt = "Spell the word that fits";
      } else { // spell
        q.target = word.word;
        q.typed = "";
        q.prompt = "Spell " + word.word;
      }
      return q;
    },

    // Record a completed word (word-level, after success).
    recordResult: function (state, word, gotWrong) {
      var p = prog(state, word.id);
      p.seen += 1;
      p.last = Date.now();
      if (gotWrong) {
        p.wrong += 1;
        p.mastery = Math.max(0, p.mastery - 1);
      } else {
        p.correct += 1;
        p.mastery = Math.min(MASTER_AT, p.mastery + 1);
      }
      state._lastWordId = word.id;
      return p;
    },

    isMastered: function (state, id) { return prog(state, id).mastery >= MASTER_AT; },

    summary: function (state) {
      var words = bank(state).words, mastered = 0, started = 0, mSum = 0;
      words.forEach(function (w) {
        var p = state.progress[w.id];
        if (p) { started += 1; mSum += p.mastery; if (p.mastery >= MASTER_AT) mastered += 1; }
      });
      return {
        total: words.length,
        started: started,
        mastered: mastered,
        avgMastery: started ? (mSum / started) : 0,
        percent: Math.round((mastered / words.length) * 100)
      };
    }
  };

  // Deterministic-ish distractor letters: near the target in the alphabet,
  // always including the target, shuffled by a stable order.
  function distractors(target, count) {
    var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var set = [target];
    var ti = A.indexOf(target);
    var offsets = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5];
    for (var i = 0; i < offsets.length && set.length < count; i++) {
      var idx = (ti + offsets[i] + 26) % 26;
      var ch = A[idx];
      if (set.indexOf(ch) === -1) set.push(ch);
    }
    // Stable shuffle keyed by target char code so layout is consistent per word.
    var seed = target.charCodeAt(0);
    return set.sort(function (a, b) {
      return ((a.charCodeAt(0) * 31 + seed) % 97) - ((b.charCodeAt(0) * 31 + seed) % 97);
    });
  }

  WB.engine = Engine;
})();

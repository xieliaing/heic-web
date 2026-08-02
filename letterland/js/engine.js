/* LetterLand — Deterministic adaptive learning engine (PRD 33: local scheduler).
 *
 * Contract: identical curriculum for every theme. This module knows nothing
 * about visuals. It selects the next (word + mode), tracks mastery, and awards
 * stars. Same seed + same progress => same schedule (deterministic).
 *
 * Four learning modes (mapped to mastery so difficulty ramps per word):
 *   find    - "Find the Letter": tap a spoken single letter (easiest)
 *   first   - "First Letter": tap the first letter of a pictured word
 *   missing - "Missing Letter": fill the one blank in the word
 *   spell   - "Spell the Word": type the whole word in order (hardest)
 */
(function () {
  var MASTER_AT = 5;

  function prog(state, id) {
    if (!state.progress[id]) {
      state.progress[id] = { mastery: 0, seen: 0, correct: 0, wrong: 0, last: 0 };
    }
    return state.progress[id];
  }

  // Words filtered by the parent's chosen vocabulary interest (never changes
  // difficulty or mastery — only which concrete words appear first).
  function pool(state) {
    var interest = state.settings.interest;
    var words = WB.WORDS;
    if (interest && interest !== "any") {
      var filtered = words.filter(function (w) { return w.category === interest; });
      if (filtered.length >= 8) return filtered;
    }
    return words;
  }

  var Engine = {
    // Pick the next word deterministically: least-mastered, least-recently-seen.
    nextWord: function (state) {
      var words = pool(state).slice();
      words.sort(function (a, b) {
        var pa = prog(state, a.id), pb = prog(state, b.id);
        if (pa.mastery !== pb.mastery) return pa.mastery - pb.mastery;   // weakest first
        if (pa.last !== pb.last) return pa.last - pb.last;               // oldest first
        return a.difficulty - b.difficulty;                             // easier first
      });
      // Prefer a word not equal to the immediately previous one.
      var w = words[0];
      if (w && state._lastWordId === w.id && words[1]) w = words[1];
      return w;
    },

    modeFor: function (state, word) {
      var p = prog(state, word.id);
      // Main experience: the app reads the whole word and the child spells it
      // letter by letter. Toddlers (2-3) get a gentle recognition ramp first.
      if (state.settings.ageBand === "2-3") {
        if (p.mastery <= 1) return "find";     // tap a single spoken letter
        if (p.mastery <= 3) return "missing";  // fill one blank
        return "spell";                        // full word
      }
      return "spell";
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
      var words = WB.WORDS, mastered = 0, started = 0, mSum = 0;
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

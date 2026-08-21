/* LetterLand — word bank registry.
 *
 * Two banks share one engine and one set of themes:
 *
 *   early    ages 2-5  100 words, picture + letter recognition, no reading
 *   explorer ages 6-9  large curriculum bank with definitions and cloze
 *                      sentences, spelled from memory rather than copied
 *
 * Both are built here by the same code so the engine never has to care which
 * bank it is looking at. Ids are prefixed per bank ("w1", "e1") so a child who
 * graduates from Early to Explorer keeps their old progress untouched.
 */
(function () {
  /* Word pictures.
   *
   * Photographs are parked: sourcing one good, safe, unambiguous picture for
   * every word is a job that needs human review, and the emoji already in the
   * bank are clear and consistent. Flip this to true once a reviewed image set
   * exists — tools/fetch-images.mjs and the <img> rendering both still work.
   */
  WB.USE_PHOTOS = false;

  // Early words are short, so length maps straight onto difficulty 1-3.
  function earlyDifficulty(w) {
    return w.length <= 3 ? 1 : w.length === 4 ? 2 : 3;
  }

  // Explorer words run 3-13 letters, so they get a fourth band for the
  // genuinely long ones (CONSTELLATION, VETERINARIAN).
  function explorerDifficulty(w) {
    if (w.length <= 4) return 1;
    if (w.length <= 6) return 2;
    if (w.length <= 8) return 3;
    return 4;
  }

  function build(raw, prefix, difficultyFn, withClues) {
    return raw.map(function (r, i) {
      var word = r[0];
      var entry = {
        id: prefix + (i + 1),
        word: word,
        display_word: word,
        emoji: r[1],
        category: r[2],
        difficulty: difficultyFn(word),
        first_letter: word[0]
      };
      if (withClues) {
        entry.definition = r[3];
        entry.sentence = r[4];
        // Photographs are off for now (see WB.USE_PHOTOS below): every word
        // shows its emoji. The <img> path and the sourcing pipeline in tools/
        // are kept intact so photos can be switched back on later.
        if (WB.USE_PHOTOS) entry.image = "img/" + word.toLowerCase() + ".webp";
      }
      return entry;
    });
  }

  // The Explorer bank is authored in numbered batches so it can grow without
  // one unreviewable file. Order is fixed (batch 1, then 2, ...) so word ids
  // stay stable as later batches are added — a child's saved progress must
  // keep pointing at the same words.
  function explorerRows() {
    var rows = [];
    for (var i = 0; i < 40; i++) {
      var key = i === 0 ? "RAW_EXPLORER" : "RAW_EXPLORER_" + (i + 1);
      if (WB[key]) rows = rows.concat(WB[key]);
    }
    return rows;
  }

  /* Interest categories.
   *
   * The emoji and the ids are fixed; only the label is interface text, so it
   * comes from js/i18n.js. The list is rebuilt on every read (via the getter
   * installed below) so switching the app language updates it immediately.
   * Note the two banks reuse ids like "animals" with different wording, hence
   * the per-bank key prefix.
   */
  var CATEGORY_EMOJI = {
    early: [
      ["any", "🌈"], ["animals", "🐾"], ["food", "🍎"], ["nature", "🌳"],
      ["vehicles", "🚗"], ["home", "🏠"], ["body", "👋"], ["space", "🚀"]
    ],
    explorer: [
      ["any", "🌈"], ["animals", "🐾"], ["nature", "🌳"], ["weather", "🌦️"],
      ["space", "🚀"], ["places", "🗺️"], ["science", "🔬"], ["body", "🫀"],
      ["food", "🍎"], ["school", "📚"], ["sports", "⚽"], ["art", "🎨"],
      ["jobs", "👩‍🚒"], ["transport", "✈️"], ["home", "🏠"], ["clothes", "👕"],
      ["history", "🏰"], ["money", "💰"], ["community", "🚸"], ["tech", "💻"],
      ["myths", "🐉"]
    ]
  };

  WB.BANKS = {
    early: {
      id: "early",
      words: build(WB.RAW_EARLY, "w", earlyDifficulty, false)
    },
    explorer: {
      id: "explorer",
      words: build(explorerRows(), "e", explorerDifficulty, true)
    }
  };

  Object.keys(WB.BANKS).forEach(function (id) {
    Object.defineProperty(WB.BANKS[id], "label", {
      enumerable: true,
      get: function () { return WB.t("bank." + id); }
    });
    Object.defineProperty(WB.BANKS[id], "categories", {
      enumerable: true,
      get: function () {
        return CATEGORY_EMOJI[id].map(function (c) {
          return [c[0], c[1] + " " + WB.t("cat." + id + "." + c[0])];
        });
      }
    });
  });

  // Age bands 6-7 and up read and spell from memory; younger bands do not.
  WB.EXPLORER_BANDS = ["6-7", "7-8", "8-9"];

  WB.bankIdFor = function (ageBand) {
    return WB.EXPLORER_BANDS.indexOf(ageBand) !== -1 ? "explorer" : "early";
  };

  WB.bankFor = function (ageBand) {
    return WB.BANKS[WB.bankIdFor(ageBand)];
  };

  // Back-compat for any caller that still expects a flat list.
  WB.WORDS = WB.BANKS.early.words;
})();

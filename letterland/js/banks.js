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
        // Photograph sourced by tools/fetch-images.mjs; the emoji stands in
        // until (or unless) a freely licensed picture exists for this word.
        entry.image = "img/" + word.toLowerCase() + ".webp";
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

  WB.BANKS = {
    early: {
      id: "early",
      label: "Little Learners",
      words: build(WB.RAW_EARLY, "w", earlyDifficulty, false),
      categories: [
        ["any", "🌈 A little of everything"], ["animals", "🐾 Animals"],
        ["food", "🍎 Food"], ["nature", "🌳 Nature"], ["vehicles", "🚗 Vehicles"],
        ["home", "🏠 Home things"], ["body", "👋 My body"], ["space", "🚀 Space & treasure"]
      ]
    },
    explorer: {
      id: "explorer",
      label: "Word Explorers",
      words: build(explorerRows(), "e", explorerDifficulty, true),
      categories: [
        ["any", "🌈 A little of everything"], ["animals", "🐾 Animals"],
        ["nature", "🌳 Nature & landscapes"], ["weather", "🌦️ Weather & seasons"],
        ["space", "🚀 Space"], ["places", "🗺️ Places & geography"],
        ["science", "🔬 Science & machines"], ["body", "🫀 Body & health"],
        ["food", "🍎 Food & cooking"], ["school", "📚 School & language"],
        ["sports", "⚽ Sports & games"], ["art", "🎨 Music & art"],
        ["jobs", "👩‍🚒 Jobs & people"], ["transport", "✈️ Transport & travel"],
        ["home", "🏠 Home & tools"], ["clothes", "👕 Clothes"],
        ["history", "🏰 History & the world"], ["feelings", "😊 Feelings & character"],
        ["actions", "🏃 Action words"], ["describing", "🔤 Describing words"],
        ["maths", "🔢 Maths & measuring"], ["money", "💰 Money & shopping"],
        ["time", "📅 Time & the calendar"], ["community", "🚸 Community & safety"],
        ["tech", "💻 Technology"], ["myths", "🐉 Stories & myths"]
      ]
    }
  };

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

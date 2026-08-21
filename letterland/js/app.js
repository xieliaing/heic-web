/* LetterLand — application shell, screen router and activity UI. */
(function () {
  // On-screen keyboard uses the QWERTY layout so muscle memory carries over
  // to a real external keyboard.
  var QWERTY = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  var AGE_BANDS = [
    ["2-3", "2–3"], ["3-4", "3–4"], ["4-5", "4–5"],
    ["6-7", "6–7"], ["7-8", "7–8"], ["8-9", "8–9"]
  ];

  // Interface strings come from js/i18n.js. The vocabulary never does: the
  // words, letters and definitions the child works with are always English.
  var T = function (key, vars) { return WB.t(key, vars); };

  function minuteOpts() {
    return [3, 5, 8].map(function (n) { return [n, T("opt.min", { n: n })]; });
  }
  function soundOpts() {
    return [["full", T("opt.soundFull")], ["low", T("opt.soundLow")], ["off", T("opt.soundOff")]];
  }

  // Interest categories belong to the bank in play, so the list changes when
  // the parent moves the child between the Early and Explorer age bands.
  function categories() {
    return WB.bankFor(WB.state.settings.ageBand).categories;
  }

  // An interest chosen in one bank may not exist in the other; fall back to
  // "any" instead of silently leaving an unreachable filter set.
  function reconcileInterest() {
    var s = WB.state.settings;
    var ok = categories().some(function (c) { return c[0] === s.interest; });
    if (!ok) s.interest = "any";
  }

  // ---- tiny DOM helper ---------------------------------------------------
  function el(tag, props, kids) {
    var n = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === "class") n.className = props[k];
      else if (k === "html") n.innerHTML = props[k];
      else if (k === "text") n.textContent = props[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2).toLowerCase(), props[k]);
      else if (k === "style") n.setAttribute("style", props[k]);
      else n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }
  function root() { return document.getElementById("app"); }
  function clear() { redraw = null; root().innerHTML = ""; }
  function save() { WB.storage.save(WB.state); }

  // ---- background decoration (PRD 16.4 decoration intensity) -------------
  function renderDecor() {
    var layer = document.getElementById("decor");
    layer.innerHTML = "";
    var s = WB.state.settings;
    if (s.motion === "reduced" && s.decoration !== "extra") { return; }
    var counts = { simple: 4, standard: 10, extra: 22 };
    var n = counts[s.decoration] || 10;
    var t = WB.THEMES[s.theme] || WB.THEMES.neutral;
    for (var i = 0; i < n; i++) {
      var e = t.decor[i % t.decor.length];
      var d = el("span", { class: "decor-item" + (s.motion === "reduced" ? " static" : "") , text: e });
      d.style.left = (Math.random() * 96) + "%";
      d.style.top = (Math.random() * 92) + "%";
      d.style.fontSize = (1.4 + Math.random() * 2.4) + "rem";
      d.style.animationDelay = (Math.random() * 8) + "s";
      d.style.animationDuration = (7 + Math.random() * 8) + "s";
      d.style.opacity = s.decoration === "simple" ? 0.35 : 0.6;
      layer.appendChild(d);
    }
  }

  function applyGlobal() {
    var s = WB.state.settings;
    WB.applyTheme(s.theme);
    document.body.classList.toggle("reduced", s.motion === "reduced");
    document.body.setAttribute("data-decor", s.decoration);
    renderDecor();
  }

  // =======================================================================
  //  SCREEN: Parent setup (PRD 15.1)
  // =======================================================================
  function screenSetup() {
    clear();
    redraw = screenSetup;
    var s = WB.state.settings;
    function chips(label, key, opts, note) {
      return el("div", { class: "field" }, [
        el("div", { class: "field-label", text: label }),
        note ? el("div", { class: "field-note", text: note }) : null,
        el("div", { class: "chips" }, opts.map(function (o) {
          return el("button", {
            class: "chip" + (s[key] === o[0] ? " on" : ""),
            onClick: function () {
              s[key] = o[0];
              if (key === "ageBand") reconcileInterest();
              screenSetup();
            }
          }, [o[1]]);
        }))
      ]);
    }
    var bank = WB.bankFor(s.ageBand);

    var card = el("div", { class: "panel setup" }, [
      el("div", { class: "brand" }, ["🌸 ", el("b", { text: "LetterLand" }), el("span", { class: "brand-sub", text: T("brand.setup") })]),
      el("p", { class: "lead", text: T("setup.lead") }),
      langField(T("setup.english")),
      chips(T("field.age"), "ageBand", AGE_BANDS,
        T("setup.ageNote", { n: WB.BANKS.explorer.words.length })),
      el("div", { class: "bank-badge" }, [
        el("b", { text: bank.label }),
        el("span", { text: " · " + T("badge.words", { n: bank.words.length }) })
      ]),
      chips(T("field.session"), "sessionMinutes", minuteOpts()),
      chips(T("field.keyboard"), "keyboard", [["onscreen", T("opt.onscreen")], ["external", T("opt.external")]]),
      chips(T("field.interest"), "interest", categories()),
      chips(T("field.motion"), "motion", [["full", T("opt.motionFull")], ["reduced", T("opt.motionReduced")]]),
      chips(T("field.sound"), "sound", soundOpts()),
      chips(T("field.decoration"), "decoration",
        [["simple", T("opt.decorSimple")], ["standard", T("opt.decorStandard")], ["extra", T("opt.decorExtra")]]),
      el("button", {
        class: "btn-primary big", onClick: function () {
          applyGlobal(); goWorldSelect(true);
        }
      }, [T("btn.continue")])
    ]);
    root().appendChild(card);
    applyGlobal();
  }

  // Language picker, shared by the setup screen and the parent dashboard.
  // Switching redraws whichever screen is showing so every label updates at
  // once, and re-picks the speech voice for spoken instructions.
  function langField(note) {
    return el("div", { class: "field" }, [
      el("div", { class: "field-label", text: T("field.language") }),
      note ? el("div", { class: "field-note", text: note }) : null,
      el("div", { class: "chips" }, WB.LANGS.map(function (o) {
        return el("button", {
          class: "chip" + (WB.lang === o[0] ? " on" : ""),
          lang: o[0],
          onClick: function () { switchLang(o[0]); }
        }, [o[1]]);
      }))
    ]);
  }

  function switchLang(code) {
    WB.state.settings.lang = WB.setLang(code);
    WB.audio.refreshVoices();
    save();
    if (redraw) redraw();
  }

  // The redraw hook for the screen currently on show, set by each screen that
  // contains a language picker.
  var redraw = null;

  // =======================================================================
  //  SCREEN: World / theme selection with preview (PRD 15.1 / 15.5)
  // =======================================================================
  function goWorldSelect(fromSetup) {
    clear();
    var chosen = WB.state.settings.theme;
    var grid = el("div", { class: "world-grid" });

    WB.THEME_ORDER.forEach(function (id) {
      var t = WB.THEMES[id];
      if (WB.state.settings.availableThemes.indexOf(id) === -1) return;
      var card = el("button", {
        class: "world-card" + (chosen === id ? " on" : ""),
        "data-t": id,
        onClick: function () {
          chosen = id;
          WB.state.settings.theme = id;
          applyGlobal();
          WB.audio.say(t.name);
          WB.audio.celebrate();
          Array.prototype.forEach.call(grid.children, function (c) {
            c.classList.toggle("on", c.getAttribute("data-t") === id);
          });
          renderPreview(t);
        }
      }, [
        el("div", { class: "world-emoji", text: t.icon }),
        el("div", { class: "world-name", text: t.name }),
        el("div", { class: "world-tag", text: t.tagline })
      ]);
      // theme-colored preview swatch
      card.style.background = t.vars["--bg"];
      grid.appendChild(card);
    });

    var preview = el("div", { class: "preview panel", id: "preview" });

    var wrap = el("div", { class: "world-screen" }, [
      el("h1", { class: "big-q", text: T("world.q") }),
      grid,
      preview,
      el("div", { class: "row-center" }, [
        el("button", {
          class: "btn-primary big", onClick: function () { goAvatar(fromSetup); }
        }, [T("world.play")])
      ])
    ]);
    root().appendChild(wrap);
    renderPreview(WB.THEMES[chosen] || WB.THEMES[WB.THEME_ORDER[0]]);
    if (!WB.THEMES[chosen] || chosen === "neutral") {
      WB.state.settings.theme = WB.THEME_ORDER[0];
    }
    applyGlobal();
  }

  function renderPreview(t) {
    var p = document.getElementById("preview");
    if (!p) return;
    p.innerHTML = "";
    var sampleWord = WB.WORDS.find(function (w) { return w.word === "STAR"; }) || WB.WORDS[0];
    p.appendChild(el("div", { class: "preview-head", text: T("preview.head", { name: t.name }) }));
    p.appendChild(el("div", { class: "preview-body" }, [
      el("div", { class: "preview-avatars" }, t.avatars.slice(0, 6).map(function (a) {
        return el("span", { class: "prev-av", text: a });
      })),
      el("div", { class: "preview-anim" }, [
        el("span", { class: "prev-obj bob", text: sampleWord.emoji }),
        el("span", { class: "prev-obj", text: t.completeEmoji })
      ]),
      el("div", { class: "preview-note", text: t.complete })
    ]));
    var btns = el("div", { class: "preview-btns" }, [
      el("button", { class: "btn-ghost", onClick: function () { WB.audio.speakWord(sampleWord.word); WB.audio.tap(); } }, [T("preview.hearWord")]),
      el("button", { class: "btn-ghost", onClick: function () { WB.audio.celebrate(); } }, [T("preview.hearReward")])
    ]);
    p.appendChild(btns);
  }

  // =======================================================================
  //  SCREEN: Avatar select
  // =======================================================================
  function goAvatar(fromSetup) {
    clear();
    var t = WB.THEMES[WB.state.settings.theme];
    var chosen = WB.state.settings.avatar;
    var grid = el("div", { class: "avatar-grid" }, t.avatars.map(function (a) {
      return el("button", {
        class: "avatar-cell" + (chosen === a ? " on" : ""),
        onClick: function () {
          chosen = a; WB.state.settings.avatar = a; WB.audio.tap();
          Array.prototype.forEach.call(grid.children, function (c) { c.classList.remove("on"); });
          this.classList.add("on");
        }
      }, [a]);
    }));
    root().appendChild(el("div", { class: "world-screen" }, [
      el("h1", { class: "big-q", text: T("avatar.q") }),
      grid,
      el("div", { class: "row-center" }, [
        el("button", {
          class: "btn-primary big", onClick: function () {
            WB.state.settings.avatar = chosen;
            WB.state.setupDone = true;
            if (fromSetup) recordThemeUse();
            save(); goHome();
          }
        }, [T("avatar.go")])
      ])
    ]));
    applyGlobal();
  }

  function recordThemeUse() {
    var id = WB.state.settings.theme;
    WB.state.stats.themeUsage[id] = (WB.state.stats.themeUsage[id] || 0) + 1;
  }

  // =======================================================================
  //  SCREEN: Child home
  // =======================================================================
  function goHome() {
    clear();
    var s = WB.state.settings;
    var t = WB.THEMES[s.theme];
    var lvl = WB.engine.levelSummary(WB.state);

    var top = el("div", { class: "home-top" }, [
      el("button", { class: "icon-btn small", title: T("home.parent"), onClick: goParentGate }, ["⚙️"]),
      el("div", { class: "star-count", text: "⭐ " + WB.state.stats.totalStars })
    ]);

    var buttons = el("div", { class: "home-buttons" }, [
      el("button", { class: "play-btn", onClick: startSession }, [
        el("div", { class: "play-icon", text: "▶" }),
        el("div", { text: T("home.play") })
      ])
    ]);
    if (s.childCanSwitch) {
      buttons.appendChild(el("button", {
        class: "world-btn", onClick: function () { goWorldSelect(false); }
      }, [el("div", { class: "play-icon", text: t.icon }), el("div", { text: T("home.world") })]));
    }

    root().appendChild(el("div", { class: "home" }, [
      top,
      el("div", { class: "home-hero" }, [
        el("div", { class: "avatar-big", text: s.avatar }),
        el("div", { class: "companion", text: t.companion }),
        el("h1", { class: "home-title", text: "LetterLand" }),
        el("div", { class: "home-sub", text: t.name })
      ]),
      buttons,
      el("div", { class: "home-progress" }, [
        // Progress within the current level, not across the whole bank: a bar
        // that creeps from 0.1% to 0.2% tells a child nothing.
        el("div", { class: "bar" }, [el("div", {
          class: "bar-fill",
          style: "width:" + Math.round(lvl.withinLevel / lvl.size * 100) + "%"
        })]),
        el("div", { class: "home-progress-label",
          text: T("home.level", { n: lvl.number, a: lvl.withinLevel, b: lvl.size }) })
      ])
    ]));
    applyGlobal();
  }

  // =======================================================================
  //  SESSION / ACTIVITY
  // =======================================================================
  var session = null;

  function startSession() {
    recordThemeUse();
    WB.state.stats.sessions += 1;
    session = {
      endAt: Date.now() + WB.state.settings.sessionMinutes * 60 * 1000,
      stars: 0, words: 0, done: false,
      seen: {}   // ids used this session — never shown twice in one sitting
    };
    WB.state._sessionCount = 0;
    save();
    nextActivity();
  }

  function timeLeft() { return Math.max(0, session.endAt - Date.now()); }

  function nextActivity() {
    if (!session || session.done) return;
    if (timeLeft() <= 0 && session.words > 0) return endSession();
    var word = WB.engine.nextWord(WB.state, session.seen);
    if (!word) return endSession();
    session.seen[word.id] = true;
    WB.state._sessionCount = (WB.state._sessionCount || 0) + 1;
    var mode = WB.engine.modeFor(WB.state, word);
    var q = WB.engine.buildQuestion(WB.state, word, mode);
    q.attempts = 0;
    q.wrongThisWord = false;
    renderActivity(q);
  }

  function renderActivity(q) {
    clear();
    var s = WB.state.settings;

    // Top bar: exit + timer + stars (consistent placement, PRD 16.1)
    var bar = el("div", { class: "act-top" }, [
      el("button", { class: "icon-btn small", title: T("act.home"), onClick: function () { session.done = true; save(); goHome(); } }, ["🏠"]),
      el("div", { class: "timer", id: "timer" }),
      el("div", { class: "star-count", text: "⭐ " + session.stars })
    ]);

    // Learning zone (solid panel so decoration never overlaps letters)
    var zone = el("div", { class: "learn-zone" });
    zone.appendChild(el("div", { class: "mode-tag", text: modeLabel(q.mode) }));

    if (WB.engine.isFreeTyping(q.mode)) {
      if (q.showImage) zone.appendChild(wordPicture(q.word));
      if (q.showMeaning) zone.appendChild(renderMeaning(q));
      zone.appendChild(renderSlots(q));
    } else {
      zone.appendChild(el("div", { class: "obj-emoji", text: q.word.emoji }));
      if (q.mode === "spell" || q.mode === "missing") {
        zone.appendChild(renderSlots(q));
      } else {
        zone.appendChild(el("div", { class: "big-letter-target", id: "target",
          text: (q.mode === "find") ? q.target : "?" }));
      }
    }
    zone.appendChild(renderPrompt(q));

    var tools = el("div", { class: "act-tools" }, [
      el("button", { class: "tool-btn", onClick: function () { speakQuestion(q); } }, [T("tool.listen")]),
      el("button", { class: "tool-btn", onClick: function () { hint(q); } }, [T("tool.hint")])
    ]);

    var kb = renderKeyboard(q);

    root().appendChild(el("div", { class: "activity" }, [bar, zone, tools, kb]));
    applyGlobal();
    updateTimer();
    speakQuestion(q);
    WB.state._activeQ = q;
  }

  function modeLabel(m) { return T("mode." + m); }

  // A real photograph where one has been sourced, falling back to the emoji.
  // The <img> is removed on error so a missing file never shows a broken icon.
  function wordPicture(word) {
    var box = el("div", { class: "obj-photo" });
    var fallback = el("div", { class: "obj-emoji", text: word.emoji });
    if (!word.image) { box.appendChild(fallback); return box; }
    var img = el("img", {
      class: "photo", src: word.image, alt: "", loading: "eager", decoding: "async"
    });
    img.addEventListener("error", function () {
      img.remove();
      if (!box.querySelector(".obj-emoji")) box.appendChild(fallback);
    });
    box.appendChild(img);
    return box;
  }

  // Definition, and the cloze sentence with the answer blanked out.
  function renderMeaning(q) {
    var wrap = el("div", { class: "meaning" });
    if (q.word.definition) {
      wrap.appendChild(el("div", { class: "meaning-def", text: q.word.definition }));
    }
    if (q.word.sentence) {
      wrap.appendChild(el("div", { class: "meaning-sentence" },
        sentenceParts(q.word.sentence, q.mode === "study" ? q.word.word : null)));
    }
    return wrap;
  }

  // Split "The ___ ran." into text plus a styled gap (or the answer, in study
  // mode where the word is deliberately visible).
  function sentenceParts(sentence, reveal) {
    var bits = sentence.split("___");
    var out = [];
    bits.forEach(function (b, i) {
      if (b) out.push(document.createTextNode(b));
      if (i < bits.length - 1) {
        out.push(el("span", { class: reveal ? "gap filled" : "gap", text: reveal || "?" }));
      }
    });
    return out;
  }

  function renderSlots(q, highlightIdx) {
    // Long Explorer words get a tighter grid so all the letters stay on one
    // line instead of wrapping into an odd 11 + 2 split.
    var many = WB.engine.isFreeTyping(q.mode) && q.word.word.length > 8;
    var wrap = el("div", { class: "slots" + (many ? " many" : ""), id: "slots" });
    q.word.word.split("").forEach(function (c, i) {
      var filled, cls = "slot";
      if (WB.engine.isFreeTyping(q.mode)) {
        // Free typing: whatever was pressed sits in the slot, right or wrong,
        // until the child erases it or the answer is checked.
        filled = i < q.typed.length ? q.typed[i] : "";
        if (filled) cls += " filled";
        if (q.marked && filled && q.typed[i] !== c) cls += " bad";
        if (q.solved) cls += " good";
        if (i === q.typed.length && !q.locked) cls += " active";
        if (q.word.word.length > 8) cls += " tight";
      } else if (q.mode === "spell") {
        filled = i < q.typed.length ? q.typed[i] : "";
        if (filled) cls += " filled";
        if (i === q.typed.length && !q.locked) cls += " active"; // next slot to fill
      } else { // missing
        if (i === q.blankPos) { filled = q.solved ? q.target : ""; cls += q.solved ? " filled" : " blank"; }
        else filled = c;
      }
      if (highlightIdx === i) cls += " flash"; // just-filled letter: light burst
      wrap.appendChild(el("div", { class: cls, text: filled }));
    });
    return wrap;
  }

  // Rich prompt: separate the small instruction label from the target WORD, and
  // flash the letter the child needs next as a visual hint (customer feedback).
  function renderPrompt(q) {
    var wrap = el("div", { class: "prompt", id: "prompt" });
    if (WB.engine.isFreeTyping(q.mode)) {
      wrap.classList.add("hint-prompt");
      if (q.mode === "study") {
        // Introduction: the word is on screen to be copied and learned.
        wrap.appendChild(el("span", { class: "prompt-label", text: T("prompt.copy") }));
        wrap.appendChild(targetWordEl(q));
      } else {
        wrap.appendChild(el("span", {
          class: "prompt-label",
          text: T(q.mode === "clue" ? "prompt.clue" : "prompt.memory", { n: q.word.word.length })
        }));
      }
      return wrap;
    }
    if (q.mode === "spell") {
      wrap.classList.add("hint-prompt");
      wrap.appendChild(el("span", { class: "prompt-label", text: T("prompt.spell") }));
      wrap.appendChild(targetWordEl(q));
    } else if (q.mode === "first") {
      wrap.classList.add("hint-prompt");
      wrap.appendChild(el("span", { class: "prompt-label", text: T("prompt.first") }));
      wrap.appendChild(targetWordEl(q));
    } else if (q.mode === "find") {
      wrap.classList.add("hint-prompt");
      wrap.appendChild(el("span", { class: "prompt-label", text: T("prompt.find") }));
      wrap.appendChild(el("div", { class: "target-word", id: "targetWord" }, [
        el("span", { class: "tw-letter next", text: q.target })
      ]));
    } else { // missing — the blank slot itself is the highlighted target
      wrap.appendChild(el("span", { class: "prompt-label", text: q.prompt }));
    }
    return wrap;
  }

  // The target word rendered letter-by-letter so we can color already-typed
  // letters and flash the next one the child should press.
  function targetWordEl(q) {
    var word = el("div", { class: "target-word", id: "targetWord" });
    var typedLen = q.mode === "spell" ? q.typed.length : 0;
    q.word.word.split("").forEach(function (c, i) {
      var cls = "tw-letter";
      if (q.mode === "spell") {
        if (i < typedLen) cls += " done";        // already spelled — settled green
        else if (i === typedLen) cls += " next"; // the letter to press now — flashes
      } else if (q.mode === "first") {
        cls += (i === 0) ? " next" : " dim";      // flash the first letter, dim the rest
      }
      word.appendChild(el("span", { class: cls, text: c }));
    });
    return word;
  }

  function refreshPrompt(q) {
    if (q.mode !== "spell") return;
    var old = document.getElementById("targetWord");
    if (old) old.replaceWith(targetWordEl(q));
  }

  function renderKeyboard(q) {
    // Full, consistent A–Z keyboard for every mode (PRD 16.1: consistent
    // keyboard, no disabled-looking keys).
    var kb = el("div", { class: "keyboard", id: "kb" });
    QWERTY.forEach(function (r, i) {
      var row = el("div", { class: "kb-row kb-row-" + (i + 1) });
      r.split("").forEach(function (ch) {
        row.appendChild(el("button", {
          class: "key", "data-k": ch, text: ch,
          onClick: function () { onKey(q, ch, this); }
        }));
      });
      kb.appendChild(row);
    });
    // Explorer modes accept wrong letters, so the child needs a way to take
    // one back and a way to say "I'm done" before the last slot is filled.
    if (WB.engine.isFreeTyping(q.mode)) {
      kb.appendChild(el("div", { class: "kb-row kb-row-4" }, [
        el("button", {
          class: "key key-wide", "data-k": "BACK", text: T("key.erase"),
          onClick: function () { onErase(q); }
        }),
        el("button", {
          class: "key key-wide key-check", "data-k": "CHECK", text: T("key.check"),
          onClick: function () { onCheck(q); }
        })
      ]));
    }
    return kb;
  }

  function onErase(q) {
    if (q.locked || !q.typed.length) return;
    WB.audio.tap();
    q.typed = q.typed.slice(0, -1);
    q.marked = false;              // clear red marks once they start fixing
    refreshSlots(q);
  }

  // Check the whole attempt at once — that is what makes this real spelling
  // practice rather than a keyboard that refuses every wrong key.
  function onCheck(q) {
    if (q.locked || !q.typed.length) return;
    if (q.typed === q.word.word) {
      q.solved = true;
      refreshSlots(q);
      WB.audio.letterCorrect(0);
      return wordComplete(q);
    }
    q.marked = true;
    q.attempts += 1;
    q.wrongThisWord = true;
    WB.audio.wrong();
    refreshSlots(q);
    var slots = document.getElementById("slots");
    if (slots) {
      slots.classList.add("shake");
      setTimeout(function () { slots.classList.remove("shake"); }, 500);
    }
    // Keep the correct opening letters, drop from the first mistake on, so a
    // near miss is not punished by wiping the whole attempt.
    setTimeout(function () {
      if (q.locked) return;
      var keep = 0;
      while (keep < q.typed.length && q.typed[keep] === q.word.word[keep]) keep += 1;
      q.typed = q.typed.slice(0, keep);
      q.marked = false;
      refreshSlots(q);
      if (q.attempts >= 2) hint(q);
    }, 1100);
  }

  function onKey(q, ch, btn) {
    if (q.locked) return;
    WB.audio.tap();
    if (WB.engine.isFreeTyping(q.mode)) {
      if (q.typed.length >= q.word.word.length) return; // slots are full
      q.typed += ch;
      q.marked = false;
      flashKey(btn);
      refreshSlots(q);
      // Auto-check the moment the last slot is filled, so there is no extra
      // step for a child who spelled it straight through.
      if (q.typed.length === q.word.word.length) setTimeout(function () { onCheck(q); }, 220);
      return;
    }
    if (q.mode === "spell") {
      var need = q.word.word[q.typed.length];
      if (ch === need) {
        var pos = q.typed.length;
        q.typed += ch;
        // Per-letter reward: rising chime + key flash + slot light burst.
        WB.audio.letterCorrect(pos);
        WB.audio.speakLetterName(ch);
        flashKey(btn);
        refreshSlots(q, pos);
        refreshPrompt(q); // advance the flashing hint to the next letter
        if (q.typed.length === q.word.word.length) return wordComplete(q);
      } else {
        wrongKey(q, btn);
      }
    } else {
      if (ch === q.target) {
        if (q.mode === "missing") { q.solved = true; refreshSlots(q, q.blankPos); }
        else { var t = document.getElementById("target"); if (t) t.textContent = q.target; }
        WB.audio.letterCorrect(0);
        WB.audio.speakLetterName(ch);
        flashKey(btn);
        wordComplete(q);
      } else {
        wrongKey(q, btn);
      }
    }
  }

  function refreshSlots(q, highlightIdx) {
    var old = document.getElementById("slots");
    if (old) old.replaceWith(renderSlots(q, highlightIdx));
  }

  function flashKey(btn) {
    if (!btn) return;
    btn.classList.add("correct-flash");
    setTimeout(function () { btn.classList.remove("correct-flash"); }, 480);
  }

  function wrongKey(q, btn) {
    q.attempts += 1;
    q.wrongThisWord = true;
    WB.audio.wrong();
    if (btn) {
      btn.classList.add("shake", "wrong");
      setTimeout(function () { btn.classList.remove("shake", "wrong"); }, 500);
    }
    if (q.attempts >= 2) hint(q); // auto-hint after 2 misses
  }

  /* A hint points at the answer; it never enters it.
   *
   * The child must still find and press the key themselves — that press is
   * the thing being learned. An earlier version typed the letter in and even
   * trimmed back letters the child had already entered, which took the task
   * away rather than supporting it.
   */
  function hint(q) {
    if (q.locked) return;

    if (WB.engine.isFreeTyping(q.mode)) {
      // Point at the first position that is wrong or still empty, without
      // touching what the child has typed.
      var at = 0;
      while (at < q.typed.length && q.typed[at] === q.word.word[at]) at += 1;
      var need = q.word.word[at];
      if (!need) return;
      q.wrongThisWord = true;          // using a hint costs the clean-run star
      highlightKey(need);
      WB.audio.speakLetterName(need);
      return;
    }
    if (q.mode === "spell") {
      // The letter due next, not the whole-word target.
      var nextLetter = q.word.word[q.typed.length];
      highlightKey(nextLetter);
      WB.audio.speakLetterName(nextLetter);
    } else {
      highlightKey(q.target);
      WB.audio.speakLetterName(q.target);
    }
  }

  // Pulse a key on the on-screen keyboard. Purely visual — it never presses it.
  function highlightKey(ch) {
    var key = document.querySelector('.key[data-k="' + ch + '"]');
    if (!key) return;
    key.classList.add("hint");
    setTimeout(function () { key.classList.remove("hint"); }, 2200);
  }

  /* Read the question aloud.
   *
   * Instructions are spoken in the family's language; letters, words and
   * definitions are always spoken by an English voice, because their English
   * pronunciation is exactly what the child is here to learn. WB.audio.uiPart
   * handles the case where the device has no voice for the interface language.
   */
  function speakQuestion(q) {
    var ui = WB.audio.uiPart;
    var word = { text: q.word.word, voice: "en", rate: 0.75 };

    if (q.mode === "study") {
      var parts = [ui("audio.newWord"), word];
      if (q.word.definition) parts.push({ text: q.word.definition, voice: "en" });
      return WB.audio.sequence(parts);
    }
    if (q.mode === "spellblind") {
      return WB.audio.sequence([ui("audio.spellWord"), word]);
    }
    if (q.mode === "clue") {
      // No picture and the word is never spoken — the meaning is the only clue.
      return WB.audio.sequence([q.word.definition
        ? { text: q.word.definition, voice: "en" }
        : ui("audio.whichFits")]);
    }
    if (q.mode === "find") {
      return WB.audio.sequence([ui("audio.findLetter"), { text: q.target, voice: "en", rate: 0.7 }]);
    }
    if (q.mode === "first") {
      return WB.audio.sequence([word, ui("audio.startsWith")]);
    }
    if (q.mode === "missing") {
      return WB.audio.sequence([word, ui("audio.whichMissing")]);
    }
    WB.audio.sequence([ui("audio.spellWord"), word]);
  }

  function wordComplete(q) {
    q.locked = true;
    WB.engine.recordResult(WB.state, q.word, q.wrongThisWord);
    var star = q.wrongThisWord ? 1 : 2; // extra star for a clean first try
    session.stars += star;
    session.words += 1;
    WB.state.stats.totalStars += star;
    save();
    celebrate(q, star, function () {
      if (timeLeft() <= 0) endSession(); else nextActivity();
    });
  }

  // Completion celebration (PRD: theme-flavored, reduced-motion aware)
  function celebrate(q, star, done) {
    var t = WB.THEMES[WB.state.settings.theme];
    WB.audio.celebrate();
    // Praise in the family's language, then the word itself in English.
    setTimeout(function () {
      WB.audio.sequence([WB.audio.uiPart("audio.yes"), { text: q.word.word, voice: "en", rate: 0.75 }]);
    }, 250);
    var overlay = el("div", { class: "celebrate" });
    overlay.appendChild(el("div", { class: "celebrate-word", text: q.word.word }));
    if (WB.engine.isFreeTyping(q.mode)) {
      // Close the loop on meaning: show the picture and what the word means,
      // including for clue mode where the picture was withheld until now.
      var shot = wordPicture(q.word);
      shot.classList.add("celebrate-photo");
      overlay.appendChild(shot);
      if (q.word.definition) {
        overlay.appendChild(el("div", { class: "celebrate-def", text: q.word.definition }));
      }
    } else {
      overlay.appendChild(el("div", { class: "celebrate-obj", text: q.word.emoji }));
    }
    var reduced = WB.state.settings.motion === "reduced";
    if (!reduced) {
      for (var i = 0; i < 16; i++) {
        var p = el("span", { class: "burst", text: t.completeEmoji });
        p.style.setProperty("--dx", (Math.random() * 2 - 1).toFixed(2));
        p.style.setProperty("--dy", (Math.random() * -1 - 0.2).toFixed(2));
        p.style.left = "50%"; p.style.top = "55%";
        p.style.animationDelay = (Math.random() * 0.2) + "s";
        overlay.appendChild(p);
      }
    }
    overlay.appendChild(el("div", { class: "celebrate-stars", text: "+" + star + " ⭐" }));
    overlay.appendChild(el("div", { class: "celebrate-note", text: t.complete }));
    overlay.appendChild(el("div", { class: "celebrate-next", text: T("celebrate.next") }));
    root().appendChild(overlay);
    // Give the child a clear pause to enjoy the reward before the next word.
    setTimeout(function () { overlay.remove(); done(); }, reduced ? 1800 : 3000);
  }

  var timerInt = null;
  function updateTimer() {
    var elm = document.getElementById("timer");
    if (!elm) { if (timerInt) clearInterval(timerInt); return; }
    var ms = timeLeft();
    var s = Math.ceil(ms / 1000);
    elm.textContent = "⏱ " + Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
    if (!timerInt) {
      timerInt = setInterval(function () {
        var e = document.getElementById("timer");
        if (!e || !session || session.done) { clearInterval(timerInt); timerInt = null; return; }
        updateTimer();
      }, 1000);
    }
  }

  function endSession() {
    session.done = true;
    if (timerInt) { clearInterval(timerInt); timerInt = null; }
    WB.state.stats.lastSession = { when: Date.now(), stars: session.stars, words: session.words };
    save();
    clear();
    var t = WB.THEMES[WB.state.settings.theme];
    var big = Math.min(5, Math.max(1, Math.round(session.stars / Math.max(1, session.words))));
    root().appendChild(el("div", { class: "complete" }, [
      el("div", { class: "complete-emoji", text: t.completeEmoji }),
      el("h1", { text: T("done.title") }),
      el("div", { class: "big-stars", text: "⭐".repeat(big) }),
      el("div", { class: "complete-stats", text: T("done.stats", { w: session.words, s: session.stars }) }),
      el("div", { class: "row-center" }, [
        el("button", { class: "btn-primary big", onClick: goHome }, [T("done.home")]),
        el("button", { class: "btn-ghost big", onClick: startSession }, [T("done.again")])
      ])
    ]));
    applyGlobal();
  }

  // =======================================================================
  //  PARENT GATE + DASHBOARD (PRD 19.2)
  // =======================================================================
  function goParentGate() {
    clear();
    var a = 3 + Math.floor(Math.random() * 6), b = 2 + Math.floor(Math.random() * 6);
    var answer = a * b;
    root().appendChild(el("div", { class: "panel gate" }, [
      el("h2", { text: T("gate.title") }),
      el("p", { text: T("gate.lead") }),
      el("div", { class: "gate-q", text: a + " × " + b + " = ?" }),
      el("input", { class: "gate-input", id: "gate", type: "number", inputmode: "numeric", placeholder: "?" }),
      el("div", { class: "row-center" }, [
        el("button", { class: "btn-ghost", onClick: goHome }, [T("gate.cancel")]),
        el("button", {
          class: "btn-primary", onClick: function () {
            var v = parseInt(document.getElementById("gate").value, 10);
            if (v === answer) goParent(); else { document.getElementById("gate").classList.add("shake"); }
          }
        }, [T("gate.enter")])
      ])
    ]));
    applyGlobal();
  }

  function goParent() {
    clear();
    redraw = goParent;
    var s = WB.state.settings;
    var sum = WB.engine.summary(WB.state);
    var lvl = WB.engine.levelSummary(WB.state);

    function toggleRow(label, key, opts) {
      return el("div", { class: "prow" }, [
        el("div", { class: "prow-label", text: label }),
        el("div", { class: "chips" }, opts.map(function (o) {
          return el("button", {
            class: "chip" + (String(s[key]) === String(o[0]) ? " on" : ""),
            onClick: function () {
              s[key] = o[0];
              if (key === "ageBand") reconcileInterest();
              applyGlobal(); goParent();
            }
          }, [o[1]]);
        }))
      ]);
    }

    // theme usage
    var usage = WB.state.stats.themeUsage;
    var usageRows = WB.THEME_ORDER.map(function (id) {
      var n = usage[id] || 0;
      var max = Math.max(1, Math.max.apply(null, WB.THEME_ORDER.map(function (x) { return usage[x] || 0; })));
      return el("div", { class: "usage-row" }, [
        el("span", { class: "usage-name", text: WB.THEMES[id].icon + " " + WB.THEMES[id].name }),
        el("span", { class: "usage-bar" }, [el("span", { class: "usage-fill", style: "width:" + (n / max * 100) + "%" })]),
        el("span", { class: "usage-n", text: n + "" })
      ]);
    });

    // available-theme multiselect
    var availRow = el("div", { class: "prow" }, [
      el("div", { class: "prow-label", text: T("parent.availThemes") }),
      el("div", { class: "chips" }, WB.THEME_ORDER.map(function (id) {
        var on = s.availableThemes.indexOf(id) !== -1;
        return el("button", {
          class: "chip" + (on ? " on" : ""),
          onClick: function () {
            if (on) { if (s.availableThemes.length > 1) s.availableThemes = s.availableThemes.filter(function (x) { return x !== id; }); }
            else s.availableThemes.push(id);
            if (s.availableThemes.indexOf(s.theme) === -1) s.theme = s.availableThemes[0];
            applyGlobal(); goParent();
          }
        }, [WB.THEMES[id].icon + " " + WB.THEMES[id].name]);
      }))
    ]);

    root().appendChild(el("div", { class: "panel parent" }, [
      el("div", { class: "parent-head" }, [
        el("h2", { text: T("parent.title") }),
        el("button", { class: "icon-btn small", onClick: goHome, title: T("parent.close") }, ["✕"])
      ]),

      el("h3", { text: T("parent.progressH") }),
      el("div", { class: "stat-cards" }, [
        statCard(sum.mastered + "/" + sum.total, T("stat.mastered")),
        statCard(sum.started + "", T("stat.practiced")),
        statCard(WB.state.stats.totalStars + " ⭐", T("stat.stars")),
        statCard(WB.state.stats.sessions + "", T("stat.sessions"))
      ]),
      el("div", { class: "bar big" }, [el("div", { class: "bar-fill", style: "width:" + sum.percent + "%" })]),
      el("div", { class: "muted-line", text: T("parent.curriculum", {
        p: sum.percent, n: sum.total, bank: WB.bankFor(s.ageBand).label
      }) }),

      el("h3", { text: T("parent.pathH") }),
      el("div", { class: "stat-cards" }, [
        statCard(T("parent.level", { n: lvl.number }), T("parent.ofTotal", { n: lvl.total })),
        statCard(lvl.introduced + "", T("parent.metSoFar")),
        statCard(lvl.mastered + "", T("parent.fullyMastered"))
      ]),
      el("p", { class: "note-small", text: T("parent.pathNote") }),

      el("h3", { text: T("parent.themeUseH") }),
      el("div", { class: "usage" }, usageRows),
      el("p", { class: "note-small", text: T("parent.themeNote") }),

      WB.USE_PHOTOS ? el("h3", { text: T("parent.picturesH") }) : null,
      WB.USE_PHOTOS ? el("p", { class: "note-small" }, [
        T("parent.picturesNote"),
        el("a", { href: "credits.html", target: "_blank", rel: "noopener" }, [T("parent.credits")]),
        "."
      ]) : null,

      el("h3", { text: T("parent.sessionH") }),
      langField(T("parent.langNote")),
      toggleRow(T("field.session"), "sessionMinutes", minuteOpts()),
      toggleRow(T("field.age"), "ageBand", AGE_BANDS),
      el("p", { class: "note-small", text: T("parent.bankNote", {
        bank: WB.bankFor(s.ageBand).label, n: WB.bankFor(s.ageBand).words.length
      }) }),
      toggleRow(T("parent.interest"), "interest", categories()),

      el("h3", { text: T("parent.themeH") }),
      toggleRow(T("parent.activeTheme"), "theme", WB.THEME_ORDER.filter(function (id) { return s.availableThemes.indexOf(id) !== -1; }).map(function (id) { return [id, WB.THEMES[id].icon]; })),
      availRow,
      toggleRow(T("parent.canSwitch"), "childCanSwitch", [[true, T("opt.yes")], [false, T("opt.noFixed")]]),

      el("h3", { text: T("parent.comfortH") }),
      toggleRow(T("field.decoration"), "decoration",
        [["simple", T("opt.decorSimple")], ["standard", T("opt.decorStandard")], ["extra", T("opt.decorExtraShort")]]),
      toggleRow(T("field.motion"), "motion",
        [["full", T("opt.motionFullShort")], ["reduced", T("opt.motionReducedShort")]]),
      toggleRow(T("field.sound"), "sound", soundOpts()),

      el("div", { class: "row-center wrap" }, [
        el("button", { class: "btn-primary", onClick: function () { save(); goHome(); } }, [T("parent.done")]),
        el("button", { class: "btn-ghost", onClick: function () { save(); goWorldSelect(false); } }, [T("parent.rerun")]),
        el("button", {
          class: "btn-danger", onClick: function () {
            if (confirm(T("parent.resetConfirm"))) {
              WB.state = WB.storage.reset();
              // A reset clears the saved language too; keep showing the one the
              // parent is reading right now rather than snapping back to English.
              WB.state.settings.lang = WB.lang;
              applyGlobal(); screenSetup();
            }
          }
        }, [T("parent.reset")])
      ])
    ]));
    applyGlobal();
    save();
  }

  function statCard(big, label) {
    return el("div", { class: "stat-card" }, [
      el("div", { class: "stat-big", text: big }),
      el("div", { class: "stat-label", text: label })
    ]);
  }

  // ---- physical keyboard support (PRD: external keyboard) ---------------
  document.addEventListener("keydown", function (e) {
    var q = WB.state && WB.state._activeQ;
    if (!q || q.locked) return;
    var k = (e.key || "").toUpperCase();
    if (WB.engine.isFreeTyping(q.mode)) {
      if (k === "BACKSPACE") { e.preventDefault(); return onErase(q); }
      if (k === "ENTER") { e.preventDefault(); return onCheck(q); }
    }
    if (k.length === 1 && k >= "A" && k <= "Z") {
      var btn = document.querySelector('.key[data-k="' + k + '"]');
      onKey(q, k, btn);
      if (btn) { btn.classList.add("press"); setTimeout(function () { btn.classList.remove("press"); }, 120); }
    }
  });

  // ---- boot --------------------------------------------------------------
  function boot() {
    WB.state = WB.storage.load();

    // Resolve the interface language before anything renders: an explicit
    // ?lang= (how the localized landing pages link in) wins, then the parent's
    // saved choice, then the browser's own languages.
    WB.state.settings.lang = WB.setLang(WB.detectLang(WB.state.settings.lang));
    WB.audio.refreshVoices();

    // Unlock audio context on first interaction (browser autoplay policy).
    var unlock = function () { WB.audio.tap(); document.removeEventListener("pointerdown", unlock); };
    document.addEventListener("pointerdown", unlock);

    if (!WB.state.setupDone) screenSetup();
    else { applyGlobal(); goHome(); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

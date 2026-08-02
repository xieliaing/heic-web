/* LetterLand — application shell, screen router and activity UI. */
(function () {
  var ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  var CATEGORIES = [
    ["any", "🌈 A little of everything"], ["animals", "🐾 Animals"],
    ["food", "🍎 Food"], ["nature", "🌳 Nature"], ["vehicles", "🚗 Vehicles"],
    ["home", "🏠 Home things"], ["body", "👋 My body"], ["space", "🚀 Space & treasure"]
  ];

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
  function clear() { root().innerHTML = ""; }
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
    var s = WB.state.settings;
    function chips(label, key, opts) {
      return el("div", { class: "field" }, [
        el("div", { class: "field-label", text: label }),
        el("div", { class: "chips" }, opts.map(function (o) {
          return el("button", {
            class: "chip" + (s[key] === o[0] ? " on" : ""),
            onClick: function () { s[key] = o[0]; screenSetup(); }
          }, [o[1]]);
        }))
      ]);
    }

    var card = el("div", { class: "panel setup" }, [
      el("div", { class: "brand" }, ["🌸 ", el("b", { text: "LetterLand" }), el("span", { class: "brand-sub", text: "Parent setup" })]),
      el("p", { class: "lead", text: "Set things up for your child. No name, account, or gender is required — your child will pick a world next." }),
      chips("Age band", "ageBand", [["2-3", "2–3"], ["3-4", "3–4"], ["4-5", "4–5"]]),
      chips("Session length", "sessionMinutes", [[3, "3 min"], [5, "5 min"], [8, "8 min"]]),
      chips("Keyboard", "keyboard", [["onscreen", "On-screen"], ["external", "External keyboard"]]),
      chips("What sounds fun?", "interest", CATEGORIES.map(function (c) { return c; })),
      chips("Motion", "motion", [["full", "Full motion"], ["reduced", "Reduced motion"]]),
      chips("Sound", "sound", [["full", "Full"], ["low", "Soft"], ["off", "Off"]]),
      chips("Decoration", "decoration", [["simple", "Simple"], ["standard", "Standard"], ["extra", "Extra decorative"]]),
      el("button", {
        class: "btn-primary big", onClick: function () {
          applyGlobal(); goWorldSelect(true);
        }
      }, ["Continue →"])
    ]);
    root().appendChild(card);
    applyGlobal();
  }

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
      el("h1", { class: "big-q", text: "Which world would you like to play in?" }),
      grid,
      preview,
      el("div", { class: "row-center" }, [
        el("button", {
          class: "btn-primary big", onClick: function () { goAvatar(fromSetup); }
        }, ["Play Here ▶"])
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
    p.appendChild(el("div", { class: "preview-head", text: "Preview: " + t.name }));
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
      el("button", { class: "btn-ghost", onClick: function () { WB.audio.speakWord(sampleWord.word); WB.audio.tap(); } }, ["🔊 Hear a word"]),
      el("button", { class: "btn-ghost", onClick: function () { WB.audio.celebrate(); } }, ["✨ Hear reward"])
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
      el("h1", { class: "big-q", text: "Pick your buddy!" }),
      grid,
      el("div", { class: "row-center" }, [
        el("button", {
          class: "btn-primary big", onClick: function () {
            WB.state.settings.avatar = chosen;
            WB.state.setupDone = true;
            if (fromSetup) recordThemeUse();
            save(); goHome();
          }
        }, ["Let's go! ▶"])
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
    var sum = WB.engine.summary(WB.state);

    var top = el("div", { class: "home-top" }, [
      el("button", { class: "icon-btn small", title: "Parent area", onClick: goParentGate }, ["⚙️"]),
      el("div", { class: "star-count", text: "⭐ " + WB.state.stats.totalStars })
    ]);

    var buttons = el("div", { class: "home-buttons" }, [
      el("button", { class: "play-btn", onClick: startSession }, [
        el("div", { class: "play-icon", text: "▶" }),
        el("div", { text: "Play" })
      ])
    ]);
    if (s.childCanSwitch) {
      buttons.appendChild(el("button", {
        class: "world-btn", onClick: function () { goWorldSelect(false); }
      }, [el("div", { class: "play-icon", text: t.icon }), el("div", { text: "My World" })]));
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
        el("div", { class: "bar" }, [el("div", { class: "bar-fill", style: "width:" + sum.percent + "%" })]),
        el("div", { class: "home-progress-label", text: sum.mastered + " of " + sum.total + " words mastered" })
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
      stars: 0, words: 0, done: false
    };
    save();
    nextActivity();
  }

  function timeLeft() { return Math.max(0, session.endAt - Date.now()); }

  function nextActivity() {
    if (!session || session.done) return;
    if (timeLeft() <= 0 && session.words > 0) return endSession();
    var word = WB.engine.nextWord(WB.state);
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
      el("button", { class: "icon-btn small", title: "Home", onClick: function () { session.done = true; save(); goHome(); } }, ["🏠"]),
      el("div", { class: "timer", id: "timer" }),
      el("div", { class: "star-count", text: "⭐ " + session.stars })
    ]);

    // Learning zone (solid panel so decoration never overlaps letters)
    var zone = el("div", { class: "learn-zone" });
    zone.appendChild(el("div", { class: "mode-tag", text: modeLabel(q.mode) }));
    zone.appendChild(el("div", { class: "obj-emoji", text: q.word.emoji }));

    if (q.mode === "spell" || q.mode === "missing") {
      zone.appendChild(renderSlots(q));
    } else {
      zone.appendChild(el("div", { class: "big-letter-target", id: "target",
        text: (q.mode === "find") ? q.target : "?" }));
    }
    zone.appendChild(renderPrompt(q));

    var tools = el("div", { class: "act-tools" }, [
      el("button", { class: "tool-btn", onClick: function () { speakQuestion(q); } }, ["🔊 Listen"]),
      el("button", { class: "tool-btn", onClick: function () { hint(q); } }, ["💡 Hint"])
    ]);

    var kb = renderKeyboard(q);

    root().appendChild(el("div", { class: "activity" }, [bar, zone, tools, kb]));
    applyGlobal();
    updateTimer();
    speakQuestion(q, true);
    WB.state._activeQ = q;
  }

  function modeLabel(m) {
    return { find: "Find the Letter", first: "First Letter", missing: "Missing Letter", spell: "Spell the Word" }[m];
  }

  function renderSlots(q, highlightIdx) {
    var wrap = el("div", { class: "slots", id: "slots" });
    q.word.word.split("").forEach(function (c, i) {
      var filled, cls = "slot";
      if (q.mode === "spell") {
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
    if (q.mode === "spell") {
      wrap.classList.add("hint-prompt");
      wrap.appendChild(el("span", { class: "prompt-label", text: "Spell" }));
      wrap.appendChild(targetWordEl(q));
    } else if (q.mode === "first") {
      wrap.classList.add("hint-prompt");
      wrap.appendChild(el("span", { class: "prompt-label", text: "What letter does it start with?" }));
      wrap.appendChild(targetWordEl(q));
    } else if (q.mode === "find") {
      wrap.classList.add("hint-prompt");
      wrap.appendChild(el("span", { class: "prompt-label", text: "Find the letter" }));
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
    var rows = [ALPHA.slice(0, 9), ALPHA.slice(9, 18), ALPHA.slice(18, 26)];
    var kb = el("div", { class: "keyboard", id: "kb" });
    rows.forEach(function (r) {
      var row = el("div", { class: "kb-row" });
      r.forEach(function (ch) {
        row.appendChild(el("button", {
          class: "key", "data-k": ch, text: ch,
          onClick: function () { onKey(q, ch, this); }
        }));
      });
      kb.appendChild(row);
    });
    return kb;
  }

  function onKey(q, ch, btn) {
    if (q.locked) return;
    WB.audio.tap();
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

  function hint(q) {
    var key = document.querySelector('.key[data-k="' + q.target + '"]');
    if (key) {
      key.classList.add("hint");
      setTimeout(function () { key.classList.remove("hint"); }, 2200);
    }
    if (q.mode === "spell") {
      var need = q.word.word[q.typed.length];
      var k2 = document.querySelector('.key[data-k="' + need + '"]');
      if (k2) { k2.classList.add("hint"); setTimeout(function () { k2.classList.remove("hint"); }, 2200); }
      WB.audio.speakLetterName(need);
    } else {
      WB.audio.speakLetterName(q.target);
    }
  }

  function speakQuestion(q, auto) {
    if (q.mode === "find") { WB.audio.say("Find the letter"); setTimeout(function () { WB.audio.speakLetterName(q.target); }, 650); }
    else if (q.mode === "first") { WB.audio.say(q.word.word + ". What letter does it start with?"); }
    else if (q.mode === "missing") { WB.audio.say(q.word.word + ". Which letter is missing?"); }
    else { WB.audio.say("Spell the word. " + q.word.word); setTimeout(function () { WB.audio.speakWord(q.word.word); }, 850); }
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
    setTimeout(function () { WB.audio.say("Yes! " + q.word.word); }, 250);
    var overlay = el("div", { class: "celebrate" });
    overlay.appendChild(el("div", { class: "celebrate-word", text: q.word.word }));
    overlay.appendChild(el("div", { class: "celebrate-obj", text: q.word.emoji }));
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
    overlay.appendChild(el("div", { class: "celebrate-next", text: "Next word coming…" }));
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
      el("h1", { text: "Great playing!" }),
      el("div", { class: "big-stars", text: "⭐".repeat(big) }),
      el("div", { class: "complete-stats", text: session.words + " words · +" + session.stars + " stars" }),
      el("div", { class: "row-center" }, [
        el("button", { class: "btn-primary big", onClick: goHome }, ["🏠 Home"]),
        el("button", { class: "btn-ghost big", onClick: startSession }, ["▶ Play again"])
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
      el("h2", { text: "🔒 Parent check" }),
      el("p", { text: "To keep this area for grown-ups, please answer:" }),
      el("div", { class: "gate-q", text: a + " × " + b + " = ?" }),
      el("input", { class: "gate-input", id: "gate", type: "number", inputmode: "numeric", placeholder: "?" }),
      el("div", { class: "row-center" }, [
        el("button", { class: "btn-ghost", onClick: goHome }, ["Cancel"]),
        el("button", {
          class: "btn-primary", onClick: function () {
            var v = parseInt(document.getElementById("gate").value, 10);
            if (v === answer) goParent(); else { document.getElementById("gate").classList.add("shake"); }
          }
        }, ["Enter"])
      ])
    ]));
    applyGlobal();
  }

  function goParent() {
    clear();
    var s = WB.state.settings;
    var sum = WB.engine.summary(WB.state);

    function toggleRow(label, key, opts) {
      return el("div", { class: "prow" }, [
        el("div", { class: "prow-label", text: label }),
        el("div", { class: "chips" }, opts.map(function (o) {
          return el("button", {
            class: "chip" + (String(s[key]) === String(o[0]) ? " on" : ""),
            onClick: function () { s[key] = o[0]; applyGlobal(); goParent(); }
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
      el("div", { class: "prow-label", text: "Themes available to child" }),
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
        el("h2", { text: "Parent dashboard" }),
        el("button", { class: "icon-btn small", onClick: goHome, title: "Close" }, ["✕"])
      ]),

      el("h3", { text: "Learning progress" }),
      el("div", { class: "stat-cards" }, [
        statCard(sum.mastered + "/" + sum.total, "Words mastered"),
        statCard(sum.started + "", "Words practiced"),
        statCard(WB.state.stats.totalStars + " ⭐", "Total stars"),
        statCard(WB.state.stats.sessions + "", "Sessions")
      ]),
      el("div", { class: "bar big" }, [el("div", { class: "bar-fill", style: "width:" + sum.percent + "%" })]),
      el("div", { class: "muted-line", text: sum.percent + "% of the 100-word curriculum mastered · same for every theme." }),

      el("h3", { text: "Theme use" }),
      el("div", { class: "usage" }, usageRows),
      el("p", { class: "note-small", text: "Theme choice reflects interest only. LetterLand never infers gender, ability, or personality from it." }),

      el("h3", { text: "Session & learning" }),
      toggleRow("Session length", "sessionMinutes", [[3, "3 min"], [5, "5 min"], [8, "8 min"]]),
      toggleRow("Age band", "ageBand", [["2-3", "2–3"], ["3-4", "3–4"], ["4-5", "4–5"]]),
      toggleRow("Vocabulary interest", "interest", CATEGORIES.map(function (c) { return c; })),

      el("h3", { text: "Theme settings" }),
      toggleRow("Active theme", "theme", WB.THEME_ORDER.filter(function (id) { return s.availableThemes.indexOf(id) !== -1; }).map(function (id) { return [id, WB.THEMES[id].icon]; })),
      availRow,
      toggleRow("Child may switch worlds", "childCanSwitch", [[true, "Yes"], [false, "No (fixed)"]]),

      el("h3", { text: "Comfort & accessibility" }),
      toggleRow("Decoration", "decoration", [["simple", "Simple"], ["standard", "Standard"], ["extra", "Extra"]]),
      toggleRow("Motion", "motion", [["full", "Full"], ["reduced", "Reduced"]]),
      toggleRow("Sound", "sound", [["full", "Full"], ["low", "Soft"], ["off", "Off"]]),

      el("div", { class: "row-center wrap" }, [
        el("button", { class: "btn-primary", onClick: function () { save(); goHome(); } }, ["Done"]),
        el("button", { class: "btn-ghost", onClick: function () { save(); goWorldSelect(false); } }, ["Re-run world setup"]),
        el("button", {
          class: "btn-danger", onClick: function () {
            if (confirm("Reset all progress and settings? This cannot be undone.")) {
              WB.state = WB.storage.reset(); applyGlobal(); screenSetup();
            }
          }
        }, ["Reset everything"])
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
    if (k.length === 1 && k >= "A" && k <= "Z") {
      var btn = document.querySelector('.key[data-k="' + k + '"]');
      onKey(q, k, btn);
      if (btn) { btn.classList.add("press"); setTimeout(function () { btn.classList.remove("press"); }, 120); }
    }
  });

  // ---- boot --------------------------------------------------------------
  function boot() {
    WB.state = WB.storage.load();
    // Unlock audio context on first interaction (browser autoplay policy).
    var unlock = function () { WB.audio.tap(); document.removeEventListener("pointerdown", unlock); };
    document.addEventListener("pointerdown", unlock);

    if (!WB.state.setupDone) screenSetup();
    else { applyGlobal(); goHome(); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

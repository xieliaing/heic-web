/* LetterLand — Audio.
 * The PRD ships human-recorded audio; this prototype substitutes the browser
 * Web Speech API for letter/word voice, and WebAudio for theme sound effects.
 * All audio respects the parent Sound level (off / low / full).
 */
(function () {
  var ctx = null;
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    return ctx;
  }

  function soundOn() { return WB.state.settings.sound !== "off"; }
  function gainLevel() { return WB.state.settings.sound === "low" ? 0.18 : 0.4; }

  /* --- Voices -------------------------------------------------------------
   *
   * Two separate voices, and the split matters:
   *
   *   enVoice - every letter and every vocabulary word. LetterLand teaches
   *             English, so these are always read by an English voice no
   *             matter which language the interface is in.
   *   uiVoice - spoken instructions ("Find the letter"), read in the family's
   *             language so a three-year-old can follow them.
   *
   * If the device has no voice installed for the interface language, spoken
   * instructions fall back to their English wording read by the English
   * voice — see sayKey() below.
   */
  var enVoice = null, uiVoice = null, uiVoiceLang = null;

  function bestFor(vs, prefix) {
    var m = vs.filter(function (v) {
      return (v.lang || "").toLowerCase().replace("_", "-").indexOf(prefix) === 0;
    });
    if (!m.length) return null;
    return m.find(function (v) { return /female|samantha|zira|google/i.test(v.name); }) || m[0];
  }

  function pickVoices() {
    if (!("speechSynthesis" in window)) return;
    var vs = window.speechSynthesis.getVoices();
    if (!vs.length) return;
    enVoice = bestFor(vs, "en") || vs[0];
    uiVoiceLang = WB.speechLang().toLowerCase();
    // Try the full tag first (zh-tw must not be answered by a zh-cn voice),
    // then the bare language for locales where only a generic voice exists.
    uiVoice = bestFor(vs, uiVoiceLang);
    if (!uiVoice && uiVoiceLang.indexOf("zh") !== 0) {
      uiVoice = bestFor(vs, uiVoiceLang.split("-")[0]);
    }
  }
  if ("speechSynthesis" in window) {
    pickVoices();
    window.speechSynthesis.onvoiceschanged = pickVoices;
  }

  // Called when the parent switches language: the cached UI voice is stale.
  function refreshVoices() { pickVoices(); }

  function utter(text, voice, opts) {
    var u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    if (voice && voice.lang) u.lang = voice.lang;
    u.rate = opts.rate || 0.85;
    u.pitch = opts.pitch || 1.15;
    u.volume = WB.state.settings.sound === "low" ? 0.6 : 1;
    return u;
  }

  /* Speak a list of parts as one uninterrupted run.
   *
   * Each part is { text, voice: "en" | "ui", rate, pitch }. Queueing them on
   * the synthesizer in one go replaces the old chain of setTimeout calls,
   * which raced: speak() cancels, so a timer firing late could cut off the
   * utterance that had just started.
   */
  function speakParts(parts) {
    if (!soundOn() || !("speechSynthesis" in window)) return;
    if (!enVoice && !uiVoice) pickVoices(); // voices can load after first paint
    try {
      window.speechSynthesis.cancel();
      parts.forEach(function (p) {
        if (!p || !p.text) return;
        var v = p.voice === "ui" ? (uiVoice || enVoice) : enVoice;
        window.speechSynthesis.speak(utter(p.text, v, p));
      });
    } catch (e) { /* ignore */ }
  }

  function speak(text, opts) {
    opts = opts || {};
    speakParts([{ text: text, voice: opts.voice || "en", rate: opts.rate, pitch: opts.pitch }]);
  }

  // An interface phrase by i18n key, in the family's language when a voice for
  // it exists and in English when it does not.
  function uiPart(key, vars) {
    return uiVoice
      ? { text: WB.t(key, vars), voice: "ui" }
      : { text: WB.tEn(key, vars), voice: "en" };
  }

  WB.audio = {
    refreshVoices: refreshVoices,
    uiPart: uiPart,

    speakLetterName: function (ch) { speak(ch, { rate: 0.7 }); },
    speakWord: function (word) { speak(word, { rate: 0.75 }); },
    say: function (text, opts) { speak(text, opts); },
    sayKey: function (key, vars) { speakParts([uiPart(key, vars)]); },
    sequence: speakParts,

    // --- Sound effects (theme flavored chimes) --------------------------
    tone: function (freqs, dur, type) {
      if (!soundOn()) return;
      var a = ac(); if (!a) return;
      if (a.state === "suspended") a.resume();
      dur = dur || 0.16;
      freqs.forEach(function (f, i) {
        var o = a.createOscillator();
        var g = a.createGain();
        o.type = type || "sine";
        o.frequency.value = f;
        var t0 = a.currentTime + i * dur * 0.85;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(gainLevel(), t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        o.connect(g); g.connect(a.destination);
        o.start(t0); o.stop(t0 + dur + 0.02);
      });
    },
    correct: function () { WB.audio.tone([659.25, 880], 0.14, "triangle"); },
    // Rising note per correct letter — climbs a scale as the word fills in.
    letterCorrect: function (i) {
      var scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
      WB.audio.tone([scale[Math.min(i, scale.length - 1)]], 0.13, "triangle");
    },
    wrong: function () { WB.audio.tone([220, 175], 0.18, "sine"); },
    tap: function () { WB.audio.tone([880], 0.05, "sine"); },
    celebrate: function () {
      var t = WB.THEMES[WB.state.settings.theme] || WB.THEMES.neutral;
      WB.audio.tone(t.chime || [523, 659, 784], 0.2, "triangle");
    }
  };
})();

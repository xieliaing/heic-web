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

  // --- Voice (letters & words) -------------------------------------------
  var voice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    var vs = window.speechSynthesis.getVoices();
    // Prefer an English voice; a female/child-friendly one if available.
    var en = vs.filter(function (v) { return /en(-|_)/i.test(v.lang); });
    voice = en.find(function (v) { return /female|samantha|zira|google us/i.test(v.name); }) || en[0] || vs[0] || null;
  }
  if ("speechSynthesis" in window) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }

  function speak(text, opts) {
    opts = opts || {};
    if (!soundOn() || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.rate = opts.rate || 0.85;
      u.pitch = opts.pitch || 1.15;
      u.volume = WB.state.settings.sound === "low" ? 0.6 : 1;
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }

  var LETTER_SAY = { A: "ay", E: "ee", I: "eye", O: "oh", U: "you" };
  WB.audio = {
    speakLetter: function (ch) {
      var say = "The letter " + ch;
      speak(say, { rate: 0.8 });
    },
    speakLetterName: function (ch) { speak(ch, { rate: 0.7 }); },
    speakWord: function (word) { speak(word, { rate: 0.75 }); },
    say: function (text, opts) { speak(text, opts); },

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

/* LetterLand — interface language.
 *
 * LetterLand is an ENGLISH reading and spelling game. This module translates
 * the interface only — menus, instructions, the parent dashboard — so that a
 * family in Paris, Berlin, Seoul, Beijing or Taipei can set the app up and
 * understand what to do. The material being learned is deliberately NOT
 * translated: every word, definition and example sentence in js/words*.js
 * stays in English, and the child always spells English letters.
 *
 * Any key missing from a language falls back to English, so a half-finished
 * translation degrades to English text rather than to a blank label.
 */
(function () {
  // Native names, so the picker is readable to someone who cannot read the
  // language the app currently happens to be in.
  WB.LANGS = [
    ["en", "English"],
    ["fr", "Français"],
    ["de", "Deutsch"],
    ["ko", "한국어"],
    ["zh-cn", "简体中文"],
    ["zh-tw", "繁體中文"]
  ];

  // BCP-47 tags for speech synthesis voice selection.
  var SPEECH_LANG = {
    en: "en-US", fr: "fr-FR", de: "de-DE",
    ko: "ko-KR", "zh-cn": "zh-CN", "zh-tw": "zh-TW"
  };

  var STRINGS = {

    /* =================================================================== */
    en: {
      "app.title": "LetterLand — Learn to Read & Spell in English",
      "app.desc": "A playful English reading and spelling app for children. Free, private and offline-friendly.",

      "brand.setup": "Parent setup",
      "setup.lead": "Set things up for your child. No name, account, or gender is required — your child will pick a world next.",
      "setup.english": "LetterLand teaches English reading and spelling. Menus and instructions follow the language you choose here — the words your child learns are always English.",
      "setup.ageNote": "Ages 6–9 unlock Word Explorers: {n} English words spelled from memory, with pictures and meanings.",

      "field.language": "App language",
      "field.age": "Age band",
      "field.session": "Session length",
      "field.keyboard": "Keyboard",
      "field.interest": "What sounds fun?",
      "field.motion": "Motion",
      "field.sound": "Sound",
      "field.decoration": "Decoration",

      "opt.min": "{n} min",
      "opt.onscreen": "On-screen",
      "opt.external": "External keyboard",
      "opt.motionFull": "Full motion",
      "opt.motionReduced": "Reduced motion",
      "opt.motionFullShort": "Full",
      "opt.motionReducedShort": "Reduced",
      "opt.soundFull": "Full",
      "opt.soundLow": "Soft",
      "opt.soundOff": "Off",
      "opt.decorSimple": "Simple",
      "opt.decorStandard": "Standard",
      "opt.decorExtra": "Extra decorative",
      "opt.decorExtraShort": "Extra",
      "opt.yes": "Yes",
      "opt.noFixed": "No (fixed)",

      "badge.words": "{n} words",
      "btn.continue": "Continue →",

      "world.q": "Which world would you like to play in?",
      "world.play": "Play Here ▶",
      "preview.head": "Preview: {name}",
      "preview.hearWord": "🔊 Hear a word",
      "preview.hearReward": "✨ Hear reward",

      "avatar.q": "Pick your buddy!",
      "avatar.go": "Let's go! ▶",

      "home.parent": "Parent area",
      "home.play": "Play",
      "home.world": "My World",
      "home.level": "Level {n} · {a} of {b} new words",
      "act.home": "Home",

      "mode.find": "Find the Letter",
      "mode.first": "First Letter",
      "mode.missing": "Missing Letter",
      "mode.spell": "Spell the Word",
      "mode.study": "New Word",
      "mode.spellblind": "Spell from Memory",
      "mode.clue": "What's the Word?",

      "tool.listen": "🔊 Listen",
      "tool.hint": "💡 Hint",

      "prompt.copy": "A new word — copy it",
      "prompt.clue": "Which word fits? {n} letters",
      "prompt.memory": "Spell it from memory — {n} letters",
      "prompt.spell": "Spell",
      "prompt.first": "What letter does it start with?",
      "prompt.find": "Find the letter",
      "prompt.missing": "Which letter is missing?",

      "key.erase": "⌫ Erase",
      "key.check": "✓ Check",

      "celebrate.next": "Next word coming…",
      "done.title": "Great playing!",
      "done.stats": "{w} words · +{s} stars",
      "done.home": "🏠 Home",
      "done.again": "▶ Play again",

      "gate.title": "🔒 Parent check",
      "gate.lead": "To keep this area for grown-ups, please answer:",
      "gate.cancel": "Cancel",
      "gate.enter": "Enter",

      "parent.title": "Parent dashboard",
      "parent.close": "Close",
      "parent.progressH": "Learning progress",
      "stat.mastered": "Words mastered",
      "stat.practiced": "Words practiced",
      "stat.stars": "Total stars",
      "stat.sessions": "Sessions",
      "parent.curriculum": "{p}% of the {n}-word {bank} curriculum mastered · same for every theme.",
      "parent.pathH": "Learning path",
      "parent.level": "Level {n}",
      "parent.ofTotal": "of {n}",
      "parent.metSoFar": "words met so far",
      "parent.fullyMastered": "fully mastered",
      "parent.pathNote": "Words follow a fixed curriculum order — easiest first, mixed across topics — rather than being drawn at random. Roughly every other turn introduces the next new word, and the turns between revise whichever earlier word is weakest, so new vocabulary keeps arriving while old words are not forgotten. A word is never repeated within a single session.",
      "parent.themeUseH": "Theme use",
      "parent.themeNote": "Theme choice reflects interest only. LetterLand never infers gender, ability, or personality from it.",
      "parent.picturesH": "Word pictures",
      "parent.picturesNote": "Photographs come from Wikimedia Commons under free licences and are stored in the app, so they work offline. Words with no suitable photograph show a picture symbol instead. ",
      "parent.credits": "See all image credits",
      "parent.sessionH": "Session & learning",
      "parent.bankNote": "Now playing: {bank} — {n} English words. Ages 6–9 spell from memory using the picture and the meaning; ages 2–5 copy the word from the screen. Every word is a concrete noun, so it can always be shown as one picture. Progress is kept separately for each band, so switching loses nothing.",
      "parent.interest": "Vocabulary interest",
      "parent.langNote": "Menus, instructions and spoken directions use this language. The vocabulary itself is always English — that is the point of the game.",
      "parent.themeH": "Theme settings",
      "parent.activeTheme": "Active theme",
      "parent.availThemes": "Themes available to child",
      "parent.canSwitch": "Child may switch worlds",
      "parent.comfortH": "Comfort & accessibility",
      "parent.done": "Done",
      "parent.rerun": "Re-run world setup",
      "parent.reset": "Reset everything",
      "parent.resetConfirm": "Reset all progress and settings? This cannot be undone.",

      "bank.early": "Little Learners",
      "bank.explorer": "Word Explorers",

      "cat.early.any": "A little of everything",
      "cat.early.animals": "Animals",
      "cat.early.food": "Food",
      "cat.early.nature": "Nature",
      "cat.early.vehicles": "Vehicles",
      "cat.early.home": "Home things",
      "cat.early.body": "My body",
      "cat.early.space": "Space & treasure",

      "cat.explorer.any": "A little of everything",
      "cat.explorer.animals": "Animals",
      "cat.explorer.nature": "Nature & landscapes",
      "cat.explorer.weather": "Weather & seasons",
      "cat.explorer.space": "Space",
      "cat.explorer.places": "Places & geography",
      "cat.explorer.science": "Science & machines",
      "cat.explorer.body": "Body & health",
      "cat.explorer.food": "Food & cooking",
      "cat.explorer.school": "School & language",
      "cat.explorer.sports": "Sports & games",
      "cat.explorer.art": "Music & art",
      "cat.explorer.jobs": "Jobs & people",
      "cat.explorer.transport": "Transport & travel",
      "cat.explorer.home": "Home & tools",
      "cat.explorer.clothes": "Clothes",
      "cat.explorer.history": "History & the world",
      "cat.explorer.money": "Money & shopping",
      "cat.explorer.community": "Community & safety",
      "cat.explorer.tech": "Technology",
      "cat.explorer.myths": "Stories & myths",

      "theme.sparkle.name": "Sparkle Garden",
      "theme.sparkle.tagline": "Flowers, gems and magic",
      "theme.sparkle.complete": "A glowing star rises over the garden and releases sparkles!",
      "theme.mechanical.name": "Mechanical Lab",
      "theme.mechanical.tagline": "Gears, robots and machines",
      "theme.mechanical.complete": "Mechanical arms lock the piece in place with a satisfying clunk!",
      "theme.animal.name": "Animal Adventure",
      "theme.animal.tagline": "Forests, farms and friends",
      "theme.animal.complete": "Your animal friends cheer and hop across the meadow!",
      "theme.space.name": "Space Explorer",
      "theme.space.tagline": "Rockets, planets and stars",
      "theme.space.complete": "A rocket flies to the moon and plants the LetterLand flag!",
      "theme.neutral.name": "Calm Start",
      "theme.neutral.tagline": "A gentle default world",
      "theme.neutral.complete": "Great job! A rainbow arcs across the sky.",

      "audio.newWord": "A new word.",
      "audio.spellWord": "Spell the word.",
      "audio.whichFits": "Which word fits?",
      "audio.findLetter": "Find the letter",
      "audio.startsWith": "What letter does it start with?",
      "audio.whichMissing": "Which letter is missing?",
      "audio.yes": "Yes!"
    },

    /* =================================================================== */
    fr: {
      "app.title": "LetterLand — Apprendre à lire et à écrire en anglais",
      "app.desc": "Un jeu de lecture et d'orthographe anglaise pour les enfants. Gratuit, privé et utilisable hors ligne.",

      "brand.setup": "Réglages parent",
      "setup.lead": "Configurez l'application pour votre enfant. Aucun nom, compte ni genre n'est demandé — votre enfant choisira ensuite son monde.",
      "setup.english": "LetterLand enseigne la lecture et l'orthographe de l'anglais. Les menus et les consignes suivent la langue choisie ici — les mots appris par votre enfant sont toujours en anglais.",
      "setup.ageNote": "Dès 6 ans, les Explorateurs de mots s'ouvrent : {n} mots anglais à écrire de mémoire, avec images et définitions.",

      "field.language": "Langue de l'application",
      "field.age": "Tranche d'âge",
      "field.session": "Durée d'une séance",
      "field.keyboard": "Clavier",
      "field.interest": "Qu'est-ce qui te plaît ?",
      "field.motion": "Animations",
      "field.sound": "Son",
      "field.decoration": "Décor",

      "opt.min": "{n} min",
      "opt.onscreen": "À l'écran",
      "opt.external": "Clavier externe",
      "opt.motionFull": "Animations complètes",
      "opt.motionReduced": "Animations réduites",
      "opt.motionFullShort": "Complètes",
      "opt.motionReducedShort": "Réduites",
      "opt.soundFull": "Fort",
      "opt.soundLow": "Doux",
      "opt.soundOff": "Coupé",
      "opt.decorSimple": "Sobre",
      "opt.decorStandard": "Standard",
      "opt.decorExtra": "Très décoré",
      "opt.decorExtraShort": "Très décoré",
      "opt.yes": "Oui",
      "opt.noFixed": "Non (fixe)",

      "badge.words": "{n} mots",
      "btn.continue": "Continuer →",

      "world.q": "Dans quel monde veux-tu jouer ?",
      "world.play": "Jouer ici ▶",
      "preview.head": "Aperçu : {name}",
      "preview.hearWord": "🔊 Écouter un mot",
      "preview.hearReward": "✨ Écouter la récompense",

      "avatar.q": "Choisis ton copain !",
      "avatar.go": "C'est parti ! ▶",

      "home.parent": "Espace parent",
      "home.play": "Jouer",
      "home.world": "Mon monde",
      "home.level": "Niveau {n} · {a} nouveaux mots sur {b}",
      "act.home": "Accueil",

      "mode.find": "Trouve la lettre",
      "mode.first": "Première lettre",
      "mode.missing": "Lettre manquante",
      "mode.spell": "Écris le mot",
      "mode.study": "Nouveau mot",
      "mode.spellblind": "Écris de mémoire",
      "mode.clue": "Quel est le mot ?",

      "tool.listen": "🔊 Écouter",
      "tool.hint": "💡 Indice",

      "prompt.copy": "Un nouveau mot — recopie-le",
      "prompt.clue": "Quel mot convient ? {n} lettres",
      "prompt.memory": "Écris-le de mémoire — {n} lettres",
      "prompt.spell": "Écris",
      "prompt.first": "Par quelle lettre ça commence ?",
      "prompt.find": "Trouve la lettre",
      "prompt.missing": "Quelle lettre manque ?",

      "key.erase": "⌫ Effacer",
      "key.check": "✓ Vérifier",

      "celebrate.next": "Mot suivant…",
      "done.title": "Bien joué !",
      "done.stats": "{w} mots · +{s} étoiles",
      "done.home": "🏠 Accueil",
      "done.again": "▶ Rejouer",

      "gate.title": "🔒 Vérification parent",
      "gate.lead": "Cet espace est réservé aux grands, réponds à ceci :",
      "gate.cancel": "Annuler",
      "gate.enter": "Entrer",

      "parent.title": "Tableau de bord parent",
      "parent.close": "Fermer",
      "parent.progressH": "Progression",
      "stat.mastered": "Mots maîtrisés",
      "stat.practiced": "Mots travaillés",
      "stat.stars": "Étoiles au total",
      "stat.sessions": "Séances",
      "parent.curriculum": "{p} % du programme {bank} de {n} mots maîtrisé · identique pour tous les thèmes.",
      "parent.pathH": "Parcours d'apprentissage",
      "parent.level": "Niveau {n}",
      "parent.ofTotal": "sur {n}",
      "parent.metSoFar": "mots rencontrés",
      "parent.fullyMastered": "entièrement maîtrisés",
      "parent.pathNote": "Les mots suivent un ordre fixe — du plus simple au plus difficile, tous thèmes mélangés — plutôt que d'être tirés au hasard. Environ un tour sur deux introduit un nouveau mot ; les tours intermédiaires révisent le mot le plus fragile, si bien que le vocabulaire s'enrichit sans que les mots anciens s'oublient. Un mot n'est jamais répété deux fois dans la même séance.",
      "parent.themeUseH": "Utilisation des thèmes",
      "parent.themeNote": "Le choix du thème ne reflète qu'un goût. LetterLand n'en déduit jamais le genre, les capacités ou la personnalité de l'enfant.",
      "parent.picturesH": "Images des mots",
      "parent.picturesNote": "Les photographies proviennent de Wikimedia Commons sous licence libre et sont stockées dans l'application, donc utilisables hors ligne. Les mots sans photo adaptée affichent un symbole à la place. ",
      "parent.credits": "Voir tous les crédits d'images",
      "parent.sessionH": "Séance et apprentissage",
      "parent.bankNote": "En cours : {bank} — {n} mots anglais. De 6 à 9 ans, l'enfant écrit de mémoire à partir de l'image et de la définition ; de 2 à 5 ans, il recopie le mot affiché. Chaque mot est un nom concret, donc toujours illustrable par une seule image. La progression est conservée séparément pour chaque tranche d'âge : changer ne fait rien perdre.",
      "parent.interest": "Thème du vocabulaire",
      "parent.langNote": "Les menus, les consignes écrites et les consignes parlées utilisent cette langue. Le vocabulaire, lui, reste toujours en anglais — c'est tout l'objet du jeu.",
      "parent.themeH": "Réglages des thèmes",
      "parent.activeTheme": "Thème actif",
      "parent.availThemes": "Thèmes proposés à l'enfant",
      "parent.canSwitch": "L'enfant peut changer de monde",
      "parent.comfortH": "Confort et accessibilité",
      "parent.done": "Terminé",
      "parent.rerun": "Refaire le choix du monde",
      "parent.reset": "Tout réinitialiser",
      "parent.resetConfirm": "Réinitialiser toute la progression et les réglages ? Cette action est irréversible.",

      "bank.early": "Petits Apprentis",
      "bank.explorer": "Explorateurs de mots",

      "cat.early.any": "Un peu de tout",
      "cat.early.animals": "Animaux",
      "cat.early.food": "Nourriture",
      "cat.early.nature": "Nature",
      "cat.early.vehicles": "Véhicules",
      "cat.early.home": "À la maison",
      "cat.early.body": "Mon corps",
      "cat.early.space": "Espace et trésors",

      "cat.explorer.any": "Un peu de tout",
      "cat.explorer.animals": "Animaux",
      "cat.explorer.nature": "Nature et paysages",
      "cat.explorer.weather": "Météo et saisons",
      "cat.explorer.space": "Espace",
      "cat.explorer.places": "Lieux et géographie",
      "cat.explorer.science": "Sciences et machines",
      "cat.explorer.body": "Corps et santé",
      "cat.explorer.food": "Cuisine et nourriture",
      "cat.explorer.school": "École et langue",
      "cat.explorer.sports": "Sports et jeux",
      "cat.explorer.art": "Musique et art",
      "cat.explorer.jobs": "Métiers et gens",
      "cat.explorer.transport": "Transports et voyages",
      "cat.explorer.home": "Maison et outils",
      "cat.explorer.clothes": "Vêtements",
      "cat.explorer.history": "Histoire et monde",
      "cat.explorer.money": "Argent et achats",
      "cat.explorer.community": "Vie de quartier et sécurité",
      "cat.explorer.tech": "Technologie",
      "cat.explorer.myths": "Contes et mythes",

      "theme.sparkle.name": "Jardin Scintillant",
      "theme.sparkle.tagline": "Fleurs, joyaux et magie",
      "theme.sparkle.complete": "Une étoile lumineuse s'élève au-dessus du jardin et répand des paillettes !",
      "theme.mechanical.name": "Labo Mécanique",
      "theme.mechanical.tagline": "Engrenages, robots et machines",
      "theme.mechanical.complete": "Des bras mécaniques verrouillent la pièce dans un clac très satisfaisant !",
      "theme.animal.name": "Aventure Animale",
      "theme.animal.tagline": "Forêts, fermes et amis",
      "theme.animal.complete": "Tes amis les animaux applaudissent et bondissent dans la prairie !",
      "theme.space.name": "Explorateur de l'Espace",
      "theme.space.tagline": "Fusées, planètes et étoiles",
      "theme.space.complete": "Une fusée file vers la Lune et y plante le drapeau de LetterLand !",
      "theme.neutral.name": "Départ Tranquille",
      "theme.neutral.tagline": "Un monde tout doux par défaut",
      "theme.neutral.complete": "Bravo ! Un arc-en-ciel traverse le ciel.",

      "audio.newWord": "Un nouveau mot.",
      "audio.spellWord": "Écris le mot.",
      "audio.whichFits": "Quel mot convient ?",
      "audio.findLetter": "Trouve la lettre",
      "audio.startsWith": "Par quelle lettre ça commence ?",
      "audio.whichMissing": "Quelle lettre manque ?",
      "audio.yes": "Oui !"
    },

    /* =================================================================== */
    de: {
      "app.title": "LetterLand — Englisch lesen und schreiben lernen",
      "app.desc": "Eine verspielte App zum englischen Lesen und Rechtschreiben für Kinder. Kostenlos, privat und offline nutzbar.",

      "brand.setup": "Eltern-Einrichtung",
      "setup.lead": "Richte die App für dein Kind ein. Weder Name noch Konto oder Geschlecht sind nötig — deine Welt wählt dein Kind gleich selbst.",
      "setup.english": "LetterLand übt englisches Lesen und Rechtschreiben. Menüs und Anweisungen folgen der hier gewählten Sprache — die Wörter, die dein Kind lernt, sind immer englisch.",
      "setup.ageNote": "Ab 6 Jahren öffnen sich die Wort-Entdecker: {n} englische Wörter, aus dem Gedächtnis geschrieben, mit Bildern und Bedeutungen.",

      "field.language": "App-Sprache",
      "field.age": "Altersgruppe",
      "field.session": "Länge einer Runde",
      "field.keyboard": "Tastatur",
      "field.interest": "Was klingt spannend?",
      "field.motion": "Bewegung",
      "field.sound": "Ton",
      "field.decoration": "Deko",

      "opt.min": "{n} Min.",
      "opt.onscreen": "Auf dem Bildschirm",
      "opt.external": "Externe Tastatur",
      "opt.motionFull": "Volle Bewegung",
      "opt.motionReduced": "Weniger Bewegung",
      "opt.motionFullShort": "Voll",
      "opt.motionReducedShort": "Reduziert",
      "opt.soundFull": "Laut",
      "opt.soundLow": "Leise",
      "opt.soundOff": "Aus",
      "opt.decorSimple": "Schlicht",
      "opt.decorStandard": "Normal",
      "opt.decorExtra": "Besonders verspielt",
      "opt.decorExtraShort": "Extra",
      "opt.yes": "Ja",
      "opt.noFixed": "Nein (fest)",

      "badge.words": "{n} Wörter",
      "btn.continue": "Weiter →",

      "world.q": "In welcher Welt möchtest du spielen?",
      "world.play": "Hier spielen ▶",
      "preview.head": "Vorschau: {name}",
      "preview.hearWord": "🔊 Wort anhören",
      "preview.hearReward": "✨ Belohnung anhören",

      "avatar.q": "Wähle deinen Begleiter!",
      "avatar.go": "Los geht's! ▶",

      "home.parent": "Elternbereich",
      "home.play": "Spielen",
      "home.world": "Meine Welt",
      "home.level": "Stufe {n} · {a} von {b} neuen Wörtern",
      "act.home": "Start",

      "mode.find": "Finde den Buchstaben",
      "mode.first": "Erster Buchstabe",
      "mode.missing": "Fehlender Buchstabe",
      "mode.spell": "Schreib das Wort",
      "mode.study": "Neues Wort",
      "mode.spellblind": "Aus dem Gedächtnis",
      "mode.clue": "Wie heißt das Wort?",

      "tool.listen": "🔊 Anhören",
      "tool.hint": "💡 Tipp",

      "prompt.copy": "Ein neues Wort — schreib es ab",
      "prompt.clue": "Welches Wort passt? {n} Buchstaben",
      "prompt.memory": "Schreib es aus dem Gedächtnis — {n} Buchstaben",
      "prompt.spell": "Schreibe",
      "prompt.first": "Mit welchem Buchstaben beginnt es?",
      "prompt.find": "Finde den Buchstaben",
      "prompt.missing": "Welcher Buchstabe fehlt?",

      "key.erase": "⌫ Löschen",
      "key.check": "✓ Prüfen",

      "celebrate.next": "Nächstes Wort kommt …",
      "done.title": "Toll gespielt!",
      "done.stats": "{w} Wörter · +{s} Sterne",
      "done.home": "🏠 Start",
      "done.again": "▶ Nochmal spielen",

      "gate.title": "🔒 Eltern-Check",
      "gate.lead": "Damit dieser Bereich den Großen gehört, beantworte bitte:",
      "gate.cancel": "Abbrechen",
      "gate.enter": "Weiter",

      "parent.title": "Eltern-Übersicht",
      "parent.close": "Schließen",
      "parent.progressH": "Lernfortschritt",
      "stat.mastered": "Wörter beherrscht",
      "stat.practiced": "Wörter geübt",
      "stat.stars": "Sterne insgesamt",
      "stat.sessions": "Runden",
      "parent.curriculum": "{p} % des {n}-Wörter-Lehrplans {bank} beherrscht · für jedes Thema gleich.",
      "parent.pathH": "Lernweg",
      "parent.level": "Stufe {n}",
      "parent.ofTotal": "von {n}",
      "parent.metSoFar": "Wörter bisher begegnet",
      "parent.fullyMastered": "ganz beherrscht",
      "parent.pathNote": "Die Wörter folgen einer festen Lehrplan-Reihenfolge — leichteste zuerst, quer durch die Themen gemischt — statt zufällig gezogen zu werden. Etwa jede zweite Runde führt das nächste neue Wort ein, die Runden dazwischen wiederholen jeweils das schwächste frühere Wort. So kommt ständig neuer Wortschatz dazu, ohne dass Altes vergessen wird. Innerhalb einer Runde wiederholt sich kein Wort.",
      "parent.themeUseH": "Themen-Nutzung",
      "parent.themeNote": "Die Themenwahl zeigt nur Interesse. LetterLand leitet daraus niemals Geschlecht, Fähigkeiten oder Persönlichkeit ab.",
      "parent.picturesH": "Wortbilder",
      "parent.picturesNote": "Die Fotos stammen unter freien Lizenzen von Wikimedia Commons und liegen in der App, funktionieren also offline. Wörter ohne passendes Foto zeigen stattdessen ein Bildsymbol. ",
      "parent.credits": "Alle Bildnachweise ansehen",
      "parent.sessionH": "Runde & Lernen",
      "parent.bankNote": "Gerade aktiv: {bank} — {n} englische Wörter. Mit 6 bis 9 Jahren schreibt das Kind aus dem Gedächtnis, gestützt auf Bild und Bedeutung; mit 2 bis 5 Jahren schreibt es das Wort vom Bildschirm ab. Jedes Wort ist ein konkretes Substantiv und lässt sich daher immer als ein Bild zeigen. Der Fortschritt wird je Altersgruppe getrennt gespeichert — beim Wechseln geht nichts verloren.",
      "parent.interest": "Wortschatz-Interesse",
      "parent.langNote": "Menüs, geschriebene und gesprochene Anweisungen nutzen diese Sprache. Der Wortschatz selbst bleibt immer englisch — genau darum geht es im Spiel.",
      "parent.themeH": "Themen-Einstellungen",
      "parent.activeTheme": "Aktives Thema",
      "parent.availThemes": "Für das Kind verfügbare Themen",
      "parent.canSwitch": "Kind darf die Welt wechseln",
      "parent.comfortH": "Komfort & Barrierefreiheit",
      "parent.done": "Fertig",
      "parent.rerun": "Welt neu einrichten",
      "parent.reset": "Alles zurücksetzen",
      "parent.resetConfirm": "Allen Fortschritt und alle Einstellungen zurücksetzen? Das lässt sich nicht rückgängig machen.",

      "bank.early": "Kleine Lerner",
      "bank.explorer": "Wort-Entdecker",

      "cat.early.any": "Von allem etwas",
      "cat.early.animals": "Tiere",
      "cat.early.food": "Essen",
      "cat.early.nature": "Natur",
      "cat.early.vehicles": "Fahrzeuge",
      "cat.early.home": "Sachen zu Hause",
      "cat.early.body": "Mein Körper",
      "cat.early.space": "Weltraum & Schätze",

      "cat.explorer.any": "Von allem etwas",
      "cat.explorer.animals": "Tiere",
      "cat.explorer.nature": "Natur & Landschaften",
      "cat.explorer.weather": "Wetter & Jahreszeiten",
      "cat.explorer.space": "Weltraum",
      "cat.explorer.places": "Orte & Geografie",
      "cat.explorer.science": "Wissenschaft & Maschinen",
      "cat.explorer.body": "Körper & Gesundheit",
      "cat.explorer.food": "Essen & Kochen",
      "cat.explorer.school": "Schule & Sprache",
      "cat.explorer.sports": "Sport & Spiele",
      "cat.explorer.art": "Musik & Kunst",
      "cat.explorer.jobs": "Berufe & Menschen",
      "cat.explorer.transport": "Verkehr & Reisen",
      "cat.explorer.home": "Haus & Werkzeug",
      "cat.explorer.clothes": "Kleidung",
      "cat.explorer.history": "Geschichte & Welt",
      "cat.explorer.money": "Geld & Einkaufen",
      "cat.explorer.community": "Gemeinde & Sicherheit",
      "cat.explorer.tech": "Technik",
      "cat.explorer.myths": "Geschichten & Mythen",

      "theme.sparkle.name": "Funkelgarten",
      "theme.sparkle.tagline": "Blumen, Edelsteine und Magie",
      "theme.sparkle.complete": "Ein leuchtender Stern steigt über den Garten und lässt Funken regnen!",
      "theme.mechanical.name": "Maschinenlabor",
      "theme.mechanical.tagline": "Zahnräder, Roboter und Maschinen",
      "theme.mechanical.complete": "Roboterarme rasten das Teil mit einem satten Klacken ein!",
      "theme.animal.name": "Tierabenteuer",
      "theme.animal.tagline": "Wälder, Höfe und Freunde",
      "theme.animal.complete": "Deine Tierfreunde jubeln und hüpfen über die Wiese!",
      "theme.space.name": "Weltraumforscher",
      "theme.space.tagline": "Raketen, Planeten und Sterne",
      "theme.space.complete": "Eine Rakete fliegt zum Mond und steckt die LetterLand-Flagge auf!",
      "theme.neutral.name": "Ruhiger Start",
      "theme.neutral.tagline": "Eine sanfte Standardwelt",
      "theme.neutral.complete": "Super gemacht! Ein Regenbogen spannt sich über den Himmel.",

      "audio.newWord": "Ein neues Wort.",
      "audio.spellWord": "Schreib das Wort.",
      "audio.whichFits": "Welches Wort passt?",
      "audio.findLetter": "Finde den Buchstaben",
      "audio.startsWith": "Mit welchem Buchstaben beginnt es?",
      "audio.whichMissing": "Welcher Buchstabe fehlt?",
      "audio.yes": "Ja!"
    },

    /* =================================================================== */
    ko: {
      "app.title": "LetterLand — 영어 읽기와 철자 배우기",
      "app.desc": "아이를 위한 즐거운 영어 읽기·철자 앱. 무료이고, 데이터가 기기에만 남으며, 오프라인에서도 됩니다.",

      "brand.setup": "보호자 설정",
      "setup.lead": "아이에 맞게 설정해 주세요. 이름도 계정도 성별도 필요하지 않습니다 — 세계는 아이가 직접 고릅니다.",
      "setup.english": "LetterLand는 영어 읽기와 철자를 가르칩니다. 메뉴와 안내는 여기서 고른 언어로 나오지만, 아이가 배우는 단어는 언제나 영어입니다.",
      "setup.ageNote": "6~9세가 되면 단어 탐험가가 열립니다: 그림과 뜻을 보고 기억만으로 쓰는 영어 단어 {n}개.",

      "field.language": "앱 언어",
      "field.age": "연령대",
      "field.session": "한 판 길이",
      "field.keyboard": "키보드",
      "field.interest": "무엇이 재미있을까?",
      "field.motion": "움직임",
      "field.sound": "소리",
      "field.decoration": "장식",

      "opt.min": "{n}분",
      "opt.onscreen": "화면 키보드",
      "opt.external": "외장 키보드",
      "opt.motionFull": "움직임 많게",
      "opt.motionReduced": "움직임 적게",
      "opt.motionFullShort": "많게",
      "opt.motionReducedShort": "적게",
      "opt.soundFull": "크게",
      "opt.soundLow": "작게",
      "opt.soundOff": "끄기",
      "opt.decorSimple": "단순하게",
      "opt.decorStandard": "보통",
      "opt.decorExtra": "아주 화려하게",
      "opt.decorExtraShort": "화려하게",
      "opt.yes": "예",
      "opt.noFixed": "아니요 (고정)",

      "badge.words": "{n}개 단어",
      "btn.continue": "계속 →",

      "world.q": "어떤 세계에서 놀고 싶나요?",
      "world.play": "여기서 놀기 ▶",
      "preview.head": "미리보기: {name}",
      "preview.hearWord": "🔊 단어 들어보기",
      "preview.hearReward": "✨ 칭찬 소리 듣기",

      "avatar.q": "친구를 골라 봐!",
      "avatar.go": "출발! ▶",

      "home.parent": "보호자 공간",
      "home.play": "놀기",
      "home.world": "내 세계",
      "home.level": "레벨 {n} · 새 단어 {b}개 중 {a}개",
      "act.home": "홈",

      "mode.find": "글자 찾기",
      "mode.first": "첫 글자",
      "mode.missing": "빠진 글자",
      "mode.spell": "단어 쓰기",
      "mode.study": "새 단어",
      "mode.spellblind": "기억해서 쓰기",
      "mode.clue": "무슨 단어일까?",

      "tool.listen": "🔊 듣기",
      "tool.hint": "💡 힌트",

      "prompt.copy": "새 단어예요 — 따라 써 보세요",
      "prompt.clue": "어떤 단어일까요? {n}글자",
      "prompt.memory": "기억해서 써 보세요 — {n}글자",
      "prompt.spell": "써 보세요",
      "prompt.first": "어떤 글자로 시작할까요?",
      "prompt.find": "글자를 찾아보세요",
      "prompt.missing": "어떤 글자가 빠졌을까요?",

      "key.erase": "⌫ 지우기",
      "key.check": "✓ 확인",

      "celebrate.next": "다음 단어가 나와요…",
      "done.title": "정말 잘했어요!",
      "done.stats": "단어 {w}개 · 별 +{s}개",
      "done.home": "🏠 홈",
      "done.again": "▶ 한 번 더",

      "gate.title": "🔒 보호자 확인",
      "gate.lead": "이곳은 어른을 위한 공간이에요. 다음을 풀어 주세요:",
      "gate.cancel": "취소",
      "gate.enter": "들어가기",

      "parent.title": "보호자 대시보드",
      "parent.close": "닫기",
      "parent.progressH": "학습 진행",
      "stat.mastered": "완전히 익힌 단어",
      "stat.practiced": "연습한 단어",
      "stat.stars": "전체 별",
      "stat.sessions": "놀이 횟수",
      "parent.curriculum": "{n}개 단어 {bank} 과정의 {p}% 완료 · 모든 테마에서 동일합니다.",
      "parent.pathH": "학습 경로",
      "parent.level": "레벨 {n}",
      "parent.ofTotal": "전체 {n}",
      "parent.metSoFar": "지금까지 만난 단어",
      "parent.fullyMastered": "완전히 익힘",
      "parent.pathNote": "단어는 무작위로 뽑히지 않고 정해진 과정 순서를 따릅니다 — 쉬운 것부터, 여러 주제를 섞어서. 대략 두 번에 한 번은 다음 새 단어가 나오고, 그 사이 차례에는 가장 약한 이전 단어를 복습합니다. 그래서 새 어휘가 계속 늘면서도 배운 단어를 잊지 않습니다. 한 판 안에서 같은 단어가 반복되는 일은 없습니다.",
      "parent.themeUseH": "테마 사용",
      "parent.themeNote": "테마 선택은 취향일 뿐입니다. LetterLand는 이를 근거로 성별이나 능력, 성격을 추측하지 않습니다.",
      "parent.picturesH": "단어 그림",
      "parent.picturesNote": "사진은 자유 라이선스로 Wikimedia Commons에서 가져와 앱 안에 저장되므로 오프라인에서도 보입니다. 알맞은 사진이 없는 단어는 그림 기호로 대신합니다. ",
      "parent.credits": "모든 이미지 출처 보기",
      "parent.sessionH": "놀이와 학습",
      "parent.bankNote": "지금 사용 중: {bank} — 영어 단어 {n}개. 6~9세는 그림과 뜻만 보고 기억해서 쓰고, 2~5세는 화면의 단어를 보고 따라 씁니다. 모든 단어가 구체적인 명사라서 언제나 그림 하나로 보여 줄 수 있습니다. 진행 상황은 연령대별로 따로 저장되므로 바꿔도 잃는 것이 없습니다.",
      "parent.interest": "어휘 관심 분야",
      "parent.langNote": "메뉴와 글·음성 안내가 이 언어로 나옵니다. 어휘 자체는 언제나 영어입니다 — 그것이 이 게임의 목적입니다.",
      "parent.themeH": "테마 설정",
      "parent.activeTheme": "현재 테마",
      "parent.availThemes": "아이가 고를 수 있는 테마",
      "parent.canSwitch": "아이가 세계를 바꿀 수 있음",
      "parent.comfortH": "편안함과 접근성",
      "parent.done": "완료",
      "parent.rerun": "세계 설정 다시 하기",
      "parent.reset": "전체 초기화",
      "parent.resetConfirm": "모든 진행 상황과 설정을 초기화할까요? 되돌릴 수 없습니다.",

      "bank.early": "꼬마 학습자",
      "bank.explorer": "단어 탐험가",

      "cat.early.any": "이것저것 조금씩",
      "cat.early.animals": "동물",
      "cat.early.food": "음식",
      "cat.early.nature": "자연",
      "cat.early.vehicles": "탈것",
      "cat.early.home": "집 안 물건",
      "cat.early.body": "내 몸",
      "cat.early.space": "우주와 보물",

      "cat.explorer.any": "이것저것 조금씩",
      "cat.explorer.animals": "동물",
      "cat.explorer.nature": "자연과 풍경",
      "cat.explorer.weather": "날씨와 계절",
      "cat.explorer.space": "우주",
      "cat.explorer.places": "장소와 지리",
      "cat.explorer.science": "과학과 기계",
      "cat.explorer.body": "몸과 건강",
      "cat.explorer.food": "음식과 요리",
      "cat.explorer.school": "학교와 언어",
      "cat.explorer.sports": "운동과 놀이",
      "cat.explorer.art": "음악과 미술",
      "cat.explorer.jobs": "직업과 사람",
      "cat.explorer.transport": "교통과 여행",
      "cat.explorer.home": "집과 도구",
      "cat.explorer.clothes": "옷",
      "cat.explorer.history": "역사와 세계",
      "cat.explorer.money": "돈과 쇼핑",
      "cat.explorer.community": "마을과 안전",
      "cat.explorer.tech": "기술",
      "cat.explorer.myths": "이야기와 신화",

      "theme.sparkle.name": "반짝이 정원",
      "theme.sparkle.tagline": "꽃과 보석과 마법",
      "theme.sparkle.complete": "빛나는 별이 정원 위로 떠올라 반짝이를 뿌려요!",
      "theme.mechanical.name": "기계 실험실",
      "theme.mechanical.tagline": "톱니바퀴와 로봇과 기계",
      "theme.mechanical.complete": "로봇 팔이 부품을 철컥 하고 제자리에 끼워 넣어요!",
      "theme.animal.name": "동물 모험",
      "theme.animal.tagline": "숲과 농장과 친구들",
      "theme.animal.complete": "동물 친구들이 환호하며 들판을 폴짝폴짝 뛰어다녀요!",
      "theme.space.name": "우주 탐험가",
      "theme.space.tagline": "로켓과 행성과 별",
      "theme.space.complete": "로켓이 달까지 날아가 LetterLand 깃발을 꽂아요!",
      "theme.neutral.name": "편안한 시작",
      "theme.neutral.tagline": "부드러운 기본 세계",
      "theme.neutral.complete": "잘했어요! 하늘에 무지개가 걸렸어요.",

      "audio.newWord": "새로운 단어예요.",
      "audio.spellWord": "단어를 써 보세요.",
      "audio.whichFits": "어떤 단어가 어울릴까요?",
      "audio.findLetter": "글자를 찾아보세요",
      "audio.startsWith": "어떤 글자로 시작할까요?",
      "audio.whichMissing": "어떤 글자가 빠졌을까요?",
      "audio.yes": "맞았어요!"
    },

    /* =================================================================== */
    "zh-cn": {
      "app.title": "LetterLand — 学英语阅读与拼写",
      "app.desc": "给孩子的英语阅读与拼写游戏。免费、私密，离线也能玩。",

      "brand.setup": "家长设置",
      "setup.lead": "为孩子做好设置。不需要姓名、账号或性别 —— 接下来由孩子自己挑选世界。",
      "setup.english": "LetterLand 教的是英语阅读和拼写。菜单和提示会用你在这里选的语言，但孩子学的单词始终是英语。",
      "setup.ageNote": "6–9 岁可解锁「单词探险家」：{n} 个英语单词，看图和释义凭记忆拼写。",

      "field.language": "应用语言",
      "field.age": "年龄段",
      "field.session": "每次时长",
      "field.keyboard": "键盘",
      "field.interest": "你喜欢什么？",
      "field.motion": "动画",
      "field.sound": "声音",
      "field.decoration": "装饰",

      "opt.min": "{n} 分钟",
      "opt.onscreen": "屏幕键盘",
      "opt.external": "外接键盘",
      "opt.motionFull": "完整动画",
      "opt.motionReduced": "减少动画",
      "opt.motionFullShort": "完整",
      "opt.motionReducedShort": "减少",
      "opt.soundFull": "响亮",
      "opt.soundLow": "轻柔",
      "opt.soundOff": "关闭",
      "opt.decorSimple": "简洁",
      "opt.decorStandard": "标准",
      "opt.decorExtra": "特别热闹",
      "opt.decorExtraShort": "热闹",
      "opt.yes": "可以",
      "opt.noFixed": "不可以（固定）",

      "badge.words": "{n} 个单词",
      "btn.continue": "继续 →",

      "world.q": "你想在哪个世界里玩？",
      "world.play": "就在这里玩 ▶",
      "preview.head": "预览：{name}",
      "preview.hearWord": "🔊 听一个单词",
      "preview.hearReward": "✨ 听奖励音",

      "avatar.q": "选一个小伙伴！",
      "avatar.go": "出发！▶",

      "home.parent": "家长专区",
      "home.play": "开始玩",
      "home.world": "我的世界",
      "home.level": "第 {n} 关 · 新单词 {a}/{b}",
      "act.home": "首页",

      "mode.find": "找字母",
      "mode.first": "第一个字母",
      "mode.missing": "缺了的字母",
      "mode.spell": "拼出单词",
      "mode.study": "新单词",
      "mode.spellblind": "凭记忆拼写",
      "mode.clue": "是哪个单词？",

      "tool.listen": "🔊 听一听",
      "tool.hint": "💡 提示",

      "prompt.copy": "一个新单词 —— 照着拼一遍",
      "prompt.clue": "哪个单词合适？{n} 个字母",
      "prompt.memory": "凭记忆拼出来 —— {n} 个字母",
      "prompt.spell": "拼出",
      "prompt.first": "它以哪个字母开头？",
      "prompt.find": "找出这个字母",
      "prompt.missing": "缺了哪个字母？",

      "key.erase": "⌫ 删除",
      "key.check": "✓ 检查",

      "celebrate.next": "下一个单词来啦…",
      "done.title": "玩得真棒！",
      "done.stats": "{w} 个单词 · +{s} 颗星",
      "done.home": "🏠 首页",
      "done.again": "▶ 再玩一次",

      "gate.title": "🔒 家长验证",
      "gate.lead": "这里是大人的区域，请先回答：",
      "gate.cancel": "取消",
      "gate.enter": "进入",

      "parent.title": "家长面板",
      "parent.close": "关闭",
      "parent.progressH": "学习进度",
      "stat.mastered": "已掌握单词",
      "stat.practiced": "练过的单词",
      "stat.stars": "累计星星",
      "stat.sessions": "游戏次数",
      "parent.curriculum": "{n} 个单词的「{bank}」课程已掌握 {p}% · 所有主题都一样。",
      "parent.pathH": "学习路径",
      "parent.level": "第 {n} 关",
      "parent.ofTotal": "共 {n} 关",
      "parent.metSoFar": "已见过的单词",
      "parent.fullyMastered": "完全掌握",
      "parent.pathNote": "单词不是随机抽取的，而是按固定的课程顺序出现 —— 由易到难，各主题穿插。大约每两轮就引入一个新单词，中间的一轮复习掌握得最弱的旧单词，这样新词不断增加，旧词也不会遗忘。同一次游戏中不会重复同一个单词。",
      "parent.themeUseH": "主题使用情况",
      "parent.themeNote": "主题选择只反映兴趣。LetterLand 绝不会据此推断孩子的性别、能力或性格。",
      "parent.picturesH": "单词配图",
      "parent.picturesNote": "照片以自由许可来自 Wikimedia Commons，并存放在应用内，因此离线也能显示。没有合适照片的单词会改用图形符号。",
      "parent.credits": "查看全部图片来源",
      "parent.sessionH": "游戏与学习",
      "parent.bankNote": "当前使用：{bank} —— {n} 个英语单词。6–9 岁看图和释义凭记忆拼写；2–5 岁照着屏幕上的单词拼。每个单词都是具体名词，所以总能用一张图表示。各年龄段的进度分开保存，切换不会丢失。",
      "parent.interest": "词汇兴趣方向",
      "parent.langNote": "菜单、文字提示和语音提示都使用这个语言。词汇本身始终是英语 —— 这正是这个游戏的目的。",
      "parent.themeH": "主题设置",
      "parent.activeTheme": "当前主题",
      "parent.availThemes": "孩子可选的主题",
      "parent.canSwitch": "允许孩子切换世界",
      "parent.comfortH": "舒适度与无障碍",
      "parent.done": "完成",
      "parent.rerun": "重新选择世界",
      "parent.reset": "全部重置",
      "parent.resetConfirm": "重置全部进度和设置？此操作无法撤销。",

      "bank.early": "小小启蒙",
      "bank.explorer": "单词探险家",

      "cat.early.any": "什么都来一点",
      "cat.early.animals": "动物",
      "cat.early.food": "食物",
      "cat.early.nature": "大自然",
      "cat.early.vehicles": "车辆",
      "cat.early.home": "家里的东西",
      "cat.early.body": "我的身体",
      "cat.early.space": "太空与宝藏",

      "cat.explorer.any": "什么都来一点",
      "cat.explorer.animals": "动物",
      "cat.explorer.nature": "自然与地貌",
      "cat.explorer.weather": "天气与季节",
      "cat.explorer.space": "太空",
      "cat.explorer.places": "地点与地理",
      "cat.explorer.science": "科学与机械",
      "cat.explorer.body": "身体与健康",
      "cat.explorer.food": "食物与烹饪",
      "cat.explorer.school": "学校与语言",
      "cat.explorer.sports": "运动与游戏",
      "cat.explorer.art": "音乐与艺术",
      "cat.explorer.jobs": "职业与人物",
      "cat.explorer.transport": "交通与旅行",
      "cat.explorer.home": "家居与工具",
      "cat.explorer.clothes": "衣物",
      "cat.explorer.history": "历史与世界",
      "cat.explorer.money": "金钱与购物",
      "cat.explorer.community": "社区与安全",
      "cat.explorer.tech": "科技",
      "cat.explorer.myths": "故事与神话",

      "theme.sparkle.name": "闪耀花园",
      "theme.sparkle.tagline": "花朵、宝石与魔法",
      "theme.sparkle.complete": "一颗发光的星星升上花园，洒下点点亮光！",
      "theme.mechanical.name": "机械工坊",
      "theme.mechanical.tagline": "齿轮、机器人与机械",
      "theme.mechanical.complete": "机械臂「咔哒」一声把零件稳稳装好！",
      "theme.animal.name": "动物大冒险",
      "theme.animal.tagline": "森林、农场与好朋友",
      "theme.animal.complete": "动物朋友们欢呼着蹦过草地！",
      "theme.space.name": "太空探险家",
      "theme.space.tagline": "火箭、行星与星星",
      "theme.space.complete": "火箭飞向月球，插上 LetterLand 的旗帜！",
      "theme.neutral.name": "安静起步",
      "theme.neutral.tagline": "柔和的默认世界",
      "theme.neutral.complete": "做得好！一道彩虹划过天空。",

      "audio.newWord": "一个新单词。",
      "audio.spellWord": "拼出这个单词。",
      "audio.whichFits": "哪个单词合适？",
      "audio.findLetter": "找出这个字母",
      "audio.startsWith": "它以哪个字母开头？",
      "audio.whichMissing": "缺了哪个字母？",
      "audio.yes": "答对了！"
    },

    /* =================================================================== */
    "zh-tw": {
      "app.title": "LetterLand — 學英語閱讀與拼字",
      "app.desc": "給孩子的英語閱讀與拼字遊戲。免費、私密，離線也能玩。",

      "brand.setup": "家長設定",
      "setup.lead": "為孩子做好設定。不需要姓名、帳號或性別 —— 接下來由孩子自己挑選世界。",
      "setup.english": "LetterLand 教的是英語閱讀和拼字。選單和提示會用你在這裡選的語言，但孩子學的單字始終是英語。",
      "setup.ageNote": "6–9 歲可解鎖「單字探險家」：{n} 個英語單字，看圖和釋義憑記憶拼寫。",

      "field.language": "應用程式語言",
      "field.age": "年齡層",
      "field.session": "每次時長",
      "field.keyboard": "鍵盤",
      "field.interest": "你喜歡什麼？",
      "field.motion": "動畫",
      "field.sound": "聲音",
      "field.decoration": "裝飾",

      "opt.min": "{n} 分鐘",
      "opt.onscreen": "螢幕鍵盤",
      "opt.external": "外接鍵盤",
      "opt.motionFull": "完整動畫",
      "opt.motionReduced": "減少動畫",
      "opt.motionFullShort": "完整",
      "opt.motionReducedShort": "減少",
      "opt.soundFull": "響亮",
      "opt.soundLow": "輕柔",
      "opt.soundOff": "關閉",
      "opt.decorSimple": "簡潔",
      "opt.decorStandard": "標準",
      "opt.decorExtra": "特別熱鬧",
      "opt.decorExtraShort": "熱鬧",
      "opt.yes": "可以",
      "opt.noFixed": "不可以（固定）",

      "badge.words": "{n} 個單字",
      "btn.continue": "繼續 →",

      "world.q": "你想在哪個世界裡玩？",
      "world.play": "就在這裡玩 ▶",
      "preview.head": "預覽：{name}",
      "preview.hearWord": "🔊 聽一個單字",
      "preview.hearReward": "✨ 聽獎勵音",

      "avatar.q": "選一個小夥伴！",
      "avatar.go": "出發！▶",

      "home.parent": "家長專區",
      "home.play": "開始玩",
      "home.world": "我的世界",
      "home.level": "第 {n} 關 · 新單字 {a}/{b}",
      "act.home": "首頁",

      "mode.find": "找字母",
      "mode.first": "第一個字母",
      "mode.missing": "少了的字母",
      "mode.spell": "拼出單字",
      "mode.study": "新單字",
      "mode.spellblind": "憑記憶拼寫",
      "mode.clue": "是哪個單字？",

      "tool.listen": "🔊 聽一聽",
      "tool.hint": "💡 提示",

      "prompt.copy": "一個新單字 —— 照著拼一遍",
      "prompt.clue": "哪個單字合適？{n} 個字母",
      "prompt.memory": "憑記憶拼出來 —— {n} 個字母",
      "prompt.spell": "拼出",
      "prompt.first": "它以哪個字母開頭？",
      "prompt.find": "找出這個字母",
      "prompt.missing": "少了哪個字母？",

      "key.erase": "⌫ 刪除",
      "key.check": "✓ 檢查",

      "celebrate.next": "下一個單字來囉…",
      "done.title": "玩得真棒！",
      "done.stats": "{w} 個單字 · +{s} 顆星",
      "done.home": "🏠 首頁",
      "done.again": "▶ 再玩一次",

      "gate.title": "🔒 家長驗證",
      "gate.lead": "這裡是大人的區域，請先回答：",
      "gate.cancel": "取消",
      "gate.enter": "進入",

      "parent.title": "家長面板",
      "parent.close": "關閉",
      "parent.progressH": "學習進度",
      "stat.mastered": "已精熟單字",
      "stat.practiced": "練過的單字",
      "stat.stars": "累計星星",
      "stat.sessions": "遊戲次數",
      "parent.curriculum": "{n} 個單字的「{bank}」課程已精熟 {p}% · 所有主題都一樣。",
      "parent.pathH": "學習路徑",
      "parent.level": "第 {n} 關",
      "parent.ofTotal": "共 {n} 關",
      "parent.metSoFar": "已見過的單字",
      "parent.fullyMastered": "完全精熟",
      "parent.pathNote": "單字不是隨機抽取的，而是按固定的課程順序出現 —— 由易到難，各主題穿插。大約每兩輪就引入一個新單字，中間的一輪複習掌握得最弱的舊單字，這樣新字不斷增加，舊字也不會忘記。同一次遊戲中不會重複同一個單字。",
      "parent.themeUseH": "主題使用情況",
      "parent.themeNote": "主題選擇只反映興趣。LetterLand 絕不會據此推斷孩子的性別、能力或個性。",
      "parent.picturesH": "單字配圖",
      "parent.picturesNote": "照片以自由授權來自 Wikimedia Commons，並存放在應用程式內，因此離線也能顯示。沒有合適照片的單字會改用圖形符號。",
      "parent.credits": "查看全部圖片來源",
      "parent.sessionH": "遊戲與學習",
      "parent.bankNote": "目前使用：{bank} —— {n} 個英語單字。6–9 歲看圖和釋義憑記憶拼寫；2–5 歲照著螢幕上的單字拼。每個單字都是具體名詞，所以總能用一張圖表示。各年齡層的進度分開儲存，切換不會遺失。",
      "parent.interest": "詞彙興趣方向",
      "parent.langNote": "選單、文字提示和語音提示都使用這個語言。詞彙本身始終是英語 —— 這正是這個遊戲的目的。",
      "parent.themeH": "主題設定",
      "parent.activeTheme": "目前主題",
      "parent.availThemes": "孩子可選的主題",
      "parent.canSwitch": "允許孩子切換世界",
      "parent.comfortH": "舒適度與無障礙",
      "parent.done": "完成",
      "parent.rerun": "重新選擇世界",
      "parent.reset": "全部重設",
      "parent.resetConfirm": "重設全部進度和設定？此動作無法復原。",

      "bank.early": "小小啟蒙",
      "bank.explorer": "單字探險家",

      "cat.early.any": "什麼都來一點",
      "cat.early.animals": "動物",
      "cat.early.food": "食物",
      "cat.early.nature": "大自然",
      "cat.early.vehicles": "車輛",
      "cat.early.home": "家裡的東西",
      "cat.early.body": "我的身體",
      "cat.early.space": "太空與寶藏",

      "cat.explorer.any": "什麼都來一點",
      "cat.explorer.animals": "動物",
      "cat.explorer.nature": "自然與地貌",
      "cat.explorer.weather": "天氣與季節",
      "cat.explorer.space": "太空",
      "cat.explorer.places": "地點與地理",
      "cat.explorer.science": "科學與機械",
      "cat.explorer.body": "身體與健康",
      "cat.explorer.food": "食物與烹飪",
      "cat.explorer.school": "學校與語言",
      "cat.explorer.sports": "運動與遊戲",
      "cat.explorer.art": "音樂與藝術",
      "cat.explorer.jobs": "職業與人物",
      "cat.explorer.transport": "交通與旅行",
      "cat.explorer.home": "居家與工具",
      "cat.explorer.clothes": "衣物",
      "cat.explorer.history": "歷史與世界",
      "cat.explorer.money": "金錢與購物",
      "cat.explorer.community": "社區與安全",
      "cat.explorer.tech": "科技",
      "cat.explorer.myths": "故事與神話",

      "theme.sparkle.name": "閃耀花園",
      "theme.sparkle.tagline": "花朵、寶石與魔法",
      "theme.sparkle.complete": "一顆發光的星星升上花園，灑下點點亮光！",
      "theme.mechanical.name": "機械工坊",
      "theme.mechanical.tagline": "齒輪、機器人與機械",
      "theme.mechanical.complete": "機械手臂「喀噠」一聲把零件穩穩裝好！",
      "theme.animal.name": "動物大冒險",
      "theme.animal.tagline": "森林、農場與好朋友",
      "theme.animal.complete": "動物朋友們歡呼著蹦過草地！",
      "theme.space.name": "太空探險家",
      "theme.space.tagline": "火箭、行星與星星",
      "theme.space.complete": "火箭飛向月球，插上 LetterLand 的旗幟！",
      "theme.neutral.name": "安靜起步",
      "theme.neutral.tagline": "柔和的預設世界",
      "theme.neutral.complete": "做得好！一道彩虹劃過天空。",

      "audio.newWord": "一個新單字。",
      "audio.spellWord": "拼出這個單字。",
      "audio.whichFits": "哪個單字合適？",
      "audio.findLetter": "找出這個字母",
      "audio.startsWith": "它以哪個字母開頭？",
      "audio.whichMissing": "少了哪個字母？",
      "audio.yes": "答對了！"
    }
  };

  var SUPPORTED = WB.LANGS.map(function (l) { return l[0]; });

  // Map anything the browser or a link hands us onto a language we ship.
  // Regional Chinese variants are the awkward case: zh-HK/zh-MO/zh-Hant read
  // traditional characters, everything else under zh defaults to simplified.
  WB.normalizeLang = function (tag) {
    if (!tag) return null;
    var t = String(tag).toLowerCase().replace("_", "-");
    if (SUPPORTED.indexOf(t) !== -1) return t;
    if (t.indexOf("zh") === 0) {
      return /hant|-tw|-hk|-mo/.test(t) ? "zh-tw" : "zh-cn";
    }
    var base = t.split("-")[0];
    return SUPPORTED.indexOf(base) !== -1 ? base : null;
  };

  // Precedence: an explicit ?lang= link (that is how the localized landing
  // pages hand off), then whatever the parent last chose, then the browser.
  WB.detectLang = function (savedLang) {
    var q = null;
    try {
      q = new URLSearchParams(window.location.search).get("lang");
    } catch (e) { /* very old browser: fall through */ }
    var fromUrl = WB.normalizeLang(q);
    if (fromUrl) return fromUrl;
    if (savedLang && SUPPORTED.indexOf(savedLang) !== -1) return savedLang;
    var navLangs = (navigator.languages && navigator.languages.length)
      ? navigator.languages : [navigator.language];
    for (var i = 0; i < navLangs.length; i++) {
      var hit = WB.normalizeLang(navLangs[i]);
      if (hit) return hit;
    }
    return "en";
  };

  WB.lang = "en";

  WB.setLang = function (code) {
    WB.lang = SUPPORTED.indexOf(code) !== -1 ? code : "en";
    document.documentElement.setAttribute("lang", WB.lang);
    document.title = WB.t("app.title");
    return WB.lang;
  };

  // Speech tag for the interface voice. Word and letter audio ignores this and
  // always asks for English — the child is learning English pronunciation.
  WB.speechLang = function () { return SPEECH_LANG[WB.lang] || "en-US"; };

  /* Look up an interface string.
   *
   * `vars` fills {placeholders}. Missing keys fall back to English and then to
   * the key itself, so a gap shows up as readable text rather than "undefined".
   */
  function lookup(table, key, vars) {
    var s = table[key];
    if (s == null) s = STRINGS.en[key];
    if (s == null) return key;
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, function (m, name) {
      return vars[name] != null ? vars[name] : m;
    });
  }

  WB.t = function (key, vars) {
    return lookup(STRINGS[WB.lang] || STRINGS.en, key, vars);
  };

  // The English wording of a key regardless of the current language. Used for
  // spoken prompts when the device has no voice installed for the interface
  // language: an English sentence read by an English voice is understandable,
  // a Korean sentence read by an English voice is not.
  WB.tEn = function (key, vars) { return lookup(STRINGS.en, key, vars); };
})();

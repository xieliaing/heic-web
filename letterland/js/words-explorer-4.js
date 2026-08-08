/* LetterLand — Explorer vocabulary, batch 4 (ages 7-9).
 *
 * Fills out the thinner categories from batches 1-3: history, space, weather,
 * money, technology, myths, community, time and maths, plus more feelings,
 * action words and describing words.
 *
 * Row format: [WORD, emojiFallback, category, definition, cloze sentence]
 */
(function () {
  var raw = [
    // =====================================================================
    //  HISTORY & THE WORLD
    // =====================================================================
    ["VIKING", "🛶", "history", "A Norse seafarer and raider of a thousand years ago.", "A ___ longship was found in the mud."],
    ["SAMURAI", "⚔️", "history", "A warrior of old Japan bound by a strict code.", "The ___ bowed before the duel."],
    ["PARCHMENT", "📜", "history", "Treated animal skin written on before paper existed.", "The ___ had yellowed at the edges."],
    ["CATAPULT", "🏰", "history", "A machine that hurled stones at castle walls.", "The ___ flung rocks over the wall."],
    ["GALLEON", "⛵", "history", "A large sailing ship of centuries past.", "The ___ carried gold across the sea."],
    ["EMPEROR", "👑", "history", "A man who rules a group of many lands.", "The ___ ruled from a marble hall."],
    ["EMPRESS", "👑", "history", "A woman who rules a group of many lands.", "The ___ signed the order herself."],
    ["PEASANT", "🌾", "history", "A poor farm worker of long ago.", "Every ___ owed labour to the lord."],
    ["MERCHANT", "⚖️", "history", "A trader who buys and sells goods.", "The ___ travelled with twelve camels."],
    ["BLACKSMITH", "🔨", "history", "Someone who shapes iron at a forge.", "The ___ shod the whole team of horses."],
    ["ARCHER", "🏹", "history", "A soldier who fights with a bow.", "Every ___ loosed at once."],
    ["PILGRIM", "🚶", "history", "Someone travelling a long way to a holy place.", "Each ___ carried a staff."],
    ["MONARCH", "👑", "history", "A king or queen who rules a country.", "The ___ opened parliament."],
    ["NOBLE", "🎩", "history", "A person of high rank in old society.", "Each ___ held land from the crown."],
    ["MANUSCRIPT", "📜", "history", "A book or document written out by hand.", "Monks copied every ___."],
    ["PAPYRUS", "📃", "history", "An early writing sheet made from reeds.", "The ___ crumbled when touched."],
    ["OBELISK", "🗼", "history", "A tall four-sided stone pillar with a pointed top.", "The ___ was carved from one block."],
    ["SPHINX", "🦁", "history", "A stone figure with a lion's body and a human head.", "The ___ faces the sunrise."],
    ["COLOSSEUM", "🏛️", "history", "The great oval arena of ancient Rome.", "The ___ held fifty thousand people."],
    ["AQUEDUCT", "🌉", "history", "A bridge built to carry water across a valley.", "The Roman ___ still stands."],
    ["TAPESTRY", "🧵", "history", "A heavy cloth picture woven by hand.", "The ___ told the whole story."],
    ["DUNGEON", "🔒", "history", "A dark underground prison in a castle.", "The ___ had no windows at all."],
    ["MOAT", "🏰", "history", "A wide water-filled ditch round a castle.", "The ___ was full of green water."],
    ["TURRET", "🏰", "history", "A small tower on the corner of a building.", "An archer watched from the ___."],
    ["RAMPART", "🏰", "history", "A defensive bank of earth or stone.", "Soldiers paced the ___ all night."],
    ["ARMOURY", "🛡️", "history", "The room where weapons are stored.", "The ___ was kept locked."],
    ["ARCHIVE", "🗄️", "history", "A store of old records kept for the future.", "The letters are in the town ___."],
    ["ARTEFACT", "🏺", "history", "An object made by people long ago.", "Every ___ was numbered."],
    ["RUINS", "🏚️", "history", "What is left standing of an old broken building.", "We climbed over the ___."],

    // =====================================================================
    //  SPACE
    // =====================================================================
    ["SATURN", "🪐", "space", "The ringed sixth world out from our star.", "___ has the brightest rings."],
    ["JUPITER", "🪐", "space", "The largest world in our family of planets.", "___ has a storm bigger than Earth."],
    ["MERCURY", "☄️", "space", "The smallest world and the closest to the sun.", "___ races round the sun in 88 days."],
    ["NEPTUNE", "🔵", "space", "The deep blue world farthest out from our star.", "___ has supersonic winds."],
    ["VENUS", "🟡", "space", "The blazing hot second world from the sun.", "___ is the brightest point in our sky."],
    ["NEBULA", "🌌", "space", "A vast glowing cloud of gas and dust between the stars.", "New stars form inside a ___."],
    ["SUPERNOVA", "💥", "space", "The gigantic explosion of a dying star.", "A ___ can outshine a galaxy."],
    ["COSMONAUT", "🧑‍🚀", "space", "A Russian traveller into space.", "The first ___ orbited in 1961."],
    ["PROBE", "🛰️", "space", "An unmanned craft sent to study a distant world.", "The ___ sent back its last signal."],
    ["MODULE", "🛸", "space", "A separate section of a spacecraft.", "The landing ___ detached slowly."],
    ["THRUSTER", "🚀", "space", "A small engine used to steer a craft in space.", "One ___ fired to correct the spin."],
    ["AURORA", "🌌", "space", "Shimmering coloured light in the polar night sky.", "The ___ rippled green above us."],

    // =====================================================================
    //  WEATHER
    // =====================================================================
    ["TSUNAMI", "🌊", "weather", "A giant sea wave caused by a quake under the ocean.", "The ___ struck without warning."],
    ["MIST", "🌫️", "weather", "A thin cloud of water droplets near the ground.", "___ hung over the fields at dawn."],
    ["SMOG", "🏭", "weather", "Dirty fog caused by smoke and fumes.", "___ hid the top of the towers."],
    ["BAROMETER", "🌡️", "weather", "An instrument that measures the pressure of the air.", "The ___ was falling fast."],
    ["SUNBEAM", "🌞", "weather", "A single ray of light from the sun.", "A ___ came through the gap."],
    ["FLOOD", "🌊", "weather", "Water spreading over land that is normally dry.", "The ___ reached the doorstep."],
    ["LANDSLIDE", "⛰️", "weather", "A mass of earth and rock sliding down a slope.", "A ___ blocked the pass."],
    ["FORECASTER", "📺", "weather", "Someone whose job is predicting the weather.", "The ___ promised a dry weekend."],

    // =====================================================================
    //  MONEY & TRADE
    // =====================================================================
    ["BANKNOTE", "💵", "money", "A piece of printed paper used as money.", "The ___ was folded in four."],

    // =====================================================================
    //  TECHNOLOGY
    // =====================================================================
    ["ANTENNA", "📡", "tech", "A rod or dish that picks up signals.", "The ___ blew off in the gale."],
    ["MICROCHIP", "💾", "tech", "A tiny slice of silicon holding a whole circuit.", "One ___ runs the entire toy."],
    ["PROCESSOR", "🖥️", "tech", "The part of a computer that does the thinking.", "A faster ___ made it snappier."],

    // =====================================================================
    //  STORIES & MYTHS
    // =====================================================================
    ["GRIFFIN", "🦅", "myths", "A beast of legend with an eagle's head and a lion's body.", "A carved ___ guarded the gate."],
    ["CENTAUR", "🐎", "myths", "A legendary being, half human and half horse.", "The ___ drew back its bow."],
    ["MINOTAUR", "🐂", "myths", "A legendary monster with a bull's head in a maze.", "The ___ waited at the centre."],
    ["LABYRINTH", "🌀", "myths", "A maze of winding passages easy to get lost in.", "The ___ had only one way out."],
    ["ORACLE", "🔮", "myths", "Someone who gives messages said to come from the gods.", "They travelled far to ask the ___."],
    ["TITAN", "🗻", "myths", "One of the giant beings said to rule before the gods.", "Each ___ was stronger than a mountain."],
    ["CHARIOTEER", "🐎", "myths", "The driver of a two-wheeled racing cart.", "The ___ took the corner too fast."],
    ["ELF", "🧝", "myths", "A slender magical being of northern folk tales.", "An ___ stepped out of the trees."],
    ["DWARF", "⛏️", "myths", "A short sturdy being of legend, skilled at mining.", "The ___ swung his pick."],
    ["OGRE", "👹", "myths", "A huge cruel man-eating giant of fairy tales.", "The ___ guarded the bridge."],
    ["GOBLIN", "👺", "myths", "A small spiteful creature of folk tales.", "A ___ snatched the loaf."],
    ["SERPENT", "🐍", "myths", "A great snake, especially one in an old story.", "A sea ___ coiled round the mast."],
    ["BANQUET", "🍗", "myths", "A grand feast for many guests.", "The ___ lasted three days."],
    ["MINSTREL", "🎻", "myths", "A travelling singer of stories in old times.", "A ___ sang of the battle."],
    ["SCRIBE", "✍️", "myths", "Somebody whose work was writing things out by hand.", "The ___ sharpened his quill."],
    ["TALISMAN", "🧿", "myths", "An object believed to bring protection or luck.", "She wore the ___ on a cord."],

    // =====================================================================
    //  COMMUNITY & SAFETY
    // =====================================================================
    ["EXTINGUISHER", "🧯", "community", "A cylinder that puts out a fire.", "The ___ hangs by the door."],
    ["MEMORIAL", "🕯️", "community", "Something built to keep a memory alive.", "The ___ lists every name."],
    ["CEMETERY", "🪦", "community", "A place where the dead are buried.", "The ___ is behind the church."],
    ["ORPHANAGE", "🏠", "community", "A home for children with no parents.", "The ___ took in twelve more."],

    // =====================================================================
    //  TIME
    // =====================================================================

    // =====================================================================
    //  MATHS
    // =====================================================================

    // =====================================================================
    //  FEELINGS
    // =====================================================================

    // =====================================================================
    //  ACTIONS
    // =====================================================================

    // =====================================================================
    //  DESCRIBING WORDS
    // =====================================================================
  ];

  WB.RAW_EXPLORER_4 = raw;
})();

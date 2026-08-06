/* LetterLand — Early vocabulary content (100 concrete words, ages 2-5).
 * Theme-independent per PRD Section 17.3: word logic is separate from theme presentation.
 *
 * This file only declares the raw rows; js/banks.js turns them into word
 * objects so the Early and Explorer banks are built by identical logic.
 *
 * Row format: [WORD, emoji, category]
 */
(function () {
  var raw = [
    // Animals
    ["CAT", "🐱", "animals"], ["DOG", "🐶", "animals"], ["COW", "🐮", "animals"],
    ["PIG", "🐷", "animals"], ["HEN", "🐔", "animals"], ["FOX", "🦊", "animals"],
    ["OWL", "🦉", "animals"], ["BEE", "🐝", "animals"], ["ANT", "🐜", "animals"],
    ["BAT", "🦇", "animals"], ["FROG", "🐸", "animals"], ["FISH", "🐟", "animals"],
    ["BIRD", "🐦", "animals"], ["LION", "🦁", "animals"], ["BEAR", "🐻", "animals"],
    ["DUCK", "🦆", "animals"], ["GOAT", "🐐", "animals"], ["DEER", "🦌", "animals"],
    ["WOLF", "🐺", "animals"], ["CRAB", "🦀", "animals"], ["SEAL", "🦭", "animals"],
    ["SNAIL", "🐌", "animals"], ["HORSE", "🐴", "animals"], ["SHEEP", "🐑", "animals"],
    ["MOUSE", "🐭", "animals"],
    // Food
    ["EGG", "🥚", "food"], ["PIE", "🥧", "food"], ["JAM", "🍮", "food"],
    ["NUT", "🥜", "food"], ["CORN", "🌽", "food"], ["CAKE", "🎂", "food"],
    ["MILK", "🥛", "food"], ["RICE", "🍚", "food"], ["PEAR", "🍐", "food"],
    ["KIWI", "🥝", "food"], ["APPLE", "🍎", "food"], ["GRAPE", "🍇", "food"],
    ["BREAD", "🍞", "food"], ["LEMON", "🍋", "food"], ["MANGO", "🥭", "food"],
    ["SOUP", "🍲", "food"], ["TACO", "🌮", "food"], ["MEAT", "🍖", "food"],
    ["CANDY", "🍬", "food"], ["HONEY", "🍯", "food"],
    // Nature
    ["SUN", "☀️", "nature"], ["MOON", "🌙", "nature"], ["STAR", "⭐", "nature"],
    ["TREE", "🌳", "nature"], ["LEAF", "🍃", "nature"], ["RAIN", "🌧️", "nature"],
    ["SNOW", "❄️", "nature"], ["CLOUD", "☁️", "nature"], ["FIRE", "🔥", "nature"],
    ["ROCK", "🪨", "nature"], ["HILL", "⛰️", "nature"], ["FLOWER", "🌸", "nature"],
    ["WAVE", "🌊", "nature"], ["BUSH", "🌿", "nature"], ["SEED", "🌱", "nature"],
    // Vehicles
    ["CAR", "🚗", "vehicles"], ["BUS", "🚌", "vehicles"], ["VAN", "🚐", "vehicles"],
    ["JET", "✈️", "vehicles"], ["BOAT", "⛵", "vehicles"], ["SHIP", "🚢", "vehicles"],
    ["TRAIN", "🚂", "vehicles"], ["BIKE", "🚲", "vehicles"], ["TRUCK", "🚚", "vehicles"],
    ["ROCKET", "🚀", "vehicles"], ["TAXI", "🚕", "vehicles"], ["PLANE", "🛩️", "vehicles"],
    // Home & objects
    ["BED", "🛏️", "home"], ["CUP", "☕", "home"], ["PEN", "🖊️", "home"],
    ["KEY", "🔑", "home"], ["BOOK", "📖", "home"], ["BALL", "⚽", "home"],
    ["DOLL", "🪆", "home"], ["DRUM", "🥁", "home"], ["CLOCK", "🕐", "home"],
    ["LAMP", "💡", "home"], ["DOOR", "🚪", "home"], ["SOCK", "🧦", "home"],
    ["HAT", "🎩", "home"], ["SHOE", "👟", "home"], ["RING", "💍", "home"],
    ["BOX", "📦", "home"], ["KITE", "🪁", "home"], ["GIFT", "🎁", "home"],
    // Body
    ["EYE", "👁️", "body"], ["EAR", "👂", "body"], ["HAND", "✋", "body"],
    ["FOOT", "🦶", "body"], ["NOSE", "👃", "body"], ["LIP", "👄", "body"],
    // Treasure / space
    ["GEM", "💎", "space"], ["FLAG", "🚩", "space"], ["CROWN", "👑", "space"],
    ["ALIEN", "👽", "space"]
  ];

  WB.RAW_EARLY = raw;
})();

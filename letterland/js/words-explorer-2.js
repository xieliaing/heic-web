/* LetterLand — Explorer vocabulary, batch 2 (ages 7-9).
 *
 * Batch 1 (js/words-explorer.js) covers concrete photographable nouns. This
 * batch broadens into the rest of a grade 2-4 spelling curriculum: feelings,
 * actions, describing words, maths, money, time, community, technology and
 * story vocabulary.
 *
 * Many of these are not photographable, which is deliberate — they are carried
 * by the definition-and-sentence clue mode rather than by a picture, and fall
 * back to their emoji when no photo exists.
 *
 * Row format: [WORD, emojiFallback, category, definition, cloze sentence]
 */
(function () {
  var raw = [
    // =====================================================================
    //  FEELINGS & CHARACTER
    // =====================================================================

    // =====================================================================
    //  ACTIONS
    // =====================================================================

    // =====================================================================
    //  DESCRIBING WORDS
    // =====================================================================

    // =====================================================================
    //  MATHS & MEASURING
    // =====================================================================

    // =====================================================================
    //  MONEY & SHOPPING
    // =====================================================================
    ["MONEY", "💵", "money", "Coins and notes used to pay for things.", "Put the ___ in your pocket."],
    ["COIN", "🪙", "money", "A small flat piece of metal used to pay.", "A gold ___ rolled under the sofa."],
    ["WALLET", "👛", "money", "A folding case for carrying notes and cards.", "His ___ was in his back pocket."],
    ["CUSTOMER", "🛒", "money", "A person buying something from a shop.", "The ___ asked for a receipt."],
    ["RECEIPT", "🧾", "money", "The printed slip proving what you paid.", "Keep the ___ in case it breaks."],
    ["TROLLEY", "🛒", "money", "A wheeled basket for carrying shopping.", "The ___ had a wobbly wheel."],
    ["CASHIER", "🧑‍💼", "money", "The person who takes your payment.", "The ___ scanned each item."],

    // =====================================================================
    //  TIME & THE CALENDAR
    // =====================================================================

    // =====================================================================
    //  COMMUNITY & SAFETY
    // =====================================================================
    ["NEIGHBOUR", "🏡", "community", "Somebody who lives close by.", "Our ___ feeds the cat when we travel."],
    ["VOLUNTEER", "🙋", "community", "Somebody who helps out without being paid.", "Every ___ wore a green shirt."],
    ["CITIZEN", "🪪", "community", "A person who belongs to a country.", "Every ___ has the right to vote."],
    ["SHELTER", "🛖", "community", "A place giving protection from weather or danger.", "The ___ took in every stray."],
    ["CLINIC", "🩺", "community", "A small place where people go for check-ups.", "The ___ opens on Saturday mornings."],
    ["SIREN", "🚨", "community", "The loud wailing warning sound on a rescue vehicle.", "A ___ woke the whole street."],
    ["LITTER", "🗑️", "community", "Rubbish dropped where it should not be.", "Pick up your ___."],
    ["CROSSING", "🚸", "community", "The marked place where people may walk over a road.", "Wait at the ___ for the green man."],
    ["PEDESTRIAN", "🚶", "community", "A person travelling on foot.", "The ___ crossing is by the school."],

    // =====================================================================
    //  TECHNOLOGY
    // =====================================================================
    ["MONITOR", "🖥️", "tech", "The screen that displays what a computer is doing.", "The ___ flickered and went dark."],
    ["SCREEN", "🖥️", "tech", "The flat surface that shows the picture.", "The ___ went black."],
    ["PRINTER", "🖨️", "tech", "A machine that puts documents onto paper.", "The ___ is out of ink."],
    ["TABLET", "📱", "tech", "A flat hand-held computer with a touch screen.", "She read the recipe off a ___."],
    ["SPEAKER", "🔈", "tech", "The part that turns a signal into sound.", "One ___ is crackling."],
    ["CHARGER", "🔌", "tech", "The cable that refills a battery.", "I left my ___ at home."],
    ["SENSOR", "📡", "tech", "A part that detects light, heat or movement.", "The ___ turns the lamp on for you."],

    // =====================================================================
    //  STORIES & MYTHS
    // =====================================================================
    ["DRAGON", "🐉", "myths", "A huge scaly beast of legend that breathes flame.", "The ___ guarded the mountain."],
    ["UNICORN", "🦄", "myths", "A legendary white horse with a single horn.", "A ___ appears in the old tale."],
    ["GIANT", "🗿", "myths", "A person of enormous size in old stories.", "The ___ lived above the clouds."],
    ["WIZARD", "🧙", "myths", "A man in stories who works magic.", "The ___ raised his staff."],
    ["WITCH", "🧹", "myths", "A woman in stories who works magic.", "The ___ stirred her pot."],
    ["MERMAID", "🧜", "myths", "A legendary creature, half woman and half fish.", "A ___ sat on the rock."],
    ["PHOENIX", "🔥", "myths", "A legendary bird that rises again from its own ashes.", "The ___ burned and was reborn."],
    ["MONSTER", "👹", "myths", "A frightening imaginary creature.", "The ___ under the bed was only a coat."],
    ["HERO", "🦸", "myths", "Somebody admired for great courage.", "Every story needs a ___."],
    ["VILLAIN", "🦹", "myths", "The wicked character in a story.", "The ___ was caught in the end."],
    ["POTION", "🧪", "myths", "A magical drink in a story.", "One drop of the ___ was enough."],
    ["FAIRY", "🧚", "myths", "A tiny magical being with wings.", "A ___ hid inside the bluebell."],
    ["GHOST", "👻", "myths", "The spirit of somebody who has died.", "They claimed a ___ walked the hall."],
    ["SORCERER", "🔮", "myths", "A powerful worker of magic in old tales.", "The ___ vanished in a puff of smoke."],
    ["TROLL", "👺", "myths", "An ugly creature of folk tales that lurks under bridges.", "A ___ demanded a toll to cross."]
  ];

  WB.RAW_EXPLORER_2 = raw;
})();

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
    ["TRIANGLE", "🔺", "maths", "A flat shape with three straight sides.", "A ___ has three corners."],
    ["RECTANGLE", "▭", "maths", "A flat shape with four sides and four square corners.", "The door is a tall ___."],
    ["CIRCLE", "⭕", "maths", "A perfectly round flat shape.", "Draw a ___ round the answer."],
    ["SQUARE", "🟦", "maths", "A shape with four equal sides and four right angles.", "Each tile is a small ___."],
    ["HEXAGON", "⬡", "maths", "A flat shape with six straight sides.", "A honeycomb cell is a ___."],
    ["CUBE", "🎲", "maths", "A solid box shape with six equal flat faces.", "A dice is a small ___."],
    ["SPHERE", "🔮", "maths", "A perfectly round solid, like a ball.", "The globe is a ___."],
    ["CYLINDER", "🥫", "maths", "A solid tube shape with round flat ends.", "A tin can is a ___."],
    ["ANGLE", "📐", "maths", "The amount of turn where two lines meet.", "Measure the ___ with a protractor."],
    ["ADDITION", "➕", "maths", "Putting numbers together to find the total.", "We practised ___ all morning."],
    ["FRACTION", "🍕", "maths", "A part of a whole, like a half or a quarter.", "One slice is a ___ of the pie."],
    ["DECIMAL", "🔢", "maths", "A number written with a point, like 3.5.", "Round the ___ to one place."],
    ["TOTAL", "🧮", "maths", "The whole amount once everything is added.", "The ___ came to sixteen."],
    ["DOZEN", "🥚", "maths", "A group of twelve.", "We need a ___ eggs."],
    ["PAIR", "🧦", "maths", "A set of two that belong together.", "A clean ___ of socks."],
    ["MEASUREMENT", "📏", "maths", "The size or amount you find when you check something.", "Write the ___ in the box."],
    ["CENTIMETRE", "📏", "maths", "A small unit of length, a hundredth of a metre.", "The nail is one ___ long."],
    ["METRE", "📏", "maths", "A unit of length about the height of a door handle.", "The rope is one ___ long."],
    ["KILOMETRE", "🛣️", "maths", "A unit of distance equal to a thousand metres.", "The school is one ___ away."],
    ["GRAM", "⚖️", "maths", "A very small unit of weight.", "A paper clip weighs about a ___."],
    ["KILOGRAM", "⚖️", "maths", "A unit of weight equal to a thousand grams.", "The bag of flour is one ___."],
    ["LITRE", "🥛", "maths", "A unit for measuring liquid.", "Buy one ___ of milk."],
    ["PERIMETER", "📐", "maths", "The total distance all the way round a shape.", "Add the four sides to get the ___."],
    ["PERCENT", "💯", "maths", "A part out of every hundred.", "Ninety ___ of us agreed."],
    ["AVERAGE", "📊", "maths", "The middle amount you get by sharing a total out evenly.", "The ___ score was eight."],
    ["SEQUENCE", "🔢", "maths", "A list of things following one after another in order.", "Work out the next number in the ___."],
    ["SYMMETRY", "🦋", "maths", "When both halves of a shape match exactly.", "A butterfly shows perfect ___."],
    ["GRAPH", "📈", "maths", "A drawing that shows numbers as bars, lines or dots.", "Plot the results on a ___."],
    ["ESTIMATE", "🤔", "maths", "A sensible guess at an amount.", "Give me a rough ___ first."],

    // =====================================================================
    //  MONEY & SHOPPING
    // =====================================================================
    ["MONEY", "💵", "money", "Coins and notes used to pay for things.", "Put the ___ in your pocket."],
    ["COIN", "🪙", "money", "A small flat piece of metal used to pay.", "A gold ___ rolled under the sofa."],
    ["WALLET", "👛", "money", "A folding case for carrying notes and cards.", "His ___ was in his back pocket."],
    ["CUSTOMER", "🛒", "money", "A person buying something from a shop.", "The ___ asked for a receipt."],
    ["RECEIPT", "🧾", "money", "The printed slip proving what you paid.", "Keep the ___ in case it breaks."],
    ["BARGAIN", "🏷️", "money", "Something bought for much less than usual.", "Those boots were a real ___."],
    ["DISCOUNT", "🏷️", "money", "An amount taken off the usual price.", "Members get a ___."],
    ["CHANGE", "🪙", "money", "The money handed back when you pay too much.", "Do not forget your ___."],
    ["SAVINGS", "🐷", "money", "Money you have kept instead of spending.", "She spent all her ___ on a telescope."],
    ["BUDGET", "📋", "money", "A plan for how much you will spend.", "We went over ___ again."],
    ["PURCHASE", "🛍️", "money", "Something you have bought.", "Check your ___ before you leave."],
    ["SALARY", "💷", "money", "The regular pay somebody earns for their job.", "She saves part of her ___."],
    ["TROLLEY", "🛒", "money", "A wheeled basket for carrying shopping.", "The ___ had a wobbly wheel."],
    ["CASHIER", "🧑‍💼", "money", "The person who takes your payment.", "The ___ scanned each item."],
    ["PRICE", "🏷️", "money", "The amount something costs.", "Check the ___ before you buy."],
    ["VALUE", "💎", "money", "How much something is really worth.", "The ___ of the coin surprised us."],

    // =====================================================================
    //  TIME & THE CALENDAR
    // =====================================================================
    ["MORNING", "🌅", "time", "The early part of the day before noon.", "We leave first thing in the ___."],
    ["AFTERNOON", "🌤️", "time", "The part of the day between noon and evening.", "Practice is on Tuesday ___."],
    ["EVENING", "🌆", "time", "The part of the day as the light fades.", "We read every ___."],
    ["MIDNIGHT", "🕛", "time", "Twelve o'clock at night.", "The clock struck ___."],
    ["MINUTE", "⏱️", "time", "A length of time made of sixty seconds.", "Wait one more ___."],
    ["SECOND", "⏱️", "time", "The shortest common unit of time.", "It took barely a ___."],
    ["WEEKEND", "🎈", "time", "Saturday and Sunday together.", "We go swimming at the ___."],
    ["FORTNIGHT", "📅", "time", "A period of two whole weeks.", "The trip lasts a ___."],
    ["MONTH", "🗓️", "time", "One of the twelve parts of a year.", "February is the shortest ___."],
    ["DECADE", "📆", "time", "A period of ten years.", "The bridge took a ___ to build."],
    ["ANNIVERSARY", "🎊", "time", "The yearly return of a special date.", "It is their tenth ___."],
    ["BIRTHDAY", "🎂", "time", "The yearly return of the day you were born.", "My ___ is in March."],
    ["HOLIDAY", "🏖️", "time", "A time off from school or work.", "The summer ___ starts on Friday."],
    ["FESTIVAL", "🎪", "time", "A time of celebration shared by many people.", "The village ___ lasts three days."],
    ["SCHEDULE", "🗒️", "time", "A plan of when things will happen.", "The ___ is on the fridge."],
    ["DEADLINE", "⏰", "time", "The latest moment something can be finished.", "The ___ is Monday morning."],
    ["FUTURE", "🔮", "time", "The time that has not happened yet.", "Nobody knows the ___."],
    ["PAST", "📜", "time", "The time that has already gone.", "Learn from the ___."],
    ["PRESENT", "⏳", "time", "The time happening right now.", "Live in the ___."],
    ["MILLENNIUM", "🏺", "time", "A period of one thousand years.", "The stones stood for a whole ___."],
    ["DUSK", "🌆", "time", "The dim time just after the sun goes down.", "The bats come out at ___."],

    // =====================================================================
    //  COMMUNITY & SAFETY
    // =====================================================================
    ["COMMUNITY", "🏘️", "community", "All the people living together in one area.", "The whole ___ helped clear the snow."],
    ["NEIGHBOUR", "🏡", "community", "Somebody who lives close by.", "Our ___ feeds the cat when we travel."],
    ["VOLUNTEER", "🙋", "community", "Somebody who helps out without being paid.", "Every ___ wore a green shirt."],
    ["CHARITY", "💝", "community", "An organisation that helps people in need.", "We raised money for ___."],
    ["ELECTION", "🗳️", "community", "The event where people vote to choose leaders.", "The ___ is held every four years."],
    ["GOVERNMENT", "🏛️", "community", "The group that runs a country.", "The ___ built the new hospital."],
    ["CITIZEN", "🪪", "community", "A person who belongs to a country.", "Every ___ has the right to vote."],
    ["SHELTER", "🛖", "community", "A place giving protection from weather or danger.", "The ___ took in every stray."],
    ["CLINIC", "🩺", "community", "A small place where people go for check-ups.", "The ___ opens on Saturday mornings."],
    ["SIREN", "🚨", "community", "The loud wailing warning sound on a rescue vehicle.", "A ___ woke the whole street."],
    ["EMERGENCY", "🚨", "community", "A sudden dangerous situation needing fast help.", "In an ___ dial the short number."],
    ["ACCIDENT", "⚠️", "community", "Something harmful that happens by chance.", "There was an ___ on the corner."],
    ["DANGER", "☠️", "community", "The chance of being harmed.", "The sign warned of ___."],
    ["SAFETY", "🦺", "community", "Being protected from harm.", "___ comes before speed."],
    ["POLLUTION", "🏭", "community", "Harmful waste that dirties air, land or water.", "___ from the road hurt the river."],
    ["ENVIRONMENT", "🌍", "community", "The natural world all around us.", "Protecting the ___ is everybody's job."],
    ["LITTER", "🗑️", "community", "Rubbish dropped where it should not be.", "Pick up your ___."],
    ["CROSSING", "🚸", "community", "The marked place where people may walk over a road.", "Wait at the ___ for the green man."],
    ["PEDESTRIAN", "🚶", "community", "A person travelling on foot.", "The ___ crossing is by the school."],
    ["POSTCODE", "✉️", "community", "The short code that identifies a delivery area.", "Write the ___ clearly."],
    ["ADDRESS", "🏠", "community", "The details telling where somebody lives.", "Put your ___ on the form."],
    ["PARADE", "🎏", "community", "A public procession through the streets.", "The ___ passed our window."],
    ["COMMITTEE", "🧑‍🤝‍🧑", "community", "A small group chosen to organise something.", "The ___ met on Wednesday."],

    // =====================================================================
    //  TECHNOLOGY
    // =====================================================================
    ["INTERNET", "🌐", "tech", "The worldwide network linking computers together.", "Look it up on the ___."],
    ["WEBSITE", "🖥️", "tech", "A set of pages you visit online.", "The school ___ lists the dates."],
    ["PASSWORD", "🔑", "tech", "A secret word that unlocks an account.", "Never share your ___."],
    ["MONITOR", "🖥️", "tech", "The screen that displays what a computer is doing.", "The ___ flickered and went dark."],
    ["SCREEN", "🖥️", "tech", "The flat surface that shows the picture.", "The ___ went black."],
    ["PRINTER", "🖨️", "tech", "A machine that puts documents onto paper.", "The ___ is out of ink."],
    ["SOFTWARE", "💿", "tech", "The programs that tell a machine what to do.", "The ___ needs updating."],
    ["PROGRAM", "📜", "tech", "A set of instructions a computer follows.", "She wrote a ___ to sort the names."],
    ["MESSAGE", "💬", "tech", "A piece of writing sent to somebody.", "Send me a ___ when you arrive."],
    ["TABLET", "📱", "tech", "A flat hand-held computer with a touch screen.", "She read the recipe off a ___."],
    ["SPEAKER", "🔈", "tech", "The part that turns a signal into sound.", "One ___ is crackling."],
    ["CHARGER", "🔌", "tech", "The cable that refills a battery.", "I left my ___ at home."],
    ["DEVICE", "📱", "tech", "A piece of equipment made for a purpose.", "Put every ___ away at dinner."],
    ["NETWORK", "🕸️", "tech", "A group of machines linked so they can share.", "The whole ___ went down."],
    ["ROBOTICS", "🤖", "tech", "The science of designing and building robots.", "The ___ club meets on Fridays."],
    ["ENGINEERING", "⚙️", "tech", "The work of designing and building machines and structures.", "Bridge ___ needs careful sums."],
    ["SENSOR", "📡", "tech", "A part that detects light, heat or movement.", "The ___ turns the lamp on for you."],
    ["DATABASE", "🗄️", "tech", "An organised store of information a computer can search.", "Every book is listed in the ___."],

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
    ["ADVENTURE", "🗺️", "myths", "An exciting journey full of risk.", "They set off on an ___."],
    ["QUEST", "🧭", "myths", "A long search for something important.", "The ___ took seven years."],
    ["CURSE", "💀", "myths", "Magic words meant to bring bad luck.", "A ___ lay on the ring."],
    ["SPELL", "✨", "myths", "Magic words that make something happen.", "She spoke the ___ backwards."],
    ["POTION", "🧪", "myths", "A magical drink in a story.", "One drop of the ___ was enough."],
    ["FAIRY", "🧚", "myths", "A tiny magical being with wings.", "A ___ hid inside the bluebell."],
    ["GHOST", "👻", "myths", "The spirit of somebody who has died.", "They claimed a ___ walked the hall."],
    ["SORCERER", "🔮", "myths", "A powerful worker of magic in old tales.", "The ___ vanished in a puff of smoke."],
    ["KINGDOM", "👑", "myths", "The land a king or queen rules.", "The whole ___ celebrated."],
    ["PROPHECY", "📜", "myths", "A statement about what will happen in years to come.", "The old ___ came true."],
    ["RIDDLE", "❓", "myths", "A puzzling question with a clever answer.", "Solve the ___ to pass."],
    ["FABLE", "🐢", "myths", "A short story with animals that teaches a lesson.", "The tortoise ___ is my favourite."],
    ["MYTH", "🏛️", "myths", "An ancient story explaining the world.", "Every culture has a creation ___."],
    ["TROLL", "👺", "myths", "An ugly creature of folk tales that lurks under bridges.", "A ___ demanded a toll to cross."]
  ];

  WB.RAW_EXPLORER_2 = raw;
})();

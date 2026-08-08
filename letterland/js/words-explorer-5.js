/* LetterLand — Explorer vocabulary, batch 5 (ages 7-9).
 *
 * The final batch, taking the Explorer bank to roughly two thousand words:
 * young animals, animal homes and groups, more food, house and garden, school,
 * science, body, sport, art, jobs, transport, clothes, landscape, plus further
 * action and describing words.
 *
 * Row format: [WORD, emojiFallback, category, definition, cloze sentence]
 */
(function () {
  var raw = [
    // =====================================================================
    //  ANIMALS — young, homes, groups and body parts
    // =====================================================================
    ["ANTEATER", "🐜", "animals", "A long-snouted animal that laps up insects with a sticky tongue.", "The ___ tore open the nest."],
    ["DINGO", "🐕", "animals", "A wild dog of the Australian outback.", "A ___ trotted along the ridge."],
    ["LYNX", "🐈", "animals", "A wild cat with tufted ears and huge padded paws.", "The ___ left prints in the snow."],
    ["JACKAL", "🐺", "animals", "A slender wild dog that scavenges on the plains.", "A ___ slipped between the rocks."],
    ["WEASEL", "🦫", "animals", "A long thin hunter that follows mice down their holes.", "A ___ vanished into the wall."],
    ["FERRET", "🦡", "animals", "A tame long-bodied animal once used to hunt rabbits.", "The ___ wriggled up his sleeve."],
    ["MOLE", "🦫", "animals", "A velvety digger that tunnels under lawns.", "A ___ threw up a heap of soil."],
    ["SHREW", "🐁", "animals", "A tiny sharp-nosed animal that must eat constantly.", "A ___ rustled through the leaves."],
    ["VOLE", "🐁", "animals", "A small blunt-nosed rodent of banks and fields.", "A ___ dived into the water."],
    ["GOSLING", "🐤", "animals", "A young goose.", "Each ___ followed in a line."],
    ["CYGNET", "🦢", "animals", "A young swan, grey before it turns white.", "One ___ rode on its mother's back."],
    ["FOAL", "🐴", "animals", "A young horse.", "The ___ stood within the hour."],
    ["CALF", "🐄", "animals", "A young cow, or a young whale or elephant.", "The ___ stayed close to the herd."],
    ["LAMB", "🐑", "animals", "A young sheep.", "Each ___ found its mother by sound."],
    ["PIGLET", "🐖", "animals", "A young pig.", "The smallest ___ got pushed aside."],
    ["KITTEN", "🐱", "animals", "A young cat.", "The ___ pounced on the string."],
    ["CUB", "🐻", "animals", "The young of a bear, lion or fox.", "The ___ tumbled after its mother."],
    ["JOEY", "🦘", "animals", "A young kangaroo carried in a pouch.", "The ___ peered out at us."],
    ["LARVA", "🐛", "animals", "The wormlike young stage of an insect.", "Each ___ hatched from a tiny egg."],
    ["COCOON", "🐛", "animals", "The silky case a caterpillar spins around itself.", "The ___ split down one side."],
    ["HIVE", "🐝", "animals", "The structure where a colony of bees lives.", "The whole ___ hummed."],
    ["NEST", "🪹", "animals", "The structure a bird builds to lay its eggs in.", "Four eggs lay in the ___."],
    ["BURROW", "🕳️", "animals", "A hole an animal digs to live in.", "The rabbit bolted down its ___."],
    ["WARREN", "🐇", "animals", "A network of rabbit tunnels.", "The whole bank was one big ___."],
    ["LAIR", "🕳️", "animals", "The resting place of a wild animal.", "We found the fox's ___."],
    ["ANTLER", "🦌", "animals", "A branched bony horn grown and shed each year.", "One ___ lay in the bracken."],
    ["HOOF", "🐴", "animals", "The hard foot of a horse or cow.", "A stone was wedged in its ___."],
    ["CLAW", "🐈", "animals", "A sharp curved nail on an animal's foot.", "The cat caught its ___ in the rug."],
    ["FANG", "🐍", "animals", "A long pointed tooth used to bite or inject venom.", "One ___ showed as it hissed."],
    ["WHISKER", "🐱", "animals", "A stiff hair on an animal's face used for feeling.", "One ___ was bent."],
    ["FEATHER", "🪶", "animals", "One of the light structures covering a bird.", "A single ___ drifted down."],
    ["FLIPPER", "🦭", "animals", "A broad flat limb used for swimming.", "The seal pushed with one ___."],
    ["TENTACLE", "🐙", "animals", "A long flexible arm used to grasp or feel.", "One ___ curled round the rock."],

    // =====================================================================
    //  NATURE
    // =====================================================================
    ["SEEDLING", "🌱", "nature", "A very young plant just grown from seed.", "Each ___ needed thinning out."],
    ["CANOPY", "🌳", "nature", "The high leafy roof of a forest.", "Monkeys stayed up in the ___."],
    ["UNDERGROWTH", "🌿", "nature", "The tangle of low plants beneath trees.", "Something moved in the ___."],
    ["CLEARING", "🌲", "nature", "An open space in the middle of a wood.", "We camped in a small ___."],
    ["THICKET", "🌳", "nature", "A dense group of bushes and small trees.", "The fox slipped into the ___."],
    ["ESTUARY", "🌊", "nature", "The wide mouth where a river meets the sea.", "Birds feed on the ___ mud."],
    ["TRIBUTARY", "🏞️", "nature", "A smaller river flowing into a larger one.", "The stream is a ___ of the Thames."],
    ["SEDIMENT", "🪨", "nature", "Material that settles to the bottom of water.", "___ built up behind the dam."],
    ["QUARTZ", "💎", "nature", "A hard glassy mineral found in many rocks.", "A vein of ___ ran through it."],
    ["LIMESTONE", "🪨", "nature", "A pale rock that water slowly dissolves into caves.", "The gorge is cut through ___."],
    ["GRANITE", "🪨", "nature", "A very hard speckled rock used for building.", "The steps are solid ___."],
    ["MARBLE", "🏛️", "nature", "A smooth stone that polishes to a shine.", "The statue is carved from ___."],
    ["SHINGLE", "🏖️", "nature", "A beach covering of small loose stones.", "___ crunched under our feet."],
    ["RIDGE", "⛰️", "nature", "A long narrow crest of high ground.", "We walked the whole ___."],
    ["PLATEAU", "⛰️", "nature", "A wide area of high flat land.", "The road climbs onto the ___."],
    ["TUNDRA", "🥶", "nature", "A cold treeless plain where the ground stays frozen.", "Only mosses grow on the ___."],
    ["SAVANNAH", "🦁", "nature", "A hot grassy plain with scattered trees.", "Zebra graze on the ___."],
    ["WETLAND", "🦆", "nature", "Ground that stays soaked with water.", "The ___ is full of frogs."],
    ["COMPOST", "🍂", "nature", "Rotted plant matter used to feed soil.", "Tip the peelings on the ___."],
    ["OASIS", "🌴", "nature", "A green watered spot in the middle of a desert.", "The ___ had three palm trees."],

    // =====================================================================
    //  FOOD
    // =====================================================================
    ["RISOTTO", "🍚", "food", "A creamy Italian dish of slowly stirred rice.", "The ___ needed constant stirring."],
    ["MARMALADE", "🍊", "food", "A jam made from citrus peel.", "He spread ___ on his toast."],
    ["CHUTNEY", "🥫", "food", "A sweet-and-sour relish eaten with cold meat.", "A spoonful of ___ finished the plate."],
    ["CASSEROLE", "🍲", "food", "A dish slowly baked in a covered pot.", "The ___ took three hours."],
    ["SOUFFLE", "🍮", "food", "A light baked dish puffed up with beaten egg.", "The ___ sank as we watched."],
    ["MERINGUE", "🍥", "food", "A crisp white sweet made from whipped egg and sugar.", "The ___ shattered into pieces."],
    ["SORBET", "🍧", "food", "A frozen fruit ice with no cream in it.", "Lemon ___ cleared the palate."],
    ["TRIFLE", "🍨", "food", "A layered pudding of sponge, fruit and cream.", "The ___ came in a glass bowl."],
    ["CRACKER", "🍘", "food", "A thin crisp dry biscuit eaten with cheese.", "One ___ snapped in half."],
    ["OATMEAL", "🥣", "food", "Ground oats used for baking and breakfast.", "Stir the ___ into the mix."],
    ["MUESLI", "🥣", "food", "A mix of raw oats, nuts and dried fruit.", "___ keeps you full till lunch."],
    ["YOGHURT", "🥛", "food", "A thick tangy food made from soured milk.", "She stirred honey into the ___."],
    ["QUICHE", "🥧", "food", "An open tart filled with egg and savoury bits.", "The ___ was best eaten cold."],
    ["CREPE", "🥞", "food", "A very thin pancake rolled around a filling.", "The ___ was folded into a triangle."],
    ["BAGUETTE", "🥖", "food", "A long thin crusty French loaf.", "The ___ barely fitted in the bag."],
    ["CRUMPET", "🥞", "food", "A soft round griddle cake full of holes.", "Butter melted into the ___."],
    ["SCONE", "🥯", "food", "A small plain cake eaten with jam and cream.", "Each ___ came out golden."],
    ["SHORTBREAD", "🍪", "food", "A rich crumbly buttery biscuit.", "The ___ melted on the tongue."],
    ["GINGERBREAD", "🍪", "food", "A spiced cake or biscuit, often cut into shapes.", "We iced the ___ figures."],
    ["CARAMEL", "🍬", "food", "Sugar heated until it turns golden and chewy.", "Sticky ___ coated the apple."],
    ["TOFFEE", "🍬", "food", "A hard chewy sweet made from boiled sugar and butter.", "The ___ pulled out a filling."],
    ["FUDGE", "🍫", "food", "A soft rich sweet made from sugar, butter and milk.", "One square of ___ was enough."],
    ["NOUGAT", "🍬", "food", "A chewy sweet full of nuts.", "The ___ stuck to my teeth."],
    ["LEMONADE", "🍋", "food", "A cold drink made from citrus, sugar and water.", "We sold ___ on the corner."],
    ["SMOOTHIE", "🥤", "food", "A thick cold drink of blended fruit.", "The ___ was bright pink."],
    ["MILKSHAKE", "🥤", "food", "A cold whisked drink of milk and flavouring.", "The ___ was too thick to sip."],
    ["COCOA", "🍫", "food", "The brown powder that chocolate is made from.", "Stir the ___ into warm milk."],
    ["MARINADE", "🥣", "food", "A flavoured liquid food is soaked in before cooking.", "Leave it in the ___ overnight."],
    ["BATTER", "🥞", "food", "A runny mixture of flour, egg and milk.", "Whisk the ___ until smooth."],
    ["GLAZE", "🍩", "food", "A shiny coating brushed over food before baking.", "Brush the ___ over the buns."],
    ["FILLING", "🥧", "food", "Whatever is put inside a pie or sandwich.", "The ___ ran out of the sides."],

    // =====================================================================
    //  HOME & GARDEN
    // =====================================================================
    ["SIDEBOARD", "🪑", "home", "A long low cupboard for dishes in a dining room.", "Plates were stacked on the ___."],
    ["BANISTER", "🪜", "home", "The handrail running along a staircase.", "He slid down the ___."],
    ["THRESHOLD", "🚪", "home", "The strip of floor beneath a doorway.", "She paused on the ___."],
    ["PORCH", "🏠", "home", "A covered entrance at the front of a house.", "Boots were lined up in the ___."],
    ["VERANDA", "🏡", "home", "A roofed platform along the side of a house.", "We sat out on the ___."],
    ["CONSERVATORY", "🪴", "home", "A glass-walled room built onto a house.", "Tomatoes grew in the ___."],
    ["PANTRY", "🥫", "home", "A small room for storing food.", "Jars filled the ___ shelves."],
    ["CELLAR", "🍾", "home", "A cool underground room used for storage.", "Apples kept well in the ___."],
    ["LOFT", "📦", "home", "The space under a roof used for storage.", "Boxes were stacked in the ___."],
    ["MANTELPIECE", "🕯️", "home", "The shelf above a fireplace.", "Cards stood along the ___."],
    ["WALLPAPER", "🖼️", "home", "Decorated paper pasted onto walls.", "The ___ was peeling at the corner."],
    ["FLOORBOARD", "🪵", "home", "One of the long planks making up a floor.", "A loose ___ creaked."],
    ["SKYLIGHT", "🪟", "home", "A window set into a roof.", "Rain drummed on the ___."],
    ["WINDOWSILL", "🪟", "home", "The ledge along the bottom of a window.", "Herbs grew on the ___."],
    ["DOORKNOB", "🚪", "home", "The round handle used to open a door.", "The ___ came off in my hand."],
    ["KEYHOLE", "🔑", "home", "The opening a key fits into.", "She peered through the ___."],
    ["PADLOCK", "🔒", "home", "A detachable lock with a hinged loop.", "The shed had a rusty ___."],
    ["DRAINPIPE", "🌧️", "home", "The pipe carrying rainwater down from a roof.", "A cat climbed the ___."],
    ["ALLOTMENT", "🥕", "home", "A rented patch of ground for growing vegetables.", "He grows leeks on his ___."],
    ["WHEELBARROW", "🌱", "home", "A one-wheeled cart pushed by hand.", "The ___ was heaped with weeds."],
    ["TROWEL", "🌱", "home", "A small hand tool for digging in the garden.", "She loosened the soil with a ___."],
    ["SECATEURS", "✂️", "home", "Strong scissors for cutting back plants.", "Prune the roses with ___."],
    ["HOSEPIPE", "🚿", "home", "A long flexible tube that carries water.", "Uncoil the ___ to the beds."],
    ["SPRINKLER", "💦", "home", "A device that scatters water over a lawn.", "The ___ turned slowly."],
    ["MULCH", "🍂", "home", "A layer spread over soil to protect it.", "Spread ___ round the roots."],
    ["SHED", "🛖", "home", "A small wooden building used for storage.", "The mower lives in the ___."],
    ["HAMMOCK", "🌴", "home", "A hanging bed of net or cloth slung between two points.", "He dozed in the ___."],
    ["DECKING", "🪵", "home", "A flat wooden platform in a garden.", "The ___ gets slippery in rain."],
    ["PATIO", "🪴", "home", "A paved area beside a house.", "We ate on the ___."],
    ["TRELLIS", "🌿", "home", "A frame of crossed strips for climbing plants.", "Beans grew up the ___."],
    ["SCARECROW", "🌾", "home", "A figure put up to frighten birds away.", "The ___ lost its hat."],
    ["BIRDBATH", "🐦", "home", "A shallow basin of water for birds to wash in.", "Sparrows crowded the ___."],
    ["FURNACE", "🔥", "home", "An enclosed fire used to heat a building.", "The ___ roared into life."],
    ["THERMOSTAT", "🌡️", "home", "A control that keeps a temperature steady.", "Turn the ___ down a degree."],
    ["INSULATION", "🧣", "home", "Material that stops heat escaping.", "New ___ halved the bills."],

    // =====================================================================
    //  SCHOOL & LANGUAGE
    // =====================================================================
    ["CERTIFICATE", "📜", "school", "A printed document proving an achievement.", "She framed the ___."],
    ["DIPLOMA", "🎓", "school", "A document awarded for completing a course.", "He earned a ___ in design."],
    ["AUTOBIOGRAPHY", "✍️", "school", "The story of a life written by the person who lived it.", "She wrote her ___ at eighty."],
    ["BIOGRAPHY", "📕", "school", "The story of somebody's life written by another.", "The ___ runs to 400 pages."],
    ["ENCYCLOPEDIA", "📚", "school", "A book or set of books covering many subjects.", "Look it up in the ___."],

    // =====================================================================
    //  SCIENCE
    // =====================================================================
    ["INSULATOR", "🧤", "science", "A material that does not let heat or current through.", "Rubber is a good ___."],
    ["RESISTOR", "🔌", "science", "A part that limits how much current can flow.", "A burnt ___ stopped the circuit."],
    ["BINOCULARS", "🔭", "science", "A paired set of lenses used with both eyes.", "Bring the ___ for birdwatching."],
    ["PRISM", "🌈", "science", "A wedge of glass that splits light into colours.", "The ___ threw a rainbow on the wall."],
    ["LASER", "🔦", "science", "A very narrow intense beam of light.", "The ___ cut clean through."],

    // =====================================================================
    //  BODY & HEALTH
    // =====================================================================
    ["VACCINE", "💉", "body", "A dose that trains the body to fight an illness.", "The ___ is given in two parts."],
    ["OINTMENT", "🧴", "body", "A soft greasy paste rubbed on skin to heal it.", "Rub the ___ in gently."],
    ["FRACTURE", "🦴", "body", "A crack or break in a bone.", "The scan showed a small ___."],
    ["SPRAIN", "🦶", "body", "An injury from twisting a joint too far.", "It is only a ___, not a break."],
    ["EYELID", "👁️", "body", "The fold of skin that closes over an eye.", "One ___ was swollen."],
    ["EARDRUM", "👂", "body", "The thin skin inside the ear that picks up sound.", "Loud noise can damage an ___."],
    ["TONSIL", "😷", "body", "One of two soft lumps at the back of the throat.", "A swollen ___ made it hurt."],
    ["WINDPIPE", "🫁", "body", "The tube carrying air down to the lungs.", "A crumb went down his ___."],
    ["ABDOMEN", "🫃", "body", "The part of the body between chest and hips.", "The pain was low in her ___."],
    ["TENDON", "🦵", "body", "The tough cord joining muscle to bone.", "He tore a ___ in his heel."],
    ["SALIVA", "💧", "body", "The watery liquid made in your mouth.", "___ begins breaking down the food."],

    // =====================================================================
    //  SPORTS
    // =====================================================================
    ["SUBSTITUTE", "🔄", "sports", "A player who comes on to replace another.", "The ___ scored at once."],
    ["SPRINTER", "🏃", "sports", "An athlete who races over short distances.", "The ___ exploded off the blocks."],
    ["CYCLIST", "🚴", "sports", "Somebody who rides a bicycle, especially in a race.", "The leading ___ broke away."],

    // =====================================================================
    //  ART & MUSIC
    // =====================================================================
    ["SYMPHONY", "🎼", "art", "A long piece of music in several movements.", "The ___ lasts an hour."],
    ["CONCERTO", "🎻", "art", "A piece for one soloist and a full ensemble.", "She played the violin ___."],
    ["OPERA", "🎭", "art", "A play in which the whole story is sung.", "The ___ was in Italian."],
    ["AUDIENCE", "👏", "art", "The people watching or listening.", "The ___ rose to its feet."],
    ["SCENERY", "🎬", "art", "The painted background on a stage.", "The ___ was changed in the dark."],
    ["MAKEUP", "💄", "art", "Colours put on the face for a performance.", "Her stage ___ took an hour."],
    ["SCRIPT", "📜", "art", "The written words of a play or film.", "She learned the whole ___."],
    ["DIRECTOR", "🎬", "art", "The person who decides how a play or film is made.", "The ___ called for quiet."],
    ["ENGRAVING", "🖼️", "art", "A picture printed from lines cut into metal.", "The ___ dates from 1780."],
    ["COLLAGE", "✂️", "art", "A picture made by sticking pieces onto a surface.", "We made a ___ from magazines."],

    // =====================================================================
    //  JOBS
    // =====================================================================
    ["PHARMACIST", "💊", "jobs", "Somebody trained to prepare and hand out medicines.", "The ___ explained the dose."],
    ["JOINER", "🪚", "jobs", "A woodworker who makes doors, stairs and frames.", "The ___ hung all the doors."],
    ["LOCKSMITH", "🔑", "jobs", "Somebody who makes and repairs locks and keys.", "The ___ opened it in a minute."],
    ["NAVIGATOR", "🧭", "jobs", "The person who works out the route on a journey.", "The ___ plotted a new course."],
    ["INSPECTOR", "🔍", "jobs", "Somebody whose job is checking that things are correct.", "The ___ examined every wire."],
    ["RECEPTIONIST", "🛎️", "jobs", "The person who greets visitors and answers calls.", "The ___ signed us in."],
    ["JANITOR", "🧹", "jobs", "The person who looks after a building.", "The ___ unlocked the hall."],
    ["SOLOIST", "🎤", "art", "The one performer who plays or sings alone.", "The ___ stepped forward."],
    ["DESIGNER", "✏️", "jobs", "Someone who plans how things will look and work.", "The ___ sketched three versions."],
    ["EDITOR", "📝", "jobs", "Someone who checks and improves writing.", "The ___ cut two chapters."],
    ["PUBLISHER", "📚", "jobs", "A company that produces and sells books.", "The ___ printed ten thousand copies."],
    ["BROADCASTER", "📻", "jobs", "Someone who presents programmes on air.", "The ___ interviewed her live."],
    ["INTERPRETER", "🗣️", "jobs", "Someone who turns spoken words into another language.", "An ___ stood beside the visitor."],
    ["CURATOR", "🏛️", "jobs", "The person who looks after a museum collection.", "The ___ showed us the store room."],
    ["ECOLOGIST", "🌳", "jobs", "A scientist who studies how living things affect each other.", "An ___ surveyed the whole valley."],
    ["METEOROLOGIST", "🌦️", "jobs", "A scientist who studies the weather.", "The ___ tracked the storm."],
    ["GEOLOGIST", "🪨", "jobs", "A scientist who studies rocks and the earth.", "The ___ chipped a sample loose."],
    ["BOTANIST", "🌿", "jobs", "A scientist who studies plants.", "The ___ pressed each specimen."],
    ["ZOOLOGIST", "🐾", "jobs", "A scientist who studies animals.", "The ___ tagged the cubs."],
    ["PHYSICIST", "⚛️", "jobs", "A scientist who studies matter, energy and forces.", "The ___ explained gravity simply."],
    ["CHEMIST", "⚗️", "jobs", "A scientist who studies substances and reactions.", "The ___ mixed the two liquids."],
    ["TECHNICIAN", "🔧", "jobs", "Somebody skilled at operating and fixing equipment.", "A ___ reset the machine."],

    // =====================================================================
    //  TRANSPORT
    // =====================================================================
    ["MONORAIL", "🚝", "transport", "A train that runs along a single rail.", "The ___ links the two terminals."],
    ["FUNICULAR", "🚞", "transport", "A cable railway that climbs a steep slope.", "The ___ took us to the top."],
    ["HOVERCRAFT", "🚤", "transport", "A craft that rides on a cushion of air.", "The ___ crossed in forty minutes."],
    ["CATAMARAN", "⛵", "transport", "A boat with two joined hulls.", "The ___ was very stable."],
    ["DINGHY", "🛶", "transport", "A small open boat.", "We rowed the ___ ashore."],
    ["TUGBOAT", "🚢", "transport", "A small powerful boat that pushes larger ships.", "A ___ nudged the liner round."],
    ["LIFEBOAT", "🛟", "transport", "A boat kept ready to rescue people at sea.", "The ___ launched at midnight."],
    ["AIRSHIP", "🎈", "transport", "A steerable craft held up by lighter-than-air gas.", "The ___ drifted over the field."],
    ["GLIDER", "🛩️", "transport", "An aircraft with no engine that rides the air.", "The ___ was towed up by a plane."],
    ["COCKPIT", "✈️", "transport", "The space where a pilot sits and steers.", "The ___ was full of dials."],
    ["FUSELAGE", "✈️", "transport", "The main body of an aircraft.", "The ___ was painted white."],
    ["RUNWAY", "🛫", "transport", "The long strip aircraft use to take off and land.", "The ___ was closed for repairs."],
    ["HANGAR", "🛩️", "transport", "The large shed where aircraft are kept.", "The ___ doors rolled back."],
    ["TURBINE", "⚙️", "transport", "A wheel spun by gas, steam or water to make power.", "One ___ had to be replaced."],
    ["EXHAUST", "💨", "transport", "The waste gases pushed out by an engine.", "Blue smoke came from the ___."],
    ["SUSPENSION", "🚗", "transport", "The springs that smooth out a vehicle's ride.", "The ___ took a beating on that track."],
    ["ODOMETER", "🚗", "transport", "The dial showing how far a vehicle has travelled.", "The ___ read ninety thousand."],
    ["SIGNPOST", "🪧", "transport", "A post with arms showing directions and distances.", "The ___ pointed left."],
    ["ROUNDABOUT", "🔄", "transport", "A circular junction traffic drives around.", "Take the second exit at the ___."],
    ["PEDAL", "🚲", "transport", "The part you push with your foot to drive a bicycle.", "One ___ had come loose."],
    ["HANDLEBAR", "🚲", "transport", "The bar you steer a bicycle with.", "He gripped the ___ tightly."],
    ["COMMUTER", "🚆", "transport", "Somebody who travels to work each day.", "Every ___ knew the timetable."],

    // =====================================================================
    //  CLOTHES
    // =====================================================================
    ["HANGER", "🧥", "clothes", "A shaped frame for keeping a garment in shape.", "Put the coat on a ___."],
    ["LEGGINGS", "🩳", "clothes", "Close-fitting stretchy coverings for the legs.", "She wore ___ under her skirt."],
    ["DUNGAREES", "👖", "clothes", "Trousers with a bib and shoulder straps.", "She painted in her ___."],
    ["WAISTCOAT", "🦺", "clothes", "A sleeveless top worn over a shirt.", "His ___ had five buttons."],
    ["OVERCOAT", "🧥", "clothes", "A long warm coat worn over everything else.", "He shrugged on his ___."],
    ["ANORAK", "🧥", "clothes", "A hooded waterproof jacket.", "Her ___ kept out the sleet."],
    ["PONCHO", "🧥", "clothes", "A cloak with a hole for the head.", "The ___ covered his rucksack too."],
    ["TRACKSUIT", "🩳", "clothes", "A loose two-piece outfit worn for sport.", "He warmed up in his ___."],
    ["SWIMSUIT", "🩱", "clothes", "A garment worn for swimming.", "Pack a dry ___."],
    ["PYJAMAS", "🛌", "clothes", "The soft clothes worn in bed.", "He wore his ___ all morning."],
    ["BATHROBE", "🥿", "clothes", "A loose robe worn over nightclothes.", "She pulled on her ___."],
    ["STOCKING", "🧦", "clothes", "A close-fitting covering for the leg and foot.", "One ___ had a ladder in it."],
    ["MOCCASIN", "🥿", "clothes", "A soft flat shoe made from one piece of hide.", "Each ___ was hand-stitched."],
    ["WELLINGTON", "🥾", "clothes", "A tall waterproof rubber boot.", "One ___ was stuck in the mud."],
    ["BLAZER", "👔", "clothes", "A smart jacket worn as part of a uniform.", "His school ___ had a badge."],
    ["EMBROIDERY", "🧵", "clothes", "Decoration sewn onto cloth with coloured thread.", "The ___ took her all winter."],
    ["PLEAT", "👗", "clothes", "A fold pressed into cloth.", "Each ___ was sharply ironed."],
    ["CUFF", "👔", "clothes", "The band at the end of a sleeve.", "His ___ was frayed."],
    ["LINING", "🧥", "clothes", "The layer of cloth inside a garment.", "The silk ___ had torn."],
    ["FASTENER", "🔲", "clothes", "Anything used to hold clothing closed.", "The ___ had snapped off."],
    ["STARCH", "🧺", "clothes", "A stiffening added to cloth when washing.", "His collars were stiff with ___."],
    ["FLEECE", "🧥", "clothes", "A soft warm jacket made from fluffy fabric.", "Zip your ___ right up."],

    // =====================================================================
    //  ACTIONS
    // =====================================================================

    // =====================================================================
    //  DESCRIBING WORDS
    // =====================================================================

    // =====================================================================
    //  FEELINGS
    // =====================================================================

    // =====================================================================
    //  PLACES, MONEY, TIME, MATHS, TECH, COMMUNITY, MYTHS — top-ups
    // =====================================================================
    ["ISTHMUS", "🗺️", "places", "A narrow neck of land joining two larger areas.", "The road crosses the ___."],
    ["ARCHIPELAGO", "🏝️", "places", "A group or chain of islands.", "The ___ has forty islands."],
    ["METROPOLIS", "🏙️", "places", "A very large and important city.", "It grew into a ___."],
    ["BOULEVARD", "🌳", "places", "A wide street lined with trees.", "The ___ was full of cafes."],
    ["ALLEY", "🚶", "places", "A narrow passage between buildings.", "The cat vanished down the ___."],
    ["QUARRY", "⛏️", "places", "A pit where stone is cut from the ground.", "The ___ closed years ago."],
    ["RESERVOIR", "💧", "places", "A large artificial lake storing water supply.", "The ___ was very low."],
    ["SANCTUARY", "🦌", "places", "A safe place where wildlife is protected.", "The birds nest in the ___."],
    ["LEDGER", "📒", "money", "A book in which accounts are recorded.", "Every sale went in the ___."],
    ["PROGRAMMER", "💻", "tech", "Somebody who writes instructions for computers.", "The ___ fixed the bug overnight."],
    ["KEYPAD", "🔢", "tech", "A small set of buttons for entering numbers.", "Type the code on the ___."],
    ["TOUCHSCREEN", "📱", "tech", "A display you control by touching it.", "The ___ stopped responding."],
    ["RESCUER", "🛟", "community", "Somebody who saves another from danger.", "The ___ waded in after him."],
    ["AMPHORA", "🏺", "myths", "A tall ancient jar with two handles.", "The ___ held olive oil."],
    ["SORCERESS", "🔮", "myths", "A woman of great magical power in old tales.", "The ___ turned them to stone."],

    // =====================================================================
    //  TOP-UP — animal features, plants, cooking, school, sport, house
    // =====================================================================
    ["PELT", "🐻", "animals", "The skin and fur of an animal.", "The ___ was thick and dark."],
    ["MANE", "🦁", "animals", "The long hair along the neck of a lion or horse.", "The wind lifted its ___."],
    ["TUSK", "🐘", "animals", "A very long pointed tooth growing outside the mouth.", "One ___ had snapped off."],
    ["SNOUT", "🐷", "animals", "The projecting nose and jaws of an animal.", "The pig pushed its ___ into the trough."],
    ["GILL", "🐟", "animals", "The organ a fish uses to breathe under water.", "Each ___ opened and closed."],
    ["BEAK", "🐦", "animals", "The hard pointed mouth of a bird.", "It cracked the seed in its ___."],
    ["SAPLING", "🌳", "nature", "A very young slender tree.", "We staked each ___ against the wind."],
    ["ORCHID", "🌺", "nature", "A flower with an unusual and elaborate shape.", "One rare ___ grew in the bog."],
    ["THISTLE", "🌷", "nature", "A prickly plant with a purple tufted head.", "A ___ pricked right through my sock."],
    ["NETTLE", "🌿", "nature", "A weed whose leaves sting when touched.", "A ___ caught the back of my hand."],
    ["BRAMBLE", "🫐", "nature", "A thorny bush that grows blackberries.", "A ___ snagged my sleeve."],
    ["HEATHER", "🌾", "nature", "A low purple shrub covering open moorland.", "The hills turned purple with ___."],
    ["REED", "🪴", "nature", "A tall stiff grass growing in shallow water.", "A warbler nested deep in the ___."],
    ["LICHEN", "🪨", "nature", "A crusty growth on rocks and bark.", "Grey ___ spotted the headstone."],
    ["ALGAE", "🟢", "nature", "Simple green growth that spreads over still water.", "___ turned the pond bright green."],
    ["BROTH", "🍜", "food", "A thin clear soup made by simmering bones.", "A bowl of hot ___ revived us."],
    ["ZEST", "🍋", "food", "The outer coloured peel used for flavour.", "Grate the ___ into the mixture."],
    ["RIND", "🧀", "food", "The tough outer skin of cheese or fruit.", "Cut the ___ off first."],
    ["CRUST", "🍞", "food", "The hard outside of a loaf or pie.", "The ___ was almost burnt."],
    ["CRUMB", "🍪", "food", "A tiny fragment of bread or cake.", "Not one ___ was left."],
    ["LARDER", "🥫", "food", "A cool cupboard where food is kept.", "The ___ smelled of apples."],
    ["MENTOR", "🧑", "school", "An experienced person who guides a beginner.", "His ___ read every draft."],
    ["TUTOR", "📖", "school", "Somebody who teaches one pupil at a time.", "Her ___ comes on Thursdays."],
    ["PITCH", "⚽", "sports", "The marked ground a team game is played on.", "The ___ was waterlogged."],
    ["COURT", "🎾", "sports", "The marked area for tennis or basketball.", "The ___ was freshly swept."],
    ["TRACK", "🏃", "sports", "The oval course runners race around.", "Four laps of the ___ make a mile."],
    ["RACKET", "🏸", "sports", "A frame with strings used to strike a ball.", "A string snapped on her ___."],
    ["GOALPOST", "🥅", "sports", "One of the upright bars marking the scoring area.", "The shot struck the ___."],
    ["PADDLE", "🛶", "sports", "A short oar used to move a small boat.", "He dipped the ___ on each side."],
    ["JAW", "😀", "body", "The bone that holds the lower teeth.", "He clenched his ___."],
    ["SCALP", "🧑", "body", "The skin on the top of the head.", "The cut on his ___ bled a lot."],
    ["RIB", "🦴", "body", "One of the curved bones round the chest.", "He cracked a ___ falling."],
    ["SPLEEN", "🫀", "body", "An organ near the stomach that helps clean the blood.", "The ___ filters old blood cells."],
    ["GUM", "🦷", "body", "The firm pink flesh around the teeth.", "My ___ was sore for days."],
    ["AWNING", "⛱️", "home", "A canvas roof stretched out to give shade.", "The ___ flapped in the breeze."],
    ["BOLSTER", "🛏️", "home", "A long firm pillow laid across a bed.", "She propped the ___ behind her."],
    ["DOORSTEP", "🚪", "home", "The step just outside an outer door.", "Milk was left on the ___."],
    ["GRATE", "🔥", "home", "The metal frame that holds a fire.", "Ash filled the ___."],
    ["HEARTH", "🔥", "home", "The floor of a fireplace and the space before it.", "The cat slept on the ___."],
    ["TILE", "🧱", "home", "A thin flat slab used to cover roofs or floors.", "One ___ had slipped off the roof."],
    ["RAFTER", "🪚", "home", "One of the sloping beams holding up a roof.", "A swallow nested on a ___."],
    ["DOORBELL", "🔔", "home", "The button that rings to announce a visitor.", "The ___ rang twice."],
    ["BOILER", "♨️", "home", "The unit that heats water for a building.", "The ___ broke down in January."]
  ];

  WB.RAW_EXPLORER_5 = raw;
})();

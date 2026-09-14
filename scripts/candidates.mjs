// Candidate words for the picture dictionary, grouped by the category a child
// would file them under.
//
// These are only *candidates*. scripts/verify-candidates.mjs keeps a word only
// when English Wikipedia has an article of exactly that name (no redirect) that
// carries a lead image — which is what guarantees the photograph actually shows
// the word. Anything that fails is dropped silently, so it is fine for a list
// here to be optimistic.

/** @type {Record<string, string[]>} */
export const candidates = {
  Food: `apricot artichoke asparagus aubergine avocado bagel baguette banana barley
    basil beetroot biscuit blackberry blackcurrant blueberry bran bread breadfruit
    brioche broccoli brownie buckwheat bun burrito butter buttermilk cabbage cake
    cantaloupe capsicum caramel cardamom carrot cashew cauliflower caviar celery
    chapati cheese cheesecake cherry chestnut chickpea chilli chive chocolate
    chutney cinnamon clementine cloves cocoa coconut coffee coriander corn
    courgette couscous cracker cranberry cream croissant crouton cucumber cumin
    cupcake curd currant curry custard date dill doughnut dumpling eclair
    fennel fig flour focaccia fondue frankfurter fritter fudge garlic gelatin
    gherkin ginger gingerbread gnocchi gooseberry grape grapefruit gravy guacamole
    guava hamburger hazelnut honey honeydew hummus icing jaggery jam jelly juice
    kale ketchup kimchi kiwifruit lasagne leek lemon lemonade lentil lettuce lime
    liquorice lollipop lychee macaroni macaron mandarin mango maple margarine
    marmalade marzipan mayonnaise meatball melon meringue milk millet mint
    molasses mozzarella muesli muffin mushroom mustard naan nectarine noodle
    nougat nutmeg oatmeal oats okra olive omelette onion orange oregano paella
    pancake papaya paprika parsley parsnip pasta pastry pate pea peach peanut
    pear pecan pepper peppermint persimmon pesto pickle pie pineapple pistachio
    pizza plantain plum pomegranate popcorn poppy porridge potato pretzel prune
    pudding pumpkin quiche quinoa radish raisin raspberry ravioli rhubarb rice
    risotto roll rosemary saffron sage salad salami salt sandwich sardine sauce
    sauerkraut sausage scone semolina sesame shortbread sorbet soup spaghetti
    spinach sprout squash strawberry stew sugar sultana sushi swede sweetcorn
    syrup taco tamarind tangerine tapioca tart tea thyme toast toffee tofu
    tomato tortilla trifle truffle turmeric turnip vanilla vinegar waffle walnut
    wasabi watercress watermelon wheat yam yeast yoghurt`,

  Animals: `aardvark albatross alligator alpaca anaconda anchovy anemone angelfish
    ant anteater antelope ape armadillo baboon badger barnacle barracuda bat
    beaver bee beetle bison blackbird boar bobcat budgerigar buffalo bull
    bullfrog bumblebee butterfly buzzard camel canary capybara cardinal caribou
    carp cat caterpillar catfish centipede chameleon cheetah chick chicken
    chimpanzee chinchilla chipmunk clam cobra cockatoo cockerel cod condor coral
    cormorant cow coyote crab crane cricket crocodile crow cuckoo curlew deer
    dingo dodo dog dolphin donkey dormouse dove dragonfly duck duckling dugong
    eagle earthworm eel egret elephant elk emu falcon fawn ferret finch firefly
    flamingo flea flounder fly foal fox frog gazelle gecko gerbil gibbon giraffe
    gnu goat goldfinch goldfish goose gorilla grasshopper grouse guillemot
    gull hamster hare hawk hedgehog heron herring hippopotamus hornbill hornet
    horse hound hummingbird hyena ibex ibis iguana impala jackal jaguar jay
    jellyfish kangaroo kestrel kingfisher kite kitten koala kookaburra ladybird
    lamb lapwing lark lemming lemur leopard lion lizard llama lobster locust
    lynx macaw mackerel magpie mallard mammoth manatee mandrill marmot marten
    meerkat mink minnow mole mongoose monkey moose mosquito moth mouse mule
    mussel narwhal newt nightingale octopus okapi opossum orangutan orca
    ostrich otter owl ox oyster panda pangolin panther parakeet parrot partridge
    peacock pelican penguin perch pheasant pig pigeon pike piranha platypus
    polecat pony porcupine porpoise possum prawn puffin puma python quail rabbit
    raccoon ram rat rattlesnake raven ray reindeer rhinoceros roadrunner robin
    rooster salamander salmon sandpiper sardine scallop scorpion seagull seahorse
    seal shark sheep shrew shrimp skunk sloth slug snail snake sparrow spider
    squid squirrel starfish starling stingray stoat stork sturgeon swallow swan
    swift tadpole tapir tarantula termite tern terrapin thrush tiger toad
    tortoise toucan trout tuna turkey turtle vulture wallaby walrus warthog
    wasp weasel whale wildebeest wolf wombat woodpecker worm wren yak zebra`,

  Clothes: `anorak apron bandana beanie beret bib blazer blouse bonnet boot bootlace
    bowtie bracelet brooch buckle button cap cape cardigan chiffon cloak coat
    collar corduroy costume cravat crown cuff denim dress dungarees earring
    fleece glove gown hat headband headscarf helmet hood jacket jeans jersey
    jumper kilt kimono lace leggings mitten moccasin necklace nightgown overall
    pyjamas parka petticoat poncho pullover pyjama raincoat robe ribbon ring
    sandal sarong sash scarf shawl shirt shoe shoelace shorts silk skirt
    slipper sneaker sock sombrero stocking suit sweater swimsuit tiara tie
    tights trainer trousers tunic turban tuxedo uniform veil vest waistcoat
    wellington wristband zip`,

  Home: `armchair ashtray axe bandage basin basket bathtub battery bed bedspread
    bell blanket blender blind bolt bookcase bookshelf bottle bowl box broom
    brush bucket bulb cabinet candle candlestick canister carpet cauldron chair
    chandelier chest chimney chisel clock clothesline coathanger colander comb
    computer cooker cork corkscrew cot couch cradle crate crockery cup cupboard
    curtain cushion cutlery desk dishwasher doorbell doorknob doormat drawer
    drill dustbin dustpan duvet fan faucet fence fireplace flask flowerpot fork
    freezer fridge funnel furnace furniture garage gate glass grater grill hammer
    hammock handle hanger hearth heater hinge hoover hose iron jar jug kettle
    key keyboard kitchen knife ladder ladle lamp lantern lawnmower lightbulb lock
    mailbox mallet mattress microwave mirror mixer mop mug nail napkin needle
    oven padlock pail pan pantry pegboard pillow pin pipe pitcher plate pliers
    plug plunger pot pram quilt radiator rake razor refrigerator rope rug ruler
    saucepan saucer saw scale scissors screw screwdriver shelf shovel shower sieve
    sink skillet sofa spade spanner sponge spoon staircase stapler stool stove
    stroller table tablecloth tap teapot telephone television thermometer thermos
    thimble toaster toilet tongs toolbox toothbrush toothpaste torch towel tray
    trowel tub tumbler tweezers umbrella vacuum vase wardrobe washer wastebasket
    watch whisk window wire wrench`,

  School: `abacus album alphabet atlas backpack badge ballpoint bell binder blackboard
    book bookmark briefcase calculator calendar cardboard chalk chalkboard chart
    clipboard compass computer crayon crossword desk diagram diary dictionary
    encyclopedia envelope eraser exercise flashcard folder fountain globe glue
    graph highlighter homework ink inkwell journal keyboard label laptop leaflet
    lesson letter library magazine magnifier map marker microscope monitor
    newspaper notebook notepad novel page paint paintbrush painting palette paper
    paperclip parchment pen pencil pinboard poster printer projector protractor
    puzzle quill ruler satchel schoolbag scissors scrapbook sharpener sketch
    slate stamp staple stapler stationery sticker sum tape telescope textbook
    thesaurus timetable typewriter whiteboard workbook`,

  Toys: `ball balloon bat blocks boomerang bubble bucket cards carousel checkers
    chess clay crayon dice doll dollhouse domino drum firework frisbee game
    hopscotch hula jigsaw jumprope kaleidoscope kite lego marble marionette
    mask model mobile paddle pinwheel playdough puppet puzzle rattle robot
    rocking rollerblade sandcastle scooter seesaw skateboard skittle sledge
    slide slingshot snowman spade spinner stilts swing teddy tent tiddlywinks
    top toy train trampoline tricycle wagon whistle windmill yoyo`,

  Places: `abbey airport alley apartment aquarium arcade arch arena bakery balcony
    bank barn barracks basement bazaar beach bridge bungalow bunker cabin cafe
    campsite canal capital castle cathedral cave cellar cemetery chapel church
    cinema city classroom cloister college corridor cottage courtyard dam depot
    dock dockyard dormitory dungeon embassy factory farm farmhouse fort fortress
    fountain gallery garage garden gate gazebo greenhouse gym hall hamlet harbour
    hospital hostel hotel house hut igloo inn island jetty kennel kiosk kitchen
    laboratory lane library lighthouse lobby lodge mall mansion market maze mill
    mine monastery monument mosque motel museum nursery observatory office orchard
    palace park parliament pavilion pharmacy pier playground plaza pond port
    prison pyramid quay ranch restaurant road roof ruins school shed shop
    skyscraper sportsground square stable stadium stairway station statue stadium
    street studio suburb supermarket temple tent theatre tower town township
    tunnel university valley veranda village villa vineyard warehouse waterfall
    well wharf windmill workshop zoo`,

  Vehicles: `airplane airship ambulance anchor barge bicycle biplane boat bulldozer
    bus cab cabin cable canoe car caravan carriage cart catamaran chariot coach
    convertible crane digger dinghy dredger dumper engine excavator ferry
    forklift freighter frigate glider gondola helicopter hovercraft hydrofoil
    jeep jet kayak ketch launch lifeboat limousine locomotive lorry minibus
    monorail moped motorbike motorcycle motorboat oar paddle parachute pedal
    pram propeller punt raft rickshaw rocket rowboat rudder sail sailboat
    scooter ship sidecar skateboard skis sled sledge sleigh snowmobile spaceship
    speedboat steamboat submarine tanker taxi tractor trailer train tram
    tricycle trolley truck tugboat tyre unicycle van wagon wheel wheelbarrow
    wheelchair windsurfing yacht`,

  Nature: `acorn algae anthill autumn bamboo bark bay beach berry blossom bog boulder
    bough bramble branch bud bush cactus canyon cave cedar cliff climate cloud
    clover coast cocoon compost coral cove crater creek crocus crystal cypress
    daffodil dahlia daisy dandelion dawn delta desert dew ditch dune dusk earth
    fern field fir fjord flower fog forest fossil fungus geyser glacier glade
    grass grove gully gorge harvest hay hazel heather hedge hill hollow honeycomb
    horizon iceberg island ivy jungle juniper lagoon lake lava lawn leaf lichen
    lily magnolia mangrove maple marsh meadow mist moon moss mountain mud nest
    oak oasis ocean orchid palm pasture peak pebble petal pine plain planet
    plateau pollen pond poppy prairie primrose puddle rainbow rainforest ravine
    reed reef ridge river rock root rose sand sapling savanna sea seaweed seed
    shell shore shrub sky snowflake soil spring sprout star stem stone storm
    stream summit sunflower sunset swamp thistle thorn tide toadstool trunk
    tulip tundra twig valley vine volcano waterfall wave weed willow wood`,

  Weather: `avalanche blizzard breeze cloud cyclone dew drizzle drought dust fog
    frost gale hail haze heatwave humidity hurricane ice icicle lightning mist
    monsoon overcast rain rainbow shower sleet slush smog snow snowfall snowflake
    snowstorm storm sunbeam sunlight sunrise sunset sunshine temperature thaw
    thermometer thunder thunderstorm tornado typhoon whirlwind wind`,

  Sport: `archery athletics badminton baseball basketball bat billiards bowling
    boxing bullseye canoeing cricket croquet cycling dart discus diving dumbbell
    fencing football frisbee glove goal goalpost golf gymnastics handball
    helmet hockey hoop hurdle javelin jogging judo karate kayaking kickboxing
    lacrosse marathon medal net paddle podium polo pool racket racquet referee
    rowing rugby sailing scoreboard shuttlecock skating skiing skipping sledging
    snooker snowboarding soccer softball squash stadium stopwatch surfing
    swimming tennis trampoline trophy volleyball weightlifting whistle wrestling`,

  Music: `accordion bagpipes banjo bassoon bell bongo bugle castanets cello chime
    clarinet cornet cymbal drum drumstick fiddle flute gong guitar harmonica
    harmonium harp horn keyboard lute lyre mandolin maraca marimba metronome
    microphone oboe orchestra organ piano piccolo recorder saxophone sitar
    speaker tabla tambourine triangle trombone trumpet tuba ukulele violin
    whistle xylophone zither`,

  Jobs: `accountant acrobat actor architect artist astronaut athlete author baker
    ballerina banker barber blacksmith builder butcher captain carpenter cashier
    chef chemist clown coach cobbler composer conductor cook dancer dentist
    detective doctor driver electrician engineer explorer farmer firefighter
    fisherman florist gardener geologist goldsmith grocer guard guide hairdresser
    historian hunter inventor jeweller journalist judge juggler knight lawyer
    librarian lifeguard locksmith magician mason mechanic merchant miner
    musician nurse optician painter pharmacist philosopher photographer physician
    pilot plumber poet policeman porter postman potter printer professor
    programmer publisher receptionist reporter sailor scientist sculptor
    seamstress secretary shepherd singer soldier surgeon surveyor tailor teacher
    technician translator vet veterinarian waiter watchmaker weaver welder writer`,

  Body: `ankle arm beard cheek chest chin ear elbow eyebrow eyelash eyelid face
    finger fingernail fist forehead freckle hand head heel hip jaw knee kneecap
    knuckle lip moustache mouth muscle neck nostril palm shoulder skeleton skin
    skull smile spine thumb toe tongue tooth waist wrist`,

  Shapes: `arc arrow circle cone cross cube cuboid curve cylinder decagon diagonal
    diamond ellipse heptagon hexagon kite line octagon oval parallelogram
    pentagon polygon prism pyramid quadrilateral rectangle rhombus ring semicircle
    spiral sphere spiral square star trapezium triangle`,

  Colors: `amber azure beige black blue bronze brown copper crimson cyan emerald
    gold green grey indigo ivory jade khaki lavender lilac magenta maroon mauve
    navy olive orange peach pink purple red rose ruby saffron salmon scarlet
    silver tan teal turquoise violet white yellow`,
};

/** Flattened as [word, category] pairs, deduplicated across categories. */
export function candidateList() {
  const seen = new Set();
  const out = [];
  for (const [category, blob] of Object.entries(candidates)) {
    for (const word of blob.split(/\s+/).filter(Boolean)) {
      if (seen.has(word)) continue;
      seen.add(word);
      out.push({ word, category });
    }
  }
  return out;
}

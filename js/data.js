
const FARM_PLANTS = [
    {"id": "watermelon",  "plant": "Watermelon Plant",   "seasons": {                                "spring": true, "summer": true}, "nutrients": {"growth": 4,  "compost": -2, "manure": -2, "water": 0.035 }, "seed": "Square Seeds",      "product": "Watermelon"  },
    {"id": "carrot",      "plant": "Carrot Plant",       "seasons": {"autumn": true, "winter": true, "spring": true                }, "nutrients": {"growth": -4, "compost": 2,  "manure": 2,  "water": 0.0075}, "seed": "Oblong Seeds",      "product": "Carrot"      },
    {"id": "pumpkin",     "plant": "Pumpkin Plant",      "seasons": {"autumn": true, "winter": true                                }, "nutrients": {"growth": -4, "compost": 2,  "manure": 2,  "water": 0.02  }, "seed": "Sharp Seeds",       "product": "Pumpkin"     },
    {"id": "onion",       "plant": "Onion Plant",        "seasons": {"autumn": true,                 "spring": true, "summer": true}, "nutrients": {"growth": -8, "compost": 4,  "manure": 4,  "water": 0.02  }, "seed": "Pointy Seeds",      "product": "Onion"       },
    {"id": "pomegranate", "plant": "Pomegranate Branch", "seasons": {                                "spring": true, "summer": true}, "nutrients": {"growth": -8, "compost": 4,  "manure": 4,  "water": 0.02  }, "seed": "Windblown Seeds",   "product": "Pomegranate" },
    {"id": "corn",        "plant": "Corn Stalk",         "seasons": {"autumn": true,                 "spring": true, "summer": true}, "nutrients": {"growth": 2,  "compost": -4, "manure": 2,  "water": 0.0075}, "seed": "Clustered Seeds",   "product": "Corn"        },
    {"id": "asparagus",   "plant": "Asparagus Fern",     "seasons": {                "winter": true, "spring": true                }, "nutrients": {"growth": 2,  "compost": -4, "manure": 2,  "water": 0.0075}, "seed": "Tubular Seeds",     "product": "Asparagus"   },
    {"id": "durian",      "plant": "Durian Vine",        "seasons": {"spring": true                                                }, "nutrients": {"growth": 4,  "compost": -8, "manure": 4,  "water": 0.0075}, "seed": "Brittle Seed Pods", "product": "Durian"      },
    {"id": "garlic",      "plant": "Garlic Plant",       "seasons": {"autumn": true, "winter": true, "spring": true, "summer": true}, "nutrients": {"growth": 4,  "compost": -8, "manure": 4,  "water": 0.0075}, "seed": "Seed Pods",         "product": "Garlic"      },
    {"id": "tomato",      "plant": "Toma Root Plant",    "seasons": {"autumn": true,                 "spring": true, "summer": true}, "nutrients": {"growth": -2, "compost": -2, "manure": 4,  "water": 0.035 }, "seed": "Spiky Seeds",       "product": "Tomato"      },
    {"id": "potato",      "plant": "Potato Plant",       "seasons": {"autumn": true, "winter": true, "spring": true                }, "nutrients": {"growth": 2,  "compost": 2,  "manure": -4, "water": 0.0075}, "seed": "Fluffy Seeds",      "product": "Potato"      },
    {"id": "eggplant",    "plant": "Eggplant Stalk",     "seasons": {"autumn": true,                 "spring": true                }, "nutrients": {"growth": 2,  "compost": 2,  "manure": -4, "water": 0.02  }, "seed": "Swirly Seeds",      "product": "Eggplant"    },
    {"id": "dragonfruit", "plant": "Dragon Fruit Vine",  "seasons": {                                "spring": true, "summer": true}, "nutrients": {"growth": 4,  "compost": 4,  "manure": -8, "water": 0.02  }, "seed": "Bulbous Seeds",     "product": "Dragon fruit"},
    {"id": "pepper",      "plant": "Pepper Plant",       "seasons": {"autumn": true,                                 "summer": true}, "nutrients": {"growth": 4,  "compost": 4,  "manure": -8, "water": 0.0075}, "seed": "Lumpy Seeds",       "product": "Pepper"      },
]
    .map(e => ({
        ...e,
        "seasons": new Seasons(e["seasons"]),
        "nutrients": new PlantNutrientInfo(e["nutrients"]),
    }))
    .map(e => new FarmPlantInfo(e));


// credit to snap tills mod
const FARM_LAYOUTS = Object.fromEntries(Object.entries({
    "2x2": [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    "3x3": [[-1.333, -1.333], [0, -1.333], [1.333, -1.333], [-1.333, 0], [0, 0], [1.333, 0], [-1.333, 1.333], [0, 1.333], [1.333, 1.333]],
    "4x4": [[-1.99950, -1.99950], [-0.66649, -1.99950], [0.66651, -1.99950], [1.99952, -1.99950], [-1.99950, -0.66649], [-0.66649, -0.66649], [0.66651, -0.66649], [1.99952, -0.66649], [-1.99950, 0.66651], [-0.66649, 0.66651], [0.66651, 0.66651], [1.99952, 0.66651], [-1.99950, 1.99952], [-0.66649, 1.99952], [0.66651, 1.99952], [1.99952, 1.99952]],
    "QUAGMIRE": [[-1.5, -1.5], [-0.5, -1.5], [0.5, -1.5], [1.5, -1.5], [-1.5, -0.5], [-0.5, -0.5], [0.5, -0.5], [1.5, -0.5], [-1.5, 0.5], [-0.5, 0.5], [0.5, 0.5], [1.5, 0.5], [-1.5, 1.5], [-0.5, 1.5], [0.5, 1.5], [1.5, 1.5]],
    "HEXAGON": [[-1.5, -1.6], [0.5, -1.6], [-0.5, -0.8], [1.5, -0.8], [-1.5, 0], [0.5, 0], [-0.5, 0.8], [1.5, 0.8], [-1.5, 1.6], [0.5, 1.6]],
    "HEXAGON2": [[-0.5, -1.6], [1.5, -1.6],[-1.5, -0.8], [0.5, -0.8], [-0.5, 0], [1.5, 0], [-1.5, 0.8], [0.5, 0.8], [-0.5, 1.6], [1.5, 1.6]],
})
    .map(([name, points], i) => [name, points.map(p => new Point(...p))]))

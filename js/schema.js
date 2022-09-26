class Seasons {
    autumn;
    winter;
    spring;
    summer;

    constructor({autumn = false, winter = false, spring = false, summer = false} = {}) {
        this.autumn = autumn;
        this.winter = winter;
        this.spring = spring;
        this.summer = summer;
    }
}


class PlantNutrientInfo {
    growth;
    compost;
    manure;
    water;

    constructor({growth = 0, compost = 0, manure = 0, water = 0} = {}) {
        this.growth = growth;
        this.compost = compost;
        this.manure = manure;
        this.water = water;
    }

    plus(other) {
        return new PlantNutrientInfo({
            "growth": this.growth + other.growth,
            "compost": this.compost + other.compost,
            "manure": this.manure + other.manure,
            "water": this.water + other.water,
        })
    }
}

class FarmPlantInfo {
    id;
    plant;
    name;
    seasons;
    nutrients;
    seed;
    product;

    constructor({id, plant, seasons, nutrients, seed, product, name = plant}) {
        this.id = id;
        this.plant = plant;
        this.name = name;
        this.seasons = seasons;
        this.nutrients = nutrients;
        this.seed = seed;
        this.product = product;
    }
}

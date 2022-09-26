(() => {
    let today = new Date().toJSON().slice(0,10);
    let random = cyrb128(today).reduce((a, b) => a + b, 0);

    let categories = ["giant", "plant", "product", "seed"];
    let todaysCategory = categories[random % categories.length];
    let todaysPlant = FARM_PLANTS[random % FARM_PLANTS.length];

    let link = document.querySelector('link[rel~="icon"]');

    // link.href = `img/${todaysCategory}/${todaysPlant.id}.png`;  // use this one instead to include other images
    link.href = `img/giant/${todaysPlant.id}.png`;
})();
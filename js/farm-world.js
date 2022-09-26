class Farm extends HTMLElement {
    plantPicker;
    world;

    constructor(plantPicker) {
        super();
        this.plantPicker = plantPicker;
        this.world = new FarmWorld();

        this.attachShadow({"mode": "open"});
        this.shadowRoot.plantPicker = this.plantPicker;

        let link = this.shadowRoot.appendChild(document.createElement("link"));
        link.rel = "stylesheet";
        link.href = "css/farm-world.css";

        this.shadowRoot.world = this.shadowRoot.appendChild(this.world);
    }

    clear() {
        this.world.clear();
    }

    setLayout(layout) {
        this.world.setLayout(layout);
    }

    save() {
        let cells = this.world.grid.getAllCells();
        let json = {
            "layout": this.world.layout,
            "cells": cells.map(cell => {
                let coord = cell.coord;
                let plot = cell.div.farmPlot;
                let {layout, rotate, farmSlots} = plot;
                let plants = farmSlots.map(slot => slot.plant?.id);
                return {
                    "coord": coord,
                    "layout": layout,
                    "rotate": rotate,
                    "plants": plants,
                };
            })
        };
        return json;
    }

    load(json) {
        this.clear();
        let {layout, cells} = json;
        this.world.layout = layout;
        cells.forEach(cellInfo => {
            let {coord, layout, rotate, plants} = cellInfo;
            let cell = this.world.grid.getCell(coord.x, coord.y);
            let farmPlot = cell.div.farmPlot;
            farmPlot.setLayout({"layout": layout, "rotate": rotate});
            farmPlot.getSlots().forEach((slot, i) => slot.setPlant(FARM_PLANTS.find(p => p.id == plants[i]) || null));
        });
    }
}

class FarmWorld extends HTMLElement {
    grid;

    constructor() {
        super();
        this.grid = this.appendChild(new StaticGridTable(2, 2));

        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                let cellDiv = this.grid.getCell(i, j).div;
                cellDiv.farmPlot = cellDiv.appendChild(new FarmPlot({"localPosition": new Point(i * 4 + 2, j * 4 + 2)}));
            }
        }

        this.setLayout("HEXAGON90");
    }

    connectedCallback() {
        this.grid.addEventListener("grid-cell-activated", this.checkAllFamily.bind(this));
        this.grid.addEventListener("grid-cell-deactivated", this.checkAllFamily.bind(this));
    }

    disconnectedCallback() {
        removeAllEventListeners(this.grid);
    }

    setLayout(layout) {
        this.layout = layout;
        let perPlotLayoutFunc = {
            "2x2": (x, y) => ({"layout": "2x2"}),
            "3x3": (x, y) => ({"layout": "3x3"}),
            "4x4": (x, y) => ({"layout": "4x4"}),
            "HEXAGON": (x, y) => ({"layout": y % 2 ? "HEXAGON" : "HEXAGON2"}),
            "HEXAGON90": (x, y) => ({"layout": x % 2 ? "HEXAGON" : "HEXAGON2", "rotate": 1}),
        }[layout];

        this.grid.getAllCells().forEach(cell =>
                cell.div.farmPlot.setLayout(perPlotLayoutFunc(cell.coord.x, cell.coord.y)));
    }

    getAllFarmPlots() {
        return this.grid.getAllCells().map(cell => cell.div.farmPlot);
    }

    clear() {
        this.getAllFarmPlots().forEach(plot => plot.clear());
    }

    getActivePlantSlots() {
        return this.grid.getAllCells()
            .filter(cell => cell.isActive())
            .flatMap(cell => cell.div.farmPlot.getSlots());
    }

    getPlantSlotsWithinRadius(target, radius) {
        let sqRadius = radius ** 2;
        return this.getActivePlantSlots()
            .filter(slot => target.transform.position.sqdistance(slot.transform.position) <= sqRadius);
    }

    checkAllFamily() {
        this.getActivePlantSlots().forEach(slot => slot.checkFamily());
    }
}

class InfiniteGridTable extends HTMLTableElement {
    x0;
    y0;
    x1;
    y1;
    occupied;

    constructor() {
        super();
        [this.x0, this.y0, this.x1, this.y1] = [0, 0, 0, 0];
        this.occupied = [];
    }

    connectedCallback() {
    }

    getCell(x, y) {
    }
}

class StaticGridTable extends HTMLTableElement {
    width;
    height;
    cells;

    constructor(width, height) {
        super();
        this.width = width;
        this.height = height;

        this.bg = this.appendChild(document.createElement("div"));
        this.bg.classList.add("bg");

        this.body = this.createTBody();
        this.cells = new Array(this.height).fill(0).map((_, y) => {
            let row = this.body.insertRow();
            return new Array(this.width).fill(0).map((_, x) =>
                row.appendChild(new GridCell({"coord": new Point(x, y)})));
        });
    }

    connectedCallback() {
        this.getAllCells().forEach(cell => {
            cell.addEventListener("grid-cell-activated", e => {
                this.updateClipPath();
                this.dispatchEvent(new CustomEvent("grid-cell-activated", {"detail": {"cell": e.target}}));
            });
            cell.addEventListener("grid-cell-deactivated", e => {
                this.updateClipPath();
                this.dispatchEvent(new CustomEvent("grid-cell-deactivated", {"detail": {"cell": e.target}}));
            });
        });

        this.updateClipPath();
    }

    disconnectedCallback() {
        this.getAllCells().forEach(removeAllEventListeners);

        this.updateClipPath();
    }

    getAllCells() {
        return this.cells.flatMap(row => row);
    }

    getCell(x, y) {
        return this.cells[y][x];
    }

    updateClipPath() {
        this.bg.style.clipPath = this.computeClipPath();
    }

    computeClipPath() {
        let activatedCells = this.cells
            .flatMap((r, y) => r
                .map((c, x) => [c.isActive(), [x, y]]))
            .filter(c => c[0])
            .map(c => c[1]);
        if (activatedCells.length == 0) {
            return "polygon(0 0)";
        }
        let path = activatedCells
            .flatMap(([x, y]) => [[.01, .01], [.01, .99], [.99, .99], [.99, .01], [.01, .01]]
                .map(([i, j]) => [x + i, y + j]));
        path.push(...activatedCells.reverse().map(([x, y]) => [x + .01, y + .01]));
        let css = path
            .map(p => p.map(i => `calc(var(--plot-side) * ${i})`).join(" "))
            .join(",");
        return `polygon(${css})`;
    }
}


class GridCell extends HTMLTableCellElement {
    coord;
    div;

    constructor({coord=new Point()}) {
        super();
        this.coord = coord;
        this.div = this.appendChild(document.createElement("div"));
    }

    connectedCallback() {
        this.addEventListener("click", noBubble(this.activate.bind(this)));
        this.addEventListener("contextmenu", noBubble(this.deactivate.bind(this)));
    }

    disconnectedCallback() {
        removeAllEventListeners(this);
    }

    isActive() {
        return getComputedStyle(this.div).getPropertyValue("visibility") == "visible";
    }

    activate() {
        this.div.style.visibility = "visible";
        this.dispatchEvent(new CustomEvent("grid-cell-activated"));
    }

    deactivate() {
        this.div.style.visibility = "hidden";
        this.dispatchEvent(new CustomEvent("grid-cell-deactivated"));
    }

    toggle() {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }
}


class FarmPlot extends HTMLElement {
    transform;
    layout;
    rotate;
    farmSlots;

    constructor({parent, localPosition}) {
        super();
        this.transform = new Transform({"parent": parent, "localPosition": localPosition});
        this.farmSlots = [];
        this.infoPanel = this.appendChild(new FarmPlotInfo());
    }

    setLayout({layout, rotate = 0}) {
        rotate %= 4;
        if (this.layout != layout || this.rotate != rotate) {
            this.layout = layout;
            this.rotate = rotate;
            this.setSlotsLayout(FARM_LAYOUTS[layout], rotate);
        }
    }

    setSlotsLayout(points, rotate=0) {
        rotate %= 4;
        this.farmSlots.forEach(s => s.remove());
        this.farmSlots = points
            .map(p => p.rotate90({"times": rotate}))
            .map(p => new FarmSlot({"parent": this, "localPosition": p}));
        this.append(...this.farmSlots);
        this.farmSlots.forEach(slot => slot.addEventListener("plant-changed", this.updateInfoPanel.bind(this)));
    }

    clear() {
        this.getSlots().forEach(slot => slot.setPlant(null));
    }

    getSlots() {
        return this.farmSlots;
    }

    getNutrientInfo() {
        return this.farmSlots
            .filter(slot => slot.plant != null)
            .map(slot => slot.getNutrientInfo())
            .reduce((a, b) => a.plus(b), new PlantNutrientInfo());
    }

    updateInfoPanel() {
        this.infoPanel.setNutrientInfo(this.getNutrientInfo());
    }
}

class FarmPlotInfo extends HTMLElement {
    constructor() {
        super();
        this.table = this.appendChild(document.createElement("table"));
        let body = this.table.createTBody();

        ["Growth", "Compost", "Manure", "Water"].forEach(nutrient => {
            let row = body.insertRow();
            row.insertCell().innerText = nutrient;
            this[nutrient.toLowerCase()] = row.insertCell();
        });

        this.setNutrientInfo(new PlantNutrientInfo());
    }

    connectedCallback() {
        this.addEventListener("mouseenter", this.showHover.bind(this));
        this.addEventListener("mouseleave", this.hideHover.bind(this));
        this.addEventListener("click", this.showClick.bind(this));
    }

    disconnectedCallback() {
        removeAllEventListeners(this);
    }

    setNutrientInfo(nutrientInfo) {
        this.growth.innerText = Math.round(nutrientInfo.growth * 1e4) / 1e4;
        this.compost.innerText = Math.round(nutrientInfo.compost * 1e4) / 1e4;
        this.manure.innerText = Math.round(nutrientInfo.manure * 1e4) / 1e4;
        this.water.innerText = Math.round(nutrientInfo.water * 1e4) / 1e4;
    }

    getAllInfos() {
        return this.getRootNode().querySelectorAll("farm-plot-info");
    }

    showHover(e) {
        this.getAllInfos().forEach(info => info.classList.add("show-hover"));
    }

    hideHover(e) {
        this.getAllInfos().forEach(info => info.classList.remove("show-hover"));
    }

    showClick(e) {
        let allInfos = this.getAllInfos();
        if (this.classList.contains("show-click")) {
            allInfos.forEach(info => info.classList.remove("show-click"));
        } else {
            allInfos.forEach(info => info.classList.add("show-click"));
        }
    }
}

class FarmSlot extends HTMLElement {
    transform;
    plant;

    constructor({parent, localPosition}) {
        super();
        this.transform = new Transform({"parent": parent, "localPosition": localPosition});

        this.style.setProperty("--x", this.transform.localPosition.x);
        this.style.setProperty("--y", this.transform.localPosition.y);

        this.img = this.appendChild(document.createElement("img"));

        setInterval(this.updateZIndex.bind(this), 1);
    }

    get plantPicker() {
        return this.getRootNode().plantPicker;
    }

    get world() {
        return this.getRootNode().world;
    }

    connectedCallback() {
        this.initPencil();
    }

    updateZIndex() {
        let bound = this.getBoundingClientRect();
        this.style.setProperty("z-index", Math.round(bound.top + bound.height).toString());
    }

    setPlant(plant) {
        if (plant === undefined) {
            plant = this.plantPicker.getPlant();
        }
        let oldPlant = this.plant;
        if (plant == oldPlant) {
            return;
        }

        this.plant = plant;
        if (plant != null) {
            this.setAttribute("plant", plant.id);
        } else {
            this.removeAttribute("plant");
        }
        this.dispatchEvent(new CustomEvent("plant-changed", {"detail": {"oldPlant": oldPlant, "newPlant": plant}}));
        let plantsWithinRadius = this.world.getPlantSlotsWithinRadius(this, 4);
        plantsWithinRadius.filter(slot => slot.plant == oldPlant || slot.plant == plant)
            .forEach(slot => slot.checkFamily());
    }

    checkFamily() {
        let familyCount = this.world.getPlantSlotsWithinRadius(this, 4)
            .filter(slot => slot.plant == this.plant).length;
        if (familyCount < 4) {
            this.classList.add("lonely");
        } else {
            this.classList.remove("lonely");
        }
    }

    getNutrientInfo() {
        return this.plant?.nutrients;
    }


    /* pencil logic */

    initPencil() {
        this.world.pencilState ||= {};
        this.pencilState = this.world.pencilState;
        this.addEventListener("mousedown", this.startPencil.bind(this));
        this.addEventListener("mouseenter", this.mouseEnter.bind(this));
        this.checkPencilListener = this.checkPencil.bind(this);
        this.endPencilListener = this.endPencil.bind(this);
        this.clickCaptureListener = noBubble(this.captureClick.bind(this));
    }

    startPencil(e) {
        if (this.pencilState.pencilDown) {
            return;
        }
        this.pencilState.pencilDown = e.which;
        this.pencilState.penciling = false;
        this.pencilState.pencilStartPoint = new Point(e.x, e.y);
        this.pencilState.pencilPlant = e.which == 1 ? undefined : null;
        this.startListeningToMouseMovePencil();
        this.startListeningToMouseUpPencil();
    }

    checkPencil(e) {
        if (new Point(e.x, e.y).sqdistance(this.pencilState.pencilStartPoint) > 6 ** 2) {
            this.pencilState.penciling = true;
            this.setPlant(this.pencilState.pencilPlant);
            this.stopListeningToMouseMovePencil();
        }
    }

    mouseEnter(e) {
        if (this.pencilState.penciling) {
            this.setPlant(this.pencilState.pencilPlant);
        }
    }

    endPencil(e) {
        if (this.anotherPencilIsDown(e.which)) {
            return;
        }
        if (!this.pencilState.penciling) {
            switch (e.which) {
                case 1: this.setPlant(undefined); break;
                case 3: this.setPlant(null); break;
            }
        }
        this.pencilState.pencilDown = false;
        this.pencilState.penciling = false;
        this.stopListeningToMouseMovePencil();
        this.stopListeningToMouseUpPencil();
    }

    captureClick(e) {
        if (this.anotherPencilIsDown(e.which)) {
            return;
        }
        window.removeEventListener("click", this.clickCaptureListener, true);
        window.removeEventListener("contextmenu", this.clickCaptureListener, true);
    }

    anotherPencilIsDown(which) {
        return this.pencilState.pencilDown && this.pencilState.pencilDown != which;
    }

    startListeningToMouseMovePencil() {
        this.addEventListener("mousemove", this.checkPencilListener);
    }

    stopListeningToMouseMovePencil() {
        this.removeEventListener("mousemove", this.checkPencilListener);
    }

    startListeningToMouseUpPencil() {
        window.addEventListener("mouseup", this.endPencilListener);
        window.addEventListener("click", this.clickCaptureListener, true);
        window.addEventListener("contextmenu", this.clickCaptureListener, true);
    }

    stopListeningToMouseUpPencil() {
        window.removeEventListener("mouseup", this.endPencilListener);
    }
}

customElements.define("farm-display", Farm);
customElements.define("farm-world", FarmWorld);
customElements.define("farm-grid-table", StaticGridTable, {"extends": "table"});
customElements.define("farm-grid-cell", GridCell, {"extends": "td"});
customElements.define("farm-plot", FarmPlot);
customElements.define("farm-plot-info", FarmPlotInfo);
customElements.define("farm-slot", FarmSlot);

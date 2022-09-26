class PlantPicker extends HTMLElement {
    plant;

    constructor() {
        super();
        this.attachShadow({"mode": "open"});
        this.table = this.shadowRoot.appendChild(new PlantPickerTable());

        let link = this.shadowRoot.appendChild(document.createElement("link"));
        link.rel = "stylesheet";
        link.href = "css/plant-picker.css";
    }

    connectedCallback() {
        this.table.allRows.forEach(r => r.addEventListener("click", e => this.selectPlant(r)));
    }

    disconnectedCallback() {
        this.table.allRows.forEach(removeAllEventListeners);
    }

    selectPlant(r) {
        this.table.allRows.forEach(e => e.deselect());
        r.select();
        this.plant = r.plant.id != null ? r.plant : null;
        this.dispatchEvent(new CustomEvent("plant-selected", {"detail": {"plant": this.plant}}));
    }

    getPlant() {
        return this.plant;
    }
}

class PlantPickerTable extends HTMLTableElement {
    removePlant;
    plantRows;
    currentSort;

    constructor() {
        super();
        this.constructHeader(FARM_PLANTS[0]);

        this.removePlant = new PlantPickerRemove();
        this.plantRows = [];
        this.plantRows.push(...FARM_PLANTS.map(p => new PlantPickerPlant(p)));

        this.allRows = [this.removePlant, ...this.plantRows];

        this.body = this.createTBody();
        this.body.append(...this.allRows);

        // clicking the plant header means "default sort"
        this.currentSort = [];
        this.plantHeader = this.getSortableHeaders().find(h => h.keys[0] == "plant");
        this.plantHeader.keyFunc = plantInfo => FARM_PLANTS.indexOf(plantInfo);
        this.setSortDirection(this.plantHeader, 1);
    }

    connectedCallback() {
        this.getSortableHeaders().forEach(h => h.addEventListener("click", this.sortBy.bind(this, h)));
    }

    disconnectedCallback() {
        this.getSortableHeaders().forEach(removeAllEventListeners);
    }

    constructHeader(data) {
        class Header {
            name;
            width = 1;
            yIndex = 0;
            rowspan;
        }

        function dataToHeaders(thead, obj) {
            let rowsReversed = [];

            (function traverser(o) {
                // converts a nested object into tHead with rowspan. steps:
                // "height" means y-index (not css height)
                // map non object children to header with height = 1
                // map object children with recursion
                //     they are now headers
                // i am a header with width = sum of children length
                //                    height = max height of children + 1
                // set rowspan of children based on difference from maximum yIndex among all children
                let childrenResult = Object.entries(o)
                    .map(([k, v], i) => Object.assign(v instanceof Object ? traverser(v) : new Header(), {"name": k}));
                let width = childrenResult.map(c => c.width).reduce((a, b) => a + b, 0);
                let yIndex = Math.max(...childrenResult.map(c => c.yIndex)) + 1;
                childrenResult.forEach(c => {
                    c.rowspan = yIndex - c.yIndex;
                    (rowsReversed[c.yIndex + c.rowspan - 1] ||= []).push(c);
                });
                return Object.assign(new Header(), {width: width, yIndex: yIndex});
            })(obj);

            let rows = rowsReversed.reverse();
            rows.forEach(rowData => {
                let row = thead.insertRow();
                rowData.forEach(header => {
                    let cell = row.appendChild(document.createElement("th"));
                    cell.key = header.name;
                    cell.textContent = header.name.charAt(0).toUpperCase() + header.name.slice(1);
                    if (header.width > 1) {
                        cell.colSpan = header.width;
                    }
                    if (header.rowspan > 1) {
                        cell.rowSpan = header.rowspan;
                    }
                });
            });
        }

        this.deleteTHead();
        let dataToBecomeHeaders = (({id, ...o}) => ({"plant": null, ...o}))(data);
        dataToHeaders(this.createTHead(), dataToBecomeHeaders);

        this.attachHeaderLineage(this.tHead);
    }

    getSortableHeaders() {
        return getTableMatrix(this.tHead)[1];
    }

    attachHeaderLineage() {
        let matrix = getTableMatrix(this.tHead);
        let transpose = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
        transpose.forEach(column => {
            let ancestors = [];
            let previous = undefined;
            return column.forEach(header => {
                if (header != previous) {
                    header.parent = previous;
                    ancestors.push(header);
                    header.keys = ancestors.map(a => a.key);
                    header.keyFunc = plantInfo => header.keys.reduce((d, k) => d[k], plantInfo);
                    header.direction = 0;
                    previous = header;
                }
            });
        });
    }

    cycleSortDirection(header) {
        // cycle 0 => 1 => -1 => 0
        this.setSortDirection(header, (header.direction + 2) % 3 - 1);
    }

    resetSortDirection(header) {
        this.setSortDirection(header, 0);
    }

    setSortDirection(header, direction) {
        if (header.direction == direction) {
            return;
        }
        header.direction = direction;
        header.setAttribute("direction", direction);
        switch (direction) {
            case 0: this.currentSort.splice(this.currentSort.indexOf(header), 1); break;
            case 1: this.currentSort.push(header); break;
        }
    }

    sortBy(header) {
        if (header != this.plantHeader) {
            this.setSortDirection(this.plantHeader, 0);
        } else if (this.currentSort[0] != this.plantHeader) {
            this.currentSort.map(e => e).forEach(this.resetSortDirection.bind(this));
        }
        this.cycleSortDirection(header);

        function compare(left, right, direction=0) {
            if (direction == -1) {
                [left, right] = [right, left];
            }
            switch (typeof (left)) {
                case "string": return left.localeCompare(right);
                case "number": case "boolean": return left - right;
            }
        }
        let sortFunc = (row1, row2) => {
            return this.currentSort.map(header => {
                let left = header.keyFunc(row1.plant);
                let right = header.keyFunc(row2.plant);
                return compare(left, right, header.direction);
            }).find(e => e != 0);
        };

        this.plantRows.sort(sortFunc);
        this.append(...this.plantRows);
    }
}

class PlantPickerRow extends HTMLTableRowElement {
    plant;

    constructor(plant) {
        super();
        this.plant = plant;

        this.icon = this.insertCell();
        this.name = this.insertCell();
        this.autumn = this.insertCell();
        this.winter = this.insertCell();
        this.spring = this.insertCell();
        this.summer = this.insertCell();
        this.growth = this.insertCell();
        this.compost = this.insertCell();
        this.manure = this.insertCell();
        this.water = this.insertCell();
        this.seed = this.insertCell();
        this.product = this.insertCell();
    }

    select() {
        this.classList.add("selected");
    }

    deselect() {
        this.classList.remove("selected");
    }
}

class PlantPickerPlant extends PlantPickerRow {
    constructor(plant) {
        super(plant);
        this.addImage(this.icon, "plant");
        this.name.textContent    = this.plant.name;
        this.autumn.textContent  = {true: "x"}[this.plant.seasons?.autumn];
        this.winter.textContent  = {true: "x"}[this.plant.seasons?.winter];
        this.spring.textContent  = {true: "x"}[this.plant.seasons?.spring];
        this.summer.textContent  = {true: "x"}[this.plant.seasons?.summer];
        this.growth.textContent  = this.plant.nutrients?.growth;
        this.compost.textContent = this.plant.nutrients?.compost;
        this.manure.textContent  = this.plant.nutrients?.manure;
        this.water.textContent   = this.plant.nutrients?.water;
        this.addImage(this.seed, "seed");
        this.addImage(this.product, "product");
    }

    addImage(e, attribute) {
        e.img = e.appendChild(document.createElement("img"));
        e.img.src = `img/${attribute}/${this.plant.id}.png`;
        e.img.alt = FARM_PLANTS.find(p => p.id == this.plant.id)[attribute];
        e.img.title = e.img.alt;
    }
}

class PlantPickerRemove extends PlantPickerRow {
    constructor() {
        super(new FarmPlantInfo({"name": "Remove plant"}));
        this.icon.img = this.icon.appendChild(document.createElement("img"));
        this.icon.img.src = `img/shovel.png`;
        this.name.textContent = this.plant.name;
    }
}

customElements.define("plant-picker", PlantPicker);
customElements.define("plant-picker-table", PlantPickerTable, {"extends": "table"});
customElements.define("plant-picker-row", PlantPickerRow, {"extends": "tr"});
customElements.define("plant-picker-plant", PlantPickerPlant, {"extends": "tr"});
customElements.define("plant-picker-remove", PlantPickerRemove, {"extends": "tr"});

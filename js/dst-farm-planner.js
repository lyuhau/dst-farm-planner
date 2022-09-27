class DstFarmPlanner extends HTMLElement {
    farm;
    plantPicker;

    constructor() {
        super();
        window.dstFarmPlanner = this;

        this.plantPicker = new PlantPicker();
        this.farm = new Farm(this.plantPicker);

        this.layoutDiv = document.createElement("div");
        this.layoutClear = this.layoutDiv.appendChild(document.createElement("button"));
        this.layoutClear.innerText = "Clear farm";
        this.layoutDiv.appendChild(document.createElement("label")).innerText = "Select Layout:";
        this.layoutSelect = this.layoutDiv.appendChild(document.createElement("select"));
        [["2x2", "2x2"], ["3x3", "3x3"], ["4x4 (buggy)", "4x4"], ["Hexagon", "HEXAGON"], ["Rotated Hexagon", "HEXAGON90", true]]
            .forEach(([name, layoutId, def]) => {
                let option = this.layoutSelect.appendChild(document.createElement("option"));
                option.innerText = name;
                option.value = layoutId;
                if (def) {
                    option.selected = true;
                }
            });

        this.saveDiv = document.createElement("div");
        this.saveButton = this.saveDiv.appendChild(document.createElement("button"));
        this.saveButton.innerText = "Save";
        this.saveUrlButton = this.saveDiv.appendChild(document.createElement("button"));
        this.saveUrlButton.innerText = "Save as link";
        this.loadButton = this.saveDiv.appendChild(document.createElement("button"));
        this.loadButton.innerText = "Load";
        this.saveLoadDiv = this.saveDiv.appendChild(document.createElement("div"));
        this.saveLoadDiv.classList.add("save-load");
        this.saveLoadInput = this.saveLoadDiv.appendChild(document.createElement("input"));
        this.saveLoadInput.placeholder = "Paste save data...";
        this.copyButton = this.saveLoadDiv.appendChild(document.createElement("button"));
        this.copyStatus = this.saveDiv.appendChild(document.createElement("span"));
        this.copyStatus.classList.add("copy-status");

        this.column1 = document.createElement("div");
        this.column1.append(this.farm);

        this.column2 = document.createElement("div");
        this.column2.append(this.plantPicker, document.createElement("hr"), this.layoutDiv, this.saveDiv);
    }

    connectedCallback() {
        this.append(this.column1, this.column2);

        this.layoutClear.addEventListener("click", this.clear.bind(this));
        this.layoutSelect.addEventListener("change", this.setLayout.bind(this));

        this.saveButton.addEventListener("click", this.save.bind(this));
        this.saveUrlButton.addEventListener("click", this.saveUrl.bind(this));
        this.loadButton.addEventListener("click", this.load.bind(this));
        this.copyButton.addEventListener("click", this.copySaveToClipboard.bind(this));

        this.load(this.getDataFromUrl(window.location.href));
    }

    disconnectedCallback() {
        removeAllEventListeners(this.layoutClear, this.layoutSelect, this.saveButton, this.loadButton, this.copyButton);
    }

    clear() {
        this.farm.clear();
    }

    setLayout(e) {
        this.farm.setLayout(e.target.value);
    }

    async save() {
        let save = this.farm.save();
        let data = await this.encode(save);
        this.saveLoadInput.value = data;
    }

    async saveUrl() {
        let save = this.farm.save();
        let data = await this.encode(save);
        this.saveLoadInput.value = `${window.location.origin}${window.location.pathname}?data=${data}`;
    }

    async load(data = this.saveLoadInput.value) {
        let save = await this.decode(data);
        this.layoutSelect.value = save.layout;
        this.farm.load(save);
    }

    async encode(object) {
        return btoa(_arrayBufferToBase64(await compress(JSON.stringify(object), "deflate")));
    }

    async decode(data) {
        try {
            return JSON.parse(await decompress(_base64ToArrayBuffer(atob(data)), "deflate"));
        } catch (e) {}
        try {
            return JSON.parse(atob(data));
        } catch (e) {}
    }

    getDataFromUrl(input) {
        try {
            const url = new URL(input);
            const params = new URLSearchParams(url.search);
            return params.get("data");
        } catch (e) {
            if (e instanceof TypeError) {
                return null;
            } else {
                throw e;
            }
        }
    }

    copySaveToClipboard() {
        this.saveLoadInput.setSelectionRange(0, this.saveLoadInput.value.length);
        this.copyStatus.classList.remove("success");
        this.copyStatus.classList.remove("failure");
        navigator.clipboard.writeText(this.saveLoadInput.value).then(
            () => this.copyStatus.classList.add("success"),
            () => this.copyStatus.classList.add("failure")
        );
    }
}

customElements.define("dst-farm-planner", DstFarmPlanner);

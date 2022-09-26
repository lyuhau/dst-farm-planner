function removeAllEventListeners(...elements) {
    elements.forEach(e =>
        getEventListeners(e).forEach(({listener, useCapture}) =>
            e.removeEventListener(listener, useCapture)));
}

function noBubble(handler) {
    function noBubbleHandler(e) {
        if (handler != null) {
            handler(e);
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    return noBubbleHandler;
}

// credit: https://stackoverflow.com/a/36063581/2110227
function getTableMatrix(table) {
    let cells2D = [];
    let rows = table.rows;
    let rowsLength = rows.length;
    for (let r = 0; r < rowsLength; ++r) {
        cells2D[r] = [];
    }
    for (let r = 0; r < rowsLength; ++r) {
        let cells = rows[r].cells;
        let x = 0;
        for (let c = 0, cellsLength = cells.length; c < cellsLength; ++c) {
            let cell = cells[c];
            while (cells2D[r][x]) {
                ++x;
            }
            let x3 = x + (cell.colSpan || 1);
            let y3 = r + (cell.rowSpan || 1);
            for (let y2 = r; y2 < y3; ++y2) {
                for (let x2 = x; x2 < x3; ++x2) {
                    cells2D[y2][x2] = cell;
                }
            }
            x = x3;
        }
    }

    return cells2D;
}

// credit: https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

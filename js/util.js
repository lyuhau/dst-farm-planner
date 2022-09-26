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

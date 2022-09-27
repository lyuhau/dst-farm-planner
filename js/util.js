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
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}


function split(string, delim, limit = Number.MAX_SAFE_INTEGER) {
    if (delim instanceof RegExp) {
        var reFlags = 'g';
        reFlags += delim.ignoreCase ? 'i' : '';
        reFlags += delim.multiline ? 'm' : '';
        delim = RegExp(delim.source, reFlags);

        let parts = [], start = 0, exec = undefined;
        while (exec = delim.exec(string)) {
            parts.push(string.slice(start, exec.index));
            parts.push(exec[0]);
            start = exec.index + exec[0].length;
        }
        parts.push(string.slice(start));

        const result = [];
        while (result.length < limit - 1 && parts.length >= 2) {
            const [part, _, ...rest] = parts;
            result.push(part);
            parts = rest;
        }
        result.push(parts.join(''));

        return result;
    }

    delim = delim.toString();
    const parts = string.split(delim);
    const result = parts.slice(0, limit - 1);
    if (parts.length > limit - 1) {
        result.push(parts.slice(limit - 1).join(delim));
    }
    return result;
}

// credit: https://stackoverflow.com/questions/4570333/string-compression-in-javascript
function compress(string, encoding) {
    const byteArray = new TextEncoder().encode(string);
    const cs = new CompressionStream(encoding);
    const writer = cs.writable.getWriter();
    writer.write(byteArray);
    writer.close();
    return new Response(cs.readable).arrayBuffer();
}

function decompress(byteArray, encoding) {
    const cs = new DecompressionStream(encoding);
    const writer = cs.writable.getWriter();
    writer.write(byteArray);
    writer.close();
    return new Response(cs.readable).arrayBuffer().then(function (arrayBuffer) {
        return new TextDecoder().decode(arrayBuffer);
    });
}

// credit: https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
function _arrayBufferToBase64( buffer ) {
    let binary = '';
    let bytes = new Uint8Array( buffer );
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

// credit: https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
function _base64ToArrayBuffer(base64) {
    let binary_string = window.atob(base64);
    let len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

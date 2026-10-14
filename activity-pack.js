// Activity share pack — quoted CSV + optional zip with pictures (D-057).
// CSV quoting so commas in sentences survive Load. Pictures live in media/, not inside the CSV.

function csvEscape(value) {
    const s = String(value == null ? '' : value);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
}

function csvUnquote(raw) {
    const s = String(raw == null ? '' : raw).trim();
    if (s.length >= 2 && s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') {
        return s.slice(1, -1).replace(/""/g, '"');
    }
    return s;
}

/** RFC 4180 records. Quoted commas and newlines stay inside one cell. */
function parseCsvRecords(text) {
    const s = String(text || '').replace(/^\uFEFF/, '');
    const records = [];
    let row = [];
    let field = '';
    let i = 0;
    let inQuotes = false;
    while (i < s.length) {
        const c = s.charAt(i);
        if (inQuotes) {
            if (c === '"') {
                if (s.charAt(i + 1) === '"') {
                    field += '"';
                    i += 2;
                    continue;
                }
                inQuotes = false;
                i += 1;
                continue;
            }
            field += c;
            i += 1;
            continue;
        }
        if (c === '"') {
            inQuotes = true;
            i += 1;
            continue;
        }
        if (c === ',') {
            row.push(field);
            field = '';
            i += 1;
            continue;
        }
        if (c === '\r') {
            i += 1;
            continue;
        }
        if (c === '\n') {
            row.push(field);
            field = '';
            records.push(row);
            row = [];
            i += 1;
            continue;
        }
        field += c;
        i += 1;
    }
    if (field.length || row.length) {
        row.push(field);
        records.push(row);
    }
    return records;
}

function serializeActivityCsv(data) {
    const headers = (data && data.promptHeaders) || [];
    const labels = (data && data.criterionLabels) || [];
    const grid = (data && data.categories) || {};
    const objective = (data && data.objective) ? data.objective : 'No objective set';
    let out = 'PromptMe Activity Export\n';
    out += 'Exported: ' + csvEscape(new Date().toLocaleString()) + '\n';
    out += 'Activity Name: ' + csvEscape((data && data.activityName) || 'Untitled Activity') + '\n';
    out += 'Objective: ' + csvEscape(String(objective).replace(/\n/g, ' ')) + '\n';
    out += 'Theme: ' + csvEscape((data && data.theme) || 'windows') + '\n';
    out += 'Background: ' + csvEscape((data && data.background) || 'black') + '\n';
    out += 'Prompt 1 Interests Mode: ' + ((data && data.prompt1InterestsMode) ? 'Yes' : 'No') + '\n';
    out += 'Criterion Labels: ' + labels.map(csvEscape).join(',') + '\n\n';
    out += ['Category'].concat(headers).map(csvEscape).join(',') + '\n';
    Object.keys(grid).forEach(function (grouping) {
        const cols = grid[grouping] || [];
        let maxRows = 0;
        for (let c = 0; c < cols.length; c++) {
            if (Array.isArray(cols[c]) && cols[c].length > maxRows) maxRows = cols[c].length;
        }
        const colCount = Math.max(headers.length, cols.length);
        for (let i = 0; i < maxRows; i++) {
            const row = [grouping];
            for (let c = 0; c < colCount; c++) {
                const arr = cols[c] || [];
                row.push(arr[i] || '');
            }
            out += row.map(csvEscape).join(',') + '\n';
        }
    });
    return out;
}

function parseActivityCsv(text) {
    const raw = String(text || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const result = {
        activityName: '',
        objective: '',
        theme: 'windows',
        background: 'black',
        prompt1InterestsMode: false,
        criterionLabels: [],
        promptHeaders: [],
        categories: {}
    };
    const tableMatch = raw.match(/^Category,/m);
    const tableIdx = tableMatch ? tableMatch.index : -1;
    const metaBlock = tableIdx >= 0 ? raw.slice(0, tableIdx) : raw;
    metaBlock.split('\n').forEach(function (line) {
        const t = line.trim();
        if (t.indexOf('Activity Name:') === 0) {
            result.activityName = csvUnquote(t.slice('Activity Name:'.length));
        } else if (t.indexOf('Objective:') === 0) {
            result.objective = csvUnquote(t.slice('Objective:'.length));
            if (result.objective === 'No objective set') result.objective = '';
        } else if (t.indexOf('Theme:') === 0) {
            result.theme = csvUnquote(t.slice('Theme:'.length)) || 'windows';
        } else if (t.indexOf('Background:') === 0) {
            result.background = csvUnquote(t.slice('Background:'.length)) || 'black';
        } else if (t.indexOf('Prompt 1 Interests Mode:') === 0) {
            result.prompt1InterestsMode = csvUnquote(t.slice('Prompt 1 Interests Mode:'.length)) === 'Yes';
        } else if (t.indexOf('Criterion Labels:') === 0) {
            const rest = t.slice('Criterion Labels:'.length);
            const row = parseCsvRecords(rest)[0] || [];
            result.criterionLabels = row.map(function (label) { return String(label || '').trim(); });
        }
    });
    if (tableIdx < 0) return result;
    const records = parseCsvRecords(raw.slice(tableIdx));
    if (!records.length) return result;
    result.promptHeaders = records[0].slice(1).map(function (h) { return String(h || '').trim(); });
    for (let r = 1; r < records.length; r++) {
        const row = records[r];
        if (!row || !row.length) continue;
        const grouping = String(row[0] || '').trim();
        if (!grouping) continue;
        if (!result.categories[grouping]) {
            result.categories[grouping] = result.promptHeaders.map(function () { return []; });
        }
        while (result.categories[grouping].length < result.promptHeaders.length) {
            result.categories[grouping].push([]);
        }
        for (let c = 0; c < result.promptHeaders.length; c++) {
            const item = String(row[c + 1] == null ? '' : row[c + 1]).trim();
            if (item) result.categories[grouping][c].push(item);
        }
    }
    return result;
}

/** Sketch/store shape { header: { grouping: [] } } → share grid { grouping: [cols] }. */
function activityGridFromAppCategories(categories) {
    const headers = Object.keys(categories || {}).filter(function (k) {
        return k !== 'objective' && k !== 'prompt1InterestsMode';
    });
    const grid = {};
    const first = headers[0];
    const groupings = (first && categories[first] && typeof categories[first] === 'object')
        ? Object.keys(categories[first])
        : [];
    groupings.forEach(function (g) {
        grid[g] = headers.map(function (h) {
            const arr = categories[h] && categories[h][g];
            return Array.isArray(arr) ? arr.slice() : [];
        });
    });
    return { promptHeaders: headers, categories: grid };
}

function isShareImageToken(item) {
    if (typeof isImagePromptToken === 'function') return isImagePromptToken(item);
    const t = String(item == null ? '' : item).trim();
    return t.indexOf('img:') === 0 && t.length > 4;
}

function listImageTokensFromGrid(categories) {
    const tokens = [];
    const seen = {};
    Object.keys(categories || {}).forEach(function (g) {
        (categories[g] || []).forEach(function (col) {
            (col || []).forEach(function (item) {
                if (isShareImageToken(item) && !seen[item]) {
                    seen[item] = true;
                    tokens.push(item);
                }
            });
        });
    });
    return tokens;
}

function imageExtForMime(mime) {
    const m = String(mime || '').toLowerCase();
    if (m.indexOf('jpeg') !== -1 || m.indexOf('jpg') !== -1) return 'jpg';
    return 'png';
}

function imageMimeForName(name) {
    const n = String(name || '').toLowerCase();
    if (/\.jpe?g$/.test(n)) return 'image/jpeg';
    return 'image/png';
}

function fetchImageFilesForTokens(tokens) {
    const list = tokens || [];
    const out = [];
    let chain = Promise.resolve();
    list.forEach(function (tok) {
        chain = chain.then(function () {
            const id = (typeof imageIdFromToken === 'function') ? imageIdFromToken(tok) : '';
            if (!id || typeof getPromptImageRecord !== 'function') return;
            return getPromptImageRecord(id).then(function (rec) {
                if (!rec || !rec.blob) return;
                const mime = rec.mime || rec.blob.type || 'image/png';
                return rec.blob.arrayBuffer().then(function (buf) {
                    out.push({ id: id, mime: mime, bytes: new Uint8Array(buf) });
                });
            }).catch(function () { /* skip missing blobs */ });
        });
    });
    return chain.then(function () { return out; });
}

function crc32(u8) {
    if (!crc32.table) {
        const table = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            table[n] = c >>> 0;
        }
        crc32.table = table;
    }
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = crc32.table[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
}

function u16le(n) {
    return new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF]);
}

function u32le(n) {
    return new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]);
}

function concatBytes(parts) {
    let len = 0;
    for (let i = 0; i < parts.length; i++) len += parts[i].length;
    const out = new Uint8Array(len);
    let o = 0;
    for (let i = 0; i < parts.length; i++) {
        out.set(parts[i], o);
        o += parts[i].length;
    }
    return out;
}

function zipStoreFiles(files) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    (files || []).forEach(function (file) {
        const nameBytes = new TextEncoder().encode(file.name);
        const data = file.bytes || new Uint8Array(0);
        const crc = crc32(data);
        const local = concatBytes([
            new Uint8Array([0x50, 0x4B, 0x03, 0x04]),
            u16le(20), u16le(0), u16le(0), u16le(0), u16le(0),
            u32le(crc), u32le(data.length), u32le(data.length),
            u16le(nameBytes.length), u16le(0),
            nameBytes,
            data
        ]);
        const central = concatBytes([
            new Uint8Array([0x50, 0x4B, 0x01, 0x02]),
            u16le(20), u16le(20), u16le(0), u16le(0), u16le(0), u16le(0),
            u32le(crc), u32le(data.length), u32le(data.length),
            u16le(nameBytes.length), u16le(0), u16le(0),
            u16le(0), u16le(0), u32le(0), u32le(offset),
            nameBytes
        ]);
        localParts.push(local);
        centralParts.push(central);
        offset += local.length;
    });
    const centralDir = concatBytes(centralParts);
    const eocd = concatBytes([
        new Uint8Array([0x50, 0x4B, 0x05, 0x06]),
        u16le(0), u16le(0),
        u16le(files.length), u16le(files.length),
        u32le(centralDir.length), u32le(offset),
        u16le(0)
    ]);
    return new Blob([concatBytes(localParts.concat([centralDir, eocd]))], { type: 'application/zip' });
}

function readU16(u8, i) {
    return u8[i] | (u8[i + 1] << 8);
}

function readU32(u8, i) {
    return (u8[i] | (u8[i + 1] << 8) | (u8[i + 2] << 16) | (u8[i + 3] << 24)) >>> 0;
}

function findZipEocd(u8) {
    const min = Math.max(0, u8.length - 22 - 65536);
    for (let i = u8.length - 22; i >= min; i--) {
        if (u8[i] === 0x50 && u8[i + 1] === 0x4B && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) return i;
    }
    return -1;
}

function inflateRawBytes(u8) {
    if (typeof DecompressionStream === 'undefined') {
        return Promise.reject(new Error('This zip is compressed and this browser cannot unpack it. Unzip the folder and Load the CSV plus media files, or use an uncompressed share zip.'));
    }
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Blob([u8]).stream().pipeThrough(ds);
    return new Response(stream).arrayBuffer().then(function (buf) {
        return new Uint8Array(buf);
    });
}

function unzipFiles(arrayBuffer) {
    const u8 = new Uint8Array(arrayBuffer);
    const eocd = findZipEocd(u8);
    if (eocd < 0) return Promise.reject(new Error('That file is not a zip folder.'));
    const count = readU16(u8, eocd + 10);
    let cdOff = readU32(u8, eocd + 16);
    const files = [];
    let chain = Promise.resolve();
    for (let n = 0; n < count; n++) {
        if (u8[cdOff] !== 0x50 || u8[cdOff + 1] !== 0x4B) {
            return Promise.reject(new Error('That zip folder could not be read.'));
        }
        const method = readU16(u8, cdOff + 10);
        const compSize = readU32(u8, cdOff + 20);
        const uncompSize = readU32(u8, cdOff + 24);
        const nameLen = readU16(u8, cdOff + 28);
        const extraLen = readU16(u8, cdOff + 30);
        const commentLen = readU16(u8, cdOff + 32);
        const localOff = readU32(u8, cdOff + 42);
        const name = new TextDecoder().decode(u8.slice(cdOff + 46, cdOff + 46 + nameLen));
        const localNameLen = readU16(u8, localOff + 26);
        const localExtra = readU16(u8, localOff + 28);
        const dataStart = localOff + 30 + localNameLen + localExtra;
        const packed = u8.slice(dataStart, dataStart + compSize);
        cdOff += 46 + nameLen + extraLen + commentLen;
        chain = chain.then(function () {
            if (!name || /\/$/.test(name)) return;
            let dataP = Promise.resolve(packed);
            if (method === 8) dataP = inflateRawBytes(packed);
            else if (method !== 0) {
                return Promise.reject(new Error('That zip uses a compression this app cannot read.'));
            }
            return dataP.then(function (bytes) {
                files.push({ name: name.replace(/\\/g, '/'), bytes: bytes, size: uncompSize });
            });
        });
    }
    return chain.then(function () { return files; });
}

function buildActivityZip(csvText, imageFiles) {
    const files = [{ name: 'activity.csv', bytes: new TextEncoder().encode(csvText) }];
    (imageFiles || []).forEach(function (img) {
        const ext = imageExtForMime(img.mime);
        files.push({
            name: 'media/' + img.id + '.' + ext,
            bytes: img.bytes
        });
    });
    return zipStoreFiles(files);
}

function readActivityPack(file) {
    const name = (file && file.name) || '';
    const isZip = /\.zip$/i.test(name) || /zip/.test((file && file.type) || '');
    if (!isZip) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onload = function () { resolve({ csvText: String(reader.result || ''), images: [] }); };
            reader.onerror = function () { reject(new Error('Could not read that file.')); };
            reader.readAsText(file);
        });
    }
    return file.arrayBuffer().then(function (buf) {
        return unzipFiles(buf);
    }).then(function (files) {
        let csvText = '';
        const images = [];
        files.forEach(function (f) {
            const base = f.name.split('/').pop();
            if (!csvText && /\.csv$/i.test(f.name)) {
                csvText = new TextDecoder().decode(f.bytes);
                return;
            }
            if (/^media\//i.test(f.name) && /\.(png|jpe?g)$/i.test(f.name)) {
                const id = base.replace(/\.(png|jpe?g)$/i, '');
                if (!id) return;
                const mime = imageMimeForName(f.name);
                images.push({
                    id: id,
                    mime: mime,
                    blob: new Blob([f.bytes], { type: mime })
                });
            }
        });
        if (!csvText) throw new Error('That zip has no activity.csv.');
        return { csvText: csvText, images: images };
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function safeShareStem(name) {
    const stem = String(name || 'activity').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    return (stem || 'activity').slice(0, 40);
}

function storeImportedImages(images) {
    const list = images || [];
    let chain = Promise.resolve();
    list.forEach(function (img) {
        chain = chain.then(function () {
            if (!img || !img.id || !img.blob || typeof putPromptImage !== 'function') return;
            return putPromptImage(img.id, img.blob, img.mime);
        }).catch(function () { /* keep going */ });
    });
    return chain;
}

const SHARE_IMAGES_WARNING = 'Saving this means saving images. The download is a folder (zip) with the prompt list and a media folder.';

if (typeof window !== 'undefined') {
    window.csvEscape = csvEscape;
    window.csvUnquote = csvUnquote;
    window.parseCsvRecords = parseCsvRecords;
    window.serializeActivityCsv = serializeActivityCsv;
    window.parseActivityCsv = parseActivityCsv;
    window.activityGridFromAppCategories = activityGridFromAppCategories;
    window.listImageTokensFromGrid = listImageTokensFromGrid;
    window.fetchImageFilesForTokens = fetchImageFilesForTokens;
    window.buildActivityZip = buildActivityZip;
    window.readActivityPack = readActivityPack;
    window.downloadBlob = downloadBlob;
    window.safeShareStem = safeShareStem;
    window.storeImportedImages = storeImportedImages;
    window.SHARE_IMAGES_WARNING = SHARE_IMAGES_WARNING;
}

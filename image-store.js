// PNG/JPG prompt options — blobs in IndexedDB; localStorage only keeps img:<id> tokens (D-015).
// The randomizer treats a token like any other option string (R1–R7 unchanged).

const IMAGE_TOKEN_PREFIX = 'img:';
const IMAGE_DB_NAME = 'promptMeImages';
const IMAGE_DB_VERSION = 1;
const IMAGE_STORE_NAME = 'blobs';
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const IMAGE_OK_MIMES = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true
};

function isImagePromptToken(value) {
    const t = String(value == null ? '' : value).trim();
    return t.length > IMAGE_TOKEN_PREFIX.length && t.indexOf(IMAGE_TOKEN_PREFIX) === 0;
}

function imageIdFromToken(value) {
    return String(value == null ? '' : value).trim().slice(IMAGE_TOKEN_PREFIX.length);
}

function formatPromptValueForReport(value) {
    return isImagePromptToken(value) ? '[image]' : String(value == null ? '' : value);
}

function newImageToken() {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : ('i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    return IMAGE_TOKEN_PREFIX + id;
}

function openImageDb() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error('IndexedDB not available'));
            return;
        }
        const req = indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION);
        req.onupgradeneeded = function () {
            const db = req.result;
            if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
                db.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' });
            }
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
    });
}

function putPromptImage(id, blob, mime) {
    return openImageDb().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(IMAGE_STORE_NAME, 'readwrite');
        tx.objectStore(IMAGE_STORE_NAME).put({ id: id, blob: blob, mime: mime || blob.type || 'image/png' });
        tx.oncomplete = function () { resolve(id); };
        tx.onerror = function () { reject(tx.error); };
    }));
}

function getPromptImageRecord(id) {
    return openImageDb().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(IMAGE_STORE_NAME, 'readonly');
        const req = tx.objectStore(IMAGE_STORE_NAME).get(id);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
    }));
}

function deletePromptImage(id) {
    return openImageDb().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(IMAGE_STORE_NAME, 'readwrite');
        tx.objectStore(IMAGE_STORE_NAME).delete(id);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
    }));
}

function isAllowedImageFile(file) {
    if (!file) return false;
    const mime = (file.type || '').toLowerCase();
    if (IMAGE_OK_MIMES[mime]) return true;
    const name = (file.name || '').toLowerCase();
    return /\.(jpe?g|png)$/.test(name);
}

/** Read the first bytes — a dropped file often has no MIME type or a useless name (D-020). */
function sniffPngOrJpegMime(blob) {
    if (!blob || typeof blob.slice !== 'function') return Promise.resolve('');
    return blob.slice(0, 8).arrayBuffer().then((buf) => {
        const b = new Uint8Array(buf);
        if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'image/png';
        if (b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
        return '';
    }).catch(function () { return ''; });
}

function normalizeDroppedImageFile(file) {
    if (!file) return Promise.resolve(null);
    if (isAllowedImageFile(file)) return Promise.resolve(file);
    return sniffPngOrJpegMime(file).then((mime) => {
        if (!mime) return null;
        const name = (file.name && /\.(jpe?g|png)$/i.test(file.name))
            ? file.name
            : (mime === 'image/png' ? 'image.png' : 'image.jpg');
        return new File([file], name, { type: mime });
    });
}

/** Text lines plus img: tokens (from value and data-image-ids). */
function getPromptLinesFromTextarea(textarea) {
    if (!textarea) return [];
    const fromValue = String(textarea.value || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const textLines = fromValue.filter((l) => !isImagePromptToken(l));
    const fromValueImgs = fromValue.filter(isImagePromptToken);
    const fromData = String(textarea.dataset.imageIds || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((id) => (id.indexOf(IMAGE_TOKEN_PREFIX) === 0 ? id : IMAGE_TOKEN_PREFIX + id));
    const images = [];
    const seen = {};
    fromData.concat(fromValueImgs).forEach((tok) => {
        if (seen[tok]) return;
        seen[tok] = true;
        images.push(tok);
    });
    return textLines.concat(images);
}

function setTextareaImageIds(textarea, tokens) {
    if (!textarea) return;
    const ids = (tokens || []).map(imageIdFromToken).filter(Boolean);
    textarea.dataset.imageIds = ids.join(',');
}

function hydrateTextareaImages(textarea) {
    if (!textarea) return;
    const lines = String(textarea.value || '').split('\n');
    const text = [];
    const images = [];
    lines.forEach((raw) => {
        const line = raw.trim();
        if (!line) return;
        if (isImagePromptToken(line)) images.push(line);
        else text.push(raw.replace(/\s+$/, ''));
    });
    const existing = String(textarea.dataset.imageIds || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((id) => (id.indexOf(IMAGE_TOKEN_PREFIX) === 0 ? id : IMAGE_TOKEN_PREFIX + id));
    const merged = [];
    const seen = {};
    existing.concat(images).forEach((tok) => {
        if (seen[tok]) return;
        seen[tok] = true;
        merged.push(tok);
    });
    textarea.value = text.join('\n');
    setTextareaImageIds(textarea, merged);
}

window.isImagePromptToken = isImagePromptToken;
window.imageIdFromToken = imageIdFromToken;
window.formatPromptValueForReport = formatPromptValueForReport;
window.newImageToken = newImageToken;
window.putPromptImage = putPromptImage;
window.getPromptImageRecord = getPromptImageRecord;
window.deletePromptImage = deletePromptImage;
window.isAllowedImageFile = isAllowedImageFile;
window.sniffPngOrJpegMime = sniffPngOrJpegMime;
window.normalizeDroppedImageFile = normalizeDroppedImageFile;
window.getPromptLinesFromTextarea = getPromptLinesFromTextarea;
window.setTextareaImageIds = setTextareaImageIds;
window.hydrateTextareaImages = hydrateTextareaImages;
window.IMAGE_MAX_BYTES = IMAGE_MAX_BYTES;
window.IMAGE_TOKEN_PREFIX = IMAGE_TOKEN_PREFIX;

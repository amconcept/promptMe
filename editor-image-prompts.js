// Drop/paste PNG or JPG onto a prompt list. Tokens stay off the visible lines (D-015).

let lastHoverPromptField = null;

function getImageIdsFromTextarea(textarea) {
    return String(textarea && textarea.dataset.imageIds || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

function thumbsHostFor(textarea) {
    if (!textarea) return null;
    if (textarea.id === 'cube-prompts') {
        let host = document.getElementById('cube-image-thumbs');
        if (!host) {
            host = document.createElement('div');
            host.id = 'cube-image-thumbs';
            host.className = 'prompt-image-thumbs';
            const caption = document.querySelector('.cube-prompts-caption');
            if (caption && caption.parentNode) {
                caption.parentNode.insertBefore(host, caption);
            } else {
                textarea.parentNode.appendChild(host);
            }
        }
        return host;
    }
    const wrap = textarea.closest('.textarea-container') || textarea.parentNode;
    let host = wrap.querySelector('.prompt-image-thumbs');
    if (!host) {
        host = document.createElement('div');
        host.className = 'prompt-image-thumbs';
        wrap.appendChild(host);
    }
    return host;
}

function refreshPromptImageThumbs(textarea) {
    const host = thumbsHostFor(textarea);
    if (!host || typeof getPromptImageRecord !== 'function') return;
    const ids = getImageIdsFromTextarea(textarea);
    host.innerHTML = '';
    if (!ids.length) {
        host.hidden = true;
        return;
    }
    host.hidden = false;
    ids.forEach((id) => {
        const chip = document.createElement('div');
        chip.className = 'prompt-image-chip';
        const img = document.createElement('img');
        img.alt = 'prompt image';
        chip.appendChild(img);
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'prompt-image-chip-remove';
        rm.setAttribute('aria-label', 'Remove image');
        rm.textContent = '×';
        rm.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            removeImageFromTextarea(textarea, id);
        };
        chip.appendChild(rm);
        host.appendChild(chip);
        getPromptImageRecord(id).then((rec) => {
            if (!rec || !rec.blob) return;
            img.src = URL.createObjectURL(rec.blob);
        }).catch(function () { /* missing blob — chip still removable */ });
    });
}

function removeImageFromTextarea(textarea, id) {
    const next = getImageIdsFromTextarea(textarea).filter((x) => x !== id);
    textarea.dataset.imageIds = next.join(',');
    refreshPromptImageThumbs(textarea);
    if (typeof deletePromptImage === 'function') {
        deletePromptImage(id).catch(function () { /* blob already gone */ });
    }
    if (textarea.id === 'cube-prompts' && typeof flushPromptCube === 'function') {
        flushPromptCube();
    }
    if (typeof autoSaveToLocalStorage === 'function') autoSaveToLocalStorage();
}

function addImageTokenToTextarea(textarea, token) {
    const id = imageIdFromToken(token);
    const ids = getImageIdsFromTextarea(textarea);
    if (ids.indexOf(id) !== -1) return;
    ids.push(id);
    textarea.dataset.imageIds = ids.join(',');
    refreshPromptImageThumbs(textarea);
}

function ingestImageFiles(textarea, files) {
    const list = Array.prototype.slice.call(files || []);
    const rejected = [];
    const jobs = [];
    const classify = (typeof normalizeDroppedImageFile === 'function')
        ? normalizeDroppedImageFile
        : function (f) { return Promise.resolve(isAllowedImageFile(f) ? f : null); };

    return Promise.all(list.map((file) => classify(file).then((ok) => ({ original: file, ok: ok })))).then((rows) => {
        rows.forEach((row) => {
            const file = row.ok;
            const original = row.original;
            if (!file) {
                rejected.push((original && original.name) || 'file');
                return;
            }
            if (file.size > IMAGE_MAX_BYTES) {
                rejected.push((file.name || 'image') + ' (over 2MB)');
                return;
            }
            const token = newImageToken();
            jobs.push(putPromptImage(imageIdFromToken(token), file, file.type).then(() => {
                addImageTokenToTextarea(textarea, token);
            }));
        });
        return Promise.all(jobs);
    }).then(() => {
        if (textarea.id === 'cube-prompts' && typeof flushPromptCube === 'function') {
            flushPromptCube();
        }
        if (typeof autoSaveToLocalStorage === 'function') autoSaveToLocalStorage();
        if (rejected.length && window.showThemedAlert) {
            window.showThemedAlert('PNG or JPG only, under 2MB. Skipped: ' + rejected.join(', '));
        } else if (rejected.length) {
            alert('PNG or JPG only, under 2MB.');
        }
    }).catch((err) => {
        console.error('Could not save image', err);
        if (window.showThemedAlert) window.showThemedAlert('Could not save image in this browser.');
    });
}

function promptFieldFromEventTarget(target) {
    if (!target || !target.closest) return null;
    if (target.id === 'cube-prompts') return target;
    if (target.closest('.cube-prompt-box') || target.closest('#cube-image-thumbs') || target.closest('.cube-prompts-row') || target.closest('.cube-prompts-caption')) {
        return document.getElementById('cube-prompts');
    }
    const wrap = target.closest('.textarea-container');
    if (wrap) return wrap.querySelector('textarea');
    return null;
}

function promptFieldFromPoint(x, y) {
    // During a file drag the top pixel is sometimes the drag ghost, not the box (D-021)
    const stack = (document.elementsFromPoint)
        ? document.elementsFromPoint(x, y)
        : [document.elementFromPoint(x, y)];
    for (let i = 0; i < stack.length; i++) {
        const ta = promptFieldFromEventTarget(stack[i]);
        if (ta) return ta;
    }
    return null;
}

function findPromptFieldFromEvent(e) {
    const path = (typeof e.composedPath === 'function') ? e.composedPath() : [];
    for (let i = 0; i < path.length; i++) {
        const ta = promptFieldFromEventTarget(path[i]);
        if (ta) return ta;
    }
    const fromTarget = promptFieldFromEventTarget(e.target);
    if (fromTarget) return fromTarget;
    const fromPoint = promptFieldFromPoint(e.clientX, e.clientY);
    if (fromPoint) return fromPoint;
    // Safari may fire drop on document; keep the last box under the cursor if we are still in it
    if (lastHoverPromptField) {
        const host = dropHostFor(lastHoverPromptField);
        if (host) {
            const r = host.getBoundingClientRect();
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
                return lastHoverPromptField;
            }
        }
    }
    return null;
}

function dropHostFor(textarea) {
    if (!textarea) return null;
    if (textarea.id === 'cube-prompts') return textarea.closest('.cube-prompt-box');
    return textarea.closest('.textarea-container');
}

function setDropHighlight(textarea) {
    document.querySelectorAll('.is-drop-target').forEach((el) => {
        el.classList.remove('is-drop-target');
    });
    const host = dropHostFor(textarea);
    if (host) host.classList.add('is-drop-target');
}

function clearDropUi() {
    lastHoverPromptField = null;
    setDropHighlight(null);
}

function dataTransferLooksLikeImage(dt) {
    if (!dt) return false;
    if (dt.files && dt.files.length) return true;
    if (dt.items && dt.items.length) {
        for (let i = 0; i < dt.items.length; i++) {
            const kind = dt.items[i].kind;
            const type = (dt.items[i].type || '').toLowerCase();
            if (kind === 'file') return true;
            if (type.indexOf('image/') === 0 || type === 'text/uri-list' || type === 'text/html') return true;
        }
    }
    const types = dt.types ? Array.prototype.slice.call(dt.types) : [];
    return types.some((t) => /files|uri-list|text\/html|image\//i.test(String(t)));
}

function isFileishDrag(dt) {
    if (!dt) return false;
    const types = dt.types ? Array.prototype.slice.call(dt.types) : [];
    // Safari often reports no types until drop — still claim so Finder files are allowed
    if (!types.length) return true;
    return dataTransferLooksLikeImage(dt);
}

function collectDroppedFiles(dt) {
    const out = [];
    const seen = {};
    const add = function (f) {
        if (!f || !f.size) return;
        const k = (f.name || '') + ':' + f.size + ':' + (f.type || '');
        if (seen[k]) return;
        seen[k] = true;
        out.push(f);
    };
    if (dt.files) {
        for (let i = 0; i < dt.files.length; i++) add(dt.files[i]);
    }
    if (dt.items) {
        for (let i = 0; i < dt.items.length; i++) {
            try {
                add(dt.items[i].getAsFile());
            } catch (err) { /* some items are strings only */ }
        }
    }
    return out;
}

/** Safari Finder drops: getAsFile() is often null; the entry still yields a File (D-021). */
function snapshotWebkitFileEntries(dt) {
    const entries = [];
    if (!dt || !dt.items) return entries;
    for (let i = 0; i < dt.items.length; i++) {
        try {
            if (typeof dt.items[i].webkitGetAsEntry !== 'function') continue;
            const entry = dt.items[i].webkitGetAsEntry();
            if (entry && entry.isFile) entries.push(entry);
        } catch (err) { /* ignore */ }
    }
    return entries;
}

function filesFromWebkitEntries(entries) {
    if (!entries.length) return Promise.resolve([]);
    return Promise.all(entries.map((entry) => new Promise((resolve) => {
        entry.file(resolve, function () { resolve(null); });
    }))).then((files) => files.filter(function (f) { return f && f.size; }));
}

function filesFromUriList(dt) {
    let url = '';
    try {
        const uriList = String(dt.getData('text/uri-list') || '');
        url = uriList.split('\n').map((s) => s.trim()).filter((s) => s && s.charAt(0) !== '#')[0] || '';
        if (!url) {
            const html = String(dt.getData('text/html') || '');
            const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (m) url = m[1];
        }
        if (!url) {
            const plain = String(dt.getData('text/plain') || '').trim();
            if (/^https?:\/\//i.test(plain) || /^data:image\//i.test(plain)) url = plain;
        }
    } catch (err) {
        return Promise.resolve([]);
    }
    // D-020: do not fetch http(s) — other sites block it and we used to warn as if the picture were invalid
    if (!url || !/^(data:image\/|blob:)/i.test(url)) return Promise.resolve([]);

    return fetch(url).then((r) => {
        if (!r.ok) return [];
        return r.blob();
    }).then((blob) => {
        if (!blob || !blob.size) return [];
        const nameGuess = (url.split('/').pop() || 'image').split('?')[0] || 'image.png';
        return [new File([blob], nameGuess, { type: blob.type || 'image/png' })];
    }).catch(function () { return []; });
}

function initEditorImagePrompts() {
    if (document.documentElement.dataset.imagePromptsBound === '1') return;
    document.documentElement.dataset.imagePromptsBound = '1';

    // D-021: claim on dragenter + dragover, always copy (never none), remember the box
    const onDragHover = function (e) {
        if (!isFileishDrag(e.dataTransfer)) return;
        e.preventDefault();
        if (e.dataTransfer) {
            try { e.dataTransfer.dropEffect = 'copy'; } catch (err) { /* IE */ }
        }
        const ta = findPromptFieldFromEvent(e);
        if (ta) lastHoverPromptField = ta;
        setDropHighlight(ta);
    };

    const onDrop = function (e) {
        const dt = e.dataTransfer;
        if (!dt) return;
        // Read files in this turn — browsers empty dataTransfer after the handler returns
        const immediate = collectDroppedFiles(dt);
        const entries = snapshotWebkitFileEntries(dt);
        if (!isFileishDrag(dt) && !immediate.length && !entries.length) return;
        e.preventDefault();
        e.stopPropagation();
        const urlFallback = immediate.length ? Promise.resolve([]) : filesFromUriList(dt);
        const ta = findPromptFieldFromEvent(e);
        clearDropUi();
        if (!ta) return;
        const ready = immediate.length
            ? Promise.resolve(immediate)
            : filesFromWebkitEntries(entries).then((fromEntries) => {
                return fromEntries.length ? fromEntries : urlFallback;
            });
        ready.then((files) => {
            if (files && files.length) ingestImageFiles(ta, files);
        }).catch(function () { /* ingestImageFiles shows real type/size warnings */ });
    };

    // window + capture: Safari will not fire drop unless dragenter is cancelled too
    window.addEventListener('dragenter', onDragHover, true);
    window.addEventListener('dragover', onDragHover, true);
    window.addEventListener('drop', onDrop, true);
    window.addEventListener('dragend', clearDropUi, true);
    window.addEventListener('dragleave', (e) => {
        if (e.relatedTarget) return;
        setDropHighlight(null);
    }, true);

    document.addEventListener('paste', (e) => {
        const ta = promptFieldFromEventTarget(e.target);
        if (!ta || !e.clipboardData) return;
        const files = [];
        const items = e.clipboardData.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    const f = items[i].getAsFile();
                    if (f) files.push(f);
                }
            }
        }
        if (!files.length) return;
        e.preventDefault();
        ingestImageFiles(ta, files);
    });
}

function hydrateAllPromptImageFields() {
    document.querySelectorAll('.textarea-container textarea, #cube-prompts').forEach((ta) => {
        hydrateTextareaImages(ta);
        refreshPromptImageThumbs(ta);
    });
}

window.refreshPromptImageThumbs = refreshPromptImageThumbs;
window.hydrateAllPromptImageFields = hydrateAllPromptImageFields;
window.initEditorImagePrompts = initEditorImagePrompts;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditorImagePrompts);
} else {
    initEditorImagePrompts();
}

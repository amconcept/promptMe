# Sketch freeze – could it be localhost?

When "older code" still freezes, the cause is often **environment** rather than your code.

## 1. file:// vs http://localhost

- **file://** – You open `sketch.html` directly from the filesystem. Origin is `null` or `file:///path/`. Some browsers restrict or slow certain APIs; caching can be different.
- **http://localhost:port** – A local server (e.g. Live Server, `python -m http.server`) serves the files. Origin is `http://localhost:5500` (or similar).

**Why it matters:** If you used to use file:// and now use localhost (or the reverse), you're on a **different origin**. So:

- **localStorage is separate** – Data you had on file:// is not the same as on localhost. A huge or corrupt `promptCategories` on localhost could make `JSON.parse(localStorage.getItem(...))` slow or hang.
- **Cache is per-origin** – Old cached JS/CSS from one origin doesn’t help the other; and the browser might still be serving cached files for the origin you’re on.

So yes, **it can be “the localhost”** in the sense that switching between file:// and localhost changes origin, cache, and localStorage.

## 2. What to try

### A. Rule out cache
- DevTools → **Network** → check **Disable cache**.
- Hard refresh: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac).
- Or test in a **private/incognito** window (no extensions, fresh cache).

### B. Rule out localStorage
- DevTools → **Application** (Chrome) or **Storage** (Firefox) → **Local Storage** → your origin (e.g. `http://localhost:5500`) → **Clear** or delete `promptCategories` / `selectedTheme` / `selectedBackground`.
- Reload sketch. If it stops freezing, something in your code or in the inline theme was hanging on that data.

### C. Rule out p5 / CDN
- Open **sketch-test.html** (minimal page: only p5 + a small sketch). If it runs on localhost, the full sketch freeze is in your app code or the big inline theme. If sketch-test also freezes, try:
  - Same page via **file://** (open the HTML file directly). If file:// works and localhost doesn’t, it could be the server, proxy, or how the CDN is loaded on localhost.
  - Or serve p5 **locally** (download p5.js into the project and use `<script src="p5.js"></script>`) so the CDN isn’t in the path.

### D. Try the other origin
- If you normally use **localhost**, open the same `sketch.html` via **file://** (drag the file into the browser or use File → Open).
- If you normally use **file://**, start a simple server (e.g. `python3 -m http.server 8000`) and open **http://localhost:8000/sketch.html**.

See which combination (file vs localhost, cache disabled, localStorage cleared) makes the freeze go away.

## 3. Summary

| Cause              | What to do |
|--------------------|------------|
| Cache              | Disable cache + hard refresh, or incognito |
| localStorage       | Clear localStorage for the origin and reload |
| file:// vs localhost | Try the other one; clear cache and storage for that origin |
| p5 / CDN           | Use sketch-test.html; if it freezes, try file:// or local p5 |

Yes – **it can be localhost** (or the switch between file:// and localhost, plus cache and localStorage). Use the steps above to narrow it down.

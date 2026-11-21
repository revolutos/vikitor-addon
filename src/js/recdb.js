// Funnel-Hack-Aufnahme: lokale Ablage der erfassten Schritte in IndexedDB (nur auf diesem Gerät, nie an einen Server).
// Wird vom Service Worker (Aufnahme) und von der App (Anzeige, ZIP) gemeinsam genutzt.
const DB = "vikitor-funnelhack";
const STORE = "steps";

function open() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: "n" }); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const res = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(res && "result" in res ? res.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  } finally { db.close(); }
}

export const putStep = (step) => tx("readwrite", (s) => s.put(step));
export const clearSteps = () => tx("readwrite", (s) => s.clear());
export const allSteps = async () => ((await tx("readonly", (s) => s.getAll())) || []).sort((a, b) => a.n - b.n);
export const deleteStep = (n) => tx("readwrite", (s) => s.delete(n));

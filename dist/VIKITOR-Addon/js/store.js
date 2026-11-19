// Speicher: chrome.storage.local (in der Erweiterung), sonst localStorage als Ersatz.
const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

export async function get(key, fallback) {
  try {
    if (hasChrome) {
      const r = await chrome.storage.local.get(key);
      return r[key] === undefined ? fallback : r[key];
    }
    const v = localStorage.getItem("vk:" + key);
    return v == null ? fallback : JSON.parse(v);
  } catch (_) { return fallback; }
}

export async function set(key, value) {
  try {
    if (hasChrome) await chrome.storage.local.set({ [key]: value });
    else localStorage.setItem("vk:" + key, JSON.stringify(value));
  } catch (_) { /* still */ }
}

export async function getSaved() { return get("saved", []); }
export async function addSaved(title, text) {
  const list = await getSaved();
  list.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title, text, date: new Date().toISOString() });
  await set("saved", list.slice(0, 100));
  return list;
}
export async function removeSaved(id) {
  const list = (await getSaved()).filter((s) => s.id !== id);
  await set("saved", list);
  return list;
}

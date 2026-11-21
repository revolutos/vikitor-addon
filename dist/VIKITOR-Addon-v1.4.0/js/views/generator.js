import { h, icon, toast, copyText, pitch } from "../ui.js";
import { buildPrompt } from "../generator.js";
import { set, addSaved } from "../store.js";
import { getActiveTab, aiSiteOf, insertIntoTab, onTabChange } from "../browser.js";

export function viewGenerator(ctx) {
  const C = ctx.content;
  const st = ctx.gen;
  if (!C.templates.find((t) => t.id === st.templateId)) st.templateId = C.templates[0].id;
  if (!C.tools[st.tool]) st.tool = "claude";
  st.values = st.values || {};

  let saveTimer;
  const persist = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => set("lastInputs", st), 300); };

  const pre = h("pre", { "aria-live": "off" });
  const tplDesc = h("p", { class: "hint" });
  const toolHint = h("p", { class: "hint" });
  const formGrid = h("div", { class: "form-grid" });
  const insertBtn = h("button", { class: "btn btn-secondary", type: "button", disabled: true }, icon("send"), "Einfügen");
  const insertHint = h("p", { class: "hint" });
  let target = null;

  const current = () => buildPrompt(C, st.templateId, st.tool, st.values);
  const update = () => { pre.textContent = current(); persist(); };

  const chips = h("div", { class: "chips", role: "radiogroup", "aria-label": "Vorlage" });
  const renderChips = () => {
    chips.textContent = "";
    for (const t of C.templates) chips.append(h("button", {
      class: "chip" + (t.id === st.templateId ? " is-on" : ""), type: "button", role: "radio", "aria-checked": String(t.id === st.templateId),
      onclick: () => { st.templateId = t.id; renderChips(); renderForm(); update(); }
    }, t.title));
    const tpl = C.templates.find((t) => t.id === st.templateId);
    tplDesc.textContent = tpl.short || "";
  };

  const seg = h("div", { class: "seg", role: "radiogroup", "aria-label": "Werkzeug" });
  const renderSeg = () => {
    seg.textContent = "";
    for (const [id, tool] of Object.entries(C.tools)) seg.append(h("button", {
      class: id === st.tool ? "is-on" : "", type: "button", role: "radio", "aria-checked": String(id === st.tool),
      onclick: () => { st.tool = id; renderSeg(); update(); }
    }, tool.label));
    toolHint.textContent = C.tools[st.tool].hint || "";
  };

  const renderForm = () => {
    formGrid.textContent = "";
    const tpl = C.templates.find((t) => t.id === st.templateId);
    for (const id of tpl.fields) {
      const f = C.fields[id];
      const fid = "f-" + id;
      const onInput = (e) => { st.values[id] = e.target.value; update(); };
      let input;
      if (f.type === "textarea") {
        input = h("textarea", { class: "textarea", id: fid, placeholder: f.placeholder || "", rows: 3, oninput: onInput });
        input.value = st.values[id] || "";
      } else {
        input = h("input", { class: "input", id: fid, type: "text", placeholder: f.placeholder || "", autocomplete: "off", oninput: onInput });
        input.value = st.values[id] || "";
      }
      formGrid.append(h("div", { class: "field" + (f.type === "textarea" ? " is-wide" : "") }, h("label", { for: fid }, f.label), input));
    }
  };

  const refreshTarget = async () => {
    const tab = await getActiveTab();
    const site = tab && !tab.isSelf ? aiSiteOf(tab) : null;
    target = site ? { tab, site } : null;
    insertBtn.disabled = !target;
    insertBtn.lastChild.textContent = target ? `In ${target.site.name} einfügen` : "In Claude / ChatGPT / Lovable einfügen";
    insertHint.textContent = target
      ? `Der Prompt wird in das Eingabefeld von ${target.site.name} im aktiven Tab eingefügt. Abschicken musst du ihn selbst.`
      : (ctx.mode === "panel" || ctx.inPanel
        ? "Einfügen funktioniert, wenn im aktiven Tab claude.ai, chatgpt.com oder lovable.dev geöffnet ist. Ansonsten kopierst du den Prompt und fügst ihn selbst ein."
        : "Einfügen funktioniert in der Seitenleiste neben claude.ai, chatgpt.com oder lovable.dev. Hier im großen Fenster kopierst du den Prompt und fügst ihn selbst ein.");
  };

  insertBtn.addEventListener("click", async () => {
    if (!target) return;
    const r = await insertIntoTab(target.tab.id, current());
    toast(r && r.ok ? `In ${target.site.name} eingefügt.` : "Einfügen hat nicht geklappt. Der Prompt ist stattdessen in der Zwischenablage.");
    if (!(r && r.ok)) await copyText(current());
  });

  const copyBtn = h("button", { class: "btn btn-signal", type: "button", onclick: async () => {
    const ok = await copyText(current());
    toast(ok ? "Prompt kopiert." : "Kopieren nicht möglich.");
  } }, icon("copy"), "Kopieren");
  const saveBtn = h("button", { class: "btn btn-ghost", type: "button", onclick: async () => {
    const tpl = C.templates.find((t) => t.id === st.templateId);
    const name = st.values.firma ? ` · ${st.values.firma}` : "";
    await addSaved(`${tpl.title} (${C.tools[st.tool].label})${name}`, current());
    toast("In der Merkliste gespeichert.");
  } }, icon("save"), "Merken");
  const resetBtn = h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: () => { st.values = {}; renderForm(); update(); } }, "Felder leeren");

  renderChips(); renderSeg(); renderForm(); update(); refreshTarget();
  ctx.cleanup.push(onTabChange(refreshTarget));

  const head = h("header", { class: "vhead" },
    h("span", { class: "overline" }, "Prompt-Generator"),
    h("h1", {}, h("span", { class: "hl nowrap" }, "Dein fertiger Prompt.")),
    h("p", {}, "Wähle eine Vorlage und dein Werkzeug, fülle aus, was du schon weißt, und übernimm den Prompt. Was du leer lässt, sammelt der Prompt automatisch als offene Fragen."));

  const left = h("div", { class: "stack" },
    h("div", { class: "stack-s" }, h("span", { class: "overline" }, "1 · Vorlage"), chips, tplDesc),
    h("div", { class: "stack-s" }, h("span", { class: "overline" }, "2 · Werkzeug"), seg, toolHint),
    h("div", { class: "stack-s" }, h("div", { class: "row", style: { justifyContent: "space-between" } }, h("span", { class: "overline" }, "3 · Angaben"), resetBtn), formGrid));
  const right = h("div", { class: "stack sticky" },
    h("div", { class: "codebox" }, h("div", { class: "codebox-head" }, h("span", { class: "overline" }, "Live-Vorschau")), pre),
    h("div", { class: "actions" }, copyBtn, saveBtn, insertBtn),
    insertHint);
  return [head, h("div", { class: "gen-grid" }, left, right), pitch(C.pitch.generator, ctx.links.framework.url, "Zum Framework")];
}

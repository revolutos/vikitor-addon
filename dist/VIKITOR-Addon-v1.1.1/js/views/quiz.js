import { h, icon, pitch, codebox } from "../ui.js";
import { evaluate } from "../quiz.js";
import { buildPrompt } from "../generator.js";
import { get, set } from "../store.js";

export async function viewQuiz(ctx) {
  const Q = ctx.content.quiz;
  const saved = await get("quiz", null);
  const state = { answers: [], step: 0 };
  const wrap = h("div", { class: "stack" });

  const head = h("header", { class: "vhead" },
    h("span", { class: "overline" }, "Funnel-Quiz"),
    h("h1", {}, h("span", { class: "hl nowrap" }, "Welcher Funnel passt?")),
    h("p", {}, "Sieben kurze Fragen zu deinem Angebot und deiner Situation. Am Ende bekommst du einen passenden Funnel-Typ mit Aufbau und Start-Prompt."));

  function showQuestion() {
    wrap.textContent = "";
    const q = Q.questions[state.step];
    const pct = Math.round((state.step / Q.questions.length) * 100);
    const box = h("div", { class: "card is-strong stack qbox" },
      h("div", { class: "row", style: { justifyContent: "space-between" } },
        h("span", { class: "overline" }, `Frage ${state.step + 1} von ${Q.questions.length}`),
        state.step > 0 ? h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: () => { state.step--; state.answers.pop(); showQuestion(); } }, icon("back"), "Zurück") : null),
      h("div", { class: "progress", "aria-hidden": "true" }, h("span", { style: { width: pct + "%" } })),
      h("h2", {}, q.q),
      h("div", { class: "options" }, q.options.map((o, i) => h("button", {
        class: "option" + (state.answers[state.step] === i ? " is-on" : ""), type: "button",
        onclick: () => { state.answers[state.step] = i; state.step++; if (state.step >= Q.questions.length) finish(); else showQuestion(); }
      }, o.label))));
    box.classList.add("rv");
    wrap.append(box);
  }

  async function finish() {
    const res = evaluate(Q, state.answers);
    await set("quiz", { answers: state.answers.slice(), id: res.id, date: new Date().toISOString() });
    showResult(res);
  }

  function showResult(res) {
    wrap.textContent = "";
    const f = res.funnel;
    const tpl = ctx.content.templates.find((t) => t.id === f.template) || ctx.content.templates[0];
    const values = { funnel: f.name, ...(f.prefill || {}) };
    const prompt = buildPrompt(ctx.content, tpl.id, ctx.gen.tool || "claude", values);
    const toGen = () => {
      ctx.gen.templateId = tpl.id;
      ctx.gen.values = { ...ctx.gen.values, ...values };
      set("lastInputs", ctx.gen);
      ctx.go("generator");
    };
    const parts = [
      h("div", { class: "card is-strong stack" },
        h("span", { class: "overline" }, "Dein Ergebnis"),
        h("h2", { class: "h2" }, h("span", { class: "hl" }, f.name)),
        h("p", { class: "muted" }, f.why),
        res.reasons.length ? h("div", { class: "stack-s" }, h("span", { class: "overline" }, "Deine Antworten, die den Ausschlag gaben"),
          h("ul", { class: "reasons" }, res.reasons.map((r) => h("li", {}, r.a)))) : null),
      h("div", { class: "stack-s" }, h("h3", { class: "h3" }, "Aufbau in dieser Reihenfolge"),
        h("ol", { class: "pages" }, f.pages.map((p) => h("li", {}, p)))),
      h("div", { class: "stack-s" }, h("h3", { class: "h3" }, "Dein Start-Prompt"),
        h("p", { class: "hint" }, "Übernimm den Prompt in den Generator und ergänze dort deine Angaben, dann wird er noch genauer."),
        codebox("Start-Prompt", prompt)),
      h("div", { class: "actions" },
        h("button", { class: "btn btn-signal", type: "button", onclick: toGen }, icon("wand"), "Im Generator öffnen"),
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => { state.answers = []; state.step = 0; set("quiz", null); showQuestion(); } }, icon("refresh"), "Quiz neu starten")),
      pitch(ctx.content.pitch.quiz, ctx.links.framework.url, "Zum Framework")
    ];
    parts.forEach((p, i) => { if (p) { p.classList.add("rv"); p.style.setProperty("--i", String(i)); } });
    wrap.append(...parts.filter(Boolean));
  }

  if (saved && Array.isArray(saved.answers) && saved.answers.length === Q.questions.length) {
    state.answers = saved.answers.slice();
    state.step = Q.questions.length;
    showResult(evaluate(Q, state.answers));
  } else showQuestion();

  return [head, wrap];
}

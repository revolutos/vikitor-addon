// Funnel-Quiz: wertet Antworten (Index je Frage) aus und liefert den passenden Funnel-Typ.
export function evaluate(quiz, answers) {
  const score = {};
  for (const k of quiz.order) score[k] = 0;
  const reasons = {};
  quiz.questions.forEach((q, qi) => {
    const opt = q.options[answers[qi]];
    if (!opt) return;
    for (const [k, v] of Object.entries(opt.s)) {
      score[k] = (score[k] || 0) + v;
      (reasons[k] = reasons[k] || []).push({ q: q.q, a: opt.label, v });
    }
  });
  let best = quiz.order[0];
  for (const k of quiz.order) if (score[k] > score[best]) best = k;
  const top = (reasons[best] || []).sort((a, b) => b.v - a.v).slice(0, 3);
  return { id: best, funnel: quiz.funnels[best], score, reasons: top };
}

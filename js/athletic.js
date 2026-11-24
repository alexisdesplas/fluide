// Repères athlétiques : jusqu'où monter les charges pour un physique esthétique (pas du powerlifting).
// Chaque grand mouvement a un 1RM estimé visé, en multiple d'un poids de référence : ton poids, plafonné au poids sec
// visé pour ta taille (IMC 24). En sèche le poids baisse, les repères suivent sans jamais monter avec le gras.
// Âge : −1 % par an après 35 ans (jusqu'à −25 %). Haltères : par haltère.
// La surcharge progressive monte la charge jusqu'au repère, puis la garde : les reps et le tempo prennent le relais.

import { state, exercise, exerciseHistory, e1rm, effWeight } from "./store.js";

// bw : traction et dips au poids du corps, la charge notée est le lest ; le repère porte sur poids du corps + lest.
const PATTERNS = [
  { key: "pushH", label: "Développé couché", muscle: "Pecs", re: /^développé (couché|incliné|décliné)/i, ratio: { barre: 1.25, smith: 1.25, machine: 1.25, halteres: 0.42 } },
  { key: "pullH", label: "Rowing", muscle: "Dos", re: /^rowing(?! (inversé|en suspension|renégat))/i, ratio: { barre: 1, smith: 1, machine: 1.1, poulie: 1, halteres: 0.5 } },
  { key: "pushV", label: "Développé épaules", muscle: "Épaules", re: /^développé (militaire|épaules|arnold|nuque)|^push press/i, ratio: { barre: 0.75, smith: 0.75, machine: 0.75, halteres: 0.3 } },
  { key: "pullV", label: "Tirage vertical", muscle: "Dos", re: /^tirage vertical|^tirage (à la )?poulie haute|^tractions?( lestées| avec charge| prise large| en prise neutre)?$/i, ratio: { poulie: 1, machine: 1, pdc: 1.33 }, bw: true },
  { key: "lateral", label: "Élévation latérale", muscle: "Épaules", re: /^élévation latérale(?! arrière)/i, ratio: { halteres: 0.2, poulie: 0.14, machine: 0.28 } },
  { key: "curl", label: "Curl", muscle: "Biceps", re: /^curl/i, ratio: { barre: 0.6, poulie: 0.6, machine: 0.6, halteres: 0.26 } },
  { key: "triceps", label: "Triceps", muscle: "Triceps", re: /^extension des triceps|barre au front|^dips( lestés)?$/i, ratio: { poulie: 0.55, machine: 0.6, barre: 0.45, halteres: 0.2, pdc: 1.4 }, bw: true },
  { key: "squat", label: "Squat", muscle: "Quadris", re: /^squat (avec barre|à la smith|avant)|^presse à cuisses|^hack squat/i, ratio: { barre: 1.5, smith: 1.5, machine: 2.5 } },
  { key: "hinge", label: "Soulevé de terre", muscle: "Ischios", re: /^soulevé de terre|^hip thrust/i, ratio: { barre: 1.75, smith: 1.75, machine: 1.75 } }
];
// Paires à garder en équilibre : le second ne doit pas traîner derrière le premier (et inversement).
const PAIRS = [
  ["pushH", "pullH", "Le dos doit suivre les pecs : sinon les épaules partent en avant et la posture se voûte."],
  ["pushV", "pullV", "Le tirage vertical fait la largeur du dos, le V : il doit suivre le développé."],
  ["pushV", "lateral", "Les deltoïdes latéraux font la carrure : ils doivent suivre le développé épaules."],
  ["curl", "triceps", "Le triceps fait les deux tiers du bras : il doit suivre le biceps."],
  ["squat", "hinge", "Ischios et fessiers doivent suivre les quadris, pour les genoux et le bas du dos."]
];
const GAP = 0.2; // 20 points d'écart entre deux mouvements d'une paire : alerte

const patternOf = ex => (ex && !ex.mix && !ex.circuit ? PATTERNS.find(p => p.re.test(ex.name) && p.ratio[ex.equip]) : null);

// Poids de référence : ton poids, plafonné au poids sec visé pour ta taille quand elle est renseignée.
export function referenceWeight() {
  const p = state.profile, bw = p.bodyWeight ?? 75;
  const lean = p.height ? Math.round(24 * (p.height / 100) ** 2) : null;
  return { weight: lean ? Math.min(bw, lean) : bw, lean, bw };
}
const ageFactor = () => { const a = state.profile.age ?? 30; return a > 35 ? Math.max(0.75, 1 - (a - 35) * 0.01) : 1; };

// Charge réelle comptée pour le repère : poids du corps + lest pour les tractions et les dips.
const loadOf = (p, ex, w) => (p.bw && ex.equip === "pdc" ? (state.profile.bodyWeight ?? 75) + w : w);

// 1RM estimé visé pour un exercice, en charge réelle (lest + poids du corps pour tractions et dips). null : pas de repère.
export function athleticTarget(ex) {
  const p = patternOf(ex);
  if (!p) return null;
  let r = p.ratio[ex.equip];
  if (/incliné/i.test(ex.name) && p.key === "pushH") r *= 0.85;
  return { pattern: p, e1rm: r * referenceWeight().weight * ageFactor() };
}

// Charge de travail maximale (charge notée, lest pour tractions et dips) : celle qui, au bas de la fourchette avec 2 reps
// en réserve, correspond au repère. null : pas de repère pour cet exercice.
export function athleticCap(ex, repsMin) {
  const t = athleticTarget(ex);
  if (!t) return null;
  const work = t.e1rm / (1 + (repsMin + 2) / 30);
  return t.pattern.bw && ex.equip === "pdc" ? Math.max(0, work - (state.profile.bodyWeight ?? 75)) : work;
}

// Où en est un exercice par rapport à son repère : 1RM estimé des 8 dernières semaines / repère.
export function athleticProgress(exerciseId, weeks = 8) {
  const ex = exercise(exerciseId), t = athleticTarget(ex);
  if (!t) return null;
  const rows = exerciseHistory(exerciseId).filter(r => r.date >= Date.now() - weeks * 7 * 86400000);
  if (!rows.length) return { target: t, best: null, ratio: null };
  const best = Math.max(...rows.flatMap(r => r.sets.map(s => e1rm(loadOf(t.pattern, ex, effWeight(s)), s.reps))));
  return { target: t, best, ratio: best / t.e1rm };
}

// Bilan par mouvement (le meilleur exercice de chaque famille), puis les déséquilibres entre paires.
export function athleticReport() {
  const best = {};
  for (const ex of state.exercises) {
    const pr = patternOf(ex) && athleticProgress(ex.id);
    if (!pr?.best) continue;
    const k = pr.target.pattern.key;
    if (!best[k] || pr.ratio > best[k].ratio) best[k] = { ...pr, exerciseId: ex.id };
  }
  const rows = PATTERNS.filter(p => best[p.key]).map(p => ({ key: p.key, label: p.label, muscle: p.muscle, ...best[p.key] }));
  const alerts = [];
  for (const [a, b, why] of PAIRS) {
    if (!best[a] || !best[b]) continue;
    const d = best[a].ratio - best[b].ratio;
    if (Math.abs(d) < GAP) continue;
    const [lead, lag] = d > 0 ? [a, b] : [b, a];
    alerts.push({ kind: "imbalance", lead: PATTERNS.find(p => p.key === lead).label, lag: PATTERNS.find(p => p.key === lag).label, lagMuscle: PATTERNS.find(p => p.key === lag).muscle, gap: Math.round(Math.abs(d) * 100), why });
  }
  for (const r of rows) if (r.ratio > 1.1) alerts.push({ kind: "heavy", label: r.label, exerciseId: r.exerciseId, over: Math.round((r.ratio - 1) * 100) });
  return { rows, alerts, reference: referenceWeight() };
}

// Alertes d'un exercice pendant la séance : au-dessus de son repère (trop lourd pour l'objectif), ou en avance sur
// le mouvement qui doit le suivre.
export function exerciseAlerts(exerciseId) {
  const pr = athleticProgress(exerciseId);
  if (!pr?.best) return [];
  const out = [];
  if (pr.ratio > 1.1) out.push({ kind: "heavy", over: Math.round((pr.ratio - 1) * 100) });
  for (const a of athleticReport().alerts) if (a.kind === "imbalance" && a.lead === pr.target.pattern.label) out.push(a);
  return out;
}

// Réglages › Mouvements à faire progresser : jusqu'à trois exercices prioritaires (en tête de leur séance, charge qui monte
// dès qu'une série touche le haut de la fourchette), et les repères athlétiques avec les déséquilibres à surveiller.
import { state, exercise, lastPerformance, suggestion, isInterval, isFocus, addFocus, removeFocus, FOCUS_MAX, EQUIPS } from "../store.js";
import { athleticReport, athleticProgress, athleticCap } from "../athletic.js";
import { h, icon, navbar, btn, go, num, ago, toast } from "../ui.js";
import { catalogue, niceName, charge, chargeNum, setsLine } from "./templates.js";

// Barre de progression vers le repère : pleine au repère, orange au-delà.
const gauge = (label, ratio, right) => h("div", { class: "gauge" },
  h("span", { class: "body-md fort medium" }, label),
  h("span", { class: "caption num" }, right),
  h("div", { class: "vol-track", role: "progressbar", "aria-label": `${label} : ${Math.round(ratio * 100)} % du repère`, "aria-valuenow": Math.round(ratio * 100), "aria-valuemin": 0, "aria-valuemax": 100 },
    h("div", { class: `vol-fill${ratio > 1.1 ? " over" : ratio >= 1 ? " done" : ""}`, style: { width: `${Math.min(100, ratio * 100)}%` } })));

const alertLine = a => h("div", { class: "hint attention" }, icon("warning"), h("span", { class: "body-sm" },
  a.kind === "heavy" ? `${a.label} : ${a.over} % au-dessus du repère. Pas besoin d'aller plus lourd, la charge ne monte plus.`
    : h("span", null, h("b", { class: "fort" }, `${a.lag} en retard de ${a.gap} points sur ${a.lead.toLowerCase()}. `), a.why)));

// Carte des repères athlétiques (Réglages et Progrès) : un mouvement par ligne, alertes en tête.
export function athleticCard({ compact } = {}) {
  const r = athleticReport(), ref = r.reference;
  const basis = ref.lean && ref.lean < ref.bw ? `${num(ref.weight)} kg, ton poids sec visé pour ta taille` : `${num(ref.weight)} kg, ton poids`;
  return h("div", { class: "card" },
    h("div", null, h("div", { class: "overline" }, "Repères athlétiques"),
      h("p", { class: "caption", style: { margin: "4px 0 0" } }, `1RM estimé visé pour un physique athlétique, calculé sur ${basis}${(state.profile.age ?? 30) > 35 ? " et ton âge" : ""}. Les charges montent jusque-là, puis restent : les reps et le tempo prennent le relais.`)),
    ...r.alerts.map(alertLine),
    r.rows.length ? r.rows.map(x => gauge(x.label, x.ratio, `${num(x.best)} / ${num(x.target.e1rm)} kg`))
      : h("p", { class: "body-sm discret", style: { margin: 0 } }, "Rien à comparer pour l'instant : fais quelques séances avec des développés, rowings, tirages ou curls."),
    !compact && !state.profile.height && h("p", { class: "caption", style: { margin: 0 } }, "Renseigne ta taille dans Réglages › Toi : les repères partent alors de ton poids sec visé, pas du poids du moment."));
}

function focusCard(id) {
  const ex = exercise(id), last = lastPerformance(id);
  const t = state.templates.find(t => t.items.some(it => it.exerciseId === id));
  const it = t?.items.find(x => x.exerciseId === id);
  const sug = it && !isInterval(it) && it.format !== "amrap" ? suggestion(it) : null;
  const pr = athleticProgress(id);
  const raw = it ? athleticCap(ex, it.repsMin) : null, cap = raw === null ? null : Math.floor(raw * 2) / 2;
  return h("div", { class: "card" },
    h("div", { class: "card-head" },
      h("div", null, h("div", { class: "body-lg fort medium" }, niceName(ex.name)),
        h("div", { class: "caption" }, [ex.muscle, EQUIPS[ex.equip], t ? `dans ${t.name}` : "dans aucune séance type"].join(" · "))),
      h("button", { type: "button", class: "btn ghost xs", "aria-label": `Retirer ${ex.name}`, onClick: () => { removeFocus(id); toast(`${niceName(ex.name)} retiré`); } }, "Retirer")),
    h("div", { class: "stat-grid" },
      h("div", { class: "stat" }, h("span", { class: "caption" }, "Dernière fois"), h("b", { class: "num" }, last ? setsLine(ex.equip, last.sets.slice(0, 1)) : "—")),
      h("div", { class: "stat" }, h("span", { class: "caption" }, "Prochaine"), h("b", { class: "num" }, sug ? `${sug.reps}×${chargeNum(ex.equip, sug.weight)}` : it ? chargeNum(ex.equip, it.weight) : "—")),
      h("div", { class: "stat" }, h("span", { class: "caption" }, "Repère"), h("b", { class: "num" }, cap !== null ? chargeNum(ex.equip, cap) : "—"))),
    pr?.best ? gauge("Vers le repère", pr.ratio, `${Math.round(pr.ratio * 100)} %`) : null,
    h("span", { class: "caption" }, last ? `Fait ${ago(last.date)}. ` : "Jamais fait. ",
      cap !== null ? `Repère : ${charge(ex.equip, cap)} pour ${it.repsMin} reps, 2 en réserve.` : "Pas de repère pour ce mouvement : la charge monte tant que les reps suivent."));
}

export function progressionView() {
  const focus = (state.profile.focus || []).filter(id => exercise(id));
  const el = h("div", { class: "screen jaune" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "À faire progresser", subtitle: "Surcharge progressive, objectif hypertrophie" }),
    h("div", { class: "scroll" },
      h("p", { class: "body-sm discret", style: { margin: 0 } },
        `Jusqu'à ${FOCUS_MAX} mouvements. Ils passent en tête de leur séance, frais, et leur charge monte dès qu'une série touche le haut de la fourchette. Pour tous les exercices, une série au-delà de la fourchette fait monter la charge à la séance suivante, recalée d'après ce que tu as fait.`),
      focus.length ? focus.map(focusCard) : h("div", { class: "empty" }, icon("trend"), h("p", { class: "body-md", style: { margin: 0 } }, "Aucun mouvement prioritaire pour l'instant.")),
      focus.length < FOCUS_MAX && btn("Choisir un mouvement", { variant: focus.length ? "secondary" : "primary", size: "lg", full: true, icon: "plus", onClick: () => go("#/profil/progression/choisir") }),
      athleticCard()));
  return { el, tab: "profil" };
}

export function progressionPickView() {
  const results = h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } });
  let first = true;
  const draw = q => {
    catalogue(results, q, { muscle: first ? null : undefined, pickIcon: "plus",
      note: e => [isFocus(e.id) && "déjà choisi", state.templates.some(t => t.items.some(it => it.exerciseId === e.id)) ? "au programme" : null, lastPerformance(e.id) && `fait ${ago(lastPerformance(e.id).date)}`].filter(Boolean).join(" · "),
      onPick: e => {
        const r = addFocus(e.id);
        toast(r.added ? `${niceName(e.name)} ajouté en tête de ${r.template}` : `${niceName(e.name)} à faire progresser`);
        go("#/profil/progression");
      } });
    first = false;
  };
  const search = h("input", { class: "input", type: "search", placeholder: "Chercher un exercice", "aria-label": "Chercher un exercice", onInput: e => draw(e.target.value) });
  draw("");
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "À faire progresser", href: "#/profil/progression" }, title: "Choisir un mouvement", subtitle: "Pas au programme : il entre en tête de la séance qui travaille le plus ce muscle." }),
    h("div", { class: "scroll" }, search, results));
  return { el };
}

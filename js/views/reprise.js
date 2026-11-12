import { state, history, cyclePosition, enduranceWeek, enduranceGoalWeek, repriseDefaults, startReprise, endReprise, inReprise, startOfWeek, ENDURANCE, CYCLES, PAUSE_DAYS, blocksLabel } from "../store.js";
import { h, icon, navbar, btn, pill, go, stepper, confirmSheet, toast, dateLong } from "../ui.js";

const DAY = 86400000;
const daysSince = t => Math.round((new Date().setHours(0, 0, 0, 0) - new Date(t).setHours(0, 0, 0, 0)) / DAY);
const weekLabel = (w, weeks) => (w === weeks + 1 ? "deload" : `S${w}`);
const dayMonth = t => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
// « Corde à sauter · 1 h non-stop » → « 1 h non-stop ».
const goalName = e => e.label.split(" · ")[1] || "Objectif";

// Aujourd'hui : plus de séance depuis une semaine, on propose de préparer la reprise.
export function pauseCard() {
  const last = history()[0];
  if (!last || state.active || inReprise() || (state.reprise && state.reprise.start > last.startedAt)) return null;
  const d = daysSince(last.startedAt);
  if (d < PAUSE_DAYS) return null;
  return h("div", { class: "card" },
    h("div", { class: "card-head" },
      h("div", null, h("div", { class: "overline" }, "Pause"), h("div", { class: "display-xs num" }, `${d} jours sans séance`)),
      pill("Reprise", "attention")),
    h("p", { class: "body-sm", style: { margin: 0 } }, "Malade, en vacances ? On décale ton bloc et ta corde, et la semaine reprend en douceur."),
    btn("Préparer la reprise", { variant: "primary", full: true, icon: "trend", onClick: () => go("#/reprise") }));
}

// Écran dédié : où le bloc et la corde reprennent lundi, avec la semaine allégée d'ici là.
export function repriseView() {
  const c = state.cycle, e = ENDURANCE[state.profile.endurance]?.weeks ? ENDURANCE[state.profile.endurance] : null;
  const back = { label: "Aujourd'hui", href: "#/" };

  if (inReprise()) {
    const r = state.reprise;
    const el = h("div", { class: "screen no-tabs" },
      navbar({ back, title: "Reprise", subtitle: "Après une pause" }),
      h("div", { class: "scroll" },
        h("div", { class: "card" },
          h("div", { class: "overline" }, "En cours"),
          h("div", { class: "display-xs" }, `Jusqu'à ${dateLong(r.end - DAY)}`),
          rules(e)),
        h("div", { class: "card" },
          h("span", { class: "body-md" }, "Lundi ", dayMonth(r.end), " : bloc ", CYCLES[c.type].label, " en ", h("b", { class: "fort num" }, weekLabel(r.blocWeek, c.weeks)),
            e && r.ropeWeek ? [", corde en ", h("b", { class: "fort num" }, `S${r.ropeWeek}`)] : "", "."),
          e && r.ropeWeek && h("span", { class: "caption num" }, `${goalName(e)} visé la semaine du ${dayMonth(enduranceGoalWeek(r.ropeWeek, r.end))}.`)),
        btn("Arrêter la reprise", { variant: "ghost", full: true, onClick: () => confirmSheet({
          title: "Arrêter la reprise ?",
          message: "Tes séances repartent avec leur volume et leurs charges dès maintenant. Le bloc et la corde gardent leur décalage.",
          confirmLabel: "Arrêter la reprise", cancelLabel: "Continuer la reprise",
          onConfirm: () => { endReprise(); toast("Reprise arrêtée"); go("#/"); }
        }) })));
    return { el };
  }

  const d = repriseDefaults();
  let blocWeek = d.blocWeek, ropeWeek = d.ropeWeek;
  const before = enduranceGoalWeek(enduranceWeek(), startOfWeek(Date.now()));
  const goalLine = h("p", { class: "caption num", style: { margin: 0 } });
  const ropeLine = h("p", { class: "caption num", style: { margin: 0 } });
  const showRope = () => {
    if (!e) return;
    const wk = e.weeks[ropeWeek - 1], goal = enduranceGoalWeek(ropeWeek, d.end);
    ropeLine.textContent = `Faciles ${blocksLabel(wk.easy)} · jour long ${blocksLabel(wk.long)}${wk.deload ? " · deload" : ""}`;
    const shift = Math.round((goal - before) / (7 * DAY));
    goalLine.textContent = `${goalName(e)} visé la semaine du ${dayMonth(goal)}${shift > 0 ? `, ${shift} semaine${shift > 1 ? "s" : ""} plus tard que prévu` : ""}.`;
  };
  showRope();
  const pos = cyclePosition();

  const el = h("div", { class: "screen no-tabs" },
    navbar({ back, title: "Reprise", subtitle: "Après une pause" }),
    h("div", { class: "scroll" },
      h("div", { class: "card" },
        h("div", { class: "overline" }, "Dernière séance"),
        h("div", { class: "display-xs" }, d.last ? dateLong(d.last) : "Aucune pour l'instant"),
        d.last && h("span", { class: "caption num" }, `Il y a ${daysSince(d.last)} jours. Les semaines manquées ne comptent pas : le plan reprend où tu t'étais arrêté.`)),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, `D'ici lundi ${dayMonth(d.end)}`)),
      h("div", { class: "card" }, rules(e)),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, `Lundi ${dayMonth(d.end)}`)),
      h("div", { class: "card" },
        h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, `Bloc ${CYCLES[c.type].label}`),
          stepper({ value: blocWeek, min: 1, max: c.weeks + 1, compact: true, format: v => weekLabel(v, c.weeks), label: "semaine du bloc", onChange: v => { blocWeek = v; } })),
        h("p", { class: "caption", style: { margin: 0 } }, d.last
          ? `Ta dernière séance était en ${weekLabel(Math.max(1, cyclePosition(d.last).week), c.weeks)} : elle compte, le bloc passe à la suivante.`
          : `Le bloc en est à ${pos.deload ? "sa semaine de deload" : `S${Math.max(1, pos.week)}`}.`)),
      e && h("div", { class: "card" },
        h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, e.short),
          stepper({ value: ropeWeek, min: 1, max: e.weeks.length, compact: true, format: v => `S${v}`, label: "semaine du plan", onChange: v => { ropeWeek = v; showRope(); } })),
        ropeLine,
        h("p", { class: "caption", style: { margin: 0 } }, "Tu refais la semaine interrompue : le souffle part plus vite que le muscle."),
        goalLine),
      h("div", { class: "hint attention" }, icon("warning"),
        h("span", { class: "body-sm" }, "Encore de la fièvre, des courbatures de malade ou une gêne dans la poitrine ? Attends d'aller mieux pour reprendre.")),
      btn("Lancer la reprise", { variant: "primary", size: "lg", full: true, onClick: () => {
        startReprise({ blocWeek, ropeWeek: e ? ropeWeek : null });
        toast(`Reprise jusqu'au ${dayMonth(d.end - DAY)}, puis bloc en ${weekLabel(blocWeek, c.weeks)}`);
        go("#/");
      } })));
  return { el };
}

// Ce qui change pendant la reprise, séance par séance.
function rules(e) {
  const line = text => h("li", { class: "body-sm" }, text);
  return h("ul", { class: "reprise-rules" },
    line("Muscu : mêmes exercices, moitié moins de séries."),
    line("Charges −10 %, 3 reps en réserve sur chaque série."),
    e && line(`Corde : ${blocksLabel(e.recup)} chaque jour, pas de jour long.`),
    line("Ces séances ne servent pas de référence : la suite repart de tes charges d'avant."));
}

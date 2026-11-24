import { state, exercise, session, history, exerciseHistory, weeklySets, weeklyGoal, sessionVolume, sessionSets, sessionRecords, deleteSession, cyclePosition, stepsAverage, startOfWeek, e1rm, CYCLES, MUSCLES } from "../store.js";
import { athleticCard } from "./progression.js";
import { h, icon, pageHead, navbar, btn, pill, go, kg, num, int, clock, ago, dateLong, dateShort, segmented, confirmSheet, lineChart, spark } from "../ui.js";
import { stepsCard } from "./today.js";
import { niceName } from "./templates.js";

const WEEK = 7 * 86400000;
let weekOffset = 0;
let metric = "best1rm";

const FEELING = { dur: ["Difficile", "attention"], ok: ["Correct", null], top: ["En forme", "succes"] };

// Progrès : trois vues, choisies par des pilules. La semaine (objectif, muscle par muscle, pas du jour),
// les exercices suivis (1RM estimé), les séances (à rouvrir ou à supprimer).
let view = "semaine";
const redraw = () => dispatchEvent(new HashChangeEvent("hashchange"));
const tons = kg_ => (kg_ >= 10000 ? `${num(kg_ / 1000)} t` : `${int(kg_)} kg`);

// Un point = une série, du muscle le plus en retard au plus avancé.
function muscleDots(done) {
  const rows = MUSCLES.filter(m => state.matrix[m].target > 0).map(m => ({ m, v: done[m] || 0, t: state.matrix[m].target }))
    .sort((a, b) => a.v / a.t - b.v / b.t);
  return h("div", { class: "list", style: { gap: "8px" } }, rows.map(({ m, v, t }) =>
    h("div", { class: `dots-row${v >= t ? " full" : v === 0 ? " zero" : ""}`, role: "img", "aria-label": `${m} : ${v} série${v > 1 ? "s" : ""} sur ${t}` },
      h("span", { class: "name" }, m),
      h("span", { class: `dots${v > t ? " more" : ""}` }, Array.from({ length: t }, (_, i) => h("i", { class: i < v ? "on" : "" }))),
      h("span", { class: "count" }, `${v} / ${t}`))));
}

function weekPane() {
  const ref = Date.now() - weekOffset * WEEK;
  const weekSessions = state.sessions.filter(s => startOfWeek(s.startedAt) === startOfWeek(ref));
  const tonnage = weekSessions.reduce((a, s) => a + sessionVolume(s), 0);
  const avg = stepsAverage();
  const g = weeklyGoal(ref);
  const daysLeft = 7 - ((new Date().getDay() + 6) % 7) - 1;
  // Sous la cible depuis 2 semaines pleines : le signal qui fait changer la matrice au prochain bloc.
  const lagging = Object.entries(state.matrix).filter(([m, { status, target }]) => status !== "maintien" && target > 0 &&
    [1, 2].every(w => (weeklySets(Date.now() - w * WEEK)[m] || 0) < target * 0.8) && state.sessions.some(s => s.startedAt < startOfWeek(Date.now()) - WEEK)).map(([m]) => m);
  return [
    segmented([[0, "Cette semaine"], [1, "Semaine dernière"]], weekOffset, v => { weekOffset = v; redraw(); }, "sm"),
    h("div", null,
      h("h2", { class: "heading-md" }, "Objectif de la semaine"),
      h("div", { class: "big-pct" },
        h("span", { class: "value" }, `${g.pct} %`),
        h("div", { class: "side-stats" },
          h("span", null, h("b", null, `${weekSessions.length} / ${state.profile.days}`), h("span", { class: "caption" }, "séances")),
          h("span", null, h("b", null, tons(tonnage)), h("span", { class: "caption" }, tonnage >= 10000 ? "soulevées" : "soulevés")),
          h("span", null, h("b", null, avg ? int(avg) : "—"), h("span", { class: "caption" }, "pas par jour")))),
      h("p", { class: "body-sm fort medium num", style: { margin: 0 } },
        `${g.sets} série${g.sets > 1 ? "s" : ""} sur ${g.total} · ${g.ok} muscle${g.ok > 1 ? "s" : ""} sur ${g.count} à la cible`,
        weekOffset === 0 ? ` · ${daysLeft ? `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}` : "dernier jour"}` : "")),
    h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Par muscle"), h("span", { class: "caption" }, "un point = une série")),
    muscleDots(weeklySets(ref)),
    lagging.length > 0 && h("div", { class: "hint attention" }, icon("warning"),
      h("span", { class: "body-sm" }, h("b", { class: "fort medium" }, lagging.join(", ")), " sous la cible depuis 2 semaines : ajoute 2 séries, ou fais-en le point faible du prochain bloc.")),
    weekOffset === 0 && stepsCard()];
}

function exosPane() {
  const tracked = state.exercises
    .map(e => ({ e, rows: exerciseHistory(e.id) }))
    .filter(x => x.rows.length)
    .sort((a, b) => (b.e.pref === "aime") - (a.e.pref === "aime") || b.rows.at(-1).date - a.rows.at(-1).date);
  if (!tracked.length) return h("div", { class: "empty" }, icon("trend"), h("h2", { class: "display-xs" }, "Pas encore de courbe"),
    h("p", { class: "body-md", style: { margin: 0 } }, "Dès ta première séance, la progression de chaque exercice s'affiche ici."));
  return [
    athleticCard({ compact: true }),
    h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Tes exercices"), h("span", { class: "caption" }, "1RM estimé · favoris d'abord")),
    h("div", { class: "list" }, tracked.map(({ e, rows }) => {
      const best = Math.max(...rows.map(r => r.best1rm));
      const recent = rows.slice(-6).map(r => r.best1rm);
      const delta = recent.length > 1 ? ((recent.at(-1) - recent[0]) / recent[0]) * 100 : 0;
      return h("button", { class: "row", onClick: () => go(`#/progres/${e.id}`) },
        h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, niceName(e.name)),
          h("span", { class: "caption num" }, `${e.muscle} · ${ago(rows.at(-1).date)}`,
            recent.length > 1 && [" · ", h("b", { class: delta > 0.05 ? "vert" : delta < -0.05 ? "orange" : "" }, Math.abs(delta) < 0.05 ? "stable" : `${delta > 0 ? "+" : "−"}${num(Math.abs(delta))} %`)])),
        spark(recent),
        h("span", { class: "val" }, h("b", null, num(Math.round(best * 2) / 2)), h("small", null, "kg")));
    }))];
}

function sessionsPane() {
  const all = history();
  if (!all.length) return h("div", { class: "empty" }, icon("calendar"), h("h2", { class: "display-xs" }, "Aucune séance"),
    h("p", { class: "body-md", style: { margin: 0 } }, "Tes séances terminées se rangent ici, mois par mois. Tu pourras les rouvrir ou les supprimer."));
  const months = new Map();
  for (const s of all) {
    const k = new Date(s.startedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    months.set(k, [...(months.get(k) || []), s]);
  }
  return [...months].map(([m, list]) => h("div", { class: "list" },
    h("h2", { class: "month" }, m),
    list.map(s => h("button", { class: "row", onClick: () => go(`#/progres/historique/${s.id}`) },
      h("div", { class: "row-main" },
        h("span", { style: { display: "flex", alignItems: "center", gap: "8px" } }, h("span", { class: "name-xl" }, s.name), s.feeling && pill(...FEELING[s.feeling])),
        h("span", { class: "caption num" }, `${dateShort(s.startedAt)} · ${sessionSets(s)} série${sessionSets(s) > 1 ? "s" : ""} · ${int(sessionVolume(s))} kg`)),
      icon("caretRight", "chev")))));
}

export function progressView() {
  const pos = cyclePosition();
  const n = state.sessions.length;
  const sub = view === "seances" ? `${n} séance${n > 1 ? "s" : ""}`
    : `Bloc ${CYCLES[state.cycle.type].label} · ${pos.reprise ? "reprise" : pos.deload ? "deload" : `semaine ${Math.min(pos.week, state.cycle.weeks)} / ${state.cycle.weeks}`}`;
  const el = h("div", { class: "screen" },
    pageHead("Progrès", sub),
    h("div", { class: "scroll" },
      segmented([["semaine", "Semaine"], ["exos", "Exos"], ["seances", "Séances"]], view, v => { view = v; redraw(); }),
      view === "semaine" ? weekPane() : view === "exos" ? exosPane() : sessionsPane()));
  return { el, tab: "progres" };
}

export function exerciseProgressView({ id }) {
  const e = exercise(id);
  if (!e) { setTimeout(() => go("#/progres")); return { el: h("div") }; }
  const rows = exerciseHistory(id);
  const labels = { best1rm: "1RM estimé", maxWeight: "Charge max", volume: "Volume" };
  const fmt = metric === "volume" ? int : num;
  const best = rows.length ? Math.max(...rows.map(r => r[metric])) : 0;
  const top = rows.flatMap(r => r.sets.map(s => ({ ...s, date: r.date }))).sort((a, b) => e1rm(b.weight, b.reps) - e1rm(a.weight, a.reps))[0];
  const delta = rows.length > 1 && rows[0][metric] ? ((rows.at(-1)[metric] - rows[0][metric]) / rows[0][metric]) * 100 : null;

  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Progrès · Exos", onClick: () => { view = "exos"; go("#/progres"); } }, title: niceName(e.name), subtitle: `${e.muscle} · ${rows.length} séance${rows.length > 1 ? "s" : ""}` }),
    h("div", { class: "scroll" },
      segmented(Object.entries(labels), metric, v => { metric = v; dispatchEvent(new HashChangeEvent("hashchange")); }, "sm"),
      !rows.length && h("div", { class: "empty" }, icon("chart"), h("p", { class: "body-md", style: { margin: 0 } }, "Pas encore fait. Ta courbe démarre à la première série validée.")),
      rows.length > 0 && h("div", null,
        h("div", { class: "big-pct" },
          h("span", { class: "value jaune" }, fmt(best), h("small", null, "KG")),
          delta !== null && h("div", { class: "side-stats" },
            h("span", null, h("b", { class: `delta ${delta > 0.05 ? "vert" : delta < -0.05 ? "orange" : ""}` }, Math.abs(delta) < 0.05 ? "stable" : `${delta > 0 ? "+" : "−"}${num(Math.abs(delta))} %`)),
            h("span", { class: "caption" }, `en ${rows.length} séances`))),
        h("p", { class: "body-sm fort medium num", style: { margin: 0 } },
          `${{ best1rm: "Meilleur 1RM estimé", maxWeight: "Meilleure charge", volume: "Meilleur volume" }[metric]}`, top ? ` · meilleure série ${kg(top.weight)} × ${top.reps}, le ${dateShort(top.date)}` : "")),
      rows.length === 1 && h("div", { class: "hint bleu" }, icon("trend"), h("span", { class: "body-sm" }, h("b", { class: "fort" }, "Une seule séance pour l'instant. "), "La courbe se trace à partir de la deuxième.")),
      rows.length > 1 && lineChart(rows.map(r => ({ x: r.date, y: r[metric] })), { format: fmt }),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Séances")),
      h("div", { class: "list" }, [...rows].reverse().map(r => h("button", { class: "row", onClick: () => go(`#/progres/historique/${r.sessionId}`) },
        h("div", { class: "row-main" }, h("span", { class: "body-md fort num" }, r.sets.map(s => `${s.reps}×${s.weight ? num(s.weight) : "PDC"}`).join(" · ")), h("span", { class: "caption" }, dateLong(r.date))),
        h("span", { class: "val plain" }, h("b", null, num(r.best1rm)), h("small", null, "kg")))))));
  return { el, tab: "progres" };
}

// Ancienne adresse de l'historique : la liste des séances est une vue de Progrès.
export function historyView() {
  view = "seances";
  return progressView();
}

export function sessionView({ id }) {
  const s = session(id);
  if (!s) { setTimeout(() => go("#/progres/historique")); return { el: h("div") }; }
  const records = sessionRecords(s);
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Progrès · Séances", href: "#/progres/historique" }, title: s.name, subtitle: dateLong(s.startedAt) }),
    h("div", { class: "scroll" },
      h("div", { class: "stat-grid" },
        h("div", { class: "stat" }, h("span", { class: "caption" }, "durée"), h("b", null, clock((s.endedAt - s.startedAt) / 1000))),
        h("div", { class: "stat" }, h("span", { class: "caption" }, "séries"), h("b", null, sessionSets(s))),
        h("div", { class: "stat" }, h("span", { class: "caption" }, "kg soulevés"), h("b", null, int(sessionVolume(s))))),
      h("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
        pill(`Bloc ${CYCLES[s.cycle]?.label || "—"} · ${s.reprise ? "reprise" : s.deload ? "deload" : `S${s.week}`}`, "accent"),
        s.feeling && pill(...FEELING[s.feeling])),
      h("div", { class: "list" }, s.entries.map(e => {
        const rec = records.find(r => r.exerciseId === e.exerciseId);
        return h("div", { class: "row" },
          h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, exercise(e.exerciseId)?.name || "Exercice supprimé"),
            (e.swappedFrom || e.extra) && h("span", { class: "caption" }, e.extra ? "Hors programme" : `À la place de ${exercise(e.swappedFrom)?.name || "—"}`),
            h("span", { class: "caption num" }, (e.format === "emom" || e.format === "tabata" ? `${e.format === "emom" ? "EMOM" : "Tabata"} · ${e.sets.length} rounds · ` : e.format === "amrap" ? `AMRAP · ${e.sets.length} tours · ` : "") + e.sets.map(x => `${x.reps}×${x.weight ? num(x.weight) : "PDC"}${x.rpe ? ` @${x.rpe}` : ""}`).join(" · "))),
          rec && pill("Record", "succes"));
      })),
      s.note && h("div", { class: "card flat" }, h("span", { class: "overline" }, "Journal"), h("p", { class: "body-md", style: { margin: 0 } }, s.note)),
      btn("Supprimer la séance", { variant: "danger", full: true, onClick: () => confirmSheet({
        title: "Supprimer la séance ?",
        message: `${s.name} du ${dateLong(s.startedAt)} disparaît de l'historique, des courbes et de l'objectif Fluide de la semaine. Irréversible.`,
        confirmLabel: "Supprimer définitivement", cancelLabel: "Garder la séance", destructive: true,
        onConfirm: () => { deleteSession(s.id); go("#/progres/historique"); }
      }) })));
  return { el, tab: "progres" };
}

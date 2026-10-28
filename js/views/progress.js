import { state, exercise, session, history, exerciseHistory, weeklySets, sessionVolume, sessionSets, sessionRecords, deleteSession, cyclePosition, stepsAverage, startOfWeek, e1rm, CYCLES } from "../store.js";
import { h, icon, pageHead, navbar, btn, pill, go, kg, num, int, clock, ago, dateLong, dateShort, segmented, confirmSheet, lineChart, spark } from "../ui.js";
import { volumeBars } from "./today.js";

const WEEK = 7 * 86400000;
let weekOffset = 0;
let metric = "best1rm";

const FEELING = { dur: ["Difficile", "danger"], ok: ["Correct", null], top: ["En forme", "succes"] };

export function progressView() {
  const pos = cyclePosition();
  const ref = Date.now() - weekOffset * WEEK;
  const weekSessions = state.sessions.filter(s => startOfWeek(s.startedAt) === startOfWeek(ref));
  const tonnage = weekSessions.reduce((a, s) => a + sessionVolume(s), 0);
  const avg = stepsAverage();

  const tracked = state.exercises
    .map(e => ({ e, rows: exerciseHistory(e.id) }))
    .filter(x => x.rows.length)
    .sort((a, b) => b.rows.at(-1).date - a.rows.at(-1).date);

  // Sous la cible depuis 2 semaines pleines : le signal qui fait changer la matrice au prochain bloc.
  const lagging = Object.entries(state.matrix).filter(([m, { status, target }]) => status !== "maintien" && target > 0 &&
    [1, 2].every(w => (weeklySets(Date.now() - w * WEEK)[m] || 0) < target * 0.8) && state.sessions.some(s => s.startedAt < startOfWeek(Date.now()) - WEEK)).map(([m]) => m);

  const el = h("div", { class: "screen" },
    pageHead("Progrès", `Bloc ${CYCLES[state.cycle.type].label} · ${pos.deload ? "deload" : `semaine ${Math.min(pos.week, state.cycle.weeks)} / ${state.cycle.weeks}`}`),
    h("div", { class: "scroll" },
      segmented([[0, "Cette semaine"], [1, "Semaine dernière"]], weekOffset, v => { weekOffset = v; dispatchEvent(new HashChangeEvent("hashchange")); }),
      h("div", { class: "stat-grid" },
        h("div", { class: "stat" }, h("span", { class: "caption" }, "Séances"), h("b", null, `${weekSessions.length} / ${state.profile.days}`)),
        h("div", { class: "stat" }, h("span", { class: "caption" }, "Tonnage"), h("b", null, tonnage >= 10000 ? `${num(tonnage / 1000)} t` : `${int(tonnage)} kg`)),
        h("div", { class: "stat" }, h("span", { class: "caption" }, "Pas moy. 7 j"), h("b", null, avg ? int(avg) : "—"))),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Volume par muscle")),
      h("div", { class: "card" }, volumeBars(weeklySets(ref))),
      lagging.length > 0 && h("div", { class: "hint attention" }, icon("warning"),
        h("span", { class: "body-sm" }, h("b", { class: "fort medium" }, lagging.join(", ")), " sous la cible depuis 2 semaines : ajoute 2 séries, ou fais-en le point faible du prochain bloc.")),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Exercices"), h("span", { class: "caption" }, "1RM estimé")),
      tracked.length
        ? h("div", { class: "list" }, tracked.map(({ e, rows }) => {
            const best = Math.max(...rows.map(r => r.best1rm));
            const recent = rows.slice(-6).map(r => r.best1rm);
            const delta = recent.length > 1 ? ((recent.at(-1) - recent[0]) / recent[0]) * 100 : 0;
            return h("button", { class: "row", onClick: () => go(`#/progres/${e.id}`) },
              h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, e.name), h("span", { class: "caption" }, `${e.muscle} · ${ago(rows.at(-1).date)}`)),
              spark(recent),
              h("div", { class: "row-end" }, h("span", { class: "body-md fort num" }, kg(Math.round(best * 2) / 2)),
                recent.length > 1 && h("span", { class: "caption num", style: { color: delta > 0 ? "var(--etat-succes)" : delta < 0 ? "var(--etat-danger)" : null } }, `${delta > 0 ? "+" : ""}${num(delta)} %`)),
              icon("caretRight", "chev"));
          }))
        : h("div", { class: "card empty" }, icon("chart"), h("p", { class: "body-md", style: { margin: 0 } }, "Tes courbes apparaîtront après ta première séance.")),
      h("div", { class: "list" },
        h("button", { class: "row", onClick: () => go("#/progres/historique") },
          icon("timer", "chev"), h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, "Historique et journal")),
          h("span", { class: "caption num" }, `${state.sessions.length} séance${state.sessions.length > 1 ? "s" : ""}`), icon("caretRight", "chev")))));
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

  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Progrès", href: "#/progres" }, title: e.name, subtitle: e.muscle }),
    h("div", { class: "scroll" },
      segmented(Object.entries(labels), metric, v => { metric = v; dispatchEvent(new HashChangeEvent("hashchange")); }, "sm"),
      !rows.length && h("div", { class: "card empty" }, icon("chart"), h("p", { class: "body-md", style: { margin: 0 } }, "Pas encore fait. Ta courbe démarre à la première série validée.")),
      rows.length > 0 && h("div", { class: "card" },
        h("span", { class: "caption" }, { best1rm: "Meilleur 1RM estimé", maxWeight: "Meilleure charge", volume: "Meilleur volume" }[metric]),
        h("span", { class: "display-sm num" }, `${fmt(best)} kg`),
        top && h("span", { class: "body-sm num" }, `Meilleure série : ${kg(top.weight)} × ${top.reps} · ${dateShort(top.date)}`),
        lineChart(rows.map(r => ({ x: r.date, y: r[metric] })), { format: fmt })),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Séances")),
      h("div", { class: "list" }, [...rows].reverse().map(r => h("button", { class: "row", onClick: () => go(`#/progres/historique/${r.sessionId}`) },
        h("div", { class: "row-main" }, h("span", { class: "body-md fort num" }, r.sets.map(s => `${s.reps}×${s.weight ? num(s.weight) : "PDC"}`).join(" · ")), h("span", { class: "caption" }, dateLong(r.date))),
        h("span", { class: "caption num" }, `${num(r.best1rm)} kg`))))));
  return { el, tab: "progres" };
}

export function historyView() {
  const all = history();
  const months = new Map();
  for (const s of all) {
    const k = new Date(s.startedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    months.set(k, [...(months.get(k) || []), s]);
  }
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Progrès", href: "#/progres" }, title: "Historique", subtitle: `${all.length} séance${all.length > 1 ? "s" : ""}` }),
    h("div", { class: "scroll" },
      all.length ? [...months].map(([m, list]) => h("div", null,
        h("div", { class: "overline", style: { margin: "0 0 8px" } }, m),
        h("div", { class: "list" }, list.map(s => h("button", { class: "row", onClick: () => go(`#/progres/historique/${s.id}`) },
          h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, s.name),
            h("span", { class: "caption num" }, `${dateLong(s.startedAt)} · ${sessionSets(s)} série${sessionSets(s) > 1 ? "s" : ""} · ${int(sessionVolume(s))} kg`)),
          s.feeling && pill(...FEELING[s.feeling]), icon("caretRight", "chev"))))))
        : h("div", { class: "card empty" }, icon("timer"), h("p", { class: "body-md", style: { margin: 0 } }, "Aucune séance enregistrée."))));
  return { el, tab: "progres" };
}

export function sessionView({ id }) {
  const s = session(id);
  if (!s) { setTimeout(() => go("#/progres/historique")); return { el: h("div") }; }
  const records = sessionRecords(s);
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Historique", href: "#/progres/historique" }, title: s.name, subtitle: dateLong(s.startedAt) }),
    h("div", { class: "scroll" },
      h("div", { class: "stat-grid" },
        h("div", { class: "stat" }, h("span", { class: "caption" }, "Durée"), h("b", null, clock((s.endedAt - s.startedAt) / 1000))),
        h("div", { class: "stat" }, h("span", { class: "caption" }, "Séries"), h("b", null, sessionSets(s))),
        h("div", { class: "stat" }, h("span", { class: "caption" }, "Volume"), h("b", null, `${int(sessionVolume(s))} kg`))),
      h("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
        pill(`Bloc ${CYCLES[s.cycle]?.label || "—"} · ${s.deload ? "deload" : `S${s.week}`}`, "accent"),
        s.feeling && pill(...FEELING[s.feeling])),
      h("div", { class: "list" }, s.entries.map(e => {
        const rec = records.find(r => r.exerciseId === e.exerciseId);
        return h("div", { class: "row" },
          h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, exercise(e.exerciseId)?.name || "Exercice supprimé"),
            (e.swappedFrom || e.extra) && h("span", { class: "caption" }, e.extra ? "Hors programme" : `À la place de ${exercise(e.swappedFrom)?.name || "—"}`),
            h("span", { class: "caption num" }, (e.format === "emom" || e.format === "tabata" ? `${e.format === "emom" ? "EMOM" : "Tabata"} · ${e.sets.length} rounds · ` : "") + e.sets.map(x => `${x.reps}×${x.weight ? num(x.weight) : "PDC"}${x.rpe ? ` @${x.rpe}` : ""}`).join(" · "))),
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

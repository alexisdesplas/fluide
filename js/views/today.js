import { state, estimate, itemSets, cyclePosition, weeklySets, weeklyGoal, history, template, setHabit, habit, dayKey, stepsAverage, startWorkout, STATUS, MUSCLES, CYCLES } from "../store.js";
import { h, icon, pageHead, btn, pill, go, int, dateLong, ago, stepper } from "../ui.js";

export { estimate };

// Prochaine séance : on fait tourner les séances types, la moins récente d'abord.
export function nextTemplate() {
  const last = id => history().find(s => s.templateId === id)?.startedAt || 0;
  return [...state.templates].filter(t => t.items.length).sort((a, b) => last(a.id) - last(b.id))[0] || null;
}

export function cycleCard(compact) {
  const pos = cyclePosition();
  const c = state.cycle;
  const segs = Array.from({ length: c.weeks + 1 }, (_, i) => {
    const w = i + 1, isDeload = w === c.weeks + 1;
    const cls = [isDeload && "deload", w < pos.week && "on", w === pos.week && (isDeload ? "on" : "cur")].filter(Boolean).join(" ");
    return h("i", { class: cls });
  });
  const left = c.weeks - pos.week + 1;
  return h("div", { class: "card" },
    h("div", { class: "card-head" },
      h("div", null,
        h("div", { class: "overline" }, `Bloc ${CYCLES[c.type].label}`),
        h("div", { class: "display-xs" }, pos.over ? "Bloc terminé" : pos.deload ? "Semaine de deload" : `Semaine ${pos.week} sur ${c.weeks}`)),
      pos.deload ? pill("Deload", "attention") : pos.over ? pill("Bilan à faire", "danger") : pill(`RPE ${String(CYCLES[c.type].rpe).replace(".", ",")}`, "accent")),
    h("div", { class: "segments", "aria-hidden": "true" }, segs),
    !compact && h("p", { class: "body-sm discret", style: { margin: 0 } },
      pos.over ? "Fais le bilan du bloc et choisis le suivant dans ton profil."
        : pos.deload ? "Même exercices, volume divisé par deux. On dissipe la fatigue pour relancer la progression."
        : `${CYCLES[c.type].desc} Deload dans ${left} semaine${left > 1 ? "s" : ""}.`),
    pos.over && btn("Choisir le prochain bloc", { variant: "secondary", full: true, onClick: () => go("#/profil") }));
}

export function volumeBars(done, { only } = {}) {
  const order = { faible: 0, focus: 1, maintien: 2 };
  const muscles = MUSCLES.filter(m => state.matrix[m].target > 0 && (!only || only.includes(m)))
    .sort((a, b) => order[state.matrix[a].status] - order[state.matrix[b].status]);
  return h("div", null, muscles.map(m => {
    const { status, target } = state.matrix[m];
    const v = done[m] || 0, max = Math.max(target, v) * 1.1;
    return h("div", { class: "vol", title: STATUS[status].label },
      h("span", { class: "body-sm fort" }, m),
      h("div", { class: "vol-track" },
        h("div", { class: `vol-fill ${v >= target ? "done" : status}`, style: { width: `${(v / max) * 100}%` } }),
        h("div", { class: "vol-target", style: { left: `${(target / max) * 100}%` } })),
      h("span", { class: "caption num", style: { textAlign: "right" } }, `${v} / ${target}`));
  }));
}

// Compteur général : la semaine a-t-elle rempli l'objectif Fluide (séries par muscle de la matrice) ?
export function goalCard() {
  const g = weeklyGoal();
  const tone = g.pct >= 100 ? "succes" : g.pct >= 60 ? "accent" : null;
  const daysLeft = 7 - ((new Date().getDay() + 6) % 7) - 1;
  return h("button", { class: "card tap", onClick: () => go("#/profil/matrice"), "aria-label": `Objectif Fluide de la semaine : ${g.pct} %` },
    h("div", { class: "card-head" },
      h("span", { class: "overline" }, "Objectif Fluide · semaine"),
      g.pct >= 100 ? pill("Rempli", "succes") : pill(daysLeft ? `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}` : "Dernier jour", tone)),
    h("div", { style: { display: "flex", alignItems: "baseline", gap: "12px" } },
      h("span", { class: "display-sm num" }, `${g.pct} %`),
      h("span", { class: "body-sm num" }, `${g.ok} muscle${g.ok > 1 ? "s" : ""} sur ${g.count} à la cible`)),
    h("div", { class: "vol-track", role: "progressbar", "aria-valuenow": g.pct, "aria-valuemin": 0, "aria-valuemax": 100 },
      h("div", { class: `vol-fill ${g.pct >= 100 ? "done" : "focus"}`, style: { width: `${Math.min(100, g.pct)}%` } })),
    h("span", { class: "caption num" }, `${g.sets} série${g.sets > 1 ? "s" : ""} faite${g.sets > 1 ? "s" : ""} sur ${g.total} prévues par tes réglages Fluide`));
}

export function todayView() {
  const pos = cyclePosition();
  const next = nextTemplate();
  const done = weeklySets();
  const today = dayKey();
  const steps = habit(today).steps || 0;
  const target = state.profile.stepsTarget;
  const avg = stepsAverage();
  const lastSession = history()[0];

  const sessionCard = state.active
    ? h("div", { class: "card" },
        h("div", { class: "overline" }, "Séance en cours"),
        h("div", { class: "display-xs" }, state.active.name),
        btn("Reprendre la séance", { variant: "primary", size: "lg", full: true, icon: "timer", onClick: () => go("#/seance") }))
    : next
      ? h("div", { class: "card" },
          h("div", { class: "card-head" },
            h("div", null, h("div", { class: "overline" }, "Prochaine séance"), h("div", { class: "display-xs" }, next.name)),
            h("span", { class: "caption num" }, `~${estimate(next)} min`)),
          h("p", { class: "body-sm", style: { margin: 0 } },
            next.items.length, next.items.length > 1 ? " exercices · " : " exercice · ", next.items.reduce((a, i) => a + (pos.deload ? Math.ceil(itemSets(i) / 2) : itemSets(i)), 0), " séries",
            pos.deload ? " (deload)" : ""),
          h("div", { class: "hint" }, icon("bolt"), h("span", { class: "body-sm" }, "Échauffement : ", h("b", { class: "fort medium" }, state.profile.warmup), ", puis séries d'approche sur le premier exercice.")),
          btn(`Démarrer ${next.name}`, { variant: "primary", size: "lg", full: true, onClick: () => { startWorkout(next.id); go("#/seance"); } }),
          btn("Choisir une autre séance", { variant: "ghost", full: true, onClick: () => go("#/seances") }))
      : h("div", { class: "card empty" }, icon("list"), h("p", { class: "body-md", style: { margin: 0 } }, "Aucune séance type pour l'instant."),
          btn("Choisir un programme", { variant: "primary", onClick: () => go("#/seances/programme") }));

  const el = h("div", { class: "screen" },
    pageHead("Aujourd'hui", `${dateLong(Date.now())}${lastSession ? ` · dernière séance ${ago(lastSession.startedAt)}` : ""}`),
    h("div", { class: "scroll" },
      goalCard(),
      sessionCard,
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Par muscle"), h("button", { class: "btn ghost xs", onClick: () => go("#/profil/matrice") }, "Réglages Fluide")),
      h("div", { class: "card" },
        h("p", { class: "caption", style: { margin: 0 } }, "Séries faites cette semaine. Le trait blanc est la cible : maintenir, progresser ou point faible."),
        volumeBars(done)),
      cycleCard(),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Pas du jour"), h("span", { class: "caption num" }, avg ? `moy. 7 j : ${int(avg)}` : "")),
      h("div", { class: "card" },
        h("div", { class: "card-head" },
          h("span", { class: "body-sm" }, "Cible ", h("b", { class: "fort num" }, int(target))),
          steps >= target ? pill("Cible atteinte", "succes") : pill(`${int(Math.max(0, target - steps))} restants`)),
        stepper({ value: steps, step: 500, max: 60000, format: int, unit: "pas", editable: true, label: "pas du jour",
          onChange: v => { setHabit(today, "steps", v, true); } }))));
  return { el, tab: "" };
}

import { state, save, template, exercise, createTemplate, deleteTemplate, addItem, moveItem, removeItem, createExercise, setPref, toggleFav, setItemFormat, itemSets, generateProgram, applyProgram, plannedSetsOf, SPLITS, suggestion, lastPerformance, plannedSets, startWorkout, history, MUSCLES, PREFS, FORMATS } from "../store.js";
import { h, icon, pageHead, navbar, btn, pill, go, kg, clock, reps, ago, stepper, segmented, sheet, confirmSheet, toast, num } from "../ui.js";
import { estimate, volumeBars } from "./today.js";

export const prefPill = pref =>
  pref === "aime" ? pill("Favori", "accent") : pref === "evite" ? pill("Je n'aime pas") : pref === "douleur" ? pill("Douleur", "danger") : null;

export const itemLine = it =>
  it.format === "emom" ? `EMOM ${it.rounds} × ${clock(it.every)} · ${it.repsMin} reps · ${kg(it.weight)}`
  : it.format === "tabata" ? `Tabata ${it.rounds} × ${it.work} s / ${it.off} s · ${kg(it.weight)}`
  : `${it.sets} × ${reps(it.repsMin, it.repsMax)} · ${kg(it.weight)} · repos ${clock(it.rest)}`;

// Catalogue partagé (ajout à une séance, hors programme, mes exercices) : favoris en tête, étoile au toucher.
export function catalogue(list, query, { onPick, note, pickIcon = "plus" }) {
  const q = query.trim().toLowerCase();
  const match = e => !q || e.name.toLowerCase().includes(q);
  const rank = { neutre: 0, evite: 1, douleur: 2 };
  const favs = state.exercises.filter(e => e.pref === "aime" && match(e)).sort((a, b) => a.name.localeCompare(b.name));
  const groups = MUSCLES.map(m => [m, state.exercises.filter(e => e.muscle === m && e.pref !== "aime" && match(e)).sort((a, b) => rank[a.pref] - rank[b.pref] || a.name.localeCompare(b.name))])
    .filter(([, xs]) => xs.length);
  const redraw = () => catalogue(list, query, { onPick, note, pickIcon });
  const row = e => h("div", { class: "row pick", style: e.pref === "douleur" ? { opacity: .6 } : null },
    h("button", { class: "row-btn", onClick: () => onPick(e) },
      h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, e.name), h("span", { class: "caption num" }, note(e))),
      e.pref !== "aime" && prefPill(e.pref), icon(pickIcon, "chev")),
    e.pref !== "douleur" && h("button", { class: "star", "aria-pressed": String(e.pref === "aime"), "aria-label": e.pref === "aime" ? `Retirer ${e.name} des favoris` : `Mettre ${e.name} en favori`,
      onClick: () => { toggleFav(e.id); redraw(); } }, icon("star")));
  const block = (title, xs) => h("div", null, h("div", { class: "overline", style: { margin: "0 0 8px" } }, title), h("div", { class: "list" }, xs.map(row)));
  list.replaceChildren(...[favs.length && block("★ Favoris", favs), ...groups.map(([m, xs]) => block(m, xs))].filter(Boolean));
  if (!favs.length && !groups.length) list.append(h("p", { class: "body-sm discret", style: { margin: 0 } }, "Aucun exercice ne correspond."));
}

function nameSheet({ title, value = "", okLabel, onOk }) {
  const input = h("input", { class: "input", value, placeholder: "Ex. Haut A, Push, Full body", maxLength: 40, "aria-label": "Nom" });
  sheet({ title, okLabel, body: h("div", { class: "field" }, input),
    ok: () => { const v = input.value.trim(); if (!v) { input.focus(); return false; } onOk(v); } });
  setTimeout(() => input.focus(), 50);
}

export function templatesView() {
  editing = null;
  const n = state.templates.length;
  const el = h("div", { class: "screen" },
    pageHead("Séances", `${n} séance${n > 1 ? "s" : ""} type${n > 1 ? "s" : ""} · ${state.profile.days} jours / semaine`,
      h("button", { class: "icon-round", "aria-label": "Nouvelle séance", onClick: () => nameSheet({ title: "Nouvelle séance", okLabel: "Créer la séance",
        onOk: v => { const t = createTemplate(v); setTimeout(() => go(`#/seances/${t.id}`)); } }) }, icon("plus"))),
    h("div", { class: "scroll" },
      n > 0 && h("button", { class: "card tap", onClick: () => go("#/seances/programme") },
        h("div", { class: "card-head" },
          h("div", null, h("div", { class: "overline" }, "Programme"), h("div", { class: "display-xs" }, SPLITS[state.profile.split || "perso"].label)),
          h("span", { class: "btn ghost sm" }, "Changer"))),
      n ? state.templates.map(t => {
        const last = history().find(s => s.templateId === t.id);
        const muscles = [...new Set(t.items.map(i => exercise(i.exerciseId)?.muscle))].join(" · ");
        return h("button", { class: "card tap", onClick: () => go(`#/seances/${t.id}`) },
          h("div", { class: "card-head" }, h("span", { class: "display-xs" }, t.name), icon("caretRight", "chev discret")),
          h("span", { class: "body-sm num" }, `${t.items.length} exercices · ${t.items.reduce((a, i) => a + itemSets(i), 0)} séries · ~${estimate(t)} min`),
          h("span", { class: "caption" }, muscles || "Aucun exercice", last ? ` — faite ${ago(last.startedAt)}` : ""));
      }) : h("div", { class: "card empty" },
        h("p", { class: "body-md fort medium", style: { margin: 0 } }, "Aucune séance type"),
        h("p", { class: "body-sm discret", style: { margin: 0 } }, "Choisis un programme (full body, haut / bas, push / pull / legs…) ou crée tes séances toi-même."),
        btn("Choisir un programme", { variant: "primary", size: "lg", full: true, onClick: () => go("#/seances/programme") })),
      n > 0 && h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Volume prévu par semaine")),
      n > 0 && h("div", { class: "card" },
        h("p", { class: "caption", style: { margin: 0 } }, "Si tu fais chaque séance une fois. Le trait blanc est la cible de ta matrice : ajuste les séries pour tomber dessus."),
        volumeBars(plannedSets()))));
  return { el, tab: "seances" };
}

// Mode « Modifier » : nom, ordre des exercices (↑ ↓) et suppression. Hors de ce mode, une ligne s'ouvre au toucher.
let editing = null;

export function templateView({ id }) {
  const t = template(id);
  if (!t) { setTimeout(() => go("#/seances")); return { el: h("div") }; }
  const edit = editing === t.id;
  const leave = () => { editing = null; go("#/seances"); };
  const toggle = () => { editing = edit ? null : t.id; save(); };

  const rows = t.items.map((it, i) => {
    const ex = exercise(it.exerciseId);
    const main = [h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, ex.name), h("span", { class: "caption num" }, itemLine(it))), prefPill(ex.pref)];
    return edit
      ? h("div", { class: "row" }, ...main,
          h("div", { class: "reorder" },
            h("button", { class: "btn secondary square", "aria-label": `Monter ${ex.name}`, disabled: i === 0, onClick: () => moveItem(t.id, it.id, -1) }, icon("up")),
            h("button", { class: "btn secondary square", "aria-label": `Descendre ${ex.name}`, disabled: i === t.items.length - 1, onClick: () => moveItem(t.id, it.id, 1) }, icon("down"))))
      : h("button", { class: "row", onClick: () => go(`#/seances/${t.id}/${it.id}`) }, ...main, icon("caretRight", "chev"));
  });
  const list = t.items.length ? h("div", { class: "list" }, rows)
    : h("div", { class: "card empty" }, h("p", { class: "body-md fort medium", style: { margin: 0 } }, "Aucun exercice"),
        h("p", { class: "body-sm discret", style: { margin: 0 } }, "Commence par un ou deux polyarticulaires lourds, puis l'isolation."));

  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Séances", onClick: leave }, title: t.name, subtitle: `${t.items.length} exercice${t.items.length > 1 ? "s" : ""} · ~${estimate(t)} min`,
      action: { label: edit ? "OK" : "Modifier", onClick: toggle } }),
    h("div", { class: "scroll" }, edit
      ? [
          h("label", { class: "field" }, h("span", { class: "caption medium" }, "Nom de la séance"),
            h("input", { class: "input", value: t.name, maxLength: 40, onChange: e => { const v = e.target.value.trim(); if (v) { t.name = v; save(); } else e.target.value = t.name; } })),
          h("p", { class: "caption", style: { margin: 0 } }, "Les flèches changent l'ordre dans la séance : les polyarticulaires lourds d'abord."),
          list,
          btn("Supprimer la séance type", { variant: "danger", full: true, onClick: () => confirmSheet({
            title: "Supprimer la séance type ?",
            message: `« ${t.name} » disparaît de tes séances. Les séances déjà faites restent dans l'historique et les courbes.`,
            confirmLabel: "Supprimer la séance type", cancelLabel: "Garder la séance", destructive: true,
            onConfirm: () => { editing = null; deleteTemplate(t.id); go("#/seances"); }
          }) })
        ]
      : [
          list,
          btn("Ajouter un exercice", { variant: "secondary", size: "lg", full: true, icon: "plus", onClick: () => go(`#/seances/${t.id}/ajouter`) }),
          btn(`Démarrer ${t.name}`, { variant: "primary", size: "lg", full: true, disabled: !t.items.length || !!state.active,
            onClick: () => { startWorkout(t.id); go("#/seance"); } }),
          state.active && h("p", { class: "caption", style: { margin: 0, textAlign: "center" } },
            `Une séance est déjà en cours (${state.active?.name}). Termine-la ou reprends-la d'abord.`)
        ]));
  return { el, tab: "seances" };
}

export function itemView({ id, item }) {
  const t = template(id);
  const it = t?.items.find(x => x.id === item);
  if (!it) { setTimeout(() => go(`#/seances/${id}`)); return { el: h("div") }; }
  const ex = exercise(it.exerciseId);
  const last = lastPerformance(it.exerciseId);
  const sug = suggestion(it);
  const done = () => { save(); go(`#/seances/${t.id}`); };
  const set = k => v => { it[k] = v; if (k === "repsMin" && it.repsMax < v) it.repsMax = v; if (k === "repsMax" && it.repsMin > v) it.repsMin = v; save(true); };
  const field = (label, s) => h("div", { class: "field" }, h("span", { class: "caption medium" }, label), s);

  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: t.name, onClick: done }, title: ex.name, subtitle: ex.muscle, action: { label: "OK", onClick: done } }),
    h("div", { class: "scroll" },
      segmented(Object.entries(FORMATS), it.format || "series", v => { setItemFormat(it, v); dispatchEvent(new HashChangeEvent("hashchange")); }),
      h("p", { class: "caption", style: { margin: 0 } },
        it.format === "emom" ? "Un round au début de chaque intervalle, le reste de l'intervalle sert de repos. Compte 1 série par tranche de 3 rounds dans l'objectif Fluide."
        : it.format === "tabata" ? "Effort puis repos, round après round, au chrono. 8 rounds comptent 2 séries dans l'objectif Fluide."
        : "Séries classiques : la charge monte quand le haut de la fourchette est atteint partout."),
      it.format !== "emom" && it.format !== "tabata" && last && h("div", { class: "hint" }, icon("trend"),
        h("span", { class: "body-sm" }, "La dernière fois ", h("b", { class: "fort medium num" }, last.sets.map(s => `${s.reps}×${num(s.weight)}`).join(" · ")), ` (${ago(last.date)}). `,
          sug.hint === "charge" ? `Haut de fourchette atteint : vise ${kg(sug.weight)}.` : `Vise ${sug.reps} reps à ${kg(sug.weight)}.`)),
      it.format === "emom" ? h("div", { class: "card" },
          field("Rounds", stepper({ value: it.rounds, min: 2, max: 60, unit: "rounds", label: "rounds", onChange: set("rounds") })),
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
            field("Toutes les", stepper({ value: it.every, step: 15, min: 30, max: 300, format: clock, compact: true, label: "intervalle", onChange: set("every") })),
            field("Reps par round", stepper({ value: it.repsMin, min: 1, max: 50, compact: true, label: "reps par round", onChange: v => { it.repsMin = it.repsMax = v; save(true); } }))),
          field("Charge", stepper({ value: it.weight, step: 2.5, max: 500, format: num, unit: "kg · 0 = poids du corps", editable: true, label: "charge", onChange: set("weight") })))
      : it.format === "tabata" ? h("div", { class: "card" },
          field("Rounds", stepper({ value: it.rounds, min: 2, max: 30, unit: "rounds", label: "rounds", onChange: set("rounds") })),
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
            field("Effort", stepper({ value: it.work, step: 5, min: 10, max: 120, format: clock, compact: true, label: "effort", onChange: set("work") })),
            field("Repos", stepper({ value: it.off, step: 5, min: 5, max: 120, format: clock, compact: true, label: "repos", onChange: set("off") }))),
          field("Charge", stepper({ value: it.weight, step: 2.5, max: 500, format: num, unit: "kg · 0 = poids du corps", editable: true, label: "charge", onChange: set("weight") })))
      : h("div", { class: "card" },
          field("Séries", stepper({ value: it.sets, min: 1, max: 10, label: "séries", onChange: set("sets") })),
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
            field("Reps min", stepper({ value: it.repsMin, min: 1, max: 50, compact: true, label: "reps min", onChange: set("repsMin") })),
            field("Reps max", stepper({ value: it.repsMax, min: 1, max: 50, compact: true, label: "reps max", onChange: set("repsMax") }))),
          field("Charge de départ", stepper({ value: it.weight, step: 2.5, max: 500, format: num, unit: "kg · 0 = poids du corps", editable: true, label: "charge", onChange: set("weight") })),
          field("Repos", stepper({ value: it.rest, step: 15, min: 15, max: 600, format: clock, compact: true, label: "repos", onChange: set("rest") }))),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Ton avis sur l'exercice")),
      segmented(Object.entries(PREFS), ex.pref, v => { setPref(ex.id, v); }, "sm"),
      ex.pref === "douleur" && h("div", { class: "hint attention" }, icon("warning"),
        h("span", { class: "body-sm" }, "Ne pousse pas dans la douleur articulaire : remplace-le par un exercice du même muscle (autre angle, machine guidée, amplitude réduite). Si ça persiste, demande un avis pro.")),
      btn("Retirer de la séance", { variant: "danger", full: true, onClick: () => { removeItem(t.id, it.id); go(`#/seances/${t.id}`); } })));
  return { el };
}

export function pickerView({ id }) {
  const t = template(id);
  if (!t) { setTimeout(() => go("#/seances")); return { el: h("div") }; }
  const list = h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } });
  const results = h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } });
  const add = exId => { const it = addItem(t.id, exId); toast(`${exercise(exId).name} ajouté`); go(`#/seances/${t.id}/${it.id}`); };

  const draw = q => {
    q = q.trim();
    const exact = state.exercises.some(e => e.name.toLowerCase() === q.toLowerCase());
    catalogue(results, q, { onPick: e => add(e.id), note: e => [e.muscle, t.items.some(i => i.exerciseId === e.id) && "déjà dans la séance"].filter(Boolean).join(" · ") });
    list.replaceChildren(
      q && !exact && btn(`Créer « ${q} »`, { variant: "secondary", full: true, icon: "plus", onClick: () => {
        let muscle = MUSCLES[0];
        sheet({ title: "Quel muscle ?", okLabel: "Créer l'exercice",
          body: h("div", { class: "chips" }, MUSCLES.map(m => h("button", { class: "chip", "aria-pressed": String(m === muscle),
            onClick: e => { muscle = m; e.target.parentNode.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c === e.target))); } }, m))),
          ok: () => { const name = q[0].toUpperCase() + q.slice(1); setTimeout(() => add(createExercise(name, muscle).id)); } });
      } }),
      results);
  };

  const search = h("input", { class: "input", type: "search", placeholder: "Chercher ou créer un exercice", "aria-label": "Chercher un exercice", onInput: e => draw(e.target.value) });
  draw("");
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: t.name, href: `#/seances/${t.id}` }, title: "Ajouter un exercice", subtitle: "Favoris en premier" }),
    h("div", { class: "scroll" }, search, list));
  return { el };
}

// Choisir un programme : un split génère les séances types, réglées sur les réglages Fluide.
let chosen = null, preview = null;

export function programView() {
  if (!chosen) { chosen = state.profile.split || "hautbas"; preview = null; }
  if (!preview && chosen !== "perso") preview = generateProgram(chosen);
  const split = SPLITS[chosen];
  const pick = k => { chosen = k; preview = k === "perso" ? [] : generateProgram(k); dispatchEvent(new HashChangeEvent("hashchange")); };
  const leave = () => { chosen = null; preview = null; go("#/seances"); };
  const use = () => {
    if (chosen === "perso") { state.profile.split = "perso"; save(); leave(); return; }
    const apply = () => { const label = split.label; applyProgram(chosen, preview); leave(); toast(`Programme ${label} en place`); };
    if (!state.templates.length) return apply();
    confirmSheet({
      title: `Remplacer tes ${state.templates.length} séances ?`,
      message: `Tes séances types deviennent celles de « ${split.label} ». L'historique, les courbes et l'objectif de la semaine restent.`,
      confirmLabel: "Remplacer mes séances", cancelLabel: "Garder mes séances", onConfirm: apply
    });
  };
  const cards = h("div", { class: "radio-cards", role: "radiogroup", "aria-label": "Programme" },
    Object.entries(SPLITS).map(([k, sp]) => h("button", { type: "button", class: "radio-card", role: "radio", "aria-checked": String(k === chosen), onClick: () => pick(k) },
      h("span", { class: "radio-dot", "aria-hidden": "true" }),
      h("span", { class: "radio-text" },
        h("span", { class: "body-md fort semibold" }, sp.label, sp.days ? h("span", { class: "caption" }, ` · ${sp.days} séances / semaine`) : null),
        h("span", { class: "caption" }, sp.desc)))));
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Séances", onClick: leave }, title: "Programme", subtitle: "Réglé sur Fluide" }),
    h("div", { class: "scroll" },
      h("p", { class: "caption", style: { margin: 0 } }, "Le programme crée tes séances types : les séries de chaque muscle visent sa cible (maintenir, progresser, point faible), tes favoris passent en premier, jamais un exercice en douleur."),
      cards,
      chosen !== "perso" && [
        h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Aperçu"), h("span", { class: "caption" }, `${preview.length} séances`)),
        preview.map(t => h("div", { class: "card" },
          h("div", { class: "card-head" }, h("span", { class: "heading-md" }, t.name), h("span", { class: "caption num" }, `~${estimate(t)} min`)),
          estimate(t) > 75 && h("div", { class: "hint attention" }, icon("warning"), h("span", { class: "body-sm" }, "Séance longue : passe à un split avec plus de séances, ou baisse une cible dans tes réglages Fluide.")),
          h("div", { class: "list" }, t.items.map(it => h("div", { class: "row" },
            h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, exercise(it.exerciseId).name), h("span", { class: "caption num" }, itemLine(it))),
            prefPill(exercise(it.exerciseId).pref)))))),
        h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Séries par semaine")),
        h("div", { class: "card" }, h("p", { class: "caption", style: { margin: 0 } }, "Si tu fais chaque séance une fois. Le trait blanc est la cible de tes réglages Fluide."), volumeBars(plannedSetsOf(preview)))
      ],
      btn(chosen === "perso" ? "Créer mes séances moi-même" : "Utiliser ce programme", { variant: "primary", size: "lg", full: true, onClick: use })));
  return { el };
}

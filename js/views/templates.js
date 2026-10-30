import { state, save, template, exercise, createTemplate, deleteTemplate, addItem, moveItem, removeItem, createExercise, setEquip, weightScale, lbs, EQUIPS, setPref, toggleFav, setItemFormat, itemSets, applyProgram, plannedSetsOf, recommend, weekPlan, SPLITS, ENDURANCE, SESSION_MINUTES, suggestion, lastPerformance, plannedSets, startWorkout, history, byUsefulness, exercisePhotos, exerciseGif, hasMovement, MUSCLES, GROUPS, PREFS, FORMATS, STATUS, setMatrix, startOfWeek, blocksLabel, enduranceWeek, setEnduranceWeek } from "../store.js";
import { h, icon, pageHead, navbar, btn, pill, go, kg, clock, reps, ago, stepper, radios, sheet, confirmSheet, toast, num } from "../ui.js";
import { estimate, volumeBars } from "./today.js";

export const prefPill = pref =>
  pref === "aime" ? pill("Favori", "accent") : pref === "evite" ? pill("Je n'aime pas") : pref === "douleur" ? pill("Douleur", "danger") : null;

export const itemLine = it =>
  it.format === "emom" ? `EMOM ${it.rounds} × ${clock(it.every)} · ${it.repsMin} reps · ${kg(it.weight)}`
  : it.format === "tabata" ? `Tabata ${it.rounds} × ${it.work} s / ${it.off} s · ${kg(it.weight)}`
  : `${it.sets} × ${reps(it.repsMin, it.repsMax)} · ${kg(it.weight)} · repos ${clock(it.rest)}`;

// Catalogue partagé (ajout à une séance, hors programme, machine prise) : plus de 1000 exercices,
// filtrés par muscle et par matériel. Sans recherche ni filtre, chaque muscle montre ses 5 plus utiles.
// Le premier dessin d'un écran passe muscle (null pour tout voir) pour repartir des filtres à zéro.
const filter = { muscle: null, equip: null };
export function catalogue(list, query, { onPick, note, pickIcon = "plus", muscle }) {
  if (muscle !== undefined) Object.assign(filter, { muscle, equip: null }); // ouverture : muscle imposé (ou aucun), matériel libre
  const q = query.trim().toLowerCase();
  const match = e => (!q || e.name.toLowerCase().includes(q)) && (!filter.muscle || e.muscle === filter.muscle) && (!filter.equip || e.equip === filter.equip);
  const short = !q && !filter.muscle;
  const favs = state.exercises.filter(e => e.pref === "aime" && match(e)).sort((a, b) => a.name.localeCompare(b.name));
  const groups = GROUPS.map(m => [m, state.exercises.filter(e => e.muscle === m && e.pref !== "aime" && match(e)).sort(byUsefulness)])
    .filter(([, xs]) => xs.length);
  const redraw = () => catalogue(list, query, { onPick, note, pickIcon });
  const chipRow = (options, key) => h("div", { class: "chips scroll-x" }, options.map(([v, label]) =>
    h("button", { type: "button", class: "chip", "aria-pressed": String(filter[key] === v), onClick: () => { filter[key] = filter[key] === v ? null : v; redraw(); } }, label)));
  const row = e => h("div", { class: "row pick", style: e.pref === "douleur" ? { opacity: .6 } : null },
    h("button", { class: "row-btn", onClick: () => onPick(e) },
      h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, e.name), h("span", { class: "caption num" }, [EQUIPS[e.equip], note(e)].filter(Boolean).join(" · "))),
      e.pref !== "aime" && prefPill(e.pref), icon(pickIcon, "chev")),
    e.pref !== "douleur" && h("button", { class: "star", "aria-pressed": String(e.pref === "aime"), "aria-label": e.pref === "aime" ? `Retirer ${e.name} des favoris` : `Mettre ${e.name} en favori`,
      onClick: () => { toggleFav(e.id); redraw(); } }, icon("star")));
  const block = (title, xs, m) => h("div", null, h("div", { class: "overline", style: { margin: "0 0 8px" } }, short && m ? `${title} · ${xs.length}` : title),
    h("div", { class: "list" }, (short && m ? xs.slice(0, 5) : xs.slice(0, 150)).map(row)),
    short && m && xs.length > 5 && btn(`Voir les ${xs.length} exercices`, { variant: "ghost", full: true, onClick: () => { filter.muscle = m; redraw(); } }));
  list.replaceChildren(
    chipRow(GROUPS.map(m => [m, m]), "muscle"),
    chipRow(Object.entries(EQUIPS), "equip"),
    ...[favs.length && block("★ Favoris", favs), ...groups.map(([m, xs]) => block(m, xs, m))].filter(Boolean));
  if (!favs.length && !groups.length) list.append(h("p", { class: "body-sm discret", style: { margin: 0 } }, "Aucun exercice ne correspond."));
}

// Mouvement d'un exercice dans une feuille : animation 3D si on en a une, sinon les deux photos (départ, arrivée) en fondu.
export function movementSheet(e) {
  const gif = exerciseGif(e);
  const body = gif
    ? h("div", { class: "movement gif", role: "img", "aria-label": `${e.name} : animation du mouvement` }, h("img", { src: gif, alt: "", decoding: "async" }))
    : (([start, end]) => h("div", { class: "movement", role: "img", "aria-label": `${e.name} : position de départ puis d'arrivée` },
        h("img", { src: start, alt: "", decoding: "async" }), h("img", { src: end, alt: "", decoding: "async" })))(exercisePhotos(e));
  sheet({ title: e.name, body });
}

// Nom d'exercice : quand des photos existent, il ouvre le mouvement sans quitter l'app.
export const exerciseTitle = (e, attrs = {}) => hasMovement(e)
  ? h("button", { ...attrs, type: "button", class: `${attrs.class || ""} ex-link`, "aria-label": `${e.name}, voir le mouvement`, onClick: () => movementSheet(e) }, e.name, icon("play"))
  : h("span", attrs, e.name);

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
          h("div", null, h("div", { class: "overline" }, "Programme"), h("div", { class: "display-xs" }, SPLITS[state.profile.split || "perso"].label),
            state.profile.minutes != null && h("div", { class: "caption num", style: { marginTop: "4px" } }, weekLine(state.profile))),
          h("span", { class: "btn ghost sm" }, "Changer"))),
      n ? state.templates.map(t => {
        const last = history().find(s => s.templateId === t.id);
        const muscles = [...new Set(t.items.map(i => exercise(i.exerciseId)?.muscle))].join(" · ");
        return h("button", { class: "card tap", onClick: () => go(`#/seances/${t.id}`) },
          h("div", { class: "card-head" }, h("span", { class: "display-xs" }, t.name), icon("caretRight", "chev discret")),
          h("span", { class: "body-sm num" }, `${t.items.length} exercice${t.items.length > 1 ? "s" : ""} · ${t.items.reduce((a, i) => a + itemSets(i), 0)} séries · ~${estimate(t)} min`),
          h("span", { class: "caption" }, muscles || "Aucun exercice", last ? ` — faite ${ago(last.startedAt)}` : muscles ? " — jamais faite" : ""));
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
  const weight = label => field(label, stepper({ value: it.weight, values: weightScale(ex.equip), max: 500, format: num, editable: true, label: "charge",
    unit: v => [ex.equip === "halteres" ? "kg par haltère" : "kg", lbs(ex.equip, v), "0 = poids du corps"].filter(Boolean).join(" · "), onChange: set("weight") }));

  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: t.name, onClick: done }, title: ex.name, subtitle: ex.muscle, action: { label: "OK", onClick: done } }),
    h("div", { class: "scroll" },
      radios([
        ["series", FORMATS.series, "La charge monte quand le haut de la fourchette est atteint partout."],
        ["emom", FORMATS.emom, "Un round au début de chaque intervalle, le reste sert de repos. 3 rounds comptent 1 série."],
        ["tabata", FORMATS.tabata, "Effort puis repos au chrono. 8 rounds comptent 2 séries."]
      ], it.format || "series", v => { setItemFormat(it, v); dispatchEvent(new HashChangeEvent("hashchange")); }, "Format"),
      it.format !== "emom" && it.format !== "tabata" && last && h("div", { class: "hint" }, icon("trend"),
        h("span", { class: "body-sm" }, "La dernière fois ", h("b", { class: "fort medium num" }, last.sets.map(s => `${s.reps}×${num(s.weight)}`).join(" · ")), ` (${ago(last.date)}). `,
          sug.hint === "charge" ? `Haut de fourchette atteint : vise ${kg(sug.weight)}.` : `Vise ${sug.reps} reps à ${kg(sug.weight)}.`)),
      it.format === "emom" ? h("div", { class: "card" },
          field("Rounds", stepper({ value: it.rounds, min: 2, max: 60, unit: "rounds", label: "rounds", onChange: set("rounds") })),
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
            field("Toutes les", stepper({ value: it.every, step: 15, min: 30, max: 300, format: clock, compact: true, label: "intervalle", onChange: set("every") })),
            field("Reps par round", stepper({ value: it.repsMin, min: 1, max: 50, compact: true, label: "reps par round", onChange: v => { it.repsMin = it.repsMax = v; save(true); } }))),
          weight("Charge"))
      : it.format === "tabata" ? h("div", { class: "card" },
          field("Rounds", stepper({ value: it.rounds, min: 2, max: 30, unit: "rounds", label: "rounds", onChange: set("rounds") })),
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
            field("Effort", stepper({ value: it.work, step: 5, min: 10, max: 120, format: clock, compact: true, label: "effort", onChange: set("work") })),
            field("Repos", stepper({ value: it.off, step: 5, min: 5, max: 120, format: clock, compact: true, label: "repos", onChange: set("off") }))),
          weight("Charge"))
      : h("div", { class: "card" },
          field("Séries", stepper({ value: it.sets, min: 1, max: 10, label: "séries", onChange: set("sets") })),
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
            field("Reps min", stepper({ value: it.repsMin, min: 1, max: 50, compact: true, label: "reps min", onChange: set("repsMin") })),
            field("Reps max", stepper({ value: it.repsMax, min: 1, max: 50, compact: true, label: "reps max", onChange: set("repsMax") }))),
          weight("Charge de départ"),
          field("Repos", stepper({ value: it.rest, step: 15, min: 15, max: 600, format: clock, compact: true, label: "repos", onChange: set("rest") }))),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Matériel")),
      h("div", { class: "chips" }, Object.entries(EQUIPS).map(([k, l]) => h("button", { type: "button", class: "chip", "aria-pressed": String(k === ex.equip),
        onClick: () => { setEquip(ex.id, k); dispatchEvent(new HashChangeEvent("hashchange")); } }, l))),
      hasMovement(ex) && btn("Voir le mouvement", { variant: "secondary", full: true, icon: "play", onClick: () => movementSheet(ex) }),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Ton avis sur l'exercice")),
      radios(Object.entries(PREFS), ex.pref, v => { setPref(ex.id, v); }, "Ton avis sur l'exercice"),
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

  let first = true;
  const draw = q => {
    q = q.trim();
    const exact = state.exercises.some(e => e.name.toLowerCase() === q.toLowerCase());
    catalogue(results, q, { muscle: first ? null : undefined, onPick: e => add(e.id), note: e => [t.items.some(i => i.exerciseId === e.id) && "déjà dans la séance"].filter(Boolean).join(" · ") });
    list.replaceChildren(
      q && !exact && btn(`Créer « ${q} »`, { variant: "secondary", full: true, icon: "plus", onClick: () => {
        let muscle = filter.muscle && MUSCLES.includes(filter.muscle) ? filter.muscle : MUSCLES[0], equip = filter.equip || "barre";
        const pick = (options, value, onPick) => h("div", { class: "chips" }, options.map(([k, l]) => h("button", { class: "chip", type: "button", "aria-pressed": String(k === value),
          onClick: e => { onPick(k); e.target.parentNode.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c === e.target))); } }, l)));
        sheet({ title: "Quel muscle ?", okLabel: "Créer l'exercice",
          body: [pick(MUSCLES.map(m => [m, m]), muscle, m => { muscle = m; }),
            h("span", { class: "overline" }, "Matériel"),
            pick(Object.entries(EQUIPS), equip, k => { equip = k; })],
          ok: () => { const name = q[0].toUpperCase() + q.slice(1); setTimeout(() => add(createExercise(name, muscle, equip).id)); } });
      } }),
      results);
    first = false;
  };

  const search = h("input", { class: "input", type: "search", placeholder: "Chercher ou créer un exercice", "aria-label": "Chercher un exercice", onInput: e => draw(e.target.value) });
  draw("");
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: t.name, href: `#/seances/${t.id}` }, title: "Ajouter un exercice", subtitle: "Favoris en premier" }),
    h("div", { class: "scroll" }, search, list));
  return { el };
}

// Ta semaine : ce que le programme doit respecter. Une ligne sous le programme sur l'écran Séances.
export const weekLine = p => [`${p.days} séance${p.days > 1 ? "s" : ""}`, `${p.minutes} min`, ENDURANCE[p.endurance]?.short].filter(Boolean).join(" · ");

// Choisir un programme : chaque split est généré pour ta semaine (séances, temps, objectif longue durée),
// le mieux classé est recommandé et sélectionné d'entrée.
let chosen = null, options = null;

// Pourquoi ce programme, en phrases courtes : fréquence, temps, adaptations faites pour ta semaine.
// Une alerte seulement quand le programme ne peut pas s'adapter (pas assez de séances, muscle sous sa fourchette Fluide).
const times = o => (o.freq === o.freqMax ? o.freq : `${o.freq} à ${o.freqMax}`);
const list = xs => xs.length > 1 ? `${xs.slice(0, -1).join(", ")} et ${xs.at(-1)}` : xs[0];
function reasons(o, p, week) {
  const sp = SPLITS[o.key], end = ENDURANCE[p.endurance];
  const mins = o.templates.map(estimate), long = week.find(d => d.endurance === "long");
  const kept = o.short.filter(x => !o.below.includes(x));
  const planned = plannedSetsOf(o.templates);
  const of = st => MUSCLES.filter(m => state.matrix[m].status === st && state.matrix[m].target > 0 && !(end && m === "Mollets"));
  const weak = of("faible"), strong = of("maintien");
  const define = (p.define || []).filter(m => planned[m] > 0);
  return [
    !o.fits && ["warning", `Demande ${sp.days} séances : ${sp.days - p.days > 1 ? `${sp.days - p.days} de plus` : "une de plus"} que ta semaine.`],
    o.freq >= 2 ? ["trend", `Chaque muscle revient ${times(o)} fois par semaine, le rythme visé par Fluide.`]
      : o.freq === 1 ? ["trend", "Chaque muscle ne revient qu'une fois par semaine : moins de fréquence que les autres programmes."]
      : ["warning", "Certains muscles n'ont plus aucune série : le temps ne suffit pas pour tout le corps."],
    ["timer", `Séances de ${Math.min(...mins) === Math.max(...mins) ? Math.max(...mins) : `${Math.min(...mins)} à ${Math.max(...mins)}`} min, sous tes ${p.minutes} min, échauffement compris.`],
    !o.short.length && ["check", "Toute ta cible Fluide tient dans la semaine."],
    kept.length && ["check", `Pour tenir en ${p.minutes} min : ${[...new Set(kept.map(x => x.planned))].sort((a, b) => a - b)
      .map(n => `${list(kept.filter(x => x.planned === n).map(x => x.muscle))} à ${n} séries`).join(", ")}. Tout reste dans les fourchettes Fluide.`],
    o.below.length && ["warning", `${list(o.below.map(x => `${x.muscle} (${x.planned} séries)`))} ${o.below.length > 1 ? "passent" : "passe"} sous ${o.below.length > 1 ? "leur" : "son"} repère Fluide : il faudrait ~${o.need} min par séance, ou une séance de plus.`],
    weak.length && ["check", `Points faibles en priorité : ${list(weak.map(m => `${m} ${planned[m]} séries`))}, coupées en dernier.`],
    define.length && ["check", `${list(define)} à définir : séries de 12 à 20 reps, 1 min de repos.`],
    strong.length && ["check", `${list(strong)} ${strong.length > 1 ? "prennent" : "prend"} vite : ${strong.length > 1 ? "maintenus" : "maintenu"} à ${STATUS.maintien.range.join("-")} séries, le volume va aux autres.`],
    end && ["bolt", `Mollets : ${end.calves.sets} × ${end.calves.reps} montées sur pointes lentes en fin de séance, ${Math.min(end.calves.per, o.templates.length)} fois par semaine : le renfo de ton plan corde. La corde fait le reste.`],
    end && o.upper.length && ["check", `Avec la corde, les jambes travaillent 2 fois par semaine : ${list(o.upper)} ${o.upper.length > 1 ? "se font" : "se fait"} sans jambes.`],
    end && long && ["today", o.legs ? `Jour long de corde le ${long.day.toLowerCase()}, le plus loin possible des séances jambes.` : `Jour long de corde le ${long.day.toLowerCase()}.`]
  ].filter(Boolean);
}

export function programView() {
  const p = state.profile;
  if (p.minutes == null) { setTimeout(() => go("#/seances/programme/semaine")); return { el: h("div") }; }
  if (!options) { options = recommend(p); chosen = options[0].key; }
  const reco = options[0].fits ? options[0].key : null;
  const opt = options.find(o => o.key === chosen);
  const preview = opt?.templates || [];
  const split = SPLITS[chosen];
  const week = weekPlan(preview, p.endurance);
  const pick = k => { chosen = k; dispatchEvent(new HashChangeEvent("hashchange")); };
  const leave = () => { chosen = null; options = null; go("#/seances"); };
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
  const card = (k, meta) => h("button", { type: "button", class: "radio-card", role: "radio", "aria-checked": String(k === chosen), onClick: () => pick(k) },
    h("span", { class: "radio-dot", "aria-hidden": "true" }),
    h("span", { class: "radio-text" },
      h("span", { class: "card-head" }, h("span", { class: "body-md fort semibold" }, SPLITS[k].label), k === reco && pill("Recommandé", "accent")),
      meta && h("span", { class: "caption num" }, meta),
      h("span", { class: "caption" }, SPLITS[k].desc)));
  // Seuls les programmes qui tiennent dans ta semaine sont proposés (à défaut, le moins exigeant).
  const shown = options.some(o => o.fits) ? options.filter(o => o.fits) : options.slice(0, 1);
  const cards = h("div", { class: "radio-cards", role: "radiogroup", "aria-label": "Programme" },
    shown.map(o => card(o.key, o.fits
      ? `${SPLITS[o.key].days} séances · ${o.freq ? `chaque muscle ${times(o)} fois` : "des muscles sautent"} · ${o.coverage} % de la cible`
      : `Demande ${SPLITS[o.key].days} séances, tu en as ${p.days}`)),
    card("perso", null));
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Séances", onClick: leave }, title: "Programme", subtitle: "Réglé sur ta semaine" }),
    h("div", { class: "scroll" },
      h("button", { class: "card tap", onClick: () => go("#/seances/programme/semaine") },
        h("div", { class: "card-head" },
          h("div", null, h("div", { class: "overline" }, "Ta semaine"), h("div", { class: "body-md fort medium num" }, weekLine(p))),
          h("span", { class: "btn ghost sm" }, "Modifier"))),
      h("p", { class: "caption", style: { margin: 0 } }, "Le programme crée tes séances types : les séries de chaque muscle visent sa cible (maintenir, progresser, point faible), tes favoris passent en premier, jamais un exercice en douleur."),
      cards,
      chosen !== "perso" && [
        h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, chosen === reco ? "Pourquoi ce programme" : "Ce que ça donne")),
        h("div", { class: "card" }, reasons(opt, p, week).map(([ic, text]) =>
          h("div", { class: `hint${ic === "warning" ? " attention" : ""}` }, icon(ic), h("span", { class: "body-sm" }, text)))),
        h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Ta semaine type")),
        h("div", { class: "list" }, week.map(d => h("div", { class: "row" },
          h("div", { class: "row-main" },
            h("span", { class: "body-md fort medium" }, d.day),
            h("span", { class: "caption" }, [d.session || "Pas de muscu",
              d.endurance === "facile" && (d.session ? "corde facile en échauffement" : "corde facile"),
              d.endurance === "recup" && (d.session ? "corde récup en échauffement" : "corde récup")].filter(Boolean).join(" · "))),
          d.endurance === "long" && pill("Corde · jour long", "accent")))),
        h("p", { class: "caption", style: { margin: 0 } }, p.endurance ? `Les séances tournent dans cet ordre. Décale les jours si besoin, en gardant le jour long de corde loin des jambes. Les jours de muscu, la séance corde du jour (facile ou récup) sert d'échauffement.` : "Les séances tournent dans cet ordre. Décale les jours si besoin, en gardant un jour de repos entre deux grosses séances."),
        h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Aperçu"), h("span", { class: "caption" }, `${preview.length} séances`)),
        preview.map(t => h("div", { class: "card" },
          h("div", { class: "card-head" }, h("span", { class: "heading-md" }, t.name), h("span", { class: "caption num" }, `~${estimate(t)} min`)),
          estimate(t) > p.minutes && h("div", { class: "hint attention" }, icon("warning"), h("span", { class: "body-sm" }, `Dépasse tes ${p.minutes} min : passe à un programme avec plus de séances, ou baisse une cible dans tes réglages Fluide.`)),
          h("div", { class: "list" }, t.items.map(it => h("div", { class: "row" },
            h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, exercise(it.exerciseId).name), h("span", { class: "caption num" }, itemLine(it))),
            prefPill(exercise(it.exerciseId).pref)))))),
        h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Séries par semaine")),
        h("div", { class: "card" }, h("p", { class: "caption", style: { margin: 0 } }, "Si tu fais chaque séance une fois. Le trait blanc est la cible de tes réglages Fluide."), volumeBars(plannedSetsOf(preview)))
      ],
      btn(chosen === "perso" ? "Créer mes séances moi-même" : "Utiliser ce programme", { variant: "primary", size: "lg", full: true, onClick: use })));
  return { el };
}

// Points forts (maintien) et points faibles (priorité) : ils écrivent directement les réglages Fluide.
// Retirer un muscle d'une des deux listes le remet en progresser. « À définir » change le format des séries, pas le volume.
const strengthChips = status => h("div", { class: "chips" }, MUSCLES.map(m => h("button", { type: "button", class: "chip", "aria-pressed": String(state.matrix[m].status === status),
  onClick: () => { options = null; setMatrix(m, state.matrix[m].status === status ? "focus" : status); } }, m)));

// Ta semaine : séances de muscu dispo, temps par séance, objectif longue durée, points forts et faibles. Le programme se règle dessus.
export function weekView() {
  const p = state.profile;
  p.minutes ??= 60;
  p.endurance ??= null;
  const done = () => { options = null; save(); go("#/seances/programme"); };
  const set = k => v => { p[k] = v; save(true); };
  const goals = [[null, "Aucun", "Muscu seule : le programme ne regarde que tes réglages Fluide."],
    ...Object.entries(ENDURANCE).map(([k, e]) => [k, e.label, `${e.desc} Le programme garde ton jour long loin des séances jambes et ajoute les montées sur pointes de ton plan.`])];
  const goalCards = h("div", { class: "radio-cards", role: "radiogroup", "aria-label": "Objectif longue durée" },
    goals.map(([k, label, desc]) => h("button", { type: "button", class: "radio-card", role: "radio", "aria-checked": String(k === p.endurance), onClick: () => {
      p.endurance = k;
      if (k && p.enduranceStart == null) p.enduranceStart = startOfWeek(Date.now());
      save();
    } },
      h("span", { class: "radio-dot", "aria-hidden": "true" }),
      h("span", { class: "radio-text" }, h("span", { class: "body-md fort semibold" }, label), h("span", { class: "caption" }, desc)))));
  const field = (label, control, help) => h("div", { class: "field" }, h("span", { class: "caption medium" }, label), control, help && h("p", { class: "caption", style: { margin: 0 } }, help));
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Programme", onClick: done }, title: "Ta semaine", subtitle: "Séances, temps, objectif", action: { label: "OK", onClick: done } }),
    h("div", { class: "scroll" },
      h("div", { class: "card" },
        field("Séances de muscu par semaine", stepper({ value: p.days, min: 2, max: 6, unit: "séances", label: "séances par semaine", onChange: set("days") })),
        field("Temps par séance", stepper({ value: p.minutes, values: SESSION_MINUTES, min: SESSION_MINUTES[0], max: SESSION_MINUTES.at(-1), format: v => `${v} min`, label: "minutes par séance", onChange: set("minutes") }),
          "Échauffement compris. Une séance trop longue perd d'abord du repos, puis des séries sur les muscles à maintenir.")),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Objectif longue durée")),
      h("p", { class: "caption", style: { margin: 0 } }, "Un sport que tu prépares à côté de la muscu. Il compte dans la récupération des jambes."),
      goalCards,
      ENDURANCE[p.endurance]?.weeks && (() => {
        const e = ENDURANCE[p.endurance], line = h("p", { class: "caption num", style: { margin: 0 } });
        const show = w => { const wk = e.weeks[w - 1]; line.textContent = `Faciles ${blocksLabel(wk.easy)} · jour long ${blocksLabel(wk.long)}${wk.deload ? " · deload" : ""}`; };
        show(enduranceWeek());
        return h("div", { class: "card" },
          h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, "Semaine du plan"),
            stepper({ value: enduranceWeek(), min: 1, max: e.weeks.length, compact: true, format: v => `S${v}`, label: "semaine du plan", onChange: v => { setEnduranceWeek(v); show(v); } })),
          line,
          h("p", { class: "caption", style: { margin: 0 } }, "Elle avance chaque lundi. Une semaine trop dure se refait : recule d'une semaine."));
      })(),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Points forts")),
      h("p", { class: "caption", style: { margin: 0 } }, `Les muscles qui prennent vite chez toi. Ils restent en maintien (${STATUS.maintien.range.join("-")} séries) pour laisser le volume aux autres.`),
      strengthChips("maintien"),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Points faibles")),
      h("p", { class: "caption", style: { margin: 0 } }, `Ceux qui suivent moins. Ils passent en priorité (${STATUS.faible.range.join("-")} séries), coupés en dernier si le temps manque.`),
      strengthChips("faible"),
      h("p", { class: "caption", style: { margin: 0 } }, `Les autres progressent (${STATUS.focus.range.join("-")} séries). Le détail muscle par muscle est dans Réglages Fluide.`),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "À définir")),
      h("p", { class: "caption", style: { margin: 0 } }, "Des muscles déjà là que tu veux plus dessinés : séries longues (12-20 reps), repos d'une minute. La définition vient surtout du gras en moins (alimentation, pas, corde) : ici le muscle garde son volume sans grossir."),
      h("div", { class: "chips" }, MUSCLES.map(m => h("button", { type: "button", class: "chip", "aria-pressed": String((p.define || []).includes(m)),
        onClick: () => { options = null; const d = p.define || []; p.define = d.includes(m) ? d.filter(x => x !== m) : [...d, m]; save(); } }, m))),
      btn("Voir ma recommandation", { variant: "primary", size: "lg", full: true, onClick: done })));
  return { el };
}

import { GOALS, goalOf, state, save, template, exercise, isDraft, setDrafts, replaceItemExercise, createTemplate, deleteTemplate, addItem, moveItem, removeItem, groupOf, canLink, toggleLink, createExercise, setEquip, weightScale, inLbs, toLbs, fromLbs, EQUIPS, setPref, toggleFav, setItemFormat, itemSets, applyProgram, plannedSetsOf, recommend, weekPlan, SPLITS, ENDURANCE, SESSION_MINUTES, suggestion, lastPerformance, plannedSets, history, byUsefulness, recentExercises, addItems, GROUP_MAX, exercisePhotos, exerciseGif, hasMovement, MUSCLES, GROUPS, PREFS, FORMATS, STATUS, setMatrix, startOfWeek, blocksLabel, activeProgram, hasWeekPlan, weekdayIndex, WEEKDAYS, enduranceWeek, setEnduranceWeek, startWorkout, parseTemplates, addTemplates } from "../store.js";
import { h, icon, navbar, btn, pill, go, kg, clock, reps, ago, stepper, radios, segmented, sheet, confirmSheet, toast, num } from "../ui.js";
import { estimate, volumeBars } from "./today.js";
import { weekDays } from "./programs.js";

export const prefPill = pref =>
  pref === "aime" ? pill("Favori", "accent") : pref === "evite" ? pill("Je n'aime pas") : pref === "douleur" ? pill("Douleur", "danger") : null;

// Charge dans l'unité du matériel : lbs sur la pile d'une machine ou d'une poulie, kg sinon.
export const charge = (equip, w) => (!w ? "PDC" : inLbs(equip) ? `${toLbs(w)} lbs` : kg(w));
// Version courte pour les lignes « 8×60 · 8×60 ».
export const chargeNum = (equip, w) => (!w ? "PDC" : inLbs(equip) ? toLbs(w) : num(w));
export const setsLine = (equip, sets) => sets.map(s => `${s.reps}×${chargeNum(equip, s.weight)}`).join(" · ");

// Stepper de charge réglé sur le matériel : pile en lbs pour les machines (kg en rappel), haltères à l'unité.
// ex : l'exercice, pour sa pile (pas après un seuil) et sa poulie démultipliée (charge réelle en rappel).
// values : les seules charges possibles, quand le lieu les limite.
export function chargeStepper({ equip, value, note, onChange, ex, values }) {
  const lb = inLbs(equip), ratio = lb ? ex?.ratio || 1 : 1;
  return stepper({ value, values: values || weightScale(equip, ex?.stack), max: 500, editable: true, label: "charge",
    format: lb ? v => String(toLbs(v)) : num, parse: lb ? fromLbs : undefined,
    unit: v => [lb ? "lbs" : equip === "halteres" ? "kg par haltère" : "kg",
      lb && v ? (ratio !== 1 ? `poulie ½ : ${kg(v * ratio)} réels` : kg(v)) : null, note].filter(Boolean).join(" · "), onChange });
}

// chained : exercice d'un superset suivi d'un autre, enchaîné sans repos.
export const itemLine = (it, chained) => {
  const w = charge(exercise(it.exerciseId)?.equip, it.weight);
  return it.format === "emom" ? `EMOM ${it.rounds} × ${clock(it.every)} · ${it.repsMin} reps · ${w}`
    : it.format === "tabata" ? `Tabata ${it.rounds} × ${it.work} s / ${it.off} s · ${w}`
    : `${it.sets} × ${reps(it.repsMin, it.repsMax)} · ${w} · ${chained ? "sans repos" : `repos ${clock(it.rest)}`}`;
};

// Repère d'un exercice groupé : « A1 », « A2 »… une lettre par superset ou triset, dans l'ordre de la séance.
export function groupTag(list, i) {
  const g = groupOf(list, i);
  if (!g) return null;
  let letter = 0;
  for (let k = 0; k < g.members[0]; k++) if (groupOf(list, k)?.members[0] === k) letter++;
  return { ...g, tag: `${String.fromCharCode(65 + letter)}${g.pos + 1}` };
}

// Bouton entre deux lignes du mode Modifier : lier en superset / triset, ou délier.
export const linkRow = (list, i, onToggle) => {
  if (!canLink(list, i)) return null;
  const linked = list[i].group && list[i].group === list[i + 1].group;
  const size = (groupOf(list, i)?.members.length || 1) + (groupOf(list, i + 1)?.members.length || 1);
  return h("div", { class: `link-row${linked ? " on" : ""}` },
    h("button", { type: "button", class: "btn ghost xs", "aria-pressed": String(!!linked), onClick: onToggle }, icon("link"),
      linked ? "Délier" : size >= 3 ? "Lier en triset" : "Lier en superset"));
};

// Catalogue partagé (ajout à une séance, hors programme, machine prise) : plus de 1000 exercices,
// filtrés par muscle et par matériel. Sans recherche ni filtre, chaque muscle montre ses 5 plus utiles.
// Le premier dessin d'un écran passe muscle (null pour tout voir) pour repartir des filtres à zéro.
const filter = { muscle: null, equip: null };

// Recherche tolérante : sans accents ni casse, mots dans n'importe quel ordre, pluriels (« halteres » trouve « Haltère »),
// et le matériel ou le muscle comptent comme des mots du nom (« rowing poulie », « dos barre »).
const fold = s => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const haystacks = new WeakMap();
const haystack = e => {
  let hs = haystacks.get(e);
  if (!hs || hs.name !== e.name) haystacks.set(e, hs = { name: e.name, text: fold(`${e.name} ${EQUIPS[e.equip] || ""} ${e.muscle}`) });
  return hs.text;
};
const STOP = new Set(["de", "du", "des", "a", "au", "aux", "avec", "en", "la", "le", "les", "sur", "un", "une", "et"]);
const terms = q => fold(q).split(/[\s,'’-]+/).filter(w => w && !STOP.has(w)).map(w => w.length > 3 ? w.replace(/[sx]$/, "") : w);
export const searchMatch = (e, q) => { const ws = terms(q); return ws.every(w => haystack(e).includes(w)); };

// only : ce qu'on montre sans recherche (hors de la salle, ce qui se fait sur place) ; la recherche voit tout.
// selected : choix multiple (ajout à une séance type) ; toucher une ligne la coche ou la décoche, onPick prévient l'écran.
export function catalogue(list, query, { onPick, note, pickIcon = "plus", muscle, only, selected }) {
  if (muscle !== undefined) Object.assign(filter, { muscle, equip: null }); // ouverture : muscle imposé (ou aucun), matériel libre
  const q = query.trim();
  const match = e => !e.mix && (!only || q || only(e)) && (!q || searchMatch(e, q)) && (!filter.muscle || e.muscle === filter.muscle) && (!filter.equip || e.equip === filter.equip);
  const short = !q && !filter.muscle;
  const favs = state.exercises.filter(e => e.pref === "aime" && match(e)).sort((a, b) => a.name.localeCompare(b.name));
  const recents = q ? [] : recentExercises().filter(e => e.pref !== "aime" && match(e));
  const groups = GROUPS.map(m => [m, state.exercises.filter(e => e.muscle === m && e.pref !== "aime" && match(e)).sort(byUsefulness)])
    .filter(([, xs]) => xs.length);
  const total = favs.length + groups.reduce((n, [, xs]) => n + xs.length, 0);
  const redraw = () => catalogue(list, query, { onPick, note, pickIcon, only, selected });
  const chipRow = (options, key, label) => h("div", { class: "chips scroll-x", role: "group", "aria-label": label }, options.map(([v, text]) =>
    h("button", { type: "button", class: "chip", "aria-pressed": String(filter[key] === v), onClick: () => { filter[key] = filter[key] === v ? null : v; redraw(); } }, text)));
  const pickState = (b, e) => {
    const on = selected(e);
    b.setAttribute("aria-pressed", String(on));
    b.closest(".row").classList.toggle("on", on);
    b.querySelector(".chev")?.replaceWith(icon(on ? "check" : "plus", "chev"));
  };
  const row = e => {
    const on = selected?.(e);
    const b = h("button", { class: "row-btn", ...(selected ? { "aria-pressed": String(!!on) } : null),
      onClick: ev => { const btnEl = ev.currentTarget; onPick(e); if (selected) pickState(btnEl, e); } },
      h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, e.name), h("span", { class: "caption num" }, [EQUIPS[e.equip], note(e)].filter(Boolean).join(" · "))),
      e.pref !== "aime" && prefPill(e.pref), icon(on ? "check" : pickIcon, "chev"));
    return h("div", { class: `row pick${on ? " on" : ""}`, style: e.pref === "douleur" ? { opacity: .6 } : null }, b,
      e.pref !== "douleur" && h("button", { class: "star", "aria-pressed": String(e.pref === "aime"), "aria-label": e.pref === "aime" ? `Retirer ${e.name} des favoris` : `Mettre ${e.name} en favori`,
        onClick: () => { toggleFav(e.id); redraw(); } }, icon("star")));
  };
  const block = (title, xs, m) => h("div", null, h("div", { class: "overline", style: { margin: "0 0 8px" } }, short && m ? `${title} · ${xs.length}` : title),
    h("div", { class: "list" }, (short && m ? xs.slice(0, 5) : xs.slice(0, 150)).map(row)),
    short && m && xs.length > 5 && btn(`Voir les ${xs.length} exercices`, { variant: "ghost", full: true, onClick: () => { filter.muscle = m; redraw(); } }));
  const reset = (q || filter.muscle || filter.equip) && h("p", { class: "caption num", style: { margin: 0 }, role: "status" },
    total ? `${total} exercice${total > 1 ? "s" : ""}` : "Aucun exercice", (filter.muscle || filter.equip) && [" · ",
      h("button", { type: "button", class: "link-btn", onClick: () => { Object.assign(filter, { muscle: null, equip: null }); redraw(); } }, "Retirer les filtres")]);
  list.replaceChildren(
    chipRow(GROUPS.map(m => [m, m]), "muscle", "Muscle"),
    chipRow(Object.entries(EQUIPS), "equip", "Matériel"),
    ...[reset, favs.length && block("★ Favoris", favs), recents.length && block("Récents", recents), ...groups.map(([m, xs]) => block(m, xs, m))].filter(Boolean));
  if (!total) list.append(h("p", { class: "body-sm discret", style: { margin: 0 } }, q ? "Essaie un autre mot, ou crée l'exercice." : "Change de muscle ou de matériel."));
  return total;
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

// Noms du catalogue écrits « Développé avec Kettlebell à un Bras » : à l'affichage, majuscule au premier mot
// et aux noms propres seulement. Le nom stocké ne change pas (il sert de clé).
const PROPER = new Set(["Smith", "EZ", "Arnold", "TRX", "Scott", "Zottman", "Jefferson", "Pallof", "Larsen", "JM", "Tate", "Spoto", "Pendlay", "Yates", "Kroc", "Meadows", "Seal", "Bulgarian", "Copenhague", "Nordic", "Hack", "Landmine", "Jackson", "Hindu", "Romanian"]);
export const niceName = name => {
  const words = name.split(" ");
  if (words.slice(1).filter(w => /^\p{Lu}\p{Ll}/u.test(w)).length < 2) return name;
  return words.map((w, i) => (i === 0 || PROPER.has(w) || /^\p{Lu}{2,}$/u.test(w) ? w : w.toLowerCase())).join(" ");
};

// Nom d'exercice : quand des photos existent, il ouvre le mouvement sans quitter l'app.
export const exerciseTitle = (e, attrs = {}) => hasMovement(e)
  ? h("button", { ...attrs, type: "button", class: `${attrs.class || ""} ex-link`, "aria-label": `${niceName(e.name)}, voir le mouvement`, onClick: () => movementSheet(e) }, h("span", { class: "ex-name" }, niceName(e.name)), icon("play"))
  : h("span", attrs, niceName(e.name));

export function nameSheet({ title, value = "", okLabel, onOk, placeholder = "Ex. Haut A, Push, Full body" }) {
  const input = h("input", { class: "input", value, placeholder, maxLength: 40, "aria-label": "Nom" });
  sheet({ title, okLabel, body: h("div", { class: "field" }, input),
    ok: () => { const v = input.value.trim(); if (!v) { input.focus(); return false; } onOk(v); } });
  setTimeout(() => input.focus(), 50);
}

export function templatesView() {
  editing = null;
  const n = state.templates.length, prog = activeProgram(), planned = hasWeekPlan(prog);
  const others = state.programs.length - 1;
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "Programme", subtitle: `${n} séance${n > 1 ? "s" : ""} type${n > 1 ? "s" : ""} · ${planned ? "Fluide suit ta semaine type" : "Fluide prend chaque jour la moins récente"}`,
      action: { label: "Nouvelle", onClick: () => nameSheet({ title: "Nouvelle séance", okLabel: "Créer la séance",
        onOk: v => { const t = createTemplate(v); setTimeout(() => go(`#/seances/${t.id}`)); } }) } }),
    h("div", { class: "scroll" },
      h("button", { class: "card tap violet", onClick: () => go("#/seances/programmes"), "aria-label": `Programme en cours : ${prog.name}. Mes programmes` },
        h("div", { class: "card-head" },
          h("div", { style: { minWidth: 0 } }, h("div", { class: "overline" }, "Programme en cours"), h("div", { class: "display-xs violet" }, prog.name),
            h("div", { class: "caption num", style: { marginTop: "4px" } }, [prog.split && prog.split !== "perso" && SPLITS[prog.split]?.label !== prog.name && SPLITS[prog.split]?.label,
              prog.split && prog.split !== "perso" && state.profile.minutes != null && weekLine(state.profile), prog.sharedBy && `partagé par ${prog.sharedBy}`].filter(Boolean).join(" · ") || "Tes séances types")),
          h("span", { class: "btn secondary sm" }, others > 0 ? `Mes programmes · ${others + 1}` : "Mes programmes"))),
      n > 0 && h("button", { class: "card tap", onClick: () => go("#/seances/semaine-type") },
        h("div", { class: "card-head" }, h("div", null, h("div", { class: "overline" }, "Semaine type"),
          h("div", { class: "body-md fort medium" }, planned ? weekDays(prog) : "Pas encore planifiée")), icon("calendar", "chev discret")),
        h("div", { class: "week-strip", "aria-hidden": "true" }, prog.week.map((id, d) => {
          const t = id && state.templates.find(x => x.id === id);
          return h("span", { class: `${t ? "on" : ""}${d === weekdayIndex() ? " today" : ""}` }, h("b", null, WEEKDAYS[d][0]), h("small", null, t ? t.name : "—"));
        }))),
      n ? state.templates.map(t => {
        const last = history().find(s => s.templateId === t.id);
        const muscles = [...new Set(t.items.map(i => exercise(i.exerciseId)?.muscle))].join(" · ");
        return h("button", { class: "card tap", onClick: () => go(`#/seances/${t.id}`) },
          h("div", { class: "card-head" }, h("span", { class: "display-xs" }, t.name), icon("caretRight", "chev discret")),
          h("span", { class: "body-sm num" }, `${t.items.length} exercice${t.items.length > 1 ? "s" : ""} · ${t.items.reduce((a, i) => a + itemSets(i), 0)} séries · ~${estimate(t)} min`),
          h("span", { class: "caption" }, muscles || "Aucun exercice", last ? ` — faite ${ago(last.startedAt)}` : muscles ? " — jamais faite" : ""));
      }) : h("div", { class: "empty" },
        h("p", { class: "body-md fort medium", style: { margin: 0 } }, "Aucune séance type"),
        h("p", { class: "body-sm discret", style: { margin: 0 } }, "Choisis un programme (full body, haut / bas, push / pull / legs…) ou crée tes séances toi-même."),
        btn("Choisir un programme", { variant: "primary", size: "lg", full: true, onClick: () => go("#/seances/programme") })),
      btn("Coller des séances du coach", { variant: "secondary", size: "lg", full: true, icon: "clipboard", onClick: () => go("#/seances/coller") }),
      n > 0 && h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Volume prévu par semaine")),
      n > 0 && h("div", { class: "card rose" },
        h("p", { class: "caption", style: { margin: 0 } }, "Si tu fais chaque séance une fois. Le trait blanc est la cible de chaque muscle : ajuste les séries pour tomber dessus."),
        volumeBars(plannedSets()))));
  return { el, tab: "seances" };
}

// Séances préparées par le coach : on colle le texte, on voit les séances, rien n'est ajouté avant « Ajouter ».
let pasted = null; // { text, templates?, error? }

export function importView() {
  const back = () => { pasted = null; go("#/seances"); };
  const read = text => {
    pasted = { text, ...(text.trim() ? parseTemplates(text) : {}) };
    draw();
  };
  const paste = async () => {
    try { read(await navigator.clipboard.readText()); }
    catch { toast("Accès au presse-papiers refusé : colle le texte dans le champ."); }
  };
  const body = h("div", { class: "scroll" });
  const draw = () => {
    const p = pasted || { text: "" };
    const list = p.templates || [];
    const total = list.length;
    body.replaceChildren(...[
      h("p", { class: "body-sm discret", style: { margin: 0 } }, "Copie le bloc de texte que le coach t'a préparé, puis colle-le ici. Chaque séance rejoint ton programme ; tu peux la modifier ou la supprimer ensuite."),
      btn("Coller", { variant: total ? "secondary" : "primary", size: "lg", full: true, icon: "clipboard", onClick: paste }),
      h("label", { class: "field" }, h("span", { class: "caption medium" }, "Texte du coach"),
        h("textarea", { class: `input${p.error ? " error" : ""}`, placeholder: "{ \"type\": \"fluide-templates\", … }", autocapitalize: "off", "aria-invalid": p.error ? "true" : null,
          onChange: e => read(e.target.value) }, p.text)),
      p.error && h("p", { class: "caption", role: "alert", style: { margin: 0, color: "var(--etat-danger)" } }, p.error),
      ...list.flatMap(t => {
        const sets = t.items.reduce((a, i) => a + itemSets(i), 0);
        return [
          h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, t.name),
            h("span", { class: "caption num" }, `${t.items.length} exercices · ${sets} séries · ~${estimate(t)} min`)),
          h("div", { class: "list" }, t.items.map((it, i) => {
            const g = groupTag(t.items, i);
            return h("div", { class: `row${g ? " grouped" : ""}` },
              h("span", { class: "num-lead", "aria-hidden": "true" }, i + 1),
              h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, niceName(exercise(it.exerciseId).name)),
                h("span", { class: "caption num" }, g ? `${g.label} ${g.tag} · ` : "", itemLine(it, g && !g.last))));
          }))];
      }),
      total > 0 && btn(`Ajouter ${total > 1 ? `les ${total} séances` : "la séance"}`, { variant: "primary", size: "lg", full: true,
        onClick: () => { addTemplates(list); toast(total > 1 ? `${total} séances ajoutées` : "Séance ajoutée"); back(); } })
    ].filter(Boolean));
  };
  draw();
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Programme", onClick: back }, title: "Coller des séances", subtitle: "préparées par le coach" }),
    body);
  return { el };
}

// Mode « Modifier » : nom, ordre des exercices (↑ ↓) et suppression. Hors de ce mode, une ligne s'ouvre au toucher.
let editing = null;

export function templateView({ id }) {
  picking = null;
  const t = template(id);
  if (!t) { setTimeout(() => go("#/seances")); return { el: h("div") }; }
  const edit = editing === t.id;
  // Séance de l'aperçu d'un programme : on revient au programme, pas de démarrage avant de l'avoir validé.
  const draft = isDraft(t.id);
  const home = draft ? "#/seances/programme" : "#/seances";
  const leave = () => { editing = null; go(home); };
  const toggle = () => { editing = edit ? null : t.id; save(); };

  // Une ligne d'exercice. Dans un superset, le numéro devient son repère (A1, A2) et le repos passe dans l'en-tête du bloc.
  const rowFor = (it, i, g) => {
    const ex = exercise(it.exerciseId);
    const line = g ? `${it.sets} × ${reps(it.repsMin, it.repsMax)} · ${charge(ex.equip, it.weight)}` : itemLine(it, false);
    const main = [h("span", { class: "num-lead", "aria-hidden": "true" }, g ? g.tag : i + 1), h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, niceName(ex.name)),
      h("span", { class: "caption num" }, line)), prefPill(ex.pref)];
    return edit
      ? h("div", { class: "row" }, ...main,
          h("div", { class: "reorder" },
            h("button", { class: "btn secondary square", "aria-label": `Monter ${ex.name}`, disabled: i === 0, onClick: () => moveItem(t.id, it.id, -1) }, icon("up")),
            h("button", { class: "btn secondary square", "aria-label": `Descendre ${ex.name}`, disabled: i === t.items.length - 1, onClick: () => moveItem(t.id, it.id, 1) }, icon("down"))))
      : h("button", { class: "row", onClick: () => go(`#/seances/${t.id}/${it.id}`) }, ...main, icon("caretRight", "chev"));
  };
  // Superset ou triset : un seul bloc, en-tête (lettre, tours, repos après le tour), exercices reliés par un trait, « Délier » entre eux.
  const supersetBlock = g => {
    const first = groupTag(t.items, g.members[0]), letter = first.tag[0], last = t.items[g.members.at(-1)];
    const tours = Math.max(...g.members.map(k => t.items[k].sets || 0));
    return h("div", { class: "superset", role: "group", "aria-label": `${g.label} ${letter}` },
      h("div", { class: "superset-head" },
        h("span", { class: "superset-letter", "aria-hidden": "true" }, letter),
        h("div", { class: "row-main" },
          h("span", { class: "superset-title" }, `${g.label} · ${tours} tour${tours > 1 ? "s" : ""}`),
          h("span", { class: "caption num" }, `Sans repos entre eux · repos ${clock(last.rest)} après le tour`))),
      ...g.members.flatMap((k, j) => [rowFor(t.items[k], k, groupTag(t.items, k)),
        j < g.members.length - 1 && h("div", { class: "superset-join" },
          h("button", { type: "button", class: "btn ghost xs", "aria-label": `Délier ${exercise(t.items[k].exerciseId).name} et ${exercise(t.items[k + 1].exerciseId).name}`,
            onClick: () => toggleLink(t.items, k) }, icon("link"), "Délier"))]));
  };
  const rows = [];
  for (let i = 0; i < t.items.length;) {
    const g = groupOf(t.items, i);
    const end = g ? g.members.at(-1) : i;
    rows.push(g ? supersetBlock(g) : rowFor(t.items[i], i, null), linkRow(t.items, end, () => toggleLink(t.items, end)));
    i = end + 1;
  }
  const list = t.items.length ? h("div", { class: "list" }, rows)
    : h("div", { class: "empty" }, icon("barbell"), h("h2", { class: "display-xs" }, "Aucun exercice"),
        h("p", { class: "body-sm discret", style: { margin: 0 } }, "Commence par un ou deux polyarticulaires lourds, puis l'isolation."));

  const el = h("div", { class: "screen" },
    navbar({ back: { label: draft ? "Programme recommandé" : "Programme", onClick: leave }, title: t.name, subtitle: `${t.items.length} exercice${t.items.length > 1 ? "s" : ""} · ~${estimate(t)} min${draft ? " · aperçu" : ""}`,
      action: { label: edit ? "OK" : "Modifier", onClick: toggle } }),
    h("div", { class: "scroll" }, edit
      ? [
          h("label", { class: "field" }, h("span", { class: "caption medium" }, "Nom de la séance"),
            h("input", { class: "input", value: t.name, maxLength: 40, onChange: e => { const v = e.target.value.trim(); if (v) { t.name = v; save(); } else e.target.value = t.name; } })),
          h("p", { class: "caption", style: { margin: 0 } }, "Les flèches changent l'ordre dans la séance : les polyarticulaires lourds d'abord. Deux exercices liés s'enchaînent sans repos."),
          list,
          btn(draft ? "Retirer du programme" : "Supprimer la séance type", { variant: "danger", full: true, onClick: () => confirmSheet({
            title: draft ? "Retirer la séance du programme ?" : "Supprimer la séance type ?",
            message: draft ? `« ${t.name} » ne sera pas créée quand tu utiliseras ce programme.` : `« ${t.name} » disparaît de tes séances. Les séances déjà faites restent dans l'historique et les courbes.`,
            confirmLabel: draft ? "Retirer la séance" : "Supprimer la séance type", cancelLabel: "Garder la séance", destructive: true,
            onConfirm: () => { editing = null; deleteTemplate(t.id); go(home); }
          }) })
        ]
      : [
          t.items.length > 1 && !t.items.some(x => x.group) && h("p", { class: "caption", style: { margin: 0 } },
            "« Lier » enchaîne deux ou trois exercices en superset ou triset : sans repos entre eux, le repos du dernier après le tour."),
          list,
          btn("Ajouter des exercices", { variant: "secondary", size: "lg", full: true, icon: "plus", onClick: () => go(`#/seances/${t.id}/ajouter`) }),
          draft
            ? btn("Revenir au programme", { variant: "primary", size: "lg", full: true, onClick: leave })
            : btn(`Démarrer ${t.name}`, { variant: "primary", size: "lg", full: true, disabled: !t.items.length || !!state.active,
                onClick: () => { startWorkout(t.id); go("#/seance"); } }),
          !draft && state.active && h("p", { class: "caption", style: { margin: 0, textAlign: "center" } },
            `Une séance est déjà en cours (${state.active?.name}). Termine-la ou reprends-la d'abord.`)
        ]));
  return { el, tab: "seances" };
}

export function itemView({ id, item }) {
  picking = null;
  const t = template(id);
  const it = t?.items.find(x => x.id === item);
  if (!it) { setTimeout(() => go(`#/seances/${id}`)); return { el: h("div") }; }
  const ex = exercise(it.exerciseId);
  const last = lastPerformance(it.exerciseId);
  const sug = suggestion(it);
  const group = groupOf(t.items, t.items.indexOf(it)), chained = group && !group.last;
  const done = () => { save(); go(`#/seances/${t.id}`); };
  const set = k => v => { it[k] = v; if (k === "repsMin" && it.repsMax < v) it.repsMax = v; if (k === "repsMax" && it.repsMin > v) it.repsMin = v; save(true); };
  const field = (label, s) => h("div", { class: "field" }, h("span", { class: "caption medium" }, label), s);
  const weight = label => h("div", { class: "field charge" }, h("span", { class: "caption medium" }, label), chargeStepper({ equip: ex.equip, ex, value: it.weight, note: "0 = poids du corps", onChange: set("weight") }));

  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: t.name, onClick: done }, title: niceName(ex.name), subtitle: `${ex.muscle} · ${EQUIPS[ex.equip] || ""}`, action: { label: "OK", onClick: done } }),
    h("div", { class: "scroll" },
      h("div", { class: "field" }, h("span", { class: "caption medium" }, "Format"),
        segmented(Object.entries(FORMATS), it.format || "series", v => { setItemFormat(it, v); dispatchEvent(new HashChangeEvent("hashchange")); }),
        h("span", { class: "caption" }, { series: "La charge monte quand le haut de la fourchette est atteint partout.", emom: "Un round au début de chaque intervalle, le reste sert de repos. 3 rounds comptent 1 série.", tabata: "Effort puis repos au chrono. 8 rounds comptent 2 séries." }[it.format || "series"])),
      it.format !== "emom" && it.format !== "tabata" && last && h("div", { class: "hint" }, icon("trend"),
        h("span", { class: "body-sm" }, "La dernière fois ", h("b", { class: "fort medium num" }, setsLine(ex.equip, last.sets)), ` (${ago(last.date)}). `,
          sug.hint === "charge" ? `Haut de fourchette atteint : vise ${charge(ex.equip, sug.weight)}.` : `Vise ${sug.reps} reps à ${charge(ex.equip, sug.weight)}.`)),
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
          chained
            ? h("p", { class: "caption", style: { margin: 0 } }, `${group.label} : enchaîné sans repos avec ${exercise(t.items[t.items.indexOf(it) + 1].exerciseId).name}. Le repos se règle sur le dernier exercice du groupe.`)
            : field(group ? `Repos après le ${group.label.toLowerCase()}` : "Repos", stepper({ value: it.rest, step: 15, min: 15, max: 600, format: clock, compact: true, label: "repos", onChange: set("rest") }))),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Matériel")),
      h("div", { class: "chips" }, Object.entries(EQUIPS).map(([k, l]) => h("button", { type: "button", class: "chip", "aria-pressed": String(k === ex.equip),
        onClick: () => { setEquip(ex.id, k); dispatchEvent(new HashChangeEvent("hashchange")); } }, l))),
      btn("Changer d'exercice", { variant: "secondary", full: true, icon: "swap", onClick: () => go(`#/seances/${t.id}/${it.id}/remplacer`) }),
      hasMovement(ex) && btn("Voir le mouvement", { variant: "secondary", full: true, icon: "play", onClick: () => movementSheet(ex) }),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Ton avis sur l'exercice")),
      radios(Object.entries(PREFS), ex.pref, v => { setPref(ex.id, v); }, "Ton avis sur l'exercice"),
      ex.pref === "douleur" && h("div", { class: "hint attention" }, icon("warning"),
        h("span", { class: "body-sm" }, "Ne pousse pas dans la douleur articulaire : remplace-le par un exercice du même muscle (autre angle, machine guidée, amplitude réduite). Si ça persiste, demande un avis pro.")),
      btn("Retirer de la séance", { variant: "danger", full: true, onClick: () => { removeItem(t.id, it.id); go(`#/seances/${t.id}`); } })));
  return { el };
}

// Ajouter des exercices à une séance type, ou (item donné) remplacer celui d'une ligne : même catalogue, même recherche.
// En ajout, on coche plusieurs exercices puis « Ajouter » ; deux ou trois s'enchaînent en superset ou triset d'un geste.
// Le choix survit aux redessins de l'écran (feuille fermée, exercice créé) ; on l'oublie en partant.
let picking = null;
export function pickerView({ id, item }) {
  const t = template(id);
  if (!t) { setTimeout(() => go("#/seances")); return { el: h("div") }; }
  const replacing = item && t.items.find(x => x.id === item);
  const again = !replacing && picking?.id === t.id;
  if (!again) picking = replacing ? null : { id: t.id, chosen: [], chain: false };
  const list = h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } });
  const results = h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } });
  const chosen = picking?.chosen || [];
  const bar = h("div", { class: "pick-bar", hidden: true });

  const confirm = () => {
    const n = chosen.length;
    const items = addItems(t.id, chosen, { chain: picking.chain });
    picking = null;
    if (n === 1) { toast(`${exercise(chosen[0]).name} ajouté`); go(`#/seances/${t.id}/${items[0].id}`); return; }
    toast(items[0].group ? `${n === 2 ? "Superset" : "Triset"} ajouté` : `${n} exercices ajoutés`);
    go(`#/seances/${t.id}`);
  };
  const drawBar = () => {
    const n = chosen.length, canChain = n >= 2 && n <= GROUP_MAX;
    if (!canChain) picking.chain = false;
    bar.hidden = !n;
    bar.replaceChildren(...[
      h("p", { class: "caption pick-names", role: "status" }, chosen.map(x => niceName(exercise(x).name)).join(" · ")),
      canChain && h("button", { type: "button", class: "chip", "aria-pressed": String(picking.chain), onClick: () => { picking.chain = !picking.chain; drawBar(); } },
        icon("link"), n === 2 ? "Enchaîner en superset" : "Enchaîner en triset"),
      n > GROUP_MAX && h("p", { class: "caption", style: { margin: 0 } }, `Superset ou triset : ${GROUP_MAX} exercices au plus.`),
      btn(n === 1 ? "Ajouter 1 exercice" : `Ajouter ${n} exercices`, { variant: "primary", size: "lg", full: true, onClick: confirm })].filter(Boolean));
  };
  const pick = e => {
    if (replacing) { replaceItemExercise(t.id, replacing.id, e.id); toast(`${e.name} à la place`); go(`#/seances/${t.id}/${replacing.id}`); return; }
    const k = chosen.indexOf(e.id);
    if (k >= 0) chosen.splice(k, 1); else chosen.push(e.id);
    drawBar();
  };
  const add = exId => { chosen.splice(0, chosen.length, exId); picking.chain = false; confirm(); };

  let first = !again;
  const draw = q => {
    q = q.trim();
    const exact = state.exercises.some(e => e.name.toLowerCase() === q.toLowerCase());
    const found = catalogue(results, q, { muscle: first ? (replacing ? exercise(replacing.exerciseId).muscle : null) : undefined, onPick: pick,
      selected: replacing ? undefined : e => chosen.includes(e.id),
      note: e => [t.items.some(i => i.exerciseId === e.id) && "déjà dans la séance"].filter(Boolean).join(" · ") });
    // « Créer » en tête quand rien ne correspond, sinon sous les résultats.
    const create = q && !exact && btn(`Créer « ${q} »`, { variant: "secondary", full: true, icon: "plus", onClick: () => {
        let muscle = filter.muscle && MUSCLES.includes(filter.muscle) ? filter.muscle : MUSCLES[0], equip = filter.equip || "barre";
        const choose = (options, value, onChoose) => h("div", { class: "chips" }, options.map(([k, l]) => h("button", { class: "chip", type: "button", "aria-pressed": String(k === value),
          onClick: e => { onChoose(k); e.target.parentNode.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c === e.target))); } }, l)));
        sheet({ title: "Quel muscle ?", okLabel: "Créer l'exercice",
          body: [choose(MUSCLES.map(m => [m, m]), muscle, m => { muscle = m; }),
            h("span", { class: "overline" }, "Matériel"),
            choose(Object.entries(EQUIPS), equip, k => { equip = k; })],
          ok: () => { const name = q[0].toUpperCase() + q.slice(1); setTimeout(() => {
            const ex = createExercise(name, muscle, equip);
            if (replacing) pick(ex); else if (chosen.length) { chosen.push(ex.id); toast(`${ex.name} créé et coché`); } else add(ex.id);
          }); } });
      } });
    list.replaceChildren(...[!found && create, results, found && create].filter(Boolean));
    first = false;
  };

  const search = h("input", { class: "input", type: "search", placeholder: "Nom, muscle ou matériel", "aria-label": "Chercher un exercice", enterkeyhint: "search", onInput: e => draw(e.target.value) });
  draw("");
  if (!replacing) drawBar();
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: replacing ? { label: "Exercice", href: `#/seances/${t.id}/${replacing.id}` } : { label: t.name, onClick: () => { picking = null; go(`#/seances/${t.id}`); } },
      title: replacing ? "Changer d'exercice" : "Ajouter des exercices", subtitle: replacing ? `À la place de ${exercise(replacing.exerciseId).name}` : "Coche-en un ou plusieurs" }),
    h("div", { class: "search-bar" }, search),
    h("div", { class: "scroll" }, list),
    !replacing && bar);
  return { el };
}

const previewRow = (t, it, i) => {
  const g = groupTag(t.items, i), ex = exercise(it.exerciseId);
  return h("div", { class: `row${g ? " grouped" : ""}` },
    h("span", { class: "num-lead", "aria-hidden": "true" }, i + 1),
    h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, niceName(ex.name)),
      h("span", { class: "caption num" }, g ? `${g.label} ${g.tag} · ` : "", itemLine(it, g && !g.last))),
    prefPill(ex.pref));
};

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
  const goal = k => MUSCLES.filter(m => goalOf(m) === k && planned[m] > 0);
  const force = goal("force"), endu = goal("endurance");
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
    force.length && ["check", `${list(force)} en force : ${GOALS.force.desc.charAt(0).toLowerCase()}${GOALS.force.desc.slice(1, -1)}.`],
    endu.length && ["check", `${list(endu)} en endurance : ${GOALS.endurance.desc.charAt(0).toLowerCase()}${GOALS.endurance.desc.slice(1, -1)}.`],
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
  setDrafts(preview); // les séances de l'aperçu s'ouvrent et se modifient comme des séances types
  const split = SPLITS[chosen];
  const week = weekPlan(preview, p.endurance);
  const pick = k => { chosen = k; dispatchEvent(new HashChangeEvent("hashchange")); };
  const leave = () => { chosen = null; options = null; setDrafts([]); go("#/seances"); };
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
      h("span", { class: "card-head" }, h("span", { class: "body-md fort semibold" }, SPLITS[k].label), k === reco && pill("Recommandé", "tag")),
      meta && h("span", { class: "caption num" }, meta),
      h("span", { class: "caption" }, SPLITS[k].desc)));
  // Seuls les programmes qui tiennent dans ta semaine sont proposés (à défaut, le moins exigeant).
  const shown = options.some(o => o.fits) ? options.filter(o => o.fits) : options.slice(0, 1);
  const cards = h("div", { class: "radio-cards", role: "radiogroup", "aria-label": "Programme" },
    shown.map(o => card(o.key, o.fits
      ? `${SPLITS[o.key].days} séances · ${o.freq ? `chaque muscle ${times(o)} fois` : "des muscles sautent"} · ${o.coverage} % de la cible`
      : `Demande ${SPLITS[o.key].days} séances, tu en as ${p.days}`)),
    card("perso", null));
  const el = h("div", { class: "screen no-tabs violet" },
    navbar({ back: { label: "Programme", onClick: leave }, title: "Programme recommandé", subtitle: "Réglé sur ta semaine" }),
    h("div", { class: "scroll" },
      h("button", { class: "card tap violet", onClick: () => go("#/seances/programme/semaine") },
        h("div", { class: "card-head" },
          h("div", null, h("div", { class: "overline" }, "Ta semaine"), h("div", { class: "display-xs violet num" }, weekLine(p))),
          h("span", { class: "btn secondary sm" }, "Modifier"))),
      h("p", { class: "caption", style: { margin: 0 } }, "Le programme crée tes séances types : les séries de chaque muscle visent sa cible (maintenir, progresser, point faible), tes favoris passent en premier, jamais un exercice en douleur."),
      cards,
      chosen !== "perso" && [
        h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, chosen === reco ? "Pourquoi ce programme" : "Ce que ça donne")),
        h("div", { class: "card violet" }, reasons(opt, p, week).map(([ic, text]) =>
          h("div", { class: `hint${ic === "warning" ? " attention" : ""}` }, icon(ic), h("span", { class: "body-sm" }, text)))),
        h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Ta semaine type")),
        h("div", { class: "list" }, week.map(d => h("div", { class: "row" },
          h("div", { class: "row-main" },
            h("span", { class: `week-day${d.session ? "" : " off"}` }, d.day),
            h("span", { class: "caption" }, [d.session || "Pas de muscu",
              d.endurance === "facile" && (d.session ? "corde facile en échauffement" : "corde facile"),
              d.endurance === "recup" && (d.session ? "corde récup en échauffement" : "corde récup")].filter(Boolean).join(" · "))),
          d.endurance === "long" && pill("Jour long", "tag orange")))),
        h("p", { class: "caption", style: { margin: 0 } }, p.endurance ? `Les séances tournent dans cet ordre. Décale les jours si besoin, en gardant le jour long de corde loin des jambes. Les jours de muscu, la séance corde du jour (facile ou récup) sert d'échauffement.` : "Les séances tournent dans cet ordre. Décale les jours si besoin, en gardant un jour de repos entre deux grosses séances."),
        h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Aperçu"), h("span", { class: "caption" }, `${preview.length} séances`)),
        h("p", { class: "caption", style: { margin: 0 } }, "Modifie chaque séance avant de valider : exercices, séries, ordre, supersets. Changer de programme repart de zéro."),
        preview.map(t => h("div", { class: "card" },
          h("div", { class: "card-head" },
            h("div", null, h("span", { class: "heading-md violet" }, t.name), h("span", { class: "caption num", style: { display: "block" } }, `${t.items.length} exercice${t.items.length > 1 ? "s" : ""} · ~${estimate(t)} min`)),
            btn("Modifier", { variant: "secondary", size: "sm", icon: "pencil", onClick: () => go(`#/seances/${t.id}`) })),
          estimate(t) > p.minutes && h("div", { class: "hint attention" }, icon("warning"), h("span", { class: "body-sm" }, `Dépasse tes ${p.minutes} min : passe à un programme avec plus de séances, ou baisse une cible dans tes réglages Fluide.`)),
          h("div", { class: "list" }, t.items.map((it, i) => previewRow(t, it, i))))),
        h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Séries par semaine")),
        h("div", { class: "card rose" }, h("p", { class: "caption", style: { margin: 0 } }, "Si tu fais chaque séance une fois. Le trait blanc est la cible de chaque muscle."), volumeBars(plannedSetsOf(preview)))
      ],
      btn(chosen === "perso" ? "Créer mes séances moi-même" : "Utiliser ce programme", { variant: "primary", size: "lg", full: true, onClick: use })));
  return { el };
}

// Points forts (maintien) et points faibles (priorité) : ils écrivent directement les réglages Fluide.
// Retirer un muscle d'une des deux listes le remet en progresser. « À définir » change le format des séries, pas le volume.
const strengthChips = status => h("div", { class: `chips ${status === "faible" ? "rose" : "vert"}` }, MUSCLES.map(m => h("button", { type: "button", class: "chip", "aria-pressed": String(state.matrix[m].status === status),
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
  const goalCards = h("div", { class: "radio-cards", role: "radiogroup", "aria-label": "Objectif additionnel" },
    goals.map(([k, label, desc]) => h("button", { type: "button", class: "radio-card", role: "radio", "aria-checked": String(k === p.endurance), onClick: () => {
      p.endurance = k;
      if (k && p.enduranceStart == null) p.enduranceStart = startOfWeek(Date.now());
      save();
    } },
      h("span", { class: "radio-dot", "aria-hidden": "true" }),
      h("span", { class: "radio-text" }, h("span", { class: "body-md fort semibold" }, label), h("span", { class: "caption" }, desc)))));
  const field = (label, control, help) => h("div", { class: "field" }, h("span", { class: "caption medium" }, label), control, help && h("p", { class: "caption", style: { margin: 0 } }, help));
  const el = h("div", { class: "screen no-tabs violet" },
    navbar({ back: { label: "Retour", onClick: () => { options = null; save(); window.history.back(); } }, title: "Ta semaine", subtitle: "Séances, temps, objectif additionnel, points forts et faibles" }),
    h("div", { class: "scroll" },
      h("div", { class: "card" },
        field("Séances de muscu par semaine", stepper({ value: p.days, min: 2, max: 6, unit: "séances", label: "séances par semaine", onChange: set("days") })),
        field("Temps par séance", stepper({ value: p.minutes, values: SESSION_MINUTES, min: SESSION_MINUTES[0], max: SESSION_MINUTES.at(-1), format: v => `${v} min`, label: "minutes par séance", onChange: set("minutes") }),
          "Échauffement compris. Une séance trop longue perd d'abord du repos, puis des séries sur les muscles à maintenir.")),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md orange" }, "Objectif additionnel")),
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
      h("p", { class: "caption", style: { margin: 0 } }, "Force, hypertrophie ou endurance : l'objectif de chaque muscle se règle aussi dans Réglages Fluide, avec le matériel de ta salle."),
      btn("Voir ma recommandation", { variant: "primary", size: "lg", full: true, onClick: done })));
  return { el };
}

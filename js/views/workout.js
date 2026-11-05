import { state, save, exercise, itemSets, logSet, finishWorkout, discardWorkout, deleteSession, session, sessionVolume, sessionSets, sessionRecords, alternatives, variants, swapExercise, keepSwap, setEntryFormat, meltingPot, toggleFav, equipOf, EQUIPS, addExtra, lastPerformance, isInterval, intervalState, startClock, stopClock, groupOf, setEntrySets, moveEntry, removeEntry, linkEntries, template, CYCLES, MUSCLES, STATUS, FORMATS, FORMAT_DEFAULTS, enduranceToday, blocksLabel, blocksTotal, setVolume, weeklySets, setAbsent, setStack, setWorkoutGear, setWorkoutPlace, sessionGear, sessionPlaceKey, placeOf, placeLoads, reachable, PLACES, GEAR, available, isAmrap, amrapMembers, startAmrap, endAmrap, amrapLeft, outdoorGear, GEAR_FORMATS, STACK_STEPS, inLbs, toLbs, editSet, deleteSet, proposable } from "../store.js";
import { h, icon, btn, pill, go, kg, clock, reps, num, int, ago, stepper, chips, radios, sheet, confirmSheet, toast, announce, beep, restBeepPlanned, dateLong, pageHead, navbar } from "../ui.js";
import { prefPill, catalogue, exerciseTitle, niceName, groupTag, linkRow, charge, setsLine, chargeStepper } from "./templates.js";
import { placeSummary } from "./places.js";

// Anneau de Tabatime : 312 px, trait de 34 px.
const R = 139, C = 2 * Math.PI * R;

const lastLine = id => {
  const last = lastPerformance(id);
  return last ? `${setsLine(exercise(id).equip, last.sets)} · ${ago(last.date)}` : "Jamais fait";
};

// Machine prise : le même mouvement avec un autre matériel (un vrai exercice du catalogue, son nom et sa vidéo),
// ou un autre exercice du même muscle, favoris d'abord. Douleur, absents et matériel décoché ne sortent que si on les cherche.
function swapSheet(index) {
  const e = state.active.entries[index];
  const ex = exercise(e.exerciseId);
  const alts = alternatives(e.exerciseId);
  const vars = Object.entries(variants(e.exerciseId));
  let query = "", closeSheet, absent = !!ex.absent;
  const atGym = sessionPlaceKey() === "gym";
  // Pas dans ma salle : l'exercice n'est plus proposé, et celui choisi le remplace aussi dans la séance type.
  const pickAlt = x => {
    if (x.id === e.exerciseId) return;
    setAbsent(ex.id, absent);
    swapExercise(index, x.id);
    const t = absent && keepSwap(state.active.cursor);
    toast(t ? `${x.name} remplace ${ex.name} dans ${t.name}` : `${x.name} à la place`);
  };
  const list = h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } });
  const draw = muscle => catalogue(list, query, { muscle, pickIcon: "caretRight", note: x => lastLine(x.id),
    only: x => x.id !== ex.id && proposable(x),
    onPick: x => { closeSheet(); pickAlt(x); } });
  draw(ex.muscle);
  sheet({
    title: "Remplacer l'exercice",
    body: close => { closeSheet = close; return [
      h("p", { class: "body-sm discret", style: { margin: 0 } }, atGym ? `Machine prise, ou absente de ta salle : choisis un autre exercice. Le programme ne change pas, seule cette séance le prend.` : `Choisis un exercice que ton matériel permet. Le programme ne change pas, seule cette séance le prend. La recherche voit tout le catalogue.`),
      vars.length > 1 && h("span", { class: "overline" }, "Même mouvement avec"),
      vars.length > 1 && h("div", { class: "chips" }, Object.keys(EQUIPS).filter(k => vars.some(([q]) => q === k)).map(k => {
        const x = vars.find(([q]) => q === k)[1];
        return h("button", { type: "button", class: "chip", "aria-pressed": String(x.id === ex.id), "aria-label": x.name, onClick: () => {
          close();
          pickAlt(x);
        } }, EQUIPS[k]);
      })),
      !ex.mix && atGym && h("button", { type: "button", class: "radio-card", role: "checkbox", "aria-checked": String(absent),
        onClick: ev => { absent = !absent; ev.currentTarget.setAttribute("aria-checked", String(absent)); } },
        h("span", { class: "radio-dot", "aria-hidden": "true" }),
        h("span", { class: "radio-text" }, h("span", { class: "body-md fort semibold" }, "Pas dans ma salle"),
          h("span", { class: "caption" }, "Ne plus le proposer : l'exercice choisi le remplace aussi dans la séance type."))),
      h("span", { class: "overline" }, "Autre exercice"),
      !ex.mix && h("div", { class: "list" }, h("div", { class: "row pick" },
        h("button", { class: "row-btn", onClick: () => {
          close();
          swapExercise(index, meltingPot(ex.muscle).id);
          setEntryFormat(state.active.cursor, "tabata");
          toast(`Melting pot ${ex.muscle.toLowerCase()} en Tabata`);
        } },
          h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, "Melting pot"),
            h("span", { class: "caption" }, `Tabata ou EMOM de ${ex.muscle.toLowerCase()}, tes exercices sans les saisir`)),
          icon("caretRight", "chev")))),
      h("input", { class: "input", type: "search", placeholder: "Chercher un exercice", "aria-label": "Chercher un exercice", onInput: ev => { query = ev.target.value; draw(); } }),
      !alts.length && h("p", { class: "body-sm discret", style: { margin: 0 } }, `Aucun autre exercice disponible pour ${ex.muscle} : cherche-le par son nom${atGym ? ", ou attends la machine" : ""}.`),
      list,
      btn(atGym ? "Attendre la machine" : "Garder cet exercice", { variant: "ghost", full: true, onClick: close })]; }
  });
}

const weightStepper = (e, note) => chargeStepper({ equip: equipOf(e), ex: exercise(e.exerciseId), value: e.draft.weight, note, values: placeLoads(equipOf(e)) && [...placeLoads(equipOf(e))].sort((x, y) => x - y), onChange: v => { e.draft.weight = v; save(true); } });

// Pile de la machine : par 5 lbs, ou un pas plus grand au-delà d'un seuil (extension des jambes : 15 en 15 après 80).
// Poulie : directe ou démultipliée (la pile affiche le double de la charge réelle).
function stackSheet(ex, equip) {
  let step = ex.stack?.step || 5, from = ex.stack?.from ?? 80, ratio = ex.ratio || 1;
  const fromRow = h("div");
  const drawFrom = () => fromRow.replaceChildren(step === 5 ? "" : h("div", { class: "field-row" },
    h("span", { class: "body-md fort" }, "À partir de"),
    stepper({ value: from, step: 5, min: 5, max: 250, compact: true, format: v => `${v} lbs`, label: "seuil de la pile", onChange: v => { from = v; } })));
  drawFrom();
  sheet({
    title: "Pile", okLabel: "Enregistrer",
    body: [
      h("p", { class: "body-sm discret", style: { margin: 0 } }, `${ex.name}, pour toutes tes séances.`),
      radios(STACK_STEPS.map(n => [n, n === 5 ? "Par 5 lbs" : `Par ${n} lbs après un seuil`, n === 5 ? "Toute la pile au même pas." : `5 lbs en 5 jusqu'au seuil, puis ${n} en ${n}.`]), step,
        v => { step = v; drawFrom(); }, "Pas de la pile"),
      fromRow,
      equip === "poulie" && radios([[1, "Poulie directe", "La charge réelle est celle de la pile."], [0.5, "Poulie démultipliée ½", "Deux poulies sur le câble : tu déplaces la moitié de la pile. L'historique compte la charge réelle."]],
        ratio, v => { ratio = v; }, "Type de poulie")
    ],
    ok: () => { setTimeout(() => { setStack(ex.id, step === 5 ? null : { from, step }, ratio); toast("Pile enregistrée"); }); }
  });
}

// Format de l'exercice en cours, choisi avant la première série : séries, EMOM ou Tabata.
function formatSheet(index) {
  const e = state.active.entries[index], ex = exercise(e.exerciseId);
  const grouped = groupOf(state.active.entries, index);
  sheet({
    title: "Format",
    body: close => [
      h("p", { class: "body-sm discret", style: { margin: 0 } }, `Pour ${ex.name}, cette séance seulement.${grouped ? " En EMOM ou en Tabata, il sort de son superset." : ""}`),
      radios([
        ["series", FORMATS.series, "Séries avec repos, la charge monte quand le haut de la fourchette est atteint."],
        ["emom", FORMATS.emom, `${FORMAT_DEFAULTS.emom.rounds} rounds de ${FORMAT_DEFAULTS.emom.repsMin} reps, un au début de chaque minute.`],
        ["tabata", FORMATS.tabata, `${FORMAT_DEFAULTS.tabata.rounds} rounds de ${FORMAT_DEFAULTS.tabata.work} s d'effort, ${FORMAT_DEFAULTS.tabata.off} s de repos.`]
      ], e.format || "series", v => { close(); setEntryFormat(index, v); toast(`${ex.name} en ${FORMATS[v].toLowerCase()}`); }, "Format")]
  });
}

// Effort ressenti (RPE) : libellé, quatre puces pleine largeur, et ce que veut dire la note.
const rpeField = (value, onChange) => h("div", { class: "field rpe" },
  h("span", { class: "body-md fort" }, "Effort ressenti ", h("span", { class: "caption" }, "RPE, optionnel")),
  chips([[7, "7"], [8, "8"], [9, "9"], [10, "10"]], value, onChange),
  h("span", { class: "caption" }, "Sur 10 : 7 = encore 3 reps en réserve, 10 = plus une seule."));

// Options de l'exercice en cours, rarement utiles en pleine série : format (avant la première série) et pile de la machine.
const canFormat = e => !isAmrap(e) && !e.sets.length && !e.clock;
function optionsSheet(index) {
  const e = state.active.entries[index], ex = exercise(e.exerciseId), equip = equipOf(e);
  const row = (title, value, desc, onClick) => h("button", { type: "button", class: "row", onClick },
    h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, title, " · ", h("span", { class: "discret" }, value)), h("span", { class: "caption" }, desc)),
    icon("caretRight", "chev"));
  sheet({
    title: "Options de l'exercice",
    body: close => [
      h("p", { class: "body-sm discret", style: { margin: 0 } }, niceName(ex.name)),
      h("div", { class: "list" },
        canFormat(e) && row("Format", FORMATS[e.format || "series"], "Séries, EMOM ou Tabata, pour cette séance.", () => { close(); setTimeout(() => formatSheet(index)); }),
        inLbs(equip) && !isInterval(e) && row("Pile", `${ex.stack ? `${ex.stack.step} lbs après ${ex.stack.from}` : "5 lbs"}${ex.ratio ? " · poulie ½" : ""}`,
          "Pas des poids sur la machine, et poulie démultipliée.", () => { close(); setTimeout(() => stackSheet(ex, equip)); }))]
  });
}

// Favori : les programmes générés le proposent en premier. Sur un exercice pris à la place, il le garde aussi
// dans la séance type, pour que la prochaine séance le propose d'emblée.
const favBtn = (e, ex) => {
  const on = ex.pref === "aime";
  return h("button", { type: "button", class: "btn secondary sm square fav", "aria-pressed": String(on), onClick: () => {
    toggleFav(ex.id);
    const t = !on && keepSwap(state.active.cursor);
    toast(on ? `${ex.name} retiré des favoris` : t ? `${ex.name} en favori, gardé dans ${t.name}` : `${ex.name} en favori`);
    save();
  }, "aria-label": on ? `Retirer ${ex.name} des favoris` : `Mettre ${ex.name} en favori` }, icon("star"));
};

// Sans série validée, rien n'est enregistré : on le dit avant de sortir.
function abandonSheet() {
  confirmSheet({
    title: "Abandonner la séance ?",
    message: "Aucune série validée : rien ne sera enregistré et l'objectif de la semaine ne bouge pas.",
    confirmLabel: "Abandonner la séance", cancelLabel: "Continuer la séance", destructive: true,
    onConfirm: () => { finishWorkout(null, ""); go("#/"); }
  });
}

// Exercice hors programme : tout le catalogue, en séries, en EMOM ou en Tabata.
function extraSheet() {
  let format = "series", query = "", closeSheet;
  const list = h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } });
  const draw = muscle => catalogue(list, query, { muscle,
    note: e => lastLine(e.id),
    onPick: e => { closeSheet(); addExtra(e.id, format); toast(`${e.name} ajouté hors programme${format === "series" ? "" : ` en ${FORMATS[format]}`}`); }
  });
  draw(null);
  sheet({
    title: "Hors programme",
    body: close => { closeSheet = close; return [
      radios(Object.entries(FORMATS), format, v => { format = v; }, "Format"),
      h("input", { class: "input", type: "search", placeholder: "Chercher dans le catalogue", "aria-label": "Chercher un exercice", onInput: ev => { query = ev.target.value; draw(); } }),
      list]; }
  });
}

// Séance lancée par erreur : même avec des séries validées, on peut tout jeter.
function discardSheet() {
  const n = state.active.entries.reduce((t, e) => t + e.sets.length, 0);
  confirmSheet({
    title: "Supprimer la séance ?",
    message: `Lancée par erreur ? ${n ? `${n} série${n > 1 ? "s" : ""} validée${n > 1 ? "s" : ""} ${n > 1 ? "sont effacées" : "est effacée"} : ` : ""}rien ne sera enregistré et l'objectif de la semaine ne bouge pas.`,
    confirmLabel: "Supprimer la séance", cancelLabel: "Garder la séance", destructive: true,
    onConfirm: () => { discardWorkout(); go("#/"); toast("Séance supprimée"); }
  });
}

function finishSheet() {
  const a = state.active;
  const any = a.entries.some(e => e.sets.length);
  if (!any) {
    abandonSheet();
    return;
  }
  go("#/seance/terminer");
}

const FEELINGS = [
  ["dur", "Difficile", "Énergie basse, perfs en baisse ou une gêne : le coach surveille la récup."],
  ["ok", "Correct", "Séance normale, rien à signaler."],
  ["top", "En forme", "Bonne énergie : la progression peut suivre."]
];

// Écran dédié de fin de séance : récapitulatif, ressenti, journal. Le brouillon survit à une fermeture de l'app.
// Sans séance en cours, on renvoie à l'accueil, sauf si l'enregistrement vient d'envoyer vers le bilan.
const leaveIfIdle = route => setTimeout(() => { if (location.hash === route) go("#/"); });

export function finishView() {
  const a = state.active;
  if (!a) { leaveIfIdle("#/seance/terminer"); return { el: h("div") }; }
  if (!a.entries.some(e => e.sets.length)) { setTimeout(() => { go("#/seance"); abandonSheet(); }); return { el: h("div") }; }
  a.finish = a.finish || { feeling: null, note: "" };
  const done = sessionSets(a);
  const planned = a.entries.reduce((t, e) => t + itemSets({ format: e.format, sets: e.target.sets, rounds: e.target.rounds }), 0);
  const volume = a.entries.reduce((t, e) => t + e.sets.reduce((b, x) => b + setVolume(x), 0), 0);
  const records = sessionRecords({ startedAt: a.startedAt, entries: a.entries }).length;
  const missing = a.entries.filter(e => e.sets.length < e.target.sets);
  const t = template(a.templateId);
  if (a.finish.keep === undefined) a.finish.keep = false;
  const save_ = () => { const s = finishWorkout(a.finish.feeling, a.finish.note, a.finish.keep); go(s ? `#/bilan/${s.id}` : "#/"); };
  // Séance personnalisée : on peut reporter les changements (ordre, séries, ajouts, supersets) dans la séance type.
  const keepCard = a.edited && t && h("button", { type: "button", class: "radio-card", role: "checkbox", "aria-checked": String(a.finish.keep),
    onClick: ev => { a.finish.keep = !a.finish.keep; save(true); ev.currentTarget.setAttribute("aria-checked", String(a.finish.keep)); } },
    h("span", { class: "radio-dot", "aria-hidden": "true" }),
    h("span", { class: "radio-text" }, h("span", { class: "body-md fort semibold" }, `Garder ces changements dans ${t.name}`),
      h("span", { class: "caption" }, "Ordre, séries, exercices ajoutés ou retirés, supersets. Une machine prise reste une exception.")));

  const cards = h("div", { class: "radio-cards", role: "radiogroup", "aria-label": "Ressenti" },
    FEELINGS.map(([v, label, meta]) => h("button", { type: "button", class: "radio-card", role: "radio", "aria-checked": String(a.finish.feeling === v),
      onClick: e => {
        a.finish.feeling = a.finish.feeling === v ? null : v; save(true);
        cards.querySelectorAll(".radio-card").forEach((c, i) => c.setAttribute("aria-checked", String(FEELINGS[i][0] === a.finish.feeling)));
      } },
      h("span", { class: "radio-dot", "aria-hidden": "true" }),
      h("span", { class: "radio-text" }, h("span", { class: "body-md fort semibold" }, label), h("span", { class: "caption" }, meta)))));

  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Séance", href: "#/seance" }, title: "Terminer la séance", subtitle: `${a.name} · ${clock((Date.now() - a.startedAt) / 1000)}`,
      action: { label: "Enregistrer", onClick: save_ } }),
    h("div", { class: "scroll" },
      h("div", { class: "stat-grid" },
        h("div", { class: "stat" }, h("span", { class: "caption" }, "Séries"), h("b", null, `${done} / ${planned}`)),
        h("div", { class: "stat" }, h("span", { class: "caption" }, "Volume"), h("b", null, `${int(volume)} kg`)),
        h("div", { class: "stat" }, h("span", { class: "caption" }, "Records"), h("b", null, String(records)))),
      missing.length > 0 && h("div", { class: "hint attention" }, icon("warning"),
        h("span", { class: "body-sm" }, missing.map(e => `${exercise(e.exerciseId).name} : ${e.sets.length} / ${e.target.sets}`).join(" · "),
          ". Les séries non faites ne comptent pas dans l'objectif de la semaine.")),
      keepCard,
      h("div", { class: "field" }, h("h2", { class: "heading-md" }, "Ressenti"),
        h("p", { class: "caption", style: { margin: 0 } }, "Optionnel. Plusieurs séances « Difficile » d'affilée et le coach propose un deload."), cards),
      h("label", { class: "field" }, h("h2", { class: "heading-md" }, "Journal"),
        h("textarea", { class: "input journal", placeholder: "Sommeil, énergie, une gêne, un exercice que tu as adoré…", "aria-label": "Journal de séance", value: a.finish.note,
          onInput: e => { a.finish.note = e.target.value; save(true); } }),
        h("span", { class: "caption" }, "Le coach s'en sert pour ajuster le programme : préférences, douleurs, envies.")),
      btn("Reprendre la séance", { variant: "ghost", full: true, onClick: () => go("#/seance") }),
      btn("Supprimer la séance", { variant: "danger", full: true, onClick: discardSheet })));
  return { el };
}

// Séance en cours personnalisée (écran dédié) : séries en plus ou en moins, ordre, retrait, supersets, ajout hors programme.
// Le programme ne bouge pas ; en fin de séance, on peut reporter les changements dans la séance type.
export function editWorkoutView() {
  const a = state.active;
  if (!a) { leaveIfIdle("#/seance/modifier"); return { el: h("div") }; }
  const remove = i => {
    const e = a.entries[i], ex = exercise(e.exerciseId);
    if (a.entries.length === 1) { toast("Il faut garder au moins un exercice"); return; }
    if (!e.sets.length) { removeEntry(i); return; }
    confirmSheet({
      title: `Retirer ${ex.name} ?`,
      message: `${e.sets.length} série${e.sets.length > 1 ? "s" : ""} déjà validée${e.sets.length > 1 ? "s" : ""} sur cet exercice : elles seront effacées de la séance.`,
      confirmLabel: "Retirer l'exercice", cancelLabel: "Garder l'exercice", destructive: true,
      onConfirm: () => removeEntry(i)
    });
  };
  const rows = a.entries.flatMap((e, i) => {
    const ex = exercise(e.exerciseId), g = groupTag(a.entries, i), interval = isInterval(e);
    return [
      h("div", { class: `row edit-entry${g ? " grouped" : ""}` },
        h("div", { class: "row-main" },
          h("span", { class: "body-md fort medium" }, ex.name),
          h("span", { class: "caption num" }, g ? `${g.label} ${g.tag} · ` : "", e.extra ? "hors programme · " : "",
            `${e.sets.length} / ${e.target.sets} ${interval ? "round" : "série"}${e.target.sets > 1 ? "s" : ""} ${interval ? "fait" : "faite"}${e.target.sets > 1 ? "s" : ""}`)),
        h("div", { class: "edit-entry-actions" },
          stepper({ value: e.target.sets, min: Math.max(1, e.sets.length), max: interval ? 60 : 12, compact: true, label: `${interval ? "rounds" : "séries"} ${ex.name}`, onChange: v => setEntrySets(i, v) }),
          h("div", { class: "reorder" },
            h("button", { class: "btn secondary square", "aria-label": `Monter ${ex.name}`, disabled: i === 0, onClick: () => moveEntry(i, -1) }, icon("up")),
            h("button", { class: "btn secondary square", "aria-label": `Descendre ${ex.name}`, disabled: i === a.entries.length - 1, onClick: () => moveEntry(i, 1) }, icon("down")),
            h("button", { class: "btn danger square", "aria-label": `Retirer ${ex.name}`, onClick: () => remove(i) }, icon("trash"))))),
      linkRow(a.entries, i, () => linkEntries(i))];
  });
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Séance", href: "#/seance" }, title: "Modifier la séance", subtitle: `${a.name} · cette séance seulement`, action: { label: "OK", onClick: () => go("#/seance") } }),
    h("div", { class: "scroll" },
      h("p", { class: "caption", style: { margin: 0 } }, "Les changements valent pour cette séance. À la fin, tu choisis de les garder ou non dans la séance type."),
      h("div", { class: "list" }, rows),
      btn("Ajouter un exercice", { variant: "secondary", size: "lg", full: true, icon: "plus", onClick: extraSheet })));
  return { el };
}

let lockUntil = 0;
export function workoutView() {
  setDraft = null; // retour à la séance : une correction abandonnée repart de la série enregistrée
  const a = state.active;
  if (!a) { leaveIfIdle("#/seance"); return { el: h("div") }; }
  const e = a.entries[a.cursor];
  const ex = exercise(e.exerciseId);
  const now = Date.now();
  const resting = a.restEndsAt && a.restEndsAt > now && !e.clock;
  // AMRAP : le circuit est fini quand le temps est écoulé (ou arrêté), pas au nombre de séries.
  const leadOf = i => a.entries[amrapMembers(a.entries, i)[0]];
  const entryDone = (x, i) => (isAmrap(x) ? !!leadOf(i).done : x.sets.length >= x.target.sets);
  const amrap = isAmrap(e), lead = amrap ? leadOf(a.cursor) : null;
  const exDone = entryDone(e, a.cursor);
  const isLast = a.cursor === a.entries.length - 1;
  const allDone = a.entries.every(entryDone);
  const volume = a.entries.reduce((t, x) => t + x.sets.reduce((b, s) => b + setVolume(s), 0), 0);
  const rpeTarget = a.deload ? 6 : CYCLES[a.cycle].rpe;

  // Après un changement d'exercice ou une série notée, le bouton principal change de sens au même endroit :
  // un verrou de 700 ms évite qu'un double tap note une série par erreur.
  const setCursor = i => { a.cursor = i; a.goAt = null; lockUntil = Date.now() + 700; save(); };
  const guard = fn => () => { if (Date.now() >= lockUntil) fn(); };
  const grp = groupTag(a.entries, a.cursor);
  if (grp && amrap) grp.label = "AMRAP";
  const nextInGroup = grp && !grp.last ? exercise(a.entries[a.cursor + 1].exerciseId) : null;

  // ——— Matériel du jour d'abord : l'ouverture de la séance. Chaque matériel est une grande tuile qui dit combien
  // d'exercices du programme en dépendent ; la séance se réécrit sous les yeux (avant → après), le programme ne bouge pas.
  // Ta salle habituelle suffit presque toujours : l'écran ne s'ouvre que depuis la ligne « Matériel · Changer ».
  if (a.gearOpen && !a.entries.some(x => x.sets.length)) {
    const gear = sessionGear();
    const swapped = a.entries.filter(x => x.gearSwap);
    const stuck = a.entries.filter(x => !exercise(x.exerciseId).mix && !(available(exercise(x.exerciseId)) && reachable(exercise(x.exerciseId))));
    const dropped = a.dropped || [];
    const place = sessionPlaceKey();
    // Par matériel : exercices qui s'en servent aujourd'hui, et exercices du programme adaptés faute de l'avoir.
    const uses = (k, id) => GEAR[k].equips.includes(exercise(id)?.equip);
    const usedNow = k => a.entries.filter(x => uses(k, x.exerciseId)).length;
    const adapted = k => a.entries.filter(x => x.gearSwap && uses(k, x.swappedFrom)).length;
    const toggle = k => {
      const next = gear.includes(k) ? gear.filter(x => x !== k) : [...gear, k];
      if (!next.length) { toast("Garde au moins un matériel"); return; }
      // Coché sans charge décrite pour ce lieu : rien ne pourrait s'en servir.
      if (!gear.includes(k) && (k === "halteres" || k === "kettlebell") && placeLoads(k)?.length === 0) { toast("Indique d'abord tes charges : touche Modifier"); return; }
      setWorkoutGear(next);
      const n = a.entries.filter(x => x.gearSwap).length;
      announce(n ? `${n} exercice${n > 1 ? "s" : ""} adapté${n > 1 ? "s" : ""}.` : "Séance telle que prévue.");
    };
    const formatOf = x => (x.format === "amrap" ? "AMRAP" : x.format && x.format !== "series" ? FORMATS[x.format] : null);
    const tempo = a.entries.filter(x => x.tempo);
    const changes = [swapped.length && `${swapped.length} exercice${swapped.length > 1 ? "s" : ""} adapté${swapped.length > 1 ? "s" : ""}`,
      dropped.length && `${dropped.length} retiré${dropped.length > 1 ? "s" : ""}`].filter(Boolean).join(", ");
    const status = stuck.length ? `${stuck.length} exercice${stuck.length > 1 ? "s" : ""} sans équivalent avec ce matériel.`
      : changes ? `${changes} pour aujourd'hui. Le programme ne change pas.`
      : tempo.length ? "Mêmes exercices, en tempo lent. Le programme ne change pas."
      : "Tout est là : la séance se fait telle que prévue.";
    const el = h("div", { class: "screen workout big-targets" },
      h("div", { class: "wo-head" },
        h("div", { class: "wo-top" },
          h("span", { class: "overline" }, a.name, a.deload ? " · deload" : "", " · avant de commencer"),
          h("button", { class: "btn ghost xs", onClick: finishSheet }, "Terminer")),
        h("div", null,
          h("h1", { class: "heading-xl" }, "Qu'as-tu sous la main ?"),
          h("p", { class: "body-md discret", style: { margin: "4px 0 0" } }, "Touche ce qui manque aujourd'hui : la séance s'adapte."))),
      h("div", { class: "scroll" },
        h("div", { class: "chips", role: "group", "aria-label": "Lieu de la séance" }, Object.entries(PLACES).map(([k, pl]) =>
          h("button", { type: "button", class: "chip", "aria-pressed": String(k === place), onClick: () => { if (k !== place) { setWorkoutPlace(k); announce(`${pl.label} : séance adaptée.`); } } }, pl.short))),
        h("div", { class: "gear-place" },
          h("span", { class: "caption" }, placeSummary(place)),
          btn("Modifier", { variant: "ghost", size: "sm", onClick: () => go(`#/profil/lieux/${place}`) })),
        h("div", { class: "gear-grid", role: "group", "aria-label": "Matériel disponible aujourd'hui" }, Object.entries(GEAR).map(([k, g]) => {
          const on = gear.includes(k), n = usedNow(k), m = adapted(k);
          return h("button", { type: "button", class: "gear-tile", "aria-pressed": String(on), onClick: () => toggle(k) },
            h("span", { class: "gear-check", "aria-hidden": "true" }, on ? icon("check") : null),
            h("span", { class: "body-md fort medium" }, g.label),
            h("span", { class: "caption" }, on ? (n ? `${n} exercice${n > 1 ? "s" : ""} aujourd'hui` : "Pas utilisé aujourd'hui")
              : m ? `${m} exercice${m > 1 ? "s" : ""} adapté${m > 1 ? "s" : ""}` : "Pas prévu aujourd'hui"));
        })),
        h("p", { class: `body-sm gear-status${stuck.length ? " warn" : swapped.length ? " changed" : ""}`, style: { margin: 0 } }, status),
        outdoorGear(gear) && h("div", { class: "hint" }, icon("timer"), h("span", { class: "body-sm" },
          "Sans machines ni barres, on progresse en densité : kettlebells enchaînés en AMRAP, poids du corps en EMOM, haltères en Tabata.",
          tempo.length ? " Charge trop légère : tempo lent, 15 à 20 reps." : "")),
        h("div", { class: "list" }, a.entries.map(x => {
          const xe = exercise(x.exerciseId), from = x.gearSwap && exercise(x.swappedFrom), ko = stuck.includes(x), f = formatOf(x);
          return h("div", { class: `row gear-row${from ? " swapped" : ""}${ko ? " ko" : ""}` },
            h("div", { class: "row-main" },
              from && h("span", { class: "caption gear-from" }, niceName(from.name)),
              h("span", { class: "body-md fort medium" }, niceName(xe.name)),
              h("span", { class: "caption" }, ko ? `${EQUIPS[xe.equip]} · rien d'équivalent : remplace-le en séance, ou recoche ${EQUIPS[xe.equip].toLowerCase()}`
                : [EQUIPS[xe.equip], placeLoads(xe.equip) && `${num(x.draft.weight)} kg`, x.tempo && `tempo lent, ${x.target.repsMin}-${x.target.repsMax} reps`].filter(Boolean).join(" · "))),
            f ? pill(f, "accent") : x.tempo ? pill("Tempo", "accent") : ko ? icon("warning", "chev") : null);
        }),
        dropped.map(x => h("div", { class: "row gear-row swapped" },
          h("div", { class: "row-main" },
            h("span", { class: "caption gear-from" }, niceName(exercise(x.exerciseId).name)),
            h("span", { class: "caption" }, `${exercise(x.exerciseId).muscle} : rien de faisable ici, retiré de cette séance`)))))),
      h("div", { class: "wo-commands", style: { gridTemplateColumns: "1fr" } },
        btn("C'est bon", { variant: "primary", size: "lg", onClick: () => { a.gearOpen = false; save(); } })));
    return { el };
  }

  // Ligne repliée du matériel du jour, tant qu'aucune série n'est notée : ce qui est dispo, ce qui a été adapté, « Changer ».
  const gearLine = !a.entries.some(x => x.sets.length) && (() => {
    const gear = sessionGear(), key = sessionPlaceKey(), base = placeOf(key).gear, all = gear.length === base.length && gear.every(g => base.includes(g));
    const n = a.entries.filter(x => x.gearSwap || x.tempo).length, out = a.dropped?.length || 0;
    const what = all ? PLACES[key].label : `${PLACES[key].label} · ${Object.entries(GEAR).filter(([k]) => gear.includes(k)).map(([, g]) => g.label).join(", ")}`;
    return h("div", { class: "gear-line" }, icon("barbell"),
      h("div", { class: "row-main" }, h("span", { class: "body-sm fort" }, what), (n > 0 || out > 0) && h("span", { class: "caption" }, [n && `${n} exercice${n > 1 ? "s" : ""} adapté${n > 1 ? "s" : ""}`, out && `${out} retiré${out > 1 ? "s" : ""}`].filter(Boolean).join(", "), " pour aujourd'hui")),
      btn("Changer", { variant: "ghost", size: "sm", onClick: () => { a.gearOpen = true; save(); } }));
  })();

  // ——— Échauffement d'abord : cardio au chrono (comme Tabatime), puis mobilité et séries d'approche.
  // Le chrono se calcule depuis l'heure de départ (survit à la mise en veille) ; la pause décale ce départ.
  if (!a.warmupDone) {
    const lower = ["Quadris", "Ischios", "Fessiers", "Mollets"].includes(ex.muscle);
    const mobility = `mobilité ${lower ? "des hanches et des chevilles" : "des épaules et des coudes"}`;
    // Plan d'endurance : la séance corde du jour (facile ou récup) sert d'échauffement, bloc par bloc.
    // Le jour long se fait à part : on garde alors l'échauffement des réglages.
    const rope = enduranceToday();
    const ropeDay = rope && rope.kind !== "long" ? rope : null;
    const plan = state.profile.warmup || "";
    const dur = plan.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*min/);
    const cardio = ropeDay ? `Corde à sauter · semaine ${ropeDay.week}` : plan.replace(/\d.*$/, "").trim() || "Cardio";
    const total = ropeDay ? blocksTotal(ropeDay.blocks) : (dur ? +(dur[2] || dur[1]) : 5) * 60;
    const blocks = ropeDay && ropeDay.blocks[0] > 1 ? ropeDay.blocks : null;
    const ropeNote = rope && h("div", { class: "hint" }, icon("bolt"), h("span", { class: "body-sm" },
      rope.kind === "long" ? `Jour long de corde aujourd'hui (${blocksLabel(rope.blocks)}) : fais-le à part, loin de la muscu.`
      : rope.kind === "recup" ? "Jour récup : technique pure, pas alterné, sauts bas."
      : "Séance facile : tu dois pouvoir la refaire juste après. Sauts de 2 à 3 cm, 110 à 130 tours par minute."));
    const w = a.warm;
    const left = () => Math.max(0, w.total - ((w.paused || Date.now()) - w.start) / 1000);
    const approach = h("div", { class: "hint" }, icon("barbell"),
      h("span", { class: "body-sm" }, "Séries d'approche sur ", h("b", { class: "fort medium" }, ex.name), ` : 2 ou 3 séries légères avant ${charge(equipOf(e), e.draft.weight)}.`));
    const head = h("div", { class: "wo-head" },
      h("div", { class: "wo-top" },
        h("span", { class: "overline" }, a.name, a.deload ? " · deload" : "", " · avant la première série"),
        h("button", { class: "btn ghost xs", onClick: finishSheet }, "Terminer")),
      h("div", null,
        h("h1", { class: "heading-xl" }, "Échauffement"),
        h("p", { class: "body-md discret", style: { margin: "4px 0 0" } }, `${cardio}, puis mobilité`)));
    const foot = h("p", { class: "caption wo-foot num", style: { gridColumn: "1 / -1", margin: 0 } }, "Durée ", h("span", { "data-tick": "elapsed" }));
    const begin = () => { a.warmupDone = true; save(); };

    if (w) {
      const done = w.done;
      const ring = h("circle", { svg: true, class: "prog", cx: 156, cy: 156, r: R, "stroke-dasharray": C });
      const time = h("div", { class: "display-lg num" });
      const label = h("div", { class: "overline" }, done ? "Terminé" : cardio);
      const sub = h("span", { class: "body-sm discret" }, done ? "Cardio bouclé" : w.paused ? "En pause" : `Sur ${clock(w.total)}`);
      // Séance en blocs : l'anneau suit le bloc en cours (effort en orange, repos en vert).
      const phase = () => {
        if (!w.blocks) return null;
        const [n, work, rest] = w.blocks, cyc = work + rest, el = ((w.paused || Date.now()) - w.start) / 1000;
        const round = Math.min(n, Math.floor(el / cyc) + 1), inCycle = el - (round - 1) * cyc, effort = inCycle < work;
        return { round, n, effort, left: effort ? work - inCycle : cyc - inCycle, len: effort ? work : rest, key: `${round}-${effort}` };
      };
      let lastKey = phase()?.key;
      const update = () => {
        const l = done ? 0 : left(), ph = !done && phase();
        time.textContent = clock(Math.ceil(ph ? ph.left : l));
        ring.setAttribute("stroke-dashoffset", String(done ? 0 : C * (1 - (ph ? ph.left / ph.len : l / w.total))));
        if (!ph) return;
        if (label.textContent && label.textContent !== (ph.effort ? `Effort ${ph.round} / ${ph.n}` : "Repos")) announce(ph.effort ? `Effort ${ph.round} sur ${ph.n}.` : "Repos.");
        label.textContent = ph.effort ? `Effort ${ph.round} / ${ph.n}` : "Repos";
        sub.textContent = w.paused ? "En pause" : `Reste ${clock(Math.ceil(l))} au total`;
        ringBox.classList.toggle("chauffe", ph.effort);
      };
      const ringBox = h("div", { class: `ring ${done ? "repos" : "chauffe"}${w.paused ? " paused" : ""}` },
        h("svg", { viewBox: "0 0 312 312", width: 312, height: 312, "aria-hidden": "true" }, h("circle", { svg: true, class: "track", cx: 156, cy: 156, r: R }), ring),
        h("div", { class: "ring-center" }, label, time, sub));
      update();
      // Recommencer efface le chrono : on le confirme dès qu'il a tourné un peu.
      const restart = () => (w.total - left() < 30 ? (a.warm = null, save()) : confirmSheet({
        title: "Recommencer l'échauffement ?", message: `${clock(Math.round(w.total - left()))} déjà faits : le chrono repart de zéro.`,
        confirmLabel: "Recommencer", cancelLabel: "Continuer", onConfirm: () => { a.warm = null; save(); }
      }));
      const toggle = () => { if (w.paused) { w.start += Date.now() - w.paused; w.paused = null; } else w.paused = Date.now(); save(); };
      const el = h("div", { class: "screen workout" }, head,
        h("div", { class: "scroll wo-center" },
          h("div", { class: "wo-hero" },
            ringBox,
            h("p", { class: "body-md discret", style: { margin: 0 } }, "Ensuite : ", h("b", { class: "fort medium" }, mobility))),
          approach),
        done
          ? h("div", { class: "wo-commands", style: { gridTemplateColumns: "1fr 1.4fr" } },
              btn("Refaire", { variant: "secondary", size: "lg", onClick: () => { a.warm = null; save(); } }),
              btn("Commencer la séance", { variant: "primary", size: "lg", onClick: begin }), foot)
          : h("div", { class: "wo-commands" },
              btn("Recommencer", { variant: "secondary", size: "lg", onClick: restart }),
              btn(w.paused ? "Reprendre" : "Pause", { variant: "primary", size: "lg", onClick: toggle }),
              btn("Passer", { variant: "secondary", size: "lg", onClick: begin }), foot));
      el.classList.add("big-targets");
      return {
        el,
        tick() {
          if (done || w.paused) return;
          if (left() <= 0) { w.done = true; beep(660, 0.15, 3); save(); return; }
          const ph = phase();
          if (ph && ph.key !== lastKey) { lastKey = ph.key; beep(ph.effort ? 880 : 660, 0.12, ph.effort ? 2 : 1); }
          update();
        }
      };
    }

    const el = h("div", { class: "screen workout big-targets" },
      h("div", { class: "wo-head" },
        h("div", { class: "wo-top" },
          h("span", { class: "overline" }, a.name, a.deload ? " · deload" : "", " · avant la première série"),
          h("button", { class: "btn ghost xs", onClick: finishSheet }, "Terminer")),
        h("div", null,
          h("h1", { class: "heading-xl" }, "Échauffement"),
          h("p", { class: "body-md discret", style: { margin: "4px 0 0" } }, `${cardio}, puis mobilité`))),
      h("div", { class: "scroll wo-center" },
        h("div", { class: "wo-hero" },
          h("div", { class: "overline" }, ropeDay ? `${cardio} · ${ropeDay.kind === "recup" ? "jour récup" : "séance facile"}${ropeDay.deload ? " · deload" : ""}` : cardio),
          h("div", { class: "display-sm num" }, ropeDay ? `${Math.round(total / 60)} min` : dur ? dur[0].replace("-", "–") : clock(total)),
          h("p", { class: "body-md discret", style: { margin: 0 } }, ropeDay ? `${blocksLabel(ropeDay.blocks)}, puis ${mobility}.` : `Montée progressive, puis ${mobility}.`)),
        ropeNote, approach, gearLine),
      h("div", { class: "wo-commands", style: { gridTemplateColumns: "1fr 1.4fr" } },
        btn("Passer", { variant: "secondary", size: "lg", onClick: begin }),
        btn("C'est parti", { variant: "primary", size: "lg", icon: "timer", onClick: () => { a.warm = { start: Date.now(), paused: null, total, blocks }; save(); } }),
        foot));
    return { el };
  }

  // ——— Héros : série à faire, repos, chrono (EMOM, Tabata, AMRAP) ou exercice terminé.
  const interval = isInterval(e);
  const formatLine = e.format === "emom" ? `EMOM ${e.target.rounds} × ${clock(e.target.every)} · ${e.target.repsMin} reps`
    : `Tabata ${e.target.rounds} × ${e.target.work} s / ${e.target.off} s`;
  const repsStepper = (label, max = 100) => h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, label),
    stepper({ value: e.draft.reps, min: 0, max, compact: true, label: "reps", onChange: v => { e.draft.reps = v; save(true); } }));
  const draftSteppers = repsLabel => [weightStepper(e, "0 = poids du corps"), repsStepper(repsLabel, 200)];
  // RPE : effort ressenti sur 10 ; 10 − RPE = reps qu'il restait en réserve.
  const rir = r => (r >= 10 ? "à fond" : `${10 - Math.round(r)} rep${10 - Math.round(r) > 1 ? "s" : ""} en réserve`);
  const col = (...kids) => h("div", { class: "wo-stack" }, ...kids);
  let hero, restBtn, bottom;

  // Série validée : message avec Annuler (la série sort, le repos qu'elle a lancé aussi).
  const done = () => {
    const i = a.cursor, x = a.entries[i];
    a.goAt = null;
    lockUntil = Date.now() + 700;
    logSet();
    const k = x.sets.length - 1, s = x.sets[k];
    const what = isAmrap(x) ? `${exercise(x.exerciseId).name} : tour ${k + 1}` : `${interval ? "Round" : "Série"} ${k + 1}`;
    toast(`${what} noté${isAmrap(x) || interval ? "" : "e"} · ${charge(equipOf(x), s.weight)} × ${s.reps}`, {
      label: "Annuler", onClick: () => { if (!state.active?.entries[i]?.sets[k]) return; state.active.cursor = i; deleteSet(i, k); toast("Annulé"); }
    });
  };

  if (resting) {
    const ring = h("circle", { svg: true, class: "prog", cx: 156, cy: 156, r: R, "stroke-dasharray": C });
    const time = h("div", { class: "display-lg num" });
    // Bouton principal pendant le repos : sa jauge se vide avec le temps restant, comme l'anneau ; un tap lance la suite sans attendre.
    const nextLabel = exDone ? "Fin du repos" : `Lancer la série ${e.sets.length + 1}`;
    const fill = h("span", { class: "rest-fill", "aria-hidden": "true" }), btnTime = h("span", { class: "num" });
    restBtn = h("button", { class: "btn lg rest-btn", type: "button", onClick: () => { a.restEndsAt = null; save(); } },
      fill, h("span", { class: "rest-label" }, nextLabel), btnTime);
    const update = () => {
      const left = Math.max(0, (a.restEndsAt - Date.now()) / 1000);
      time.textContent = clock(Math.ceil(left));
      ring.setAttribute("stroke-dashoffset", String(C * (1 - left / a.restTotal)));
      btnTime.textContent = clock(Math.ceil(left));
      fill.style.transform = `scaleX(${Math.min(1, left / a.restTotal)})`;
      restBtn.setAttribute("aria-label", `${nextLabel} maintenant, repos restant ${clock(Math.ceil(left))}`);
    };
    update();
    const shift = d => { a.restEndsAt = Math.max(Date.now(), a.restEndsAt + d * 1000); a.restTotal = Math.max(a.restTotal + d, 1); save(true); update(); };
    // Le repos est le moment où l'on charge la barre : la série suivante se prépare ici.
    const nextEx = exDone && !isLast ? exercise(a.entries[a.cursor + 1].exerciseId) : null;
    hero = col(
      h("div", { class: "wo-hero rest" },
        h("div", { class: "ring sm repos" },
          h("svg", { viewBox: "0 0 312 312", "aria-hidden": "true" }, h("circle", { svg: true, class: "track", cx: 156, cy: 156, r: R }), ring),
          h("div", { class: "ring-center" }, h("div", { class: "overline" }, "Repos"), time))),
      exDone
        ? nextEx && h("div", { class: "hint" }, icon("caretRight"), h("span", { class: "body-sm" }, "Ensuite : ", h("b", { class: "fort medium" }, niceName(nextEx.name)), "."))
        : h("div", { class: "card next-set" },
            h("span", { class: "heading-md" }, `Série ${e.sets.length + 1} / ${e.target.sets}`),
            weightStepper(e), repsStepper("Reps")));
    hero.update = update;
    // Ajuster le repos au pouce, de part et d'autre du bouton principal.
    bottom = [btn("−15 s", { variant: "secondary", size: "lg", onClick: () => shift(-15) }), restBtn, btn("+15 s", { variant: "secondary", size: "lg", onClick: () => shift(15) })];
  } else if (interval && !exDone) {
    const st = intervalState(e);
    if (!st) {
      hero = col(
        h("div", { class: "wo-hero" },
          h("div", { class: "overline" }, `${FORMATS[e.format]} · round ${e.sets.length + 1} / ${e.target.rounds}`),
          h("div", { class: "display-sm num" }, e.format === "emom" ? clock(e.target.every) : `${e.target.work} / ${e.target.off} s`),
          h("span", { class: "body-sm discret" }, e.format === "emom" ? `${e.target.repsMin} reps au début de chaque minute, le reste sert de repos.` : "Effort puis repos, au chrono. Note tes reps à chaque round.")),
        ...draftSteppers(e.format === "emom" ? "Reps par round" : "Reps du round"));
    } else {
      const kind = e.format === "emom" ? "emom" : st.phase;
      const ring = h("circle", { svg: true, class: "prog", cx: 156, cy: 156, r: R, "stroke-dasharray": C });
      const time = h("div", { class: "display-lg num" }), over = h("div", { class: "overline" }), sub = h("span", { class: "body-sm discret num" });
      const wrap = h("div", { class: `ring ${kind}` },
        h("svg", { viewBox: "0 0 312 312", width: 312, height: 312, "aria-hidden": "true" }, h("circle", { svg: true, class: "track", cx: 156, cy: 156, r: R }), ring),
        h("div", { class: "ring-center" }, over, time, sub));
      const update = () => {
        const x = intervalState(e); if (!x) return;
        wrap.className = `ring ${e.format === "emom" ? "emom" : x.phase}`;
        over.textContent = e.format === "emom" ? `Round ${Math.min(x.round, e.target.rounds)} / ${e.target.rounds}` : `${x.phase === "effort" ? "Effort" : "Repos"} · round ${Math.min(x.round, e.target.rounds)} / ${e.target.rounds}`;
        time.textContent = clock(Math.ceil(x.left));
        sub.textContent = `${e.sets.length} round${e.sets.length > 1 ? "s" : ""} noté${e.sets.length > 1 ? "s" : ""}`;
        ring.setAttribute("stroke-dashoffset", String(C * (1 - x.left / x.total)));
      };
      update();
      const stop = () => confirmSheet({
        title: "Arrêter le chrono ?",
        message: `${e.sets.length} round${e.sets.length > 1 ? "s" : ""} noté${e.sets.length > 1 ? "s" : ""} : ${e.sets.length > 1 ? "ils restent" : "il reste"}. Le chrono repart de zéro si tu le relances.`,
        confirmLabel: "Arrêter le chrono", cancelLabel: "Continuer", onConfirm: () => stopClock(a.cursor)
      });
      hero = col(
        h("div", { class: `wo-hero ${kind}` }, wrap,
          btn("Arrêter le chrono", { variant: "ghost", size: "sm", onClick: stop })),
        ...draftSteppers("Reps du round"));
      hero.update = update;
    }
  } else if (amrap && !exDone) {
    const m = amrapMembers(a.entries, a.cursor);
    const round = Math.min(...m.map(i => a.entries[i].sets.length)) + 1;
    // Le circuit, exercice en cours surligné, tours faits par exercice : juste sous le chrono, toujours visible.
    const circuit = h("div", { class: "list" }, m.map((i, n) => {
      const x = a.entries[i], cur = i === a.cursor;
      return h("button", { type: "button", class: `set-row${cur ? " cur" : ""}`, "aria-current": cur ? "step" : null, onClick: () => setCursor(i) },
        h("span", { class: "set-idx" }, String(n + 1)),
        h("span", { class: `body-md ${cur ? "fort" : "discret"}` }, niceName(exercise(x.exerciseId).name),
          h("span", { class: "caption num", style: { display: "block" } }, `${x.draft.reps} reps · ${charge(equipOf(x), x.draft.weight)}`)),
        h("span", { class: "caption num" }, `${x.sets.length} tour${x.sets.length > 1 ? "s" : ""} fait${x.sets.length > 1 ? "s" : ""}`));
    }));
    if (!lead.clock) {
      hero = col(
        h("div", { class: "wo-hero" },
          h("div", { class: "overline" }, `AMRAP · ${m.length} exercice${m.length > 1 ? "s" : ""}`),
          h("div", { class: "display-sm num" }, clock(lead.target.time)),
          h("span", { class: "body-sm discret" }, "Enchaîne les exercices sans repos, autant de tours que possible. Règle la charge et les reps de chacun avant de lancer.")),
        circuit, ...draftSteppers("Reps"));
    } else {
      const ring = h("circle", { svg: true, class: "prog", cx: 156, cy: 156, r: R, "stroke-dasharray": C });
      const time = h("div", { class: "display-lg num" });
      const update = () => {
        const left = amrapLeft(lead);
        time.textContent = clock(Math.ceil(left));
        ring.setAttribute("stroke-dashoffset", String(C * (1 - left / lead.target.time)));
      };
      update();
      const stop = () => confirmSheet({
        title: "Arrêter l'AMRAP ?",
        message: `${round - 1} tour${round - 1 > 1 ? "s" : ""} complet${round - 1 > 1 ? "s" : ""}, il reste ${clock(Math.ceil(amrapLeft(lead)))}. Le circuit s'arrête et les tours faits comptent comme séries.`,
        confirmLabel: "Arrêter l'AMRAP", cancelLabel: "Continuer le circuit", onConfirm: () => endAmrap(a.cursor)
      });
      hero = col(
        h("div", { class: "wo-hero" },
          h("div", { class: "ring sm amrap" },
            h("svg", { viewBox: "0 0 312 312", "aria-hidden": "true" }, h("circle", { svg: true, class: "track", cx: 156, cy: 156, r: R }), ring),
            h("div", { class: "ring-center" }, h("div", { class: "overline" }, `Tour ${round}`), time)),
          btn("Arrêter l'AMRAP", { variant: "ghost", size: "sm", onClick: stop })),
        circuit, ...draftSteppers("Reps"));
      hero.update = update;
    }
  } else if (exDone) {
    // Fin d'exercice : le moment fort de la séance (volume, record battu, la suite).
    const exVolume = e.sets.reduce((b, x) => b + setVolume(x), 0);
    const record = !interval && !amrap && sessionRecords({ startedAt: a.startedAt, entries: [e] })[0];
    const nextEx = !isLast && exercise(a.entries[a.cursor + 1].exerciseId);
    // La boussole Fluide : où en est ce muscle dans sa cible de la semaine, séance en cours comprise.
    const m = ex.muscle, target = state.matrix[m]?.target, week = target && weeklySets()[m];
    const weekCard = target && h("div", { class: "week-card" },
      h("div", { class: "field-row" }, h("span", { class: "body-md fort medium" }, `${m} cette semaine`),
        h("span", { class: "body-md num fort" }, `${week} / ${target} séries`)),
      h("div", { class: "vol-track", role: "progressbar", "aria-label": `${m} : ${week} séries sur ${target} cette semaine`, "aria-valuenow": week, "aria-valuemin": 0, "aria-valuemax": target },
        h("div", { class: `vol-fill ${week >= target ? "done" : state.matrix[m].status}`, style: { width: `${Math.min(100, (week / target) * 100)}%` } })),
      h("span", { class: "caption" }, week >= target ? "Cible atteinte : le reste de la semaine est du bonus." : `Encore ${target - week} série${target - week > 1 ? "s" : ""} pour la cible ${STATUS[state.matrix[m].status].label.toLowerCase()}.`));
    hero = h("div", { class: "wo-hero done" },
      h("span", { class: "done-badge", "aria-hidden": "true" }, icon("check")),
      h("h2", { class: "heading-xl" }, allDone ? "Séance bouclée" : "Exercice terminé"),
      h("span", { class: "body-md discret num" }, allDone ? "Toutes les séries sont faites. Bien joué."
        : `${e.sets.length} ${amrap ? "tour" : interval ? "round" : "série"}${e.sets.length > 1 ? "s" : ""}${exVolume ? ` · ${int(exVolume)} kg soulevés` : ""}`),
      record && pill(`Record · 1RM est. ${num(record.value)} kg (+${num(record.delta)})`, "succes"),
      !allDone && (nextEx ? h("span", { class: "body-sm" }, "Ensuite : ", h("b", { class: "fort medium" }, niceName(nextEx.name)))
        : h("span", { class: "body-sm discret" }, "Il reste des séries sur d'autres exercices.")),
      weekCard);
  } else {
    // Fin du repos au chrono : « À toi » en grand jusqu'à la prochaine action (le bip peut être muet),
    // avec le temps écoulé depuis la fin du repos. Le flash ne joue qu'à l'arrivée.
    const goSince = a.goAt ? Math.max(0, (Date.now() - a.goAt) / 1000) : null;
    const over = goSince !== null && h("span", { class: "body-sm go-over num" });
    hero = col(
      h("div", { class: `wo-hero${goSince !== null ? ` go${goSince < 2 ? " arrive" : ""}` : ""}` },
        goSince !== null && h("h2", { class: "heading-xl go-title" }, "À toi"),
        h("div", { class: "overline" }, `Série ${e.sets.length + 1} / ${e.target.sets}`),
        over,
        h("span", { class: "body-sm discret num" }, `Objectif ${reps(e.target.repsMin, e.target.repsMax)} reps · RPE ${String(rpeTarget).replace(".", ",")}, ${rir(rpeTarget)}`)),
      e.hint === "charge" && e.sets.length === 0 && h("div", { class: "hint" }, icon("trend"), h("span", { class: "body-sm" }, "Haut de fourchette atteint la dernière fois : ", h("b", { class: "fort medium" }, charge(equipOf(e), e.draft.weight)), ".")),
      e.hint === "reps" && e.sets.length === 0 && h("div", { class: "hint" }, icon("trend"), h("span", { class: "body-sm" }, "Même charge, vise ", h("b", { class: "fort medium" }, `${e.draft.reps} reps`), " (une de plus que la dernière fois).")),
      e.tempo && h("div", { class: "hint" }, icon("timer"), h("span", { class: "body-sm" }, "Charge légère aujourd'hui : ", h("b", { class: "fort medium" }, "3 s à la descente"), ", et va chercher les 15 à 20 reps. Ces séries ne changent pas ta charge de référence.")),
      weightStepper(e),
      repsStepper("Reps"),
      rpeField(e.draft.rpe, v => { e.draft.rpe = v; save(true); }));
    if (over) { hero.update = () => { over.textContent = `Repos fini depuis ${clock(Math.floor((Date.now() - a.goAt) / 1000))}`; }; hero.update(); }
  }

  const setsList = !amrap && (e.sets.length > 0 || !resting) && h("div", { class: "list" },
    Array.from({ length: Math.max(e.target.sets, e.sets.length) }, (_, i) => {
      const s = e.sets[i];
      const cur = !s && i === e.sets.length && !resting;
      const line = s ? `${interval ? `Round ${i + 1} · ` : ""}${charge(equipOf(e), s.weight)}${s.ratio ? " ½" : ""} × ${s.reps}` : null;
      // Série validée : un tap ouvre sa correction (charge, reps, RPE), ou la retire.
      return h(s ? "button" : "div", { class: `set-row${s ? " done" : ""}${cur ? " cur" : ""}`, ...(s && { type: "button", "aria-label": `Corriger ${interval ? "le round" : "la série"} ${i + 1} : ${line}`, onClick: () => go(`#/seance/serie/${a.cursor}/${i}`) }) },
        h("span", { class: "set-idx" }, s ? icon("check") : i + 1),
        h("span", { class: `body-md num ${s ? "fort" : "discret"}` }, s ? line : cur ? "En cours" : interval ? `Round ${i + 1}` : `${reps(e.target.repsMin, e.target.repsMax)} reps`),
        s ? h("span", { class: "set-end" }, s.rpe ? h("span", { class: "caption num" }, `RPE ${s.rpe}`) : null, icon("pencil", "chev")) : h("span"));
    }));

  const segs = a.entries.map((x, i) => h("i", { class: entryDone(x, i) ? "on" : i === a.cursor ? "cur" : "" }));
  const canLaunch = interval && !exDone && !e.clock && !e.sets.length;
  const primary = allDone || (exDone && isLast)
    ? btn("Terminer la séance", { variant: "primary", size: "lg", onClick: finishSheet })
    : exDone
      ? btn("Exercice suivant", { variant: "primary", size: "lg", onClick: guard(() => setCursor(a.cursor + 1)) })
      : amrap && !lead.clock
        ? btn("Lancer l'AMRAP", { variant: "primary", size: "lg", icon: "timer", onClick: guard(() => startAmrap(a.cursor)) })
      : amrap
        ? btn("Fait", { variant: "primary", size: "lg", icon: "check", onClick: guard(done) })
      : canLaunch
        ? btn("Lancer le chrono", { variant: "primary", size: "lg", icon: "timer", onClick: guard(() => startClock(a.cursor)) })
        : btn(interval ? "Round fait" : "Série faite", { variant: "primary", size: "lg", icon: "check", onClick: guard(done) });
  if (a.goAt && !exDone && !resting) primary.classList.add("go");
  // Exercice précédent / suivant : flèches nommées, à l'écart du bouton principal.
  const nav = (dir, ok) => ok
    ? h("button", { type: "button", class: "btn secondary lg nav-arrow", "aria-label": dir < 0 ? "Exercice précédent" : "Exercice suivant", title: dir < 0 ? "Exercice précédent" : "Exercice suivant", onClick: () => setCursor(a.cursor + dir) }, icon(dir < 0 ? "caretLeft" : "caretRight"))
    : h("span", { "aria-hidden": "true" });
  bottom ||= [nav(-1, a.cursor > 0), primary, nav(1, !isLast && !exDone)];

  const equip = equipOf(e);
  const subtitle = [EQUIPS[equip], ex.muscle,
    amrap ? `AMRAP ${clock(lead.target.time)}, sans repos` : interval ? formatLine
      : nextInGroup ? `puis ${niceName(nextInGroup.name)}, sans repos` : grp ? `repos ${clock(e.target.rest)} après le tour` : `repos ${clock(e.target.rest)}`,
    e.extra && "hors programme"].filter(Boolean).join(" · ");
  const hasOptions = !exDone && (canFormat(e) || (inLbs(equip) && !interval));

  const el = h("div", { class: "screen workout big-targets" },
    h("div", { class: "wo-head" },
      h("div", { class: "wo-top" },
        h("span", { class: "overline" }, `${a.name} · exercice ${a.cursor + 1} / ${a.entries.length}`, grp ? ` · ${grp.label} ${grp.tag}` : ""),
        // Pas de « Modifier » : une séance lancée ne se réorganise plus (décision du 31/10, l'écran reste sans accès).
        h("button", { class: "btn ghost xs", onClick: finishSheet }, "Terminer")),
      h("div", null,
        h("h1", { class: "heading-xl wo-title" }, exerciseTitle(ex)),
        h("p", { class: "body-md discret num", style: { margin: "4px 0 0" } }, subtitle)),
      h("div", { class: "wo-tools" },
        a.deload && pill("Deload · volume ÷ 2", "attention"),
        !exDone && btn("Remplacer", { variant: "secondary", size: "sm", icon: "swap", onClick: () => swapSheet(a.cursor) }),
        hasOptions && btn("Options", { variant: "secondary", size: "sm", icon: "sliders", onClick: () => optionsSheet(a.cursor) }),
        favBtn(e, ex)),
      h("div", { class: "segments", "aria-label": `${a.entries.filter(entryDone).length} exercices terminés sur ${a.entries.length}` }, segs)),
    h("div", { class: "scroll" },
      ex.pref === "douleur" && h("div", { class: "hint attention" }, icon("warning"), h("span", { class: "body-sm" }, "Tu as signalé une douleur sur cet exercice : charge allégée, amplitude confortable, ou remplace-le.")),
      !resting && !exDone && gearLine, hero, setsList),
    h("div", { class: `wo-commands nav${resting ? " resting" : ""}` }, ...bottom,
      h("p", { class: "caption wo-foot num", style: { gridColumn: "1 / -1", margin: 0 } },
        "Durée ", h("span", { "data-tick": "elapsed" }), ` · ${int(volume)} kg soulevés`)));

  return {
    el,
    tick() {
      if (amrap && lead.clock) {
        if (amrapLeft(lead) <= 0) { beep(660, 0.18, 3); announce("AMRAP terminé."); endAmrap(a.cursor); return; }
        hero.update?.();
        return;
      }
      if (interval && e.clock) {
        const x = intervalState(e);
        const key = x.done ? "done" : `${x.round}-${x.phase}`;
        if (e.lastBeep !== key) {
          if (e.lastBeep) { beep(x.done ? 660 : x.phase === "effort" ? 880 : 520, 0.15, x.done ? 3 : 1); announce(x.done ? "Chrono terminé." : x.phase === "effort" ? `Effort, round ${x.round}.` : "Repos."); }
          e.lastBeep = key;
        }
        if (x.done) { stopClock(a.cursor); return; }
        hero.update?.();
        return;
      }
      if (!a.restEndsAt) { hero.update?.(); return; }
      if (Date.now() >= a.restEndsAt) {
        if (!restBeepPlanned(a.restEndsAt)) beep(880, 0.18, 3);
        announce(exDone ? "Repos terminé." : `Repos terminé. À toi : série ${e.sets.length + 1}.`);
        a.restEndsAt = null; a.goAt = Date.now(); save(); return;
      }
      hero.update?.();
    }
  };
}

// Écran dédié pour corriger une série validée : charge, reps, RPE. Rien ne change avant « Enregistrer ».
// Le brouillon survit à un nouveau rendu (fin de repos pendant la correction).
let setDraft = null;
export function editSetView({ i, k }) {
  const a = state.active, e = a?.entries[+i], s = e?.sets[+k];
  if (!s) { leaveIfIdle(location.hash); setTimeout(() => go("#/seance")); return { el: h("div") }; }
  const ex = exercise(e.exerciseId), interval = isInterval(e), what = interval ? "round" : "série";
  if (setDraft?.key !== location.hash) setDraft = { key: location.hash, weight: s.weight, reps: s.reps, rpe: s.rpe ?? null };
  const draft = setDraft;
  const done = () => { setDraft = null; go("#/seance"); };
  const ok = () => { editSet(+i, +k, draft); toast(`${what === "round" ? "Round" : "Série"} ${+k + 1} corrigé${what === "série" ? "e" : ""}`); done(); };
  const remove = () => confirmSheet({
    title: `Retirer ${interval ? "ce round" : "cette série"} ?`,
    message: `${charge(equipOf(e), s.weight)} × ${s.reps} sur ${ex.name} : ${interval ? "le round sort" : "la série sort"} de la séance, tu pourras ${interval ? "le" : "la"} refaire.`,
    confirmLabel: `Retirer ${interval ? "le round" : "la série"}`, cancelLabel: "Garder", destructive: true,
    onConfirm: () => { deleteSet(+i, +k); done(); }
  });
  const el = h("div", { class: "screen no-tabs big-targets" },
    navbar({ back: { label: "Séance", href: "#/seance" }, title: `${what === "round" ? "Round" : "Série"} ${+k + 1}`, subtitle: niceName(ex.name) }),
    h("div", { class: "scroll" },
      h("p", { class: "caption", style: { margin: 0 } }, `Validée à ${new Date(s.doneAt || a.startedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}. Corrige une erreur de saisie : le reste de la séance ne bouge pas.`),
      chargeStepper({ equip: equipOf(e), ex: { ...ex, ratio: s.ratio }, value: draft.weight, onChange: v => { draft.weight = v; } }),
      h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, "Reps"),
        stepper({ value: draft.reps, min: 0, max: 200, compact: true, label: "reps", onChange: v => { draft.reps = v; } })),
      !interval && rpeField(draft.rpe, v => { draft.rpe = v; }),
      btn("Enregistrer", { variant: "primary", size: "lg", full: true, onClick: ok }),
      btn(`Retirer ${interval ? "le round" : "la série"}`, { variant: "ghost", full: true, icon: "trash", onClick: remove })));
  return { el };
}

export function summaryView({ id }) {
  const s = session(id);
  if (!s) { setTimeout(() => go("#/")); return { el: h("div") }; }
  const records = sessionRecords(s);
  const dur = (s.endedAt - s.startedAt) / 1000;
  const el = h("div", { class: "screen no-tabs" },
    pageHead("Séance terminée", `${s.name} · ${dateLong(s.startedAt)} · Bloc ${CYCLES[s.cycle]?.label || ""} ${s.deload ? "deload" : `S${s.week}`}`),
    h("div", { class: "scroll" },
      h("div", { class: "stat-grid" },
        h("div", { class: "stat" }, h("span", { class: "caption" }, "Durée"), h("b", null, clock(dur))),
        h("div", { class: "stat" }, h("span", { class: "caption" }, "Séries"), h("b", null, sessionSets(s))),
        h("div", { class: "stat" }, h("span", { class: "caption" }, "Volume"), h("b", null, `${int(sessionVolume(s))} kg`))),
      records.length > 0 && h("div", { class: "card" },
        h("div", { class: "card-head", style: { justifyContent: "flex-start", gap: "8px" } }, h("span", { class: "trophy" }, icon("trophy")),
          h("h2", { class: "heading-md" }, `${records.length} record${records.length > 1 ? "s" : ""} battu${records.length > 1 ? "s" : ""}`)),
        records.map(r => h("div", { class: "field-row" },
          h("span", { class: "body-md fort" }, exercise(r.exerciseId).name),
          pill(`1RM est. ${num(r.value)} kg (+${num(r.delta)})`, "succes")))),
      h("div", { class: "list" }, s.entries.map(e => h("button", { class: "row", onClick: () => go(`#/progres/${e.exerciseId}`) },
        h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, exercise(e.exerciseId).name),
          h("span", { class: "caption num" }, (isInterval(e) ? `${FORMATS[e.format]} · ${e.sets.length} rounds · ` : e.format === "amrap" ? `AMRAP · ${e.sets.length} tours · ` : "") + e.sets.map(x => `${x.reps}×${x.weight ? num(x.weight) : "PDC"}`).join(" · "))),
        icon("caretRight", "chev")))),
      s.note && h("div", { class: "card flat" }, h("span", { class: "overline" }, "Journal"), h("p", { class: "body-md", style: { margin: 0 } }, s.note)),
      btn("Retour à l'accueil", { variant: "primary", size: "lg", full: true, onClick: () => go("#/") }),
      btn("Supprimer la séance", { variant: "danger", full: true, onClick: () => confirmSheet({
        title: "Supprimer la séance ?",
        message: "Enregistrée par erreur ? Elle disparaît de l'historique, des courbes et de l'objectif de la semaine.",
        confirmLabel: "Supprimer définitivement", cancelLabel: "Garder la séance", destructive: true,
        onConfirm: () => { deleteSession(s.id); go("#/"); toast("Séance supprimée"); }
      }) })));
  return { el };
}

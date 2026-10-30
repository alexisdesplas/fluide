// Données de l'appli, rangées selon le Système Fluide : profil + matrice de volume, cycle en cours,
// exercices (avec préférences), séances types, séances faites, habitudes. Tout vit dans le localStorage.

import { CATALOGUE } from "./exercices.js";

const KEY = "fluid-v1";
const DAY = 86400000;

export const MUSCLES = ["Pecs", "Dos", "Épaules", "Biceps", "Triceps", "Quadris", "Ischios", "Fessiers", "Mollets", "Abdos"];
// Groupes du catalogue hors matrice Fluide : leurs séries ne comptent pas dans l'objectif.
export const GROUPS = [...MUSCLES, "Avant-bras", "Échauffement", "Mobilité"];

export const STATUS = {
  maintien: { label: "Maintenir", range: [4, 8], def: 6 },
  focus: { label: "Progresser", range: [10, 16], def: 12 },
  faible: { label: "Point faible", range: [16, 22], def: 18 }
};

export const CYCLES = {
  volume: { label: "Volume", desc: "Beaucoup de séries, RPE 6-8, reps 8-15. On accumule le travail.", rpe: 7 },
  intensite: { label: "Intensité", desc: "Charges lourdes, volume réduit, RPE 8-9, reps 4-8.", rpe: 8.5 },
  specialisation: { label: "Spécialisation", desc: "Volume concentré sur 1-2 points faibles, le reste en maintien.", rpe: 8 }
};

export const PREFS = {
  aime: "Favori",
  neutre: "Neutre",
  evite: "Je n'aime pas",
  douleur: "Douleur"
};

// Formats d'un exercice. EMOM : un round par intervalle ; Tabata : effort / repos.
export const FORMATS = { series: "Séries", emom: "EMOM", tabata: "Tabata" };
export const FORMAT_DEFAULTS = {
  emom: { rounds: 10, every: 60, repsMin: 5, repsMax: 5 },
  tabata: { rounds: 8, work: 20, off: 10, repsMin: 10, repsMax: 10 }
};
export const isInterval = x => x?.format === "emom" || x?.format === "tabata";

// Équivalence pour l'objectif Fluide : un Tabata de 8 rounds compte 2 séries, un EMOM 1 série par tranche de 3 minutes.
const roundsToSets = (format, rounds) => (format === "tabata" ? Math.ceil(rounds / 4) : format === "emom" ? Math.ceil(rounds / 3) : rounds);
export const entrySets = e => (isInterval(e) ? roundsToSets(e.format, e.sets.length) : e.sets.length);
export const itemSets = it => (isInterval(it) ? roundsToSets(it.format, it.rounds) : it.sets);

// Matériel d'un exercice : il fixe les pas de charge (barre, haltères à l'unité, pile de la machine en lbs).
export const EQUIPS = { barre: "Barre", halteres: "Haltères", poulie: "Poulie", machine: "Machine", smith: "Smith", kettlebell: "Kettlebell", elastique: "Élastique", pdc: "Poids du corps" };

// Anciens noms de Fluide → noms de la base d'exercices : l'historique suit, l'id ne change pas.
const RENAMED = {
  "Développé couché": "Développé couché avec barre", "Développé incliné haltères": "Développé incliné avec haltères", "Écarté poulie": "Écartés à la poulie",
  "Pec deck": "Écarté à la machine pour pectoraux", "Dips": "Dips pour les pectoraux", "Tractions": "Traction", "Rowing barre": "Rowing barre buste penché",
  "Tirage vertical": "Tirage vertical à la poulie", "Tirage horizontal": "Rowing assis à la poulie", "Rowing haltère": "Rowing unilatéral avec haltère",
  "Rowing machine": "Rowing poitrine appuyée à la machine", "Développé épaules machine": "Presse à épaules à la machine",
  "Élévations latérales": "Élévation latérale avec haltères", "Élévations latérales poulie": "Élévation latérale à la poulie", "Face pull": "Face pull à la poulie",
  "Oiseau poulie": "Élévation Latérale Arrière Assise au Câble", "Curl barre": "Curl à la barre", "Curl marteau": "Curl prise marteau", "Curl incliné": "Curl incliné assis pour biceps",
  "Curl poulie": "Curl biceps à la barre avec câble", "Extension poulie": "Extension des triceps à la poulie avec barre droite",
  "Barre au front": "Extension des triceps allongé à la barre EZ", "Extension nuque": "Extension des triceps assis avec haltères", "Squat": "Squat avec barre",
  "Fentes bulgares": "Squat bulgare avec haltères", "Leg extension": "Extension des jambes", "Soulevé de terre roumain": "Soulevé de terre roumain",
  "Leg curl": "Curl des ischio-jambiers en position couchée", "Hip thrust": "Hip thrust à la barre", "Abduction machine": "Abduction de la hanche assis",
  "Mollets debout": "Élévation des mollets debout à la machine", "Mollets presse": "Presse à mollets", "Crunch poulie": "Crunch à la poulie à genoux",
  "Relevés de jambes": "Élévation des jambes suspendues"
};
const fromCatalogue = ([name, muscle, equip, photo, rank]) => ({ id: uid(), name, muscle, equip, photo, rank, pref: "neutre", note: "" });
// Photos du mouvement (départ, arrivée) servies par jsDelivr, figées sur une version du dépôt free-exercise-db.
const PHOTOS = "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises";
export const exercisePhotos = e => (e?.photo && !e.photo.startsWith("edb:") ? [0, 1].map(i => `${PHOTOS}/${e.photo}/${i}.jpg`) : null);
// Essai : animation 3D d'ExerciseDB (version gratuite, licence des GIF non écrite, à ne pas garder sans accord).
export const exerciseGif = e => (e?.photo?.startsWith("edb:") ? `https://static.exercisedb.dev/media/${e.photo.slice(4)}.gif` : null);
export const hasMovement = e => Boolean(exercisePhotos(e) || exerciseGif(e));

// Charges possibles selon le matériel. Machine et poulie : pile par 5 lbs, affichée en kg comme sur la plaque (2,3 · 4,5 · 6,8…).
const range = (from, to, step) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => Math.round((from + i * step) * 100) / 100);
const LB = 0.45359237;
const SCALES = {
  barre: range(0, 300, 2.5),
  smith: range(0, 300, 2.5),
  pdc: range(0, 100, 2.5),
  elastique: range(0, 100, 2.5),
  kettlebell: [0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48],
  halteres: [0, ...range(1, 10, 1), ...range(12, 60, 2)],
  machine: range(0, 300, 5).map(lb => Math.round(lb * LB * 10) / 10),
  poulie: range(0, 300, 5).map(lb => Math.round(lb * LB * 10) / 10)
};
export const weightScale = equip => SCALES[equip] || SCALES.barre;
export const nearestWeight = (equip, w) => weightScale(equip).reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a));
export const nextWeight = (equip, w) => weightScale(equip).find(x => x > w + 0.01) ?? w;
export const lbs = (equip, w) => ((equip === "machine" || equip === "poulie") && w ? `${Math.round(w / LB / 5) * 5} lbs` : null);
// Les haltères se comptent à l'unité : la moitié de la barre, et inversement.
const convertWeight = (from, to, w) => nearestWeight(to, to === "halteres" && from !== "halteres" ? w / 2 : from === "halteres" && to !== "halteres" ? w * 2 : w);
// Matériel d'une ligne de séance : celui choisi pour la séance, sinon celui de l'exercice.
export const equipOf = e => e.equip || exercise(e.exerciseId)?.equip || "barre";

// Haut / Bas sur 4 jours : chaque muscle 2x par semaine (noms de la base d'exercices).
const SEED_TEMPLATES = [
  ["Haut A", [["Développé couché avec barre", 3, 6, 10, 60, 150], ["Rowing barre buste penché", 3, 8, 12, 50, 120], ["Développé militaire", 3, 8, 12, 35, 120], ["Élévation latérale avec haltères", 3, 12, 15, 8, 60], ["Curl à la barre", 2, 10, 12, 25, 60], ["Extension des triceps à la poulie avec barre droite", 2, 10, 12, 25, 60]]],
  ["Bas A", [["Squat avec barre", 3, 6, 10, 80, 180], ["Soulevé de terre roumain", 3, 8, 12, 60, 120], ["Extension des jambes", 2, 12, 15, 40, 60], ["Élévation des mollets debout à la machine", 3, 10, 15, 40, 60], ["Crunch à la poulie à genoux", 2, 10, 15, 30, 60]]],
  ["Haut B", [["Traction", 3, 6, 10, 0, 150], ["Développé incliné avec haltères", 3, 8, 12, 22, 120], ["Rowing assis à la poulie", 3, 10, 12, 50, 90], ["Face pull à la poulie", 2, 12, 15, 15, 60], ["Curl prise marteau", 2, 10, 12, 14, 60], ["Extension des triceps allongé à la barre EZ", 2, 10, 12, 25, 60]]],
  ["Bas B", [["Presse à cuisses", 3, 10, 12, 120, 120], ["Hip thrust à la barre", 3, 8, 12, 80, 120], ["Curl des ischio-jambiers en position couchée", 3, 10, 12, 35, 60], ["Presse à mollets", 3, 12, 15, 80, 60], ["Élévation des jambes suspendues", 2, 10, 15, 0, 60]]]
];

export const uid = () => Math.random().toString(36).slice(2, 10);
export const dayKey = (t = Date.now()) => new Date(t).toLocaleDateString("sv-SE"); // AAAA-MM-JJ, heure locale
export const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const startOfWeek = t => { const d = new Date(startOfDay(t)); return d.getTime() - ((d.getDay() + 6) % 7) * DAY; };

function seed() {
  const exercises = CATALOGUE.map(fromCatalogue);
  const byName = n => exercises.find(e => e.name === n).id;
  const templates = SEED_TEMPLATES.map(([name, items]) => ({
    id: uid(), name,
    items: items.map(([ex, sets, repsMin, repsMax, weight, rest]) => ({ id: uid(), exerciseId: byName(ex), sets, repsMin, repsMax, weight: nearestWeight(exercises.find(e => e.name === ex).equip, weight), rest }))
  }));
  const matrix = {};
  for (const m of MUSCLES) matrix[m] = { status: ["Pecs", "Dos", "Épaules", "Quadris"].includes(m) ? "focus" : "maintien" };
  for (const m of MUSCLES) matrix[m].target = STATUS[matrix[m].status].def;
  return {
    version: 1,
    profile: { goal: "Prise de muscle", level: "Intermédiaire", days: 4, split: "hautbas", stepsTarget: 8000, warmup: "Corde à sauter 3-5 min" },
    matrix,
    cycle: { type: "volume", start: startOfWeek(Date.now()), weeks: 6 },
    cycles: [],
    exercises, templates,
    sessions: [], habits: {}, active: null
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {}
  return seed();
}

// Données d'avant la base d'exercices : les anciens noms sont renommés (même id, l'historique suit),
// puis chaque exercice de la base est ajouté ou complété (muscle, matériel, photos, popularité).
function migrate(st) {
  for (const e of st.exercises) if (RENAMED[e.name] && !st.exercises.some(x => x.name === RENAMED[e.name])) e.name = RENAMED[e.name];
  const byName = new Map(st.exercises.map(e => [e.name, e]));
  for (const row of CATALOGUE) {
    const e = byName.get(row[0]);
    if (!e) st.exercises.push(fromCatalogue(row));
    else { Object.assign(e, { muscle: row[1], equip: e.rank !== undefined ? e.equip : e.equip || row[2], photo: row[3], rank: row[4] }); delete e.sw; }
  }
  for (const e of st.exercises) e.equip = e.equip || "barre";
  return st;
}

export let state = load();
const listeners = new Set();

// quiet : on enregistre sans redessiner (steppers, champs en cours de saisie).
// Chaque enregistrement prévient aussi la synchro du compte, s'il y en a un.
const persisters = new Set();
export function save(quiet = false) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  persisters.forEach(fn => fn());
  if (!quiet) listeners.forEach(fn => fn());
}
export const subscribe = fn => listeners.add(fn);
export const onPersist = fn => persisters.add(fn);

// Import d'un fichier ou données du compte : on les remet au format du jour avant de les prendre.
export function replaceState(next) {
  state = migrate(next);
  save();
}

// ——— Lecture

export const exercise = id => state.exercises.find(e => e.id === id);
export const template = id => state.templates.find(p => p.id === id);
export const session = id => state.sessions.find(s => s.id === id);

// Où on en est dans le bloc : semaines 1 à N, puis une semaine de deload.
export function cyclePosition(t = Date.now()) {
  const c = state.cycle;
  const week = Math.floor((startOfWeek(t) - startOfWeek(c.start)) / (7 * DAY)) + 1;
  const deload = week === c.weeks + 1;
  const over = week > c.weeks + 1;
  return { week, weeks: c.weeks, deload, over, label: CYCLES[c.type].label };
}

// 1RM estimé (Epley) : une série de 1 rep vaut sa charge.
export const e1rm = (w, r) => (r <= 1 ? w : w * (1 + r / 30));

export const setVolume = s => s.weight * s.reps;
export const sessionVolume = s => s.entries.reduce((a, e) => a + e.sets.reduce((b, x) => b + setVolume(x), 0), 0);
// Séries au sens Fluide : un Tabata de 8 rounds compte 2 séries, un EMOM 1 série par tranche de 3 rounds.
export const sessionSets = s => s.entries.reduce((a, e) => a + entrySets(e), 0);

export const history = () => [...state.sessions].sort((a, b) => b.startedAt - a.startedAt);

// Séries faites par muscle sur une semaine (lundi → dimanche), séance en cours comprise.
export function weeklySets(t = Date.now()) {
  const from = startOfWeek(t), to = from + 7 * DAY;
  const out = Object.fromEntries(MUSCLES.map(m => [m, 0]));
  const all = state.active ? [...state.sessions, state.active] : state.sessions;
  for (const s of all) {
    if (s.startedAt < from || s.startedAt >= to) continue;
    for (const e of s.entries) {
      const m = exercise(e.exerciseId)?.muscle;
      if (m in out) out[m] += entrySets(e);
    }
  }
  return out;
}

// Compteur Fluide de la semaine : part de la cible remplie, muscle par muscle, plafonnée à 100 %
// pour qu'un muscle en trop ne compense pas un muscle en retard.
export function weeklyGoal(t = Date.now()) {
  const done = weeklySets(t);
  let filled = 0, total = 0, ok = 0, count = 0, sets = 0;
  for (const m of MUSCLES) {
    const target = state.matrix[m].target;
    if (!target) continue;
    count++; total += target; sets += done[m];
    filled += Math.min(done[m], target);
    if (done[m] >= target) ok++;
  }
  return { pct: total ? Math.round((filled / total) * 100) : 0, ok, count, sets, total };
}

// Ordre de proposition : favoris, puis exercices déjà faits, puis les plus courants de la base.
const PREF_RANK = { aime: 0, neutre: 1, evite: 2, douleur: 3 };
export const byUsefulness = (a, b) => PREF_RANK[a.pref] - PREF_RANK[b.pref] || (lastPerformance(b.id) ? 1 : 0) - (lastPerformance(a.id) ? 1 : 0) || (a.rank ?? 999) - (b.rank ?? 999) || a.name.localeCompare(b.name);

// Alternatives quand la machine est prise : même muscle, jamais un exercice en douleur.
export function alternatives(exerciseId) {
  const ex = exercise(exerciseId);
  return state.exercises.filter(e => e.id !== exerciseId && e.muscle === ex.muscle && e.pref !== "douleur").sort(byUsefulness);
}

// Durée estimée : 45 s d'effort par série + le repos prévu, plus l'échauffement.
export const estimate = t => Math.round((t.items.reduce((a, it) =>
  a + (it.format === "emom" ? it.rounds * it.every : it.format === "tabata" ? it.rounds * (it.work + it.off) + 60 : it.sets * (45 + it.rest)), 0) + 300) / 60);

// Séries prévues par muscle si on fait chaque séance type une fois.
export const plannedSets = () => plannedSetsOf(state.templates);

// Performances d'un exercice, une ligne par séance, de la plus ancienne à la plus récente.
// Les rounds d'EMOM et de Tabata n'y entrent pas : charges sous-maximales, elles fausseraient le 1RM.
export function exerciseHistory(exerciseId, before = Infinity) {
  const rows = [];
  for (const s of state.sessions) {
    if (s.startedAt >= before) continue;
    const sets = s.entries.filter(e => e.exerciseId === exerciseId && !isInterval(e)).flatMap(e => e.sets);
    if (!sets.length) continue;
    rows.push({
      sessionId: s.id, date: s.startedAt, sets,
      best1rm: Math.max(...sets.map(x => e1rm(x.weight, x.reps))),
      maxWeight: Math.max(...sets.map(x => x.weight)),
      volume: sets.reduce((a, x) => a + setVolume(x), 0)
    });
  }
  return rows.sort((a, b) => a.date - b.date);
}

export const lastPerformance = (exerciseId, before) => exerciseHistory(exerciseId, before).at(-1) || null;

// Double progression : on monte les reps dans la fourchette, puis la charge quand le haut est atteint partout.
export function suggestion(item, before) {
  const last = lastPerformance(item.exerciseId, before);
  if (!last) return { weight: item.weight, reps: item.repsMin, hint: null, last: null };
  const top = Math.max(...last.sets.map(s => s.weight));
  const work = last.sets.filter(s => s.weight === top);
  const minReps = Math.min(...work.map(s => s.reps));
  if (top > 0 && work.length >= item.sets && minReps >= item.repsMax) {
    return { weight: nextWeight(exercise(item.exerciseId)?.equip, top), reps: item.repsMin, hint: "charge", last };
  }
  return { weight: top, reps: Math.min(item.repsMax, minReps + 1), hint: "reps", last };
}

// Records battus dans une séance : meilleur 1RM estimé de l'exercice, comparé à tout ce qui précède.
export function sessionRecords(s) {
  const out = [];
  for (const e of s.entries) {
    if (!e.sets.length) continue;
    const best = Math.max(...e.sets.map(x => e1rm(x.weight, x.reps)));
    const prev = exerciseHistory(e.exerciseId, s.startedAt);
    if (!prev.length) continue;
    const prevBest = Math.max(...prev.map(p => p.best1rm));
    if (best > prevBest + 0.01) out.push({ exerciseId: e.exerciseId, value: best, delta: best - prevBest });
  }
  return out;
}

export const habit = (key = dayKey()) => state.habits[key] || {};

// Moyenne des pas sur les 7 derniers jours renseignés.
export function stepsAverage(days = 7) {
  const vals = [];
  for (let i = 0; i < days; i++) {
    const v = state.habits[dayKey(Date.now() - i * DAY)]?.steps;
    if (v) vals.push(v);
  }
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}

// ——— Écriture : profil, matrice, cycle

export function setMatrix(muscle, status) {
  state.matrix[muscle] = { status, target: STATUS[status].def };
  save();
}

export function setMuscle(muscle, status, target) {
  state.matrix[muscle] = { status, target: Math.max(0, target) };
  save();
}

export function setTarget(muscle, target) {
  state.matrix[muscle].target = Math.max(0, target);
  save(true);
}

export function startCycle(type, weeks = 6) {
  const pos = cyclePosition();
  state.cycles.push({ ...state.cycle, end: Date.now(), reached: Math.min(pos.week, state.cycle.weeks + 1) });
  state.cycle = { type, start: startOfWeek(Date.now()), weeks };
  save();
}

// Avance le deload à cette semaine quand le ressenti chute avant la fin du bloc.
export function deloadNow() {
  state.cycle.start = startOfWeek(Date.now()) - state.cycle.weeks * 7 * DAY;
  save();
}

export function setHabit(key, field, value, quiet) {
  state.habits[key] = { ...state.habits[key], [field]: value };
  save(quiet);
}

export function toggleFav(exerciseId) {
  const e = exercise(exerciseId);
  e.pref = e.pref === "aime" ? "neutre" : "aime";
  save(true);
}

export function setPref(exerciseId, pref) {
  exercise(exerciseId).pref = pref;
  save();
}

// ——— Programmes : un split génère les séances types, réglées sur la matrice Fluide.
const LEGS = ["Quadris", "Ischios", "Fessiers", "Mollets", "Abdos"];
const UPPER = ["Pecs", "Dos", "Épaules", "Biceps", "Triceps"];
export const SPLITS = {
  fullbody2: { label: "Full body × 2", days: 2, desc: "Tout le corps deux fois par semaine : le minimum pour que chaque muscle revienne 2 fois.",
    sessions: [["Full body A", [...UPPER, ...LEGS]], ["Full body B", [...UPPER, ...LEGS]]] },
  fullbody: { label: "Full body", days: 3, desc: "Tout le corps à chaque séance. Idéal à 3 séances, chaque muscle 3 fois par semaine.",
    sessions: [["Full body A", [...UPPER, ...LEGS]], ["Full body B", [...UPPER, ...LEGS]], ["Full body C", [...UPPER, ...LEGS]]] },
  hautbas: { label: "Haut / Bas", days: 4, desc: "Haut du corps, bas du corps, deux fois chacun. Chaque muscle 2 fois par semaine.",
    sessions: [["Haut A", UPPER], ["Bas A", LEGS], ["Haut B", UPPER], ["Bas B", LEGS]] },
  ppl: { label: "Push / Pull / Legs", days: 3, desc: "Pousser, tirer, jambes. Chaque muscle une fois : simple, mais moins de fréquence.",
    sessions: [["Push", ["Pecs", "Épaules", "Triceps"]], ["Pull", ["Dos", "Biceps"]], ["Legs", LEGS]] },
  ppl6: { label: "Push / Pull / Legs × 2", days: 6, desc: "Le PPL deux fois par semaine : chaque muscle 2 fois, beaucoup de volume.",
    sessions: [["Push A", ["Pecs", "Épaules", "Triceps"]], ["Pull A", ["Dos", "Biceps"]], ["Legs A", LEGS], ["Push B", ["Pecs", "Épaules", "Triceps"]], ["Pull B", ["Dos", "Biceps"]], ["Legs B", LEGS]] },
  hautbasppl: { label: "Haut / Bas + PPL", days: 5, desc: "Haut, Bas, puis Push, Pull, Legs. Chaque muscle 2 fois en 5 séances.",
    sessions: [["Haut", UPPER], ["Bas", LEGS], ["Push", ["Pecs", "Épaules", "Triceps"]], ["Pull", ["Dos", "Biceps"]], ["Legs", LEGS]] },
  muscle: { label: "Un muscle par séance", days: 5, desc: "Pecs, Dos, Jambes, Épaules, Bras. Gros volume par séance, chaque muscle 1 fois.",
    sessions: [["Pecs et abdos", ["Pecs", "Abdos"]], ["Dos", ["Dos"]], ["Jambes", ["Quadris", "Ischios", "Fessiers", "Mollets"]], ["Épaules", ["Épaules"]], ["Bras", ["Biceps", "Triceps"]]] },
  perso: { label: "Personnalisé", days: null, desc: "Tu crées tes séances toi-même, exercice par exercice.", sessions: [] }
};
const BIG = ["Pecs", "Dos", "Quadris", "Ischios", "Fessiers"];
const LEGS_MAIN = ["Quadris", "Ischios", "Fessiers"];

// Temps par séance proposé (échauffement compris).
export const SESSION_MINUTES = [30, 45, 60, 75, 90];

// Objectif longue durée : un sport d'endurance pratiqué à côté de la muscu. Il pèse sur les jambes :
// le programme garde son jour long loin des séances jambes et prend en charge le renfo que son plan demande.
// Plan corde, semaine par semaine : [blocs, effort, repos] en secondes pour les séances faciles puis le jour long.
// Deload les semaines 3, 7, 11 et 15 ; tentative de l'heure en semaine 18. Le jour récup ne change pas.
const CORDE = [
  [[6, 60, 30], [5, 120, 60]], [[10, 60, 30], [4, 180, 60]], [[7, 60, 30], [5, 120, 60]], [[8, 120, 30], [2, 300, 60]],
  [[3, 300, 60], [1, 480, 0]], [[3, 360, 60], [1, 600, 0]], [[2, 300, 60], [1, 480, 0]], [[3, 480, 60], [1, 900, 0]],
  [[2, 720, 60], [1, 1200, 0]], [[2, 900, 60], [1, 1500, 0]], [[2, 600, 60], [1, 1200, 0]], [[1, 1500, 0], [1, 2100, 0]],
  [[1, 1200, 0], [1, 2400, 0]], [[1, 1500, 0], [1, 2700, 0]], [[1, 900, 0], [1, 2100, 0]], [[1, 1500, 0], [1, 3000, 0]],
  [[1, 1800, 0], [1, 3300, 0]], [[1, 900, 0], [1, 3600, 0]]
];
export const ENDURANCE = {
  corde: { label: "Corde à sauter · 1 h non-stop", short: "Corde à sauter", desc: "18 semaines, tous les jours : 5 séances faciles, 1 jour long, 1 jour récup.",
    calves: { sets: 2, reps: 15, per: 3 },
    weeks: CORDE.map(([easy, long], i) => ({ easy, long, deload: [3, 7, 11, 15].includes(i + 1) })), recup: [5, 60, 30] }
};

// Blocs d'une séance d'endurance : « 10 × 1 min / 30 s », « 8 min non-stop » ; et leur durée totale en secondes.
const span = sec => (sec % 60 ? `${sec} s` : `${sec / 60} min`);
export const blocksLabel = ([n, work, rest]) => (n === 1 ? `${span(work)} non-stop` : `${n} × ${span(work)} / ${span(rest)}`);
export const blocksTotal = ([n, work, rest]) => n * work + (n - 1) * rest;

// Semaine du plan d'endurance : comptée depuis la semaine 1 (réglée dans « Ta semaine »), bornée à la durée du plan.
export function enduranceWeek(t = Date.now()) {
  const p = state.profile, e = ENDURANCE[p.endurance];
  if (!e?.weeks) return null;
  const w = p.enduranceStart == null ? 1 : Math.floor((startOfWeek(t) - startOfWeek(p.enduranceStart)) / (7 * DAY)) + 1;
  return Math.min(e.weeks.length, Math.max(1, w));
}
export function setEnduranceWeek(week) {
  state.profile.enduranceStart = startOfWeek(Date.now()) - (week - 1) * 7 * DAY;
  save(true);
}

// Séance d'endurance du jour : facile, longue ou récup selon la semaine type du programme en place.
export function enduranceToday(t = Date.now()) {
  const p = state.profile, e = ENDURANCE[p.endurance];
  if (!e?.weeks) return null;
  const week = enduranceWeek(t), plan = e.weeks[week - 1];
  const kind = weekPlan(state.templates, p.endurance)[(new Date(t).getDay() + 6) % 7].endurance;
  return { week, kind, deload: plan.deload, blocks: kind === "long" ? plan.long : kind === "recup" ? e.recup : plan.easy };
}

const musclesOf = t => new Set(t.items.map(it => exercise(it.exerciseId)?.muscle));
export const hasLegs = t => [...musclesOf(t)].some(m => LEGS_MAIN.includes(m));

// Génère les séances d'un split : séries par muscle = cible ÷ nombre de séances où il revient,
// réparties en 1 ou 2 exercices ; favoris d'abord, jamais un exercice en douleur, un exercice différent à chaque passage.
// minutes : chaque séance est ramenée sous ce temps. endurance : la corde remplace le travail des mollets par le renfo de son plan,
// et les jambes ne travaillent que 2 fois par semaine (au-delà, la séance garde le haut du corps et les abdos).
// pools : tri des exercices par muscle, partagé quand on génère plusieurs programmes d'affilée.
export function generateProgram(key, { minutes, endurance } = {}, pools = {}) {
  const split = SPLITS[key];
  const calves = ENDURANCE[endurance]?.calves;
  const maxLegs = ENDURANCE[endurance] ? 2 : Infinity;
  let legs = 0;
  const plan = split.sessions.map(([name, ms]) => (ms.some(m => LEGS_MAIN.includes(m)) && ++legs > maxLegs
    ? [name.replace("Full body", "Haut"), ms.filter(m => !LEGS.includes(m) || m === "Abdos")] : [name, ms]));
  const freq = {}; for (const [, ms] of plan) for (const m of ms) freq[m] = (freq[m] || 0) + 1;
  const pool = m => (pools[m] ||= state.exercises.filter(e => e.muscle === m && e.pref !== "douleur" && e.equip !== "elastique" && e.equip !== "kettlebell").sort(byUsefulness));
  // Un exercice différent à chaque passage ; prefer choisit d'abord parmi ceux qui conviennent (barre pour le premier d'un gros muscle).
  const taken = new Set();
  const pick = (m, prefer = () => true) => {
    const p = pool(m); if (!p.length) return null;
    let ex = p.find(e => !taken.has(e.id) && prefer(e)) || p.find(e => !taken.has(e.id));
    if (!ex) { p.forEach(e => taken.delete(e.id)); ex = p.find(prefer) || p[0]; }
    taken.add(ex.id);
    return ex;
  };
  const free = e => e.equip === "barre" || e.equip === "smith";
  const cyc = state.cycle.type;
  const known = id => state.templates.flatMap(t => t.items).find(i => i.exerciseId === id);
  // Muscle à définir : séries longues et repos courts, pas de charge lourde.
  const define = state.profile.define || [];
  const item = (ex, m, sets, heavy) => {
    if (define.includes(m)) heavy = false;
    const last = lastPerformance(ex.id);
    const [repsMin, repsMax] = cyc === "intensite" ? (heavy ? [4, 6] : [6, 10]) : heavy ? [6, 10] : BIG.includes(m) ? [8, 12] : [10, 15];
    const weight = last ? last.maxWeight : known(ex.id) ? known(ex.id).weight : BIG.includes(m) ? 20 : 8;
    if (define.includes(m)) return { id: uid(), exerciseId: ex.id, format: "series", sets, repsMin: 12, repsMax: 20, weight, rest: 60 };
    return { id: uid(), exerciseId: ex.id, format: "series", sets, repsMin, repsMax, weight, rest: heavy ? 150 : BIG.includes(m) ? 120 : 75 };
  };
  const sessions = plan.map(([name, muscles]) => {
    const items = [];
    const order = [...muscles.filter(m => BIG.includes(m)), ...muscles.filter(m => !BIG.includes(m))];
    for (const m of order) {
      const target = state.matrix[m].target; if (!target || (calves && m === "Mollets")) continue;
      const sets = Math.max(1, Math.round(target / freq[m]));
      // Pas plus de 4 séries par exercice : 12 séries deviennent 3 exercices de 4.
      const count = Math.ceil(sets / 4), parts = Array.from({ length: count }, (_, i) => Math.floor(sets / count) + (i < sets % count ? 1 : 0));
      for (const [j, n] of parts.entries()) {
        const ex = pick(m, j === 0 && BIG.includes(m) ? free : undefined); if (!ex) continue;
        items.push(item(ex, m, n, items.length === 0 && BIG.includes(m)));
      }
    }
    return { id: uid(), name, items };
  });
  // Corde : montées sur pointes lentes en fin de séance, 3 fois par semaine, d'abord les jours jambes.
  const keep = new Set();
  const ex = calves && pick("Mollets", e => !/assis/i.test(e.name));
  if (ex) [...sessions].sort((a, b) => hasLegs(b) - hasLegs(a)).slice(0, calves.per).forEach(t => {
    const it = { ...item(ex, "Mollets", calves.sets, false), repsMin: calves.reps, repsMax: calves.reps, rest: 60 };
    t.items.push(it); keep.add(it.id);
  });
  // Plancher de la semaine : le bas de la fourchette Fluide du muscle (ou sa cible si elle est plus basse),
  // réparti sur ses séances pour qu'une séance ne prenne pas toute la marge.
  const setsIn = (t, m) => t.items.reduce((a, it) => a + (exercise(it.exerciseId).muscle === m ? it.sets : 0), 0);
  const low = m => Math.min(state.matrix[m].target, STATUS[state.matrix[m].status].range[0]);
  const canCut = (m, t) => sessions.reduce((a, s) => a + setsIn(s, m), 0) > low(m) && setsIn(t, m) > Math.floor(low(m) / freq[m]);
  for (const t of sessions) fitTime(t, minutes, keep, canCut);
  return sessions;
}

// Séance trop longue pour le temps donné : repos raccourcis d'abord, puis une série en moins sur les exercices
// les moins prioritaires (maintenir avant progresser avant point faible, isolation avant polyarticulaires).
// On reste d'abord dans la fourchette Fluide de chaque muscle ; on n'en sort que si le temps ne suffit vraiment pas.
const PRIORITY = { maintien: 0, focus: 1, faible: 2 };
function fitTime(t, minutes, keep, canCut) {
  if (!minutes || estimate(t) <= minutes) return;
  for (const it of t.items) it.rest = Math.max(60, it.rest - 30);
  const muscle = it => exercise(it.exerciseId).muscle;
  const score = it => PRIORITY[state.matrix[muscle(it)].status] * 10 + (BIG.includes(muscle(it)) ? 5 : 0) - it.sets;
  const trim = ok => {
    while (estimate(t) > minutes) {
      const cut = t.items.filter(it => !keep.has(it.id) && ok(it));
      if (!cut.length) return;
      const it = cut.reduce((a, b) => (score(b) < score(a) ? b : a));
      if (--it.sets === 0) t.items = t.items.filter(x => x !== it);
    }
  };
  trim(it => it.sets > 1 && canCut(muscle(it), t));
  trim(it => it.sets > 1);
  trim(() => true);
}

// Recommandation pour une semaine donnée (séances dispo, minutes par séance, objectif longue durée) :
// chaque programme est généré pour cette semaine, puis classé. Il doit tenir dans les séances dispo,
// couvrir la cible Fluide, garder chaque muscle dans sa fourchette, le faire revenir 2 fois.
// short : muscles ramenés vers le bas de leur fourchette pour tenir le temps ; below : muscles passés sous leur fourchette.
export function recommend({ days, minutes, endurance }) {
  const pools = {};
  const calves = ENDURANCE[endurance]?.calves;
  const counted = MUSCLES.filter(m => state.matrix[m].target > 0 && !(calves && m === "Mollets"));
  const total = counted.reduce((a, m) => a + state.matrix[m].target, 0);
  return Object.keys(SPLITS).filter(k => k !== "perso").map(key => {
    const templates = generateProgram(key, { minutes, endurance }, pools);
    const planned = plannedSetsOf(templates);
    const coverage = total ? Math.round((counted.reduce((a, m) => a + Math.min(planned[m], state.matrix[m].target), 0) / total) * 100) : 100;
    const freqs = counted.map(m => templates.filter(t => musclesOf(t).has(m)).length);
    const freq = freqs.length ? Math.min(...freqs) : 0, freqMax = freqs.length ? Math.max(...freqs) : 0;
    const legs = templates.filter(hasLegs).length;
    const short = counted.filter(m => planned[m] < state.matrix[m].target).map(m => ({ muscle: m, planned: planned[m], target: state.matrix[m].target }));
    const below = short.filter(x => x.planned < Math.min(x.target, STATUS[state.matrix[x.muscle].status].range[0]));
    // Séances passées en haut du corps parce que les jambes ont déjà leurs 2 séances.
    const upper = templates.filter((t, i) => SPLITS[key].sessions[i][1].some(m => LEGS_MAIN.includes(m)) && !hasLegs(t)).map(t => t.name);
    const fits = SPLITS[key].days <= days;
    // Temps qu'il faudrait pour toute la cible, quand les minutes données ne suffisent pas.
    const need = coverage < 100 ? Math.max(...generateProgram(key, { endurance }, pools).map(estimate)) : null;
    const score = coverage + (freq >= 2 ? 15 : 0) + (SPLITS[key].days === days ? 10 : 0) - below.length * 20;
    return { key, templates, coverage, freq, freqMax, legs, upper, short, below, fits, need, score };
  }).sort((a, b) => b.fits - a.fits || b.score - a.score || (a.fits ? SPLITS[b.key].days - SPLITS[a.key].days : SPLITS[a.key].days - SPLITS[b.key].days)); // à égalité : au plus près des séances dispo
}

// Semaine type : séances étalées sur la semaine. Avec la corde, le jour long tombe le plus loin possible des séances jambes
// (plutôt un jour sans muscu, plutôt le week-end), le jour récup le lendemain, les autres jours en séance facile.
export const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SPREAD = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
export function weekPlan(templates, endurance) {
  const week = WEEKDAYS.map(day => ({ day, session: null, legs: false, endurance: null }));
  (SPREAD[Math.min(templates.length, 7)] || []).forEach((d, i) => Object.assign(week[d], { session: templates[i].name, legs: hasLegs(templates[i]) }));
  if (!ENDURANCE[endurance]) return week;
  const legDays = week.flatMap((x, d) => (x.legs ? [d] : []));
  const dist = d => (legDays.length ? Math.min(...legDays.map(l => Math.min(Math.abs(d - l), 7 - Math.abs(d - l)))) : 3);
  const score = d => dist(d) * 10 + (week[d].session ? 0 : 4) + (d >= 5 ? 2 : 0);
  const long = week.reduce((best, _, d) => (score(d) > score(best) ? d : best), 0);
  week.forEach((x, d) => { x.endurance = d === long ? "long" : d === (long + 1) % 7 ? "recup" : "facile"; });
  return week;
}

// Le nombre de séances reste celui de la semaine donnée : un programme plus court laisse des jours libres.
export function applyProgram(key, templates) {
  state.templates = templates;
  state.profile.split = key;
  save();
}

// Séries prévues par muscle pour une liste de séances données (aperçu avant de valider).
export function plannedSetsOf(templates) {
  const out = Object.fromEntries(MUSCLES.map(m => [m, 0]));
  for (const t of templates) for (const it of t.items) { const m = exercise(it.exerciseId)?.muscle; if (m in out) out[m] += itemSets(it); }
  return out;
}

// ——— Écriture : séances types

export function createTemplate(name) {
  const p = { id: uid(), name, items: [] };
  state.templates.push(p);
  save();
  return p;
}

export function deleteTemplate(id) {
  state.templates = state.templates.filter(p => p.id !== id);
  save();
}

export function addItem(templateId, exerciseId) {
  const last = lastPerformance(exerciseId);
  const item = { id: uid(), exerciseId, format: "series", sets: 3, repsMin: 8, repsMax: 12, weight: last ? last.maxWeight : 20, rest: 90 };
  template(templateId).items.push(item);
  save();
  return item;
}

export function moveItem(templateId, itemId, dir) {
  const items = template(templateId).items;
  const i = items.findIndex(x => x.id === itemId);
  const j = i + dir;
  if (j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j], items[i]];
  save();
}

// Changer de format garde la charge, et pose les valeurs par défaut du format.
export function setItemFormat(item, format) {
  item.format = format;
  if (format === "series") { item.sets = item.sets || 3; item.repsMin = 8; item.repsMax = 12; item.rest = item.rest || 90; }
  else Object.assign(item, FORMAT_DEFAULTS[format]);
  save(true);
}

export function removeItem(templateId, itemId) {
  const p = template(templateId);
  p.items = p.items.filter(x => x.id !== itemId);
  save();
}

export function setEquip(exerciseId, equip) {
  exercise(exerciseId).equip = equip;
  save();
}

export function createExercise(name, muscle, equip = "barre") {
  const e = { id: uid(), name: name.trim(), muscle, equip, pref: "neutre", note: "" };
  state.exercises.push(e);
  save();
  return e;
}

// ——— Écriture : séance en cours

export function startWorkout(templateId) {
  const t = template(templateId);
  const now = Date.now();
  const pos = cyclePosition(now);
  state.active = {
    id: uid(), templateId, name: t.name, startedAt: now,
    cycle: state.cycle.type, week: pos.week, deload: pos.deload,
    warmupDone: false, warm: null, cursor: 0, restEndsAt: null, restTotal: 0,
    entries: t.items.map(item => {
      if (isInterval(item)) return intervalEntry(item.exerciseId, item, pos.deload);
      const s = suggestion(item, now);
      // Deload : on garde le mouvement, on divise le volume par deux.
      const sets = pos.deload ? Math.max(1, Math.ceil(item.sets / 2)) : item.sets;
      return {
        exerciseId: item.exerciseId, format: "series",
        target: { sets, repsMin: item.repsMin, repsMax: item.repsMax, rest: item.rest },
        draft: { weight: s.weight, reps: s.reps, rpe: null }, hint: pos.deload ? null : s.hint,
        sets: []
      };
    })
  };
  save();
}

function intervalEntry(exerciseId, item, deload) {
  const rounds = deload ? Math.max(2, Math.ceil(item.rounds / 2)) : item.rounds;
  return {
    exerciseId, format: item.format,
    target: { sets: rounds, rounds, every: item.every, work: item.work, off: item.off, repsMin: item.repsMin, repsMax: item.repsMax, rest: 0 },
    draft: { weight: item.weight ?? 0, reps: item.repsMin, rpe: null }, hint: null,
    clock: null, sets: []
  };
}

// Chrono d'un exercice en EMOM ou en Tabata, calculé depuis l'heure de départ (survit à la mise en veille).
export function intervalState(e, now = Date.now()) {
  if (!e.clock) return null;
  const t = e.target, el = (now - e.clock) / 1000;
  if (e.format === "emom") {
    const round = Math.floor(el / t.every) + 1;
    return { round, done: round > t.rounds, phase: "effort", left: t.every - (el % t.every), total: t.every };
  }
  const cycle = t.work + t.off, round = Math.floor(el / cycle) + 1, inCycle = el % cycle, work = inCycle < t.work;
  return { round, done: round > t.rounds, phase: work ? "effort" : "repos", left: work ? t.work - inCycle : cycle - inCycle, total: work ? t.work : t.off };
}

export function startClock(index) {
  state.active.entries[index].clock = Date.now();
  state.active.restEndsAt = null; // le chrono EMOM / Tabata remplace le repos en cours
  save();
}

export function stopClock(index) {
  state.active.entries[index].clock = null;
  save();
}

export function logSet() {
  const a = state.active;
  const e = a.entries[a.cursor];
  if (isInterval(e)) {
    e.sets.push({ weight: e.draft.weight, reps: e.draft.reps, round: e.sets.length + 1, doneAt: Date.now() });
    if (e.sets.length >= e.target.rounds) e.clock = null;
    save();
    return;
  }
  e.sets.push({ weight: e.draft.weight, reps: e.draft.reps, rpe: e.draft.rpe, doneAt: Date.now() });
  e.draft.rpe = null;
  // Dernière série d'un exercice : on reste dessus (repos puis « Exercice terminé »), « Suivant » passe au suivant.
  const finished = e.sets.length >= e.target.sets;
  const isLast = a.cursor === a.entries.length - 1;
  if (!(finished && isLast)) {
    a.restTotal = e.target.rest;
    a.restEndsAt = Date.now() + e.target.rest * 1000;
  }
  save();
}

// Machine prise : on remplace l'exercice pour cette séance seulement, le programme ne bouge pas.
// Si des séries sont déjà faites, elles restent sur l'exercice d'origine et l'alternative reprend les séries restantes.
export function swapExercise(index, exerciseId) {
  const a = state.active;
  let e = a.entries[index];
  const last = lastPerformance(exerciseId);
  if (e.sets.length && !isInterval(e)) {
    const left = Math.max(1, e.target.sets - e.sets.length);
    e.target = { ...e.target, sets: e.sets.length };
    e = { exerciseId: e.exerciseId, format: "series", target: { ...e.target, sets: left }, draft: { ...e.draft }, sets: [] };
    a.entries.splice(index + 1, 0, e);
    a.cursor = index + 1;
  }
  const from = equipOf(e);
  e.swappedFrom = e.swappedFrom || e.exerciseId;
  e.exerciseId = exerciseId;
  delete e.equip;
  const equip = exercise(exerciseId).equip;
  e.draft = { weight: last ? Math.max(...last.sets.map(s => s.weight)) : convertWeight(from, equip, e.draft.weight), reps: e.target.repsMin, rpe: null };
  e.hint = null;
  save();
}

// Même exercice, autre matériel (haltères au lieu de la barre, poulie…) : pour cette séance seulement.
export function setEntryEquip(index, equip) {
  const e = state.active.entries[index];
  const from = equipOf(e);
  e.equip = equip === exercise(e.exerciseId).equip ? undefined : equip;
  e.draft.weight = convertWeight(from, equip, e.draft.weight);
  e.hint = null;
  save();
}

// Exercice hors programme, ajouté juste après l'exercice en cours.
export function addExtra(exerciseId, format = "series") {
  const a = state.active;
  const last = lastPerformance(exerciseId);
  const at = a.cursor + (a.entries[a.cursor].sets.length ? 1 : 0);
  const weight = last ? Math.max(...last.sets.map(s => s.weight)) : 0;
  a.entries.splice(at, 0, format === "series" ? {
    exerciseId, extra: true, format,
    target: { sets: 3, repsMin: 8, repsMax: 12, rest: 90 },
    draft: { weight: last ? weight : 20, reps: 10, rpe: null }, hint: null,
    sets: []
  } : { ...intervalEntry(exerciseId, { format, weight, ...FORMAT_DEFAULTS[format] }), extra: true });
  a.cursor = at;
  save();
}

export function finishWorkout(feeling, note) {
  const a = state.active;
  const s = {
    id: a.id, templateId: a.templateId, name: a.name,
    startedAt: a.startedAt, endedAt: Date.now(),
    cycle: a.cycle, week: a.week, deload: a.deload, feeling, note: note.trim(),
    entries: a.entries.filter(e => e.sets.length).map(e => ({
      exerciseId: e.exerciseId, swappedFrom: e.swappedFrom, extra: e.extra, equip: e.equip, format: e.format || "series",
      sets: e.sets.map(({ weight, reps, rpe }) => ({ weight, reps, rpe }))
    }))
  };
  state.active = null;
  if (!s.entries.length) { save(); return null; }
  state.sessions.push(s);
  state.habits[dayKey(s.startedAt)] = { ...state.habits[dayKey(s.startedAt)], session: true };
  save();
  return s;
}

export function deleteSession(id) {
  state.sessions = state.sessions.filter(s => s.id !== id);
  save();
}

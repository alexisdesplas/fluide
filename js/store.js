// Données de l'appli, rangées selon le Système Fluide : profil + matrice de volume, cycle en cours,
// exercices (avec préférences), séances types, séances faites, habitudes. Tout vit dans le localStorage.

const KEY = "fluid-v1";
const DAY = 86400000;

export const MUSCLES = ["Pecs", "Dos", "Épaules", "Biceps", "Triceps", "Quadris", "Ischios", "Fessiers", "Mollets", "Abdos"];

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

const LIBRARY = [
  ["Développé couché", "Pecs"], ["Développé incliné haltères", "Pecs"], ["Écarté poulie", "Pecs"], ["Dips", "Pecs"],
  ["Tractions", "Dos"], ["Rowing barre", "Dos"], ["Tirage vertical", "Dos"], ["Tirage horizontal", "Dos"], ["Rowing haltère", "Dos"],
  ["Développé militaire", "Épaules"], ["Élévations latérales", "Épaules"], ["Face pull", "Épaules"], ["Oiseau poulie", "Épaules"],
  ["Curl barre", "Biceps"], ["Curl marteau", "Biceps"], ["Curl incliné", "Biceps"],
  ["Extension poulie", "Triceps"], ["Barre au front", "Triceps"], ["Extension nuque", "Triceps"],
  ["Squat", "Quadris"], ["Presse à cuisses", "Quadris"], ["Fentes bulgares", "Quadris"], ["Leg extension", "Quadris"],
  ["Soulevé de terre roumain", "Ischios"], ["Leg curl", "Ischios"],
  ["Hip thrust", "Fessiers"], ["Abduction machine", "Fessiers"],
  ["Mollets debout", "Mollets"], ["Mollets presse", "Mollets"],
  ["Crunch poulie", "Abdos"], ["Relevés de jambes", "Abdos"]
];

// Haut / Bas sur 4 jours : chaque muscle 2x par semaine.
const SEED_TEMPLATES = [
  ["Haut A", [["Développé couché", 3, 6, 10, 60, 150], ["Rowing barre", 3, 8, 12, 50, 120], ["Développé militaire", 3, 8, 12, 35, 120], ["Élévations latérales", 3, 12, 15, 8, 60], ["Curl barre", 2, 10, 12, 25, 60], ["Extension poulie", 2, 10, 12, 25, 60]]],
  ["Bas A", [["Squat", 3, 6, 10, 80, 180], ["Soulevé de terre roumain", 3, 8, 12, 60, 120], ["Leg extension", 2, 12, 15, 40, 60], ["Mollets debout", 3, 10, 15, 40, 60], ["Crunch poulie", 2, 10, 15, 30, 60]]],
  ["Haut B", [["Tractions", 3, 6, 10, 0, 150], ["Développé incliné haltères", 3, 8, 12, 22, 120], ["Tirage horizontal", 3, 10, 12, 50, 90], ["Face pull", 2, 12, 15, 15, 60], ["Curl marteau", 2, 10, 12, 14, 60], ["Barre au front", 2, 10, 12, 25, 60]]],
  ["Bas B", [["Presse à cuisses", 3, 10, 12, 120, 120], ["Hip thrust", 3, 8, 12, 80, 120], ["Leg curl", 3, 10, 12, 35, 60], ["Mollets presse", 3, 12, 15, 80, 60], ["Relevés de jambes", 2, 10, 15, 0, 60]]]
];

export const uid = () => Math.random().toString(36).slice(2, 10);
export const dayKey = (t = Date.now()) => new Date(t).toLocaleDateString("sv-SE"); // AAAA-MM-JJ, heure locale
export const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const startOfWeek = t => { const d = new Date(startOfDay(t)); return d.getTime() - ((d.getDay() + 6) % 7) * DAY; };

function seed() {
  const exercises = LIBRARY.map(([name, muscle]) => ({ id: uid(), name, muscle, pref: "neutre", note: "" }));
  const byName = n => exercises.find(e => e.name === n).id;
  const templates = SEED_TEMPLATES.map(([name, items]) => ({
    id: uid(), name,
    items: items.map(([ex, sets, repsMin, repsMax, weight, rest]) => ({ id: uid(), exerciseId: byName(ex), sets, repsMin, repsMax, weight, rest }))
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
    if (raw) return JSON.parse(raw);
  } catch {}
  return seed();
}

export let state = load();
const listeners = new Set();

// quiet : on enregistre sans redessiner (steppers, champs en cours de saisie).
export function save(quiet = false) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  if (!quiet) listeners.forEach(fn => fn());
}
export const subscribe = fn => listeners.add(fn);

export function replaceState(next) {
  state = next;
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
export const sessionSets = s => s.entries.reduce((a, e) => a + e.sets.length, 0);

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

// Alternatives quand la machine est prise : même muscle, favoris d'abord, jamais un exercice en douleur.
export function alternatives(exerciseId) {
  const ex = exercise(exerciseId);
  const rank = { aime: 0, neutre: 1, evite: 2 };
  return state.exercises
    .filter(e => e.id !== exerciseId && e.muscle === ex.muscle && e.pref !== "douleur")
    .sort((a, b) => rank[a.pref] - rank[b.pref] || (lastPerformance(b.id) ? 1 : 0) - (lastPerformance(a.id) ? 1 : 0) || a.name.localeCompare(b.name));
}

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
    return { weight: top + 2.5, reps: item.repsMin, hint: "charge", last };
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

// Génère les séances d'un split : séries par muscle = cible ÷ nombre de séances où il revient,
// réparties en 1 ou 2 exercices ; favoris d'abord, jamais un exercice en douleur, un exercice différent à chaque passage.
export function generateProgram(key) {
  const split = SPLITS[key];
  const freq = {}; for (const [, ms] of split.sessions) for (const m of ms) freq[m] = (freq[m] || 0) + 1;
  const rank = { aime: 0, neutre: 1, evite: 2 };
  const pool = m => state.exercises.filter(e => e.muscle === m && e.pref !== "douleur").sort((a, b) => rank[a.pref] - rank[b.pref] || (lastPerformance(b.id) ? 1 : 0) - (lastPerformance(a.id) ? 1 : 0));
  const used = {};
  const pick = m => { const p = pool(m); if (!p.length) return null; used[m] = used[m] || 0; return p[used[m]++ % p.length]; };
  const cyc = state.cycle.type;
  return split.sessions.map(([name, muscles]) => {
    const items = [];
    const order = [...muscles.filter(m => BIG.includes(m)), ...muscles.filter(m => !BIG.includes(m))];
    for (const m of order) {
      const target = state.matrix[m].target; if (!target) continue;
      const sets = Math.max(1, Math.round(target / freq[m]));
      // Pas plus de 4 séries par exercice : 12 séries deviennent 3 exercices de 4.
      const count = Math.ceil(sets / 4), parts = Array.from({ length: count }, (_, i) => Math.floor(sets / count) + (i < sets % count ? 1 : 0));
      for (const n of parts) {
        const ex = pick(m); if (!ex) continue;
        const heavy = items.length === 0 && BIG.includes(m);
        const last = lastPerformance(ex.id);
        const [repsMin, repsMax] = cyc === "intensite" ? (heavy ? [4, 6] : [6, 10]) : heavy ? [6, 10] : BIG.includes(m) ? [8, 12] : [10, 15];
        const known = state.templates.flatMap(t => t.items).find(i => i.exerciseId === ex.id);
        const weight = last ? last.maxWeight : known ? known.weight : BIG.includes(m) ? 20 : 8;
        items.push({ id: uid(), exerciseId: ex.id, format: "series", sets: n, repsMin, repsMax, weight, rest: heavy ? 150 : BIG.includes(m) ? 120 : 75 });
      }
    }
    return { id: uid(), name, items };
  });
}

export function applyProgram(key, templates) {
  state.templates = templates;
  state.profile.split = key;
  if (SPLITS[key].days) state.profile.days = SPLITS[key].days;
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

export function createExercise(name, muscle) {
  const e = { id: uid(), name: name.trim(), muscle, pref: "neutre", note: "" };
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
    warmupDone: false, cursor: 0, restEndsAt: null, restTotal: 0,
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
  const finished = e.sets.length >= e.target.sets;
  const isLast = a.cursor === a.entries.length - 1;
  if (finished && !isLast) a.cursor += 1;
  if (!(finished && isLast)) {
    a.restTotal = e.target.rest;
    a.restEndsAt = Date.now() + e.target.rest * 1000;
  }
  save();
}

// Machine prise : on remplace l'exercice pour cette séance seulement, le programme ne bouge pas.
export function swapExercise(index, exerciseId) {
  const e = state.active.entries[index];
  const last = lastPerformance(exerciseId);
  e.swappedFrom = e.swappedFrom || e.exerciseId;
  e.exerciseId = exerciseId;
  e.draft = { weight: last ? Math.max(...last.sets.map(s => s.weight)) : e.draft.weight, reps: e.target.repsMin, rpe: null };
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
      exerciseId: e.exerciseId, swappedFrom: e.swappedFrom, extra: e.extra, format: e.format || "series",
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

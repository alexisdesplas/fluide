// Programme corde à sauter « 1 h non-stop » : 18 semaines, tous les jours. Chaque semaine : 5 séances faciles,
// 1 jour long, 1 jour récup. Une séance = des blocs [nombre, effort en s, repos en s].
// Elle sert d'échauffement aux séances de muscu, et se lance seule les autres jours.

import { state, save, dayKey } from "./store.js";

const RECUP = [5, 60, 30];
export const CORDE_WEEKS = [
  { cycle: 0, easy: [6, 60, 30], long: [5, 120, 60] },
  { cycle: 1, easy: [10, 60, 30], long: [4, 180, 60] },
  { cycle: 1, easy: [7, 60, 30], long: [5, 120, 60], deload: true },
  { cycle: 1, easy: [8, 120, 30], long: [2, 300, 60] },
  { cycle: 2, easy: [3, 300, 60], long: [1, 480, 0] },
  { cycle: 2, easy: [3, 360, 60], long: [1, 600, 0] },
  { cycle: 2, easy: [2, 300, 60], long: [1, 480, 0], deload: true },
  { cycle: 2, easy: [3, 480, 60], long: [1, 900, 0] },
  { cycle: 3, easy: [2, 720, 60], long: [1, 1200, 0] },
  { cycle: 3, easy: [2, 900, 60], long: [1, 1500, 0] },
  { cycle: 3, easy: [2, 600, 60], long: [1, 1200, 0], deload: true },
  { cycle: 3, easy: [1, 1500, 0], long: [1, 2100, 0] },
  { cycle: 4, easy: [1, 1200, 0], long: [1, 2400, 0] },
  { cycle: 4, easy: [1, 1500, 0], long: [1, 2700, 0] },
  { cycle: 4, easy: [1, 900, 0], long: [1, 2100, 0], deload: true },
  { cycle: 4, easy: [1, 1500, 0], long: [1, 3000, 0] },
  { cycle: 4, easy: [1, 1800, 0], long: [1, 3300, 0] },
  { cycle: 4, easy: [1, 900, 0], long: [1, 3600, 0], goal: true }
].map((w, i) => ({ ...w, n: i + 1 }));
export const CORDE_CYCLES = ["Semaine d'entrée", "Volume", "Continu court", "Continu long", "Objectif"];
export const CORDE_TYPES = { F: "Facile", L: "Jour long", R: "Récup" };
const EASY = ["F1", "F2", "F3", "F4", "F5"];
export const CORDE_SLOTS = [...EASY, "L", "R"];

// Données : programme activé, semaine de départ, séances cochées ("2-F1" → heure), séance lancée seule.
export const corde = () => (state.corde ||= { on: true, from: 1, done: {}, run: null });
const key = (n, slot) => `${n}-${slot}`;
const DAY = 86400000;

// Semaine en cours : la première sans jour long, ou celle dont le jour long date d'hier et dont la récup reste à faire.
export function cordeWeek() {
  const c = corde();
  for (const w of CORDE_WEEKS) {
    if (w.n < c.from) continue;
    const long = c.done[key(w.n, "L")];
    if (!long) return w;
    const recent = typeof long === "number" && Date.now() - long < 2 * DAY;
    if (recent && !c.done[key(w.n, "R")]) return w;
  }
  return CORDE_WEEKS.at(-1);
}

export const blocksOf = (w, type) => (type === "L" ? w.long : type === "R" ? RECUP : w.easy);
export const blocksTotal = ([n, work, off]) => n * work + (n - 1) * off;
export function blocksLine([n, work, off]) {
  const dur = s => (s % 60 ? `${s} s` : `${s / 60} min`);
  return n === 1 ? `${dur(work)} non-stop` : `${n} × ${dur(work)} / ${dur(off)}`;
}
export const slotDone = (n, slot) => Boolean(corde().done[key(n, slot)]);
export const weekDoneCount = n => CORDE_SLOTS.filter(s => slotDone(n, s)).length;
export const doneToday = () => Object.values(corde().done).some(t => typeof t === "number" && dayKey(t) === dayKey());

// Séance proposée : récup le lendemain du jour long, jour long après 3 faciles (jamais un jour de jambes), sinon facile.
export function suggestType({ legDay = false } = {}) {
  const w = cordeWeek(), easy = EASY.filter(s => slotDone(w.n, s)).length;
  const long = corde().done[key(w.n, "L")];
  if (long && !slotDone(w.n, "R")) return "R";
  if (!long && !legDay && easy >= 3) return "L";
  if (easy < 5) return "F";
  return long ? "R" : "L";
}

export function markDone(n, type) {
  const c = corde();
  const slot = type === "F" ? EASY.find(s => !c.done[key(n, s)]) : type;
  if (slot) c.done[key(n, slot)] = Date.now();
  save();
}

export function toggleSlot(n, slot) {
  const c = corde();
  if (c.done[key(n, slot)]) delete c.done[key(n, slot)]; else c.done[key(n, slot)] = Date.now();
  save();
}

// Reprendre à une semaine (fatigue, douleur, ou programme commencé ailleurs) : elle et les suivantes repartent de zéro.
export function setCordeWeek(n) {
  const c = corde();
  c.from = n;
  for (const k of Object.keys(c.done)) if (+k.split("-")[0] >= n) delete c.done[k];
  save();
}

// Chrono par blocs, calculé depuis l'heure de départ (survit à la mise en veille) ; la pause décale le départ.
// run : { week, type, start, paused, done }.
export function runState(run, now = Date.now()) {
  const [n, work, off] = blocksOf(CORDE_WEEKS[run.week - 1], run.type);
  const total = blocksTotal([n, work, off]);
  const el = ((run.paused || now) - run.start) / 1000;
  if (run.done || el >= total) return { done: true, block: n, blocks: n, phase: "effort", left: 0, total: work, remaining: 0, all: total };
  const cycle = work + off, block = Math.floor(el / cycle) + 1, inCycle = el % cycle, effort = inCycle < work;
  return { done: false, block, blocks: n, phase: effort ? "effort" : "repos", left: effort ? work - inCycle : cycle - inCycle, total: effort ? work : off, remaining: total - el, all: total };
}

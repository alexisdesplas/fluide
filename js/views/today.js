import { state, isFocus, estimate, enduranceToday, blocksLabel, itemSets, cyclePosition, weeklyGoal, history, template, exercise, setHabit, habit, dayKey, stepsAverage, startWorkout, sessionSets, STATUS, MUSCLES, CYCLES, PLACES } from "../store.js";
import { h, icon, btn, pill, go, int, clock, dateLong, ago, stepper, sheet, radios, toast } from "../ui.js";
import { account } from "../compte.js";
import { placeSummary } from "./places.js";
import { pauseCard } from "./reprise.js";
import { niceName, itemLine } from "./templates.js";

export { estimate };

// Échauffement du jour : la séance corde du plan (sauf le jour long, fait à part), sinon celui des réglages.
const warmupLine = () => {
  const r = enduranceToday();
  if (r?.kind === "reprise") return `corde de reprise, ${blocksLabel(r.blocks)}`;
  return r && r.kind !== "long" ? `corde S${r.week}, ${blocksLabel(r.blocks)}` : state.profile.warmup;
};

// Prochaine séance : on fait tourner les séances types, la moins récente d'abord.
export function nextTemplate() {
  const last = id => history().find(s => s.templateId === id)?.startedAt || 0;
  return [...state.templates].filter(t => t.items.length).sort((a, b) => last(a.id) - last(b.id))[0] || null;
}

// Carte du bloc (Réglages › Bloc) : où on en est, semaine par semaine, deload compris.
export function cycleCard(compact) {
  const pos = cyclePosition();
  const c = state.cycle;
  const segs = Array.from({ length: c.weeks + 1 }, (_, i) => {
    const w = i + 1, isDeload = w === c.weeks + 1;
    const cls = [isDeload && "deload", w < pos.week && "on", w === pos.week && (isDeload ? "on" : "cur")].filter(Boolean).join(" ");
    return h("i", { class: cls });
  });
  const left = c.weeks - pos.week + 1;
  // Reprise après une pause : la semaine est hors bloc, il repart lundi à la semaine choisie.
  if (pos.reprise) {
    const r = state.reprise;
    return h("button", { class: "card tap orange", onClick: () => go("#/reprise"), "aria-label": "Semaine de reprise : voir le détail" },
      h("div", null, h("div", { class: "overline" }, `Bloc ${CYCLES[c.type].label}`), h("div", { class: "heading-xl orange" }, "Semaine de reprise")),
      h("div", { class: "segments lg violet", "aria-hidden": "true" }, segs),
      !compact && h("p", { class: "body-sm", style: { margin: 0 } },
        `Moitié moins de séries, charges −10 %, 3 reps en réserve. Le bloc repart lundi en ${r.blocWeek === c.weeks + 1 ? "deload" : `S${r.blocWeek}`}.`));
  }
  return h("div", { class: "card violet" },
    h("div", null,
      h("div", { class: "overline" }, `Bloc ${CYCLES[c.type].label} · RPE ${String(CYCLES[c.type].rpe).replace(".", ",")}`),
      h("div", { class: "heading-xl violet" }, pos.over ? "Bloc terminé" : pos.deload ? "Semaine de deload" : `Semaine ${pos.week} sur ${c.weeks}`)),
    h("div", { class: "segments lg violet", "aria-hidden": "true" }, segs),
    !compact && h("p", { class: "body-sm", style: { margin: 0 } },
      pos.over ? "Fais le bilan du bloc et choisis le suivant."
        : pos.deload ? "Mêmes exercices, volume divisé par deux. On dissipe la fatigue pour relancer la progression."
        : `${CYCLES[c.type].desc} Deload dans ${left} semaine${left > 1 ? "s" : ""}.`));
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

// Pas reçus par le lien du Raccourci iOS « Pas du jour » (livrables/fluide/raccourci-pas.md) : un nombre entier,
// espaces de milliers tolérés (« 8 432 »). null si ce n'est pas un nombre de pas plausible.
const STEPS_MAX = 60000;
export function parseSteps(text) {
  const s = String(text ?? "").replace(/\s/g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n <= STEPS_MAX ? n : null;
}

// Lien ouvert par le Raccourci (#/pas/8432) : enregistre les pas du jour puis revient sur Aujourd'hui.
// Hypothèse ouverte : iOS ouvre-t-il l'app de l'écran d'accueil ou Safari, dont le stockage est séparé ?
// navigator.standalone vaut false dans Safari sur iPhone : le toast le dit, pour trancher au premier essai.
export function stepsLinkView({ n }) {
  const steps = parseSteps(n);
  window.history.replaceState(null, "", "#/");
  if (steps == null) toast("Lien de pas invalide : rien n'a été enregistré.");
  else {
    setHabit(dayKey(), "steps", steps, true);
    toast(navigator.standalone === false
      ? `${int(steps)} pas enregistrés dans Safari, pas dans l'app de l'écran d'accueil.`
      : `${int(steps)} pas repris de Santé`);
  }
  return todayView();
}

// Pas du jour (affichés dans Progrès) : la cible, le compteur à corriger au stepper, l'heure du dernier envoi par le Raccourci.
export function stepsCard() {
  const today = dayKey();
  const steps = habit(today).steps || 0;
  const last = account().stepsLast;
  const received = last?.day === today && last.steps === steps ? last : null;
  const target = state.profile.stepsTarget;
  const avg = stepsAverage();
  return [
    h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Pas du jour"), h("span", { class: "caption num" }, avg ? `moyenne 7 jours : ${int(avg)}` : "")),
    h("div", { class: "card" },
      h("div", { class: "card-head" },
        h("span", { class: "body-sm" }, "Cible ", h("b", { class: "fort num" }, int(target))),
        steps >= target ? pill("Cible atteinte", "succes") : pill(`${int(Math.max(0, target - steps))} restants`)),
      stepper({ value: steps, step: 500, max: STEPS_MAX, format: int, unit: "pas", editable: true, label: "pas du jour",
        onChange: v => { setHabit(today, "steps", v, true); } }),
      received && h("span", { class: "caption num" }, `Reçus de Santé à ${new Date(received.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} par le Raccourci.`))];
}

// Séance prise à la place de celle du jour (« Changer »), et lieu choisi : pour aujourd'hui seulement.
let picked = null;
let place = null;
const redraw = () => dispatchEvent(new HashChangeEvent("hashchange"));
const cap = s => s[0].toUpperCase() + s.slice(1);
const sizeOf = name => (name.length <= 6 ? "" : name.length <= 10 ? " md" : " sm");
const musclesOf = t => [...new Set(t.items.map(i => exercise(i.exerciseId)?.muscle).filter(Boolean))].join(", ").toLowerCase();

function changeSheet(current, auto) {
  const list = state.templates.filter(t => t.items.length);
  const last = id => history().find(s => s.templateId === id);
  sheet({
    title: "Changer de séance",
    body: close => [
      h("p", { class: "body-sm", style: { margin: 0 } }, `Fluide propose ${auto.name}. Tu peux en faire une autre aujourd'hui, le programme ne change pas.`),
      radios(list.map(t => [t.id, t.name, [t.id === auto.id && "proposée", musclesOf(t), last(t.id) ? `faite ${ago(last(t.id).startedAt)}` : "jamais faite"].filter(Boolean).join(" · ")]),
        current.id, v => { picked = v === auto.id ? null : { id: v, day: dayKey() }; close(); redraw(); }, "Séance du jour")]
  });
}

const hero = ({ date, over, top, name, hue, why }) => h("div", { class: "hero" },
  h("div", { class: "hero-date num" }, date),
  h("div", { class: "hero-top" }, h("h2", { class: "heading-md" }, over), top || null),
  h("h1", { class: `hero-name${sizeOf(name)}`, style: hue ? { color: `var(--${hue})` } : null }, name),
  why || null);

const planRow = (lead, name, detail, cls = "") => h("div", { class: "plan-row" },
  h("span", { class: `lead ${cls}`, "aria-hidden": "true" }, lead),
  h("div", { style: { minWidth: 0 } }, h("div", { class: "name" }, name), detail && h("div", { class: "caption num" }, detail)));

export function todayView() {
  const pos = cyclePosition(), c = state.cycle, a = state.active;
  const today = dayKey();
  if (picked?.day !== today) picked = null;
  const auto = nextTemplate();
  const next = (picked && template(picked.id)) || auto;
  const date = `${cap(dateLong(Date.now()))} · bloc ${CYCLES[c.type].label}${pos.over ? " terminé" : pos.reprise ? ", reprise" : pos.deload ? ", deload" : ` S${pos.week} / ${c.weeks}`}`;
  const screen = (content, ...ctas) => ({ el: h("div", { class: "screen today has-cta" }, h("div", { class: "scroll" }, content), h("div", { class: "cta-bar" }, ctas)), tab: "" });

  // ——— Séance en cours : on la reprend.
  if (a) {
    const done = sessionSets(a), planned = a.entries.reduce((t, e) => t + itemSets({ format: e.format, sets: e.target.sets, rounds: e.target.rounds, work: e.target.work }), 0);
    return screen([
      hero({ date, over: "Séance en cours", top: pill(PLACES[a.place || "gym"].short, "accent"), name: a.name,
        why: h("div", { class: "hero-why vert" }, h("b", null, "Commencée il y a ", h("span", { class: "num", "data-tick": "elapsed" }, clock((Date.now() - a.startedAt) / 1000)))) }),
      h("div", { class: "stat-grid" },
        h("div", { class: "stat lg" }, h("span", { class: "caption" }, "séries"), h("b", null, `${done} / ${planned}`)),
        h("div", { class: "stat lg" }, h("span", { class: "caption" }, "exercice"), h("b", null, `${a.cursor + 1} / ${a.entries.length}`))),
      h("div", { class: "plan" }, h("h2", { class: "heading-md" }, "Où tu en es"),
        a.entries.map((e, i) => {
          const over = e.sets.length >= e.target.sets, cur = i === a.cursor && !over;
          return planRow(over ? icon("check") : String(i + 1), niceName(exercise(e.exerciseId)?.name || "Exercice"),
            over ? `${e.sets.length} série${e.sets.length > 1 ? "s" : ""} faite${e.sets.length > 1 ? "s" : ""}` : cur ? `en cours · série ${e.sets.length + 1} sur ${e.target.sets}` : `${e.target.sets} séries à faire`, over ? "vert" : "");
        }))],
      btn(`Reprendre ${a.name}`, { variant: "primary", size: "lg", full: true, onClick: () => go("#/seance") }));
  }

  // ——— Premier lancement : pas encore de séance type.
  if (!next) {
    return screen([
      hero({ date: cap(dateLong(Date.now())), over: "Bienvenue", name: "Fluide" }),
      h("p", { class: "body-lg", style: { margin: 0 } }, "Fluide construit ton programme à partir de ta semaine, puis te dit chaque jour quelle séance faire."),
      h("div", { class: "list" }, [["Ta semaine", "combien de séances, combien de temps"], ["Tes points forts et faibles", "ce que tu veux faire progresser"], ["Ton programme", "Fluide en propose un, tu l'ajustes"]].map(([t, d], i) =>
        h("div", { class: "row" }, h("span", { class: "lead-round" }, h("b", { class: "num" }, i + 1)), h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, t), h("span", { class: "caption" }, d)))))],
      btn("Choisir mon programme", { variant: "primary", size: "lg", full: true, onClick: () => go("#/seances/programme/semaine") }));
  }

  // ——— La séance du jour.
  const light = pos.deload || pos.reprise;
  const sets = next.items.reduce((t, i) => t + (light ? Math.ceil(itemSets(i) / 2) : itemSets(i)), 0);
  const g = weeklyGoal();
  const why = pos.over
    ? h("button", { class: "hero-why violet", onClick: () => go("#/profil/bloc") }, h("b", null, "Bloc terminé"), h("span", { class: "caption" }, "fais le bilan, choisis le suivant"))
    : pos.reprise ? h("button", { class: "hero-why orange", onClick: () => go("#/reprise") }, h("b", null, "Semaine de reprise"), h("span", { class: "caption" }, "moitié moins de séries, charges −10 %"))
    : pos.deload ? h("div", { class: "hero-why violet" }, h("b", null, "Semaine de deload"), h("span", { class: "caption" }, "moitié moins de séries"))
    : h("button", { class: "hero-why", "aria-label": `Objectif de la semaine : ${g.pct} %, voir Progrès`, onClick: () => go("#/progres") },
        h("b", { class: "num" }, g.pct >= 100 ? "Objectif rempli" : `Semaine à ${g.pct} %`), h("span", { class: "caption num" }, `${g.sets} séries sur ${g.total}`));
  const here = place || state.profile.place || "gym";
  const rope = enduranceToday();
  return screen([
    hero({ date, over: "Séance du jour", name: next.name, why,
      top: state.templates.filter(t => t.items.length).length > 1 && btn("Changer", { variant: "secondary", icon: "swap", onClick: () => changeSheet(next, auto) }) }),
    pauseCard(),
    h("div", { class: "places", role: "group", "aria-label": "Où es-tu ?" }, Object.entries(PLACES).map(([k, p]) =>
      h("button", { type: "button", "aria-pressed": String(k === here), onClick: () => { place = k; redraw(); } }, p.short))),
    here !== "gym" && h("div", { class: "hint bleu" }, icon("pin"), h("span", { class: "body-sm" }, h("b", { class: "fort" }, "La séance s'adaptera au démarrage. "), `Sur place : ${placeSummary(here).toLowerCase()}.`)),
    rope?.kind === "long" && h("div", { class: "hint attention" }, icon("bolt"), h("span", { class: "body-sm" }, h("b", { class: "fort" }, "Jour long de corde. "), `${blocksLabel(rope.blocks)}, à faire à part de la séance.`)),
    h("div", { class: "stat-grid" },
      h("div", { class: "stat lg" }, h("span", { class: "caption" }, "séries"), h("b", null, sets)),
      h("div", { class: "stat lg" }, h("span", { class: "caption" }, next.items.length > 1 ? "exercices" : "exercice"), h("b", null, next.items.length)),
      h("div", { class: "stat lg" }, h("span", { class: "caption" }, "minutes"), h("b", null, `~${estimate(next)}`))),
    h("div", { class: "plan" }, h("h2", { class: "heading-md" }, "Au programme"),
      planRow(icon("bolt"), `Échauffement · ${warmupLine()}`, "puis séries d'approche sur le premier exercice"),
      [...next.items].sort((x, y) => isFocus(y.exerciseId) - isFocus(x.exerciseId)).map((it, i) => planRow(isFocus(it.exerciseId) ? icon("trend") : String(i + 1), niceName(exercise(it.exerciseId)?.name || "Exercice"),
        [isFocus(it.exerciseId) && "à faire progresser, en premier", itemLine(it)].filter(Boolean).join(" · "), isFocus(it.exerciseId) ? "jaune" : "")))],
    btn(`Démarrer ${next.name}`, { variant: "primary", size: "lg", full: true, onClick: () => { startWorkout(next.id, here); picked = null; go("#/seance"); } }));
}

import { state, save, exercise, itemSets, logSet, finishWorkout, session, sessionVolume, sessionSets, sessionRecords, alternatives, swapExercise, setEntryEquip, equipOf, weightScale, lbs, EQUIPS, addExtra, lastPerformance, isInterval, intervalState, startClock, stopClock, CYCLES, MUSCLES, FORMATS, enduranceToday, blocksLabel, blocksTotal } from "../store.js";
import { h, icon, btn, pill, go, kg, clock, reps, num, int, ago, stepper, chips, radios, sheet, confirmSheet, toast, beep, dateLong, pageHead, navbar } from "../ui.js";
import { prefPill, catalogue, exerciseTitle } from "./templates.js";

// Anneau de Tabatime : 312 px, trait de 34 px.
const R = 139, C = 2 * Math.PI * R;

const lastLine = id => {
  const last = lastPerformance(id);
  return last ? `${last.sets.map(s => `${s.reps}×${s.weight ? num(s.weight) : "PDC"}`).join(" · ")} · ${ago(last.date)}` : "Jamais fait";
};

// Machine prise : même exercice avec un autre matériel, ou un autre exercice du même muscle, favoris d'abord.
function swapSheet(index) {
  const e = state.active.entries[index];
  const ex = exercise(e.exerciseId), cur = equipOf(e);
  const alts = alternatives(e.exerciseId);
  sheet({
    title: "Machine prise ?",
    body: close => [
      h("p", { class: "body-sm discret", style: { margin: 0 } }, `Le programme ne change pas : seule cette séance prend l'alternative.`),
      h("span", { class: "overline" }, `${ex.name} avec`),
      h("div", { class: "chips" }, Object.entries(EQUIPS).filter(([k]) => ["barre", "halteres", "poulie", "machine", "smith"].includes(k) || k === cur).map(([k, label]) =>
        h("button", { type: "button", class: "chip", "aria-pressed": String(k === cur), onClick: () => {
          close();
          if (k !== cur) { setEntryEquip(index, k); toast(`${ex.name} · ${label.toLowerCase()}`); }
        } }, label))),
      h("span", { class: "overline" }, `Autre exercice · ${ex.muscle}`),
      alts.length
        ? [h("div", { class: "list" }, alts.slice(0, 6).map(x => h("button", { class: "row", onClick: () => { close(); swapExercise(index, x.id); toast(`${x.name} à la place`); } },
            h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, x.name), h("span", { class: "caption num" }, `${EQUIPS[x.equip] || ""} · ${lastLine(x.id)}`)),
            prefPill(x.pref), icon("caretRight", "chev")))),
          alts.length > 6 && btn(`Voir les ${alts.length} exercices ${ex.muscle === "Abdos" ? "d'abdos" : `pour les ${ex.muscle.toLowerCase()}`}`, { variant: "ghost", full: true, onClick: () => { close(); setTimeout(() => allAltsSheet(index)); } })]
        : [
            h("p", { class: "body-md", style: { margin: 0 } }, `Ton catalogue n'a pas d'autre exercice pour les ${ex.muscle}, ou ils sont tous marqués en douleur.`),
            btn("Ajouter un exercice hors programme", { variant: "secondary", size: "lg", full: true, onClick: () => { close(); setTimeout(extraSheet); } }),
            btn("Attendre la machine", { variant: "ghost", full: true, onClick: close })
          ]
    ]
  });
}

// Stepper de charge réglé sur le matériel : pile en lbs pour les machines, haltères à l'unité.
const weightStepper = (e, unit) => {
  const equip = equipOf(e);
  return stepper({ value: e.draft.weight, values: weightScale(equip), max: 500, format: num, editable: true, label: "charge",
    unit: v => [equip === "halteres" ? "kg par haltère" : "kg", lbs(equip, v), unit].filter(Boolean).join(" · "),
    onChange: v => { e.draft.weight = v; save(true); } });
};

// Tout le catalogue du muscle, avec recherche et filtre matériel, pour choisir l'alternative.
function allAltsSheet(index) {
  const e = state.active.entries[index], ex = exercise(e.exerciseId);
  let query = "", closeSheet;
  const list = h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } });
  const draw = muscle => catalogue(list, query, { muscle, pickIcon: "caretRight", note: x => lastLine(x.id),
    onPick: x => { closeSheet(); if (x.id !== e.exerciseId) { swapExercise(index, x.id); toast(`${x.name} à la place`); } } });
  draw(ex.muscle);
  sheet({ title: "Autre exercice", body: close => { closeSheet = close; return [
    h("input", { class: "input", type: "search", placeholder: "Chercher un exercice", "aria-label": "Chercher un exercice", onInput: ev => { query = ev.target.value; draw(); } }),
    list]; } });
}

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
  const volume = a.entries.reduce((t, e) => t + e.sets.reduce((b, x) => b + x.weight * x.reps, 0), 0);
  const records = sessionRecords({ startedAt: a.startedAt, entries: a.entries }).length;
  const missing = a.entries.filter(e => e.sets.length < e.target.sets);
  const save_ = () => { const s = finishWorkout(a.finish.feeling, a.finish.note); go(s ? `#/bilan/${s.id}` : "#/"); };

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
      h("div", { class: "field" }, h("h2", { class: "heading-md" }, "Ressenti"),
        h("p", { class: "caption", style: { margin: 0 } }, "Optionnel. Plusieurs séances « Difficile » d'affilée et le coach propose un deload."), cards),
      h("label", { class: "field" }, h("h2", { class: "heading-md" }, "Journal"),
        h("textarea", { class: "input journal", placeholder: "Sommeil, énergie, une gêne, un exercice que tu as adoré…", "aria-label": "Journal de séance", value: a.finish.note,
          onInput: e => { a.finish.note = e.target.value; save(true); } }),
        h("span", { class: "caption" }, "Le coach s'en sert pour ajuster le programme : préférences, douleurs, envies.")),
      btn("Reprendre la séance", { variant: "ghost", full: true, onClick: () => go("#/seance") })));
  return { el };
}

export function workoutView() {
  const a = state.active;
  if (!a) { leaveIfIdle("#/seance"); return { el: h("div") }; }
  const e = a.entries[a.cursor];
  const ex = exercise(e.exerciseId);
  const now = Date.now();
  const resting = a.restEndsAt && a.restEndsAt > now && !e.clock;
  const exDone = e.sets.length >= e.target.sets;
  const isLast = a.cursor === a.entries.length - 1;
  const allDone = a.entries.every(x => x.sets.length >= x.target.sets);
  const volume = a.entries.reduce((t, x) => t + x.sets.reduce((b, s) => b + s.weight * s.reps, 0), 0);
  const rpeTarget = a.deload ? 6 : CYCLES[a.cycle].rpe;

  const setCursor = i => { a.cursor = i; save(); };

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
    const cardio = ropeDay ? `Corde · S${ropeDay.week}` : plan.replace(/\d.*$/, "").trim() || "Cardio";
    const total = ropeDay ? blocksTotal(ropeDay.blocks) : (dur ? +(dur[2] || dur[1]) : 5) * 60;
    const blocks = ropeDay && ropeDay.blocks[0] > 1 ? ropeDay.blocks : null;
    const ropeNote = rope && h("div", { class: "hint" }, icon("bolt"), h("span", { class: "body-sm" },
      rope.kind === "long" ? `Jour long de corde aujourd'hui (${blocksLabel(rope.blocks)}) : fais-le à part, loin de la muscu.`
      : rope.kind === "recup" ? "Jour récup : technique pure, pas alterné, sauts bas."
      : "Séance facile : tu dois pouvoir la refaire juste après. Sauts de 2 à 3 cm, 110 à 130 tours par minute."));
    const w = a.warm;
    const left = () => Math.max(0, w.total - ((w.paused || Date.now()) - w.start) / 1000);
    const approach = h("div", { class: "hint" }, icon("barbell"),
      h("span", { class: "body-sm" }, "Séries d'approche sur ", h("b", { class: "fort medium" }, ex.name), ` : 2 ou 3 séries légères avant ${kg(e.draft.weight)}.`));
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
        label.textContent = ph.effort ? `Effort ${ph.round} / ${ph.n}` : "Repos";
        sub.textContent = w.paused ? "En pause" : `Reste ${clock(Math.ceil(l))} au total`;
        ringBox.classList.toggle("chauffe", ph.effort);
      };
      const ringBox = h("div", { class: `ring ${done ? "repos" : "chauffe"}${w.paused ? " paused" : ""}` },
        h("svg", { viewBox: "0 0 312 312", width: 312, height: 312, "aria-hidden": "true" }, h("circle", { svg: true, class: "track", cx: 156, cy: 156, r: R }), ring),
        h("div", { class: "ring-center" }, label, time, sub));
      update();
      const toggle = () => { if (w.paused) { w.start += Date.now() - w.paused; w.paused = null; } else w.paused = Date.now(); save(); };
      const el = h("div", { class: "screen workout" }, head,
        h("div", { class: "scroll wo-center" },
          h("div", { class: "wo-hero" },
            ringBox,
            h("p", { class: "body-md discret", style: { margin: 0 } }, "Ensuite : ", h("b", { class: "fort medium" }, mobility))),
          done && approach),
        done
          ? h("div", { class: "wo-commands", style: { gridTemplateColumns: "1fr 1.4fr" } },
              btn("Refaire", { variant: "secondary", size: "lg", onClick: () => { a.warm = null; save(); } }),
              btn("Commencer la séance", { variant: "primary", size: "lg", onClick: begin }), foot)
          : h("div", { class: "wo-commands" },
              btn("Reset", { variant: "secondary", size: "lg", onClick: () => { a.warm = null; save(); } }),
              btn(w.paused ? "Reprendre" : "Pause", { variant: "primary", size: "lg", onClick: toggle }),
              btn("Passer", { variant: "secondary", size: "lg", onClick: begin }), foot));
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

    const el = h("div", { class: "screen workout" },
      h("div", { class: "wo-head" },
        h("div", { class: "wo-top" },
          h("span", { class: "overline" }, a.name, a.deload ? " · deload" : "", " · avant la première série"),
          h("button", { class: "btn ghost xs", onClick: finishSheet }, "Terminer")),
        h("div", null,
          h("h1", { class: "heading-xl" }, "Échauffement"),
          h("p", { class: "body-md discret", style: { margin: "4px 0 0" } }, "Corde à sauter, puis mobilité"))),
      h("div", { class: "scroll wo-center" },
        h("div", { class: "wo-hero" },
          h("div", { class: "overline" }, ropeDay ? `${cardio} · ${ropeDay.kind === "recup" ? "jour récup" : "séance facile"}${ropeDay.deload ? " · deload" : ""}` : cardio),
          h("div", { class: "display-sm num" }, ropeDay ? `${Math.round(total / 60)} min` : dur ? dur[0].replace("-", "–") : clock(total)),
          h("p", { class: "body-md discret", style: { margin: 0 } }, ropeDay ? `${blocksLabel(ropeDay.blocks)}, puis ${mobility}.` : `Montée progressive, puis ${mobility}.`)),
        ropeNote, approach),
      h("div", { class: "wo-commands", style: { gridTemplateColumns: "1fr 1.4fr" } },
        btn("Abandonner", { variant: "secondary", size: "lg", onClick: abandonSheet }),
        btn("C'est parti", { variant: "primary", size: "lg", icon: "timer", onClick: () => { a.warm = { start: Date.now(), paused: null, total, blocks }; save(); } }),
        foot));
    return { el };
  }

  // ——— Héros : repos (anneau) ou série à faire (steppers)
  const interval = isInterval(e);
  const formatLine = e.format === "emom" ? `EMOM ${e.target.rounds} × ${clock(e.target.every)} · ${e.target.repsMin} reps`
    : `Tabata ${e.target.rounds} × ${e.target.work} s / ${e.target.off} s`;
  const draftSteppers = repsLabel => [
    weightStepper(e, "0 = poids du corps"),
    h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, repsLabel),
      stepper({ value: e.draft.reps, min: 0, max: 200, compact: true, label: "reps", onChange: v => { e.draft.reps = v; save(true); } }))];
  let hero, restBtn;
  if (resting) {
    const ring = h("circle", { svg: true, class: "prog", cx: 156, cy: 156, r: R, "stroke-dasharray": C });
    const time = h("div", { class: "display-lg num" });
    // Bouton principal pendant le repos : il se remplit avec le temps écoulé, un tap lance la suite sans attendre.
    // Après la dernière série d'un exercice, le bouton n'affiche que le temps (l'anneau dit déjà la suite).
    const next = exDone ? null : `Série ${e.sets.length + 1}`;
    const fill = h("span", { class: "rest-fill", "aria-hidden": "true" }), btnTime = h("span", { class: "num" });
    restBtn = h("button", { class: `btn lg rest-btn${next ? "" : " solo"}`, type: "button", onClick: () => { a.restEndsAt = null; save(); } },
      fill, next && h("span", { class: "rest-label" }, next), btnTime);
    const update = () => {
      const left = Math.max(0, (a.restEndsAt - Date.now()) / 1000);
      time.textContent = clock(Math.ceil(left));
      ring.setAttribute("stroke-dashoffset", String(C * (1 - left / a.restTotal)));
      btnTime.textContent = clock(Math.ceil(left));
      fill.style.transform = `scaleX(${Math.min(1, 1 - left / a.restTotal)})`;
      restBtn.setAttribute("aria-label", `${next || "Fin du repos"} maintenant, repos restant ${clock(Math.ceil(left))}`);
    };
    update();
    const shift = d => { a.restEndsAt = Math.max(Date.now(), a.restEndsAt + d * 1000); a.restTotal = Math.max(a.restTotal + d, 1); save(true); update(); };
    // Repos : anneau réduit, sans « Ensuite … » (la liste des séries et le bouton du bas disent déjà la suite).
    hero = h("div", { class: "wo-hero rest" },
      h("div", { class: "ring sm" },
        h("svg", { viewBox: "0 0 312 312", "aria-hidden": "true" }, h("circle", { svg: true, class: "track", cx: 156, cy: 156, r: R }), ring),
        h("div", { class: "ring-center" }, h("div", { class: "overline" }, "Repos"), time)),
      h("div", { style: { display: "flex", gap: "8px", marginTop: "8px" } },
        btn("−15 s", { variant: "secondary", size: "sm", onClick: () => shift(-15) }),
        btn("+15 s", { variant: "secondary", size: "sm", onClick: () => shift(15) }),
        btn("Passer", { variant: "ghost", size: "sm", onClick: () => { a.restEndsAt = null; save(); } })));
    hero.update = update;
  } else if (interval && !exDone) {
    const st = intervalState(e);
    if (!st) {
      hero = h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } },
        h("div", { class: "wo-hero", style: { paddingBottom: 0 } },
          h("div", { class: "overline" }, `${FORMATS[e.format]} · round ${e.sets.length + 1} / ${e.target.rounds}`),
          h("div", { class: "display-sm num" }, e.format === "emom" ? clock(e.target.every) : `${e.target.work} / ${e.target.off} s`),
          h("span", { class: "body-sm discret" }, e.format === "emom" ? `${e.target.repsMin} reps au début de chaque intervalle, le reste sert de repos.` : "Effort puis repos, au chrono. Note tes reps à chaque round.")),
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
        const k = e.format === "emom" ? "emom" : x.phase;
        wrap.className = `ring ${k}`;
        over.textContent = e.format === "emom" ? `Round ${Math.min(x.round, e.target.rounds)} / ${e.target.rounds}` : `${x.phase === "effort" ? "Effort" : "Repos"} · round ${Math.min(x.round, e.target.rounds)} / ${e.target.rounds}`;
        time.textContent = clock(Math.ceil(x.left));
        sub.textContent = `${e.sets.length} round${e.sets.length > 1 ? "s" : ""} noté${e.sets.length > 1 ? "s" : ""}`;
        ring.setAttribute("stroke-dashoffset", String(C * (1 - x.left / x.total)));
      };
      update();
      hero = h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } },
        h("div", { class: `wo-hero ${kind}` }, wrap,
          btn("Arrêter le chrono", { variant: "ghost", size: "sm", onClick: () => stopClock(a.cursor) })),
        ...draftSteppers("Reps du round"));
      hero.update = update;
    }
  } else if (exDone) {
    const exVolume = e.sets.reduce((b, x) => b + x.weight * x.reps, 0);
    hero = h("div", { class: "wo-hero" },
      h("div", { class: "overline", style: { color: "var(--etat-succes)" } }, allDone ? "Séance bouclée" : "Exercice terminé"),
      h("span", { class: "body-sm discret num" }, allDone ? "Toutes les séries sont faites. Bien joué."
        : `${e.sets.length} ${interval ? "rounds" : "séries"}${exVolume ? ` · volume ${int(exVolume)} kg` : ""}. ${isLast ? "Il reste des séries sur d'autres exercices." : "Passe à l'exercice suivant."}`));
  } else {
    hero = h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } },
      h("div", { class: "wo-hero", style: { paddingBottom: 0 } },
        h("div", { class: "overline" }, `Série ${e.sets.length + 1} / ${e.target.sets}`),
        h("span", { class: "body-sm discret num" }, `Objectif ${reps(e.target.repsMin, e.target.repsMax)} reps · RPE ${String(rpeTarget).replace(".", ",")}`)),
      e.hint === "charge" && e.sets.length === 0 && h("div", { class: "hint" }, icon("trend"), h("span", { class: "body-sm" }, "Haut de fourchette atteint la dernière fois : ", h("b", { class: "fort medium" }, kg(e.draft.weight)), ".")),
      e.hint === "reps" && e.sets.length === 0 && h("div", { class: "hint" }, icon("trend"), h("span", { class: "body-sm" }, "Même charge, vise ", h("b", { class: "fort medium" }, `${e.draft.reps} reps`), " (une de plus que la dernière fois).")),
      weightStepper(e),
      h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, "Reps"),
        stepper({ value: e.draft.reps, min: 0, max: 100, compact: true, label: "reps", onChange: v => { e.draft.reps = v; save(true); } })),
      h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, "RPE ", h("span", { class: "caption" }, "optionnel")),
        chips([[7, "7"], [8, "8"], [9, "9"], [10, "10"]], e.draft.rpe, v => { e.draft.rpe = v; save(true); })));
  }

  const setsList = (e.sets.length > 0 || !resting) && h("div", { class: "list" },
    Array.from({ length: Math.max(e.target.sets, e.sets.length) }, (_, i) => {
      const s = e.sets[i];
      const cur = !s && i === e.sets.length && !resting;
      return h("div", { class: `set-row${s ? " done" : ""}${cur ? " cur" : ""}` },
        h("span", { class: "set-idx" }, s ? icon("check") : i + 1),
        h("span", { class: `body-md num ${s ? "fort" : "discret"}` }, s ? `${interval ? `Round ${i + 1} · ` : ""}${kg(s.weight)} × ${s.reps}` : cur ? "En cours" : interval ? `Round ${i + 1}` : `${reps(e.target.repsMin, e.target.repsMax)} reps`),
        s?.rpe ? h("span", { class: "caption num" }, `RPE ${s.rpe}`) : s && i === e.sets.length - 1
          ? h("button", { class: "btn ghost xs", onClick: () => { e.sets.pop(); a.restEndsAt = null; save(); } }, "Annuler")
          : h("span"));
    }));

  const segs = a.entries.map((x, i) => h("i", { class: x.sets.length >= x.target.sets ? "on" : i === a.cursor ? "cur" : "" }));
  const canLaunch = interval && !exDone && !e.clock && !e.sets.length;
  const primary = resting && !canLaunch
    ? restBtn
    : allDone || (exDone && isLast)
      ? btn("Terminer", { variant: "primary", size: "lg", onClick: finishSheet })
      : exDone
        ? btn("Suivant", { variant: "primary", size: "lg", onClick: () => setCursor(a.cursor + 1) })
        : canLaunch
          ? btn("Lancer", { variant: "primary", size: "lg", icon: "timer", onClick: () => startClock(a.cursor) })
          : btn(interval ? "Round fait" : "Série faite", { variant: "primary", size: "lg", icon: "check", onClick: () => logSet() });

  const el = h("div", { class: "screen workout" },
    h("div", { class: "wo-head" },
      h("div", { class: "wo-top" },
        h("span", { class: "overline" }, `${a.name} · exercice ${a.cursor + 1} / ${a.entries.length}`),
        h("button", { class: "btn ghost xs", onClick: finishSheet }, "Terminer")),
      h("div", null,
        h("h1", { class: "heading-xl wo-title" }, exerciseTitle(ex)),
        h("p", { class: "body-md discret num", style: { margin: "4px 0 0" } }, interval ? `${ex.muscle} · ${formatLine}` : `${ex.muscle} · repos ${clock(e.target.rest)}`,
          e.equip ? ` · ${EQUIPS[e.equip].toLowerCase()}` : "", e.swappedFrom ? ` · à la place de ${exercise(e.swappedFrom).name}` : "", e.extra ? " · hors programme" : "")),
      h("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
        a.deload && pill("Deload", "attention"),
        !exDone && btn("Machine prise", { variant: "secondary", size: "sm", icon: "swap", onClick: () => swapSheet(a.cursor) }),
        btn("Hors programme", { variant: "secondary", size: "sm", icon: "plus", onClick: extraSheet })),
      h("div", { class: "segments", "aria-label": `${a.entries.filter(x => x.sets.length >= x.target.sets).length} exercices terminés sur ${a.entries.length}` }, segs)),
    h("div", { class: "scroll" },
      ex.pref === "douleur" && h("div", { class: "hint attention" }, icon("warning"), h("span", { class: "body-sm" }, "Tu as signalé une douleur sur cet exercice : charge allégée, amplitude confortable, ou remplace-le.")),
      hero, setsList),
    h("div", { class: "wo-commands" },
      btn("Précédent", { variant: "secondary", size: "lg", disabled: a.cursor === 0, onClick: () => setCursor(a.cursor - 1) }),
      primary,
      btn("Suivant", { variant: "secondary", size: "lg", disabled: isLast, onClick: () => setCursor(a.cursor + 1) }),
      h("p", { class: "caption wo-foot num", style: { gridColumn: "1 / -1", margin: 0 } },
        "Durée ", h("span", { "data-tick": "elapsed" }), ` · volume ${int(volume)} kg`)));

  return {
    el,
    tick() {
      if (interval && e.clock) {
        const x = intervalState(e);
        const key = x.done ? "done" : `${x.round}-${x.phase}`;
        if (e.lastBeep !== key) {
          if (e.lastBeep) beep(x.done ? 660 : x.phase === "effort" ? 880 : 520, 0.15, x.done ? 3 : 1);
          e.lastBeep = key;
        }
        if (x.done) { stopClock(a.cursor); return; }
        hero.update?.();
        return;
      }
      if (!a.restEndsAt) return;
      if (Date.now() >= a.restEndsAt) { a.restEndsAt = null; beep(880, 0.15, 3); save(); return; }
      hero.update?.();
    }
  };
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
          h("span", { class: "caption num" }, (isInterval(e) ? `${FORMATS[e.format]} · ${e.sets.length} rounds · ` : "") + e.sets.map(x => `${x.reps}×${x.weight ? num(x.weight) : "PDC"}`).join(" · "))),
        icon("caretRight", "chev")))),
      s.note && h("div", { class: "card flat" }, h("span", { class: "overline" }, "Journal"), h("p", { class: "body-md", style: { margin: 0 } }, s.note)),
      btn("Retour à l'accueil", { variant: "primary", size: "lg", full: true, onClick: () => go("#/") })));
  return { el };
}

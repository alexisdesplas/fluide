import { save } from "../store.js";
import { corde, cordeWeek, suggestType, markDone, toggleSlot, setCordeWeek, runState, blocksOf, blocksLine, blocksTotal, slotDone, weekDoneCount, doneToday, CORDE_WEEKS, CORDE_CYCLES, CORDE_TYPES, CORDE_SLOTS } from "../corde.js";
import { h, icon, btn, pill, go, clock, segmented, stepper, beep, navbar } from "../ui.js";

// Anneau de Tabatime : 312 px, trait de 34 px.
const R = 139, C = 2 * Math.PI * R;
const SLOT_LABEL = { F1: "F1", F2: "F2", F3: "F3", F4: "F4", F5: "F5", L: "Long", R: "Récup" };

export const weekLabel = w => `Semaine ${w.n} · ${CORDE_CYCLES[w.cycle]}${w.deload ? " · deload" : w.goal ? " · tentative 1 h" : ""}`;
const minutes = s => `${Math.round(s / 60)} min`;

// Échauffement d'une séance de muscu : la corde du jour, en une ligne.
export function cordeLine(legDay) {
  const w = cordeWeek(), type = suggestType({ legDay });
  return `corde semaine ${w.n}, ${CORDE_TYPES[type].toLowerCase()} (${blocksLine(blocksOf(w, type))})`;
}

// Panneau partagé : choix de la séance (facile, jour long, récup) puis chrono par blocs effort / repos.
// get / set : où vit la séance lancée (a.warm pendant l'échauffement, corde().run quand on saute seul).
// before : bouton secondaire avant le départ ; stop : 3e bouton pendant le chrono ; finish : bouton une fois fini.
export function cordePanel({ get, set, legDay = false, after, before, stop, finish, foot }) {
  const run = get();
  const w = run ? CORDE_WEEKS[run.week - 1] : cordeWeek();

  if (!run) {
    let type = suggestType({ legDay });
    const line = h("div", { class: "display-sm num" }), meta = h("span", { class: "body-sm discret num" });
    const warn = h("div", { class: "hint attention" }, icon("warning"), h("span", { class: "body-sm" }, "Jour long avant une séance jambes : garde-le pour un jour loin des jambes si tu peux."));
    const draw = () => {
      const b = blocksOf(w, type);
      line.textContent = blocksLine(b);
      meta.textContent = `${minutes(blocksTotal(b))} · ${type === "R" ? "technique pure : pas alterné, sauts bas" : type === "L" ? "le jour long de la semaine" : "tu dois pouvoir la refaire juste après"}`;
      warn.hidden = !(legDay && type === "L");
    };
    draw();
    const hero = h("div", { class: "wo-hero" },
      h("div", { class: "overline" }, weekLabel(w)),
      segmented(Object.entries(CORDE_TYPES), type, v => { type = v; draw(); }, "sm"),
      line, meta, after);
    return {
      hero: [hero, warn, doneToday() && h("div", { class: "hint" }, icon("check"), h("span", { class: "body-sm" }, "Corde déjà faite aujourd'hui."))],
      commands: h("div", { class: "wo-commands", style: { gridTemplateColumns: before ? "1fr 1.4fr" : "1fr" } },
        before,
        btn("C'est parti", { variant: "primary", size: "lg", icon: "timer", onClick: () => set({ week: w.n, type, start: Date.now(), paused: null, done: false }) }),
        foot)
    };
  }

  const st = runState(run);
  const ring = h("circle", { svg: true, class: "prog", cx: 156, cy: 156, r: R, "stroke-dasharray": C });
  const over = h("div", { class: "overline" }), time = h("div", { class: "display-lg num" }), sub = h("span", { class: "body-sm discret num" });
  const wrap = h("div", { class: "ring" },
    h("svg", { viewBox: "0 0 312 312", width: 312, height: 312, "aria-hidden": "true" }, h("circle", { svg: true, class: "track", cx: 156, cy: 156, r: R }), ring),
    h("div", { class: "ring-center" }, over, time, sub));
  const update = () => {
    const x = runState(run);
    wrap.className = `ring ${x.done ? "repos" : x.phase}${run.paused ? " paused" : ""}`;
    over.textContent = x.done ? "Terminé" : x.blocks > 1 ? `${x.phase === "effort" ? "Effort" : "Repos"} · bloc ${x.block} / ${x.blocks}` : "Non-stop";
    time.textContent = clock(Math.ceil(x.left));
    sub.textContent = x.done ? `${CORDE_TYPES[run.type]} cochée` : run.paused ? "En pause" : x.blocks > 1 ? `Reste ${clock(Math.ceil(x.remaining))}` : `Sur ${clock(x.all)}`;
    ring.setAttribute("stroke-dashoffset", String(x.done ? 0 : C * (1 - x.left / x.total)));
  };
  update();
  const toggle = () => { if (run.paused) { run.start += Date.now() - run.paused; run.paused = null; } else run.paused = Date.now(); save(); };
  const hero = h("div", { class: "wo-hero" },
    h("div", { class: "overline" }, `${weekLabel(w)} · ${CORDE_TYPES[run.type]}`),
    wrap,
    st.done ? after : h("p", { class: "body-md discret num", style: { margin: 0 } }, blocksLine(blocksOf(w, run.type))));
  const renfo = st.done && h("div", { class: "hint" }, icon("bolt"),
    h("span", { class: "body-sm" }, "Renfo, 3 fois par semaine : ", h("b", { class: "fort medium" }, "2 × 15 montées sur pointes lentes"), "."));
  return {
    hero: [hero, renfo],
    commands: st.done
      ? h("div", { class: "wo-commands", style: { gridTemplateColumns: "1fr" } }, btn(finish.label, { variant: "primary", size: "lg", onClick: finish.onClick }), foot)
      : h("div", { class: "wo-commands" },
          btn("Reset", { variant: "secondary", size: "lg", onClick: () => set(null) }),
          btn(run.paused ? "Reprendre" : "Pause", { variant: "primary", size: "lg", onClick: toggle }),
          btn(stop.label, { variant: "secondary", size: "lg", onClick: stop.onClick }), foot),
    tick() {
      if (run.done || run.paused) return;
      const x = runState(run);
      const k = x.done ? "done" : `${x.block}-${x.phase}`;
      if (run.beep !== k) {
        if (run.beep) beep(x.done ? 660 : x.phase === "effort" ? 880 : 520, 0.15, x.done ? 3 : 1);
        run.beep = k;
      }
      if (x.done) { run.done = true; markDone(run.week, run.type); return; }
      update();
    }
  };
}

// Corde seule (jours sans muscu) : écran dédié, la séance lancée survit à la fermeture de l'app.
export function cordeView() {
  const c = corde();
  const panel = cordePanel({
    get: () => c.run, set: r => { c.run = r; save(); },
    stop: { label: "Arrêter", onClick: () => { c.run = null; save(); } },
    finish: { label: "Terminer", onClick: () => { c.run = null; save(); go("#/"); } }
  });
  const el = h("div", { class: "screen workout" },
    navbar({ back: { label: "Aujourd'hui", href: "#/" }, title: "Corde à sauter", subtitle: "Objectif 1 h non-stop" }),
    h("div", { class: "scroll wo-center" }, panel.hero),
    panel.commands);
  return { el, tick: panel.tick };
}

// Carte d'Aujourd'hui : semaine en cours, séances cochées (un tap coche ou décoche), lancement.
export function cordeCard() {
  const c = corde();
  if (!c.on) return null;
  const w = cordeWeek(), type = suggestType();
  const n = weekDoneCount(w.n);
  return h("div", { class: "card" },
    h("div", { class: "card-head" },
      h("div", null, h("div", { class: "overline" }, "Corde à sauter"),
        h("div", { class: "display-xs" }, doneToday() ? "Faite aujourd'hui" : `${CORDE_TYPES[type]} : ${blocksLine(blocksOf(w, type))}`)),
      doneToday() ? pill("Faite", "succes") : pill(`${n} / 7`)),
    h("span", { class: "caption num" }, weekLabel(w)),
    h("div", { class: "chips corde-slots" }, CORDE_SLOTS.map(s => h("button", { type: "button", class: "chip num", "aria-pressed": String(slotDone(w.n, s)),
      "aria-label": `Semaine ${w.n} : ${s === "L" ? "jour long" : s === "R" ? "récup" : `facile ${s.slice(1)}`}`, onClick: () => toggleSlot(w.n, s) }, SLOT_LABEL[s]))),
    h("p", { class: "caption", style: { margin: 0 } }, "Les jours de muscu, l'échauffement lance la corde du jour. Passe à la semaine suivante seulement si tu te réveilles sans fatigue."),
    btn(c.run ? "Reprendre la corde" : "Lancer la corde", { variant: "secondary", size: "lg", full: true, icon: "timer", onClick: () => go("#/corde") }));
}

// Réglages : programme activé ou non, semaine en cours (reprendre plus tôt après une douleur, ou là où on en est).
export function cordeSettings() {
  const c = corde();
  const w = cordeWeek();
  return h("div", { class: "card" },
    h("div", { class: "field" }, h("span", { class: "caption medium" }, "Programme 1 h non-stop"),
      segmented([["on", "Activé"], ["off", "Désactivé"]], c.on ? "on" : "off", v => { c.on = v === "on"; save(); }, "sm")),
    c.on && [
      h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, "Semaine en cours"),
        stepper({ value: w.n, min: 1, max: CORDE_WEEKS.length, compact: true, format: v => `S${v}`, label: "semaine de corde", onChange: v => setCordeWeek(v) })),
      h("p", { class: "caption", style: { margin: 0 } }, "Changer de semaine décoche la semaine choisie et les suivantes. Douleur aux tibias ou au tendon d'Achille le lendemain : 2 jours en récup, puis reprise à la semaine précédente.")],
    !c.on && h("p", { class: "caption", style: { margin: 0 } }, "L'échauffement reprend le réglage ci-dessus."));
}

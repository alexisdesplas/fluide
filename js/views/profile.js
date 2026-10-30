import { state, save, replaceState, ENDURANCE, toggleFav, cyclePosition, startCycle, deloadNow, setMatrix, setTarget, plannedSets, history, sessionRecords, setPref, MUSCLES, STATUS, CYCLES, PREFS } from "../store.js";
import { h, icon, pageHead, navbar, btn, go, int, stepper, segmented, sheet, confirmSheet, toast, dateShort } from "../ui.js";
import { cycleCard } from "./today.js";
import { prefPill } from "./templates.js";

const field = (label, control) => h("div", { class: "field" }, h("span", { class: "caption medium" }, label), control);

function cycleSheet() {
  const c = state.cycle;
  const done = history().filter(s => s.startedAt >= c.start);
  const records = done.reduce((a, s) => a + sessionRecords(s).length, 0);
  let type = c.type === "volume" ? "intensite" : c.type === "intensite" ? "specialisation" : "volume";
  let weeks = 6;
  const desc = h("p", { class: "body-sm discret", style: { margin: 0 } }, CYCLES[type].desc);
  sheet({
    title: "Nouveau bloc", okLabel: "Lancer le bloc",
    body: [
      h("div", { class: "card flat" },
        h("span", { class: "overline" }, `Bloc ${CYCLES[c.type].label} qui se termine`),
        h("span", { class: "body-md fort num" }, `${done.length} séance${done.length > 1 ? "s" : ""} · ${records} record${records > 1 ? "s" : ""} battu${records > 1 ? "s" : ""}`),
        h("span", { class: "caption" }, `Démarré le ${dateShort(c.start).replace(/\.$/, "")}. Redistribue tes réglages Fluide : ce qui passe en progresser, ce qui redescend en maintenir.`)),
      field("Type de bloc", segmented(Object.entries(CYCLES).map(([k, v]) => [k, v.label]), type, v => {
        type = v; desc.textContent = CYCLES[v].desc;
      })),
      desc,
      field("Durée avant deload", stepper({ value: weeks, min: 2, max: 10, compact: true, format: v => `${v} semaines`, label: "semaines", onChange: v => { weeks = v; } }))
    ],
    ok: () => { startCycle(type, weeks); toast(`Bloc ${CYCLES[type].label} lancé`); }
  });
}

// Sur l'iPhone (appli sur l'écran d'accueil), la feuille de partage propose « Enregistrer dans Fichiers » ;
// ailleurs, téléchargement classique.
async function download() {
  const name = `fluide-${new Date().toLocaleDateString("sv-SE")}.json`;
  const json = JSON.stringify(state, null, 2);
  const file = new File([json], name, { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Sauvegarde Fluide" }); return; }
    catch (err) { if (err?.name === "AbortError") return; }
  }
  const a = h("a", { href: URL.createObjectURL(file), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function upload() {
  const input = h("input", { type: "file", accept: "application/json,.json", onChange: async () => {
    try {
      const data = JSON.parse(await input.files[0].text());
      if (!data.exercises || !data.templates || !data.sessions) throw new Error();
      confirmSheet({
        title: "Importer la sauvegarde ?",
        message: `${input.files[0].name} · ${data.sessions.length} séance${data.sessions.length > 1 ? "s" : ""}, ${data.templates.length} séance${data.templates.length > 1 ? "s" : ""} type${data.templates.length > 1 ? "s" : ""}. Tes données actuelles seront remplacées : exporte-les d'abord si besoin.`,
        confirmLabel: "Remplacer mes données", destructive: true,
        onConfirm: () => { replaceState(data); toast("Sauvegarde restaurée"); }
      });
    } catch { toast("Fichier illisible : rien n'a été importé"); }
  } });
  input.click();
}

export function profileView() {
  const p = state.profile;
  const pos = cyclePosition();
  const counts = Object.values(state.matrix).reduce((a, m) => ({ ...a, [m.status]: (a[m.status] || 0) + 1 }), {});
  const prefs = state.exercises.reduce((a, e) => ({ ...a, [e.pref]: (a[e.pref] || 0) + 1 }), {});
  const set = k => v => { p[k] = v; save(true); };

  const el = h("div", { class: "screen" },
    pageHead("Réglages", `${p.goal} · ${p.level} · ${p.days} séances / semaine`),
    h("div", { class: "scroll" },
      cycleCard(true),
      h("div", { style: { display: "grid", gridTemplateColumns: pos.deload || pos.over ? "1fr" : "1fr 1fr", gap: "12px" } },
        btn("Changer de bloc", { variant: "secondary", full: true, onClick: cycleSheet }),
        !pos.deload && !pos.over && btn("Deload maintenant", { variant: "ghost", full: true, onClick: () => {
          confirmSheet({
            title: "Passer en deload ?",
            message: "À faire si sommeil, énergie ou perfs chutent plusieurs séances de suite. Cette semaine, mêmes exercices avec moitié moins de séries ; ensuite tu choisis le bloc suivant.",
            confirmLabel: "Passer en deload cette semaine", cancelLabel: "Garder le bloc",
            onConfirm: deloadNow
          });
        } })),
      h("div", { class: "list" },
        h("button", { class: "row", onClick: () => go("#/profil/matrice") },
          h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, "Réglages Fluide"),
            h("span", { class: "caption" }, ["faible", "focus", "maintien"].filter(s => counts[s]).map(s => `${counts[s]} ${STATUS[s].label.toLowerCase()}`).join(" · "))),
          icon("caretRight", "chev")),
        h("button", { class: "row", onClick: () => go("#/profil/exercices") },
          h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, "Mes exercices"),
            h("span", { class: "caption" }, `${prefs.aime || 0} favoris · ${prefs.evite || 0} évités · ${prefs.douleur || 0} en douleur`)),
          icon("caretRight", "chev"))),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Objectif")),
      h("div", { class: "card" },
        field("Objectif du moment", segmented([["Prise de muscle", "Prise de muscle"], ["Force", "Force"], ["Sèche", "Sèche"]], p.goal, v => { p.goal = v; save(); }, "sm")),
        field("Niveau", segmented([["Débutant", "Débutant"], ["Intermédiaire", "Intermédiaire"], ["Avancé", "Avancé"]], p.level, v => { p.level = v; save(); }, "sm")),
        h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, "Séances / semaine"),
          stepper({ value: p.days, min: 1, max: 7, compact: true, label: "séances par semaine", onChange: set("days") })),
        h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, "Cible de pas / jour"),
          stepper({ value: p.stepsTarget, step: 500, min: 2000, max: 30000, compact: true, format: int, label: "pas par jour", onChange: set("stepsTarget") })),
        field("Échauffement", h("input", { class: "input", value: p.warmup, "aria-label": "Échauffement", onChange: e => { p.warmup = e.target.value; save(true); } })),
        ENDURANCE[p.endurance] && h("p", { class: "caption", style: { margin: 0 } }, `Avec ton plan ${ENDURANCE[p.endurance].short.toLowerCase()}, l'échauffement devient la séance corde du jour (facile ou récup, semaine en cours). Celui-ci sert les jours où le plan prévoit le jour long, à faire à part.`)),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Données")),
      h("p", { class: "caption", style: { margin: 0 } }, "Tout reste sur ce téléphone. Exporte de temps en temps pour garder une sauvegarde."),
      h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
        btn("Exporter", { variant: "secondary", icon: "download", onClick: download }),
        btn("Importer", { variant: "secondary", icon: "upload", onClick: upload }))));
  return { el, tab: "profil" };
}

export function matrixView() {
  const planned = plannedSets();
  const total = Object.values(state.matrix).reduce((a, m) => a + m.target, 0);
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "Réglages Fluide", subtitle: `${total} séries / semaine au total` }),
    h("div", { class: "scroll" },
      h("p", { class: "body-sm discret", style: { margin: 0 } },
        "Pour chaque muscle, dis si tu veux le maintenir, le faire progresser ou en faire ton point faible. Repères par semaine : maintenir 4-8 séries, progresser 10-16, point faible 16-22. On ne pousse pas tout en même temps."),
      MUSCLES.map(m => {
        const { status, target } = state.matrix[m];
        const plan = planned[m] || 0;
        const [lo, hi] = STATUS[status].range;
        return h("div", { class: "card" },
          h("div", { class: "card-head" },
            h("span", { class: "heading-md" }, m),
            h("span", { class: "caption num", style: { color: Math.abs(plan - target) > 2 ? "var(--etat-attention)" : null } }, `${plan} prévues dans tes séances`)),
          segmented(Object.entries(STATUS).map(([k, v]) => [k, v.label]), status, v => setMatrix(m, v), "sm"),
          h("div", { class: "field-row" },
            h("span", { class: "body-sm" }, "Cible ", h("span", { class: "discret" }, `(repère ${lo}-${hi})`)),
            stepper({ value: target, min: 0, max: 30, compact: true, format: v => `${v} série${v > 1 ? "s" : ""}`, label: `séries ${m}`, onChange: v => setTarget(m, v) })));
      })));
  return { el, tab: "profil" };
}

let prefFilter = "all";

export function prefsView() {
  const list = state.exercises.filter(e => prefFilter === "all" || e.pref === prefFilter).sort((a, b) => a.muscle.localeCompare(b.muscle) || a.name.localeCompare(b.name));
  const edit = e => {
    const note = h("textarea", { class: "input", value: e.note || "", placeholder: "Ex. épaule qui tire en bas du mouvement, garder une amplitude courte", "aria-label": "Note" });
    let pref = e.pref;
    sheet({
      title: e.name, okLabel: "Enregistrer",
      body: [
        segmented(Object.entries(PREFS), pref, v => { pref = v; }, "sm"),
        h("p", { class: "caption", style: { margin: 0 } }, "Les favoris passent en tête du catalogue et des alternatives. En cas de douleur, note le mouvement ou l'amplitude à éviter."),
        field("Note", note)
      ],
      ok: () => { e.note = note.value.trim(); setPref(e.id, pref); }
    });
  };
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "Mes exercices", subtitle: `${state.exercises.length} exercices` }),
    h("div", { class: "scroll" },
      segmented([["all", "Tous"], ["aime", "Favoris"], ["evite", "Évités"], ["douleur", "Douleur"]], prefFilter, v => { prefFilter = v; dispatchEvent(new HashChangeEvent("hashchange")); }, "sm"),
      list.length ? h("div", { class: "list" }, list.map(e => h("div", { class: "row pick" },
        h("button", { class: "row-btn", onClick: () => edit(e) },
          h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, e.name), h("span", { class: "caption" }, e.note ? `${e.muscle} · ${e.note}` : e.muscle)),
          e.pref !== "aime" && prefPill(e.pref), icon("caretRight", "chev")),
        e.pref !== "douleur" && h("button", { class: "star", "aria-pressed": String(e.pref === "aime"), "aria-label": e.pref === "aime" ? `Retirer ${e.name} des favoris` : `Mettre ${e.name} en favori`,
          onClick: () => { toggleFav(e.id); dispatchEvent(new HashChangeEvent("hashchange")); } }, icon("star")))))
        : h("div", { class: "card empty" }, h("p", { class: "body-md", style: { margin: 0 } }, "Rien ici pour l'instant."))));
  return { el, tab: "profil" };
}

import { state, save, replaceState, ENDURANCE, enduranceWeek, toggleFav, cyclePosition, inReprise, startCycle, deloadNow, setMuscle, plannedSets, history, sessionRecords, setPref, setAbsent, goalOf, MUSCLES, STATUS, CYCLES, PREFS, GOALS, SPLITS } from "../store.js";
import { h, icon, pageHead, navbar, btn, go, int, num, stepper, segmented, radios, sheet, confirmSheet, toast, dateShort } from "../ui.js";
import { cycleCard } from "./today.js";
import { prefPill } from "./templates.js";
import { accountCard } from "./compte.js";
import { configured, account, signedIn } from "../compte.js";
import { VERSION } from "../version.js";

const field = (label, control) => h("div", { class: "field" }, h("span", { class: "caption medium" }, label), control);

function cycleSheet() {
  const c = state.cycle;
  const done = history().filter(s => s.startedAt >= c.start);
  const records = done.reduce((a, s) => a + sessionRecords(s).length, 0);
  let type = c.type === "volume" ? "intensite" : c.type === "intensite" ? "specialisation" : "volume";
  let weeks = 6;
  sheet({
    title: "Nouveau bloc", okLabel: "Lancer le bloc",
    body: [
      h("div", { class: "card flat" },
        h("span", { class: "overline" }, `Bloc ${CYCLES[c.type].label} qui se termine`),
        h("span", { class: "body-md fort num" }, `${done.length} séance${done.length > 1 ? "s" : ""} · ${records} record${records > 1 ? "s" : ""} battu${records > 1 ? "s" : ""}`),
        h("span", { class: "caption" }, `Démarré le ${dateShort(c.start).replace(/\.$/, "")}. Redistribue tes réglages Fluide : ce qui passe en progresser, ce qui redescend en maintenir.`)),
      field("Type de bloc", radios(Object.entries(CYCLES).map(([k, v]) => [k, v.label, v.desc]), type, v => { type = v; }, "Type de bloc")),
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

const tile = (hue, label, value, caption, href) => h("button", { class: `setting-tile ${hue}`, onClick: () => go(href) },
  h("span", { class: "label" }, label), h("span", { class: "value num" }, value), h("span", { class: "caption num" }, caption));
const line = (label, value, hue, href) => h("button", { class: "row", onClick: () => go(href) },
  h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, label)), h("span", { class: `valeur num ${hue || ""}` }, value), icon("caretRight", "chev"));
const plural = (n, one, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;

// Réglages : six tuiles en trois groupes, chacune avec sa valeur du moment et la couleur de son sens
// (violet programme, rose muscles, jaune exercices, bleu lieux). Dessous, le reste, en lignes.
export function profileView() {
  const p = state.profile, c = state.cycle;
  const pos = cyclePosition();
  const counts = Object.values(state.matrix).reduce((a, m) => ({ ...a, [m.status]: (a[m.status] || 0) + 1 }), {});
  const prefs = state.exercises.reduce((a, e) => ({ ...a, [e.pref]: (a[e.pref] || 0) + 1 }), {});
  const goals = MUSCLES.reduce((a, m) => ({ ...a, [goalOf(m)]: (a[goalOf(m)] || 0) + 1 }), {});
  const [mainGoal, ...otherGoals] = Object.entries(goals).sort((a, b) => b[1] - a[1]);
  const n = state.templates.length;
  const m = account();
  const acct = !configured ? null : signedIn()
    ? h("button", { class: `icon-round ${m.error || m.dirty ? "orange" : "vert"}`, "aria-label": `Compte ${m.email} : ${m.error || m.dirty ? "synchro en attente" : "à jour"}`, onClick: () => go("#/profil/donnees") }, icon("cloudCheck"))
    : h("button", { class: "icon-round", "aria-label": "Compte : se connecter", onClick: () => go("#/profil/donnees") }, icon("userCircle"));

  const el = h("div", { class: "screen" },
    pageHead("Réglages", `${p.goal} · ${p.level.toLowerCase()}`, acct),
    h("div", { class: "scroll" },
      h("h2", { class: "group-title" }, "Rythme"),
      h("div", { class: "tiles" },
        tile("violet", "Ta semaine", plural(p.days, "séance"), `par semaine · ${p.minutes ?? 60} min chacune`, "#/seances/programme/semaine"),
        tile("violet", "Programme", SPLITS[p.split || "perso"].label, n ? plural(n, "séance type", "séances types") : "aucune séance type", "#/seances")),
      h("h2", { class: "group-title" }, "Muscles"),
      h("div", { class: "tiles" },
        tile("rose", "Points forts et faibles", plural(counts.maintien || 0, "fort"), counts.faible ? plural(counts.faible, "point faible", "points faibles") : "aucun point faible", "#/seances/programme/semaine"),
        tile("rose", "Objectif par muscle", GOALS[mainGoal[0]].label, [plural(mainGoal[1], "muscle"), ...otherGoals.map(([k, v]) => `${v} en ${GOALS[k].label.toLowerCase()}`)].join(" · "), "#/profil/matrice")),
      h("h2", { class: "group-title" }, "Exercices et matériel"),
      h("div", { class: "tiles" },
        tile("jaune", "Exercices favoris", plural(prefs.aime || 0, "favori"), `${plural(prefs.evite || 0, "évité")} · ${prefs.douleur || 0} en douleur`, "#/profil/exercices"),
        tile("bleu", "Équipement", "3 lieux", "salle, chez moi, street", "#/profil/lieux")),
      h("h2", { class: "group-title" }, "Et aussi"),
      h("div", { class: "list" },
        line("Objectif additionnel", ENDURANCE[p.endurance] ? `${ENDURANCE[p.endurance].short.split(" ")[0]} · S${enduranceWeek()} / ${ENDURANCE[p.endurance].weeks.length}` : "Aucun", "orange", "#/seances/programme/semaine"),
        line("Bloc", `${CYCLES[c.type].label} · ${pos.over ? "terminé" : pos.reprise ? "reprise" : pos.deload ? "deload" : `semaine ${pos.week} sur ${c.weeks}`}`, "violet", "#/profil/bloc"),
        line("Toi", `${p.age ?? 30} ans · ${num(p.bodyWeight ?? 75)} kg`, "", "#/profil/toi"),
        line("Compte et données", !configured ? "sur ce téléphone" : signedIn() ? (m.error || m.dirty ? "en attente" : "à jour") : "sans compte", signedIn() && !m.error && !m.dirty ? "vert" : "", "#/profil/donnees")),
      h("a", { class: "caption app-version num", href: `https://github.com/alexisdesplas/fluide/releases/tag/v${VERSION}`, target: "_blank", rel: "noopener" }, `Fluide v${VERSION}`)));
  return { el, tab: "profil" };
}

// Bloc : où on en est, changer de bloc, avancer le deload, préparer une reprise.
export function blocView() {
  const pos = cyclePosition();
  const deload = () => confirmSheet({
    title: "Passer en deload ?",
    message: "À faire si sommeil, énergie ou perfs chutent plusieurs séances de suite. Cette semaine, mêmes exercices avec moitié moins de séries ; ensuite tu choisis le bloc suivant.",
    confirmLabel: "Passer en deload cette semaine", cancelLabel: "Garder le bloc",
    onConfirm: deloadNow
  });
  const row = (ic, title, desc, onClick) => h("button", { class: "row", onClick },
    h("span", { class: "lead-round" }, icon(ic)), h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, title), h("span", { class: "caption" }, desc)), icon("caretRight", "chev"));
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "Bloc", subtitle: `${state.cycle.weeks} semaines, puis une semaine de deload.` }),
    h("div", { class: "scroll" },
      cycleCard(),
      h("div", { class: "list" },
        row("swap", "Changer de bloc", "volume, intensité ou spécialisation ; repart en semaine 1", cycleSheet),
        !pos.deload && !pos.over && !pos.reprise && row("down", "Deload maintenant", "une semaine à moitié de volume", deload),
        row("restart", "Reprise après une pause", inReprise()
          ? `en cours jusqu'au ${new Date(state.reprise.end - 86400000).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
          : "malade, en vacances : semaine allégée, bloc décalé", () => go("#/reprise")))));
  return { el, tab: "profil" };
}

// Toi : objectif du moment, niveau, mesures, routine.
// Écran « Toi » : saisie sur écran dédié, rien ne change avant « Enregistrer », le retour annule.
const PROFILE_KEYS = ["goal", "level", "age", "bodyWeight", "stepsTarget", "warmup"];
let youDraft = null;

export function youView() {
  const p = state.profile;
  youDraft ||= { ...Object.fromEntries(PROFILE_KEYS.map(k => [k, p[k]])), age: p.age ?? 30, bodyWeight: p.bodyWeight ?? 75 };
  const d = youDraft;
  const set = k => v => { d[k] = v; };
  const back = () => { youDraft = null; go("#/profil"); };
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Réglages", onClick: back }, title: "Toi", subtitle: "Fluide s'en sert pour régler les reps et le volume." }),
    h("div", { class: "scroll" },
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Objectif du moment")),
      radios(["Prise de muscle", "Force", "Sèche"].map(v => [v, v]), d.goal, set("goal"), "Objectif du moment"),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Niveau")),
      radios(["Débutant", "Intermédiaire", "Avancé"].map(v => [v, v]), d.level, set("level"), "Niveau"),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Mesures")),
      h("div", { class: "card" },
        h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, "Âge"),
          stepper({ value: d.age, min: 14, max: 90, compact: true, format: v => `${v} ans`, label: "âge", onChange: set("age") })),
        h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, "Poids"),
          stepper({ value: d.bodyWeight, step: 0.5, min: 35, max: 200, compact: true, format: v => `${num(v)} kg`, label: "poids", onChange: set("bodyWeight") })),
        h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, "Cible de pas par jour"),
          stepper({ value: d.stepsTarget, step: 500, min: 2000, max: 30000, compact: true, format: int, label: "pas par jour", onChange: set("stepsTarget") }))),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Échauffement")),
      h("input", { class: "input", value: d.warmup, "aria-label": "Échauffement", onInput: e => { d.warmup = e.target.value; } }),
      ENDURANCE[p.endurance] && h("p", { class: "caption", style: { margin: 0 } }, `Avec ton plan ${ENDURANCE[p.endurance].short.toLowerCase()}, l'échauffement devient la séance corde du jour. Celui-ci sert les jours où le plan prévoit le jour long, à faire à part.`),
      btn("Enregistrer", { variant: "primary", size: "lg", full: true, onClick: () => {
        Object.assign(p, d, { warmup: (d.warmup || "").trim() || p.warmup });
        youDraft = null;
        save();
        toast("Profil enregistré");
        go("#/profil");
      } })));
  return { el };
}

// Compte et données : le compte (optionnel), la sauvegarde par fichier, la version installée.
export function dataView() {
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "Compte et données" }),
    h("div", { class: "scroll" },
      accountCard(),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Sauvegarde par fichier")),
      h("p", { class: "caption", style: { margin: 0 } }, "Une copie de tes données dans un fichier, en plus du compte."),
      h("div", { class: "list" },
        h("button", { class: "row", onClick: download }, h("span", { class: "lead-round" }, icon("upload")), h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, "Exporter mes données"), h("span", { class: "caption" }, "un fichier, par la feuille de partage")), icon("caretRight", "chev")),
        h("button", { class: "row", onClick: upload }, h("span", { class: "lead-round" }, icon("download")), h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, "Importer une sauvegarde"), h("span", { class: "caption" }, "remplace les données de ce téléphone")), icon("caretRight", "chev"))),
      // Version installée : la même que la release GitHub, pour savoir si l'iPhone a bien la dernière.
      h("a", { class: "caption app-version num", href: `https://github.com/alexisdesplas/fluide/releases/tag/v${VERSION}`, target: "_blank", rel: "noopener" }, `Fluide v${VERSION}`)));
  return { el, tab: "profil" };
}

// Écran dédié au réglage d'un muscle : volume et objectif. Rien ne change avant « Enregistrer », le retour annule.
// Le brouillon survit à un nouveau rendu (synchro du compte pendant le réglage).
let muscleDraft = null;
export function muscleView({ muscle: m }) {
  if (!MUSCLES.includes(m)) { setTimeout(() => go("#/profil/matrice")); return { el: h("div") }; }
  if (muscleDraft?.key !== location.hash) muscleDraft = { key: location.hash, ...state.matrix[m], goal: goalOf(m) };
  const draft = muscleDraft;
  const planned = plannedSets()[m] || 0;
  const back = () => { muscleDraft = null; go("#/profil/matrice"); };
  const slot = h("div");
  const drawTarget = () => slot.replaceChildren(h("div", { class: "field-row" },
    h("span", { class: "body-sm" }, "Cible ", h("span", { class: "discret" }, `(repère ${STATUS[draft.status].range.join("-")})`)),
    stepper({ value: draft.target, min: 0, max: 30, compact: true, format: v => `${v} série${v > 1 ? "s" : ""}`, label: `séries ${m}`, onChange: v => { draft.target = v; } })));
  drawTarget();
  const el = h("div", { class: "screen no-tabs rose" },
    navbar({ back: { label: "Objectif par muscle", onClick: back }, title: m, subtitle: `${planned} série${planned > 1 ? "s" : ""} prévue${planned > 1 ? "s" : ""} dans tes séances types` }),
    h("div", { class: "scroll" },
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Volume")),
      radios(Object.entries(STATUS).map(([k, v]) => [k, v.label, `${v.range.join("-")} séries par semaine`]), draft.status, v => { draft.status = v; draft.target = STATUS[v].def; drawTarget(); }, `Statut ${m}`),
      slot,
      h("p", { class: "caption", style: { margin: 0 } }, `${planned} série${planned > 1 ? "s" : ""} prévue${planned > 1 ? "s" : ""} dans tes séances types.`),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Objectif")),
      radios(Object.entries(GOALS).map(([k, g]) => [k, g.label, g.desc]), draft.goal, v => { draft.goal = v; }, `Objectif ${m}`),
      h("p", { class: "caption", style: { margin: 0 } }, "Changer l'objectif recale les reps et le repos de ce muscle dans tes séances types."),
      btn("Enregistrer", { variant: "primary", size: "lg", full: true, onClick: () => { setMuscle(m, draft.status, draft.target, draft.goal); back(); } })));
  return { el };
}

// Un muscle par ligne : statut, objectif, cible et séries prévues ; le réglage s'ouvre sur son écran.
export function matrixView() {
  const planned = plannedSets();
  const total = Object.values(state.matrix).reduce((a, m) => a + m.target, 0);
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "Objectif par muscle", subtitle: `${total} séries par semaine au total` }),
    h("div", { class: "scroll" },
      h("p", { class: "body-sm discret", style: { margin: 0 } },
        "Pour chaque muscle, dis si tu veux le maintenir, le faire progresser ou en faire ton point faible (le volume), et ce que tu cherches : force, hypertrophie ou endurance (les reps et le repos). Repères par semaine : maintenir 4-8 séries, progresser 10-16, point faible 16-22."),
      h("div", { class: "list" }, MUSCLES.map(m => {
        const { status, target } = state.matrix[m];
        const plan = planned[m] || 0;
        return h("button", { class: "row", onClick: () => go(`#/profil/matrice/${encodeURIComponent(m)}`) },
          h("div", { class: "row-main" },
            h("span", { class: "body-md fort medium" }, m),
            h("span", { class: "caption num" }, `${STATUS[status].label} · ${GOALS[goalOf(m)].label.toLowerCase()} · cible ${target} · `,
              h("span", { style: { color: Math.abs(plan - target) > 2 ? "var(--etat-attention)" : null } }, `${plan} prévue${plan > 1 ? "s" : ""}`))),
          icon("caretRight", "chev"));
      }))));
  return { el, tab: "profil" };
}

let prefFilter = "aime";

export function prefsView() {
  const list = state.exercises.filter(e => prefFilter === "all" || (prefFilter === "absent" ? e.absent : e.pref === prefFilter)).sort((a, b) => a.muscle.localeCompare(b.muscle) || a.name.localeCompare(b.name));
  const edit = e => {
    const note = h("textarea", { class: "input", value: e.note || "", placeholder: "Ex. épaule qui tire en bas du mouvement, garder une amplitude courte", "aria-label": "Note" });
    let pref = e.pref, absent = !!e.absent;
    sheet({
      title: e.name, okLabel: "Enregistrer",
      body: [
        radios(Object.entries(PREFS), pref, v => { pref = v; }, "Ton avis sur l'exercice"),
        h("p", { class: "caption", style: { margin: 0 } }, "Les favoris passent en tête du catalogue et des alternatives. En cas de douleur, note le mouvement ou l'amplitude à éviter."),
        h("button", { type: "button", class: "radio-card", role: "checkbox", "aria-checked": String(absent),
          onClick: ev => { absent = !absent; ev.currentTarget.setAttribute("aria-checked", String(absent)); } },
          h("span", { class: "radio-dot", "aria-hidden": "true" }),
          h("span", { class: "radio-text" }, h("span", { class: "body-md fort semibold" }, "Pas dans ma salle"),
            h("span", { class: "caption" }, "Plus proposé dans le programme ni les alternatives. Il reste dans le catalogue."))),
        field("Note", note)
      ],
      ok: () => { e.note = note.value.trim(); setAbsent(e.id, absent); setPref(e.id, pref); }
    });
  };
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "Tes exercices", subtitle: "Les favoris passent en premier, partout." }),
    h("div", { class: "scroll" },
      segmented([["aime", "Favoris"], ["evite", "Évités"], ["douleur", "Douleur"], ["absent", "Absents"], ["all", "Tous"]], prefFilter, v => { prefFilter = v; dispatchEvent(new HashChangeEvent("hashchange")); }, "sm"),
      list.length ? h("div", { class: "list" }, list.map(e => h("div", { class: "row pick" },
        h("button", { class: "row-btn", onClick: () => edit(e) },
          h("div", { class: "row-main" }, h("span", { class: "body-md fort" }, e.name), h("span", { class: "caption" }, [e.muscle, e.absent && "pas dans ma salle", e.note].filter(Boolean).join(" · "))),
          e.pref !== "aime" && prefPill(e.pref), icon("caretRight", "chev")),
        e.pref !== "douleur" && h("button", { class: "star", "aria-pressed": String(e.pref === "aime"), "aria-label": e.pref === "aime" ? `Retirer ${e.name} des favoris` : `Mettre ${e.name} en favori`,
          onClick: () => { toggleFav(e.id); dispatchEvent(new HashChangeEvent("hashchange")); } }, icon("star")))))
        : h("div", { class: "empty" }, icon("star"), h("p", { class: "body-md", style: { margin: 0 } }, prefFilter === "aime" ? "Aucun favori. Touche l'étoile d'un exercice, ici dans « Tous » ou pendant la séance." : "Rien ici pour l'instant."))));
  return { el, tab: "profil" };
}

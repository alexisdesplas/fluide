import { state, subscribe } from "./store.js";
import { h, icon, go, clock, unlockAudio, syncRestBeep } from "./ui.js";
import { todayView, stepsLinkView } from "./views/today.js";
import { templatesView, templateView, itemView, pickerView, programView, weekView, importView } from "./views/templates.js";
import { programsView, scheduleView, shareView, invitationView } from "./views/programs.js";
import { workoutView, finishView, editWorkoutView, editSetView, summaryView } from "./views/workout.js";
import { progressView, exerciseProgressView, historyView, sessionView } from "./views/progress.js";
import { profileView, matrixView, muscleView, prefsView, blocView, youView, dataView } from "./views/profile.js";
import { placeView, placesView } from "./views/places.js";
import { repriseView } from "./views/reprise.js";
import { signInView, signUpView, confirmView, resetView, stepsAutoView } from "./views/compte.js";
import { onAccount } from "./compte.js";

// Routes : #/chemin/:param. Chaque vue renvoie { el, tab?, tick? }.
const ROUTES = [
  ["", todayView],
  ["pas/:n", stepsLinkView],
  ["seances", templatesView],
  ["seances/programme", programView],
  ["seances/programme/semaine", weekView],
  ["seances/coller", importView],
  ["seances/programmes", programsView],
  ["seances/semaine-type", scheduleView],
  ["seances/programmes/:pid/partager", shareView],
  ["invitation/:token", invitationView],
  ["seances/:id", templateView],
  ["seances/:id/ajouter", pickerView],
  ["seances/:id/:item", itemView],
  ["seances/:id/:item/remplacer", pickerView],
  ["seance", workoutView],
  ["seance/terminer", finishView],
  ["seance/modifier", editWorkoutView],
  ["seance/serie/:i/:k", editSetView],
  ["bilan/:id", summaryView],
  ["compte", signInView],
  ["compte/creer", signUpView],
  ["compte/valider", confirmView],
  ["compte/nouveau", resetView],
  ["compte/pas", stepsAutoView],
  ["progres", progressView],
  ["progres/historique", historyView],
  ["progres/historique/:id", sessionView],
  ["progres/:id", exerciseProgressView],
  ["profil", profileView],
  ["profil/matrice", matrixView],
  ["profil/matrice/:muscle", muscleView],
  ["profil/exercices", prefsView],
  ["profil/bloc", blocView],
  ["profil/toi", youView],
  ["profil/donnees", dataView],
  ["profil/lieux", placesView],
  ["profil/lieux/:place", placeView],
  ["reprise", repriseView]
];

function match(hash) {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  for (const [pattern, view] of ROUTES) {
    const segs = pattern.split("/").filter(Boolean);
    if (segs.length !== parts.length) continue;
    const params = {};
    if (segs.every((s, i) => (s.startsWith(":") ? ((params[s.slice(1)] = decodeURIComponent(parts[i])), true) : s === parts[i]))) return { view, params };
  }
  return { view: todayView, params: {} };
}

// Trois onglets, en icône seule : Progrès, Aujourd'hui au centre (l'app s'ouvre dessus), Réglages.
// Les séances types vivent dans Réglages : leurs écrans gardent l'onglet Réglages allumé.
const TABS = [
  ["progres", "chart", "Progrès"],
  ["", "barbell", "Aujourd'hui"],
  ["profil", "sliders", "Réglages"]
];
const tabOf = t => (t === "seances" ? "profil" : t);

function tabbar(current) {
  const a = state.active;
  current = tabOf(current);
  return h("div", { class: "tabbar" },
    a && current !== "" && h("div", { class: "tabbar-active" },
      h("button", { class: "btn primary full", onClick: () => go("#/seance") },
        icon("timer"), "Reprendre ", a.name, " · ", h("span", { class: "num", "data-tick": "elapsed" }, clock((Date.now() - a.startedAt) / 1000)))),
    h("nav", { "aria-label": "Navigation principale" },
      TABS.map(([route, ic, label]) => h("button", { class: `tab${route === "" ? " main" : ""}`, "aria-label": label, title: label, "aria-current": current === route ? "page" : null, onClick: () => go(`#/${route}`) }, icon(ic)))));
}

const root = document.getElementById("app");
let current = null;
let lastHash = null;

function render() {
  const { view, params } = match(location.hash);
  const scroller = root.querySelector(".scroll");
  const keep = location.hash === lastHash && scroller ? scroller.scrollTop : 0;
  current = view(params);
  root.replaceChildren(current.el);
  if (current.tab !== undefined) root.append(tabbar(current.tab));
  const next = root.querySelector(".scroll");
  if (next) next.scrollTop = keep;
  lastHash = location.hash;
  tick();
}

function tick() {
  const a = state.active;
  syncRestBeep(a?.restEndsAt || null);
  if (a) root.querySelectorAll('[data-tick="elapsed"]').forEach(el => { el.textContent = clock((Date.now() - a.startedAt) / 1000); });
  current?.tick?.();
}

addEventListener("hashchange", render);
subscribe(() => { if (!document.querySelector("dialog[open]")) render(); });
// État du compte (synchro, déconnexion) : on redessine les Réglages, jamais une saisie en cours.
onAccount(() => { if (["#/profil", "#/profil/donnees"].includes(location.hash) && !document.querySelector("dialog[open]")) render(); });
addEventListener("pointerdown", unlockAudio);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { unlockAudio(); tick(); } });
setInterval(tick, 250);
render();

// Rend la main au rendu après fermeture d'une feuille (les sauvegardes faites pendant sont différées).
document.addEventListener("close", () => setTimeout(render), true);

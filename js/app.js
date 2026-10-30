import { state, subscribe } from "./store.js";
import { h, icon, go, clock, unlockAudio } from "./ui.js";
import { todayView } from "./views/today.js";
import { templatesView, templateView, itemView, pickerView, programView, weekView } from "./views/templates.js";
import { workoutView, finishView, editWorkoutView, summaryView } from "./views/workout.js";
import { progressView, exerciseProgressView, historyView, sessionView } from "./views/progress.js";
import { profileView, matrixView, prefsView } from "./views/profile.js";
import { signInView, signUpView, confirmView, resetView } from "./views/compte.js";
import { onAccount } from "./compte.js";

// Routes : #/chemin/:param. Chaque vue renvoie { el, tab?, tick? }.
const ROUTES = [
  ["", todayView],
  ["seances", templatesView],
  ["seances/programme", programView],
  ["seances/programme/semaine", weekView],
  ["seances/:id", templateView],
  ["seances/:id/ajouter", pickerView],
  ["seances/:id/:item", itemView],
  ["seances/:id/:item/remplacer", pickerView],
  ["seance", workoutView],
  ["seance/terminer", finishView],
  ["seance/modifier", editWorkoutView],
  ["bilan/:id", summaryView],
  ["compte", signInView],
  ["compte/creer", signUpView],
  ["compte/valider", confirmView],
  ["compte/nouveau", resetView],
  ["progres", progressView],
  ["progres/historique", historyView],
  ["progres/historique/:id", sessionView],
  ["progres/:id", exerciseProgressView],
  ["profil", profileView],
  ["profil/matrice", matrixView],
  ["profil/exercices", prefsView]
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

const TABS = [
  ["", "today", "Aujourd'hui"],
  ["seances", "list", "Séances"],
  ["progres", "chart", "Progrès"],
  ["profil", "sliders", "Réglages"]
];

function tabbar(current) {
  const a = state.active;
  return h("div", { class: "tabbar" },
    a && current !== "" && h("div", { class: "tabbar-active" },
      h("button", { class: "btn primary full", onClick: () => go("#/seance") },
        icon("timer"), "Reprendre ", a.name, " · ", h("span", { class: "num", "data-tick": "elapsed" }, clock((Date.now() - a.startedAt) / 1000)))),
    h("nav", { "aria-label": "Navigation principale" },
      TABS.map(([route, ic, label]) => h("button", { class: "tab", "aria-current": current === route ? "page" : null, onClick: () => go(`#/${route}`) }, icon(ic), label))));
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
  if (a) root.querySelectorAll('[data-tick="elapsed"]').forEach(el => { el.textContent = clock((Date.now() - a.startedAt) / 1000); });
  current?.tick?.();
}

addEventListener("hashchange", render);
subscribe(() => { if (!document.querySelector("dialog[open]")) render(); });
// État du compte (synchro, déconnexion) : on redessine les Réglages, jamais une saisie en cours.
onAccount(() => { if (location.hash === "#/profil" && !document.querySelector("dialog[open]")) render(); });
addEventListener("pointerdown", unlockAudio, { once: true });
document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && tick());
setInterval(tick, 250);
render();

// Rend la main au rendu après fermeture d'une feuille (les sauvegardes faites pendant sont différées).
document.addEventListener("close", () => setTimeout(render), true);

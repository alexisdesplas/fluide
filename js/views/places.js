// Lieux de séance : la salle, chez soi, le street. Chacun a son matériel, ses charges et son matériel annexe.
// Le choix se fait d'un tap au démarrage (feuille), la description sur un écran dédié dans Réglages.
import { state, GEAR, PLACES, EXTRAS, placeOf, setPlace, startWorkout } from "../store.js";
import { h, icon, btn, go, num, stepper, navbar, sheet, toast } from "../ui.js";

// Paires d'haltères et kettlebells qu'on peut cocher. « Toutes » : toute la gamme, comme en salle.
const DUMBBELL_LOADS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];
const KETTLEBELL_LOADS = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48];
const BARBELL_MAX = [0, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200];

const listLoads = xs => {
  const sorted = [...xs].sort((a, b) => a - b).map(num);
  return sorted.length > 3 ? `${sorted[0]} à ${sorted.at(-1)} kg` : `${sorted.join(sorted.length === 2 ? " et " : ", ")} kg`;
};

// Une ligne qui dit ce qu'il y a au lieu : « Haltères 5 kg, poids du corps, chaise solide ».
export function placeSummary(key) {
  const p = placeOf(key);
  if (Object.keys(GEAR).every(g => p.gear.includes(g)) && Object.keys(EXTRAS).every(x => p.extras.includes(x)) && !p.dumbbells && !p.kettlebells && !p.barbellMax) return "Tout le matériel";
  const parts = Object.keys(GEAR).filter(g => p.gear.includes(g)).map(g => {
    if (g === "halteres" && p.dumbbells) return `Haltères ${listLoads(p.dumbbells)}`;
    if (g === "kettlebell" && p.kettlebells) return `Kettlebells ${listLoads(p.kettlebells)}`;
    if (g === "barre" && p.barbellMax) return `Barres jusqu'à ${num(p.barbellMax)} kg`;
    return GEAR[g].label;
  });
  const extras = Object.keys(EXTRAS).filter(x => p.extras.includes(x)).map(x => EXTRAS[x]);
  return [...parts, ...extras].map((t, i) => (i ? t[0].toLowerCase() + t.slice(1) : t)).join(", ");
}

// « Où aujourd'hui ? » : un tap et la séance démarre, adaptée au lieu. Le dernier lieu passe en tête.
export function startSheet(templateId) {
  const last = state.profile.place || "gym";
  const order = [last, ...Object.keys(PLACES).filter(k => k !== last)];
  sheet({
    title: "Où aujourd'hui ?",
    body: close => [
      h("div", { class: "list" }, order.map(k => h("button", { type: "button", class: "row", onClick: () => {
        close();
        startWorkout(templateId, k);
        go("#/seance");
      } },
        h("div", { class: "row-main" },
          h("span", { class: "body-md fort medium" }, PLACES[k].label),
          h("span", { class: "caption" }, placeSummary(k))),
        icon("caretRight", "chev")))),
      h("p", { class: "caption", style: { margin: 0 } }, "La séance s'adapte à ce que tu as sur place. Le programme ne change pas.")
    ]
  });
}

// Les trois lieux, en lignes qui ouvrent leur écran (Réglages).
export const placeRows = () => h("div", { class: "list" }, Object.keys(PLACES).map(k =>
  h("button", { class: "row", onClick: () => go(`#/profil/lieux/${k}`) },
    h("div", { class: "row-main" },
      h("span", { class: "body-md fort medium" }, PLACES[k].label),
      h("span", { class: "caption" }, placeSummary(k))),
    icon("caretRight", "chev"))));

// Écran dédié d'un lieu. Rien ne change avant « Enregistrer », le retour annule.
// Le brouillon survit à un nouveau rendu (synchro du compte pendant le réglage).
let placeDraft = null;
export function placeView({ place: key }) {
  if (!PLACES[key]) { setTimeout(() => go("#/profil")); return { el: h("div") }; }
  if (placeDraft?.key !== location.hash) {
    const p = placeOf(key);
    placeDraft = { key: location.hash, ...p, gear: [...p.gear], extras: [...p.extras], dumbbells: p.dumbbells && [...p.dumbbells], kettlebells: p.kettlebells && [...p.kettlebells] };
  }
  const d = placeDraft;
  // Retour à la séance si on vient de « Modifier » avant de commencer.
  const from = state.active ? { label: "Séance", href: "#/seance" } : { label: "Réglages", href: "#/profil" };
  const back = () => { placeDraft = null; go(from.href); };
  const toggleIn = (list, v) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
  const chip = (label, on, onClick) => h("button", { type: "button", class: "chip", "aria-pressed": String(on), onClick }, label);
  const section = (title, caption, ...content) => [
    h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, title)),
    caption && h("p", { class: "caption", style: { margin: 0 } }, caption),
    ...content
  ];
  const loadsSlot = h("div", { class: "place-loads" });
  // Charges cochées une à une, ou « Toutes » pour une gamme complète : l'un exclut l'autre.
  const loadChips = (field, loads, label) => h("div", { class: "chips", role: "group", "aria-label": label },
    chip("Toutes", !d[field], () => { d[field] = d[field] ? null : []; draw(); }),
    loads.map(w => chip(num(w), !!d[field]?.includes(w), () => { d[field] = toggleIn(d[field] || [], w); draw(); })));
  const gearChips = h("div", { class: "chips", role: "group", "aria-label": "Matériel" });
  const draw = () => {
    gearChips.replaceChildren(...Object.entries(GEAR).map(([k, g]) => chip(g.label, d.gear.includes(k), () => {
      const next = toggleIn(d.gear, k);
      if (!next.length) { toast("Garde au moins un matériel"); return; }
      d.gear = next;
      draw();
    })));
    loadsSlot.replaceChildren(...[
      d.gear.includes("halteres") && h("div", { class: "field" }, h("span", { class: "caption medium" }, "Haltères, les charges que tu as (kg par haltère)"), loadChips("dumbbells", DUMBBELL_LOADS, "Charges des haltères")),
      d.gear.includes("kettlebell") && h("div", { class: "field" }, h("span", { class: "caption medium" }, "Kettlebells, les charges que tu as (kg)"), loadChips("kettlebells", KETTLEBELL_LOADS, "Charges des kettlebells")),
      d.gear.includes("barre") && h("div", { class: "field-row" }, h("span", { class: "body-md fort" }, "Barre chargée jusqu'à"),
        stepper({ value: d.barbellMax || 0, values: BARBELL_MAX, compact: true, format: v => (v ? `${v} kg` : "Sans limite"), label: "charge maximale de la barre", onChange: v => { d.barbellMax = v || null; } }))
    ].filter(Boolean));
  };
  draw();
  const save = () => {
    if (d.gear.includes("halteres") && d.dumbbells && !d.dumbbells.length) { toast("Coche au moins une charge d'haltères, ou retire les haltères"); return; }
    if (d.gear.includes("kettlebell") && d.kettlebells && !d.kettlebells.length) { toast("Coche au moins une charge de kettlebell, ou retire les kettlebells"); return; }
    const { key: _, ...spec } = d;
    setPlace(key, spec);
    back();
  };
  const el = h("div", { class: "screen no-tabs big-targets" },
    navbar({ back: { label: from.label, onClick: back }, title: PLACES[key].label }),
    h("div", { class: "scroll" },
      section("Matériel", key === "gym" ? "Le programme se tient à ce matériel." : "Ce que tu as sur place : la séance ne propose que ça.", gearChips, loadsSlot),
      section("Autour", "Un développé couché demande un banc, une traction une barre : sans eux, l'exercice n'est pas proposé.",
        h("div", { class: "chips", role: "group", "aria-label": "Matériel annexe" }, Object.entries(EXTRAS).map(([k, label]) => h("button", { type: "button", class: "chip", "aria-pressed": String(d.extras.includes(k)), onClick: ev => {
          d.extras = toggleIn(d.extras, k);
          ev.currentTarget.setAttribute("aria-pressed", String(d.extras.includes(k)));
        } }, label)))),
      btn("Enregistrer", { variant: "primary", size: "lg", full: true, onClick: save })));
  return { el };
}

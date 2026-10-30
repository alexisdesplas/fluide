// Briques d'interface : création de DOM, icônes, composants Hardwood traduits en HTML.

export function h(tag, props, ...children) {
  const el = tag === "svg" || props?.svg ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false || k === "svg") continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "class") el.setAttribute("class", v);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k in el && !(el instanceof SVGElement)) el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Icônes au tracé Phosphor Regular (grille 256, trait 16).
const PATHS = {
  caretLeft: "M160 208 80 128l80-80",
  caretRight: "M96 48l80 80-80 80",
  plus: "M40 128h176M128 40v176",
  minus: "M40 128h176",
  check: "M40 144l56 56L224 72",
  x: "M200 56 56 200M200 200 56 56",
  today: "M40 48h176v168H40zM176 24v48M80 24v48M40 88h176M96 152l24 24 40-40",
  list: "M88 64h128M88 128h128M88 192h128M44 64h4M44 128h4M44 192h4",
  chart: "M224 208H32V48M224 96l-64 56-64-48-64 56",
  user: "M128 160a56 56 0 1 0 0-112 56 56 0 0 0 0 112zM32 216c19-33 54-56 96-56s77 23 96 56",
  trash: "M216 56H40M104 104v64M152 104v64M200 56v152H56V56M168 56V32H88v24",
  up: "M128 216V40M56 112l72-72 72 72",
  down: "M128 40v176M56 144l72 72 72-72",
  trophy: "M56 56h144v48a72 72 0 0 1-144 0zM96 224h64M128 176v48M56 80H24v16a32 32 0 0 0 32 32M200 80h32v16a32 32 0 0 1-32 32",
  timer: "M128 224a88 88 0 1 0 0-176 88 88 0 0 0 0 176zM128 136V96M104 16h48",
  bolt: "M160 16 48 144h80l-16 96 112-128h-80z",
  steps: "M88 40c-20 0-32 26-32 54s10 42 26 42 26-14 26-42-0-54-20-54zM56 160h52v14a26 26 0 0 1-52 0zM168 72c20 0 32 26 32 54s-10 42-26 42-26-14-26-42 0-54 20-54zM148 192h52v14a26 26 0 0 1-52 0z",
  search: "M112 184a72 72 0 1 0 0-144 72 72 0 0 0 0 144zM163 163l53 53",
  trend: "M232 56l-96 96-40-40-72 72M232 56v64M232 56h-64",
  warning: "M128 104v40M128 180v4M114 40 22 200a16 16 0 0 0 14 24h184a16 16 0 0 0 14-24L142 40a16 16 0 0 0-28 0z",
  pencil: "M92 216H48v-44L168 52l44 44zM136 84l44 44",
  download: "M128 144V32M80 96l48 48 48-48M216 144v64H40v-64",
  upload: "M128 32v112M80 80l48-48 48 48M216 144v64H40v-64",
  barbell: "M64 72h32v112H64zM160 72h32v112h-32zM96 128h64M64 96H40v64h24M192 96h24v64h-24M16 128h24M216 128h24",
  sliders: "M64 40v176M192 40v176M128 40v176M40 168h48M104 88h48M168 136h48",
  swap: "M176 32l32 32-32 32M48 64h160M80 224l-32-32 32-32M208 192H48",
  star: "M128 28l29 63 69 7-52 47 15 68-61-35-61 35 15-68-52-47 69-7z",
  clipboard: "M88 40H56v176h144V40h-32M96 24h64v32H96z",
  play: "M128 224a96 96 0 1 0 0-192 96 96 0 0 0 0 192zM112 96l48 32-48 32z"
};

export function icon(name, cls) {
  const svg = h("svg", { viewBox: "0 0 256 256", fill: "none", stroke: "currentColor", "stroke-width": 16, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", class: cls });
  svg.append(h("path", { svg: true, d: PATHS[name] }));
  return svg;
}

// ——— Formats (français)

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
export const num = n => nf.format(n);
export const int = n => nf0.format(Math.round(n));
export const kg = n => (n === 0 ? "PDC" : `${nf.format(n)} kg`);
export const clock = sec => {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};
export const reps = (min, max) => (min === max ? `${min}` : `${min}–${max}`);
export function ago(t) {
  const d = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(t).setHours(0, 0, 0, 0)) / 86400000);
  if (d <= 0) return "aujourd'hui";
  if (d === 1) return "hier";
  if (d < 7) return `il y a ${d} j`;
  return new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
export const dateLong = t => new Date(t).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
export const dateShort = t => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

// ——— Composants

export const go = hash => { location.hash = hash; };

// Mobile Navigation Bar (Hardwood) : retour 112 px à gauche, titre centré, action texte à droite.
export function navbar({ back, title, subtitle, action }) {
  return h("header", { class: "navbar" },
    h("div", { class: "navbar-inner" },
      h("div", { class: "navbar-side" },
        back && h("button", { class: "navbar-back", "aria-label": `Retour à ${back.label}`, onClick: back.onClick || (() => go(back.href)) },
          icon("caretLeft"), back.label)),
      h("div", { class: "navbar-title" }, h("h1", null, title), subtitle && h("span", null, subtitle)),
      h("div", { class: "navbar-side end" },
        action && h("button", { class: `navbar-action${action.danger ? " danger" : ""}`, onClick: action.onClick, disabled: action.disabled }, action.label))));
}

export function pageHead(title, subtitle, end) {
  return h("div", { class: "page-head" },
    h("div", null, h("h1", { class: "heading-xl" }, title), subtitle && h("p", { class: "body-md discret num" }, subtitle)),
    end || null);
}

export function btn(label, { variant = "secondary", size, icon: ic, full, onClick, disabled, type = "button" } = {}) {
  const cls = ["btn", variant, size, full && "full"].filter(Boolean).join(" ");
  return h("button", { class: cls, type, onClick, disabled }, ic && icon(ic), label);
}

export function pill(label, tone) {
  return h("span", { class: `pill${tone ? " " + tone : ""}` }, h("span", { class: "dot" }), label);
}

// Le groupe tient sa propre sélection : il reste juste même quand l'écran n'est pas redessiné (feuilles).
export function segmented(options, value, onChange, cls = "") {
  let cur = value;
  const buttons = options.map(([v, label]) => h("button", { type: "button", "aria-pressed": String(v === cur), onClick: () => {
    if (v === cur) return;
    cur = v;
    buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(options[i][0] === cur)));
    onChange(v);
  } }, label));
  return h("div", { class: `segmented ${cls}`, role: "group" }, buttons);
}

// Boutons radio (Wireframe – Mobile) : un seul choix parmi 2 à 5 options visibles ensemble, ligne entière cliquable.
// options : [valeur, libellé, explication facultative]. Le groupe tient sa propre sélection, comme le segmenté.
export function radios(options, value, onChange, label) {
  let cur = value;
  const rows = options.map(([v, text, desc]) => h("button", { type: "button", class: "row radio-row", role: "radio", "aria-checked": String(v === cur), onClick: () => {
    if (v === cur) return;
    cur = v;
    rows.forEach((r, i) => r.setAttribute("aria-checked", String(options[i][0] === cur)));
    onChange(v);
  } },
    h("span", { class: "radio-dot", "aria-hidden": "true" }),
    h("span", { class: "row-main" }, h("span", { class: "body-md fort medium" }, text), desc && h("span", { class: "caption" }, desc))));
  return h("div", { class: "list", role: "radiogroup", "aria-label": label }, rows);
}

// Puces : un second tap désélectionne.
export function chips(options, value, onChange) {
  let cur = value;
  const buttons = options.map(([v, label]) => h("button", { type: "button", class: "chip", "aria-pressed": String(v === cur), onClick: () => {
    cur = v === cur ? null : v;
    buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(options[i][0] === cur)));
    onChange(cur);
  } }, label));
  return h("div", { class: "chips" }, buttons);
}

// Stepper : un tap = un pas, maintien appuyé = répétition. La valeur centrale se tape aussi au clavier.
// values : liste des valeurs possibles (charges d'une pile de machine…), les boutons passent de l'une à la suivante.
export function stepper({ value, step = 1, min = 0, max = 9999, values, format = String, unit, compact, editable, label, onChange }) {
  let v = value;
  const move = dir => values
    ? (dir > 0 ? values.find(x => x > v + 0.001) : values.findLast(x => x < v - 0.001)) ?? v
    : v + dir * step;
  const unitText = () => (typeof unit === "function" ? unit(v) : unit);
  const clamp = x => Math.min(max, Math.max(min, Math.round(x * 100) / 100));
  const display = compact
    ? h("span", { class: "value num" }, format(v))
    : h("div", { class: "value" },
        h("input", { value: format(v), inputmode: "decimal", "aria-label": label, readOnly: !editable,
          onChange: e => { const n = parseFloat(e.target.value.replace(",", ".")); set(isNaN(n) ? v : n); },
          onFocus: e => editable && e.target.select() }),
        unit && h("div", { class: "unit" }, unitText()));
  const set = x => {
    v = clamp(x);
    if (compact) display.textContent = format(v);
    else { display.querySelector("input").value = format(v); const u = display.querySelector(".unit"); if (u) u.textContent = unitText(); }
    onChange(v);
  };
  const hold = dir => {
    let timer, rep;
    const stop = () => { clearTimeout(timer); clearInterval(rep); };
    return {
      onPointerdown: e => { e.preventDefault(); set(move(dir)); timer = setTimeout(() => { rep = setInterval(() => set(move(dir)), 90); }, 400); },
      onPointerup: stop, onPointerleave: stop, onPointercancel: stop,
      onClick: e => { if (e.detail === 0) set(move(dir)); }
    };
  };
  return h("div", { class: `stepper${compact ? " compact" : ""}` },
    h("button", { type: "button", "aria-label": `Moins${label ? " " + label : ""}`, ...hold(-1) }, icon("minus")),
    display,
    h("button", { type: "button", "aria-label": `Plus${label ? " " + label : ""}`, ...hold(1) }, icon("plus")));
}

// Feuille qui monte du bas, dans un <dialog> : poignée, titre à gauche, croix de 44 px à droite,
// et l'action qui valide en bas du corps (jamais dans l'en-tête).
export function sheet({ title, body, ok, okLabel = "Valider" }) {
  const dlg = h("dialog", { class: "sheet", "aria-label": title, onClose: () => dlg.remove() });
  const close = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) close(); });
  dlg.append(
    h("div", { class: "sheet-grab", "aria-hidden": "true" }),
    h("div", { class: "sheet-head" },
      h("h2", null, title),
      h("button", { class: "sheet-close", type: "button", "aria-label": "Fermer", onClick: close }, icon("x"))),
    h("div", { class: "sheet-body" }, typeof body === "function" ? body(close) : body,
      ok && btn(okLabel, { variant: "primary", size: "lg", full: true, onClick: () => { if (ok() !== false) close(); } })));
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

// Confirmation dans une feuille, à la place du confirm() natif : le geste qui engage en premier,
// la sortie sans risque en dessous.
export function confirmSheet({ title, message, confirmLabel, cancelLabel = "Annuler", destructive, onConfirm }) {
  return sheet({
    title,
    body: close => [
      h("p", { class: "body-md", style: { margin: 0 } }, message),
      btn(confirmLabel, { variant: destructive ? "destructive" : "primary", size: "lg", full: true, onClick: () => { close(); onConfirm(); } }),
      btn(cancelLabel, { variant: "ghost", full: true, onClick: close })
    ]
  });
}

export function toast(text) {
  document.querySelector(".toast")?.remove();
  const t = h("div", { class: "toast", role: "status" }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), 2500);
}

// Courbe : points {x: temps, y}, axe des y resserré sur les données.
export function lineChart(points, { format = num } = {}) {
  const W = 340, H = 160, pl = 36, pr = 8, pt = 12, pb = 22;
  const svg = h("svg", { class: "chart", viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none", role: "img" });
  if (!points.length) return svg;
  const ys = points.map(p => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  const pad = (hi - lo) * 0.15 || Math.max(1, hi * 0.05);
  lo -= pad; hi += pad;
  const x0 = points[0].x, x1 = points.at(-1).x;
  const X = x => (points.length === 1 ? (W + pl - pr) / 2 : pl + ((x - x0) / (x1 - x0 || 1)) * (W - pl - pr));
  const Y = y => pt + (1 - (y - lo) / (hi - lo)) * (H - pt - pb);
  const S = (tag, a) => h(tag, { svg: true, ...a });
  for (const t of [0, 0.5, 1]) {
    const v = lo + (hi - lo) * (1 - t), y = pt + t * (H - pt - pb);
    svg.append(S("line", { class: "grid", x1: pl, x2: W - pr, y1: y, y2: y }), S("text", { x: 0, y: y + 4 }, format(v)));
  }
  const d = points.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(" ");
  if (points.length > 1) {
    svg.append(S("path", { class: "area", d: `${d} L${X(x1)} ${H - pb} L${X(x0)} ${H - pb} Z` }), S("path", { class: "line", d }));
  }
  for (const p of points) svg.append(S("circle", { class: "pt", cx: X(p.x), cy: Y(p.y), r: 3 }));
  svg.append(S("text", { x: pl, y: H - 4 }, dateShort(x0)));
  if (points.length > 1) svg.append(S("text", { x: W - pr, y: H - 4, "text-anchor": "end" }, dateShort(x1)));
  svg.setAttribute("aria-label", `Courbe de ${format(points[0].y)} à ${format(points.at(-1).y)}`);
  return svg;
}

export function spark(values) {
  const svg = h("svg", { class: "spark", viewBox: "0 0 64 24", "aria-hidden": "true" });
  if (values.length < 2) return svg;
  const lo = Math.min(...values), hi = Math.max(...values), r = hi - lo || 1;
  const d = values.map((v, i) => `${i ? "L" : "M"}${(i / (values.length - 1)) * 62 + 1} ${22 - ((v - lo) / r) * 20}`).join(" ");
  svg.append(h("path", { svg: true, d }));
  return svg;
}

// Bip de fin de repos (Web Audio, débloqué au premier tap comme dans Tabatime).
let audio;
export function unlockAudio() {
  if (!audio) try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  audio?.state === "suspended" && audio.resume();
}
export function beep(freq = 880, dur = 0.15, times = 1) {
  if (!audio) return;
  for (let i = 0; i < times; i++) {
    const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + i * 0.25;
    o.frequency.value = freq; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }
}

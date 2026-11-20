// Programmes enregistrés, semaine type et partage d'un programme par lien.
import { state, save, activeProgram, programById, programTemplates, switchProgram, createProgram, renameProgram, duplicateProgram, deleteProgram,
  setWeekDay, spreadWeek, hasWeekPlan, weekdayIndex, WEEKDAYS, exportProgram, addSharedProgram } from "../store.js";
import { h, icon, navbar, btn, pill, go, sheet, confirmSheet, toast, radios } from "../ui.js";
import { configured, signedIn, createShare, getShare, setPendingInvite, suggestEmail, SHARE_DAYS } from "../compte.js";
import { estimate } from "./today.js";
import { niceName, nameSheet } from "./templates.js";

const EMAIL = /^\S+@\S+\.\S+$/;
const plural = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;
const shortDay = d => WEEKDAYS[d].slice(0, 3).toLowerCase();
// « lun · mer · ven », ou rien sans semaine type.
export const weekDays = p => p.week.map((id, d) => id && shortDay(d)).filter(Boolean).join(" · ");
export const programLine = p => {
  const n = programTemplates(p).length, days = weekDays(p);
  return `${plural(n, "séance")} · ${days || "pas de semaine type"}`;
};

// ——— Mes programmes : un seul en cours (Aujourd'hui y prend la séance du jour), les autres gardés tels quels.
export function programsView() {
  const cur = activeProgram();
  const actions = p => {
    const active = p.id === cur.id;
    sheet({ title: p.name, body: close => [
      p.sharedBy && h("p", { class: "caption", style: { margin: 0 } }, `Partagé par ${p.sharedBy}.`),
      active
        ? btn("Voir les séances", { variant: "primary", size: "lg", full: true, onClick: () => { close(); go("#/seances"); } })
        : btn("Utiliser ce programme", { variant: "primary", size: "lg", full: true, onClick: () => {
            close(); switchProgram(p.id); toast(`« ${p.name} » en cours`); go("#/seances"); } }),
      btn("Partager par e-mail", { variant: "secondary", full: true, icon: "upload", onClick: () => { close(); go(`#/seances/programmes/${p.id}/partager`); } }),
      btn("Renommer", { variant: "secondary", full: true, icon: "pencil", onClick: () => { close(); setTimeout(() => nameSheet({ title: "Renommer le programme", value: p.name, okLabel: "Renommer",
        placeholder: "Ex. Prise de masse, Été, Client Paul", onOk: v => renameProgram(p.id, v) })); } }),
      btn("Dupliquer", { variant: "secondary", full: true, icon: "clipboard", onClick: () => { close(); const c = duplicateProgram(p.id); toast(`« ${c.name} » créé`); } }),
      !active && btn("Supprimer", { variant: "danger", full: true, onClick: () => { close(); setTimeout(() => confirmSheet({
        title: "Supprimer le programme ?", message: `« ${p.name} » et ses séances disparaissent de tes programmes. Les séances déjà faites restent dans l'historique et les courbes.`,
        confirmLabel: "Supprimer le programme", cancelLabel: "Garder le programme", destructive: true, onConfirm: () => { deleteProgram(p.id); toast("Programme supprimé"); } })); } })
    ].filter(Boolean) });
  };
  const card = p => {
    const active = p.id === cur.id;
    return h("button", { class: `card tap${active ? " violet" : ""}`, onClick: () => actions(p), "aria-label": `${p.name}${active ? ", en cours" : ""} : actions` },
      h("div", { class: "card-head" }, h("span", { class: `display-xs${active ? " violet" : ""}` }, p.name), active ? pill("En cours", "tag") : icon("caretRight", "chev discret")),
      h("span", { class: "body-sm num" }, programLine(p)),
      p.sharedBy && h("span", { class: "caption" }, `Partagé par ${p.sharedBy}`));
  };
  const list = [cur, ...state.programs.filter(p => p.id !== cur.id).sort((a, b) => a.name.localeCompare(b.name))];
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Programme", href: "#/seances" }, title: "Mes programmes", subtitle: "Un seul en cours : Aujourd'hui y prend la séance du jour.",
      action: { label: "Nouveau", onClick: () => nameSheet({ title: "Nouveau programme", okLabel: "Créer le programme", placeholder: "Ex. Prise de masse, Été, Client Paul",
        onOk: v => { const p = createProgram(v); toast(`« ${p.name} » créé et en cours`); setTimeout(() => go("#/seances")); } }) } }),
    h("div", { class: "scroll" },
      ...list.map(card),
      btn("Programme recommandé", { variant: "secondary", size: "lg", full: true, onClick: () => go("#/seances/programme") }),
      h("p", { class: "caption", style: { margin: 0 } }, "Le programme recommandé est construit pour ta semaine. Il s'ajoute ici, l'ancien reste.")));
  return { el, tab: "seances" };
}

// ——— Semaine type du programme en cours : un jour, une séance (ou repos). Aujourd'hui suit ce plan.
export function scheduleView() {
  const p = activeProgram(), today = weekdayIndex();
  const ts = state.templates.filter(t => t.items.length);
  const pickDay = d => sheet({ title: WEEKDAYS[d], body: close => radios(
    [["", "Repos", "Pas de séance ce jour-là"], ...ts.map(t => [t.id, t.name, `${plural(t.items.length, "exercice")} · ~${estimate(t)} min`])],
    p.week[d] || "", v => { setWeekDay(d, v || null); close(); }, `Séance du ${WEEKDAYS[d].toLowerCase()}`) });
  const rows = WEEKDAYS.map((day, d) => {
    const t = p.week[d] && state.templates.find(x => x.id === p.week[d]);
    return h("button", { class: `row plan-day${t ? " on" : ""}${d === today ? " is-today" : ""}`, onClick: () => pickDay(d), "aria-label": `${day} : ${t ? t.name : "repos"}. Changer` },
      h("div", { class: "row-main" },
        h("span", { class: "body-md fort medium" }, day, d === today && h("span", { class: "caption" }, " · aujourd'hui")),
        h("span", { class: "caption num" }, t ? `${plural(t.items.length, "exercice")} · ~${estimate(t)} min` : "Repos")),
      h("span", { class: `valeur${t ? " violet" : ""}` }, t ? t.name : "Repos"), icon("caretRight", "chev"));
  });
  const unplaced = ts.filter(t => !p.week.includes(t.id));
  const spread = () => { spreadWeek(); toast("Séances réparties sur la semaine"); };
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Programme", href: "#/seances" }, title: "Semaine type", subtitle: p.name }),
    h("div", { class: "scroll" }, ...(ts.length ? [
      h("p", { class: "body-sm discret", style: { margin: 0 } }, "Aujourd'hui te propose la séance prévue ce jour-là. Un jour de repos, si tu t'entraînes quand même, Fluide propose la séance la moins récente."),
      h("div", { class: "list" }, rows),
      unplaced.length > 0 && hasWeekPlan(p) && h("div", { class: "hint" }, icon("calendar"),
        h("span", { class: "body-sm" }, h("b", { class: "fort" }, "Pas dans la semaine : "), `${unplaced.map(t => t.name).join(", ")}. Touche un jour pour l'y mettre.`)),
      btn("Répartir automatiquement", { variant: "secondary", size: "lg", full: true, icon: "calendar", onClick: () => hasWeekPlan(p)
        ? confirmSheet({ title: "Répartir les séances ?", message: `Tes ${plural(ts.length, "séance")} sont placées à intervalles réguliers, à partir du lundi. Les jours déjà choisis sont remplacés.`,
            confirmLabel: "Répartir", cancelLabel: "Garder ma semaine", onConfirm: spread })
        : spread() })
    ] : [h("div", { class: "empty" }, icon("calendar"), h("h2", { class: "display-xs" }, "Aucune séance"),
        h("p", { class: "body-sm discret", style: { margin: 0 } }, "Crée d'abord les séances du programme, puis place-les dans la semaine."),
        btn("Voir le programme", { variant: "primary", size: "lg", full: true, onClick: () => go("#/seances") }))])));
  return { el };
}

// ——— Partager un programme : un lien par personne, envoyé par e-mail depuis le téléphone (Mail s'ouvre, rien ne part sans toi).
let shared = null; // { pid, url, recipient, sender, name }

const mailto = s => {
  const subject = `${s.sender} te partage son programme « ${s.name} » sur Fluide`;
  const body = [`Salut,`, ``, `Je t'ai préparé un programme de musculation sur Fluide : « ${s.name} ».`, ``,
    `Ouvre ce lien sur ton téléphone pour le voir, l'ajouter et créer ton compte :`, s.url, ``,
    `Le lien marche ${SHARE_DAYS} jours.`, ``, s.sender].join("\n");
  return `mailto:${s.recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export function shareView({ pid }) {
  const p = programById(pid);
  if (!p) { setTimeout(() => go("#/seances/programmes")); return { el: h("div") }; }
  if (shared?.pid !== pid) shared = null;
  const back = () => { shared = null; go("#/seances/programmes"); };
  const ts = programTemplates(p).filter(t => t.items.length);
  const body = h("div", { class: "scroll" });
  const summary = h("div", { class: "card violet" },
    h("div", null, h("div", { class: "overline" }, "Programme partagé"), h("div", { class: "display-xs violet" }, p.name)),
    h("span", { class: "body-sm num" }, programLine(p)),
    ts.length > 0 && h("span", { class: "caption" }, ts.map(t => t.name).join(" · ")));

  const draw = () => {
    if (!configured || !signedIn() || !ts.length) {
      body.replaceChildren(...[summary,
        !ts.length ? h("div", { class: "hint attention" }, icon("warning"), h("span", { class: "body-sm" }, "Ce programme n'a aucune séance à partager."))
        : !configured ? h("div", { class: "hint attention" }, icon("warning"), h("span", { class: "body-sm" }, "Le partage passe par un compte Fluide, pas configuré sur cette app."))
        : h("p", { class: "body-md", style: { margin: 0 } }, "Le lien est gardé sur ton compte Fluide : connecte-toi pour partager."),
        configured && !signedIn() && ts.length > 0 && btn("Me connecter", { variant: "primary", size: "lg", full: true, onClick: () => go("#/compte") })
      ].filter(Boolean));
      return;
    }
    if (shared) {
      const field = h("input", { class: "input num", readOnly: true, value: shared.url, "aria-label": "Lien de partage", onFocus: e => e.target.select() });
      body.replaceChildren(...[summary,
        h("div", { class: "hint vert" }, icon("check"), h("span", { class: "body-sm" }, h("b", { class: "fort" }, "Lien prêt. "), `Valable ${SHARE_DAYS} jours, pour ${shared.recipient}.`)),
        field,
        btn("Écrire l'e-mail", { variant: "primary", size: "lg", full: true, icon: "upload", onClick: () => { location.href = mailto(shared); } }),
        navigator.share && btn("Partager autrement", { variant: "secondary", full: true, onClick: () => navigator.share({ title: p.name, text: `${shared.sender} te partage son programme « ${p.name} » sur Fluide`, url: shared.url }).catch(() => {}) }),
        btn("Copier le lien", { variant: "secondary", full: true, icon: "clipboard", onClick: async () => {
          try { await navigator.clipboard.writeText(shared.url); toast("Lien copié"); } catch { field.focus(); toast("Copie refusée : sélectionne le lien"); } } }),
        btn("Partager à quelqu'un d'autre", { variant: "ghost", full: true, onClick: () => { shared = null; draw(); } })
      ].filter(Boolean));
      return;
    }
    const sender = h("input", { class: "input", value: state.profile.firstName || "", maxLength: 60, autocomplete: "given-name", placeholder: "Ex. Alexis", "aria-label": "Ton prénom" });
    const recipient = h("input", { class: "input", type: "email", inputmode: "email", autocapitalize: "off", autocomplete: "off", placeholder: "prenom@exemple.fr", "aria-label": "E-mail de la personne" });
    const error = h("p", { class: "caption", role: "alert", style: { margin: 0, color: "var(--rouge)" }, hidden: true });
    const fail = msg => { error.hidden = !msg; error.textContent = msg || ""; };
    const submit = btn("Créer le lien", { variant: "primary", size: "lg", full: true, type: "submit" });
    const form = h("form", { class: "field", style: { gap: "16px" }, onSubmit: async ev => {
      ev.preventDefault();
      const name = sender.value.trim(), mail = recipient.value.trim().toLowerCase();
      if (!name) { fail("Ton prénom : la personne doit savoir de qui vient le programme."); sender.focus(); return; }
      if (!EMAIL.test(mail)) { fail("Adresse e-mail invalide."); recipient.focus(); return; }
      fail(null);
      state.profile.firstName = name; save(true);
      submit.disabled = true; submit.lastChild.textContent = "Un instant…";
      try {
        const { url } = await createShare({ program: exportProgram(p), sender: name, recipient: mail });
        shared = { pid, url, recipient: mail, sender: name, name: p.name };
        draw();
      } catch (e) {
        fail(e instanceof TypeError ? "Pas de réseau : réessaie quand tu es connecté." : e.message);
        submit.disabled = false; submit.lastChild.textContent = "Créer le lien";
      }
    } },
      h("label", { class: "field" }, h("span", { class: "caption medium" }, "Ton prénom"), sender),
      h("label", { class: "field" }, h("span", { class: "caption medium" }, "E-mail de la personne"), recipient),
      error, submit);
    body.replaceChildren(summary,
      h("p", { class: "body-sm discret", style: { margin: 0 } }, `La personne reçoit un lien pour voir le programme, l'ajouter à son Fluide et créer son compte. C'est une copie : tes changements suivants ne la suivent pas. Le lien marche ${SHARE_DAYS} jours.`),
      form);
  };
  draw();
  const el = h("div", { class: "screen no-tabs" }, navbar({ back: { label: "Mes programmes", onClick: back }, title: "Partager", subtitle: "par e-mail, avec un lien d'inscription" }), body);
  return { el };
}

// ——— Invitation : le lien reçu par e-mail. On voit le programme sans compte, mais il ne s'ajoute qu'avec un compte
// (demande d'Alexis : inscription obligatoire). Sans session, l'invitation attend sur le téléphone et rejoint le compte
// à la connexion (compte.js, adoptInvite) ; connecté, « Ajouter à mon Fluide » l'ajoute tout de suite.
let invitation = null; // { code, status: "loading" | "ready" | "missing" | "error", data?, error? }

export function invitationView({ token: code }) {
  const body = h("div", { class: "scroll" });
  const bar = h("div", { class: "cta-bar invite-bar" });
  const load = () => {
    invitation = { code, status: "loading" };
    getShare(code).then(data => { invitation = data?.program ? { code, status: "ready", data } : { code, status: "missing" }; })
      .catch(e => { invitation = { code, status: "error", error: e instanceof TypeError ? "Pas de réseau : réessaie quand tu es connecté." : e.message }; })
      .finally(() => { if (invitation.code === code && body.isConnected) draw(); });
  };
  if (invitation?.code !== code || invitation.status === "error") load();

  const accept = () => {
    const { sender, program } = invitation.data;
    const r = addSharedProgram({ token: code, sender, program });
    if (r.error) { toast(r.error); return null; }
    return r.program;
  };
  const draw = () => {
    const inv = invitation;
    bar.replaceChildren();
    if (inv.status === "loading") { body.replaceChildren(h("p", { class: "body-md discret", role: "status", style: { margin: 0 } }, "Ouverture du programme…")); return; }
    if (inv.status !== "ready") {
      body.replaceChildren(h("div", { class: "empty" }, icon(inv.status === "missing" ? "calendar" : "warning"),
        h("h2", { class: "display-xs" }, inv.status === "missing" ? "Lien expiré ou introuvable" : "Lien illisible pour l'instant"),
        h("p", { class: "body-sm discret", style: { margin: 0 } }, inv.status === "missing"
          ? `Un lien de partage marche ${SHARE_DAYS} jours. Demande un nouveau lien à la personne qui te l'a envoyé.` : inv.error),
        inv.status === "error" && btn("Réessayer", { variant: "primary", size: "lg", full: true, onClick: () => { load(); draw(); } }),
        btn("Ouvrir Fluide", { variant: "secondary", size: "lg", full: true, onClick: () => go("#/") })));
      return;
    }
    const { sender, recipient, program } = inv.data;
    const templates = Array.isArray(program.templates) ? program.templates : [];
    const week = Array.isArray(program.week) ? program.week : [];
    const days = week.map((i, d) => Number.isInteger(i) && templates[i] && [d, templates[i].name]).filter(Boolean);
    const already = state.programs.find(p => p.sharedFrom === code);
    // Pas de compte : rien n'est ajouté, l'invitation attend la connexion.
    const wait = to => { setPendingInvite({ token: code, sender, program }); suggestEmail(recipient); go(to); };
    const ctas = already
      ? [h("div", { class: "hint vert" }, icon("check"), h("span", { class: "body-sm" }, `Déjà dans tes programmes : « ${already.name} ».`)),
          btn("Voir le programme", { variant: "primary", size: "lg", full: true, onClick: () => { switchProgram(already.id); go("#/seances"); } })]
      : signedIn()
        ? [btn("Ajouter à mon Fluide", { variant: "primary", size: "lg", full: true, onClick: () => { const p = accept(); if (p) { toast(`« ${p.name} » ajouté et en cours`); go("#/seances"); } } })]
        : [btn("Créer mon compte pour l'ajouter", { variant: "primary", size: "lg", full: true, onClick: () => wait("#/compte/creer") }),
            btn("J'ai déjà un compte", { variant: "ghost", full: true, onClick: () => wait("#/compte") })];
    body.replaceChildren(...[
      h("div", { class: "card violet" },
        h("div", null, h("div", { class: "overline" }, `${sender || "Quelqu'un"} te partage`), h("div", { class: "display-xs violet" }, program.name || "Un programme")),
        h("span", { class: "body-sm num" }, `${plural(templates.length, "séance")}${days.length ? ` · ${days.map(([d]) => shortDay(d)).join(" · ")}` : ""}`)),
      h("p", { class: "body-sm discret", style: { margin: 0 } }, "Fluide est un carnet de musculation : il te dit chaque jour quelle séance faire et retient tes charges, série après série. Crée ton compte (gratuit) : le programme s'y ajoute dès que tu es connecté, et te suit sur tous tes téléphones."),
      days.length > 0 && h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Ta semaine")),
      days.length > 0 && h("div", { class: "list" }, days.map(([d, name]) => h("div", { class: "row" },
        h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, WEEKDAYS[d])), h("span", { class: "valeur violet" }, name)))),
      ...templates.flatMap(t => {
        const items = Array.isArray(t.items) ? t.items : [];
        const sets = items.reduce((a, it) => a + (Number(it.sets) || Number(it.rounds) || 0), 0);
        return [
          h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, t.name), h("span", { class: "caption num" }, `${plural(items.length, "exercice")} · ${sets} séries`)),
          h("div", { class: "list" }, items.map((it, i) => h("div", { class: `row${it.group ? " grouped" : ""}` },
            h("span", { class: "num-lead", "aria-hidden": "true" }, i + 1),
            h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, niceName(String(it.exercise || "Exercice"))),
              h("span", { class: "caption num" }, it.format === "emom" || it.format === "tabata" ? `${it.format.toUpperCase()} · ${it.rounds} rounds`
                : `${it.sets} × ${Array.isArray(it.reps) ? (it.reps[0] === it.reps[1] ? it.reps[0] : `${it.reps[0]}–${it.reps[1]}`) : it.reps}${it.group ? ` · superset ${it.group}` : ""}`)))))];
      })
    ].filter(Boolean));
    bar.replaceChildren(...ctas);
  };
  draw();
  const el = h("div", { class: "screen no-tabs has-cta invite" }, navbar({ title: "Invitation", subtitle: "un programme pour toi" }), body, bar);
  return { el };
}


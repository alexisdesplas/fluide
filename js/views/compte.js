import { configured, account, signedIn, confirmed, clearConfirmed, signIn, signUp, sendReset, recovering, setNewPassword, remoteSummary, resolve, signOut, syncNow, shortcutKeyInfo, newShortcutKey, deleteShortcutKey } from "../compte.js";
import { state } from "../store.js";
import { h, icon, btn, pill, go, navbar, sheet, confirmSheet, toast, dateShort, int } from "../ui.js";

// Guide de construction du Raccourci iOS (les livrables ne sont pas déployés sur Vercel : on le lit sur GitHub).
export const RACCOURCI_PAS = "https://github.com/alexisdesplas/fluide/blob/main/livrables/fluide/raccourci-pas.md";

// Écrans alignés sur Figma, section F · Compte : en-tête de compte (tuile + titre + texte), champs avec l'erreur
// sous le champ, bouton, puis le lien de bascule en bas (Se connecter ↔ Créer mon compte).

// Messages de Supabase (en anglais) traduits, et le champ qui porte l'erreur.
function why(e) {
  const at = (field, msg) => ({ field, msg });
  if (e instanceof TypeError) return at(null, "Pas de réseau : réessaie une fois connecté.");
  if (e.code === "invalid_credentials" || /invalid login/i.test(e.message)) return at("password", "E-mail ou mot de passe incorrect.");
  if (e.code === "user_already_exists" || /already registered/i.test(e.message)) return at("email", "Un compte existe déjà avec cet e-mail : connecte-toi.");
  if (e.code === "weak_password" || /password should/i.test(e.message)) return at("password", "Mot de passe trop court : 8 caractères au moins.");
  if (e.code === "email_not_confirmed") return at(null, "Ton adresse n'est pas encore validée : suis le lien reçu par e-mail, ou attends que l'administrateur la valide.");
  if (e.code === "same_password") return at("password", "C'est déjà ton mot de passe actuel.");
  if (e.status === 429 || /rate limit/i.test(e.message)) return at(null, "Trop d'essais d'un coup : réessaie dans quelques minutes.");
  if (/email/i.test(e.message) && e.status === 400) return at("email", "Adresse e-mail invalide.");
  return at(null, `Le compte ne répond pas (${e.message}).`);
}

const EMAIL = /^\S+@\S+\.\S+$/;

// Champ avec son libellé et sa ligne d'erreur (icône + texte en rouge, comme l'état Error du Text Field).
function field(label, input, help) {
  const err = h("span", { class: "field-error", hidden: true }, icon("warning"), h("span"));
  const el = h("label", { class: "field" }, h("span", { class: "caption medium" }, label), input, help && h("span", { class: "caption" }, help), err);
  el.setError = msg => { err.hidden = !msg; err.lastChild.textContent = msg || ""; input.classList.toggle("error", Boolean(msg)); if (msg) input.focus(); };
  return el;
}
const tile = (name, lg) => h("span", { class: `tile${lg ? " lg" : ""}`, "aria-hidden": "true" }, icon(name));
const head = (ic, title, text) => h("div", { class: "acct-head" }, tile(ic, true), h("h2", { class: "heading-xl" }, title), text && h("p", { class: "body-md discret", style: { margin: 0 } }, text));
const bascule = (question, link, href) => h("div", { class: "bascule" }, h("button", { type: "button", onClick: () => go(href) }, `${question} `, h("b", null, link)));
const busy = (b, label) => { b.disabled = Boolean(label); b.lastChild.textContent = label || b.dataset.label; };
const submitBtn = label => { const b = btn(label, { variant: "primary", size: "lg", full: true, type: "submit" }); b.dataset.label = label; return b; };

// Après connexion : soit c'est réglé, soit on demande quelles données garder.
async function landed(result) {
  if (result === "choose") return chooseSheet();
  if (result === "confirm") return go("#/compte/valider");
  go("#/profil");
  toast(result === "pulled" ? "Données du compte récupérées" : "Connecté : tes données sont sur ton compte");
}

// Formulaire commun aux deux écrans : e-mail, mot de passe, erreur générale, bouton.
function authForm({ newPassword, help, label, onSubmit }) {
  const email = h("input", { class: "input", type: "email", name: "email", inputmode: "email", autocomplete: "username", autocapitalize: "off", placeholder: "prenom@exemple.fr", value: account().email || "", "aria-label": "Adresse e-mail" });
  const password = h("input", { class: "input", type: "password", name: "password", autocomplete: newPassword ? "new-password" : "current-password", minLength: 8, placeholder: "8 caractères au moins", "aria-label": "Mot de passe" });
  const fEmail = field("Adresse e-mail", email), fPass = field("Mot de passe", password, help);
  const general = h("div", { class: "hint attention", hidden: true }, icon("warning"), h("span", { class: "body-sm" }));
  const submit = submitBtn(label);
  const fail = ({ field: f, msg }) => { fEmail.setError(f === "email" ? msg : null); fPass.setError(f === "password" ? msg : null); general.hidden = Boolean(f); general.lastChild.textContent = f ? "" : msg; busy(submit); };
  const form = h("form", { class: "field", style: { gap: "16px" }, onSubmit: async ev => {
    ev.preventDefault();
    const mail = email.value.trim().toLowerCase(), pass = password.value;
    if (!EMAIL.test(mail)) return fail({ field: "email", msg: "Adresse e-mail invalide." });
    if (pass.length < 8) return fail({ field: "password", msg: "Mot de passe trop court : 8 caractères au moins." });
    fail({ field: "none" });
    busy(submit, "Un instant…");
    try { await landed(await onSubmit(mail, pass)); } catch (e) { fail(why(e)); }
  } }, fEmail, fPass, general, submit);
  return { form, email, fEmail, fail };
}

// Se connecter
export function signInView() {
  if (signedIn()) { setTimeout(() => go("#/profil")); return { el: h("div") }; }
  const { form, email, fEmail, fail } = authForm({ label: "Me connecter", onSubmit: signIn });
  if (account().error) fail({ field: null, msg: account().error });
  // Retour du lien de validation : l'adresse est bonne, il ne reste qu'à se connecter.
  const validated = confirmed() && h("div", { class: "hint" }, icon("check"), h("span", { class: "body-sm" }, "Adresse validée : connecte-toi avec ton mot de passe."));
  if (validated) clearConfirmed();
  form.append(btn("Mot de passe oublié ?", { variant: "ghost", full: true, onClick: async () => {
    const mail = email.value.trim().toLowerCase();
    if (!EMAIL.test(mail)) return fEmail.setError("Écris d'abord ton adresse e-mail, le lien y sera envoyé.");
    fEmail.setError(null);
    try { await sendReset(mail); toast("E-mail envoyé : suis le lien reçu"); } catch (e) { fail(why(e)); }
  } }));
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "Se connecter" }),
    h("div", { class: "scroll" }, head("cloudCheck", "Ton compte Fluide", "Séances, programme, corde, réglages : tout est gardé sur ton compte et revient sur un autre téléphone ou après une réinstallation."),
      validated, form, bascule("Pas encore de compte ?", "Créer mon compte", "#/compte/creer")));
  return { el };
}

// Créer mon compte
export function signUpView() {
  if (signedIn()) { setTimeout(() => go("#/profil")); return { el: h("div") }; }
  const { form } = authForm({ newPassword: true, label: "Créer mon compte", help: "8 caractères au moins. L'iPhone peut en proposer un et le garder dans ton trousseau.", onSubmit: signUp });
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "Créer mon compte" }),
    h("div", { class: "scroll" }, head("userCirclePlus", "Créer ton compte", "Garde tes séances, ton programme et ta corde sur ton compte, et retrouve-les sur un autre téléphone."),
      form, bascule("Déjà un compte ?", "Me connecter", "#/compte")));
  return { el };
}

// Compte créé, adresse à valider : le lien reçu par e-mail ou l'administrateur la valide, puis on se connecte.
export function confirmView() {
  if (signedIn()) { setTimeout(() => go("#/profil")); return { el: h("div") }; }
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Compte", href: "#/compte" }, title: "Compte créé" }),
    h("div", { class: "scroll" },
      head("cloudCheck", "Ton adresse va être validée", `Un e-mail est parti à ${account().email || "ton adresse"} : suis le lien pour valider ton compte. L'administrateur peut aussi le valider rapidement. Ensuite, connecte-toi avec ton mot de passe.`),
      btn("Me connecter", { variant: "primary", size: "lg", full: true, onClick: () => go("#/compte") })));
  return { el };
}

// Retour du lien « mot de passe oublié » : on choisit le nouveau, puis on est connecté.
export function resetView() {
  if (!recovering()) { setTimeout(() => go(signedIn() ? "#/profil" : "#/compte")); return { el: h("div") }; }
  const password = h("input", { class: "input", type: "password", autocomplete: "new-password", minLength: 8, placeholder: "8 caractères au moins", "aria-label": "Nouveau mot de passe" });
  const f = field("Nouveau mot de passe", password);
  const submit = submitBtn("Enregistrer le mot de passe");
  const form = h("form", { class: "field", style: { gap: "16px" }, onSubmit: async ev => {
    ev.preventDefault();
    if (password.value.length < 8) return f.setError("Mot de passe trop court : 8 caractères au moins.");
    f.setError(null); busy(submit, "Un instant…");
    try { await landed(await setNewPassword(password.value)); toast("Mot de passe changé"); } catch (e) { f.setError(why(e).msg); busy(submit); }
  } }, f, submit);
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Compte", href: "#/compte" }, title: "Mot de passe" }),
    h("div", { class: "scroll" }, head("cloudCheck", "Choisis un nouveau mot de passe", "Tu viens du lien reçu par e-mail. Une fois enregistré, tu es connecté."), form));
  setTimeout(() => password.focus(), 50);
  return { el };
}

// Les deux côtés ont des données : on montre les deux et on ne remplace rien sans le dire.
function chooseSheet() {
  const r = remoteSummary();
  const n = (x, one, many) => `${x} ${x > 1 ? many : one}`;
  sheet({
    title: "Quelles données garder ?",
    body: close => [
      h("p", { class: "body-md", style: { margin: 0 } }, "Ton compte a déjà des données, ce téléphone aussi. Celles que tu ne gardes pas sont remplacées."),
      h("div", { class: "card flat" }, h("span", { class: "overline" }, "Sur ton compte"),
        h("span", { class: "body-md fort num" }, `${n(r.sessions, "séance faite", "séances faites")} · ${n(r.templates, "séance type", "séances types")}`),
        h("span", { class: "caption" }, `Mis à jour le ${dateShort(r.at)}`)),
      h("div", { class: "card flat" }, h("span", { class: "overline" }, "Sur ce téléphone"),
        h("span", { class: "body-md fort num" }, `${n(state.sessions.length, "séance faite", "séances faites")} · ${n(state.templates.length, "séance type", "séances types")}`)),
      btn("Garder les données du compte", { variant: "primary", size: "lg", full: true, onClick: async () => { close(); await resolve("compte"); go("#/profil"); toast("Données du compte récupérées"); } }),
      btn("Garder celles de ce téléphone", { variant: "secondary", size: "lg", full: true, onClick: async () => { close(); await resolve("telephone"); go("#/profil"); toast("Données du téléphone envoyées sur ton compte"); } })
    ]
  });
}

// Carte Compte des Réglages (composant « Carte compte », 4 états) : Déconnecté et Session expirée ouvrent la connexion ;
// À jour et En attente montrent l'e-mail, l'état de la synchro, Synchroniser et Se déconnecter.
export function accountCard() {
  if (!configured) return h("div", { class: "card flat" },
    h("span", { class: "body-md fort medium" }, "Compte pas encore disponible"),
    h("span", { class: "caption" }, "Tes données restent sur ce téléphone. Exporte-les de temps en temps."));
  const m = account();
  const row = (ic, texts, end) => h("div", { class: "acct-row" }, tile(ic), h("div", { class: "row-main" }, ...texts), end);
  if (!signedIn()) return h("button", { class: "card tap", onClick: () => go("#/compte") },
    row("userCircle", [h("span", { class: "body-md fort medium" }, "Se connecter"), h("span", { class: "caption" }, m.error ? "Session expirée : reconnecte-toi." : "Garde tes données sur ton compte, retrouve-les sur un autre téléphone.")],
      m.error ? pill("Reconnexion", "attention") : icon("caretRight", "chev")));
  return [h("div", { class: "card" },
    row("cloudCheck", [h("span", { class: "overline" }, "Connecté"), h("span", { class: "body-md fort medium ellipsis" }, m.email)], m.error || m.dirty ? pill("En attente", "attention") : pill("À jour", "succes")),
    h("span", { class: "caption" }, m.error || (m.dirty ? "Envoi en cours…" : m.syncedAt ? `Dernière synchro le ${time(m.syncedAt)}.` : "Première synchro en cours.")),
    h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
      btn("Synchroniser", { variant: "secondary", onClick: async () => { await syncNow(); toast(account().error || "Données à jour"); } }),
      btn("Se déconnecter", { variant: "ghost", onClick: () => confirmSheet({
        title: "Se déconnecter ?",
        message: "Tes données restent sur ce téléphone et sur ton compte. Ce qui change ensuite ne part plus vers le compte.",
        confirmLabel: "Se déconnecter", cancelLabel: "Rester connecté",
        onConfirm: async () => { await signOut(); toast("Déconnecté"); }
      }) }))),
    h("div", { class: "list" },
      h("button", { class: "row", onClick: () => { keyInfo = undefined; go("#/compte/pas"); } },
        h("div", { class: "row-main" }, h("span", { class: "body-md fort medium" }, "Pas du jour automatiques"),
          h("span", { class: "caption" }, m.stepsLast ? `Derniers reçus : ${int(m.stepsLast.steps)} pas, ${time(m.stepsLast.at)}` : "Le Raccourci iOS envoie tes pas de Santé, sans rien taper")),
        icon("caretRight", "chev")))];
}

const time = t => `${dateShort(t)} à ${new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;

// Pas du jour automatiques : la clé Raccourci à copier dans le Raccourci iOS, qui envoie les pas au compte.
// Écran dédié (pas une feuille) : on y revient pour recopier la clé ou voir les derniers pas reçus.
let keyInfo; // undefined : pas encore lu ; null : aucune clé
export function stepsAutoView() {
  if (!signedIn()) { setTimeout(() => go("#/compte")); return { el: h("div") }; }
  const m = account();
  const refresh = () => dispatchEvent(new HashChangeEvent("hashchange"));
  if (keyInfo === undefined) shortcutKeyInfo().then(k => { keyInfo = k; refresh(); }).catch(() => { keyInfo = null; refresh(); });
  const create = async () => {
    try { await newShortcutKey(); keyInfo = { createdAt: Date.now() }; refresh(); toast("Clé créée : copie-la dans le Raccourci"); }
    catch (e) { toast(e instanceof TypeError ? "Pas de réseau : réessaie une fois connecté." : "Le compte ne répond pas : as-tu passé le SQL des pas ?"); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(m.shortcutKey); toast("Clé copiée"); }
    catch { toast("Copie impossible : sélectionne la clé et copie-la."); }
  };
  const status = keyInfo === undefined
    ? h("span", { class: "caption" }, "Lecture de ta clé…")
    : keyInfo
      ? h("div", { class: "acct-row" }, h("div", { class: "row-main" }, h("span", { class: "overline" }, "Clé Raccourci"),
          h("span", { class: "body-md fort medium" }, `Créée le ${time(keyInfo.createdAt)}`)), pill("Active", "succes"))
      : h("div", { class: "acct-row" }, h("div", { class: "row-main" }, h("span", { class: "overline" }, "Clé Raccourci"),
          h("span", { class: "body-md fort medium" }, "Aucune clé pour l'instant")), pill("À créer", "attention"));
  const keyBlock = keyInfo && (m.shortcutKey
    ? [h("code", { class: "cle", "aria-label": "Clé Raccourci" }, m.shortcutKey),
       btn("Copier la clé", { variant: "primary", size: "lg", full: true, icon: "clipboard", onClick: copy })]
    : h("p", { class: "caption", style: { margin: 0 } }, "La clé a été créée sur un autre appareil et n'est montrée qu'une fois. Remplace-la pour la copier ici."));
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "Pas automatiques" }),
    h("div", { class: "scroll" },
      h("p", { class: "body-sm discret", style: { margin: 0 } },
        "Le Raccourci iOS « Pas du jour » lit tes pas dans Santé et les envoie à ton compte avec cette clé, sans rien ouvrir. Fluide les reprend à l'ouverture. La clé ne sert qu'à écrire tes pas : garde-la pour toi."),
      h("div", { class: "card" }, status, keyBlock,
        m.stepsLast && h("span", { class: "caption num" }, `Derniers pas reçus : ${int(m.stepsLast.steps)}, ${time(m.stepsLast.at)}.`)),
      keyInfo === null && btn("Créer ma clé Raccourci", { variant: "primary", size: "lg", full: true, onClick: create }),
      keyInfo && btn("Remplacer la clé", { variant: "secondary", full: true, onClick: () => confirmSheet({
        title: "Remplacer la clé ?",
        message: "L'ancienne clé ne marchera plus : il faudra coller la nouvelle dans le Raccourci.",
        confirmLabel: "Remplacer la clé", onConfirm: create
      }) }),
      keyInfo && btn("Supprimer la clé", { variant: "ghost", full: true, onClick: () => confirmSheet({
        title: "Supprimer la clé ?",
        message: "Le Raccourci ne pourra plus envoyer tes pas. Les pas déjà reçus restent.",
        confirmLabel: "Supprimer la clé", destructive: true,
        onConfirm: async () => {
          try { await deleteShortcutKey(); keyInfo = null; refresh(); toast("Clé supprimée"); }
          catch { toast("Le compte ne répond pas : réessaie."); }
        }
      }) }),
      h("p", { class: "caption", style: { margin: 0 } }, "Construire le Raccourci : ",
        h("a", { class: "lien", href: RACCOURCI_PAS, target: "_blank", rel: "noopener" }, "guide pas à pas"), ".")));
  return { el };
}

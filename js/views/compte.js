import { configured, account, signedIn, signIn, signUp, sendReset, recovering, setNewPassword, remoteSummary, resolve, signOut, syncNow } from "../compte.js";
import { state } from "../store.js";
import { h, icon, btn, pill, go, navbar, sheet, confirmSheet, toast, dateShort, segmented } from "../ui.js";

// Messages de Supabase (en anglais) traduits pour l'écran.
function why(e) {
  if (e instanceof TypeError) return "Pas de réseau : réessaie une fois connecté.";
  if (e.code === "invalid_credentials" || /invalid login/i.test(e.message)) return "E-mail ou mot de passe incorrect.";
  if (e.code === "user_already_exists" || /already registered/i.test(e.message)) return "Un compte existe déjà avec cet e-mail : choisis « Me connecter ».";
  if (e.code === "weak_password" || /password should/i.test(e.message)) return "Mot de passe trop court : 8 caractères au moins.";
  if (e.code === "email_not_confirmed") return "Le compte attend une confirmation par e-mail : décoche « Confirm email » dans Supabase.";
  if (e.code === "same_password") return "C'est déjà ton mot de passe actuel.";
  if (e.status === 429 || /rate limit/i.test(e.message)) return "Trop d'essais d'un coup : réessaie dans quelques minutes.";
  if (/email/i.test(e.message) && e.status === 400) return "Adresse e-mail invalide.";
  return `Le compte ne répond pas (${e.message}).`;
}

const field = (label, control, help) => h("label", { class: "field" }, h("span", { class: "caption medium" }, label), control, help && h("span", { class: "caption" }, help));
const errorBox = () => h("div", { class: "hint attention", hidden: true }, icon("warning"), h("span", { class: "body-sm" }));
const showError = (box, msg) => { box.hidden = !msg; box.lastChild.textContent = msg || ""; };
const busy = (b, label) => { b.disabled = Boolean(label); b.lastChild.textContent = label || b.dataset.label; };

// Après connexion : soit c'est réglé, soit on demande quelles données garder.
async function landed(result) {
  if (result === "choose") return chooseSheet();
  go("#/profil");
  toast(result === "pulled" ? "Données du compte récupérées" : "Connecté : tes données sont sur ton compte");
}

// Connexion ou création du compte, sur un seul écran. Le trousseau iCloud propose et remplit le mot de passe.
let mode = "connexion";
export function signInView() {
  if (signedIn()) { setTimeout(() => go("#/profil")); return { el: h("div") }; }
  const error = errorBox();
  if (account().error) showError(error, account().error);
  const email = h("input", { class: "input", type: "email", name: "email", inputmode: "email", autocomplete: "username", autocapitalize: "off", placeholder: "prenom@exemple.fr",
    value: account().email || "", "aria-label": "Adresse e-mail" });
  const password = h("input", { class: "input", type: "password", name: "password", minLength: 8, placeholder: "8 caractères au moins", "aria-label": "Mot de passe" });
  const submit = btn("", { variant: "primary", size: "lg", full: true, type: "submit" });
  const forgot = btn("Mot de passe oublié", { variant: "ghost", full: true });
  const help = h("span", { class: "caption" });
  const setMode = m => {
    mode = m;
    password.autocomplete = m === "creation" ? "new-password" : "current-password";
    submit.dataset.label = m === "creation" ? "Créer mon compte" : "Me connecter";
    submit.lastChild.textContent = submit.dataset.label;
    help.textContent = m === "creation" ? "Choisis un mot de passe d'au moins 8 caractères. L'iPhone peut en proposer un et le garder dans ton trousseau." : "";
    forgot.hidden = m === "creation";
    showError(error, null);
  };
  submit.append(document.createTextNode(""));
  const read = () => ({ mail: email.value.trim().toLowerCase(), pass: password.value });
  const form = h("form", { class: "field", style: { gap: "16px" }, onSubmit: async ev => {
    ev.preventDefault();
    const { mail, pass } = read();
    if (!/^\S+@\S+\.\S+$/.test(mail)) { showError(error, "Adresse e-mail invalide."); email.focus(); return; }
    if (pass.length < 8) { showError(error, "Mot de passe trop court : 8 caractères au moins."); password.focus(); return; }
    busy(submit, mode === "creation" ? "Création…" : "Connexion…");
    try { await landed(mode === "creation" ? await signUp(mail, pass) : await signIn(mail, pass)); }
    catch (e) { showError(error, why(e)); busy(submit); }
  } },
    segmented([["connexion", "Me connecter"], ["creation", "Créer mon compte"]], mode, setMode),
    field("Adresse e-mail", email),
    h("label", { class: "field" }, h("span", { class: "caption medium" }, "Mot de passe"), password, help),
    error, submit);
  forgot.addEventListener("click", async () => {
    const { mail } = read();
    if (!/^\S+@\S+\.\S+$/.test(mail)) { showError(error, "Écris d'abord ton adresse e-mail, le lien y sera envoyé."); email.focus(); return; }
    try { await sendReset(mail); showError(error, null); toast("E-mail envoyé : suis le lien pour choisir un nouveau mot de passe"); }
    catch (e) { showError(error, why(e)); }
  });
  setMode(mode);
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "Compte", subtitle: "Compte Fluide" }),
    h("div", { class: "scroll" },
      h("div", { class: "card flat" },
        h("span", { class: "body-md fort medium" }, "Tes données sur ton compte"),
        h("span", { class: "body-sm discret" }, "Séances, programme, corde, réglages : tout est gardé sur ton compte et revient sur un autre téléphone ou après une réinstallation. L'app marche aussi hors ligne, la synchro suit au retour du réseau.")),
      form, forgot));
  return { el };
}

// Retour du lien « mot de passe oublié » : on choisit le nouveau, puis on est connecté.
export function resetView() {
  if (!recovering()) { setTimeout(() => go(signedIn() ? "#/profil" : "#/compte")); return { el: h("div") }; }
  const error = errorBox();
  const password = h("input", { class: "input", type: "password", autocomplete: "new-password", minLength: 8, placeholder: "8 caractères au moins", "aria-label": "Nouveau mot de passe" });
  const submit = btn("Enregistrer le mot de passe", { variant: "primary", size: "lg", full: true, type: "submit" });
  submit.dataset.label = "Enregistrer le mot de passe";
  const form = h("form", { class: "field", style: { gap: "16px" }, onSubmit: async ev => {
    ev.preventDefault();
    if (password.value.length < 8) { showError(error, "Mot de passe trop court : 8 caractères au moins."); return; }
    busy(submit, "Enregistrement…");
    try { await landed(await setNewPassword(password.value)); toast("Mot de passe changé"); }
    catch (e) { showError(error, why(e)); busy(submit); }
  } },
    field("Nouveau mot de passe", password, "Si ce lien s'est ouvert dans Safari, reconnecte-toi ensuite dans l'app Fluide avec ce mot de passe."),
    error, submit);
  const el = h("div", { class: "screen no-tabs" },
    navbar({ title: "Nouveau mot de passe", subtitle: "Compte Fluide" }),
    h("div", { class: "scroll" }, form));
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

// Carte des Réglages : connexion, état de la synchro, déconnexion.
export function accountCard() {
  if (!configured) return h("div", { class: "card flat" },
    h("span", { class: "body-md fort medium" }, "Compte pas encore disponible"),
    h("span", { class: "caption" }, "Tes données restent sur ce téléphone. Exporte-les de temps en temps."));
  const m = account();
  if (!signedIn()) return h("button", { class: "card tap", onClick: () => go("#/compte") },
    h("div", { class: "card-head" },
      h("div", null, h("span", { class: "body-md fort medium" }, "Se connecter"),
        h("span", { class: "caption", style: { display: "block" } }, m.error || "Garde tes données sur ton compte, retrouve-les sur un autre téléphone.")),
      icon("caretRight", "chev")));
  const status = m.error ? pill("En attente", "attention") : m.dirty ? pill("Envoi…") : pill("À jour", "succes");
  return h("div", { class: "card" },
    h("div", { class: "card-head" },
      h("div", { style: { minWidth: 0 } }, h("span", { class: "overline" }, "Connecté"), h("span", { class: "body-md fort medium", style: { display: "block", overflow: "hidden", textOverflow: "ellipsis" } }, m.email)),
      status),
    h("span", { class: "caption" }, m.error || (m.syncedAt ? `Dernière synchro le ${dateShort(m.syncedAt)} à ${new Date(m.syncedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.` : "Première synchro en cours.")),
    h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
      btn("Synchroniser", { variant: "secondary", onClick: async () => { await syncNow(); toast(account().error || "Données à jour"); } }),
      btn("Se déconnecter", { variant: "ghost", onClick: () => confirmSheet({
        title: "Se déconnecter ?",
        message: "Tes données restent sur ce téléphone et sur ton compte. Ce qui change ensuite ne part plus vers le compte.",
        confirmLabel: "Se déconnecter", cancelLabel: "Rester connecté",
        onConfirm: async () => { await signOut(); toast("Déconnecté"); }
      }) })));
}

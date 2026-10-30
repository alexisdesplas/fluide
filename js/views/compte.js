import { configured, account, signedIn, sendCode, verifyCode, remoteSummary, resolve, signOut, syncNow } from "../compte.js";
import { state } from "../store.js";
import { h, icon, btn, pill, go, navbar, sheet, confirmSheet, toast, dateShort } from "../ui.js";

// Messages de Supabase (en anglais) traduits pour l'écran.
function why(e) {
  if (e instanceof TypeError) return "Pas de réseau : réessaie une fois connecté.";
  if (e.status === 429 || /rate limit/i.test(e.message)) return "Trop d'e-mails envoyés d'un coup : réessaie dans quelques minutes.";
  if (e.code === "otp_expired" || /expired|invalid/i.test(e.message)) return "Code faux ou expiré : vérifie le dernier e-mail reçu, ou demande un nouveau code.";
  if (/email/i.test(e.message) && e.status === 400) return "Adresse e-mail invalide.";
  return `Le compte ne répond pas (${e.message}).`;
}

const field = (label, control, help) => h("label", { class: "field" }, h("span", { class: "caption medium" }, label), control, help && h("span", { class: "caption" }, help));

// Étape 1 : l'adresse e-mail. Pas de mot de passe : un code arrive par e-mail.
export function signInView() {
  if (signedIn()) { setTimeout(() => go("#/profil")); return { el: h("div") }; }
  const error = h("div", { class: "hint attention", hidden: true }, icon("warning"), h("span", { class: "body-sm" }));
  const input = h("input", { class: "input", type: "email", inputmode: "email", autocomplete: "email", autocapitalize: "off", placeholder: "prenom@exemple.fr",
    value: account().pendingEmail || account().email || "", "aria-label": "Adresse e-mail" });
  const submit = btn("Recevoir un code", { variant: "primary", size: "lg", full: true, type: "submit" });
  const form = h("form", { class: "field", style: { gap: "16px" }, onSubmit: async ev => {
    ev.preventDefault();
    const email = input.value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) { error.hidden = false; error.lastChild.textContent = "Adresse e-mail invalide."; input.focus(); return; }
    submit.disabled = true; submit.lastChild.textContent = "Envoi…";
    try { await sendCode(email); go("#/compte/code"); }
    catch (e) { error.hidden = false; error.lastChild.textContent = why(e); submit.disabled = false; submit.lastChild.textContent = "Recevoir un code"; }
  } },
    field("Adresse e-mail", input, "Tu reçois un code à 6 chiffres. Pas de mot de passe à retenir."),
    error, submit);
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Réglages", href: "#/profil" }, title: "Se connecter", subtitle: "Compte Fluide" }),
    h("div", { class: "scroll" },
      h("div", { class: "card flat" },
        h("span", { class: "body-md fort medium" }, "Tes données sur ton compte"),
        h("span", { class: "body-sm discret" }, "Séances, programme, corde, réglages : tout est gardé sur ton compte et revient sur un autre téléphone ou après une réinstallation. L'app marche aussi hors ligne, la synchro suit au retour du réseau.")),
      form));
  setTimeout(() => input.focus(), 50);
  return { el };
}

// Étape 2 : le code reçu. Puis, si le compte a déjà des données et le téléphone aussi, on demande lesquelles garder.
export function codeView() {
  const email = account().pendingEmail;
  if (signedIn() || !email) { setTimeout(() => go(signedIn() ? "#/profil" : "#/compte")); return { el: h("div") }; }
  const error = h("div", { class: "hint attention", hidden: true }, icon("warning"), h("span", { class: "body-sm" }));
  const input = h("input", { class: "input code-input num", inputmode: "numeric", autocomplete: "one-time-code", maxLength: 8, placeholder: "••••••", "aria-label": "Code reçu par e-mail",
    onInput: e => { e.target.value = e.target.value.replace(/\D/g, ""); if (e.target.value.length === 6) form.requestSubmit(); } });
  const submit = btn("Se connecter", { variant: "primary", size: "lg", full: true, type: "submit" });
  const fail = msg => { error.hidden = false; error.lastChild.textContent = msg; submit.disabled = false; submit.lastChild.textContent = "Se connecter"; input.select(); };
  const form = h("form", { class: "field", style: { gap: "16px" }, onSubmit: async ev => {
    ev.preventDefault();
    if (input.value.length < 6) return fail("Le code fait 6 chiffres.");
    submit.disabled = true; submit.lastChild.textContent = "Vérification…";
    try {
      const result = await verifyCode(input.value);
      if (result === "choose") return chooseSheet();
      go("#/profil");
      toast(result === "pulled" ? "Données du compte récupérées" : "Connecté : tes données sont sur ton compte");
    } catch (e) { fail(why(e)); }
  } },
    field("Code à 6 chiffres", input, `Envoyé à ${email}. Regarde aussi dans les spams.`),
    error, submit);
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "E-mail", href: "#/compte" }, title: "Code reçu", subtitle: email }),
    h("div", { class: "scroll" }, form,
      btn("Renvoyer un code", { variant: "secondary", full: true, onClick: async () => {
        try { await sendCode(email); toast("Nouveau code envoyé"); } catch (e) { fail(why(e)); }
      } }),
      btn("Changer d'adresse e-mail", { variant: "ghost", full: true, onClick: () => go("#/compte") })));
  setTimeout(() => input.focus(), 50);
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

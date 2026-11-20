// Compte Fluide : connexion par e-mail et mot de passe (Supabase Auth), données gardées sur le compte (table fluide_state).
// Pas de lien magique ni de code : sans domaine d'envoi, Supabase n'envoie que des liens, qui s'ouvrent dans Safari
// et pas dans l'app installée sur l'écran d'accueil. Seul le mot de passe oublié passe par un e-mail.
// Pas de SDK : l'API REST de Supabase suffit. Le téléphone reste la source de travail ; chaque enregistrement
// part vers le compte quelques secondes après, et l'app reprend la version du compte quand elle est plus récente.

import { state, onPersist, replaceState, setHabit, save, dayKey, addSharedProgram } from "./store.js";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const META = "fluid-compte";
const PUSH_DELAY = 2000;
export const configured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Session et état de la synchro : à part des données (jamais exportés ni envoyés au compte).
// { email, userId, access, refresh, expiresAt, syncedAt (date de la version du compte qu'on a), localAt, dirty, error }
let meta = {};
try { meta = JSON.parse(localStorage.getItem(META)) || {}; } catch {}
const keep = () => { try { localStorage.setItem(META, JSON.stringify(meta)); } catch {} listeners.forEach(fn => fn()); };
const listeners = new Set();
export const onAccount = fn => listeners.add(fn);
export const account = () => meta;
export const signedIn = () => Boolean(meta.refresh);

async function call(path, { method = "GET", body, auth, headers = {} } = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw Object.assign(new Error(data?.msg || data?.error_description || data?.message || `Erreur ${res.status}`), { status: res.status, code: data?.error_code || data?.code });
  return data;
}

const session = s => {
  Object.assign(meta, { email: s.user?.email ?? meta.email, userId: s.user?.id ?? meta.userId, access: s.access_token, refresh: s.refresh_token, expiresAt: Date.now() + s.expires_in * 1000, error: null });
  keep();
};

// Jeton valide (rafraîchi une minute avant la fin) ; un refus du compte déconnecte sans toucher aux données.
async function token() {
  if (!meta.refresh) throw new Error("Pas connecté");
  if (Date.now() < meta.expiresAt - 60000) return meta.access;
  try {
    session(await call("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: meta.refresh } }));
  } catch (e) {
    if (e.status >= 400 && e.status < 500) { meta = { email: meta.email, error: "Session expirée : reconnecte-toi." }; keep(); }
    throw e;
  }
  return meta.access;
}

// ——— Connexion

// Compte connecté : on regarde ce qu'il a déjà. Rien → on y envoie les données du téléphone.
// Des données des deux côtés → l'écran demande lesquelles garder (renvoie "choose").
async function afterSignIn() {
  const remote = await fetchRemote();
  if (!remote) { adoptInvite(); await push(); return "pushed"; }
  if (!hasLocalData()) { apply(remote); adoptInvite(); return "pulled"; }
  pendingRemote = remote;
  return "choose";
}

export async function signIn(email, password) {
  session(await call("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } }));
  const result = await afterSignIn();
  if (result !== "choose") pullSteps();
  return result;
}

// Adresse à valider (« Confirm email » coché dans Supabase) : pas de session, un e-mail avec un lien part à l'adresse,
// et l'administrateur peut aussi valider. Le lien revient ici (redirect_to), puis on se connecte.
export async function signUp(email, password) {
  const back = encodeURIComponent(location.origin + location.pathname);
  const s = await call(`/auth/v1/signup?redirect_to=${back}`, { method: "POST", body: { email, password } });
  if (!s?.access_token) { meta.email = email; keep(); return "confirm"; }
  session(s);
  return afterSignIn();
}

// Mot de passe oublié : Supabase envoie un lien qui revient sur l'app avec un jeton de récupération.
export async function sendReset(email) {
  const back = encodeURIComponent(location.origin + location.pathname);
  await call(`/auth/v1/recover?redirect_to=${back}`, { method: "POST", body: { email } });
}

// Retour d'un lien reçu par e-mail (dans l'adresse : #access_token=…&type=…).
// Validation de l'adresse (type signup) : on renvoie vers Se connecter, avec un mot pour le dire.
// Mot de passe oublié (type recovery) : on garde le jeton le temps de choisir un mot de passe.
export const confirmed = () => Boolean(meta.confirmed);
export const clearConfirmed = () => { delete meta.confirmed; keep(); };
let recovery = null;
export const recovering = () => Boolean(recovery);
export async function setNewPassword(password) {
  const user = await call("/auth/v1/user", { method: "PUT", auth: recovery.access_token, body: { password } });
  session({ ...recovery, user });
  recovery = null;
  return afterSignIn();
}
{
  const hash = new URLSearchParams(location.hash.replace(/^#\/?/, ""));
  if (hash.get("access_token") && hash.get("type") === "recovery") {
    recovery = { access_token: hash.get("access_token"), refresh_token: hash.get("refresh_token"), expires_in: +hash.get("expires_in") || 3600 };
    history.replaceState(null, "", `${location.pathname}#/compte/nouveau`);
  } else if (hash.get("access_token") && ["signup", "email", "magiclink"].includes(hash.get("type"))) {
    meta.confirmed = true; keep();
    history.replaceState(null, "", `${location.pathname}#/compte`);
  } else if (hash.get("error_code")) {
    meta.error = hash.get("error_code") === "otp_expired" ? "Lien expiré : redemande un e-mail de mot de passe oublié." : "Lien invalide : redemande un e-mail.";
    history.replaceState(null, "", `${location.pathname}#/compte`);
  }
}

let pendingRemote = null;
export const remoteSummary = () => pendingRemote && { sessions: pendingRemote.data.sessions?.length || 0, templates: pendingRemote.data.templates?.length || 0, at: Date.parse(pendingRemote.updated_at) };
export async function resolve(choice) {
  if (choice === "compte") { apply(pendingRemote); adoptInvite(); } else { adoptInvite(); await push(); }
  pendingRemote = null;
}

export async function signOut() {
  try { await call("/auth/v1/logout", { method: "POST", auth: await token() }); } catch {}
  meta = { email: meta.email };
  keep();
}

// ——— Synchro

const hasLocalData = () => state.sessions.length > 0 || Object.keys(state.habits).length > 0 || Object.keys(state.corde?.done || {}).length > 0;

async function fetchRemote() {
  const rows = await call("/rest/v1/fluide_state?select=data,updated_at", { auth: await token() });
  return rows?.[0] || null;
}

let applying = false;
function apply(remote) {
  applying = true;
  try { replaceState(remote.data); } finally { applying = false; }
  Object.assign(meta, { syncedAt: Date.parse(remote.updated_at), dirty: false, error: null });
  keep();
}

// Réseau coupé ou serveur injoignable : fetch rejette avec une TypeError.
const offline = e => navigator.onLine === false || e instanceof TypeError;

let pushing = null;
export async function push() {
  if (!signedIn()) return;
  const at = new Date().toISOString();
  pushing = call("/rest/v1/fluide_state?on_conflict=user_id", {
    method: "POST", auth: await token(), headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: { user_id: meta.userId, data: state, updated_at: at }
  });
  try {
    await pushing;
    Object.assign(meta, { syncedAt: Date.parse(at), dirty: false, error: null });
  } catch (e) {
    meta.error = offline(e) ? "Hors ligne : envoi au retour du réseau." : `Envoi impossible : ${e.message}`;
  } finally { pushing = null; keep(); }
}

// Chaque enregistrement local marque les données à envoyer ; l'envoi part après une courte pause (steppers, saisie).
let timer;
onPersist(() => {
  if (applying || !signedIn()) return;
  meta.dirty = true; meta.localAt = Date.now();
  try { localStorage.setItem(META, JSON.stringify(meta)); } catch {}
  clearTimeout(timer);
  timer = setTimeout(push, PUSH_DELAY);
});

// Ouverture de l'app, retour au premier plan, retour du réseau : la version la plus récente gagne,
// puis on reprend les pas envoyés par le Raccourci.
export async function syncNow() {
  if (!configured || !signedIn() || pushing) return;
  await syncState();
  await pullSteps();
}

async function syncState() {
  try {
    const remote = await fetchRemote();
    const remoteAt = remote ? Date.parse(remote.updated_at) : 0;
    if (meta.dirty && (meta.localAt || 0) >= remoteAt) return push();
    if (remote && remoteAt > (meta.syncedAt || 0)) return apply(remote);
    if (meta.dirty) return push();
    meta.error = null; keep();
  } catch (e) {
    if (signedIn()) { meta.error = offline(e) ? "Hors ligne : synchro au retour du réseau." : `Synchro impossible : ${e.message}`; keep(); }
  }
}

// ——— Pas du jour automatiques : le Raccourci iOS écrit les pas dans fluide_pas avec la clé Raccourci du compte
// (supabase/schema.sql), l'app les reprend à chaque synchro. Les pas reçus remplacent ceux du jour.

const rpc = async (name, body) => call(`/rest/v1/rpc/${name}`, { method: "POST", auth: await token(), body: body || {} });

export async function shortcutKeyInfo() {
  const rows = await call("/rest/v1/fluide_raccourci?select=created_at", { auth: await token() });
  return rows?.[0] ? { createdAt: Date.parse(rows[0].created_at) } : null;
}

// La clé n'est rendue qu'une fois par Supabase : on la garde sur ce téléphone pour pouvoir la recopier.
export async function newShortcutKey() {
  meta.shortcutKey = await rpc("fluide_nouvelle_cle");
  keep();
  return meta.shortcutKey;
}

export async function deleteShortcutKey() {
  await call(`/rest/v1/fluide_raccourci?user_id=eq.${meta.userId}`, { method: "DELETE", auth: await token() });
  delete meta.shortcutKey;
  keep();
}

// Lignes plus récentes que la dernière reprise (la première fois : les 7 derniers jours).
// Erreur ignorée : sans la table (SQL pas encore passé), le compte marche comme avant.
export async function pullSteps() {
  if (!signedIn()) return;
  try {
    // Horodatage gardé tel quel : Supabase compte en microsecondes, un Date l'arrondirait et reprendrait la dernière ligne.
    const since = meta.stepsSince ? `updated_at=gt.${encodeURIComponent(meta.stepsSince)}` : `day=gte.${dayKey(Date.now() - 7 * 86400000)}`;
    const rows = await call(`/rest/v1/fluide_pas?select=day,steps,updated_at&${since}&order=updated_at`, { auth: await token() });
    if (!rows?.length) return;
    for (const r of rows) setHabit(r.day, "steps", r.steps, true);
    const last = rows.at(-1);
    Object.assign(meta, { stepsSince: last.updated_at, stepsLast: { day: last.day, steps: last.steps, at: Date.parse(last.updated_at) } });
    keep();
    save();
  } catch {}
}

if (configured) {
  syncNow();
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && syncNow());
  // Le Raccourci envoie les pas toutes les 5 minutes : l'app ouverte les reprend au même rythme.
  setInterval(() => document.visibilityState === "visible" && pullSteps(), 5 * 60 * 1000);
  addEventListener("online", syncNow);
}

// ——— Partage d'un programme par lien (supabase/schema.sql, table fluide_shares).
// L'expéditeur, connecté, enregistre le programme sous un jeton aléatoire ; le lien #/invitation/<jeton> part par e-mail.
// La personne qui l'ouvre lit le programme sans compte (fonction fluide_get_share), l'ajoute, puis crée son compte :
// l'invitation reste en attente sur le téléphone et rejoint le compte dès la connexion (même si le compte avait déjà des données).

const INVITE = "fluid-invite";
export const SHARE_DAYS = 30;
export const shareUrl = code => `${location.origin}${location.pathname}#/invitation/${code}`;
const newCode = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const shareError = e => (e.code === "PGRST202" || e.code === "42P01" || e.status === 404
  ? Object.assign(new Error("Le partage n'est pas encore activé sur le serveur (supabase/schema.sql)."), { status: e.status }) : e);

export async function createShare({ program, sender, recipient }) {
  const code = newCode();
  try {
    await call("/rest/v1/fluide_shares", { method: "POST", auth: await token(), headers: { Prefer: "return=minimal" },
      body: { token: code, owner_id: meta.userId, sender_name: sender || null, recipient_email: recipient || null, program } });
  } catch (e) { throw shareError(e); }
  return { code, url: shareUrl(code) };
}

// Programme d'un lien : { sender, recipient, program, expires_at }, ou null (lien inconnu ou expiré).
export async function getShare(code) {
  try { return await call("/rest/v1/rpc/fluide_get_share", { method: "POST", body: { share_token: code } }); }
  catch (e) { throw shareError(e); }
}

export const pendingInvite = () => { try { return JSON.parse(localStorage.getItem(INVITE)); } catch { return null; } };
export function setPendingInvite(invite) {
  try { invite ? localStorage.setItem(INVITE, JSON.stringify(invite)) : localStorage.removeItem(INVITE); } catch {}
}
// Adresse de l'invitation : proposée sur Créer ton compte.
export function suggestEmail(email) {
  if (!signedIn() && email) { meta.email = email; keep(); }
}
function adoptInvite() {
  const invite = pendingInvite();
  if (!invite) return;
  const r = addSharedProgram(invite);
  if (!r.error) meta.adopted = r.program.name;
  setPendingInvite(null);
  keep();
}
// Nom du programme repris à la connexion, une seule fois (pour le dire à l'écran).
export function takeAdopted() {
  const name = meta.adopted;
  if (name) { delete meta.adopted; keep(); }
  return name || null;
}

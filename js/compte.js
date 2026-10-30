// Compte Fluide : connexion par code reçu par e-mail (Supabase Auth), données gardées sur le compte (table fluide_state).
// Pas de SDK : l'API REST de Supabase suffit. Le téléphone reste la source de travail ; chaque enregistrement
// part vers le compte quelques secondes après, et l'app reprend la version du compte quand elle est plus récente.

import { state, onPersist, replaceState } from "./store.js";
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

export async function sendCode(email) {
  await call("/auth/v1/otp", { method: "POST", body: { email, create_user: true } });
  meta = { ...meta, pendingEmail: email };
  keep();
}

// Code bon : on regarde ce que le compte a déjà. Rien → on y envoie les données du téléphone.
// Des données des deux côtés → l'écran demande lesquelles garder (renvoie "choose").
export async function verifyCode(code) {
  const email = meta.pendingEmail;
  session(await call("/auth/v1/verify", { method: "POST", body: { type: "email", email, token: code.trim() } }));
  delete meta.pendingEmail; keep();
  const remote = await fetchRemote();
  if (!remote) { await push(); return "pushed"; }
  if (!hasLocalData()) { apply(remote); return "pulled"; }
  pendingRemote = remote;
  return "choose";
}

let pendingRemote = null;
export const remoteSummary = () => pendingRemote && { sessions: pendingRemote.data.sessions?.length || 0, templates: pendingRemote.data.templates?.length || 0, at: Date.parse(pendingRemote.updated_at) };
export async function resolve(choice) {
  if (choice === "compte") apply(pendingRemote); else await push();
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

// Ouverture de l'app, retour au premier plan, retour du réseau : la version la plus récente gagne.
export async function syncNow() {
  if (!configured || !signedIn() || pushing) return;
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

if (configured) {
  syncNow();
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && syncNow());
  addEventListener("online", syncNow);
}

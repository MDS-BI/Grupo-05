// Cuentas, sesión y permisos (iteración 3: US-15, US-16 y US-17).
// Como el módulo no tiene servidor, las cuentas viven en localStorage. Las contraseñas
// nunca se guardan como texto: se guarda SHA-256(sal + contraseña) con una sal por cuenta
// (decisión del issue #27). En una empresa real esto tiene que ir en un servidor
// (ver docs/riesgos-y-sesgos.md).

import { getConfig } from './module-config.js';

export const USERS_KEY = 'erp_base_module:users';
export const SESSION_KEY = 'erp_base_module:session';

export const ROLES = {
  vendedor: 'Vendedor/a',
  jefe: 'Jefe/a de ventas'
};

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
export const IDLE_MINUTES = 30;

const GENERIC_ERROR = 'Correo o contraseña incorrectos.';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function read(key, fallback){
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

const toHex = (buffer) => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');

function newSalt(){
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}

function newId(prefix){
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  return `${prefix}_${Date.now().toString(36)}${toHex(bytes)}`;
}

const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();

/** Hash de la contraseña con la sal de la cuenta (Web Crypto, viene en el navegador). */
export async function hashPassword(password, salt){
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return toHex(await globalThis.crypto.subtle.digest('SHA-256', data));
}

/** Regla de contraseña (US-17): al menos 8 caracteres y un número. Devuelve el problema o null. */
export function passwordProblem(password){
  const pw = String(password ?? '');
  if(pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if(!/\d/.test(pw)) return 'La contraseña debe tener al menos un número.';
  return null;
}

/** ¿Este módulo usa inicio de sesión? Solo cuando el perfil declara cuentas. */
export function authEnabled(){
  return Boolean(getConfig().sales?.accounts?.length);
}

// ---------------------------------------------------------------------------
// Cuentas (tabla users)
// ---------------------------------------------------------------------------

export function loadUsers(){
  const list = read(USERS_KEY, []);
  return Array.isArray(list) ? list : [];
}

function saveUsers(list){
  write(USERS_KEY, list);
}

/** Lo que se puede mostrar de una cuenta (nunca el hash ni la sal). */
export function publicUser(u){
  if(!u) return null;
  const { password_hash, salt, ...rest } = u;
  return rest;
}

async function buildUser({ name, email, role, password }, mustChange){
  const salt = newSalt();
  return {
    user_id: newId('usr'),
    employee_id: newId('emp'),
    name: String(name).trim(),
    email: normalizeEmail(email),
    role,
    salt,
    password_hash: await hashPassword(password, salt),
    active: true,
    failed_attempts: 0,
    locked_until: '',
    must_change_password: mustChange,
    last_login_at: '',
    created_at: new Date().toISOString()
  };
}

/** Crea las cuentas de prueba del perfil la primera vez (o las que falten). */
export async function ensureSeedUsers(){
  if(!authEnabled()) return;
  const users = loadUsers();
  let changed = false;
  for(const acc of getConfig().sales.accounts){
    if(users.some(u => u.email === acc.email)) continue;
    users.push(await buildUser(acc, false));
    changed = true;
  }
  if(changed) saveUsers(users);
}

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------

function readSession(){
  const s = read(SESSION_KEY, null);
  return s && typeof s === 'object' ? s : null;
}

/** La cuenta con sesión abierta, o null si no hay sesión, expiró por inactividad o la desactivaron. */
export function currentUser(nowMs = Date.now()){
  const s = readSession();
  if(!s) return null;
  const user = loadUsers().find(u => u.user_id === s.user_id);
  const idle = nowMs - Date.parse(s.last_activity || 0) > IDLE_MINUTES * 60e3;
  if(!user || !user.active || idle){
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return publicUser(user);
}

/** El rol de quien tiene la sesión. Sin sesión, se trata como vendedor (el rol con menos permisos). */
export function currentRole(){
  return currentUser()?.role || 'vendedor';
}

export function currentUserName(){
  return currentUser()?.name || '';
}

export function isBoss(){
  return currentRole() === 'jefe';
}

/** Marca actividad para que la sesión no expire mientras se usa la app. */
export function touchSession(nowMs = Date.now()){
  const s = readSession();
  if(!s) return;
  write(SESSION_KEY, { ...s, last_activity: new Date(nowMs).toISOString() });
}

export function logout(){
  localStorage.removeItem(SESSION_KEY);
}

function minutesLeft(lockedUntil, nowMs){
  return Math.max(1, Math.ceil((Date.parse(lockedUntil) - nowMs) / 60e3));
}

/**
 * Inicia sesión. Devuelve { ok: true, user, mustChangePassword } o { ok: false, error }.
 * El mensaje de error no dice si falló el correo o la contraseña (US-15, criterio 3).
 */
export async function login(email, password, nowMs = Date.now()){
  const users = loadUsers();
  const idx = users.findIndex(u => u.email === normalizeEmail(email));
  if(idx === -1) return { ok: false, error: GENERIC_ERROR };
  const user = users[idx];

  if(user.locked_until && Date.parse(user.locked_until) > nowMs){
    const m = minutesLeft(user.locked_until, nowMs);
    return { ok: false, error: `Cuenta bloqueada por ${MAX_FAILED_ATTEMPTS} intentos fallidos. Intenta de nuevo en ${m} minuto${m === 1 ? '' : 's'}.` };
  }

  const hash = await hashPassword(password, user.salt);
  if(hash !== user.password_hash){
    const attempts = (user.failed_attempts || 0) + 1;
    if(attempts >= MAX_FAILED_ATTEMPTS){
      users[idx] = { ...user, failed_attempts: 0, locked_until: new Date(nowMs + LOCK_MINUTES * 60e3).toISOString() };
      saveUsers(users);
      return { ok: false, error: `Cuenta bloqueada por ${MAX_FAILED_ATTEMPTS} intentos fallidos. Intenta de nuevo en ${LOCK_MINUTES} minutos.` };
    }
    users[idx] = { ...user, failed_attempts: attempts };
    saveUsers(users);
    return { ok: false, error: GENERIC_ERROR };
  }

  if(!user.active){
    return { ok: false, error: 'Esta cuenta está desactivada. Habla con tu jefe/a de ventas.' };
  }

  const ts = new Date(nowMs).toISOString();
  users[idx] = { ...user, failed_attempts: 0, locked_until: '', last_login_at: ts };
  saveUsers(users);
  write(SESSION_KEY, { user_id: user.user_id, started_at: ts, last_activity: ts });
  return { ok: true, user: publicUser(users[idx]), mustChangePassword: Boolean(user.must_change_password) };
}

/** La persona con sesión cambia su propia contraseña (obligatorio después de un restablecimiento). */
export async function changeOwnPassword(newPassword){
  const me = currentUser();
  if(!me) throw new Error('No hay una sesión abierta.');
  const problem = passwordProblem(newPassword);
  if(problem) throw new Error(problem);
  const users = loadUsers();
  const idx = users.findIndex(u => u.user_id === me.user_id);
  const salt = newSalt();
  users[idx] = { ...users[idx], salt, password_hash: await hashPassword(newPassword, salt), must_change_password: false };
  saveUsers(users);
  return publicUser(users[idx]);
}

// ---------------------------------------------------------------------------
// Administración del equipo (US-17): solo jefe/a
// ---------------------------------------------------------------------------

function requireBoss(){
  if(!isBoss()) throw new Error('Solo el jefe/a de ventas puede administrar las cuentas del equipo.');
}

export async function createUser({ name, email, role, password }){
  requireBoss();
  const errors = {};
  if(!String(name ?? '').trim()) errors.name = 'El nombre es obligatorio.';
  const mail = normalizeEmail(email);
  if(!EMAIL.test(mail)) errors.email = 'Escribe un correo válido.';
  else if(loadUsers().some(u => u.email === mail)) errors.email = 'Ya existe una cuenta con ese correo.';
  if(!ROLES[role]) errors.role = 'Elige un rol: vendedor/a o jefe/a de ventas.';
  const problem = passwordProblem(password);
  if(problem) errors.password = problem;
  if(Object.keys(errors).length){
    const err = new Error(Object.values(errors).join(' '));
    err.fieldErrors = errors;
    throw err;
  }
  // La contraseña inicial la eligió el jefe/a: la persona la cambia al entrar por primera vez.
  const user = await buildUser({ name, email: mail, role, password }, true);
  saveUsers([...loadUsers(), user]);
  return publicUser(user);
}

/** Desactiva o reactiva una cuenta. Nunca se borra, para no perder de quién era cada pedido. */
export function setUserActive(userId, active){
  requireBoss();
  const users = loadUsers();
  const idx = users.findIndex(u => u.user_id === userId);
  if(idx === -1) throw new Error('Cuenta no encontrada.');
  if(!active && users[idx].role === 'jefe' && users.filter(u => u.role === 'jefe' && u.active).length <= 1){
    throw new Error('No se puede desactivar al único jefe/a activo: el sistema quedaría sin nadie que lo administre.');
  }
  users[idx] = { ...users[idx], active: Boolean(active) };
  saveUsers(users);
  return publicUser(users[idx]);
}

/** Restablece la contraseña de alguien; esa persona tendrá que cambiarla al entrar. */
export async function resetPassword(userId, temporaryPassword){
  requireBoss();
  const problem = passwordProblem(temporaryPassword);
  if(problem) throw new Error(problem);
  const users = loadUsers();
  const idx = users.findIndex(u => u.user_id === userId);
  if(idx === -1) throw new Error('Cuenta no encontrada.');
  const salt = newSalt();
  users[idx] = {
    ...users[idx], salt, password_hash: await hashPassword(temporaryPassword, salt),
    must_change_password: true, failed_attempts: 0, locked_until: ''
  };
  saveUsers(users);
  return publicUser(users[idx]);
}

/** Nombres de los vendedores: los del perfil más los de las cuentas con rol vendedor. */
export function sellerNames(){
  const fromProfile = getConfig().sales?.sellers || [];
  const fromAccounts = loadUsers().filter(u => u.role === 'vendedor').map(u => u.name);
  return [...new Set([...fromProfile, ...fromAccounts])];
}

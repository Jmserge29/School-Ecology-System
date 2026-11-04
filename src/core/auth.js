// =========================================================
// AUTENTICACIÓN (RF-01, RF-02)
// Sesión, perfil del usuario actual y helpers de permisos.
// =========================================================
import { supabase, isConfigured, q } from './supabase.js';
import { hasPermission } from './permissions.js';

let perfilActual = null;

const PERFIL_SELECT = 'id, nombre, correo, rol, activo, salon_id, salon:salones!perfiles_salon_id_fkey(id, nombre, jornada)';

export async function getSession() {
  if (!isConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

async function cargarPerfil(userId) {
  const { data, error } = await supabase.from('perfiles').select(PERFIL_SELECT).eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Inicia sesión y verifica que la cuenta esté activa. */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message?.toLowerCase().includes('invalid login')) throw new Error('Correo o contraseña incorrectos.');
    if (error.message?.toLowerCase().includes('email not confirmed')) throw new Error('Debes confirmar tu correo antes de ingresar.');
    throw new Error(error.message);
  }
  const perfil = await cargarPerfil(data.user.id).catch(() => null);
  if (!perfil || !perfil.activo) {
    await supabase.auth.signOut();
    throw new Error('Tu cuenta está desactivada o pendiente de activación. Contacta al administrador.');
  }
  perfilActual = perfil;
  return perfil;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
  perfilActual = null;
  location.href = 'login.html';
}

/** Envía el correo con el enlace para restablecer la contraseña. */
export async function requestPasswordReset(email) {
  const redirectTo = new URL('reset-password.html', location.href).href;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(error.message);
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.message?.toLowerCase().includes('different from the old')) throw new Error('La nueva contraseña debe ser diferente a la anterior.');
    throw new Error(error.message);
  }
}

/**
 * Protege páginas privadas: si no hay sesión o el perfil está inactivo,
 * redirige al login. Devuelve el perfil del usuario.
 */
export async function requireAuth() {
  if (!isConfigured) { location.href = 'login.html'; return null; }
  const session = await getSession();
  if (!session) { location.href = 'login.html'; return null; }
  const perfil = await cargarPerfil(session.user.id).catch(() => null);
  if (!perfil || !perfil.activo) {
    await supabase.auth.signOut();
    location.href = 'login.html?msg=inactivo';
    return null;
  }
  perfilActual = perfil;

  // Si la sesión se cierra en otra pestaña, volvemos al login
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') location.href = 'login.html';
  });
  return perfil;
}

export function currentProfile() {
  return perfilActual;
}

export function can(permiso) {
  return Boolean(perfilActual) && hasPermission(perfilActual.rol, permiso);
}

export async function refreshProfile() {
  if (!perfilActual) return null;
  perfilActual = await q(supabase.from('perfiles').select(PERFIL_SELECT).eq('id', perfilActual.id).single());
  return perfilActual;
}

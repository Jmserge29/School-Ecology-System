// =========================================================
// M1 · Acceso a datos de usuarios (tabla perfiles + Supabase Auth)
// =========================================================
import { supabase, q, createIsolatedClient } from '../../core/supabase.js';
import { requestPasswordReset } from '../../core/auth.js';

const SELECT = 'id, nombre, correo, rol, activo, salon_id, created_at, updated_at, salon:salones!perfiles_salon_id_fkey(id, nombre, jornada)';

export async function listarUsuarios() {
  return q(supabase.from('perfiles').select(SELECT).order('nombre'));
}

/**
 * RF-03 / RF-04: crea la cuenta en Auth y luego completa el perfil.
 * Se usa un cliente aislado para que la sesión del administrador no se cierre.
 * El trigger handle_new_user crea el perfil como estudiante inactivo y aquí
 * el administrador le asigna rol, salón y lo activa.
 */
export async function crearUsuario({ nombre, correo, password, rol, salon_id }) {
  const tmp = createIsolatedClient();
  const { data, error } = await tmp.auth.signUp({
    email: correo,
    password,
    options: { data: { nombre } },
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes('already registered') || m.includes('already been registered')) throw new Error('Ya existe una cuenta con ese correo.');
    if (m.includes('password')) throw new Error('La contraseña no cumple los requisitos (mínimo 8 caracteres).');
    if (m.includes('signups not allowed')) throw new Error('El registro de cuentas está deshabilitado en Supabase (Authentication → Providers → Email → Enable sign ups).');
    throw new Error(error.message);
  }
  // Con confirmación de correo activa, Supabase devuelve un usuario "falso" sin identidades si el correo ya existe
  if (!data.user || data.user.identities?.length === 0) throw new Error('Ya existe una cuenta con ese correo.');
  await tmp.auth.signOut().catch(() => {});

  return q(supabase.from('perfiles')
    .update({ nombre, rol, salon_id: rol === 'estudiante' ? salon_id : null, activo: true })
    .eq('id', data.user.id)
    .select(SELECT)
    .single());
}

export async function actualizarUsuario(id, { nombre, rol, salon_id, activo }) {
  return q(supabase.from('perfiles')
    .update({ nombre, rol, salon_id: rol === 'estudiante' ? salon_id : null, activo })
    .eq('id', id)
    .select(SELECT)
    .single());
}

/** RF-03: activar/desactivar uno o varios usuarios (los estudiantes cambian cada año). */
export async function cambiarEstado(ids, activo) {
  return q(supabase.from('perfiles').update({ activo }).in('id', ids).select('id'));
}

/** RF-02: el administrador puede enviar el enlace de recuperación a un usuario. */
export const enviarRecuperacion = (correo) => requestPasswordReset(correo);

export function generarPassword(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const rnd = crypto.getRandomValues(new Uint32Array(len));
  return Array.from(rnd, (n) => chars[n % chars.length]).join('');
}

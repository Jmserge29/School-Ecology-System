// =========================================================
// CLIENTE SUPABASE
// Único punto de conexión con la base de datos. Todos los módulos
// importan `supabase` desde aquí; nunca crees otro cliente.
// =========================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { ENV } from '../config/env.js';

export const isConfigured =
  Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY) &&
  !ENV.SUPABASE_URL.includes('TU-PROYECTO') &&
  !ENV.SUPABASE_ANON_KEY.includes('TU-ANON-KEY');

export const supabase = isConfigured
  ? createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

/**
 * Cliente aislado que NO guarda sesión. Se usa para crear cuentas nuevas
 * (signUp) sin cerrar la sesión del administrador que está creando el usuario.
 */
export function createIsolatedClient() {
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'eco-isolated' },
  });
}

// Traducción de errores frecuentes de Postgres/PostgREST a mensajes legibles
const MENSAJES = {
  '23505': 'Ya existe un registro con esos datos (valor duplicado).',
  '23503': 'El registro está relacionado con otros datos y no se puede completar la operación.',
  '23514': 'Algún valor no cumple las reglas de validación.',
  '42501': 'No tienes permiso para realizar esta acción.',
  PGRST116: 'No se encontró el registro o no tienes permiso para verlo.',
  PGRST301: 'Tu sesión expiró. Vuelve a iniciar sesión.',
};

export function normalizeError(error) {
  if (!error) return null;
  if (error instanceof Error && !error.code) return error;
  // Los RAISE EXCEPTION de nuestras funciones SQL (código P0001) ya traen un mensaje en español
  const msg = error.code === 'P0001' ? error.message : (MENSAJES[error.code] || error.message || 'Ocurrió un error inesperado.');
  const err = new Error(msg);
  err.code = error.code;
  err.details = error.details;
  return err;
}

/**
 * Ejecuta una consulta de Supabase y devuelve `data`, o lanza un Error legible.
 *   const usuarios = await q(supabase.from('perfiles').select('*'));
 */
export async function q(query) {
  const { data, error } = await query;
  if (error) throw normalizeError(error);
  return data;
}

// =========================================================
// M2 · API PÚBLICA DE CATÁLOGOS
// Otros módulos (M3, M4, M5, M6, M7, M8) deben importar los catálogos
// desde AQUÍ en lugar de consultar las tablas directamente.
//   import { getCategorias, getSalones } from '../m2-catalogos/catalogos.api.js';
// =========================================================
import { supabase, q } from '../../core/supabase.js';

export const JORNADAS = [
  { value: 'manana', label: 'Mañana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'unica', label: 'Única' },
  { value: 'noche', label: 'Noche' },
];

export const TIPOS_DESTINO = [
  { value: 'reciclaje', label: 'Reciclaje (venta)' },
  { value: 'compostaje', label: 'Compostaje' },
  { value: 'reutilizacion', label: 'Reutilización' },
  { value: 'disposicion_final', label: 'Disposición final' },
  { value: 'otro', label: 'Otro' },
];

export const GRADOS = ['Transición', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

export const labelJornada = (v) => JORNADAS.find((j) => j.value === v)?.label || v || '—';
export const labelTipoDestino = (v) => TIPOS_DESTINO.find((t) => t.value === v)?.label || v || '—';

function activos(query, soloActivos) {
  return soloActivos ? query.eq('activo', true) : query;
}

export async function getCategorias({ soloActivos = true } = {}) {
  return q(activos(supabase.from('categorias_residuo').select('*').order('nombre'), soloActivos));
}

export async function getDestinos({ soloActivos = true } = {}) {
  return q(activos(supabase.from('destinos_aprovechamiento').select('*').order('nombre'), soloActivos));
}

export async function getSalones({ soloActivos = true } = {}) {
  const rows = await q(activos(
    supabase.from('salones').select('*, docente:perfiles!salones_docente_id_fkey(id, nombre)'),
    soloActivos,
  ));
  // Orden natural: Transición, 1°, 2° … 11°
  const ordenGrado = (g) => (g === 'Transición' ? 0 : Number(g) || 99);
  return rows.sort((a, b) => ordenGrado(a.grado) - ordenGrado(b.grado) || a.grupo.localeCompare(b.grupo));
}

export async function getPuntos({ soloActivos = true } = {}) {
  return q(activos(supabase.from('puntos_recoleccion').select('*').order('nombre'), soloActivos));
}

export async function getRecolectoras({ soloActivos = true } = {}) {
  return q(activos(supabase.from('recolectoras').select('*').order('razon_social'), soloActivos));
}

export async function getPeriodos() {
  return q(supabase.from('periodos').select('*').order('fecha_inicio', { ascending: false }));
}

export async function getPeriodoActual() {
  return q(supabase.from('periodos').select('*').eq('es_actual', true).maybeSingle());
}

export async function activarPeriodo(id) {
  return q(supabase.rpc('activar_periodo', { p_id: id }));
}

export async function getConfiguracion(clave) {
  const row = await q(supabase.from('configuracion').select('valor').eq('clave', clave).maybeSingle());
  return row?.valor ?? null;
}

export async function setConfiguracion(clave, valor) {
  return q(supabase.from('configuracion').upsert({ clave, valor }).select('clave').single());
}

export const nombrePeriodo = (p) => (p ? `${p.nombre} · ${p.anio}` : '—');

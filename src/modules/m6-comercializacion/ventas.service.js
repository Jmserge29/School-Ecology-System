// =========================================================
// M6 · Acceso a datos de ventas y soportes (tablas ventas,
// venta_detalle, venta_soportes y bucket "soportes" de Storage)
// =========================================================
import { supabase, q, normalizeError } from '../../core/supabase.js';
import { ENV } from '../../config/env.js';

const BUCKET = ENV.STORAGE_BUCKET_SOPORTES || 'soportes';

const SELECT_LISTA = `id, consecutivo, fecha, total, estado, created_at,
  recolectora:recolectoras(id, razon_social, nit),
  periodo:periodos(id, nombre, anio),
  venta_detalle(kg),
  venta_soportes(count)`;

const SELECT_DETALLE = `*,
  recolectora:recolectoras(id, razon_social, nit, contacto_nombre, telefono),
  periodo:periodos(id, nombre, anio),
  creador:perfiles!ventas_creado_por_fkey(nombre),
  validador:perfiles!ventas_validado_por_fkey(nombre),
  anulador:perfiles!ventas_anulado_por_fkey(nombre),
  venta_detalle(id, categoria_id, kg, precio_kg, subtotal, categoria:categorias_residuo(nombre, color)),
  venta_soportes(id, ruta, nombre_archivo, tipo, tamano_bytes, created_at, autor:perfiles(nombre))`;

function aplicarFiltros(query, f, prefijo = '') {
  if (f.desde) query = query.gte(`${prefijo}fecha`, f.desde);
  if (f.hasta) query = query.lte(`${prefijo}fecha`, f.hasta);
  if (f.recolectoraId) query = query.eq(`${prefijo}recolectora_id`, f.recolectoraId);
  if (f.periodoId) query = query.eq(`${prefijo}periodo_id`, f.periodoId);
  return query;
}

/** Listado paginado con filtros (fecha, recolectora, periodo, estado). */
export async function listarVentas(filtros = {}, { page = 1, pageSize = 10 } = {}) {
  let query = supabase.from('ventas').select(SELECT_LISTA, { count: 'exact' })
    .order('fecha', { ascending: false })
    .order('consecutivo', { ascending: false });
  query = aplicarFiltros(query, filtros);
  if (filtros.estado) query = query.eq('estado', filtros.estado);
  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw normalizeError(error);
  return {
    total: count || 0,
    rows: data.map((v) => ({
      ...v,
      kg: v.venta_detalle.reduce((s, d) => s + Number(d.kg), 0),
      soportes: v.venta_soportes?.[0]?.count ?? 0,
    })),
  };
}

/** Indicadores para las tarjetas superiores (mismos filtros, sin paginar). */
export async function resumenVentas(filtros = {}) {
  let query = supabase.from('ventas').select('total, estado, venta_detalle(kg)');
  query = aplicarFiltros(query, filtros);
  const rows = await q(query);
  const vigentes = rows.filter((v) => v.estado !== 'anulada');
  return {
    ingresos: vigentes.reduce((s, v) => s + Number(v.total), 0),
    kg: vigentes.reduce((s, v) => s + v.venta_detalle.reduce((a, d) => a + Number(d.kg), 0), 0),
    ventas: vigentes.length,
    pendientes: rows.filter((v) => v.estado === 'registrada').length,
  };
}

export async function obtenerVenta(id) {
  return q(supabase.from('ventas').select(SELECT_DETALLE).eq('id', id).single());
}

function rutaArchivo(file) {
  const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg';
  const d = new Date();
  return `ventas/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.${ext}`;
}

/**
 * RF-31/RF-32: guarda una venta (nueva o editada) con su detalle y soportes.
 * 1) sube los archivos nuevos a Storage  2) llama a la función SQL guardar_venta
 * que inserta todo en una sola transacción. Si falla, borra los archivos subidos.
 */
export async function guardarVenta({ id = null, fecha, recolectoraId, observaciones, detalle, archivos = [] }) {
  const subidos = [];
  try {
    for (const file of archivos) {
      const ruta = rutaArchivo(file);
      const { error } = await supabase.storage.from(BUCKET).upload(ruta, file, { contentType: file.type, upsert: false });
      if (error) throw new Error(`No se pudo subir "${file.name}": ${error.message}`);
      subidos.push({ ruta, nombre_archivo: file.name, tipo: file.type, tamano_bytes: file.size });
    }
    const { data, error } = await supabase.rpc('guardar_venta', {
      p_id: id,
      p_fecha: fecha,
      p_recolectora_id: recolectoraId,
      p_observaciones: observaciones || null,
      p_detalle: detalle,
      p_soportes: subidos,
    });
    if (error) throw normalizeError(error);
    return data;
  } catch (err) {
    if (subidos.length) await supabase.storage.from(BUCKET).remove(subidos.map((s) => s.ruta)).catch(() => {});
    throw err;
  }
}

export async function validarVenta(id) {
  return q(supabase.from('ventas').update({ estado: 'validada' }).eq('id', id).select('id').single());
}

/** RF-35: anulación con justificación obligatoria (mín. 10 caracteres). */
export async function anularVenta(id, justificacion) {
  return q(supabase.from('ventas')
    .update({ estado: 'anulada', justificacion_anulacion: justificacion })
    .eq('id', id).select('id').single());
}

/** Quita un soporte de una venta aún no validada (la BD exige conservar al menos uno). */
export async function eliminarSoporte(soporte) {
  await q(supabase.from('venta_soportes').delete().eq('id', soporte.id).select('id').single());
  await supabase.storage.from(BUCKET).remove([soporte.ruta]).catch(() => {});
}

/** RF-34: repositorio de soportes con filtros por fecha, recolectora y periodo. */
export async function listarSoportes(filtros = {}, { page = 1, pageSize = 12 } = {}) {
  let query = supabase.from('venta_soportes')
    .select(`id, ruta, nombre_archivo, tipo, tamano_bytes, created_at, autor:perfiles(nombre),
      venta:ventas!inner(id, consecutivo, fecha, estado, recolectora_id, periodo_id,
        recolectora:recolectoras(razon_social), periodo:periodos(nombre, anio))`, { count: 'exact' })
    .order('created_at', { ascending: false });
  query = aplicarFiltros(query, filtros, 'venta.');
  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw normalizeError(error);
  return { rows: data, total: count || 0 };
}

/** Devuelve { ruta: urlFirmada } para ver los archivos privados durante `segundos`. */
export async function urlsFirmadas(rutas, segundos = 3600) {
  if (!rutas.length) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(rutas, segundos);
  if (error) throw normalizeError(error);
  return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
}

/** Convierte una URL firmada en enlace de descarga directa. */
export const urlDescarga = (url, nombre) =>
  `${url}${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(nombre)}`;

/**
 * RF-36: inventario disponible por categoría que publica M4
 * (vista v_inventario_categoria). Mientras M4 no exista devuelve null.
 */
export async function inventarioDisponible() {
  const { data, error } = await supabase.from('v_inventario_categoria').select('categoria_id, kg_disponible');
  if (error) return null;
  return Object.fromEntries(data.map((r) => [r.categoria_id, Number(r.kg_disponible)]));
}

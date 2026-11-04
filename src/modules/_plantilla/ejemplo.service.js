// =========================================================
// PLANTILLA DE SERVICIO — aquí van TODAS las consultas a Supabase del módulo.
// La vista (index.js) nunca llama a supabase directamente: llama a estas funciones.
// =========================================================
import { supabase, q } from '../../core/supabase.js';

export async function listarEjemplos() {
  // Ejemplo real:
  // return q(supabase.from('recolecciones').select('*, salon:salones(nombre)').order('fecha', { ascending: false }));
  return [
    { id: 1, fecha: '2026-10-01', descripcion: 'Registro de ejemplo', kg: 3.5, estado: 'Validado' },
  ];
}

export async function crearEjemplo(datos) {
  return q(supabase.from('mi_tabla').insert(datos).select().single());
}

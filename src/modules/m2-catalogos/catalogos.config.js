// =========================================================
// M2 · DEFINICIÓN DE CADA CATÁLOGO
// Cada objeto alimenta a createCrudView (src/shared/components/crud-view.js).
// Para agregar un catálogo nuevo: crea la tabla en 02_m2_catalogos.sql,
// agrega aquí su configuración y una pestaña en TABS (index.js).
// =========================================================
import { supabase, q } from '../../core/supabase.js';
import { esc } from '../../shared/utils/dom.js';
import { badge } from '../../shared/components/ui.js';
import { toast, toastError } from '../../shared/components/toast.js';
import { formatDate } from '../../shared/utils/format.js';
import { isNit, isEmail, isPhone } from '../../shared/utils/validators.js';
import {
  JORNADAS, TIPOS_DESTINO, GRADOS, labelJornada, labelTipoDestino, activarPeriodo,
} from './catalogos.api.js';

const main = (text, sub = '') =>
  `<div class="cell-main">${esc(text)}</div>${sub ? `<div class="cell-sub">${esc(sub)}</div>` : ''}`;

export const CATALOGOS = {
  // RF-06
  categorias: {
    table: 'categorias_residuo',
    title: 'Categorías de residuo',
    singular: 'categoría',
    description: 'Tipos de material que se recolectan. Agrega vidrio o metal cuando el colegio los empiece a separar.',
    order: [{ column: 'nombre' }],
    searchKeys: ['nombre', 'descripcion'],
    columns: [
      { label: 'Categoría', render: (r) => `<div class="row"><span class="swatch" style="background:${esc(r.color)}"></span>${main(r.nombre)}</div>` },
      { label: 'Descripción', render: (r) => `<span class="text-muted">${esc(r.descripcion || '—')}</span>` },
      { label: 'Tipo', render: (r) => (r.es_organico ? badge('Orgánico', 'success', true) : badge('Aprovechable', 'info', true)) },
    ],
    fields: [
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 60, placeholder: 'Ej. Vidrio' },
      { name: 'color', label: 'Color en gráficos', type: 'color', default: '#5a7a2b' },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', full: true, maxLength: 240 },
      { name: 'es_organico', label: 'Orgánico', type: 'checkbox', full: true, checkboxLabel: 'Es residuo orgánico (se destina a compostaje)' },
    ],
  },

  // RF-07
  destinos: {
    table: 'destinos_aprovechamiento',
    title: 'Destinos de aprovechamiento',
    singular: 'destino',
    description: 'A dónde va el material clasificado: venta, compostaje, reutilización o disposición final.',
    order: [{ column: 'nombre' }],
    searchKeys: ['nombre', 'descripcion'],
    columns: [
      { label: 'Destino', render: (r) => main(r.nombre) },
      { label: 'Tipo', render: (r) => badge(labelTipoDestino(r.tipo), 'primary', true) },
      { label: 'Descripción', render: (r) => `<span class="text-muted">${esc(r.descripcion || '—')}</span>` },
    ],
    fields: [
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 60 },
      { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: TIPOS_DESTINO },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', full: true, maxLength: 240 },
    ],
  },

  // RF-08
  salones: {
    table: 'salones',
    select: '*, docente:perfiles!salones_docente_id_fkey(id, nombre)',
    title: 'Salones y grupos',
    singular: 'salón',
    description: 'Grado, grupo, jornada y docente director de cada salón.',
    order: [{ column: 'grupo' }],
    sort: (rows) => rows.sort((a, b) => GRADOS.indexOf(a.grado) - GRADOS.indexOf(b.grado)),
    searchKeys: ['nombre', 'docente.nombre'],
    columns: [
      { label: 'Salón', render: (r) => main(r.nombre, `Grado ${r.grado} · Grupo ${r.grupo}`) },
      { label: 'Jornada', render: (r) => esc(labelJornada(r.jornada)) },
      { label: 'Docente director', render: (r) => (r.docente ? esc(r.docente.nombre) : '<span class="text-muted">Sin asignar</span>') },
    ],
    loadOptions: async () => {
      const docentes = await q(supabase.from('perfiles').select('id, nombre').eq('rol', 'docente').eq('activo', true).order('nombre'));
      return { docentes: docentes.map((d) => ({ value: d.id, label: d.nombre })) };
    },
    fields: (opts) => [
      { name: 'grado', label: 'Grado', type: 'select', required: true, options: GRADOS.map((g) => ({ value: g, label: g })) },
      { name: 'grupo', label: 'Grupo', required: true, maxLength: 5, placeholder: 'A, B, 01…' },
      { name: 'jornada', label: 'Jornada', type: 'select', required: true, options: JORNADAS, default: 'manana' },
      { name: 'docente_id', label: 'Docente director', type: 'select', options: opts.docentes, placeholder: 'Sin asignar',
        help: opts.docentes.length ? '' : 'Aún no hay docentes activos. Créalos en el módulo Usuarios.' },
    ],
    beforeSave: (v) => ({ ...v, grupo: v.grupo.toUpperCase() }),
  },

  // RF-09
  puntos: {
    table: 'puntos_recoleccion',
    title: 'Puntos de recolección',
    singular: 'punto',
    description: 'Lugares del colegio donde se reciben los residuos.',
    order: [{ column: 'nombre' }],
    searchKeys: ['nombre', 'ubicacion'],
    columns: [
      { label: 'Punto', render: (r) => main(r.nombre, r.descripcion || '') },
      { label: 'Ubicación', render: (r) => `<span class="text-muted">${esc(r.ubicacion || '—')}</span>` },
    ],
    fields: [
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 80, full: true },
      { name: 'ubicacion', label: 'Ubicación dentro del colegio', maxLength: 120, full: true, placeholder: 'Ej. Bloque B, segundo piso' },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', full: true, maxLength: 240 },
    ],
  },

  // RF-10
  periodos: {
    table: 'periodos',
    title: 'Periodos académicos',
    singular: 'periodo',
    description: 'Año lectivo y periodos (P1–P4). El periodo marcado como actual es el filtro por defecto del sistema.',
    order: [{ column: 'fecha_inicio', ascending: false }],
    searchKeys: ['nombre', 'anio'],
    toggleField: null,
    columns: [
      { label: 'Periodo', render: (r) => main(`${r.nombre} · ${r.anio}`) },
      { label: 'Inicio', render: (r) => formatDate(r.fecha_inicio) },
      { label: 'Fin', render: (r) => formatDate(r.fecha_fin) },
      { label: 'Estado', render: (r) => (r.es_actual ? badge('Periodo actual', 'success') : '<span class="text-muted">—</span>') },
    ],
    rowActions: [
      {
        id: 'actual', label: 'Marcar actual', icon: 'check',
        show: (r) => !r.es_actual,
        handler: async (row, reload) => {
          try {
            await activarPeriodo(row.id);
            toast(`${row.nombre} · ${row.anio} es ahora el periodo actual`, 'success');
            reload();
          } catch (err) { toastError(err); }
        },
      },
    ],
    fields: [
      { name: 'anio', label: 'Año lectivo', type: 'number', required: true, min: 2000, max: 2100, default: new Date().getFullYear() },
      { name: 'nombre', label: 'Periodo', required: true, maxLength: 20, placeholder: 'P1, P2, P3, P4' },
      { name: 'fecha_inicio', label: 'Fecha de inicio', type: 'date', required: true },
      { name: 'fecha_fin', label: 'Fecha de fin', type: 'date', required: true,
        validate: (v, all) => (all.fecha_inicio && v < all.fecha_inicio ? 'Debe ser posterior a la fecha de inicio.' : null) },
    ],
    beforeSave: (v) => ({ ...v, nombre: v.nombre.toUpperCase() }),
  },

  // RF-11
  recolectoras: {
    table: 'recolectoras',
    title: 'Recolectoras y compradores',
    singular: 'recolectora',
    description: 'Empresas o asociaciones que compran el material reciclable.',
    order: [{ column: 'razon_social' }],
    searchKeys: ['razon_social', 'nit', 'contacto_nombre'],
    columns: [
      { label: 'Razón social', render: (r) => main(r.razon_social, `NIT ${r.nit}`) },
      { label: 'Contacto', render: (r) => main(r.contacto_nombre || '—', r.telefono || '') },
      { label: 'Correo', render: (r) => `<span class="text-muted">${esc(r.correo || '—')}</span>` },
    ],
    fields: [
      { name: 'razon_social', label: 'Razón social', required: true, maxLength: 120, full: true },
      { name: 'nit', label: 'NIT', required: true, maxLength: 20, placeholder: '900123456-7',
        validate: (v) => (isNit(v) ? null : 'NIT no válido (solo números y dígito de verificación).') },
      { name: 'contacto_nombre', label: 'Persona de contacto', maxLength: 80 },
      { name: 'telefono', label: 'Teléfono', maxLength: 20, validate: (v) => (isPhone(v) ? null : 'Teléfono no válido.') },
      { name: 'correo', label: 'Correo', type: 'email', maxLength: 120, validate: (v) => (isEmail(v) ? null : 'Correo no válido.') },
      { name: 'direccion', label: 'Dirección', maxLength: 160, full: true },
    ],
    beforeSave: (v) => ({ ...v, nit: v.nit.replace(/[.\s]/g, '') }),
  },
};

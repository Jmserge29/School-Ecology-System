// M6 · Piezas visuales propias del módulo.
import { badge } from '../../shared/components/ui.js';
import { esc } from '../../shared/utils/dom.js';
import { icon } from '../../shared/icons.js';

export const ESTADOS_VENTA = [
  { value: 'registrada', label: 'Por validar', tone: 'warning' },
  { value: 'validada', label: 'Validada', tone: 'success' },
  { value: 'anulada', label: 'Anulada', tone: 'danger' },
];

export function estadoBadge(estado) {
  const e = ESTADOS_VENTA.find((x) => x.value === estado);
  return e ? badge(e.label, e.tone) : badge(estado);
}

/** Barra de filtros compartida por "Ventas" y "Soportes". */
export function renderFiltros({ periodos, recolectoras, filtros, conEstado = false }) {
  const sel = (a, b) => (String(a) === String(b) ? 'selected' : '');
  return `<div class="toolbar">
    <div class="field">
      <label class="field__label" for="fl-periodo">Periodo</label>
      <select class="input input--sm" id="fl-periodo" data-filtro="periodoId">
        <option value="">Todos</option>
        ${periodos.map((p) => `<option value="${p.id}" ${sel(p.id, filtros.periodoId)}>${esc(p.nombre)} · ${p.anio}${p.es_actual ? ' (actual)' : ''}</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label class="field__label" for="fl-recolectora">Recolectora</label>
      <select class="input input--sm" id="fl-recolectora" data-filtro="recolectoraId">
        <option value="">Todas</option>
        ${recolectoras.map((r) => `<option value="${r.id}" ${sel(r.id, filtros.recolectoraId)}>${esc(r.razon_social)}</option>`).join('')}
      </select>
    </div>
    ${conEstado ? `<div class="field">
      <label class="field__label" for="fl-estado">Estado</label>
      <select class="input input--sm" id="fl-estado" data-filtro="estado">
        <option value="">Todos</option>
        ${ESTADOS_VENTA.map((e) => `<option value="${e.value}" ${sel(e.value, filtros.estado)}>${e.label}</option>`).join('')}
      </select>
    </div>` : ''}
    <div class="field">
      <label class="field__label" for="fl-desde">Desde</label>
      <input class="input input--sm" type="date" id="fl-desde" data-filtro="desde" value="${esc(filtros.desde || '')}">
    </div>
    <div class="field">
      <label class="field__label" for="fl-hasta">Hasta</label>
      <input class="input input--sm" type="date" id="fl-hasta" data-filtro="hasta" value="${esc(filtros.hasta || '')}">
    </div>
    <button class="btn btn--ghost btn--sm" data-action="limpiar" style="margin-bottom:2px">${icon('x', 14)}Limpiar</button>
  </div>`;
}

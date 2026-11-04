// Tabla y paginación reutilizables.
//   renderTable({ columns: [{ key, label, render(row), align: 'right'|'center', className }], rows })
import { esc } from '../utils/dom.js';
import { icon } from '../icons.js';
import { emptyState } from './ui.js';

export function renderTable({ columns, rows, empty = {}, rowClass = () => '' }) {
  if (!rows.length) return emptyState({ icon: 'search', title: 'Sin resultados', text: 'No hay registros para mostrar.', ...empty });
  const align = (c) => (c.align === 'right' ? 'is-right' : c.align === 'center' ? 'is-center' : '');
  return `<div class="table-wrap"><table class="table">
    <thead><tr>${columns.map((c) => `<th class="${align(c)} ${c.className || ''}">${c.label ?? ''}</th>`).join('')}</tr></thead>
    <tbody>
      ${rows.map((row) => `<tr class="${rowClass(row)}">${columns.map((c) => `<td class="${align(c)} ${c.className || ''}">${c.render ? c.render(row) : esc(row[c.key] ?? '—')}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table></div>`;
}

/** Paginación. Escucha clics en [data-page] desde el módulo. */
export function renderPagination({ page, pageSize, total }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) {
    return `<div class="pagination"><span class="text-sm text-muted">${total} registro${total === 1 ? '' : 's'}</span></div>`;
  }
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  // Muestra como máximo 5 números alrededor de la página actual
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const nums = [];
  for (let i = start; i <= Math.min(pages, start + 4); i++) nums.push(i);
  return `<div class="pagination">
    <span class="text-sm text-muted">${from}–${to} de ${total}</span>
    <div class="pagination__pages">
      <button class="pagination__btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Anterior">${icon('chevron-left', 14)}</button>
      ${nums.map((n) => `<button class="pagination__btn ${n === page ? 'is-active' : ''}" data-page="${n}">${n}</button>`).join('')}
      <button class="pagination__btn" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''} aria-label="Siguiente">${icon('chevron-right', 14)}</button>
    </div>
  </div>`;
}

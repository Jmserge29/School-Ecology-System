// Piezas de interfaz reutilizables que devuelven HTML (strings).
import { esc } from '../utils/dom.js';
import { icon } from '../icons.js';

export const loader = (text = 'Cargando…') =>
  `<div class="loader"><span class="spinner"></span>${esc(text)}</div>`;

export function emptyState({ icon: ic = 'folder', title = 'Sin registros', text = '', action = '' } = {}) {
  return `<div class="empty">
    <div class="empty__icon">${icon(ic, 24)}</div>
    <div class="empty__title">${esc(title)}</div>
    ${text ? `<p>${esc(text)}</p>` : ''}
    ${action}
  </div>`;
}

export function errorState(error) {
  return `<div class="card">${emptyState({
    icon: 'alert',
    title: 'No se pudo cargar la información',
    text: error?.message || String(error),
  })}</div>`;
}

export const badge = (text, tone = 'neutral', plain = false) =>
  `<span class="badge badge--${tone} ${plain ? 'badge--plain' : ''}">${esc(text)}</span>`;

/**
 * Tarjeta de indicador como la de la referencia visual.
 *   statCard({ icon: 'wallet', value: '$143.624', label: 'Ingresos del periodo' })
 */
export function statCard({ icon: ic, value, label, chip = '', accent = false, id = '' }) {
  return `<article class="stat ${accent ? 'stat--accent' : ''}" ${id ? `id="${id}"` : ''}>
    <div class="stat__icon">${icon(ic, 26)}</div>
    ${chip ? `<div class="stat__chip">${chip}</div>` : ''}
    <div class="stat__value">${value}</div>
    <div class="stat__label">${esc(label)}</div>
  </article>`;
}

export function pageHeader({ code = '', title, subtitle = '', actions = '' }) {
  return `<header class="page-header">
    <div>
      ${code ? `<div class="page-header__eyebrow">${esc(code)}</div>` : ''}
      <h1 class="page-header__title">${esc(title)}</h1>
      ${subtitle ? `<p class="page-header__subtitle">${esc(subtitle)}</p>` : ''}
    </div>
    ${actions ? `<div class="page-header__actions">${actions}</div>` : ''}
  </header>`;
}

/** Pestañas internas de un módulo que navegan por hash: #/<base>/<tab.id> */
export function renderTabs(tabs, activeId, base) {
  return `<nav class="tabs" aria-label="Secciones">
    ${tabs.map((t) => `<a class="tabs__item ${t.id === activeId ? 'is-active' : ''}" href="#/${base}/${t.id}">${t.icon ? icon(t.icon, 16) : ''}${esc(t.label)}</a>`).join('')}
  </nav>`;
}

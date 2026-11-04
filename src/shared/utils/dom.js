// Utilidades de DOM reutilizables en todos los módulos.

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto antes de insertarlo con innerHTML (evita inyección de HTML). */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/**
 * Delegación de eventos: escucha en `root` y ejecuta `handler` cuando el
 * evento ocurre dentro de un elemento que coincide con `selector`.
 *   on(container, 'click', '[data-action="editar"]', (e, btn) => ...)
 */
export function on(root, event, selector, handler) {
  const listener = (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) handler(e, target);
  };
  root.addEventListener(event, listener);
  return () => root.removeEventListener(event, listener);
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';
}

/** Carga una hoja de estilos una sola vez (útil para el CSS propio de cada módulo). */
export function loadStyles(href) {
  const url = String(href);
  if (document.querySelector(`link[data-href="${url}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.dataset.href = url;
  document.head.append(link);
}

export function setLoading(button, loading, text = 'Guardando…') {
  if (!button) return;
  if (loading) {
    button.dataset.label = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner" style="width:14px;height:14px;border-color:rgba(255,255,255,.4);border-top-color:#fff"></span>${esc(text)}`;
  } else {
    button.disabled = false;
    if (button.dataset.label) button.innerHTML = button.dataset.label;
  }
}

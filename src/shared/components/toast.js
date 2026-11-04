// Notificaciones flotantes. Uso: toast('Guardado', 'success')
import { esc } from '../utils/dom.js';
import { icon } from '../icons.js';

const ICONOS = { success: 'check-circle', error: 'alert', warning: 'alert', info: 'info' };
let region;

export function toast(message, type = 'info', ms = 3800) {
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `${icon(ICONOS[type] || 'info', 18)}<span>${esc(message)}</span>`;
  region.append(el);
  setTimeout(() => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 260);
  }, ms);
}

export const toastError = (err) => toast(err?.message || String(err), 'error', 6500);

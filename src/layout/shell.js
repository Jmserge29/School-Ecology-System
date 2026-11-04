// =========================================================
// SHELL DE LA APLICACIÓN
// Barra superior (logo, navegación por módulos, menú de usuario) y
// el contenedor <main> donde se montan los módulos.
// =========================================================
import { ENV } from '../config/env.js';
import { esc, initials, on } from '../shared/utils/dom.js';
import { icon, logoMark } from '../shared/icons.js';
import { ROLE_LABELS } from '../core/permissions.js';
import { signOut } from '../core/auth.js';
import { openChangePassword } from './change-password.js';

export function renderShell(root, { perfil, modules }) {
  root.innerHTML = `
    <div class="app">
      <header class="topbar">
        <a class="brand" href="#/inicio" aria-label="${esc(ENV.APP_NAME)} – inicio">
          ${logoMark(40)}<span class="brand__name">${esc(ENV.APP_NAME)}</span>
        </a>
        <nav class="mainnav" aria-label="Módulos">
          ${modules.map((m) => `<a class="mainnav__link" href="#/${m.id}" data-nav="${m.id}">${icon(m.icon, 16)}${esc(m.label)}</a>`).join('')}
        </nav>
        <div class="topbar__actions">
          <a class="icon-btn" href="index.html" title="Guía para estudiantes" aria-label="Guía para estudiantes">${icon('book', 18)}</a>
          <div class="dropdown">
            <button class="user-btn" type="button" data-user-menu aria-haspopup="true" aria-expanded="false">
              <span class="avatar avatar--sm">${esc(initials(perfil.nombre))}</span>
              <span class="user-btn__name text-sm fw-600">${esc(perfil.nombre.split(' ')[0])}</span>
              ${icon('chevron-down', 16)}
            </button>
            <div class="dropdown__menu" hidden data-user-dropdown>
              <div class="dropdown__header">
                <div class="fw-700">${esc(perfil.nombre)}</div>
                <div class="text-sm text-muted">${esc(perfil.correo)}</div>
                <div class="text-xs" style="margin-top:6px"><span class="badge badge--primary">${esc(ROLE_LABELS[perfil.rol])}</span>
                ${perfil.salon ? `<span class="badge">${esc(perfil.salon.nombre)}</span>` : ''}</div>
              </div>
              <button class="dropdown__item" data-menu="password">${icon('key', 16)}Cambiar contraseña</button>
              <a class="dropdown__item" href="index.html">${icon('book', 16)}Guía para estudiantes</a>
              <button class="dropdown__item dropdown__item--danger" data-menu="logout">${icon('logout', 16)}Cerrar sesión</button>
            </div>
          </div>
        </div>
      </header>
      <main class="outlet" id="outlet" tabindex="-1"></main>
      <footer class="app-footer">${esc(ENV.APP_NAME)} · Sistema de Gestión de Residuos Sólidos</footer>
    </div>`;

  const btn = root.querySelector('[data-user-menu]');
  const menu = root.querySelector('[data-user-dropdown]');
  const setMenu = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
  btn.addEventListener('click', (e) => { e.stopPropagation(); setMenu(menu.hidden); });
  document.addEventListener('click', (e) => { if (!menu.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  on(menu, 'click', '[data-menu]', (e, item) => {
    setMenu(false);
    if (item.dataset.menu === 'logout') signOut();
    if (item.dataset.menu === 'password') openChangePassword();
  });

  return {
    outlet: root.querySelector('#outlet'),
    setActive(id) {
      root.querySelectorAll('[data-nav]').forEach((a) => {
        const active = a.dataset.nav === id;
        a.classList.toggle('is-active', active);
        if (active) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      root.querySelector(`[data-nav="${id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    },
  };
}

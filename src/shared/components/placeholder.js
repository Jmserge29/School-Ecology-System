// Plantilla "módulo en construcción". La usan los módulos que aún no se
// han desarrollado. Cuando empieces tu módulo, reemplaza la llamada a
// renderModulePlaceholder() en tu index.js por tu propia vista.
import { esc } from '../utils/dom.js';
import { icon } from '../icons.js';
import { pageHeader } from './ui.js';

export function renderModulePlaceholder(container, { code, title, description, owner = 'Por asignar', folder, requisitos = [], tablas = [] }) {
  container.innerHTML = `
    ${pageHeader({ code: `${code} · Módulo en construcción`, title, subtitle: description })}
    <div class="placeholder-grid">
      <section class="card placeholder-hero">
        <div class="placeholder-hero__icon">${icon('hammer', 28)}</div>
        <h2 class="card__title">Este módulo está listo para que lo desarrolles</h2>
        <p class="text-muted">La navegación, la sesión, los permisos y los estilos ya funcionan.
          Solo tienes que construir la vista dentro de la carpeta del módulo.</p>
        <ol class="placeholder-steps">
          <li>Abre <code>${esc(folder)}/index.js</code> y reemplaza <code>renderModulePlaceholder()</code> por tu vista.</li>
          <li>Pon las consultas a Supabase en <code>${esc(folder)}/*.service.js</code>.</li>
          <li>Crea tus tablas en el archivo SQL del módulo dentro de <code>/database</code>.</li>
          <li>Reutiliza lo de <code>src/shared</code>: tablas, modales, formularios, toasts.</li>
        </ol>
        <div class="row row--wrap">
          <span class="badge badge--primary">Responsable: ${esc(owner)}</span>
          <span class="badge">Lee el README.md del módulo</span>
        </div>
      </section>
      <section class="card">
        <h3 class="card__title">Requisitos funcionales</h3>
        <ul class="placeholder-list">
          ${requisitos.map((r) => `<li><span class="badge badge--plain">${esc(r.id)}</span><span>${esc(r.texto)}</span></li>`).join('')}
        </ul>
        ${tablas.length ? `<h3 class="card__title" style="margin-top:18px">Tablas sugeridas</h3>
          <div class="row row--wrap" style="margin-top:8px">${tablas.map((t) => `<code class="placeholder-code">${esc(t)}</code>`).join('')}</div>` : ''}
      </section>
    </div>
    <style>
      .placeholder-grid { display:grid; grid-template-columns: 1.1fr 1fr; gap:16px; }
      .placeholder-hero { background: var(--c-lime-soft); border-color:#e1ebc2; display:flex; flex-direction:column; gap:12px; }
      .placeholder-hero__icon { width:56px; height:56px; border-radius:18px; display:grid; place-items:center; background: var(--c-forest); color: var(--c-lime); }
      .placeholder-steps { margin:0; padding-left:20px; display:flex; flex-direction:column; gap:6px; color: var(--c-text-2); }
      .placeholder-steps code, .placeholder-code { font-size:12px; background: var(--c-surface); border:1px solid var(--c-border); padding:1px 6px; border-radius:6px; }
      .placeholder-list { list-style:none; margin:12px 0 0; padding:0; display:flex; flex-direction:column; gap:10px; }
      .placeholder-list li { display:flex; gap:10px; align-items:flex-start; font-size:13.5px; }
      .placeholder-list .badge { flex-shrink:0; }
      @media (max-width: 900px) { .placeholder-grid { grid-template-columns: 1fr; } }
    </style>`;
}

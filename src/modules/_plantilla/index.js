// =========================================================
// PLANTILLA DE MÓDULO — cópiala como punto de partida.
// Este archivo NO está registrado en la navegación; es solo un ejemplo.
//
// Contrato: el módulo exporta por defecto un objeto con `mount(container, ctx)`.
//   container → <div> vacío donde dibujas tu vista
//   ctx.user  → perfil del usuario { id, nombre, correo, rol, salon }
//   ctx.can('permiso') → true/false según permissions.js
//   ctx.route → { path, sub, query }  (ej. #/recoleccion/nueva → sub = 'nueva')
//   ctx.navigate('recoleccion/nueva')
//   ctx.onCleanup(fn) → se ejecuta al salir del módulo (timers, listeners globales)
// =========================================================
import { esc, on, loadStyles } from '../../shared/utils/dom.js';
import { icon } from '../../shared/icons.js';
import { pageHeader, loader, errorState, badge } from '../../shared/components/ui.js';
import { renderTable } from '../../shared/components/table.js';
import { toast, toastError } from '../../shared/components/toast.js';
import { formatDate, formatKg } from '../../shared/utils/format.js';
import { listarEjemplos } from './ejemplo.service.js';

// Si tu módulo necesita CSS propio, crea styles.css en esta carpeta:
// loadStyles(new URL('./styles.css', import.meta.url));

export default {
  async mount(container, ctx) {
    container.innerHTML = `
      ${pageHeader({
        code: 'MX · Nombre del módulo',
        title: 'Título de la vista',
        subtitle: 'Explica en una línea qué hace esta pantalla.',
        actions: ctx.can('recoleccion.registrar')
          ? `<button class="btn btn--primary" data-action="nuevo">${icon('plus', 16)}Nuevo</button>` : '',
      })}
      <section class="card card--flush"><div data-slot="tabla">${loader()}</div></section>`;

    const tabla = container.querySelector('[data-slot="tabla"]');

    try {
      const rows = await listarEjemplos();
      tabla.innerHTML = renderTable({
        rows,
        columns: [
          { label: 'Fecha', render: (r) => formatDate(r.fecha) },
          { label: 'Descripción', render: (r) => `<span class="cell-main">${esc(r.descripcion)}</span>` },
          { label: 'Kg', align: 'right', render: (r) => formatKg(r.kg) },
          { label: 'Estado', render: (r) => badge(r.estado, 'success') },
        ],
      });
    } catch (err) {
      tabla.innerHTML = errorState(err);
    }

    // Delegación de eventos: un solo listener para todos los botones con data-action
    on(container, 'click', '[data-action="nuevo"]', () => {
      toast('Aquí abrirías un modal con openModal()', 'info');
    });
  },
};

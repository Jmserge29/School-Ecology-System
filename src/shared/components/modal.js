// Modal basado en <dialog>. El contenido lo define quien lo abre.
//   const m = openModal({ title: 'Nuevo', content: `<form class="modal__form">
//       <div class="modal__body">…</div>
//       <div class="modal__footer">…</div></form>` });
//   m.content.querySelector('form') …;  m.close();
import { esc } from '../utils/dom.js';
import { icon } from '../icons.js';

export function openModal({ title, subtitle = '', content = '', size = 'md', onClose } = {}) {
  const dialog = document.createElement('dialog');
  dialog.className = `modal modal--${size}`;
  dialog.innerHTML = `
    <div class="modal__header">
      <div>
        <h2 class="modal__title">${esc(title)}</h2>
        ${subtitle ? `<p class="modal__subtitle">${esc(subtitle)}</p>` : ''}
      </div>
      <button type="button" class="icon-btn icon-btn--sm" data-close aria-label="Cerrar">${icon('x', 16)}</button>
    </div>
    <div class="modal__content"></div>`;

  const contentEl = dialog.querySelector('.modal__content');
  if (typeof content === 'string') contentEl.innerHTML = content;
  else if (content) contentEl.append(content);

  document.body.append(dialog);
  dialog.showModal();

  // finish() se ejecuta una sola vez, al cerrar con close() o con la tecla Escape
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    dialog.remove();
    onClose?.();
  };
  const close = () => {
    if (dialog.open) dialog.close();
    finish();
  };

  dialog.addEventListener('close', finish);
  dialog.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) close();
  });
  // Clic en el fondo oscuro cierra el modal
  dialog.addEventListener('mousedown', (e) => {
    if (e.target === dialog) close();
  });

  return { dialog, content: contentEl, close };
}

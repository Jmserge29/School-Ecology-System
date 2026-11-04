// Diálogo de confirmación. Devuelve una promesa:
//   - sin input: true | false
//   - con input: el texto escrito | false
//   const ok = await confirmDialog({ title: '¿Desactivar?', danger: true });
//   const motivo = await confirmDialog({ title: 'Anular', input: { label: 'Justificación', minLength: 10 } });
import { esc } from '../utils/dom.js';
import { openModal } from './modal.js';

export function confirmDialog({
  title = '¿Estás seguro?', message = '', confirmText = 'Confirmar', cancelText = 'Cancelar',
  danger = false, input = null,
} = {}) {
  return new Promise((resolve) => {
    let result = false;
    const m = openModal({
      title, size: 'sm',
      onClose: () => resolve(result),
      content: `<form class="modal__form" novalidate>
        <div class="modal__body stack">
          ${message ? `<p class="text-muted">${esc(message)}</p>` : ''}
          ${input ? `<div class="field">
            <label class="field__label" for="confirm-input">${esc(input.label)} <b class="req">*</b></label>
            <textarea class="input" id="confirm-input" name="valor" rows="3" placeholder="${esc(input.placeholder || '')}"></textarea>
            ${input.minLength ? `<span class="field__help">Mínimo ${input.minLength} caracteres.</span>` : ''}
            <span class="field__error"></span>
          </div>` : ''}
        </div>
        <div class="modal__footer">
          <button type="button" class="btn btn--ghost" data-close>${esc(cancelText)}</button>
          <button type="submit" class="btn ${danger ? 'btn--danger' : 'btn--primary'}">${esc(confirmText)}</button>
        </div>
      </form>`,
    });

    const form = m.content.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input) {
        const value = form.valor.value.trim();
        if (value.length < (input.minLength || 1)) {
          const field = form.querySelector('.field');
          field.classList.add('has-error');
          field.querySelector('.field__error').textContent = `Escribe al menos ${input.minLength || 1} caracteres.`;
          return;
        }
        result = value;
      } else {
        result = true;
      }
      m.close();
    });
    form.querySelector('textarea, [type="submit"]')?.focus();
  });
}

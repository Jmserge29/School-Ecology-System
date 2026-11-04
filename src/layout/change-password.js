// Modal "Cambiar contraseña" del menú de usuario.
import { openModal } from '../shared/components/modal.js';
import { renderFields, readForm, validateFields, showErrors } from '../shared/components/form.js';
import { toast, toastError } from '../shared/components/toast.js';
import { setLoading } from '../shared/utils/dom.js';
import { updatePassword } from '../core/auth.js';

const FIELDS = [
  { name: 'password', label: 'Nueva contraseña', type: 'password', required: true, full: true,
    help: 'Mínimo 8 caracteres.', validate: (v) => (v.length < 8 ? 'Debe tener al menos 8 caracteres.' : null) },
  { name: 'confirmar', label: 'Confirmar contraseña', type: 'password', required: true, full: true,
    validate: (v, all) => (v !== all.password ? 'Las contraseñas no coinciden.' : null) },
];

export function openChangePassword() {
  const m = openModal({
    title: 'Cambiar contraseña', size: 'sm',
    content: `<form class="modal__form" novalidate>
      <div class="modal__body"><div class="form-grid">${renderFields(FIELDS)}</div></div>
      <div class="modal__footer">
        <button type="button" class="btn btn--ghost" data-close>Cancelar</button>
        <button type="submit" class="btn btn--primary">Actualizar</button>
      </div></form>`,
  });
  const form = m.content.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const values = readForm(form, FIELDS);
    if (!showErrors(form, validateFields(FIELDS, values))) return;
    const btn = form.querySelector('[type="submit"]');
    setLoading(btn, true);
    try {
      await updatePassword(values.password);
      toast('Contraseña actualizada', 'success');
      m.close();
    } catch (err) {
      toastError(err);
      setLoading(btn, false);
    }
  });
}

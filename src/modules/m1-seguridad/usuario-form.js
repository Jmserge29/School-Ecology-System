// M1 · Formulario de creación / edición de usuario (modal).
import { openModal } from '../../shared/components/modal.js';
import { renderFields, readForm, validateFields, showErrors } from '../../shared/components/form.js';
import { toast, toastError } from '../../shared/components/toast.js';
import { setLoading, esc } from '../../shared/utils/dom.js';
import { icon } from '../../shared/icons.js';
import { ROLE_LABELS } from '../../core/permissions.js';
import { labelJornada } from '../m2-catalogos/catalogos.api.js';
import { crearUsuario, actualizarUsuario, generarPassword } from './usuarios.service.js';

const ROLES_OPTS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

function campos({ usuario, salones, esPropio }) {
  const salonOpts = salones.map((s) => ({ value: s.id, label: `${s.nombre} · ${labelJornada(s.jornada)}` }));
  return [
    { name: 'nombre', label: 'Nombre completo', required: true, maxLength: 100, full: true,
      validate: (v) => (v.length < 3 ? 'Escribe el nombre completo.' : null) },
    { name: 'correo', label: 'Correo', type: 'email', required: !usuario, full: true, disabled: Boolean(usuario),
      placeholder: 'nombre@colegio.edu.co', help: usuario ? 'El correo no se puede cambiar.' : 'Será su usuario para ingresar.' },
    ...(usuario ? [] : [{
      name: 'password', label: 'Contraseña temporal', required: true, full: true,
      help: 'Compártela con el usuario. Podrá cambiarla desde su menú o con "¿Olvidaste tu contraseña?".',
      validate: (v) => (v.length < 8 ? 'Mínimo 8 caracteres.' : null),
    }]),
    { name: 'rol', label: 'Rol', type: 'select', required: true, options: ROLES_OPTS, disabled: esPropio,
      help: esPropio ? 'No puedes cambiar tu propio rol.' : '' },
    { name: 'salon_id', label: 'Salón', type: 'select', options: salonOpts, placeholder: 'Selecciona el salón', validateEmpty: true,
      validate: (v, all) => (all.rol === 'estudiante' && !v ? 'Los estudiantes deben tener salón.' : null) },
    ...(usuario ? [{ name: 'activo', label: 'Activo', type: 'checkbox', full: true, disabled: esPropio,
      checkboxLabel: 'Cuenta activa (puede ingresar al sistema)' }] : []),
  ];
}

export function openUsuarioForm({ usuario = null, salones, currentUserId, onSaved }) {
  const esPropio = usuario?.id === currentUserId;
  const fields = campos({ usuario, salones, esPropio });
  const valores = usuario ? { ...usuario } : { rol: 'estudiante', password: generarPassword() };

  const m = openModal({
    title: usuario ? 'Editar usuario' : 'Nuevo usuario',
    subtitle: usuario ? usuario.correo : 'Crea la cuenta y asigna su rol',
    content: `<form class="modal__form" novalidate>
      <div class="modal__body">
        <div class="form-grid">${renderFields(fields, valores)}</div>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn btn--ghost" data-close>Cancelar</button>
        <button type="submit" class="btn btn--primary">${icon('check', 16)}${usuario ? 'Guardar cambios' : 'Crear usuario'}</button>
      </div>
    </form>`,
  });
  const form = m.content.querySelector('form');

  // Botón para regenerar la contraseña temporal
  const passField = form.querySelector('[data-field="password"]');
  if (passField) {
    passField.querySelector('input').insertAdjacentHTML('afterend',
      `<button type="button" class="btn btn--outline btn--sm" data-gen style="align-self:flex-start">${icon('refresh', 14)}Generar otra</button>`);
    passField.querySelector('[data-gen]').addEventListener('click', () => {
      passField.querySelector('input').value = generarPassword();
    });
  }

  // El salón solo aplica a estudiantes
  const salonField = form.querySelector('[data-field="salon_id"]');
  const syncSalon = () => { salonField.hidden = form.rol.value !== 'estudiante'; };
  form.rol.addEventListener('change', syncSalon);
  syncSalon();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const values = readForm(form, fields);
    if (usuario) {
      values.correo = usuario.correo;
      if (esPropio) { values.rol = usuario.rol; values.activo = usuario.activo; }
    }
    if (!showErrors(form, validateFields(fields, values))) return;

    const btn = form.querySelector('[type="submit"]');
    setLoading(btn, true);
    try {
      if (usuario) {
        await actualizarUsuario(usuario.id, values);
        toast('Usuario actualizado', 'success');
      } else {
        await crearUsuario({ ...values, correo: values.correo.toLowerCase() });
        toast(`Cuenta creada para ${values.nombre}`, 'success');
      }
      m.close();
      onSaved?.();
    } catch (err) {
      toastError(err);
      setLoading(btn, false);
    }
  });

  if (!salones.length) {
    salonField.querySelector('.field__help')?.remove();
    salonField.insertAdjacentHTML('beforeend', `<span class="field__help">${esc('Aún no hay salones. Créalos en Catálogos → Salones.')}</span>`);
  }
}

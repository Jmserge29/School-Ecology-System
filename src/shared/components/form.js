// Formularios declarativos: describe los campos con un arreglo y este
// archivo los dibuja, lee y valida.
//
// Campo: { name, label, type: 'text'|'number'|'email'|'date'|'select'|'textarea'|'checkbox'|'color'|'password',
//          required, options: [{value,label}], min, max, step, maxLength, placeholder,
//          help, full (ocupa toda la fila), checkboxLabel, default, disabled,
//          validate(value, values) → 'mensaje de error' | null,
//          validateEmpty (ejecuta validate aunque el campo esté vacío) }
import { esc } from '../utils/dom.js';
import { isEmail } from '../utils/validators.js';

export function renderField(f, value) {
  const id = `f-${f.name}`;
  const v = value ?? f.default ?? '';
  const common = `id="${id}" name="${esc(f.name)}" ${f.required ? 'required' : ''} ${f.disabled ? 'disabled' : ''}`;
  let control;

  switch (f.type) {
    case 'textarea':
      control = `<textarea class="input" ${common} rows="${f.rows || 3}" ${f.maxLength ? `maxlength="${f.maxLength}"` : ''} placeholder="${esc(f.placeholder || '')}">${esc(v)}</textarea>`;
      break;
    case 'select':
      control = `<select class="input" ${common}>
        <option value="">${esc(f.placeholder || 'Selecciona…')}</option>
        ${(f.options || []).map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
      </select>`;
      break;
    case 'checkbox':
      control = `<label class="switch"><input type="checkbox" ${common} ${v ? 'checked' : ''}><span class="switch__track"></span><span>${esc(f.checkboxLabel || f.label)}</span></label>`;
      break;
    case 'color':
      control = `<input class="input input--color" type="color" ${common} value="${esc(v || '#5a7a2b')}">`;
      break;
    default:
      control = `<input class="input" type="${f.type || 'text'}" ${common} value="${esc(v)}"
        ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''}
        ${f.step !== undefined ? `step="${f.step}"` : ''} ${f.maxLength ? `maxlength="${f.maxLength}"` : ''}
        placeholder="${esc(f.placeholder || '')}" autocomplete="off">`;
  }

  const label = f.type === 'checkbox'
    ? ''
    : `<label class="field__label" for="${id}">${esc(f.label)}${f.required ? ' <b class="req">*</b>' : ''}</label>`;

  return `<div class="field ${f.full ? 'field--full' : ''}" data-field="${esc(f.name)}">
    ${label}${control}
    ${f.help ? `<span class="field__help">${esc(f.help)}</span>` : ''}
    <span class="field__error"></span>
  </div>`;
}

export function renderFields(fields, values = {}) {
  return fields.map((f) => renderField(f, values[f.name])).join('');
}

/** Lee los valores del formulario según la definición de campos. */
export function readForm(form, fields) {
  const values = {};
  for (const f of fields) {
    const el = form.elements[f.name];
    if (!el) continue;
    if (f.type === 'checkbox') values[f.name] = el.checked;
    else if (f.type === 'number') values[f.name] = el.value === '' ? null : Number(el.value);
    else {
      const raw = el.value.trim();
      values[f.name] = raw === '' ? null : raw;
    }
  }
  return values;
}

/** Valida y devuelve { campo: 'mensaje' }. Objeto vacío = válido. */
export function validateFields(fields, values) {
  const errors = {};
  for (const f of fields) {
    const v = values[f.name];
    const empty = v === null || v === undefined || v === '';
    if (f.required && empty && f.type !== 'checkbox') { errors[f.name] = 'Este campo es obligatorio.'; continue; }
    if (empty) {
      // validateEmpty: el campo es obligatorio solo en ciertos casos (ej. salón si el rol es estudiante)
      const msg = f.validateEmpty && f.validate?.(v, values);
      if (msg) errors[f.name] = msg;
      continue;
    }
    if (f.type === 'email' && !isEmail(v)) errors[f.name] = 'Correo no válido.';
    if (f.type === 'number' && f.min !== undefined && v < f.min) errors[f.name] = `Debe ser mayor o igual a ${f.min}.`;
    if (f.type === 'number' && f.max !== undefined && v > f.max) errors[f.name] = `Debe ser menor o igual a ${f.max}.`;
    if (!errors[f.name] && f.validate) {
      const msg = f.validate(v, values);
      if (msg) errors[f.name] = msg;
    }
  }
  return errors;
}

export function showErrors(form, errors) {
  form.querySelectorAll('.field').forEach((fieldEl) => {
    const name = fieldEl.dataset.field;
    const msg = name ? errors[name] : null;
    fieldEl.classList.toggle('has-error', Boolean(msg));
    const out = fieldEl.querySelector('.field__error');
    if (out) out.textContent = msg || '';
  });
  const first = form.querySelector('.field.has-error .input, .field.has-error input');
  first?.focus();
  return Object.keys(errors).length === 0;
}

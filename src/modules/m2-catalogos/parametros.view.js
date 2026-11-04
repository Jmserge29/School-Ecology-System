// M2 · Parámetros generales: institución, unidad de medida y rangos del
// compost (los usa M5 para las alertas de RF-29).
import { getConfiguracion, setConfiguracion } from './catalogos.api.js';
import { icon } from '../../shared/icons.js';
import { esc, setLoading } from '../../shared/utils/dom.js';
import { loader, errorState } from '../../shared/components/ui.js';
import { toast, toastError } from '../../shared/components/toast.js';

const RANGOS_DEFECTO = {
  temperatura: { min: 40, max: 65 },
  humedad: { min: 40, max: 60 },
  ph: { min: 6.5, max: 8.5 },
};

const PARAMS = [
  { key: 'temperatura', label: 'Temperatura', unit: '°C', icon: 'thermometer', step: 1 },
  { key: 'humedad', label: 'Humedad', unit: '%', icon: 'droplet', step: 1 },
  { key: 'ph', label: 'pH', unit: '', icon: 'flask', step: 0.1 },
];

export async function mountParametros(container, { canEdit }) {
  container.innerHTML = loader();
  let institucion; let unidad; let rangos;
  try {
    [institucion, unidad, rangos] = await Promise.all([
      getConfiguracion('nombre_institucion'),
      getConfiguracion('unidad_medida'),
      getConfiguracion('rangos_compost'),
    ]);
  } catch (err) {
    container.innerHTML = errorState(err);
    return;
  }
  rangos = { ...RANGOS_DEFECTO, ...(rangos || {}) };
  const dis = canEdit ? '' : 'disabled';

  container.innerHTML = `
    <form class="param-grid" novalidate>
      <section class="card">
        <div class="card__head"><div>
          <h2 class="card__title">Datos generales</h2>
          <p class="card__subtitle">Aparecen en encabezados y reportes.</p>
        </div></div>
        <div class="form-grid">
          <div class="field field--full" data-field="institucion">
            <label class="field__label" for="p-inst">Nombre de la institución</label>
            <input class="input" id="p-inst" name="institucion" maxlength="120" value="${esc(institucion || '')}" ${dis}>
            <span class="field__error"></span>
          </div>
          <div class="field field--full">
            <label class="field__label" for="p-unidad">Unidad de medida</label>
            <input class="input" id="p-unidad" value="${esc(unidad || 'kg')} (kilogramos)" readonly>
            <span class="field__help">Todo el sistema registra en kilogramos; el colegio pesa el material antes de registrarlo.</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card__head"><div>
          <h2 class="card__title">Rangos de calidad del compost</h2>
          <p class="card__subtitle">Si una lectura de la bitácora (M5) sale de estos rangos, el sistema genera una alerta.</p>
        </div></div>
        <div class="param-rangos">
          ${PARAMS.map((p) => `
            <div class="param-rango" data-field="${p.key}">
              <div class="row"><span class="param-rango__icon">${icon(p.icon, 18)}</span><span class="fw-600">${p.label}</span>
                ${p.unit ? `<span class="text-muted text-sm">(${p.unit})</span>` : ''}</div>
              <div class="row">
                <input class="input input--sm" type="number" step="${p.step}" name="${p.key}_min" value="${rangos[p.key].min}" aria-label="${p.label} mínimo" ${dis}>
                <span class="text-muted">a</span>
                <input class="input input--sm" type="number" step="${p.step}" name="${p.key}_max" value="${rangos[p.key].max}" aria-label="${p.label} máximo" ${dis}>
              </div>
              <span class="field__error"></span>
            </div>`).join('')}
        </div>
      </section>

      ${canEdit ? `<div class="param-actions"><button class="btn btn--primary" type="submit">${icon('check', 16)}Guardar parámetros</button></div>` : ''}
    </form>
    <style>
      .param-grid { display:grid; grid-template-columns: 1fr 1.3fr; gap:16px; align-items:start; }
      .param-actions { grid-column: 1 / -1; display:flex; justify-content:flex-end; }
      .param-rangos { display:flex; flex-direction:column; gap:12px; }
      .param-rango { display:grid; grid-template-columns: 1fr auto; align-items:center; gap:8px 16px; padding:12px 14px; border:1px solid var(--c-border); border-radius:14px; background: var(--c-surface-2); }
      .param-rango .input { width: 90px; }
      .param-rango .field__error { grid-column: 1 / -1; }
      .param-rango.has-error { border-color: var(--c-danger); }
      .param-rango__icon { width:32px; height:32px; border-radius:10px; display:grid; place-items:center; background: var(--c-lime); color: var(--c-forest); }
      @media (max-width: 900px) { .param-grid { grid-template-columns: 1fr; } .param-rango { grid-template-columns: 1fr; } }
    </style>`;

  if (!canEdit) return;
  const form = container.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevos = {};
    let ok = true;
    for (const p of PARAMS) {
      const min = Number(form[`${p.key}_min`].value);
      const max = Number(form[`${p.key}_max`].value);
      const box = form.querySelector(`[data-field="${p.key}"]`);
      const err = form[`${p.key}_min`].value === '' || form[`${p.key}_max`].value === ''
        ? 'Completa ambos valores.'
        : min >= max ? 'El mínimo debe ser menor que el máximo.' : '';
      box.classList.toggle('has-error', Boolean(err));
      box.querySelector('.field__error').textContent = err;
      if (err) ok = false;
      nuevos[p.key] = { min, max };
    }
    if (!ok) return;

    const btn = form.querySelector('[type="submit"]');
    setLoading(btn, true);
    try {
      await Promise.all([
        setConfiguracion('rangos_compost', nuevos),
        setConfiguracion('nombre_institucion', form.institucion.value.trim()),
      ]);
      toast('Parámetros guardados', 'success');
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(btn, false);
    }
  });
}

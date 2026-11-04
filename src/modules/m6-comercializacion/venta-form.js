// =========================================================
// M6 · Formulario de venta (modal)  RF-31, RF-32, RF-33, RF-36
// Varias líneas de material (categoría, kg, precio/kg), total calculado,
// y soportes: foto con la cámara del celular o archivo JPG/PNG/PDF.
// =========================================================
import { openModal } from '../../shared/components/modal.js';
import { toast, toastError } from '../../shared/components/toast.js';
import { esc, on, setLoading } from '../../shared/utils/dom.js';
import { icon } from '../../shared/icons.js';
import { formatMoney, formatKg, formatBytes, todayISO } from '../../shared/utils/format.js';
import { getCategorias, getRecolectoras } from '../m2-catalogos/catalogos.api.js';
import { guardarVenta, eliminarSoporte, inventarioDisponible, urlsFirmadas } from './ventas.service.js';
import { prepararArchivo, esImagen } from './soportes.utils.js';

let seq = 0;
const nuevaLinea = (d = {}) => ({ key: ++seq, categoria_id: d.categoria_id || '', kg: d.kg ?? '', precio_kg: d.precio_kg ?? '' });

export async function openVentaForm({ venta = null, onSaved } = {}) {
  let categorias; let recolectoras; let inventario; let urls = {};
  try {
    [categorias, recolectoras, inventario] = await Promise.all([getCategorias(), getRecolectoras(), inventarioDisponible()]);
    if (venta) urls = await urlsFirmadas(venta.venta_soportes.map((s) => s.ruta));
  } catch (err) {
    toastError(err);
    return;
  }

  // En edición, una categoría inactiva que ya estaba en la venta debe seguir apareciendo
  if (venta) {
    for (const d of venta.venta_detalle) {
      if (!categorias.some((c) => c.id === d.categoria_id)) categorias.push({ id: d.categoria_id, nombre: d.categoria.nombre });
    }
    if (!recolectoras.some((r) => r.id === venta.recolectora_id)) recolectoras.push(venta.recolectora);
  }

  // kg que esta misma venta ya descontó del inventario (se suman al disponible al editar)
  const kgPropios = Object.fromEntries((venta?.venta_detalle || []).map((d) => [d.categoria_id, Number(d.kg)]));

  const state = {
    lineas: venta ? venta.venta_detalle.map(nuevaLinea) : [nuevaLinea()],
    existentes: venta ? [...venta.venta_soportes] : [],
    quitar: new Set(),
    nuevos: [], // { key, file, preview }
  };

  const m = openModal({
    title: venta ? `Editar venta #${String(venta.consecutivo).padStart(5, '0')}` : 'Registrar venta',
    subtitle: 'Material vendido a una recolectora, con su recibo como soporte.',
    size: 'lg',
    onClose: () => state.nuevos.forEach((n) => n.preview && URL.revokeObjectURL(n.preview)),
    content: `<form class="modal__form" novalidate>
      <div class="modal__body stack">
        <div class="form-grid">
          <div class="field" data-field="fecha">
            <label class="field__label" for="v-fecha">Fecha de la venta <b class="req">*</b></label>
            <input class="input" type="date" id="v-fecha" name="fecha" max="${todayISO()}" value="${esc(venta?.fecha || todayISO())}" required>
            <span class="field__error"></span>
          </div>
          <div class="field" data-field="recolectora">
            <label class="field__label" for="v-recolectora">Recolectora / comprador <b class="req">*</b></label>
            <select class="input" id="v-recolectora" name="recolectora" required>
              <option value="">Selecciona…</option>
              ${recolectoras.map((r) => `<option value="${r.id}" ${r.id === venta?.recolectora_id ? 'selected' : ''}>${esc(r.razon_social)} · NIT ${esc(r.nit)}</option>`).join('')}
            </select>
            ${recolectoras.length ? '' : '<span class="field__help">No hay recolectoras activas. Créalas en Catálogos → Recolectoras.</span>'}
            <span class="field__error"></span>
          </div>
        </div>

        <section class="vf-section">
          <div class="vf-section__head">
            <div><h3 class="vf-section__title">Material vendido</h3>
            <p class="text-sm text-muted">Una línea por categoría. El total se calcula automáticamente.</p></div>
            <button type="button" class="btn btn--outline btn--sm" data-action="add-linea">${icon('plus', 14)}Agregar categoría</button>
          </div>
          <div class="vf-lineas__head" aria-hidden="true"><span>Categoría</span><span>Kg</span><span>Precio por kg</span><span>Subtotal</span><span></span></div>
          <div data-slot="lineas"></div>
          <span class="field__error" data-slot="lineas-error"></span>
          <div class="vf-total"><span>Total de la venta</span><strong data-slot="total">$0</strong></div>
        </section>

        <section class="vf-section">
          <div class="vf-section__head">
            <div><h3 class="vf-section__title">Soportes del recibo <b class="req">*</b></h3>
            <p class="text-sm text-muted">Obligatorio: al menos una foto (JPG/PNG) o PDF del recibo. Máx. 10 MB por archivo.</p></div>
          </div>
          <div class="vf-drop" data-slot="drop">
            <div class="vf-drop__icon">${icon('upload', 22)}</div>
            <div class="text-sm text-muted">Arrastra aquí el recibo o</div>
            <div class="row row--wrap" style="justify-content:center">
              <label class="btn btn--dark btn--sm">${icon('camera', 15)}Tomar foto
                <input type="file" accept="image/*" capture="environment" data-input="camara" hidden></label>
              <label class="btn btn--outline btn--sm">${icon('file', 15)}Subir archivo
                <input type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" multiple data-input="archivo" hidden></label>
            </div>
          </div>
          <div class="vf-soportes" data-slot="soportes"></div>
          <span class="field__error" data-slot="soportes-error"></span>
        </section>

        <div class="field" data-field="observaciones">
          <label class="field__label" for="v-obs">Observaciones</label>
          <textarea class="input" id="v-obs" name="observaciones" rows="2" maxlength="500" placeholder="Opcional: número de recibo, condiciones, quién recogió…">${esc(venta?.observaciones || '')}</textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn btn--ghost" data-close>Cancelar</button>
        <button type="submit" class="btn btn--primary">${icon('check', 16)}${venta ? 'Guardar cambios' : 'Registrar venta'}</button>
      </div>
    </form>`,
  });

  const form = m.content.querySelector('form');
  const slot = (n) => form.querySelector(`[data-slot="${n}"]`);

  // ---------- Líneas ----------
  const disponible = (catId) => (inventario && catId ? (inventario[catId] ?? 0) + (kgPropios[catId] || 0) : null);

  function paintLineas() {
    const usadas = (key) => state.lineas.filter((l) => l.key !== key).map((l) => l.categoria_id);
    slot('lineas').innerHTML = state.lineas.map((l) => {
      const disp = disponible(l.categoria_id);
      return `<div class="vf-linea" data-key="${l.key}">
        <select class="input input--sm" data-linea="categoria_id" aria-label="Categoría">
          <option value="">Categoría…</option>
          ${categorias.filter((c) => !usadas(l.key).includes(c.id)).map((c) => `<option value="${c.id}" ${c.id === l.categoria_id ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}
        </select>
        <div class="vf-linea__kg">
          <input class="input input--sm" type="number" min="0.01" step="0.01" inputmode="decimal" data-linea="kg" value="${esc(l.kg)}" placeholder="0" aria-label="Kilogramos">
          ${disp !== null ? `<span class="field__help">Disponible: ${formatKg(disp)}</span>` : ''}
        </div>
        <input class="input input--sm" type="number" min="0" step="1" inputmode="numeric" data-linea="precio_kg" value="${esc(l.precio_kg)}" placeholder="$ 0" aria-label="Precio por kg">
        <span class="vf-linea__sub mono" data-sub>${formatMoney(subtotal(l))}</span>
        <button type="button" class="icon-btn icon-btn--sm icon-btn--plain" data-action="del-linea" ${state.lineas.length === 1 ? 'disabled' : ''} aria-label="Quitar línea">${icon('trash', 15)}</button>
      </div>`;
    }).join('');
    paintTotal();
    form.querySelector('[data-action="add-linea"]').disabled = state.lineas.length >= categorias.length;
  }

  const subtotal = (l) => (Number(l.kg) || 0) * (Number(l.precio_kg) || 0);
  function paintTotal() {
    slot('total').textContent = formatMoney(state.lineas.reduce((s, l) => s + subtotal(l), 0));
  }

  on(form, 'input', '[data-linea]', (e, el) => {
    const row = el.closest('.vf-linea');
    const linea = state.lineas.find((l) => l.key === Number(row.dataset.key));
    linea[el.dataset.linea] = el.value;
    el.classList.remove('is-invalid');
    if (el.dataset.linea === 'categoria_id') { paintLineas(); return; }
    row.querySelector('[data-sub]').textContent = formatMoney(subtotal(linea));
    paintTotal();
  });

  // ---------- Soportes ----------
  function totalSoportes() {
    return state.existentes.filter((s) => !state.quitar.has(s.id)).length + state.nuevos.length;
  }

  function paintSoportes() {
    const vigentes = state.existentes.filter((s) => !state.quitar.has(s.id));
    const items = [
      ...vigentes.map((s) => ({ id: `e-${s.id}`, nombre: s.nombre_archivo, tipo: s.tipo, tam: s.tamano_bytes, url: urls[s.ruta], tag: 'Guardado' })),
      ...state.nuevos.map((n) => ({ id: `n-${n.key}`, nombre: n.file.name, tipo: n.file.type, tam: n.file.size, url: n.preview, tag: 'Nuevo' })),
    ];
    slot('soportes').innerHTML = items.map((it) => `
      <div class="vf-soporte">
        <div class="vf-soporte__thumb">${esImagen(it.tipo) && it.url ? `<img src="${esc(it.url)}" alt="">` : icon('file', 26)}</div>
        <div class="grow">
          <div class="text-sm fw-600" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(it.nombre)}</div>
          <div class="text-xs text-muted">${it.tag} · ${formatBytes(it.tam || 0)}</div>
        </div>
        <button type="button" class="icon-btn icon-btn--sm icon-btn--plain" data-action="del-soporte" data-id="${it.id}" aria-label="Quitar soporte">${icon('x', 15)}</button>
      </div>`).join('');
  }

  async function agregarArchivos(files) {
    for (const f of files) {
      try {
        const file = await prepararArchivo(f);
        state.nuevos.push({ key: ++seq, file, preview: esImagen(file.type) ? URL.createObjectURL(file) : null });
      } catch (err) {
        toastError(err);
      }
    }
    slot('soportes-error').textContent = '';
    paintSoportes();
  }

  form.querySelectorAll('[data-input]').forEach((input) => {
    input.addEventListener('change', () => {
      agregarArchivos([...input.files]);
      input.value = '';
    });
  });
  const drop = slot('drop');
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (e) => agregarArchivos([...e.dataTransfer.files]));

  // ---------- Acciones ----------
  on(form, 'click', '[data-action]', (e, btn) => {
    const action = btn.dataset.action;
    if (action === 'add-linea') {
      state.lineas.push(nuevaLinea());
      paintLineas();
      form.querySelector('.vf-linea:last-child select')?.focus();
    }
    if (action === 'del-linea') {
      const key = Number(btn.closest('.vf-linea').dataset.key);
      state.lineas = state.lineas.filter((l) => l.key !== key);
      paintLineas();
    }
    if (action === 'del-soporte') {
      const [tipo, id] = [btn.dataset.id.slice(0, 1), btn.dataset.id.slice(2)];
      if (tipo === 'e') state.quitar.add(id);
      else {
        const n = state.nuevos.find((x) => String(x.key) === id);
        if (n?.preview) URL.revokeObjectURL(n.preview);
        state.nuevos = state.nuevos.filter((x) => x !== n);
      }
      paintSoportes();
    }
  });

  // El error de un campo desaparece en cuanto el usuario lo corrige
  form.addEventListener('change', (e) => {
    const field = e.target.closest('.field.has-error');
    if (!field) return;
    field.classList.remove('has-error');
    field.querySelector('.field__error').textContent = '';
  });

  // ---------- Validación y guardado ----------
  function validar() {
    let ok = true;
    const setErr = (name, msg) => {
      const f = form.querySelector(`[data-field="${name}"]`);
      f.classList.toggle('has-error', Boolean(msg));
      f.querySelector('.field__error').textContent = msg || '';
      if (msg) ok = false;
    };
    const fecha = form.fecha.value;
    setErr('fecha', !fecha ? 'Indica la fecha.' : fecha > todayISO() ? 'La fecha no puede ser futura.' : '');
    setErr('recolectora', form.recolectora.value ? '' : 'Selecciona la recolectora.');

    let errLineas = '';
    form.querySelectorAll('.vf-linea').forEach((row) => {
      const l = state.lineas.find((x) => x.key === Number(row.dataset.key));
      const marcar = (campo, malo) => row.querySelector(`[data-linea="${campo}"]`).classList.toggle('is-invalid', malo);
      const disp = disponible(l.categoria_id);
      const kgMalo = !(Number(l.kg) > 0) || (disp !== null && Number(l.kg) > disp);
      marcar('categoria_id', !l.categoria_id);
      marcar('kg', kgMalo);
      marcar('precio_kg', l.precio_kg === '' || Number(l.precio_kg) < 0);
      if (!l.categoria_id || l.precio_kg === '' || Number(l.precio_kg) < 0) errLineas ||= 'Completa la categoría y el precio por kg de cada línea.';
      if (!(Number(l.kg) > 0)) errLineas ||= 'Los kilogramos deben ser mayores que cero.';
      else if (disp !== null && Number(l.kg) > disp) errLineas ||= 'Hay líneas con más kilogramos de los disponibles en inventario.';
    });
    slot('lineas-error').textContent = errLineas;
    if (errLineas) ok = false;

    const sinSoporte = totalSoportes() === 0;
    slot('soportes-error').textContent = sinSoporte ? 'Adjunta al menos un soporte del recibo.' : '';
    if (sinSoporte) ok = false;
    return ok;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validar()) {
      form.querySelector('.has-error .input, .is-invalid')?.focus();
      return;
    }
    const btn = form.querySelector('[type="submit"]');
    setLoading(btn, true, state.nuevos.length ? 'Subiendo soportes…' : 'Guardando…');
    try {
      const id = await guardarVenta({
        id: venta?.id || null,
        fecha: form.fecha.value,
        recolectoraId: form.recolectora.value,
        observaciones: form.observaciones.value.trim(),
        detalle: state.lineas.map((l) => ({ categoria_id: l.categoria_id, kg: Number(l.kg), precio_kg: Number(l.precio_kg) })),
        archivos: state.nuevos.map((n) => n.file),
      });
      // Soportes existentes que el usuario quitó (los nuevos ya quedaron guardados)
      for (const sid of state.quitar) {
        const s = state.existentes.find((x) => x.id === sid);
        await eliminarSoporte(s);
      }
      toast(venta ? 'Venta actualizada' : 'Venta registrada. Queda pendiente de validación.', 'success');
      m.close();
      onSaved?.(id);
    } catch (err) {
      toastError(err);
      setLoading(btn, false);
    }
  });

  paintLineas();
  paintSoportes();
}

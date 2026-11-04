// =========================================================
// M6 · Detalle de una venta (modal)  RF-34, RF-35
// Muestra datos, material, soportes (ver/descargar) y las acciones
// permitidas según el estado y el rol: editar, validar, anular.
// =========================================================
import { openModal } from '../../shared/components/modal.js';
import { confirmDialog } from '../../shared/components/confirm.js';
import { toast, toastError } from '../../shared/components/toast.js';
import { esc, on } from '../../shared/utils/dom.js';
import { icon } from '../../shared/icons.js';
import { loader, errorState } from '../../shared/components/ui.js';
import { formatMoney, formatKg, formatDate, formatDateTime, formatBytes, padConsecutivo } from '../../shared/utils/format.js';
import { obtenerVenta, validarVenta, anularVenta, urlsFirmadas, urlDescarga } from './ventas.service.js';
import { openVentaForm } from './venta-form.js';
import { esImagen } from './soportes.utils.js';
import { estadoBadge } from './ventas.ui.js';

export async function openVentaDetalle({ id, can, onChanged }) {
  const m = openModal({ title: 'Detalle de la venta', size: 'lg', content: `<div class="modal__body">${loader()}</div>` });

  let venta; let urls;
  try {
    venta = await obtenerVenta(id);
    urls = await urlsFirmadas(venta.venta_soportes.map((s) => s.ruta));
  } catch (err) {
    m.content.innerHTML = `<div class="modal__body">${errorState(err)}</div>`;
    return;
  }

  m.dialog.querySelector('.modal__title').textContent = `Venta ${padConsecutivo(venta.consecutivo)}`;
  const kgTotal = venta.venta_detalle.reduce((s, d) => s + Number(d.kg), 0);
  const puedeEditar = venta.estado === 'registrada' && can('ventas.registrar');
  const puedeValidar = venta.estado === 'registrada' && can('ventas.validar');
  const puedeAnular = venta.estado !== 'anulada' && can('ventas.anular');

  const dato = (label, valor) => `<div class="vd-dato"><span class="vd-dato__label">${label}</span><span class="vd-dato__valor">${valor}</span></div>`;

  m.content.innerHTML = `
    <div class="modal__body stack">
      ${venta.estado === 'anulada' ? `<div class="alert alert--danger">${icon('ban', 18)}<div><b>Venta anulada</b> por ${esc(venta.anulador?.nombre || '—')} el ${formatDateTime(venta.anulado_at)}.<br>Justificación: ${esc(venta.justificacion_anulacion)}</div></div>` : ''}
      ${venta.estado === 'validada' ? `<div class="alert alert--success">${icon('shield', 18)}<div>Validada por ${esc(venta.validador?.nombre || '—')} el ${formatDateTime(venta.validado_at)}. Los datos y soportes ya no se pueden editar.</div></div>` : ''}

      <div class="vd-grid">
        ${dato('Estado', estadoBadge(venta.estado))}
        ${dato('Fecha', formatDate(venta.fecha))}
        ${dato('Periodo', venta.periodo ? esc(`${venta.periodo.nombre} · ${venta.periodo.anio}`) : '<span class="text-muted">Sin periodo</span>')}
        ${dato('Recolectora', `${esc(venta.recolectora.razon_social)}<br><span class="text-xs text-muted">NIT ${esc(venta.recolectora.nit)}</span>`)}
        ${dato('Registrada por', `${esc(venta.creador?.nombre || '—')}<br><span class="text-xs text-muted">${formatDateTime(venta.created_at)}</span>`)}
        ${dato('Observaciones', esc(venta.observaciones || '—'))}
      </div>

      <section>
        <h3 class="vf-section__title" style="margin-bottom:8px">Material vendido</h3>
        <div class="table-wrap card card--flush"><table class="table">
          <thead><tr><th>Categoría</th><th class="is-right">Kg</th><th class="is-right">Precio/kg</th><th class="is-right">Subtotal</th></tr></thead>
          <tbody>
            ${venta.venta_detalle.map((d) => `<tr>
              <td><div class="row"><span class="swatch" style="background:${esc(d.categoria.color || '#999')}"></span>${esc(d.categoria.nombre)}</div></td>
              <td class="is-right mono">${formatKg(d.kg)}</td>
              <td class="is-right mono">${formatMoney(d.precio_kg)}</td>
              <td class="is-right mono fw-600">${formatMoney(d.subtotal)}</td></tr>`).join('')}
            <tr><td class="fw-700">Total</td><td class="is-right mono fw-700">${formatKg(kgTotal)}</td><td></td><td class="is-right mono fw-700" style="color:var(--c-primary);font-size:16px">${formatMoney(venta.total)}</td></tr>
          </tbody>
        </table></div>
      </section>

      <section>
        <h3 class="vf-section__title" style="margin-bottom:8px">Soportes (${venta.venta_soportes.length})</h3>
        <div class="vd-soportes">
          ${venta.venta_soportes.map((s) => {
            const url = urls[s.ruta];
            return `<article class="vd-soporte">
              <a class="vd-soporte__thumb" href="${esc(url || '#')}" target="_blank" rel="noopener" aria-label="Ver ${esc(s.nombre_archivo)}">
                ${esImagen(s.tipo) && url ? `<img src="${esc(url)}" alt="Soporte ${esc(s.nombre_archivo)}" loading="lazy">` : `<span class="vd-soporte__pdf">${icon('file', 34)}<b>PDF</b></span>`}
              </a>
              <div class="vd-soporte__info">
                <div class="text-sm fw-600 vd-soporte__name">${esc(s.nombre_archivo)}</div>
                <div class="text-xs text-muted">${formatBytes(s.tamano_bytes || 0)} · ${esc(s.autor?.nombre || '—')} · ${formatDate(s.created_at)}</div>
              </div>
              <div class="row" style="gap:6px">
                <a class="btn btn--outline btn--sm" href="${esc(url || '#')}" target="_blank" rel="noopener">${icon('eye', 14)}Ver</a>
                <a class="btn btn--outline btn--sm" href="${esc(url ? urlDescarga(url, s.nombre_archivo) : '#')}">${icon('download', 14)}Descargar</a>
              </div>
            </article>`;
          }).join('')}
        </div>
      </section>
    </div>
    <div class="modal__footer">
      ${puedeAnular ? `<button type="button" class="btn btn--ghost spacer" data-action="anular" style="color:var(--c-danger)">${icon('ban', 16)}Anular</button>` : '<span class="spacer"></span>'}
      ${puedeEditar ? `<button type="button" class="btn btn--outline" data-action="editar">${icon('edit', 16)}Editar</button>` : ''}
      ${puedeValidar ? `<button type="button" class="btn btn--primary" data-action="validar">${icon('shield', 16)}Validar venta</button>` : ''}
      ${!puedeEditar && !puedeValidar ? '<button type="button" class="btn btn--outline" data-close>Cerrar</button>' : ''}
    </div>`;

  on(m.content, 'click', '[data-action]', async (e, btn) => {
    const action = btn.dataset.action;
    try {
      if (action === 'editar') {
        m.close();
        openVentaForm({ venta, onSaved: () => { onChanged?.(); openVentaDetalle({ id, can, onChanged }); } });
      }
      if (action === 'validar') {
        const ok = await confirmDialog({
          title: '¿Validar esta venta?',
          message: 'Después de validarla, sus datos y soportes quedan bloqueados (solo se podrá anular con justificación).',
          confirmText: 'Validar',
        });
        if (!ok) return;
        await validarVenta(id);
        toast('Venta validada', 'success');
        m.close();
        onChanged?.();
      }
      if (action === 'anular') {
        const motivo = await confirmDialog({
          title: `Anular venta ${padConsecutivo(venta.consecutivo)}`,
          message: 'La venta y sus soportes se conservan como evidencia, pero dejan de contar en los totales.',
          confirmText: 'Anular venta', danger: true,
          input: { label: 'Justificación', minLength: 10, placeholder: 'Explica por qué se anula esta venta' },
        });
        if (!motivo) return;
        await anularVenta(id, motivo);
        toast('Venta anulada', 'success');
        m.close();
        onChanged?.();
      }
    } catch (err) {
      toastError(err);
    }
  });
}

// M6 · Pestaña "Repositorio de soportes" (RF-34)
// Galería de recibos con búsqueda por fecha, recolectora y periodo.
import { esc, on } from '../../shared/utils/dom.js';
import { icon } from '../../shared/icons.js';
import { formatDate, formatBytes, padConsecutivo } from '../../shared/utils/format.js';
import { loader, errorState, emptyState } from '../../shared/components/ui.js';
import { renderPagination } from '../../shared/components/table.js';
import { listarSoportes, urlsFirmadas, urlDescarga } from './ventas.service.js';
import { openVentaDetalle } from './venta-detalle.js';
import { estadoBadge, renderFiltros } from './ventas.ui.js';
import { esImagen } from './soportes.utils.js';

const PAGE_SIZE = 12;

export async function mountSoportes(container, { ctx, periodos, recolectoras, filtros }) {
  let page = 1;
  container.innerHTML = `
    <section class="card" style="margin-bottom:16px">
      <div class="card__head"><div>
        <h2 class="card__title">Repositorio de soportes</h2>
        <p class="card__subtitle">Recibos de venta listos para mostrar en visitas del Ministerio. Los soportes de ventas validadas no se pueden modificar.</p>
      </div></div>
      ${renderFiltros({ periodos, recolectoras, filtros })}
    </section>
    <div data-slot="grid">${loader()}</div>
    <div data-slot="paginacion" class="card card--flush" style="margin-top:16px" hidden></div>`;
  const slot = (n) => container.querySelector(`[data-slot="${n}"]`);

  async function cargar() {
    slot('grid').innerHTML = loader();
    try {
      const { rows, total } = await listarSoportes(filtros, { page, pageSize: PAGE_SIZE });
      const urls = await urlsFirmadas(rows.map((s) => s.ruta));
      if (!rows.length) {
        slot('grid').innerHTML = `<div class="card">${emptyState({ icon: 'image', title: 'No hay soportes', text: 'No se encontraron recibos con esos filtros.' })}</div>`;
        slot('paginacion').hidden = true;
        return;
      }
      slot('grid').innerHTML = `<div class="sp-grid">${rows.map((s) => {
        const url = urls[s.ruta];
        return `<article class="sp-card">
          <a class="sp-card__thumb" href="${esc(url || '#')}" target="_blank" rel="noopener" aria-label="Ver ${esc(s.nombre_archivo)}">
            ${esImagen(s.tipo) && url ? `<img src="${esc(url)}" alt="Recibo ${esc(s.nombre_archivo)}" loading="lazy">` : `<span class="vd-soporte__pdf">${icon('file', 38)}<b>PDF</b></span>`}
            <span class="sp-card__estado">${estadoBadge(s.venta.estado)}</span>
          </a>
          <div class="sp-card__body">
            <div class="row row--between">
              <button class="link-btn mono fw-700" data-ver="${s.venta.id}">Venta ${padConsecutivo(s.venta.consecutivo)}</button>
              <span class="text-xs text-muted">${formatDate(s.venta.fecha)}</span>
            </div>
            <div class="text-sm fw-600">${esc(s.venta.recolectora?.razon_social || '—')}</div>
            <div class="text-xs text-muted">${s.venta.periodo ? esc(`${s.venta.periodo.nombre} · ${s.venta.periodo.anio}`) : 'Sin periodo'} · ${formatBytes(s.tamano_bytes || 0)}</div>
            <div class="text-xs text-muted">Cargado por ${esc(s.autor?.nombre || '—')} · ${formatDate(s.created_at)}</div>
          </div>
          <div class="sp-card__actions">
            <a class="btn btn--outline btn--sm" href="${esc(url || '#')}" target="_blank" rel="noopener">${icon('eye', 14)}Ver</a>
            <a class="btn btn--dark btn--sm" href="${esc(url ? urlDescarga(url, s.nombre_archivo) : '#')}">${icon('download', 14)}Descargar</a>
          </div>
        </article>`;
      }).join('')}</div>`;
      slot('paginacion').hidden = false;
      slot('paginacion').innerHTML = renderPagination({ page, pageSize: PAGE_SIZE, total });
    } catch (err) {
      slot('grid').innerHTML = errorState(err);
    }
  }

  on(container, 'change', '[data-filtro]', (e, el) => { filtros[el.dataset.filtro] = el.value || ''; page = 1; cargar(); });
  on(container, 'click', '[data-action="limpiar"]', () => {
    Object.keys(filtros).forEach((k) => { filtros[k] = ''; });
    container.querySelectorAll('[data-filtro]').forEach((el) => { el.value = ''; });
    page = 1;
    cargar();
  });
  on(container, 'click', '[data-page]', (e, btn) => { page = Number(btn.dataset.page); cargar(); });
  on(container, 'click', '[data-ver]', (e, btn) => openVentaDetalle({ id: btn.dataset.ver, can: ctx.can, onChanged: cargar }));

  cargar();
}

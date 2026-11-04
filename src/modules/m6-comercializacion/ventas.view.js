// M6 · Pestaña "Ventas": indicadores, filtros y listado paginado.
import { esc, on } from '../../shared/utils/dom.js';
import { icon } from '../../shared/icons.js';
import { formatMoney, formatKg, formatDate, padConsecutivo } from '../../shared/utils/format.js';
import { statCard, loader, errorState } from '../../shared/components/ui.js';
import { renderTable, renderPagination } from '../../shared/components/table.js';
import { listarVentas, resumenVentas } from './ventas.service.js';
import { openVentaDetalle } from './venta-detalle.js';
import { estadoBadge, renderFiltros } from './ventas.ui.js';

const PAGE_SIZE = 10;

export async function mountVentas(container, { ctx, periodos, recolectoras, filtros }) {
  let page = 1;

  container.innerHTML = `
    <div class="stats-grid" data-slot="stats" style="margin-bottom:16px"></div>
    <section class="card card--flush">
      <div style="padding:16px 20px">${renderFiltros({ periodos, recolectoras, filtros, conEstado: true })}</div>
      <div data-slot="tabla">${loader()}</div>
      <div data-slot="paginacion"></div>
    </section>`;
  const slot = (n) => container.querySelector(`[data-slot="${n}"]`);

  async function cargarResumen() {
    slot('stats').innerHTML = ['wallet', 'scale', 'receipt', 'clock'].map((i) => statCard({ icon: i, value: '…', label: 'Cargando' })).join('');
    try {
      const r = await resumenVentas(filtros);
      slot('stats').innerHTML = [
        statCard({ icon: 'wallet', value: formatMoney(r.ingresos), label: 'Ingresos por ventas', accent: true }),
        statCard({ icon: 'scale', value: formatKg(r.kg), label: 'Material vendido' }),
        statCard({ icon: 'receipt', value: r.ventas, label: 'Ventas registradas (sin anuladas)' }),
        statCard({ icon: 'clock', value: r.pendientes, label: 'Ventas por validar',
          chip: r.pendientes ? '<span class="chip chip--danger">Pendiente</span>' : '' }),
      ].join('');
    } catch (err) {
      slot('stats').innerHTML = '';
    }
  }

  async function cargarTabla() {
    slot('tabla').innerHTML = loader();
    try {
      const { rows, total } = await listarVentas(filtros, { page, pageSize: PAGE_SIZE });
      slot('tabla').innerHTML = renderTable({
        rows,
        rowClass: (v) => (v.estado === 'anulada' ? 'is-muted' : ''),
        empty: { icon: 'receipt', title: 'No hay ventas', text: 'Ajusta los filtros o registra una nueva venta.' },
        columns: [
          { label: 'N°', render: (v) => `<button class="link-btn mono fw-700" data-ver="${v.id}">${padConsecutivo(v.consecutivo)}</button>` },
          { label: 'Fecha', render: (v) => `<span class="nowrap">${formatDate(v.fecha)}</span>` },
          { label: 'Recolectora', render: (v) => `<div class="cell-main">${esc(v.recolectora?.razon_social)}</div><div class="cell-sub">${v.periodo ? esc(`${v.periodo.nombre} · ${v.periodo.anio}`) : 'Sin periodo'}</div>` },
          { label: 'Kg', align: 'right', render: (v) => `<span class="mono">${formatKg(v.kg)}</span>` },
          { label: 'Total', align: 'right', render: (v) => `<span class="mono fw-700">${formatMoney(v.total)}</span>` },
          { label: 'Soportes', align: 'center', render: (v) => `<span class="row text-muted" style="justify-content:center;gap:4px">${icon('image', 15)}${v.soportes}</span>` },
          { label: 'Estado', render: (v) => estadoBadge(v.estado) },
          { label: '', className: 'col-actions', render: (v) => `<button class="btn btn--outline btn--sm" data-ver="${v.id}">${icon('eye', 14)}Ver</button>` },
        ],
      });
      slot('paginacion').innerHTML = rows.length ? renderPagination({ page, pageSize: PAGE_SIZE, total }) : '';
    } catch (err) {
      slot('tabla').innerHTML = errorState(err);
      slot('paginacion').innerHTML = '';
    }
  }

  const recargar = () => { cargarResumen(); cargarTabla(); };

  on(container, 'change', '[data-filtro]', (e, el) => {
    filtros[el.dataset.filtro] = el.value || '';
    page = 1;
    recargar();
  });
  on(container, 'click', '[data-action="limpiar"]', () => {
    Object.keys(filtros).forEach((k) => { filtros[k] = ''; });
    container.querySelectorAll('[data-filtro]').forEach((el) => { el.value = ''; });
    page = 1;
    recargar();
  });
  on(container, 'click', '[data-page]', (e, btn) => { page = Number(btn.dataset.page); cargarTabla(); });
  on(container, 'click', '[data-ver]', (e, btn) => openVentaDetalle({ id: btn.dataset.ver, can: ctx.can, onChanged: recargar }));

  recargar();
  return { recargar };
}

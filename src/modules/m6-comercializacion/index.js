// =========================================================
// M6 · COMERCIALIZACIÓN Y SOPORTES — punto de entrada
// Rutas: #/ventas  (listado)   #/ventas/soportes  (repositorio)
// =========================================================
import { loadStyles } from '../../shared/utils/dom.js';
import { icon } from '../../shared/icons.js';
import { pageHeader, renderTabs, errorState } from '../../shared/components/ui.js';
import { getPeriodos, getRecolectoras } from '../m2-catalogos/catalogos.api.js';
import { mountVentas } from './ventas.view.js';
import { mountSoportes } from './soportes.view.js';
import { openVentaForm } from './venta-form.js';

loadStyles(new URL('./styles.css', import.meta.url));

const TABS = [
  { id: 'listado', label: 'Ventas', icon: 'receipt' },
  { id: 'soportes', label: 'Repositorio de soportes', icon: 'folder' },
];

export default {
  async mount(container, ctx) {
    const tab = ctx.route.sub === 'soportes' && ctx.can('soportes.ver') ? 'soportes' : 'listado';
    const canRegistrar = ctx.can('ventas.registrar');

    container.innerHTML = `
      ${pageHeader({
        code: 'M6 · Comercialización y soportes',
        title: 'Ventas de material',
        subtitle: 'Ventas a recolectoras con recibos verificables para las visitas del Ministerio.',
        actions: canRegistrar ? `<button class="btn btn--primary" data-action="nueva">${icon('plus', 16)}Registrar venta</button>` : '',
      })}
      <div style="margin-bottom:16px">${renderTabs(TABS, tab, 'ventas')}</div>
      <div data-slot="vista"></div>`;
    const slot = container.querySelector('[data-slot="vista"]');

    let periodos; let recolectoras;
    try {
      [periodos, recolectoras] = await Promise.all([getPeriodos(), getRecolectoras({ soloActivos: false })]);
    } catch (err) {
      slot.innerHTML = errorState(err);
      return;
    }
    // Filtro por defecto: el periodo actual (si existe)
    const filtros = { periodoId: periodos.find((p) => p.es_actual)?.id || '', recolectoraId: '', estado: '', desde: '', hasta: '' };
    const opts = { ctx, periodos, recolectoras, filtros };

    let vista;
    if (tab === 'soportes') await mountSoportes(slot, opts);
    else vista = await mountVentas(slot, opts);

    container.querySelector('[data-action="nueva"]')?.addEventListener('click', () => {
      openVentaForm({
        onSaved: () => (vista ? vista.recargar() : ctx.navigate('ventas')),
      });
    });
  },
};

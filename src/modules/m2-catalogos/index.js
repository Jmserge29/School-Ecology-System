// =========================================================
// M2 · CATÁLOGOS Y CONFIGURACIÓN — punto de entrada
// Rutas: #/catalogos/<tab>  (categorias, destinos, salones, puntos,
//        periodos, recolectoras, parametros)
// =========================================================
import { pageHeader, renderTabs } from '../../shared/components/ui.js';
import { createCrudView } from '../../shared/components/crud-view.js';
import { CATALOGOS } from './catalogos.config.js';
import { mountParametros } from './parametros.view.js';

const TABS = [
  { id: 'categorias', label: 'Categorías', icon: 'tag' },
  { id: 'destinos', label: 'Destinos', icon: 'recycle' },
  { id: 'salones', label: 'Salones', icon: 'school' },
  { id: 'puntos', label: 'Puntos', icon: 'map-pin' },
  { id: 'periodos', label: 'Periodos', icon: 'calendar' },
  { id: 'recolectoras', label: 'Recolectoras', icon: 'truck' },
  { id: 'parametros', label: 'Parámetros', icon: 'sliders' },
];

export default {
  async mount(container, ctx) {
    const tab = TABS.some((t) => t.id === ctx.route.sub) ? ctx.route.sub : 'categorias';
    const canEdit = ctx.can('catalogos.gestionar');

    container.innerHTML = `
      ${pageHeader({
        code: 'M2 · Catálogos y configuración',
        title: 'Catálogos',
        subtitle: 'Parametriza el sistema sin tocar código: categorías, destinos, salones, puntos, periodos y recolectoras.',
      })}
      <div style="margin-bottom:16px">${renderTabs(TABS, tab, 'catalogos')}</div>
      <div data-slot="vista"></div>`;

    const slot = container.querySelector('[data-slot="vista"]');
    if (tab === 'parametros') {
      await mountParametros(slot, { canEdit });
    } else {
      await createCrudView({ ...CATALOGOS[tab], canEdit }).mount(slot);
    }
  },
};

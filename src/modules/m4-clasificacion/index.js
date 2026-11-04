// =========================================================
// M4 · CLASIFICACIÓN Y APROVECHAMIENTO — punto de entrada
// Responsable: POR ASIGNAR
// Estado: PLANTILLA. Reemplaza renderModulePlaceholder() por tu vista.
// Guía: lee README.md de esta carpeta y src/modules/_plantilla.
// =========================================================
import { renderModulePlaceholder } from '../../shared/components/placeholder.js';

export default {
  async mount(container, ctx) {
    renderModulePlaceholder(container, {
      code: 'M4',
      title: 'Clasificación y aprovechamiento',
      description: 'Asignar destino a lo recolectado: reciclaje, compostaje u otros, y controlar el inventario en bodega.',
      owner: 'Por asignar',
      folder: 'src/modules/m4-clasificacion',
      tablas: ['lotes_almacenamiento', 'movimientos_aprovechamiento', 'v_inventario_categoria (vista)'],
      requisitos: [
        { id: 'RF-19', texto: 'Asignar a lo recolectado un destino de aprovechamiento con cantidad y fecha.' },
        { id: 'RF-20', texto: 'Agrupar material por categoría en lotes de almacenamiento.' },
        { id: 'RF-21', texto: 'Calcular el inventario disponible por categoría (recolectado − vendido − compostado).' },
        { id: 'RF-22', texto: 'Consultar el historial de movimientos de aprovechamiento.' },
      ],
    });
  },
};

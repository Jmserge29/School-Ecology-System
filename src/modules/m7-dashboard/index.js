// =========================================================
// M7 · DASHBOARD DE INDICADORES — punto de entrada
// Responsable: POR ASIGNAR
// Estado: PLANTILLA. Reemplaza renderModulePlaceholder() por tu vista.
// Guía: lee README.md de esta carpeta y src/modules/_plantilla.
// =========================================================
import { renderModulePlaceholder } from '../../shared/components/placeholder.js';

export default {
  async mount(container, ctx) {
    renderModulePlaceholder(container, {
      code: 'M7',
      title: 'Dashboard de indicadores',
      description: 'Cards, gráficos y ranking de salones por periodo para responder de un vistazo las preguntas del colegio.',
      owner: 'Por asignar',
      folder: 'src/modules/m7-dashboard',
      tablas: ['v_ventas_resumen (ya existe)', 'v_kg_vendidos_categoria (ya existe)'],
      requisitos: [
        { id: 'RF-37', texto: 'Cards: total reciclado, kg por categoría, salón líder, registros, kg compostados e ingresos.' },
        { id: 'RF-38', texto: 'Gráfico de distribución de residuos por categoría.' },
        { id: 'RF-39', texto: 'Ranking de salones por kg reciclados en el periodo.' },
        { id: 'RF-40', texto: 'Evolución de kg recolectados por mes o periodo.' },
        { id: 'RF-41', texto: 'Distribución por destino de aprovechamiento y resumen del huerto.' },
        { id: 'RF-42', texto: 'Filtrar por periodo y comparar con el periodo anterior.' },
      ],
    });
  },
};

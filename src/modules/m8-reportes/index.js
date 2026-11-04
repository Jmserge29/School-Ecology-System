// =========================================================
// M8 · CONSULTAS Y REPORTES — punto de entrada
// Responsable: POR ASIGNAR
// Estado: PLANTILLA. Reemplaza renderModulePlaceholder() por tu vista.
// Guía: lee README.md de esta carpeta y src/modules/_plantilla.
// =========================================================
import { renderModulePlaceholder } from '../../shared/components/placeholder.js';

export default {
  async mount(container, ctx) {
    renderModulePlaceholder(container, {
      code: 'M8',
      title: 'Consultas y reportes',
      description: 'Consultas filtradas, reportes predefinidos, exportación a PDF/Excel y consolidado para el Ministerio.',
      owner: 'Por asignar',
      folder: 'src/modules/m8-reportes',
      tablas: ['v_ventas_resumen (ya existe)', 'venta_soportes (ya existe)'],
      requisitos: [
        { id: 'RF-43', texto: 'Consultar registros por rango de fechas, categoría, salón, punto y destino.' },
        { id: 'RF-44', texto: 'Generar reportes de recolección por periodo y por salón.' },
        { id: 'RF-45', texto: 'Exportar consultas y reportes a PDF y Excel.' },
        { id: 'RF-46', texto: 'Generar el consolidado para el Ministerio: recolección, ventas y soportes del periodo.' },
      ],
    });
  },
};

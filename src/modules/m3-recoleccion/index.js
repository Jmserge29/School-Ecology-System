// =========================================================
// M3 · REGISTRO DE RECOLECCIÓN — punto de entrada
// Responsable: POR ASIGNAR
// Estado: PLANTILLA. Reemplaza renderModulePlaceholder() por tu vista.
// Guía: lee README.md de esta carpeta y src/modules/_plantilla.
// =========================================================
import { renderModulePlaceholder } from '../../shared/components/placeholder.js';

export default {
  async mount(container, ctx) {
    renderModulePlaceholder(container, {
      code: 'M3',
      title: 'Registro de recolección',
      description: 'Registrar cuánto recicla cada salón, de qué tipo, cuándo y dónde.',
      owner: 'Por asignar',
      folder: 'src/modules/m3-recoleccion',
      tablas: ['recolecciones', 'recoleccion_detalle'],
      requisitos: [
        { id: 'RF-12', texto: 'Registrar una recolección con fecha, salón, punto, responsable y observaciones.' },
        { id: 'RF-13', texto: 'Agregar una o varias líneas de categoría con cantidad en kg.' },
        { id: 'RF-14', texto: 'Adjuntar una foto opcional como evidencia.' },
        { id: 'RF-15', texto: 'Validar o rechazar recolecciones registradas por estudiantes, con comentario.' },
        { id: 'RF-16', texto: 'Editar o anular una recolección guardando quién y cuándo lo hizo.' },
        { id: 'RF-17', texto: 'Listar recolecciones con búsqueda y paginación.' },
        { id: 'RF-18', texto: 'Impedir cantidades negativas o en cero y fechas futuras.' },
      ],
    });
  },
};

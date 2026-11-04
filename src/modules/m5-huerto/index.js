// =========================================================
// M5 · COMPOSTAJE Y HUERTO — punto de entrada
// Responsable: POR ASIGNAR
// Estado: PLANTILLA. Reemplaza renderModulePlaceholder() por tu vista.
// Guía: lee README.md de esta carpeta y src/modules/_plantilla.
// =========================================================
import { renderModulePlaceholder } from '../../shared/components/placeholder.js';

export default {
  async mount(container, ctx) {
    renderModulePlaceholder(container, {
      code: 'M5',
      title: 'Compostaje y huerto',
      description: 'Cultivos del huerto y bitácora diaria de calidad del compost, preparada para sensores futuros.',
      owner: 'Por asignar',
      folder: 'src/modules/m5-huerto',
      tablas: ['camas_huerto', 'cultivos', 'lotes_compost', 'bitacora_compost', 'aplicaciones_compost'],
      requisitos: [
        { id: 'RF-23', texto: 'Gestionar camas o parcelas del huerto.' },
        { id: 'RF-24', texto: 'Registrar cultivos con tipo, especie, cama, fecha de siembra y cosecha estimada.' },
        { id: 'RF-25', texto: 'Actualizar el estado del cultivo y registrar la cosecha real.' },
        { id: 'RF-26', texto: 'Crear lotes de compost y registrar los kg de residuo orgánico que ingresan.' },
        { id: 'RF-27', texto: 'Registrar la bitácora diaria: temperatura, humedad, pH, olor, color, plagas, volteo, calidad y foto.' },
        { id: 'RF-28', texto: 'Marcar el origen de cada lectura como manual o sensor.' },
        { id: 'RF-29', texto: 'Alertar cuando un valor salga del rango configurado (ver M2 → Parámetros).' },
        { id: 'RF-30', texto: 'Registrar la aplicación de compost maduro a una cama del huerto.' },
      ],
    });
  },
};

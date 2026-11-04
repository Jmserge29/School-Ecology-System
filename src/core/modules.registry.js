// =========================================================
// REGISTRO DE MÓDULOS
// Cada entrada crea una pestaña en la navegación y una ruta (#/<id>).
// - permiso: se valida con permissions.js para mostrar/ocultar el módulo.
// - load:    import dinámico; el archivo debe exportar por defecto { mount }.
// - owner:   responsable del módulo en el equipo (para orientarse).
// =========================================================
export const MODULES = [
  {
    id: 'inicio', code: '', label: 'Inicio', icon: 'home',
    permiso: null, owner: 'Equipo base',
    load: () => import('../modules/inicio/index.js'),
  },
  {
    id: 'usuarios', code: 'M1', label: 'Usuarios', icon: 'users',
    permiso: 'usuarios.ver', owner: 'José Serge',
    load: () => import('../modules/m1-seguridad/index.js'),
  },
  {
    id: 'catalogos', code: 'M2', label: 'Catálogos', icon: 'layers',
    permiso: 'catalogos.ver', owner: 'José Serge',
    load: () => import('../modules/m2-catalogos/index.js'),
  },
  {
    id: 'recoleccion', code: 'M3', label: 'Recolección', icon: 'package',
    permiso: 'recoleccion.ver', owner: 'Por asignar',
    load: () => import('../modules/m3-recoleccion/index.js'),
  },
  {
    id: 'clasificacion', code: 'M4', label: 'Clasificación', icon: 'recycle',
    permiso: 'clasificacion.ver', owner: 'Por asignar',
    load: () => import('../modules/m4-clasificacion/index.js'),
  },
  {
    id: 'huerto', code: 'M5', label: 'Huerto', icon: 'sprout',
    permiso: 'huerto.ver', owner: 'Por asignar',
    load: () => import('../modules/m5-huerto/index.js'),
  },
  {
    id: 'ventas', code: 'M6', label: 'Ventas', icon: 'receipt',
    permiso: 'ventas.ver', owner: 'José Serge',
    load: () => import('../modules/m6-comercializacion/index.js'),
  },
  {
    id: 'dashboard', code: 'M7', label: 'Dashboard', icon: 'chart',
    permiso: 'dashboard.ver', owner: 'Por asignar',
    load: () => import('../modules/m7-dashboard/index.js'),
  },
  {
    id: 'reportes', code: 'M8', label: 'Reportes', icon: 'file',
    permiso: 'reportes.ver', owner: 'Por asignar',
    load: () => import('../modules/m8-reportes/index.js'),
  },
];

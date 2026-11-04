// =========================================================
// ROLES Y PERMISOS (RF-05)
// Matriz central: qué rol puede hacer qué. Si tu módulo necesita un
// permiso nuevo, agrégalo aquí y úsalo con `ctx.can('permiso')`.
// IMPORTANTE: esto controla la interfaz. La seguridad real está en las
// políticas RLS de /database; mantén ambas coherentes.
// =========================================================
export const ROLES = {
  ADMIN: 'admin',
  DOCENTE: 'docente',
  ESTUDIANTE: 'estudiante',
  CONSULTA: 'consulta',
};

export const ROLE_LABELS = {
  admin: 'Administrador',
  docente: 'Docente',
  estudiante: 'Estudiante',
  consulta: 'Consulta / Auditor',
};

export const ROLE_TONES = {
  admin: 'dark',
  docente: 'primary',
  estudiante: 'info',
  consulta: 'warning',
};

const { ADMIN, DOCENTE, ESTUDIANTE, CONSULTA } = ROLES;
const TODOS = [ADMIN, DOCENTE, ESTUDIANTE, CONSULTA];

const PERMISOS = {
  // M1 · Seguridad y usuarios
  'usuarios.ver': [ADMIN],
  'usuarios.gestionar': [ADMIN],

  // M2 · Catálogos
  'catalogos.ver': [ADMIN],
  'catalogos.gestionar': [ADMIN],

  // M3 · Recolección
  'recoleccion.ver': TODOS,
  'recoleccion.registrar': [ADMIN, DOCENTE, ESTUDIANTE],
  'recoleccion.validar': [ADMIN, DOCENTE],
  'recoleccion.anular': [ADMIN, DOCENTE],

  // M4 · Clasificación y aprovechamiento
  'clasificacion.ver': [ADMIN, DOCENTE, CONSULTA],
  'clasificacion.gestionar': [ADMIN, DOCENTE],

  // M5 · Compostaje y huerto
  'huerto.ver': [ADMIN, DOCENTE, ESTUDIANTE, CONSULTA],
  'huerto.registrar': [ADMIN, DOCENTE, ESTUDIANTE],
  'huerto.gestionar': [ADMIN, DOCENTE],

  // M6 · Comercialización y soportes
  'ventas.ver': [ADMIN, DOCENTE, CONSULTA],
  'ventas.registrar': [ADMIN, DOCENTE],
  'ventas.validar': [ADMIN],
  'ventas.anular': [ADMIN],
  'soportes.ver': [ADMIN, DOCENTE, CONSULTA],

  // M7 · Dashboard
  'dashboard.ver': TODOS,

  // M8 · Reportes
  'reportes.ver': [ADMIN, DOCENTE, CONSULTA],
  'reportes.ministerio': [ADMIN, CONSULTA],
};

export function hasPermission(rol, permiso) {
  if (!permiso) return true;
  const roles = PERMISOS[permiso];
  if (!roles) {
    console.warn(`[permisos] El permiso "${permiso}" no existe en permissions.js`);
    return false;
  }
  return roles.includes(rol);
}

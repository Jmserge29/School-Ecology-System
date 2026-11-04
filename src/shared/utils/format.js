// Formatos para Colombia (es-CO): moneda, kilogramos y fechas.

const moneyFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const numberFmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const formatMoney = (v) => moneyFmt.format(Number(v || 0));
export const formatNumber = (v) => numberFmt.format(Number(v || 0));
export const formatKg = (v) => `${numberFmt.format(Number(v || 0))} kg`;

/** Convierte 'YYYY-MM-DD' en Date local (evita el desfase de un día por zona horaria). */
export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
}

export function formatDate(value, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
  const d = parseDate(value);
  return d ? d.toLocaleDateString('es-CO', opts) : '—';
}

export function formatDateTime(value) {
  const d = parseDate(value);
  return d ? d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

/** Fecha local de hoy en formato 'YYYY-MM-DD' (para inputs type=date). */
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export const padConsecutivo = (n) => `#${String(n ?? 0).padStart(5, '0')}`;

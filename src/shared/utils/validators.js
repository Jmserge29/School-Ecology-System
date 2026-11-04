// Validaciones reutilizables. Devuelven true/false.
import { todayISO } from './format.js';

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());

/** NIT colombiano: 6-15 dígitos con dígito de verificación opcional (900123456-7). */
export const isNit = (v) => /^\d{6,15}(-\d)?$/.test(String(v || '').replace(/[.\s]/g, ''));

export const isPhone = (v) => /^[+\d][\d\s-]{6,19}$/.test(String(v || '').trim());

export const isPositive = (v) => Number.isFinite(Number(v)) && Number(v) > 0;

export const isFutureDate = (iso) => Boolean(iso) && iso > todayISO();

export const minLength = (v, n) => String(v || '').trim().length >= n;

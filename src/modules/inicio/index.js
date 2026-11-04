// =========================================================
// INICIO — resumen de bienvenida según el rol del usuario.
// (El dashboard de indicadores completo es el módulo M7.)
// =========================================================
import { supabase, q } from '../../core/supabase.js';
import { MODULES } from '../../core/modules.registry.js';
import { esc, loadStyles } from '../../shared/utils/dom.js';
import { icon } from '../../shared/icons.js';
import { statCard, badge } from '../../shared/components/ui.js';
import { formatMoney, formatDate, greeting, MESES_CORTOS, padConsecutivo, parseDate } from '../../shared/utils/format.js';
import { getPeriodoActual } from '../m2-catalogos/catalogos.api.js';
import { estadoBadge } from '../m6-comercializacion/ventas.ui.js';

loadStyles(new URL('./styles.css', import.meta.url));

async function contar(tabla, filtro = (x) => x) {
  const { count, error } = await filtro(supabase.from(tabla).select('id', { count: 'exact', head: true }));
  if (error) throw error;
  return count || 0;
}

export default {
  async mount(container, ctx) {
    const { user, can } = ctx;
    const verVentas = can('ventas.ver');
    const anio = new Date().getFullYear();

    container.innerHTML = `
      <div class="home-hello">
        <h1>${greeting()}, ${esc(user.nombre.split(' ')[0])}!</h1>
        <p class="text-muted">Este es el resumen del proyecto ambiental del colegio.</p>
      </div>
      <div class="home-grid">
        <div class="home-main">
          <div class="stats-grid" data-slot="stats"></div>
          ${verVentas ? `<section class="card home-chart">
            <div class="card__head">
              <div><h2 class="card__title">Ventas de material</h2><p class="card__subtitle">Ingresos por mes · ${anio}</p></div>
              <a class="icon-btn" href="#/ventas" aria-label="Ir a ventas">${icon('arrow-up-right', 18)}</a>
            </div>
            <div class="home-chart__totals" data-slot="totales"></div>
            <div class="bars" data-slot="barras"></div>
          </section>` : ''}
          <section class="card" data-slot="lista"></section>
        </div>
        <aside class="home-side">
          <section class="card" data-slot="periodo"></section>
          ${verVentas ? '<section class="card" data-slot="gauge"></section>' : ''}
        </aside>
      </div>`;
    const slot = (n) => container.querySelector(`[data-slot="${n}"]`);

    const periodo = await getPeriodoActual().catch(() => null);
    paintPeriodo(slot('periodo'), periodo, can('catalogos.ver'));

    let ventas = [];
    if (verVentas) {
      ventas = await q(supabase.from('ventas')
        .select('id, consecutivo, fecha, total, estado, recolectora:recolectoras(razon_social)')
        .gte('fecha', `${anio}-01-01`).lte('fecha', `${anio}-12-31`)
        .order('fecha', { ascending: false }).order('consecutivo', { ascending: false })).catch(() => []);
      paintBarras(slot('barras'), slot('totales'), ventas);
      paintGauge(slot('gauge'), ventas);
    }

    // Tarjetas según el rol
    const vigentes = ventas.filter((v) => v.estado !== 'anulada');
    const enPeriodo = periodo
      ? vigentes.filter((v) => v.fecha >= periodo.fecha_inicio && v.fecha <= periodo.fecha_fin)
      : vigentes;
    const cards = [];
    if (verVentas) {
      cards.push(statCard({ icon: 'wallet', value: formatMoney(enPeriodo.reduce((s, v) => s + Number(v.total), 0)), label: periodo ? `Ingresos por ventas en ${periodo.nombre}` : 'Ingresos por ventas del año', accent: true }));
      cards.push(statCard({ icon: 'clock', value: ventas.filter((v) => v.estado === 'registrada').length, label: 'Ventas por validar' }));
    }
    try {
      if (can('usuarios.ver')) cards.push(statCard({ icon: 'users', value: await contar('perfiles', (x) => x.eq('activo', true)), label: 'Usuarios activos' }));
      cards.push(statCard({ icon: 'tag', value: await contar('categorias_residuo', (x) => x.eq('activo', true)), label: 'Categorías de residuo activas' }));
      if (cards.length < 4) cards.push(statCard({ icon: 'school', value: await contar('salones', (x) => x.eq('activo', true)), label: 'Salones participando' }));
      if (cards.length < 4) cards.push(statCard({ icon: 'map-pin', value: await contar('puntos_recoleccion', (x) => x.eq('activo', true)), label: 'Puntos de recolección' }));
    } catch { /* si una tabla aún no existe, se omite la tarjeta */ }
    slot('stats').innerHTML = cards.slice(0, 4).join('');

    // Lista inferior: últimas ventas, o accesos rápidos si el rol no ve ventas
    if (verVentas) {
      slot('lista').innerHTML = `
        <div class="card__head"><div><h2 class="card__title">Últimas ventas</h2></div>
          <a class="btn btn--ghost btn--sm" href="#/ventas">Ver todas ${icon('arrow-right', 14)}</a></div>
        ${ventas.length ? `<div class="home-list">${ventas.slice(0, 5).map((v) => `
          <a class="home-list__row" href="#/ventas">
            <span class="home-list__icon">${icon('truck', 18)}</span>
            <span class="fw-600 grow">${esc(v.recolectora?.razon_social || '—')}</span>
            <span class="text-muted mono home-list__hide">${padConsecutivo(v.consecutivo)}</span>
            <span class="mono fw-600">${formatMoney(v.total)}</span>
            <span class="home-list__hide">${estadoBadge(v.estado)}</span>
            <span class="text-muted text-sm nowrap">${formatDate(v.fecha, { day: '2-digit', month: 'short' })}</span>
          </a>`).join('')}</div>` : '<p class="text-muted">Aún no hay ventas este año.</p>'}`;
    } else {
      const accesos = MODULES.filter((m) => m.id !== 'inicio' && can(m.permiso));
      slot('lista').innerHTML = `
        <div class="card__head"><div><h2 class="card__title">Tus módulos</h2><p class="card__subtitle">Accesos rápidos según tu rol</p></div></div>
        <div class="home-shortcuts">${accesos.map((m) => `
          <a class="home-shortcut" href="#/${m.id}"><span class="home-list__icon">${icon(m.icon, 18)}</span>
          <span><span class="text-xs text-muted">${m.code}</span><br><b>${esc(m.label)}</b></span></a>`).join('')}
          <a class="home-shortcut" href="index.html"><span class="home-list__icon">${icon('book', 18)}</span>
          <span><span class="text-xs text-muted">Guía</span><br><b>Aprende a reciclar</b></span></a>
        </div>`;
    }
  },
};

function paintPeriodo(el, periodo, puedeEditar) {
  if (!periodo) {
    el.innerHTML = `<div class="card__head"><div><h2 class="card__title">Periodo académico</h2>
      <p class="card__subtitle">No hay periodo actual configurado</p></div></div>
      ${puedeEditar ? '<a class="btn btn--outline btn--block" href="#/catalogos/periodos">Configurar periodos</a>' : ''}`;
    return;
  }
  const ini = parseDate(periodo.fecha_inicio);
  const fin = parseDate(periodo.fecha_fin);
  const hoy = new Date();
  const pct = Math.round(Math.min(1, Math.max(0, (hoy - ini) / (fin - ini || 1))) * 100);
  const dias = Math.max(0, Math.ceil((fin - hoy) / 86400000));
  el.innerHTML = `
    <div class="card__head"><div><h2 class="card__title">Periodo ${esc(periodo.nombre)} · ${periodo.anio}</h2>
      <p class="card__subtitle">${pct >= 100 ? 'Finalizado' : 'En curso'}</p></div>
      ${puedeEditar ? `<a class="icon-btn" href="#/catalogos/periodos" aria-label="Ver periodos">${icon('arrow-up-right', 18)}</a>` : ''}</div>
    <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
    <div class="row row--between" style="margin-top:14px">
      <div><div class="fw-700">${dias} días restantes</div><div class="text-sm text-muted">${formatDate(periodo.fecha_inicio)} – ${formatDate(periodo.fecha_fin)}</div></div>
      <span class="badge badge--primary badge--plain">${pct}%</span>
    </div>`;
}

function paintBarras(barras, totales, ventas) {
  const porMes = Array(12).fill(0);
  ventas.filter((v) => v.estado !== 'anulada').forEach((v) => { porMes[parseDate(v.fecha).getMonth()] += Number(v.total); });
  const max = Math.max(...porMes, 1);
  const mesActual = new Date().getMonth();
  const anual = porMes.reduce((a, b) => a + b, 0);
  const validado = ventas.filter((v) => v.estado === 'validada').reduce((s, v) => s + Number(v.total), 0);

  totales.innerHTML = `
    <div><div class="text-sm text-muted">Total del año</div><div class="home-big">${formatMoney(anual)}</div></div>
    <div><div class="text-sm text-muted">Validado</div><div class="home-big">${formatMoney(validado)}</div></div>`;

  barras.innerHTML = porMes.map((v, i) => `
    <div class="bars__col ${i === mesActual ? 'is-current' : ''}">
      <div class="bars__track">
        <div class="bars__bar" style="height:${Math.max(4, (v / max) * 100)}%">
          <span class="bars__tip">${formatMoney(v)}</span>
        </div>
      </div>
      <span class="bars__label">${MESES_CORTOS[i]}</span>
    </div>`).join('');
}

/** Medidor semicircular segmentado (como "Success Rate" de la referencia). */
function paintGauge(el, ventas) {
  const vigentes = ventas.filter((v) => v.estado !== 'anulada');
  const validadas = vigentes.filter((v) => v.estado === 'validada').length;
  const pct = vigentes.length ? Math.round((validadas / vigentes.length) * 100) : 0;
  const SEG = 22;
  const llenos = Math.round((pct / 100) * SEG);
  const segs = Array.from({ length: SEG }, (_, i) => {
    const ang = Math.PI - (i / (SEG - 1)) * Math.PI;
    const [cx, cy, r1, r2] = [110, 104, 66, 92];
    const x1 = cx + r1 * Math.cos(ang); const y1 = cy - r1 * Math.sin(ang);
    const x2 = cx + r2 * Math.cos(ang); const y2 = cy - r2 * Math.sin(ang);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${i < llenos ? '#5a7a2b' : '#e4e7de'}" stroke-width="9" stroke-linecap="round"/>`;
  }).join('');

  el.innerHTML = `
    <div class="card__head"><div><h2 class="card__title">Ventas con soporte validado</h2>
      <p class="card__subtitle">Evidencia lista para el Ministerio · año actual</p></div></div>
    <div class="gauge">
      <svg viewBox="0 0 220 116" role="img" aria-label="${pct}% de ventas validadas">${segs}</svg>
      <div class="gauge__value"><b>${pct}%</b><span class="text-sm text-muted">validadas</span></div>
    </div>
    <div class="gauge__foot">
      <div><div class="text-sm text-muted">Validadas</div><div class="home-big">${validadas}</div></div>
      <div><div class="text-sm text-muted">Por validar</div><div class="home-big">${vigentes.length - validadas}</div></div>
    </div>
    ${vigentes.length - validadas > 0 ? `<p class="text-sm" style="margin-top:12px">${badge('Pendiente', 'warning')} Revisa y valida las ventas para que su soporte quede bloqueado.</p>` : ''}`;
}

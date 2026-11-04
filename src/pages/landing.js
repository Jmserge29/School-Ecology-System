// Lógica de la landing (index.html): íconos, menú móvil y el reto de clasificación.
import { icon, logoMark } from '../shared/icons.js';
import { esc } from '../shared/utils/dom.js';

// Íconos y logo declarados en el HTML con data-icon / data-logo.
// Un <span data-icon> vacío y sin clase se reemplaza por el SVG; en los demás se inserta dentro.
document.querySelectorAll('[data-icon]').forEach((el) => {
  const svg = icon(el.dataset.icon, 20);
  if (el.tagName === 'SPAN' && !el.className && !el.textContent.trim()) el.outerHTML = svg;
  else el.insertAdjacentHTML('afterbegin', svg);
});
document.querySelectorAll('[data-logo]').forEach((el) => {
  el.innerHTML = `${logoMark(38)}<span>EcoEscuela</span>`;
});
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

// Menú móvil
const toggle = document.querySelector('.lp-nav__toggle');
const menu = document.getElementById('lp-menu');
toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
});
menu.addEventListener('click', (e) => {
  if (e.target.closest('a')) { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
});

// ---------- Reto: ¿en qué caneca va? ----------
const CANECAS = { blanca: 'Blanca', negra: 'Negra', verde: 'Verde' };
const BANCO = [
  { item: 'Botella plástica vacía y enjuagada', ok: 'blanca', why: 'Es plástico limpio y seco: se puede reciclar.' },
  { item: 'Cáscara de banano', ok: 'verde', why: 'Es un residuo orgánico: alimenta el compost.' },
  { item: 'Servilleta usada', ok: 'negra', why: 'Está sucia y sus fibras ya no se pueden reciclar.' },
  { item: 'Caja de cartón aplanada', ok: 'blanca', why: 'Cartón limpio y seco: aprovechable. Aplanarla ahorra espacio.' },
  { item: 'Empaque metalizado de papas', ok: 'negra', why: 'Los empaques metalizados no son aprovechables en el código de colores.' },
  { item: 'Cáscaras de huevo', ok: 'verde', why: 'Son orgánicas; trituradas aportan calcio al compost.' },
  { item: 'Caja de pizza con grasa', ok: 'negra', why: 'El cartón contaminado con comida o grasa ya no se puede reciclar.' },
  { item: 'Lata de gaseosa vacía', ok: 'blanca', why: 'El metal es aprovechable y muy valioso para reciclar.' },
  { item: 'Hojas de cuaderno usadas', ok: 'blanca', why: 'El papel limpio y seco es aprovechable.' },
  { item: 'Restos de ensalada del almuerzo', ok: 'verde', why: 'Son restos vegetales: perfectos para compostar.' },
  { item: 'Papel higiénico', ok: 'negra', why: 'Es un residuo sanitario: no se recicla ni se composta.' },
  { item: 'Frasco de vidrio limpio', ok: 'blanca', why: 'El vidrio limpio es aprovechable y se recicla muchas veces.' },
];
const TOTAL = 8;

const card = document.querySelector('[data-quiz="card"]');
const score = document.querySelector('[data-quiz="score"]');
let preguntas; let idx; let resultados;

function barajar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pintarPuntaje() {
  score.innerHTML = Array.from({ length: TOTAL }, (_, i) => {
    const r = resultados[i];
    const cls = r === true ? 'is-ok' : r === false ? 'is-bad' : i === idx ? 'is-now' : '';
    return `<span class="lp-quiz__dot ${cls}"></span>`;
  }).join('');
}

function pintarPregunta() {
  const p = preguntas[idx];
  card.classList.remove('lp-quiz__end');
  card.innerHTML = `
    <span class="lp-quiz__count">Pregunta ${idx + 1} de ${TOTAL}</span>
    <div class="lp-quiz__item">${esc(p.item)}</div>
    <div class="lp-quiz__options">
      ${Object.entries(CANECAS).map(([k, label]) => `
        <button class="lp-quiz__opt" data-opt="${k}"><span class="lp-quiz__bin lp-quiz__bin--${k}"></span>${label}</button>`).join('')}
    </div>
    <div data-feedback></div>`;
  pintarPuntaje();
}

function responder(opcion) {
  const p = preguntas[idx];
  const acierto = opcion === p.ok;
  resultados[idx] = acierto;
  card.querySelectorAll('[data-opt]').forEach((b) => {
    b.disabled = true;
    if (b.dataset.opt === p.ok) b.classList.add('is-ok');
    else if (b.dataset.opt === opcion) b.classList.add('is-bad');
  });
  card.querySelector('[data-feedback]').innerHTML = `
    <div class="lp-quiz__feedback ${acierto ? 'is-ok' : 'is-bad'}">
      <b>${acierto ? '¡Correcto!' : `Va en la caneca ${CANECAS[p.ok].toLowerCase()}.`}</b> ${esc(p.why)}
    </div>
    <button class="btn btn--dark" data-next style="margin-top:12px">${idx + 1 < TOTAL ? 'Siguiente' : 'Ver resultado'}</button>`;
  card.querySelector('[data-next]').focus();
  pintarPuntaje();
}

function pintarFinal() {
  const aciertos = resultados.filter(Boolean).length;
  const msg = aciertos === TOTAL ? '¡Perfecto! Eres un monitor ambiental en potencia.'
    : aciertos >= TOTAL - 2 ? '¡Muy bien! Repasa las canecas y vas por el puntaje completo.'
      : 'Vas por buen camino. Revisa la sección "¿En qué caneca va?" y vuelve a intentarlo.';
  idx = TOTAL;
  pintarPuntaje();
  card.classList.add('lp-quiz__end');
  card.innerHTML = `
    <span class="lp-quiz__count">Resultado</span>
    <span class="lp-tile__big">${aciertos}/${TOTAL}</span>
    <p>${msg}</p>
    <button class="btn btn--primary" data-restart>Intentar de nuevo</button>`;
}

function iniciar() {
  preguntas = barajar(BANCO).slice(0, TOTAL);
  idx = 0;
  resultados = [];
  pintarPregunta();
}

card.addEventListener('click', (e) => {
  const opt = e.target.closest('[data-opt]');
  if (opt && !opt.disabled) responder(opt.dataset.opt);
  if (e.target.closest('[data-next]')) {
    idx += 1;
    if (idx < TOTAL) pintarPregunta(); else pintarFinal();
  }
  if (e.target.closest('[data-restart]')) iniciar();
});

iniciar();

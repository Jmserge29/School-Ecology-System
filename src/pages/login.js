// Lógica de login.html: iniciar sesión (RF-01) y recuperar contraseña (RF-02).
import { ENV } from '../config/env.js';
import { isConfigured } from '../core/supabase.js';
import { signIn, requestPasswordReset, getSession } from '../core/auth.js';
import { icon, logoMark } from '../shared/icons.js';
import { esc, setLoading } from '../shared/utils/dom.js';
import { isEmail } from '../shared/utils/validators.js';
import { showErrors } from '../shared/components/form.js';

document.getElementById('brand').innerHTML = `${logoMark(42)}<span class="brand__name">${esc(ENV.APP_NAME)}</span>`;
document.getElementById('tiles').innerHTML = ['leaf', 'recycle', 'sprout'].map((i) => `<div class="auth__tile">${icon(i, 48)}</div>`).join('');

const msgAlert = document.getElementById('msg-alert');
function showMessage(text, tone = 'info') {
  msgAlert.className = `alert ${tone === 'info' ? '' : `alert--${tone}`}`;
  msgAlert.textContent = text;
  msgAlert.hidden = !text;
}

const MENSAJES = {
  inactivo: ['Tu cuenta está desactivada o pendiente de activación. Contacta al administrador.', 'warning'],
  password: ['Tu contraseña se actualizó. Ya puedes ingresar.', 'success'],
};
const msg = new URLSearchParams(location.search).get('msg');
if (MENSAJES[msg]) showMessage(...MENSAJES[msg]);

if (!isConfigured) {
  document.getElementById('config-alert').hidden = false;
  document.querySelectorAll('form button[type="submit"]').forEach((b) => { b.disabled = true; });
} else {
  // Si ya hay sesión, entra directo
  getSession().then((s) => { if (s && !msg) location.href = 'app.html'; });
}

// Cambiar entre "login" y "recuperar"
document.querySelectorAll('[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    document.getElementById('view-login').hidden = view !== 'login';
    document.getElementById('view-recover').hidden = view !== 'recover';
    showMessage('');
    document.querySelector(view === 'login' ? '#email' : '#recover-email').focus();
  });
});

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const email = form.email.value.trim();
  const password = form.password.value;
  const errors = {};
  if (!isEmail(email)) errors.email = 'Escribe un correo válido.';
  if (!password) errors.password = 'Escribe tu contraseña.';
  if (!showErrors(form, errors)) return;

  const btn = form.querySelector('[type="submit"]');
  setLoading(btn, true, 'Ingresando…');
  try {
    await signIn(email, password);
    location.href = 'app.html';
  } catch (err) {
    showMessage(err.message, 'danger');
    setLoading(btn, false);
  }
});

document.getElementById('form-recover').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const email = form.email.value.trim();
  if (!showErrors(form, isEmail(email) ? {} : { email: 'Escribe un correo válido.' })) return;

  const btn = form.querySelector('[type="submit"]');
  setLoading(btn, true, 'Enviando…');
  try {
    await requestPasswordReset(email);
    // Mensaje neutro: no revela si el correo existe o no
    showMessage('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos.', 'success');
    form.reset();
  } catch (err) {
    showMessage(err.message, 'danger');
  } finally {
    setLoading(btn, false);
  }
});

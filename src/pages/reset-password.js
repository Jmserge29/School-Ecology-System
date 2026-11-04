// Lógica de reset-password.html (RF-02).
// Supabase redirige aquí con el token en la URL; el cliente lo detecta,
// crea una sesión temporal y dispara el evento PASSWORD_RECOVERY.
import { ENV } from '../config/env.js';
import { supabase, isConfigured } from '../core/supabase.js';
import { updatePassword } from '../core/auth.js';
import { logoMark } from '../shared/icons.js';
import { esc, setLoading } from '../shared/utils/dom.js';
import { showErrors } from '../shared/components/form.js';

document.getElementById('brand').innerHTML = `${logoMark(42)}<span class="brand__name">${esc(ENV.APP_NAME)}</span>`;

const waiting = document.getElementById('waiting');
const viewForm = document.getElementById('view-form');
const alertEl = document.getElementById('msg-alert');

function fail(text) {
  waiting.hidden = true;
  alertEl.className = 'alert alert--danger';
  alertEl.textContent = text;
  alertEl.hidden = false;
}

function ready() {
  waiting.hidden = true;
  viewForm.hidden = false;
  document.getElementById('password').focus();
}

if (!isConfigured) {
  fail('Supabase no está configurado (src/config/env.js).');
} else {
  const errorDesc = new URLSearchParams(location.hash.slice(1)).get('error_description');
  if (errorDesc) {
    fail('El enlace no es válido o ya expiró. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".');
  } else {
    let shown = false;
    supabase.auth.onAuthStateChange((event, session) => {
      if (!shown && session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        shown = true;
        ready();
      }
    });
    setTimeout(() => {
      if (!shown) fail('El enlace no es válido o ya expiró. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".');
    }, 6000);
  }
}

document.getElementById('form-reset').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const password = form.password.value;
  const errors = {};
  if (password.length < 8) errors.password = 'Debe tener al menos 8 caracteres.';
  if (form.confirmar.value !== password) errors.confirmar = 'Las contraseñas no coinciden.';
  if (!showErrors(form, errors)) return;

  const btn = form.querySelector('[type="submit"]');
  setLoading(btn, true);
  try {
    await updatePassword(password);
    await supabase.auth.signOut();
    location.href = 'login.html?msg=password';
  } catch (err) {
    fail(err.message);
    setLoading(btn, false);
  }
});

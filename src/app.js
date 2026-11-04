// =========================================================
// PUNTO DE ENTRADA DE LA APLICACIÓN (app.html)
// 1. Verifica la sesión   2. Dibuja el shell   3. Monta el módulo de la ruta
// =========================================================
import { requireAuth, can, currentProfile } from './core/auth.js';
import { MODULES } from './core/modules.registry.js';
import { startRouter, navigate } from './core/router.js';
import { renderShell } from './layout/shell.js';
import { ENV } from './config/env.js';
import { loader, errorState, emptyState } from './shared/components/ui.js';

async function main() {
  const perfil = await requireAuth();
  if (!perfil) return;

  // RF-05: solo se muestran los módulos permitidos para el rol
  const visibles = MODULES.filter((m) => can(m.permiso));
  const shell = renderShell(document.getElementById('app'), { perfil, modules: visibles });

  let cleanups = [];
  let renderId = 0;

  startRouter(async (route) => {
    const id = ++renderId;
    cleanups.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    cleanups = [];

    if (!route.path) return navigate('inicio');

    const entry = MODULES.find((m) => m.id === route.path);
    const outlet = shell.outlet;

    if (!entry || !visibles.includes(entry)) {
      shell.setActive('');
      outlet.innerHTML = `<div class="card">${emptyState({
        icon: entry ? 'lock' : 'search',
        title: entry ? 'No tienes acceso a este módulo' : 'Página no encontrada',
        text: entry ? 'Tu rol no tiene permiso para ver esta sección.' : 'Revisa la dirección o vuelve al inicio.',
        action: '<a class="btn btn--primary" href="#/inicio">Ir al inicio</a>',
      })}</div>`;
      return;
    }

    shell.setActive(entry.id);
    document.title = `${entry.label} · ${ENV.APP_NAME}`;
    outlet.innerHTML = loader();

    try {
      const mod = (await entry.load()).default;
      if (id !== renderId) return; // el usuario ya navegó a otra ruta
      // Cada montaje recibe un contenedor nuevo: así los eventos del módulo
      // anterior desaparecen con su elemento y no se acumulan.
      const view = document.createElement('div');
      view.className = 'view';
      outlet.replaceChildren(view);
      // Contexto que recibe cada módulo
      const ctx = {
        user: currentProfile(),
        can,
        route,
        navigate,
        onCleanup: (fn) => cleanups.push(fn),
      };
      await mod.mount(view, ctx);
    } catch (err) {
      console.error(err);
      if (id === renderId) outlet.innerHTML = errorState(err);
    }
  });
}

main();

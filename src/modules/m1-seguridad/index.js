// =========================================================
// M1 · SEGURIDAD Y USUARIOS — punto de entrada  (RF-03, RF-04, RF-05)
// Listado de usuarios con filtros, creación, edición, activación masiva
// y envío de enlace de recuperación de contraseña.
// =========================================================
import { esc, on, debounce, initials } from '../../shared/utils/dom.js';
import { icon } from '../../shared/icons.js';
import { formatDate } from '../../shared/utils/format.js';
import { pageHeader, statCard, badge, loader, errorState } from '../../shared/components/ui.js';
import { renderTable, renderPagination } from '../../shared/components/table.js';
import { confirmDialog } from '../../shared/components/confirm.js';
import { toast, toastError } from '../../shared/components/toast.js';
import { ROLE_LABELS, ROLE_TONES } from '../../core/permissions.js';
import { getSalones } from '../m2-catalogos/catalogos.api.js';
import { listarUsuarios, cambiarEstado, enviarRecuperacion } from './usuarios.service.js';
import { openUsuarioForm } from './usuario-form.js';

const PAGE_SIZE = 10;

export default {
  async mount(container, ctx) {
    const canManage = ctx.can('usuarios.gestionar');
    const state = { usuarios: [], salones: [], texto: '', rol: '', estado: '', salon: '', page: 1, seleccion: new Set() };

    container.innerHTML = `
      ${pageHeader({
        code: 'M1 · Seguridad y usuarios',
        title: 'Usuarios',
        subtitle: 'Gestiona quién entra al sistema, su rol y, para estudiantes, su salón.',
        actions: canManage ? `<button class="btn btn--primary" data-action="nuevo">${icon('user-plus', 16)}Nuevo usuario</button>` : '',
      })}
      <div class="stats-grid" data-slot="stats" style="margin-bottom:16px"></div>
      <section class="card card--flush">
        <div class="toolbar" style="padding:16px 20px">
          <div class="field field--search">
            <div class="input-icon">${icon('search', 16)}<input class="input input--sm" type="search" data-filter="texto" placeholder="Buscar por nombre o correo" aria-label="Buscar"></div>
          </div>
          <div class="field"><select class="input input--sm" data-filter="rol" aria-label="Rol">
            <option value="">Todos los roles</option>
            ${Object.entries(ROLE_LABELS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
          </select></div>
          <div class="field"><select class="input input--sm" data-filter="salon" aria-label="Salón"><option value="">Todos los salones</option></select></div>
          <div class="field"><select class="input input--sm" data-filter="estado" aria-label="Estado">
            <option value="">Todos los estados</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option>
          </select></div>
        </div>
        <div class="bulkbar" data-slot="bulk" hidden></div>
        <div data-slot="tabla">${loader()}</div>
        <div data-slot="paginacion"></div>
      </section>
      <style>
        .bulkbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:10px 20px; background: var(--c-lime-soft); border-top:1px solid #e1ebc2; border-bottom:1px solid #e1ebc2; }
      </style>`;

    const $slot = (n) => container.querySelector(`[data-slot="${n}"]`);

    function filtrados() {
      const t = state.texto.toLowerCase();
      return state.usuarios.filter((u) =>
        (!t || u.nombre.toLowerCase().includes(t) || u.correo.toLowerCase().includes(t)) &&
        (!state.rol || u.rol === state.rol) &&
        (!state.salon || u.salon_id === state.salon) &&
        (!state.estado || (state.estado === 'activo') === u.activo));
    }

    function paintStats() {
      const u = state.usuarios;
      const activos = u.filter((x) => x.activo);
      const count = (rol) => activos.filter((x) => x.rol === rol).length;
      $slot('stats').innerHTML = [
        statCard({ icon: 'users', value: activos.length, label: `Usuarios activos de ${u.length} registrados`, accent: true }),
        statCard({ icon: 'school', value: count('estudiante'), label: 'Estudiantes monitores activos' }),
        statCard({ icon: 'book', value: count('docente'), label: 'Docentes y coordinadores' }),
        statCard({ icon: 'shield', value: count('admin') + count('consulta'), label: 'Administradores y auditores' }),
      ].join('');
    }

    function paintTable() {
      const lista = filtrados();
      const pages = Math.max(1, Math.ceil(lista.length / PAGE_SIZE));
      state.page = Math.min(state.page, pages);
      const pagina = lista.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
      const todosMarcados = pagina.length > 0 && pagina.every((u) => state.seleccion.has(u.id));

      const columns = [
        ...(canManage ? [{
          label: `<input type="checkbox" class="checkbox" data-check-all ${todosMarcados ? 'checked' : ''} aria-label="Seleccionar página">`,
          className: 'col-check',
          render: (u) => (u.id === ctx.user.id ? '' : `<input type="checkbox" class="checkbox" data-check="${u.id}" ${state.seleccion.has(u.id) ? 'checked' : ''} aria-label="Seleccionar ${esc(u.nombre)}">`),
        }] : []),
        {
          label: 'Usuario',
          render: (u) => `<div class="cell-user"><span class="avatar avatar--sm">${esc(initials(u.nombre))}</span>
            <div><div class="cell-main">${esc(u.nombre)}${u.id === ctx.user.id ? ' <span class="text-xs text-muted">(tú)</span>' : ''}</div>
            <div class="cell-sub">${esc(u.correo)}</div></div></div>`,
        },
        { label: 'Rol', render: (u) => badge(ROLE_LABELS[u.rol], ROLE_TONES[u.rol], true) },
        { label: 'Salón', render: (u) => (u.salon ? esc(u.salon.nombre) : '<span class="text-muted">—</span>') },
        { label: 'Estado', render: (u) => (u.activo ? badge('Activo', 'success') : badge('Inactivo')) },
        { label: 'Actualizado', render: (u) => `<span class="text-sm text-muted nowrap">${formatDate(u.updated_at)}</span>` },
        ...(canManage ? [{
          label: '', className: 'col-actions',
          render: (u) => `<div class="row" style="gap:2px;justify-content:flex-end">
            <button class="icon-btn icon-btn--sm icon-btn--plain" data-action="editar" data-id="${u.id}" title="Editar" aria-label="Editar">${icon('edit', 15)}</button>
            <button class="icon-btn icon-btn--sm icon-btn--plain" data-action="reset" data-id="${u.id}" title="Enviar enlace para restablecer contraseña" aria-label="Enviar enlace de contraseña">${icon('mail', 15)}</button>
            ${u.id !== ctx.user.id ? `<button class="icon-btn icon-btn--sm icon-btn--plain" data-action="toggle" data-id="${u.id}" title="${u.activo ? 'Desactivar' : 'Activar'}" aria-label="${u.activo ? 'Desactivar' : 'Activar'}">${icon('power', 15)}</button>` : ''}
          </div>`,
        }] : []),
      ];

      $slot('tabla').innerHTML = renderTable({
        columns, rows: pagina,
        rowClass: (u) => (u.activo ? '' : 'is-muted'),
        empty: state.usuarios.length ? {} : { icon: 'users', title: 'Aún no hay usuarios', text: 'Crea el primero con "Nuevo usuario".' },
      });
      $slot('paginacion').innerHTML = renderPagination({ page: state.page, pageSize: PAGE_SIZE, total: lista.length });
      paintBulk();
    }

    function paintBulk() {
      const n = state.seleccion.size;
      const bar = $slot('bulk');
      bar.hidden = n === 0;
      bar.innerHTML = n ? `<span class="fw-600">${n} seleccionado${n === 1 ? '' : 's'}</span>
        <button class="btn btn--outline btn--sm" data-action="bulk-on">${icon('check', 14)}Activar</button>
        <button class="btn btn--outline btn--sm" data-action="bulk-off">${icon('ban', 14)}Desactivar</button>
        <button class="btn btn--ghost btn--sm" data-action="bulk-clear">Limpiar selección</button>` : '';
    }

    async function cargar() {
      try {
        [state.usuarios, state.salones] = await Promise.all([listarUsuarios(), getSalones()]);
        const salonSel = container.querySelector('[data-filter="salon"]');
        salonSel.innerHTML = `<option value="">Todos los salones</option>${state.salones.map((s) => `<option value="${s.id}" ${s.id === state.salon ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}`;
        paintStats();
        paintTable();
      } catch (err) {
        $slot('tabla').innerHTML = errorState(err);
      }
    }

    async function setEstado(ids, activo) {
      if (!activo) {
        const ok = await confirmDialog({
          title: ids.length > 1 ? `¿Desactivar ${ids.length} usuarios?` : '¿Desactivar usuario?',
          message: 'No podrán ingresar al sistema. Sus registros se conservan y puedes reactivarlos cuando quieras.',
          confirmText: 'Desactivar', danger: true,
        });
        if (!ok) return;
      }
      try {
        await cambiarEstado(ids, activo);
        toast(activo ? 'Usuarios activados' : 'Usuarios desactivados', 'success');
        state.seleccion.clear();
        await cargar();
      } catch (err) {
        toastError(err);
      }
    }

    // ---- Eventos ----
    const onFilter = (e) => {
      state[e.target.dataset.filter] = e.target.value.trim();
      state.page = 1;
      paintTable();
    };
    container.querySelector('[data-filter="texto"]').addEventListener('input', debounce(onFilter, 200));
    container.querySelectorAll('select[data-filter]').forEach((s) => s.addEventListener('change', onFilter));

    on(container, 'click', '[data-page]', (e, btn) => { state.page = Number(btn.dataset.page); paintTable(); });

    on(container, 'change', '[data-check]', (e, el) => {
      if (el.checked) state.seleccion.add(el.dataset.check); else state.seleccion.delete(el.dataset.check);
      paintTable();
    });
    on(container, 'change', '[data-check-all]', (e, el) => {
      const pagina = filtrados().slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE).filter((u) => u.id !== ctx.user.id);
      pagina.forEach((u) => (el.checked ? state.seleccion.add(u.id) : state.seleccion.delete(u.id)));
      paintTable();
    });

    on(container, 'click', '[data-action]', async (e, btn) => {
      const u = state.usuarios.find((x) => x.id === btn.dataset.id);
      switch (btn.dataset.action) {
        case 'nuevo':
          openUsuarioForm({ salones: state.salones, currentUserId: ctx.user.id, onSaved: cargar });
          break;
        case 'editar':
          openUsuarioForm({ usuario: u, salones: state.salones, currentUserId: ctx.user.id, onSaved: cargar });
          break;
        case 'toggle':
          setEstado([u.id], !u.activo);
          break;
        case 'reset': {
          const ok = await confirmDialog({
            title: 'Enviar enlace de recuperación',
            message: `Se enviará un correo a ${u.correo} con un enlace para crear una nueva contraseña.`,
            confirmText: 'Enviar',
          });
          if (!ok) return;
          try {
            await enviarRecuperacion(u.correo);
            toast('Enlace enviado', 'success');
          } catch (err) { toastError(err); }
          break;
        }
        case 'bulk-on': setEstado([...state.seleccion], true); break;
        case 'bulk-off': setEstado([...state.seleccion], false); break;
        case 'bulk-clear': state.seleccion.clear(); paintTable(); break;
        default:
      }
    });

    await cargar();
  },
};

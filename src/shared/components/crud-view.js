// =========================================================
// VISTA CRUD GENÉRICA
// Construye listado + búsqueda + crear/editar + activar/inactivar para
// cualquier tabla simple de Supabase a partir de una configuración.
// La usa M2 (catálogos); otros módulos pueden reutilizarla.
//
//   const vista = createCrudView({
//     table: 'puntos_recoleccion', title: 'Puntos', singular: 'punto',
//     columns: [...], fields: [...], searchKeys: ['nombre'], canEdit: true,
//   });
//   await vista.mount(container);
//
// Opciones:
//   select       columnas/relaciones para el select (por defecto '*')
//   order        [{ column, ascending }]
//   fields       arreglo o función (opciones) => arreglo
//   loadOptions  async () => objeto de opciones para los selects
//   toggleField  columna booleana para activar/inactivar (null para ocultar)
//   validate     (values, row) => { campo: 'error' } | null
//   beforeSave   (values, row) => values   (transformar antes de guardar)
//   sort         (rows) => rows            (orden personalizado en el cliente)
//   rowActions   [{ id, label, icon, show(row), handler: async (row, reload) }]
// =========================================================
import { supabase, q } from '../../core/supabase.js';
import { esc, on, debounce, setLoading } from '../utils/dom.js';
import { icon } from '../icons.js';
import { loader, badge, errorState } from './ui.js';
import { renderTable } from './table.js';
import { openModal } from './modal.js';
import { confirmDialog } from './confirm.js';
import { toast, toastError } from './toast.js';
import { renderFields, readForm, validateFields, showErrors } from './form.js';

export function createCrudView(config) {
  const {
    table, select = '*', order = [{ column: 'created_at', ascending: false }],
    title, description = '', singular = 'registro', columns, searchKeys = [],
    toggleField = 'activo', canEdit = false, rowActions = [],
  } = config;

  let rows = [];
  let filtro = '';
  let estado = 'todos';
  let root;

  async function fetchRows() {
    let query = supabase.from(table).select(select);
    for (const o of order) query = query.order(o.column, { ascending: o.ascending ?? true });
    const data = await q(query);
    return config.sort ? config.sort(data) : data;
  }

  function filtered() {
    const term = filtro.toLowerCase();
    return rows.filter((r) => {
      if (toggleField && estado !== 'todos' && Boolean(r[toggleField]) !== (estado === 'activos')) return false;
      if (!term) return true;
      return searchKeys.some((k) => String(k.split('.').reduce((o, p) => o?.[p], r) ?? '').toLowerCase().includes(term));
    });
  }

  function paint() {
    const cols = [...columns];
    if (toggleField) {
      cols.push({
        label: 'Estado',
        render: (r) => (r[toggleField] ? badge('Activo', 'success') : badge('Inactivo', 'neutral')),
      });
    }
    if (canEdit || rowActions.length) {
      cols.push({
        label: '', className: 'col-actions',
        render: (r) => `<div class="row" style="justify-content:flex-end;gap:4px">
          ${rowActions.filter((a) => !a.show || a.show(r)).map((a) => `<button class="btn btn--outline btn--sm" data-action="custom" data-custom="${a.id}" data-id="${r.id}">${a.icon ? icon(a.icon, 14) : ''}${esc(a.label)}</button>`).join('')}
          ${canEdit ? `<button class="icon-btn icon-btn--sm icon-btn--plain" data-action="editar" data-id="${r.id}" title="Editar" aria-label="Editar">${icon('edit', 15)}</button>` : ''}
          ${canEdit && toggleField ? `<button class="icon-btn icon-btn--sm icon-btn--plain" data-action="toggle" data-id="${r.id}" title="${r[toggleField] ? 'Inactivar' : 'Activar'}" aria-label="${r[toggleField] ? 'Inactivar' : 'Activar'}">${icon('power', 15)}</button>` : ''}
        </div>`,
      });
    }
    const list = filtered();
    root.querySelector('[data-slot="tabla"]').innerHTML = renderTable({
      columns: cols, rows: list,
      rowClass: (r) => (toggleField && !r[toggleField] ? 'is-muted' : ''),
      empty: rows.length ? {} : { icon: 'folder', title: `Aún no hay ${title.toLowerCase()}`, text: canEdit ? `Crea el primer ${singular} con el botón "Nuevo".` : '' },
    });
    root.querySelector('[data-slot="contador"]').textContent = `${list.length} de ${rows.length}`;
  }

  async function reload() {
    try {
      rows = await fetchRows();
      paint();
    } catch (err) {
      root.querySelector('[data-slot="tabla"]').innerHTML = errorState(err);
    }
  }

  async function openForm(row = null) {
    let opciones = {};
    try {
      opciones = (await config.loadOptions?.()) || {};
    } catch (err) {
      toastError(err);
      return;
    }
    const fields = typeof config.fields === 'function' ? config.fields(opciones) : config.fields;
    const m = openModal({
      title: row ? `Editar ${singular}` : `Nuevo ${singular}`,
      subtitle: title,
      content: `<form class="modal__form" novalidate>
        <div class="modal__body"><div class="form-grid">${renderFields(fields, row || {})}</div></div>
        <div class="modal__footer">
          <button type="button" class="btn btn--ghost" data-close>Cancelar</button>
          <button type="submit" class="btn btn--primary">${icon('check', 16)}Guardar</button>
        </div>
      </form>`,
    });
    const form = m.content.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let values = readForm(form, fields);
      const errors = { ...validateFields(fields, values), ...(config.validate?.(values, row) || {}) };
      if (!showErrors(form, errors)) return;
      if (config.beforeSave) values = config.beforeSave(values, row);

      const btn = form.querySelector('[type="submit"]');
      setLoading(btn, true);
      try {
        if (row) await q(supabase.from(table).update(values).eq('id', row.id).select('id').single());
        else await q(supabase.from(table).insert(values).select('id').single());
        toast(row ? 'Cambios guardados' : 'Registro creado', 'success');
        m.close();
        reload();
      } catch (err) {
        toastError(err);
        setLoading(btn, false);
      }
    });
  }

  async function toggle(row) {
    const activar = !row[toggleField];
    if (!activar) {
      const ok = await confirmDialog({
        title: `¿Inactivar ${singular}?`,
        message: 'No aparecerá en las listas para nuevos registros, pero se conserva el historial.',
        confirmText: 'Inactivar', danger: true,
      });
      if (!ok) return;
    }
    try {
      await q(supabase.from(table).update({ [toggleField]: activar }).eq('id', row.id).select('id').single());
      toast(activar ? 'Registro activado' : 'Registro inactivado', 'success');
      reload();
    } catch (err) {
      toastError(err);
    }
  }

  return {
    reload,
    async mount(container) {
      root = container;
      container.innerHTML = `<section class="card card--flush">
        <div class="card__head" style="padding:20px 20px 0;flex-wrap:wrap">
          <div>
            <h2 class="card__title">${esc(title)}</h2>
            ${description ? `<p class="card__subtitle">${esc(description)}</p>` : ''}
          </div>
          ${canEdit ? `<button class="btn btn--primary" data-action="nuevo">${icon('plus', 16)}Nuevo</button>` : ''}
        </div>
        <div class="toolbar" style="padding:0 20px 16px">
          <div class="field field--search">
            <div class="input-icon">${icon('search', 16)}<input class="input input--sm" type="search" placeholder="Buscar…" data-slot="buscar" aria-label="Buscar"></div>
          </div>
          ${toggleField ? `<div class="field"><select class="input input--sm" data-slot="estado" aria-label="Filtrar por estado">
            <option value="todos">Todos</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option>
          </select></div>` : ''}
          <span class="text-sm text-muted" data-slot="contador" style="align-self:center"></span>
        </div>
        <div data-slot="tabla">${loader()}</div>
      </section>`;

      container.querySelector('[data-slot="buscar"]').addEventListener('input', debounce((e) => { filtro = e.target.value.trim(); paint(); }, 200));
      container.querySelector('[data-slot="estado"]')?.addEventListener('change', (e) => { estado = e.target.value; paint(); });
      on(container, 'click', '[data-action]', (e, btn) => {
        const row = rows.find((r) => String(r.id) === btn.dataset.id);
        const action = btn.dataset.action;
        if (action === 'nuevo') openForm();
        if (action === 'editar' && row) openForm(row);
        if (action === 'toggle' && row) toggle(row);
        if (action === 'custom' && row) {
          const def = rowActions.find((a) => a.id === btn.dataset.custom);
          def?.handler(row, reload);
        }
      });
      await reload();
    },
  };
}

-- =========================================================
-- 06 · M6 COMERCIALIZACIÓN Y SOPORTES  (RF-31 … RF-36)
-- Ventas de material a recolectoras con recibos (foto/PDF) como
-- evidencia verificable para el Ministerio.
-- Requiere: 00, 01 y 02.
-- =========================================================

-- ---------- Tablas ----------
create table if not exists public.ventas (
  id                       uuid primary key default gen_random_uuid(),
  consecutivo              bigint generated always as identity unique,
  fecha                    date not null,
  recolectora_id           uuid not null references public.recolectoras (id),
  periodo_id               uuid references public.periodos (id),        -- se calcula con la fecha
  total                    numeric(14, 2) not null default 0,             -- suma de venta_detalle
  estado                   text not null default 'registrada'
                           check (estado in ('registrada', 'validada', 'anulada')),
  observaciones            text,
  justificacion_anulacion  text,
  creado_por               uuid default auth.uid(),
  created_at               timestamptz not null default now(),
  actualizado_por          uuid,
  updated_at               timestamptz not null default now(),
  validado_por             uuid,
  validado_at              timestamptz,
  anulado_por              uuid,
  anulado_at               timestamptz,
  constraint ventas_creado_por_fkey     foreign key (creado_por)      references public.perfiles (id),
  constraint ventas_actualizado_por_fkey foreign key (actualizado_por) references public.perfiles (id),
  constraint ventas_validado_por_fkey   foreign key (validado_por)    references public.perfiles (id),
  constraint ventas_anulado_por_fkey    foreign key (anulado_por)     references public.perfiles (id),
  constraint ventas_justificacion check (estado <> 'anulada' or length(trim(coalesce(justificacion_anulacion, ''))) >= 10)
);
create index if not exists idx_ventas_fecha on public.ventas (fecha desc);
create index if not exists idx_ventas_periodo on public.ventas (periodo_id);
create index if not exists idx_ventas_recolectora on public.ventas (recolectora_id);

create table if not exists public.venta_detalle (
  id            uuid primary key default gen_random_uuid(),
  venta_id      uuid not null references public.ventas (id) on delete cascade,
  categoria_id  uuid not null references public.categorias_residuo (id),
  kg            numeric(10, 2) not null check (kg > 0),
  precio_kg     numeric(12, 2) not null check (precio_kg >= 0),
  subtotal      numeric(14, 2) generated always as (round(kg * precio_kg, 2)) stored,
  constraint venta_detalle_categoria_unica unique (venta_id, categoria_id)
);
create index if not exists idx_venta_detalle_venta on public.venta_detalle (venta_id);

create table if not exists public.venta_soportes (
  id              uuid primary key default gen_random_uuid(),
  venta_id        uuid not null references public.ventas (id) on delete cascade,
  ruta            text not null unique,      -- ruta del archivo en el bucket "soportes"
  nombre_archivo  text not null,
  tipo            text not null check (tipo in ('image/jpeg', 'image/png', 'application/pdf')),
  tamano_bytes    int,
  subido_por      uuid default auth.uid() references public.perfiles (id),
  created_at      timestamptz not null default now()
);
create index if not exists idx_venta_soportes_venta on public.venta_soportes (venta_id);

-- ---------- Reglas de negocio de la venta (RF-35) ----------
create or replace function public.ventas_reglas()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.fecha > current_date then
    raise exception 'La fecha de la venta no puede ser futura.';
  end if;
  new.periodo_id := public.periodo_de_fecha(new.fecha);

  if tg_op = 'INSERT' then
    new.estado := 'registrada';
    new.creado_por := auth.uid();
    new.validado_por := null; new.validado_at := null;
    new.anulado_por := null;  new.anulado_at := null;
    new.justificacion_anulacion := null;
    return new;
  end if;

  -- UPDATE
  if old.estado = 'anulada' then
    raise exception 'Una venta anulada no se puede modificar.';
  end if;

  if old.estado = 'validada' then
    if new.estado <> 'anulada'
       or new.fecha is distinct from old.fecha
       or new.recolectora_id is distinct from old.recolectora_id
       or new.total is distinct from old.total
       or new.observaciones is distinct from old.observaciones then
      raise exception 'Las ventas validadas no se pueden editar; solo anular con justificación.';
    end if;
  end if;

  if new.estado = 'validada' and old.estado = 'registrada' then
    if not public.es_admin() then
      raise exception 'Solo el administrador puede validar ventas.';
    end if;
    if not exists (select 1 from public.venta_soportes where venta_id = new.id) then
      raise exception 'No se puede validar una venta sin soporte adjunto.';
    end if;
    if not exists (select 1 from public.venta_detalle where venta_id = new.id) then
      raise exception 'No se puede validar una venta sin material vendido.';
    end if;
    new.validado_por := auth.uid();
    new.validado_at := now();
  end if;

  if new.estado = 'anulada' and old.estado <> 'anulada' then
    if not public.es_admin() then
      raise exception 'Solo el administrador puede anular ventas.';
    end if;
    new.anulado_por := auth.uid();
    new.anulado_at := now();
  end if;

  if new.estado = 'registrada' and old.estado <> 'registrada' then
    raise exception 'Cambio de estado no permitido.';
  end if;

  new.actualizado_por := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_ventas_reglas on public.ventas;
create trigger trg_ventas_reglas
  before insert or update on public.ventas
  for each row execute function public.ventas_reglas();

-- Detalle y soportes solo se modifican mientras la venta está "registrada"
create or replace function public.venta_hija_editable()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_venta uuid := coalesce(new.venta_id, old.venta_id);
  v_estado text;
begin
  select estado into v_estado from public.ventas where id = v_venta;
  if v_estado is distinct from 'registrada' then
    raise exception 'La venta ya fue validada o anulada; su detalle y soportes no se pueden modificar.';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_venta_detalle_editable on public.venta_detalle;
create trigger trg_venta_detalle_editable
  before insert or update or delete on public.venta_detalle
  for each row execute function public.venta_hija_editable();

drop trigger if exists trg_venta_soportes_editable on public.venta_soportes;
create trigger trg_venta_soportes_editable
  before insert or update or delete on public.venta_soportes
  for each row execute function public.venta_hija_editable();

-- Una venta siempre debe conservar al menos un soporte (RF-32)
create or replace function public.venta_soportes_minimo()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from public.venta_soportes where venta_id = old.venta_id) then
    raise exception 'La venta debe conservar al menos un soporte.';
  end if;
  return null;
end;
$$;

drop trigger if exists trg_venta_soportes_minimo on public.venta_soportes;
create trigger trg_venta_soportes_minimo
  after delete on public.venta_soportes
  for each row execute function public.venta_soportes_minimo();

-- Recalcula el total de la venta cuando cambia el detalle
create or replace function public.venta_recalcular_total()
returns trigger
language plpgsql
as $$
declare
  v_venta uuid := coalesce(new.venta_id, old.venta_id);
begin
  update public.ventas
     set total = coalesce((select sum(subtotal) from public.venta_detalle where venta_id = v_venta), 0)
   where id = v_venta and estado = 'registrada';
  return null;
end;
$$;

drop trigger if exists trg_venta_detalle_total on public.venta_detalle;
create trigger trg_venta_detalle_total
  after insert or update or delete on public.venta_detalle
  for each row execute function public.venta_recalcular_total();

-- ---------- RPC: guardar venta completa en una sola transacción ----------
-- p_detalle  = [{ "categoria_id": "...", "kg": 3.5, "precio_kg": 800 }, ...]
-- p_soportes = [{ "ruta": "...", "nombre_archivo": "...", "tipo": "image/jpeg", "tamano_bytes": 12345 }, ...]
-- p_id NULL → crea; con valor → edita una venta "registrada".
create or replace function public.guardar_venta(
  p_id uuid,
  p_fecha date,
  p_recolectora_id uuid,
  p_observaciones text,
  p_detalle jsonb,
  p_soportes jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
  v_item jsonb;
  v_disponible numeric;
begin
  if not public.tiene_rol('admin', 'docente') then
    raise exception 'No tienes permiso para registrar ventas.';
  end if;
  if coalesce(jsonb_array_length(p_detalle), 0) = 0 then
    raise exception 'Agrega al menos una categoría de material a la venta.';
  end if;

  if p_id is null then
    if coalesce(jsonb_array_length(p_soportes), 0) = 0 then
      raise exception 'Debes adjuntar al menos un soporte (foto o PDF del recibo).';
    end if;
    insert into public.ventas (fecha, recolectora_id, observaciones)
    values (p_fecha, p_recolectora_id, nullif(trim(p_observaciones), ''))
    returning id into v_id;
  else
    update public.ventas
       set fecha = p_fecha, recolectora_id = p_recolectora_id, observaciones = nullif(trim(p_observaciones), '')
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'La venta no existe o no tienes permiso para editarla.';
    end if;
    delete from public.venta_detalle where venta_id = v_id;
  end if;

  for v_item in select * from jsonb_array_elements(p_detalle)
  loop
    -- RF-36: si M4 ya publicó la vista de inventario, no se puede vender más de lo disponible
    if to_regclass('public.v_inventario_categoria') is not null then
      execute 'select kg_disponible from public.v_inventario_categoria where categoria_id = $1'
        into v_disponible using (v_item ->> 'categoria_id')::uuid;
      if coalesce(v_disponible, 0) < (v_item ->> 'kg')::numeric then
        raise exception 'Inventario insuficiente: solo hay % kg disponibles de esa categoría.', coalesce(v_disponible, 0);
      end if;
    end if;

    insert into public.venta_detalle (venta_id, categoria_id, kg, precio_kg)
    values (v_id, (v_item ->> 'categoria_id')::uuid, (v_item ->> 'kg')::numeric, (v_item ->> 'precio_kg')::numeric);
  end loop;

  insert into public.venta_soportes (venta_id, ruta, nombre_archivo, tipo, tamano_bytes)
  select v_id, s ->> 'ruta', s ->> 'nombre_archivo', s ->> 'tipo', (s ->> 'tamano_bytes')::int
  from jsonb_array_elements(coalesce(p_soportes, '[]'::jsonb)) s;

  if not exists (select 1 from public.venta_soportes where venta_id = v_id) then
    raise exception 'Debes adjuntar al menos un soporte (foto o PDF del recibo).';
  end if;

  return v_id;
end;
$$;

-- ---------- Vistas para otros módulos ----------
-- RF-36: kg vendidos por categoría (ventas no anuladas).
-- M4 debe restar esto en su vista v_inventario_categoria:
--   kg_disponible = kg_recolectado - kg_vendido - kg_compostado
create or replace view public.v_kg_vendidos_categoria
with (security_invoker = true) as
select d.categoria_id,
       c.nombre                as categoria,
       sum(d.kg)               as kg_vendidos,
       sum(d.subtotal)         as ingresos
from public.venta_detalle d
join public.ventas v on v.id = d.venta_id and v.estado <> 'anulada'
join public.categorias_residuo c on c.id = d.categoria_id
group by d.categoria_id, c.nombre;

-- Resumen plano de ventas para M7 (dashboard) y M8 (reportes)
create or replace view public.v_ventas_resumen
with (security_invoker = true) as
select v.id, v.consecutivo, v.fecha, v.estado, v.total, v.periodo_id,
       p.nombre  as periodo, p.anio,
       r.razon_social as recolectora, r.nit,
       (select coalesce(sum(kg), 0) from public.venta_detalle d where d.venta_id = v.id) as kg_total,
       (select count(*) from public.venta_soportes s where s.venta_id = v.id)           as soportes
from public.ventas v
join public.recolectoras r on r.id = v.recolectora_id
left join public.periodos p on p.id = v.periodo_id;

-- ---------- RLS ----------
alter table public.ventas enable row level security;
alter table public.venta_detalle enable row level security;
alter table public.venta_soportes enable row level security;

drop policy if exists ventas_select on public.ventas;
create policy ventas_select on public.ventas for select to authenticated
  using (public.tiene_rol('admin', 'docente', 'consulta'));
drop policy if exists ventas_insert on public.ventas;
create policy ventas_insert on public.ventas for insert to authenticated
  with check (public.tiene_rol('admin', 'docente'));
drop policy if exists ventas_update on public.ventas;
create policy ventas_update on public.ventas for update to authenticated
  using (public.tiene_rol('admin', 'docente')) with check (public.tiene_rol('admin', 'docente'));

drop policy if exists venta_detalle_select on public.venta_detalle;
create policy venta_detalle_select on public.venta_detalle for select to authenticated
  using (public.tiene_rol('admin', 'docente', 'consulta'));
drop policy if exists venta_detalle_write on public.venta_detalle;
create policy venta_detalle_write on public.venta_detalle for all to authenticated
  using (public.tiene_rol('admin', 'docente')) with check (public.tiene_rol('admin', 'docente'));

drop policy if exists venta_soportes_select on public.venta_soportes;
create policy venta_soportes_select on public.venta_soportes for select to authenticated
  using (public.tiene_rol('admin', 'docente', 'consulta'));
drop policy if exists venta_soportes_insert on public.venta_soportes;
create policy venta_soportes_insert on public.venta_soportes for insert to authenticated
  with check (public.tiene_rol('admin', 'docente'));
drop policy if exists venta_soportes_delete on public.venta_soportes;
create policy venta_soportes_delete on public.venta_soportes for delete to authenticated
  using (public.tiene_rol('admin', 'docente'));

-- ---------- Storage: bucket privado para los recibos (RF-32, RF-34) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('soportes', 'soportes', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists soportes_select on storage.objects;
create policy soportes_select on storage.objects for select to authenticated
  using (bucket_id = 'soportes' and public.tiene_rol('admin', 'docente', 'consulta'));

drop policy if exists soportes_insert on storage.objects;
create policy soportes_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'soportes' and public.tiene_rol('admin', 'docente'));

-- Solo se pueden borrar archivos "huérfanos" (que no pertenecen a ninguna venta).
-- Así un soporte que ya respalda una venta nunca se pierde.
drop policy if exists soportes_delete on storage.objects;
create policy soportes_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'soportes'
    and public.tiene_rol('admin', 'docente')
    and not exists (select 1 from public.venta_soportes s where s.ruta = storage.objects.name)
  );

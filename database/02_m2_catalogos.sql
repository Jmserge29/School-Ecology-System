-- =========================================================
-- 02 · M2 CATÁLOGOS Y CONFIGURACIÓN  (RF-06 … RF-11)
-- Parametrización del sistema: categorías, destinos, salones, puntos,
-- periodos, recolectoras y parámetros generales.
-- =========================================================

-- ---------- Categorías de residuo (RF-06) ----------
create table if not exists public.categorias_residuo (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null unique check (length(trim(nombre)) >= 2),
  descripcion  text,
  color        text not null default '#5a7a2b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  es_organico  boolean not null default false,  -- true → va a compostaje (M4/M5)
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- Destinos de aprovechamiento (RF-07) ----------
create table if not exists public.destinos_aprovechamiento (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null unique,
  tipo         text not null check (tipo in ('reciclaje', 'compostaje', 'reutilizacion', 'disposicion_final', 'otro')),
  descripcion  text,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- Salones / grupos (RF-08) ----------
create table if not exists public.salones (
  id          uuid primary key default gen_random_uuid(),
  grado       text not null,
  grupo       text not null,
  jornada     text not null default 'manana' check (jornada in ('manana', 'tarde', 'unica', 'noche')),
  docente_id  uuid,
  nombre      text generated always as (
                case when grado ~ '^[0-9]+$' then grado || '°' || grupo else grado || ' ' || grupo end
              ) stored,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint salones_docente_id_fkey foreign key (docente_id) references public.perfiles (id) on delete set null,
  constraint salones_unicos unique (grado, grupo, jornada)
);

-- Ahora que existen los salones, enlazamos perfiles.salon_id
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'perfiles_salon_id_fkey') then
    alter table public.perfiles
      add constraint perfiles_salon_id_fkey foreign key (salon_id) references public.salones (id) on delete set null;
  end if;
end $$;

-- ---------- Puntos de recolección (RF-09) ----------
create table if not exists public.puntos_recoleccion (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null unique,
  ubicacion    text,
  descripcion  text,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- Periodos académicos (RF-10) ----------
create table if not exists public.periodos (
  id            uuid primary key default gen_random_uuid(),
  anio          int  not null check (anio between 2000 and 2100),
  nombre        text not null,                 -- P1, P2, P3, P4 …
  fecha_inicio  date not null,
  fecha_fin     date not null,
  es_actual     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint periodos_rango check (fecha_fin >= fecha_inicio),
  constraint periodos_unicos unique (anio, nombre)
);
-- Solo un periodo puede estar marcado como actual
create unique index if not exists periodos_un_actual on public.periodos (es_actual) where es_actual;

-- Evita periodos con fechas que se cruzan
create or replace function public.periodos_sin_cruce()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.periodos p
    where p.id <> new.id
      and daterange(p.fecha_inicio, p.fecha_fin, '[]') && daterange(new.fecha_inicio, new.fecha_fin, '[]')
  ) then
    raise exception 'Las fechas del periodo se cruzan con otro periodo existente.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_periodos_sin_cruce on public.periodos;
create trigger trg_periodos_sin_cruce
  before insert or update of fecha_inicio, fecha_fin on public.periodos
  for each row execute function public.periodos_sin_cruce();

-- Marca un periodo como el actual (y desmarca el anterior)
create or replace function public.activar_periodo(p_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede cambiar el periodo actual.';
  end if;
  update public.periodos set es_actual = false where es_actual and id <> p_id;
  update public.periodos set es_actual = true where id = p_id;
end;
$$;

-- Periodo al que pertenece una fecha (lo usan M3, M6, M7, M8)
create or replace function public.periodo_de_fecha(p_fecha date)
returns uuid
language sql stable
as $$
  select id from public.periodos
  where p_fecha between fecha_inicio and fecha_fin
  order by fecha_inicio
  limit 1;
$$;

-- ---------- Recolectoras / compradores (RF-11) ----------
create table if not exists public.recolectoras (
  id               uuid primary key default gen_random_uuid(),
  razon_social     text not null,
  nit              text not null unique,
  contacto_nombre  text,
  telefono         text,
  correo           text,
  direccion        text,
  activo           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- Parámetros generales ----------
-- Clave/valor en JSON: unidad de medida, rangos del compost (RF-29), etc.
create table if not exists public.configuracion (
  clave        text primary key,
  valor        jsonb not null,
  descripcion  text,
  updated_at   timestamptz not null default now()
);

-- ---------- Triggers updated_at ----------
do $$
declare t text;
begin
  foreach t in array array['categorias_residuo', 'destinos_aprovechamiento', 'salones', 'puntos_recoleccion', 'periodos', 'recolectoras', 'configuracion']
  loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$I', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------- RLS: todos los usuarios activos leen; solo admin escribe ----------
do $$
declare t text;
begin
  foreach t in array array['categorias_residuo', 'destinos_aprovechamiento', 'salones', 'puntos_recoleccion', 'periodos', 'recolectoras', 'configuracion']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %1$s_select on public.%1$I', t);
    execute format('create policy %1$s_select on public.%1$I for select to authenticated using (public.rol_actual() is not null)', t);
    execute format('drop policy if exists %1$s_insert on public.%1$I', t);
    execute format('create policy %1$s_insert on public.%1$I for insert to authenticated with check (public.es_admin())', t);
    execute format('drop policy if exists %1$s_update on public.%1$I', t);
    execute format('create policy %1$s_update on public.%1$I for update to authenticated using (public.es_admin()) with check (public.es_admin())', t);
  end loop;
end $$;
-- Sin políticas DELETE: los catálogos se inactivan para conservar el historial.

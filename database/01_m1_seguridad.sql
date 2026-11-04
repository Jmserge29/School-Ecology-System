-- =========================================================
-- 01 · M1 SEGURIDAD Y USUARIOS  (RF-01 … RF-05)
-- Perfiles de usuario enlazados a auth.users, roles y funciones
-- auxiliares que usan las políticas RLS de TODOS los módulos.
-- =========================================================

-- ---------- Tabla de perfiles ----------
create table if not exists public.perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null check (length(trim(nombre)) >= 3),
  correo      text not null unique,
  rol         text not null default 'estudiante'
              check (rol in ('admin', 'docente', 'estudiante', 'consulta')),
  salon_id    uuid,              -- FK a salones se agrega en 02_m2_catalogos.sql
  activo      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id)
);

comment on table public.perfiles is 'M1: datos de cada usuario del sistema (nombre, correo, rol, salón, estado).';
create index if not exists idx_perfiles_rol on public.perfiles (rol);

-- ---------- Funciones de rol (usadas en las políticas RLS) ----------
-- Rol del usuario autenticado; NULL si no existe o está inactivo.
create or replace function public.rol_actual()
returns text
language sql stable security definer
set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid() and activo;
$$;

-- ¿El usuario actual tiene alguno de estos roles?  tiene_rol('admin','docente')
create or replace function public.tiene_rol(variadic roles text[])
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.rol_actual() = any (roles), false);
$$;

create or replace function public.es_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.tiene_rol('admin');
$$;

-- ---------- Alta automática del perfil al crear la cuenta ----------
-- Toda cuenta nueva nace como "estudiante" INACTIVO. El administrador
-- la activa y le asigna rol desde el módulo Usuarios. Así, aunque alguien
-- se registre por su cuenta, no obtiene acceso a nada.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, correo)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)),
    lower(new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Reglas de edición de perfiles ----------
create or replace function public.perfiles_reglas()
returns trigger
language plpgsql
as $$
begin
  -- El correo se sincroniza con Auth; no se edita desde la app
  new.correo := old.correo;
  -- Un administrador no puede quitarse su propio rol ni desactivarse (evita quedar sin acceso)
  if new.id = auth.uid() and (new.rol <> old.rol or new.activo <> old.activo) then
    raise exception 'No puedes cambiar tu propio rol ni desactivar tu propia cuenta.';
  end if;
  -- Solo los estudiantes tienen salón asignado
  if new.rol <> 'estudiante' then
    new.salon_id := null;
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_perfiles_reglas on public.perfiles;
create trigger trg_perfiles_reglas
  before update on public.perfiles
  for each row execute function public.perfiles_reglas();

-- ---------- RLS ----------
alter table public.perfiles enable row level security;

drop policy if exists perfiles_select on public.perfiles;
create policy perfiles_select on public.perfiles
  for select to authenticated
  using (id = auth.uid() or public.tiene_rol('admin', 'docente', 'consulta'));

drop policy if exists perfiles_update on public.perfiles;
create policy perfiles_update on public.perfiles
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- No hay políticas de INSERT/DELETE: los perfiles se crean con el trigger
-- y los usuarios se DESACTIVAN en lugar de borrarse (RF-03).

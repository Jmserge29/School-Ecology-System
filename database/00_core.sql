-- =========================================================
-- 00 · NÚCLEO
-- Extensiones y funciones genéricas usadas por todos los módulos.
-- Ejecutar PRIMERO en Supabase → SQL Editor.
-- =========================================================

create extension if not exists pgcrypto;

-- Actualiza automáticamente la columna updated_at en cada UPDATE.
-- Uso en tu tabla:
--   create trigger trg_mi_tabla_updated before update on public.mi_tabla
--   for each row execute function public.set_updated_at();
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

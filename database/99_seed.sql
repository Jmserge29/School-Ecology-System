-- =========================================================
-- 99 · DATOS INICIALES
-- Ejecutar al final. Se puede volver a ejecutar sin duplicar datos.
-- =========================================================

-- Categorías de residuo (vidrio y metal se pueden agregar después desde M2)
insert into public.categorias_residuo (nombre, descripcion, color, es_organico) values
  ('Plástico', 'Botellas PET, envases y bolsas limpias y secas', '#3a7bbf', false),
  ('Cartón',   'Cajas y empaques de cartón aplanados',           '#b07a3c', false),
  ('Papel',    'Hojas, cuadernos y periódico sin grasa',          '#8aa0a8', false),
  ('Orgánico', 'Restos de frutas, verduras y alimentos',          '#5a7a2b', true)
on conflict (nombre) do nothing;

-- Destinos de aprovechamiento
insert into public.destinos_aprovechamiento (nombre, tipo, descripcion) values
  ('Reciclaje (venta)',  'reciclaje',         'Material vendido a recolectoras'),
  ('Compostaje',         'compostaje',        'Residuo orgánico que entra a las composteras'),
  ('Reutilización',      'reutilizacion',     'Material reutilizado en el colegio'),
  ('Disposición final',  'disposicion_final', 'Residuo no aprovechable')
on conflict (nombre) do nothing;

-- Puntos de recolección de ejemplo
insert into public.puntos_recoleccion (nombre, ubicacion) values
  ('Punto ecológico patio central', 'Patio central, junto a la cafetería'),
  ('Centro de acopio',              'Bodega detrás del huerto')
on conflict (nombre) do nothing;

-- Periodos del año lectivo actual (ajusta las fechas al calendario del colegio)
insert into public.periodos (anio, nombre, fecha_inicio, fecha_fin, es_actual) values
  (2026, 'P1', '2026-01-26', '2026-04-03', false),
  (2026, 'P2', '2026-04-13', '2026-06-19', false),
  (2026, 'P3', '2026-07-06', '2026-09-11', false),
  (2026, 'P4', '2026-09-14', '2026-11-27', true)
on conflict (anio, nombre) do nothing;

-- Parámetros generales
insert into public.configuracion (clave, valor, descripcion) values
  ('unidad_medida',    '"kg"', 'Unidad de medida base del sistema'),
  ('nombre_institucion', '"Institución Educativa"', 'Nombre que aparece en reportes'),
  ('rangos_compost',   '{"temperatura":{"min":40,"max":65},"humedad":{"min":40,"max":60},"ph":{"min":6.5,"max":8.5}}',
                       'Rangos aceptables de la bitácora de compost (RF-29)')
on conflict (clave) do nothing;

-- =========================================================
-- PRIMER ADMINISTRADOR
-- 1. Supabase → Authentication → Users → "Add user" (correo + contraseña,
--    marca "Auto Confirm User").
-- 2. Ejecuta esta línea cambiando el correo:
-- update public.perfiles set rol = 'admin', activo = true, nombre = 'Tu Nombre'
--  where correo = 'tu-correo@colegio.edu.co';
-- =========================================================

// =========================================================
// CONFIGURACIÓN DEL ENTORNO
// Reemplaza estos valores con los de tu proyecto Supabase:
//   Supabase → Project Settings → API → Project URL / anon public key
// La "anon key" es pública por diseño: la seguridad real la dan las
// políticas RLS definidas en /database. NUNCA pongas aquí la service_role key.
// =========================================================
export const ENV = {
  SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
  SUPABASE_ANON_KEY: 'TU-ANON-KEY',

  // Bucket de Storage donde se guardan los recibos de venta (M6)
  STORAGE_BUCKET_SOPORTES: 'soportes',

  APP_NAME: 'EcoEscuela',
};

# EcoEscuela · Sistema de Gestión de Residuos Sólidos

Aplicación web para que el colegio registre, consulte y visualice su gestión de residuos:
recolección por salón, clasificación, compostaje en el huerto y venta de material con soportes
verificables ante el Ministerio.

**Stack:** HTML + CSS + JavaScript (módulos ES, sin compilación) · Supabase (PostgreSQL, Auth, Storage).

---

## 1. Estructura del proyecto

```
School Ecology System/
├── index.html               Landing educativa para estudiantes (pública)
├── login.html               Iniciar sesión / recuperar contraseña
├── reset-password.html      Crear nueva contraseña desde el enlace del correo
├── app.html                 Aplicación (requiere sesión)
├── assets/img/              Imágenes y favicon
├── database/                Scripts SQL — UNO POR MÓDULO, ejecutar en orden
│   ├── 00_core.sql
│   ├── 01_m1_seguridad.sql      ✅
│   ├── 02_m2_catalogos.sql      ✅
│   ├── 03_m3_recoleccion.sql    🚧 plantilla
│   ├── 04_m4_clasificacion.sql  🚧 plantilla
│   ├── 05_m5_huerto.sql         🚧 plantilla
│   ├── 06_m6_comercializacion.sql ✅
│   ├── 07_m7_dashboard.sql      🚧 plantilla
│   ├── 08_m8_reportes.sql       🚧 plantilla
│   └── 99_seed.sql              Datos iniciales
├── docs/GUIA-EQUIPO.md      Convenciones para trabajar en equipo
└── src/
    ├── app.js               Arranque: sesión → shell → router → módulo
    ├── config/env.js        URL y anon key de Supabase  ← CONFIGURAR
    ├── core/                Infraestructura (no tocar sin avisar al equipo)
    │   ├── supabase.js          Cliente único + manejo de errores
    │   ├── auth.js              Sesión, perfil actual, can()
    │   ├── permissions.js       Matriz rol → permiso (RF-05)
    │   ├── router.js            Rutas #/modulo/subruta
    │   └── modules.registry.js  Pestañas de navegación (un registro por módulo)
    ├── layout/              Barra superior, menú de usuario
    ├── pages/               Scripts de login, reset y landing
    ├── shared/              Reutilizable por TODOS los módulos
    │   ├── components/          ui, table, modal, confirm, form, toast, crud-view, placeholder
    │   ├── utils/               dom, format, validators
    │   └── icons.js
    ├── styles/              tokens.css (colores) · base · components · layout · pages/
    └── modules/             UNA CARPETA POR MÓDULO
        ├── _plantilla/          Ejemplo para empezar un módulo
        ├── inicio/              Pantalla de bienvenida
        ├── m1-seguridad/        ✅ Usuarios y roles
        ├── m2-catalogos/        ✅ Catálogos y parámetros (+ catalogos.api.js)
        ├── m3-recoleccion/      🚧
        ├── m4-clasificacion/    🚧
        ├── m5-huerto/           🚧
        ├── m6-comercializacion/ ✅ Ventas y soportes
        ├── m7-dashboard/        🚧
        └── m8-reportes/         🚧
```

| Módulo | Responsable | Estado |
|---|---|---|
| M1 Seguridad y usuarios | José Serge | ✅ Listo |
| M2 Catálogos y configuración | José Serge | ✅ Listo |
| M3 Registro de recolección | Por asignar | 🚧 Plantilla |
| M4 Clasificación y aprovechamiento | Por asignar | 🚧 Plantilla |
| M5 Compostaje y huerto | Por asignar | 🚧 Plantilla |
| M6 Comercialización y soportes | José Serge | ✅ Listo |
| M7 Dashboard de indicadores | Por asignar | 🚧 Plantilla |
| M8 Consultas y reportes | Por asignar | 🚧 Plantilla |

---

## 2. Configurar Supabase (una sola vez)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → ejecuta, en este orden: `00_core.sql`, `01_m1_seguridad.sql`, `02_m2_catalogos.sql`,
   `06_m6_comercializacion.sql`, `99_seed.sql`. (Los demás se ejecutan cuando su responsable los complete.)
   El script 06 también crea el bucket privado **soportes** en Storage.
3. **Authentication → Providers → Email**
   - *Enable sign ups*: **activado** (el admin crea cuentas desde la app; quien se registre solo queda inactivo).
   - *Confirm email*: recomendado **desactivado** para que las cuentas creadas por el admin funcionen de inmediato.
4. **Authentication → URL Configuration**
   - *Site URL*: la URL donde publiques la app (ej. `https://ecoescuela.netlify.app`).
   - *Redirect URLs*: agrega `https://TU-DOMINIO/reset-password.html` y `http://localhost:5500/reset-password.html`.
5. **Primer administrador:** Authentication → Users → *Add user* (marca *Auto Confirm*). Luego en SQL Editor:
   ```sql
   update public.perfiles set rol = 'admin', activo = true, nombre = 'Tu Nombre'
   where correo = 'tu-correo@colegio.edu.co';
   ```
6. **Project Settings → API**: copia *Project URL* y *anon public key* en `src/config/env.js`.

> La *anon key* es pública por diseño; la seguridad la dan las políticas RLS. **Nunca** uses la `service_role` key en el frontend.
> El servidor de correo gratuito de Supabase envía pocos correos por hora; para producción configura SMTP propio (Authentication → SMTP).

---

## 3. Ejecutar en local

Los módulos ES requieren servirse por HTTP (no abrir el archivo con doble clic). Cualquiera de estas opciones:

- VS Code → extensión **Live Server** → clic derecho en `index.html` → *Open with Live Server* (puerto 5500).
- O en una terminal dentro de la carpeta del proyecto:

```bash
npx serve .
```

```bash
python -m http.server 5500
```

Abre `http://localhost:5500` (landing) o `http://localhost:5500/login.html`.

---

## 4. Desplegar

Es un sitio estático: no hay build.
- **Netlify / Vercel:** importa el repositorio, sin comando de build, carpeta de publicación = raíz.
- **GitHub Pages:** Settings → Pages → rama `main`, carpeta `/ (root)`.

Después de desplegar, agrega la URL en Supabase (paso 2.4).

---

## 5. Roles

| Rol | Acceso |
|---|---|
| Administrador | Todo: usuarios, catálogos, validar/anular ventas |
| Docente | Registra y valida recolecciones, registra ventas, huerto, reportes |
| Estudiante | Registra recolecciones de su salón y bitácora del huerto |
| Consulta / Auditor | Solo lectura: dashboard, reportes, ventas y soportes |

La matriz exacta está en `src/core/permissions.js` y se refuerza en la BD con RLS.

Lee **[docs/GUIA-EQUIPO.md](docs/GUIA-EQUIPO.md)** antes de empezar tu módulo.

# M1 · Seguridad y usuarios — ✅ Implementado
Responsable: José Serge · RF-01 a RF-05

| Archivo | Qué hace |
|---|---|
| `index.js` | Listado con filtros (texto, rol, salón, estado), KPIs, selección masiva activar/desactivar |
| `usuario-form.js` | Modal crear/editar (rol, salón para estudiantes, estado) |
| `usuarios.service.js` | Consultas a `perfiles` y creación de cuentas en Supabase Auth |
| `/login.html`, `/reset-password.html` (`src/pages`) | Inicio de sesión y recuperación de contraseña |
| `src/core/auth.js`, `src/core/permissions.js` | Sesión, perfil actual y matriz de permisos (RF-05) |

**Cómo se crea un usuario:** se usa `signUp` con un cliente aislado (no cierra la sesión del admin). El trigger `handle_new_user` crea el perfil como *estudiante inactivo* y luego el admin le asigna rol/salón y lo activa. Si alguien se registra por su cuenta, queda inactivo y sin acceso.

**Reglas en BD:** un admin no puede cambiar su propio rol ni desactivarse; el correo no se edita; solo estudiantes tienen salón.

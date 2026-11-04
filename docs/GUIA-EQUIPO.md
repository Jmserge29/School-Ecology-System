# Guía para el equipo

## Reglas de oro
1. **Trabaja solo dentro de tu carpeta** `src/modules/mX-*` y tu archivo `database/0X_mX_*.sql`.
2. Si necesitas algo de otro módulo, **usa su API pública** (ej. `m2-catalogos/catalogos.api.js`), no sus tablas directamente.
3. Si necesitas cambiar algo de `src/core`, `src/shared` o `src/styles`, **avisa al grupo** primero: afecta a todos.
4. La vista nunca llama a `supabase` directamente: todo va en un `*.service.js`.
5. Permisos en dos capas: `permissions.js` (interfaz) **y** RLS en SQL (seguridad real).

## Contrato de un módulo
```js
// src/modules/mX-nombre/index.js
export default {
  async mount(container, ctx) {
    // container: <div> vacío donde dibujas
    // ctx.user, ctx.can('permiso'), ctx.route.sub, ctx.navigate('ruta'), ctx.onCleanup(fn)
  },
};
```
El registro de la pestaña ya existe en `src/core/modules.registry.js`. Copia la estructura de `src/modules/_plantilla`.

## Convenciones de nombres
| Qué | Convención | Ejemplo |
|---|---|---|
| Carpetas de módulo | `mN-nombre` | `m3-recoleccion` |
| Archivos | kebab/punto | `recoleccion-form.js`, `recoleccion.service.js` |
| Tablas y columnas SQL | snake_case en español | `recoleccion_detalle.categoria_id` |
| Funciones JS | camelCase en español | `listarRecolecciones()` |
| Permisos | `modulo.accion` | `recoleccion.validar` |
| Clases CSS propias | prefijo corto del módulo | `.rc-linea`, `.rc-card` |

## Patrones ya resueltos (cópialos)
| Necesitas | Mira |
|---|---|
| CRUD simple de una tabla | `m2-catalogos/catalogos.config.js` + `shared/components/crud-view.js` |
| Formulario con varias líneas (cabecera + detalle) | `m6-comercializacion/venta-form.js` |
| Subir fotos/PDF a Storage y verlos con URL firmada | `m6-comercializacion/ventas.service.js` |
| Tomar foto con la cámara del celular | `venta-form.js` → `<input type="file" accept="image/*" capture="environment">` |
| Estados con reglas en la BD (registrada → validada → anulada) | `database/06_m6_comercializacion.sql` → `ventas_reglas` |
| Guardar cabecera + detalle en una transacción | función SQL `guardar_venta` + `supabase.rpc(...)` |
| Listado con filtros y paginación del servidor | `m6-comercializacion/ventas.view.js` |
| Tarjetas KPI y barras rayadas | `modules/inicio` |

## Git (sugerido)
- Una rama por módulo: `feature/m3-recoleccion`.
- Commits pequeños en español: `M3: agrega listado de recolecciones`.
- Pull request a `main` y que otro compañero lo revise.

## Identidad visual
Colores y radios en `src/styles/tokens.css` (verde oliva `#5a7a2b`, lima `#d9e8a4`, bosque `#123d24`).
Usa las clases existentes (`btn`, `card`, `stat`, `badge`, `table`, `tabs`, `input`) antes de crear nuevas.

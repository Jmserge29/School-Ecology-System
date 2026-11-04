# Plantilla de módulo

Copia esta carpeta como guía. **No está registrada** en la navegación.

```
mX-nombre/
├── index.js          ← punto de entrada: export default { mount(container, ctx) }
├── *.service.js      ← consultas a Supabase (la vista nunca llama a supabase directo)
├── *.view.js         ← vistas/pestañas si el módulo tiene varias
├── *-form.js         ← formularios en modal
├── styles.css        ← (opcional) CSS propio, cargado con loadStyles()
└── README.md         ← qué hace, tablas, contrato con otros módulos
```

## Qué puedes reutilizar (`src/shared`)
| Necesito… | Usa |
|---|---|
| Encabezado de página, tarjetas KPI, badges, pestañas | `components/ui.js` → `pageHeader`, `statCard`, `badge`, `renderTabs` |
| Tabla + paginación | `components/table.js` → `renderTable`, `renderPagination` |
| CRUD completo de una tabla simple | `components/crud-view.js` → `createCrudView` (ver M2) |
| Modal / confirmación / anular con motivo | `components/modal.js`, `components/confirm.js` |
| Formularios declarativos con validación | `components/form.js` |
| Notificaciones | `components/toast.js` → `toast`, `toastError` |
| Formatos (moneda, kg, fechas) | `utils/format.js` |
| Catálogos (categorías, salones, periodos…) | `modules/m2-catalogos/catalogos.api.js` |
| Íconos | `icons.js` → `icon('nombre', tamaño)` |

## Checklist para activar tu módulo
1. Tablas + RLS en `database/0X_mX_*.sql` (usa `public.tiene_rol(...)`).
2. Permisos en `src/core/permissions.js` (ya existen los básicos de tu módulo).
3. Reemplaza `renderModulePlaceholder()` en tu `index.js`.
4. Cambia `owner` en `src/core/modules.registry.js`.

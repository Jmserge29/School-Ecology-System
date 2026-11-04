# M6 · Comercialización y soportes — ✅ Implementado
Responsable: José Serge · RF-31 a RF-36

| Archivo | Qué hace |
|---|---|
| `index.js` | Pestañas `#/ventas` (listado) y `#/ventas/soportes` (repositorio) |
| `ventas.view.js` | KPIs, filtros (periodo, recolectora, estado, fechas) y tabla paginada |
| `venta-form.js` | Registrar/editar venta: líneas por categoría, total automático, soportes con cámara o archivo |
| `venta-detalle.js` | Ver venta y soportes; validar, anular con justificación, editar |
| `soportes.view.js` | Galería de recibos con filtros y descarga (RF-34) |
| `ventas.service.js` | Consultas, subida a Storage, RPC `guardar_venta`, URLs firmadas |
| `soportes.utils.js` | Valida JPG/PNG/PDF y comprime fotos del celular |

## Flujo de estados
`registrada` (editable) → `validada` (bloqueada, solo admin) → `anulada` (con justificación ≥ 10 caracteres, solo admin).
Las reglas se aplican en la BD (`ventas_reglas`, `venta_hija_editable`), no solo en la interfaz.

## Contrato con otros módulos
- **M4 (RF-36):** si M4 crea la vista `public.v_inventario_categoria(categoria_id, kg_disponible, …)`, la venta automáticamente valida que no se venda más de lo disponible y el formulario muestra "Disponible: X kg". Usa `public.v_kg_vendidos_categoria` para restar lo vendido.
- **M7 / M8:** usen `public.v_ventas_resumen` y `urlsFirmadas()` de `ventas.service.js` para enlazar recibos.

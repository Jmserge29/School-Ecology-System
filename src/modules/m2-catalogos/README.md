# M2 · Catálogos y configuración — ✅ Implementado
Responsable: José Serge · RF-06 a RF-11

| Archivo | Qué hace |
|---|---|
| `index.js` | Pestañas: categorías, destinos, salones, puntos, periodos, recolectoras, parámetros |
| `catalogos.config.js` | Columnas, campos y validaciones de cada catálogo (usa `createCrudView`) |
| `parametros.view.js` | Nombre de la institución, unidad (kg) y rangos del compost para M5 (RF-29) |
| `catalogos.api.js` | **API pública para los demás módulos** |

## API para otros módulos
```js
import { getCategorias, getSalones, getPuntos, getDestinos, getRecolectoras,
         getPeriodos, getPeriodoActual, getConfiguracion } from '../m2-catalogos/catalogos.api.js';

const categorias = await getCategorias();            // solo activas
const todas = await getCategorias({ soloActivos: false });
const rangos = await getConfiguracion('rangos_compost'); // { temperatura:{min,max}, humedad, ph }
```
SQL útil: `public.periodo_de_fecha(fecha)` devuelve el periodo de una fecha.

Los catálogos no se borran: se **inactivan** para conservar el historial.

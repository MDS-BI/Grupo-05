# Análisis de Escalabilidad · Módulo de Ventas

La pregunta: **¿qué pasa si el módulo crece en usuarios, en datos o en módulos conectados?** Lo analizamos con la idea de *stock y flujo* del curso: los clientes y pedidos son **stocks** (se acumulan), y las cotizaciones nuevas son el **flujo** que los llena.

## 1. Dónde está hoy el MVP

| Recurso | Hoy | Límite |
|---|---|---|
| Almacenamiento | `localStorage` del navegador | ~5 MB por sitio. Un pedido con 3 líneas pesa ~1 kB → caben unos **4.000–5.000 pedidos** |
| Usuarios | 1 navegador = 1 usuario | No hay datos compartidos: dos vendedores ven bases distintas |
| Seguridad | Perfiles simulados | Cualquiera puede cambiar de perfil; los datos se leen desde el navegador |
| Rendimiento | Búsqueda y panel recorren todo en memoria | Fluido con 500+ clientes (probado por el template); se nota sobre ~10.000 pedidos |

Conclusión: sirve para **demostrar** y para una sola persona. No sirve para una empresa real.

## 2. Más usuarios (de 1 a ~20 vendedores)

**Problema:** cada vendedor tendría su propia copia de los datos. Si dos confirman pedidos del mismo cliente a la vez, ambos ven crédito disponible y juntos lo sobrepasan.

Es una **demora** del sistema: la información del crédito llega tarde a cada vendedor. Genera un ciclo de refuerzo (R): más pedidos sin control → más deuda → más riesgo de no pago.

**Solución:**
1. Un backend con base de datos (PostgreSQL) y una API.
2. La verificación de crédito y aprobación se hace en el servidor dentro de una **transacción**, no en el navegador.
3. Inicio de sesión real con roles (vendedor, jefe, administración, gerencia).

Lo que **no cambia**: las reglas de `src/sales/sales-logic.js` son funciones puras; se pueden mover al servidor tal cual.

## 3. Más datos (años de historia)

- Pasar de `localStorage` a las tablas del [MER](mer.png): `documents` se divide en `sales_quotes`, `sales_orders` y `sales_order_lines` (ver [data-model.md §8](../specs/002-modulo-ventas/data-model.md)).
- Índices por `customer_id`, `status` y `order_date`, que son los filtros del panel.
- Los indicadores dejan de calcularse recorriendo todo: se guardan **resúmenes por mes** (un stock que se actualiza con cada pedido).
- Paginación en listas y búsqueda.

## 4. Más módulos (integración con el ERP)

El MER ya deja las conexiones:

| Conexión | Desde Ventas | Hacia |
|---|---|---|
| Estado `despachado` | `shipments` | Inventario / Logística (descontar stock) |
| Estado `facturado` | `ar_invoices` | Finanzas (cuentas por cobrar) |
| `customers` | Ficha del cliente | CRM (`opportunities`) |
| `products`, `price_lists` | Catálogo | Inventario / Compras |

**Riesgo sistémico:** si Ventas confirma pedidos sin mirar el stock real, Inventario queda con pedidos imposibles de cumplir. Es un ejemplo de **suboptimización** (Meadows): cada módulo cumple su meta y el sistema completo falla. La solución es que la confirmación consulte stock disponible antes de aceptar.

## 5. Resumen

| Escala | Qué hacer | Qué se reutiliza del MVP |
|---|---|---|
| 1 usuario (hoy) | Nada | Todo |
| Equipo de ventas | Backend + base de datos + login | Reglas de negocio, MER, pantallas |
| Varios años | Índices, resúmenes mensuales, paginación | MER |
| ERP completo | Conectar con Inventario, Finanzas y CRM | Estados del pedido y tablas del MER |

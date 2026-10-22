# Propuesta de MVP: Módulo de Ventas · Grupo 5

**Curso**: Modelación de Sistemas 580211-1, UdeC, 2026-2
**Entrega**: revisión del avance, 22 de octubre de 2026 (propuesta original del 13 de octubre)
**Integrantes**: Joaquín Ignacio Espinoza Mella · Ezequiel Ernesto Romero Cifuentes · Pedro Pablo Chávez González · Antonio Alberto Araneda Lepe · Francisca Belén Arias Díaz · Sebastián Eduardo Amigo Pereira

> Este documento es nuestro **compromiso de MVP**. Se validará en la presentación de la semana del 30 de noviembre.

## 1. Problema

En muchas pymes, la venta se gestiona con planillas, WhatsApp y facturas sueltas. Esto genera cuatro problemas:

1. **Precios inconsistentes:** cada vendedor cotiza con una planilla distinta y aplica descuentos "a ojo".
2. **No se sabe qué pasó con cada cotización:** si se ganó, se perdió (y por qué) o se olvidó.
3. **Se vende a clientes que ya no tienen crédito:** nadie ve la deuda acumulada antes de confirmar.
4. **No hay datos confiables para decidir:** ventas por cliente, producto o vendedor se calculan a mano y tarde.

## 2. Cliente y usuarios

**Cliente (quien adopta el sistema):** una pyme distribuidora de insumos de construcción del Gran Concepción, una ferretería mayorista (caso ficticio), con unos 150 clientes empresa, 300 productos y 4 vendedores.

| Usuario | Qué hace en el módulo | Qué necesita | Acceso a datos |
|---|---|---|---|
| **Vendedor/a** | Crea clientes, cotiza, convierte cotizaciones en pedidos | Rapidez, precios correctos, ver el crédito disponible del cliente | Su cartera (en producción, solo la suya); no ve márgenes ni costos |
| **Jefe/a de ventas** | Aprueba descuentos > 10 %, revisa el embudo y el desempeño | Alertas de descuentos pendientes e indicadores por vendedor | Todos los clientes y vendedores |
| **Administración / Facturación** (módulo Finanzas) | Recibe pedidos confirmados para facturar | Pedidos completos y con RUT válido | Pedidos confirmados; solo lectura |
| **Gerencia** | Revisa ventas, margen y tendencia | Panel agregado | Solo lectura, agregado (fuera del MVP; en el MVP el margen lo ve solo el jefe/a de ventas) |
| **Cliente final** (usuario indirecto) | Recibe cotizaciones | Precios claros, trato justo | Sus datos personales están protegidos por el sistema |

## 3. Alcance del MVP (compromiso)

**Lo que sí haremos:**

1. **Página principal (panel):** ventas del mes, cotizaciones abiertas, tasa de conversión, descuentos pendientes de aprobación y top 5 clientes, más acciones rápidas (nuevo cliente, nueva cotización, buscar).
2. **Clientes:** crear, editar, eliminar y buscar por nombre o RUT (con validación del dígito verificador), con límite de crédito y condición de pago.
3. **Cotizaciones y pedidos:** documento con líneas (producto, cantidad, precio de lista, descuento). Calcula subtotal, IVA y total. Ciclo de vida `cotización → enviada → pedido confirmado → despachado → facturado` (`perdida` y `anulado` como salidas).
4. **Reglas de control:** bloqueo si se supera el crédito; aprobación obligatoria si el descuento es > 10 %; motivo obligatorio al marcar una cotización como perdida.
5. **Búsqueda:** por nombre o RUT (con o sin puntos), mostrando los pedidos de cada cliente con su monto y estado.
6. **Documentación:** README con instrucciones, specs de Speckit, MER y análisis.

**Fuera del MVP (desarrollo futuro):** devoluciones (`returns_rma`); varias listas de precios con vigencia; reserva de stock en Inventario; emisión de factura electrónica (SII); login real con roles; base de datos en servidor.

## 4. Arquitectura de datos

- **MER:** [`mer.png`](mer.png) · **detalle y justificación de cada tabla:** [`specs/002-modulo-ventas/data-model.md`](../specs/002-modulo-ventas/data-model.md).
- Basada en la sección *Sales Module* del modelo ERP del curso, **con los mismos nombres de llaves** para conectarse con CRM, Inventario, Logística y Finanzas.
- **Dos tablas nuevas:**
  - `lost_reasons`: por qué se pierde una venta.
  - `discount_approvals`: quién autoriza descuentos grandes.
- **Columnas nuevas:**
  - descuento por línea, desglose subtotal/IVA/total y lista de precios usada;
  - RUT, segmento, límite de crédito y condición de pago del cliente.
- **Persistencia:** `localStorage` del navegador, como en el template (solo frontend).
- **Base técnica:** template *ERP Software Base Module* (Vite + JavaScript). Cliente = Entidad, Pedido de Venta = Documento, configurado en `src/profiles/ventas.js` y conectado en `src/module-config.js`.

## 5. Método de análisis

### 5.1 Variables críticas

| Variable | De dónde sale |
|---|---|
| Monto vendido por período | `sales_orders.total_amount` con estado confirmado o posterior |
| Número de cotizaciones y su resultado | `sales_quotes.status` |
| Descuento aplicado | `sales_order_lines.discount_pct` |
| Crédito usado por cliente | Pedidos confirmados no facturados vs `customers.credit_limit` |
| Margen | `unit_price` vs `products.standard_cost` (Inventario) |
| Motivo de pérdida | `sales_quotes.lost_reason_id` |

### 5.2 Indicadores

| Indicador | Fórmula | Para qué |
|---|---|---|
| Ventas del período | Σ total_amount | Tendencia |
| Ticket promedio | Ventas / n.º de pedidos | Tamaño típico de compra |
| Tasa de conversión | Pedidos confirmados o posteriores / (esos pedidos + cotizaciones perdidas) | Efectividad comercial |
| Descuento promedio | Σ (descuento $) / Σ (venta bruta $) | Control de precios |
| Margen bruto % | (Venta − costo) / Venta | Rentabilidad |
| Uso de crédito | Deuda vigente / límite de crédito | Riesgo de no pago |
| Concentración (Pareto / ABC) | % de ventas del 20 % de clientes con más ventas | Dependencia de pocos clientes |
| Motivos de pérdida | Conteo por `lost_reason` | Qué mejorar |

**Herramientas de estimación:** cálculos en la app (JavaScript). Para pronosticar ventas: **promedio móvil** de 3 meses y **regresión lineal por mínimos cuadrados** (tendencia y = a + b·t), validados en Excel o MATLAB con datos de ejemplo.

### 5.3 Lectura sistémica (conceptos del ramo)

- **Stocks y flujos:**
  - *Cartera de clientes* [clientes] es un stock; captación y pérdida de clientes [clientes/mes] son sus flujos.
  - *Cotizaciones abiertas* [cotizaciones] es un stock; entran cotizaciones emitidas y salen las aceptadas o perdidas [cotizaciones/semana].
- **Bucle de refuerzo (R):** más clientes satisfechos → más recomendaciones → más clientes nuevos → más clientes satisfechos.
- **Bucle de balance (B):** el crédito usado se acerca al límite → el sistema bloquea nuevos pedidos → el cliente paga → baja el crédito usado.
- **Demora:** entre cotizar y que el cliente responda. Si el vendedor reacciona a la demora bajando el precio antes de tiempo, el sistema "sobrepasa": regala margen que no hacía falta.
- **Suboptimización (Meadows, jerarquía):** si el vendedor maximiza volumen (su meta) con descuentos, perjudica el margen de la empresa (meta global). La aprobación de descuentos alinea ambas metas.

## 6. Usuarios y manejo de riesgos de datos

| Riesgo | Ejemplo | Cómo lo maneja el diseño |
|---|---|---|
| **Datos personales de clientes** | RUT, correo y teléfono de personas naturales | Acceso por rol (en producción, cada vendedor ve solo su cartera); en la demo, solo datos ficticios; exportar es una acción explícita (en producción, solo para la jefatura). Referencia: Ley 19.628 y su reforma (Ley 21.719) |
| **Sesgo de supervivencia** | Analizar solo las ventas ganadas | Motivo obligatorio para cada cotización perdida (`lost_reasons`) |
| **Descuentos discrecionales / trato desigual** | Dos clientes iguales con descuentos muy distintos | Tope de 10 % sin aprobación, motivo registrado y descuento promedio en el panel (por segmento y vendedor en una versión futura) |
| **Sesgo en el crédito** | Negar crédito por la comuna o el tipo de cliente | El límite se basa **solo** en el comportamiento de pago, nunca en la ubicación ni en atributos personales; se documenta el criterio |
| **Uso de datos para vigilar vendedores** | Ranking público que presiona a vender con descuentos | Indicadores por vendedor visibles solo para la jefatura y siempre junto al margen, no solo al volumen |
| **Datos incompletos o duplicados** | El mismo cliente creado dos veces | RUT único con dígito verificador; búsqueda antes de crear |
| **Almacenamiento local** | `localStorage` no está cifrado y se borra con el navegador | Aceptable solo para la demo sin datos reales; exportar e importar JSON; paso a servidor en la etapa de escalabilidad |

## 7. Escalabilidad y desarrollo futuro

- Mismos nombres de tablas que el ERP del curso → conexión directa con CRM, Inventario (reserva de stock), Logística (despachos) y Finanzas (facturas).
- `storage.js` aislado → se puede cambiar `localStorage` por una API con base de datos sin rehacer la interfaz.
- Extender el template a **líneas de documento** y a **varios tipos de documento** (cotización, pedido, devolución).
- Futuro: roles reales con login, facturación electrónica, pronóstico de demanda y portal del cliente.

## Fuentes

- Equipo docente MDS 2026-2. *Modelación de Sistemas 2026-2: Trabajo Grupal* (instructivo y rúbrica). Universidad de Concepción.
- Equipo docente MDS 2026-2. *ERP Relational Data Model* (`erp_data_model.md`).
- Caro, J. C. (2026). *ERP Software Base Module* (template del curso). Repositorio MDS-BI en GitHub.
- Meadows, D. H. (2008). *Thinking in Systems: A Primer*. Chelsea Green Publishing.
- Ley N.º 19.628 sobre Protección de la Vida Privada (Chile) y Ley N.º 21.719 que la modifica.

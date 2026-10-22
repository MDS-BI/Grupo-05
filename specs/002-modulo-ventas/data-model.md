# Modelo de Datos: Módulo de Ventas (Grupo 5)

**Estado**: Implementado en el MVP (actualizado el 20 de octubre de 2026)
**Fuente base**: `erp_data_model.md` (§4 *CRM*, §5 *Sales Module* y §9 mapa entre módulos), entregado por el equipo docente
**Diagrama**: [`docs/mer.png`](../../docs/mer.png) (verde = base del curso, naranja = nuevo, gris = otro módulo) · vista simplificada: [`docs/mer-nucleo.png`](../../docs/mer-nucleo.png) · fuente Mermaid: [`docs/mer.mmd`](../../docs/mer.mmd)

## Convenciones

- Se mantienen los **nombres de tablas y columnas del modelo ERP del curso**, para que Ventas se conecte con CRM, Inventario, Logística y Finanzas sin traducir llaves.
- **PK** = llave primaria (identifica cada fila). **FK** = llave foránea (apunta a otra tabla).
- **[Base]** = tomado tal cual del modelo del curso. **[Nuevo]** = columna o tabla que el grupo agrega **respecto del modelo del curso**, con su justificación.
- **[Externo]** = tabla de otro módulo; Ventas solo la referencia por FK y no la modifica.

## Compatibilidad con la estructura base

El MER parte del modelo ERP del curso (`erp_data_model.md`) y del template *ERP Software Base Module*. Ventas **no copia** datos de otros módulos: los referencia por llave foránea, igual que el modelo base.

**Origen de cada tabla** (colores del diagrama)

| Origen | Tablas | Sección del modelo del curso |
|---|---|---|
| **Base Ventas** (verde) | `price_lists`, `price_list_items`, `sales_quotes`, `sales_quote_lines`, `sales_orders`, `sales_order_lines`, `returns_rma`, `rma_lines` | §5 *Sales Module*: las 8 tablas, con los mismos nombres de tablas y columnas |
| **Base CRM, gestionada por Ventas** (verde) | `customers` | §4 *CRM Module*. Es verde porque Ventas la **crea y edita** (es la Entidad del template) y le agrega columnas comerciales |
| **Nueva** (naranja) | `lost_reasons`, `discount_approvals` | No existen en el modelo del curso; se justifican en §3 y §4 |
| **Otro módulo** (gris) | `employees` (RR.HH.), `addresses`, `currencies`, `tax_codes` (Core), `products` (Inventario), `opportunities` (CRM), `shipments` (Logística), `ar_invoices` (Finanzas) | §0, §1, §2, §3 y §4. Ventas solo las **lee** por FK; por eso `opportunities`, aunque es de CRM como `customers`, es gris |

**Relaciones entre módulos que respeta el MER** (numeradas como en el §9 *Cross-Module Relationship Map* del modelo del curso)

| N.º | Desde | Hacia | Significado |
|---|---|---|---|
| 17 | `customers.assigned_employee_id` | RR.HH. `employees` | Ejecutivo a cargo del cliente |
| 24, 28, 33 | `sales_quotes`, `sales_orders`, `returns_rma` `.customer_id` | CRM `customers` | A quién se cotiza, vende o devuelve |
| 25, 29 | `sales_quotes`, `sales_orders` `.opportunity_id` | CRM `opportunities` | Negocio de origen (opcional) |
| 26, 30 | `sales_quotes`, `sales_orders` `.employee_id` | RR.HH. `employees` | Vendedor |
| 27, 31, 32, 34 | líneas, `price_list_items`, `rma_lines` `.product_id` | Inventario `products` | Qué producto |
| 7 | Finanzas `ar_invoices.sales_order_id` | `sales_orders` | La factura cobra un pedido |
| 14 | Logística `shipments.sales_order_id` | `sales_orders` | El despacho cumple un pedido |

La relación 47 del modelo del curso (Producción fabrica contra un pedido) no se dibuja: una ferretería mayorista revende productos y no fabrica.

**Compatibilidad con el template**: `customers` es la **Entidad** del template y el pedido de venta es su **Documento**. Cada campo del template corresponde a una columna del MER (tabla completa en §7).

**Normalización (3FN)**

- Sin grupos repetidos: las líneas viven en `sales_quote_lines` y `sales_order_lines`, no como columnas del documento.
- Sin dependencias transitivas: el nombre del producto, del vendedor o del motivo de pérdida se obtiene por FK, no se repite en cada fila.
- **Desnormalizaciones deliberadas**, cada una con su razón:
    - `unit_price` se **copia** a la línea: es el precio pactado ese día; si la lista cambia, el pedido antiguo no debe cambiar.
    - `line_total`, `subtotal`, `discount`, `tax_amount` y `total_amount` se guardan aunque se pueden calcular: así queda el monto exacto que se informó al cliente y a Finanzas, y los indicadores no recalculan miles de líneas.
    - En el MVP la línea guarda también el `sku` y el nombre del producto, porque el catálogo vive en la configuración y no en una tabla con historial.

**Historias de usuario → tablas** (historias en [`spec.md`](spec.md))

| Historia | Tablas |
|---|---|
| HU1 Registrar clientes con RUT | `customers`, `employees` |
| HU2 Cotizar con lista de precios | `sales_quotes`, `sales_quote_lines`, `price_lists`, `price_list_items`, `products` |
| HU3 Confirmar respetando el crédito | `sales_orders`, `sales_order_lines`, `customers.credit_limit` |
| HU4 Aprobar descuentos altos | `discount_approvals`, `employees` |
| HU5 Registrar por qué se pierde una venta | `lost_reasons`, `sales_quotes` |
| HU6 Ver indicadores | agregados de `sales_orders`, `sales_order_lines`, `products.standard_cost` |
| HU7 Buscar clientes y sus pedidos | `customers`, `sales_orders` |
| HU8 Respaldar y demostrar | todas las anteriores (exportar/importar) |

## Qué tabla responde qué pregunta

| Pregunta del negocio | Tabla |
|---|---|
| ¿A quién le vendemos y con qué condiciones de crédito? | `customers` |
| ¿A qué precio vendemos cada producto? | `price_lists`, `price_list_items` |
| ¿Qué le ofrecimos al cliente? | `sales_quotes`, `sales_quote_lines` |
| ¿Por qué perdimos una cotización? | `lost_reasons` **[Nuevo]** |
| ¿Qué nos compró, cuánto y con qué descuento? | `sales_orders`, `sales_order_lines` |
| ¿Quién pidió y quién autorizó un descuento grande? | `discount_approvals` **[Nuevo]** |
| ¿Qué nos devolvieron y por qué? | `returns_rma`, `rma_lines` |

## Cadena de documentos (flujo del módulo)

```
Cotización (sales_quotes) ──aceptada──▶ Pedido (sales_orders) ──┬──▶ Despacho (Logística: shipments)
   │            │                              │                 └──▶ Factura (Finanzas: ar_invoices)
   │            └─ descuento > 10 % ─▶ discount_approvals                     │
   └─ perdida ─▶ lost_reasons                   └──────────▶ Devolución (returns_rma)
```

El despacho y la factura apuntan los dos al pedido (`sales_order_id`), no uno al otro.

**Estados y transiciones implementados** (`src/profiles/ventas.js`)

| Estado actual | Puede pasar a | Comentario |
|---|---|---|
| `cotización` | `enviada`, `confirmado`, `perdida`, `anulado` | Se puede confirmar sin enviarla (venta en mesón) |
| `enviada` | `confirmado`, `perdida`, `anulado` | |
| `confirmado` | `despachado`, `anulado` | Exige crédito disponible y, si corresponde, descuento aprobado |
| `despachado` | `facturado` | Ya salió mercadería: no se anula; se corrige con una devolución (`returns_rma`) |
| `perdida`, `facturado`, `anulado` | — | Estados finales |

Un documento nuevo puede nacer como `cotización` o, si es una venta directa sin cotización previa, como `confirmado` (en el modelo del curso `sales_orders.quote_id` es opcional). Las cotizaciones abiertas (`cotización`, `enviada`) se pueden borrar; un documento en cualquier otro estado **no se borra**, y un cliente con documentos cerrados tampoco.

---

## 1. Clientes

### `customers` [Base CRM + columnas nuevas]
Es la **Entidad** del template. Pertenece al módulo CRM, pero Ventas no funciona sin ella, así que el MVP la gestiona.

| Columna | Tipo | Llave | Descripción | Por qué existe |
|---|---|---|---|---|
| customer_id | INT | PK | Identificador interno | Lo usan cotizaciones, pedidos y devoluciones |
| address_id | INT | FK → addresses [Externo] | Dirección | Despacho y facturación |
| assigned_employee_id | INT | FK → employees [Externo] | Ejecutivo de ventas asignado | Cartera por vendedor (relación 17) |
| customer_code | VARCHAR | **[Nuevo]** | Código interno (ej. CLI-001) | Lo exige el template; se usa en búsquedas y documentos |
| customer_name | VARCHAR | | Razón social o nombre | Identificación |
| tax_id | VARCHAR | **[Nuevo]** | RUT | Obligatorio para facturar en Chile; se valida el dígito verificador |
| email / phone | VARCHAR | | Contacto | Enviar cotizaciones |
| segment | VARCHAR | **[Nuevo]** | Texto libre (ej. Empresa, Contratista) | Analizar ventas y descuentos por segmento |
| credit_limit | DECIMAL | **[Nuevo]** | Crédito máximo autorizado (CLP) | Bloquear pedidos que lo superen |
| payment_terms | VARCHAR | **[Nuevo]** | Texto (ej. Contado, Neto 30) | Condición por defecto de los pedidos |
| next_contact_date | DATE | **[Nuevo]** | Próximo contacto comercial | Seguimiento de la cartera |
| notes | TEXT | **[Nuevo]** | Observaciones | Contexto para el vendedor |
| customer_since | DATE | | Fecha de alta | Antigüedad del cliente |

Validaciones: código, nombre y RUT obligatorios; RUT único y con dígito verificador válido; `credit_limit ≥ 0`; email con formato válido.

**Quién fija el crédito:** el `credit_limit` lo define la jefatura de ventas (en producción, con Administración), según cómo ha pagado el cliente (dato que en producción entrega el módulo de Finanzas; fuera del alcance de este MVP). Nunca según ubicación ni atributos personales. En el MVP se escribe a mano en la ficha del cliente.

> En el template, `code`, `taxId`, `creditLimit`, `paymentTerms`, `category`, `targetDate` y `description` ya existen como campos base de la Entidad; en Ventas solo cambian de nombre en la interfaz.

---

## 2. Precios

### `price_lists` [Base]
**Por qué existe:** agrupa precios con una vigencia y una moneda. Permite tener una lista por temporada sin tocar los productos.

| Columna | Tipo | Llave | Descripción |
|---|---|---|---|
| price_list_id | INT | PK | Identificador |
| currency_code | VARCHAR(3) | FK → currencies [Externo] | Moneda (CLP) |
| price_list_name | VARCHAR | | Ej. "Lista general 2026" |
| valid_from / valid_to | DATE | | Vigencia (`valid_to ≥ valid_from`) |

### `price_list_items` [Base]
**Por qué existe:** es el precio de **un** producto en **una** lista. Separar el precio del producto evita duplicar productos cuando cambia el precio.

| Columna | Tipo | Llave | Descripción |
|---|---|---|---|
| price_list_item_id | INT | PK | Identificador |
| price_list_id | INT | FK → price_lists | Lista |
| product_id | INT | FK → products [Externo, Inventario] | Producto |
| unit_price | DECIMAL | | Precio neto unitario (> 0) |

El precio de la lista se **copia** a la línea de la cotización o pedido; así, si la lista cambia mañana, los documentos antiguos no se alteran. En el MVP hay una sola lista vigente.

---

## 3. Cotizaciones

### `sales_quotes` [Base + columnas nuevas]
**Por qué existe:** registra lo que se **ofreció**, se gane o no. Sin cotizaciones no se puede medir la conversión ni estudiar las ventas perdidas.

| Columna | Tipo | Llave | Descripción | Por qué existe |
|---|---|---|---|---|
| quote_id | INT | PK | Identificador | |
| customer_id | INT | FK → customers | Cliente | A quién se cotiza (relación 24) |
| opportunity_id | INT | FK → opportunities [Externo, CRM] | Oportunidad de negocio | Opcional; une Ventas con el embudo del CRM |
| employee_id | INT | FK → employees [Externo] | Vendedor | Desempeño por vendedor |
| price_list_id | INT | FK → price_lists **[Nuevo]** | Lista usada | Saber qué precio se ofreció |
| lost_reason_id | INT | FK → lost_reasons **[Nuevo]** | Motivo de pérdida | Obligatorio si `status = perdida` |
| currency_code | VARCHAR(3) | FK → currencies [Externo] **[Nuevo]** | Moneda (CLP) | El cliente sabe en qué moneda se le ofrece |
| series | VARCHAR | **[Nuevo]** | Serie del documento (ej. NV) | Número visible; `UNIQUE(series, folio)` |
| folio | INT | **[Nuevo]** | Correlativo dentro de la serie | Identificar la cotización al hablar con el cliente |
| quote_date | DATE | | Fecha de emisión | Medir tiempos de respuesta |
| expiry_date | DATE | | Vigencia (`≥ quote_date`) | Hasta cuándo vale el precio ofrecido |
| payment_terms | VARCHAR | **[Nuevo]** | Condición de pago ofrecida | Se copia al pedido si se acepta |
| status | VARCHAR | | `cotización`, `enviada`, `aceptada`, `perdida`, `anulada` | Embudo de ventas; `aceptada` = se convirtió en pedido |
| subtotal / discount / tax_amount / total_amount | DECIMAL | **[Nuevo]** | Montos ofrecidos (mismas fórmulas del pedido) | Comparar lo cotizado con lo vendido y medir la conversión en pesos |
| notes | TEXT | **[Nuevo]** | Observaciones | Condiciones especiales de la oferta |

### `sales_quote_lines` [Base + columna nueva]
**Por qué existe:** una cotización tiene varios productos; cada uno es una fila (1FN).

| Columna | Tipo | Llave | Descripción |
|---|---|---|---|
| quote_line_id | INT | PK | Identificador |
| quote_id | INT | FK → sales_quotes | Cotización |
| product_id | INT | FK → products [Externo] | Producto |
| quantity | INT | | Unidades (entero > 0; en el modelo del curso es DECIMAL, aquí se venden unidades enteras) |
| unit_price | DECIMAL | | Precio copiado de la lista |
| discount_pct | DECIMAL | **[Nuevo]** | Descuento de la línea, 0 a 100 %; sin él no se puede controlar el descuento |
| line_total | DECIMAL | **[Nuevo]** | quantity · unit_price · (1 − discount_pct/100) |

### `lost_reasons` [Nuevo]
**Por qué existe:** si solo se guardan las ventas ganadas, cualquier análisis sufre **sesgo de supervivencia**: se estudia a quienes compraron y se ignora por qué el resto no lo hizo. Una lista cerrada de motivos permite contarlos y saber si se pierde por precio, plazo, falta de stock o competencia.

| Columna | Tipo | Llave | Descripción |
|---|---|---|---|
| lost_reason_id | INT | PK | Identificador |
| reason_name | VARCHAR | | Precio, plazo de entrega, sin stock, competencia, otro |

---

## 4. Pedidos de venta (el corazón del módulo)

### `sales_orders` [Base + columnas nuevas]
**Por qué existe:** es el compromiso de venta. Es el **Documento** del template y la tabla que Logística (despachos) y Finanzas (facturas) usan para cumplir y cobrar.

| Columna | Tipo | Llave | Descripción | Por qué existe |
|---|---|---|---|---|
| sales_order_id | INT | PK | Identificador; se muestra como serie + folio (NV-1001) | |
| customer_id | INT | FK → customers | Cliente | Comprador (relación 28) |
| employee_id | INT | FK → employees [Externo] | Vendedor | Comisiones y desempeño |
| opportunity_id | INT | FK → opportunities [Externo] | Oportunidad | Opcional |
| quote_id | INT | FK → sales_quotes | Cotización de origen | Opcional (venta directa); trazabilidad y conversión |
| price_list_id | INT | FK → price_lists **[Nuevo]** | Lista usada | Auditar precios |
| currency_code | VARCHAR(3) | FK → currencies [Externo] **[Nuevo]** | Moneda (CLP) | Finanzas factura en la moneda del pedido |
| series / folio | VARCHAR / INT | **[Nuevo]** | Número visible (NV-1001); `UNIQUE(series, folio)` | Nadie confunde dos pedidos; se valida en el MVP |
| order_date | DATE | | Fecha del pedido | Ventas por mes |
| delivery_date | DATE | **[Nuevo]** | Fecha de entrega comprometida | Logística planifica el despacho |
| payment_terms | VARCHAR | **[Nuevo]** | Condición de pago del pedido (por defecto, la del cliente) | Finanzas calcula el vencimiento |
| status | VARCHAR | | `confirmado`, `despachado`, `facturado`, `anulado` | Ciclo de vida (ver transiciones) |
| subtotal | DECIMAL | **[Nuevo]** | Σ cantidad × precio (bruto) | Desglose para la factura |
| discount | DECIMAL | **[Nuevo]** | Σ descuentos de línea | Control de descuentos |
| tax_amount | DECIMAL | **[Nuevo]** | IVA sobre el neto | Obligación tributaria |
| total_amount | DECIMAL | | subtotal − discount + tax_amount | Monto a cobrar y a comparar con el crédito |
| notes | TEXT | **[Nuevo]** | Observaciones (ej. horario de entrega) | Comunicación con Logística |

### `sales_order_lines` [Base + columnas nuevas]
**Por qué existe:** cada producto vendido es una fila; Logística despacha y Finanzas factura por línea.

| Columna | Tipo | Llave | Descripción |
|---|---|---|---|
| sales_order_line_id | INT | PK | Identificador |
| sales_order_id | INT | FK → sales_orders | Pedido |
| product_id | INT | FK → products [Externo] | Producto |
| tax_code_id | INT | FK → tax_codes [Externo] **[Nuevo]** | Impuesto de la línea. Hoy todo lleva IVA 19 % (fijo en el perfil); la columna deja lista la venta de productos exentos |
| quantity | INT | | Unidades (entero > 0; en el modelo del curso es DECIMAL, aquí se venden unidades enteras) |
| unit_price | DECIMAL | | Precio unitario copiado de la lista |
| discount_pct | DECIMAL | **[Nuevo]** | Descuento de la línea, 0 a 100 % |
| line_total | DECIMAL | **[Nuevo]** | quantity · unit_price · (1 − discount_pct/100) |

**Fórmulas del pedido** (implementadas en `src/sales/sales-logic.js`, redondeo a pesos)

- `line_total = quantity × unit_price × (1 − discount_pct / 100)`
- `subtotal = Σ quantity × unit_price` (bruto, antes de descuentos)
- `discount = Σ quantity × unit_price × discount_pct / 100` (nunca supera el subtotal)
- `tax_amount = (subtotal − discount) × tax_rate` (tax_rate = 0,19 para IVA)
- `total_amount = subtotal − discount + tax_amount`

Ejemplo: 10 unidades a $4.990 con 5 % de descuento → subtotal $49.900; descuento $2.495; neto $47.405; IVA $9.007; total **$56.412**.

**Reglas de negocio**

- Un pedido que ya no está abierto **no cambia sus líneas** y **no se borra**; si corresponde, se anula y queda en la historia.
- No se puede confirmar si el total supera el **crédito disponible** = `credit_limit` − pedidos `confirmado` y `despachado` del cliente. Al facturarse, la deuda pasa a cuentas por cobrar de Finanzas (`ar_invoices`); en el MVP esa deuda no se descuenta, porque Finanzas no está implementado (riesgo anotado en `docs/riesgos-y-sesgos.md`).
- Si alguna línea tiene un descuento **> 10 %**, el vendedor debe escribir el motivo y el documento no se puede confirmar hasta que el jefe de ventas lo apruebe en `discount_approvals`.

### `discount_approvals` [Nuevo]
**Por qué existe:** los descuentos los decide cada vendedor, y si su comisión depende del volumen vendido, tiene incentivo a descontar de más. Esto es **suboptimización** (Meadows): una parte maximiza su meta (volumen) y perjudica la meta del sistema (margen). Además, los descuentos discrecionales pueden tratar distinto a clientes parecidos (sesgo). Exigir aprobación con motivo deja registro y permite revisarlo.

La aprobación se pide **antes** de confirmar, cuando el documento todavía es cotización; por eso apunta a `sales_quotes` y, al confirmarse, también al pedido.

| Columna | Tipo | Llave | Descripción |
|---|---|---|---|
| approval_id | INT | PK | Identificador |
| quote_id | INT | FK → sales_quotes | Cotización donde se pidió el descuento |
| sales_order_id | INT | FK → sales_orders | Pedido que hereda la aprobación (vacío hasta confirmar) |
| requested_by | INT | FK → employees [Externo] | Vendedor que lo pide |
| approved_by | INT | FK → employees [Externo] | Jefe de ventas que decide (vacío mientras está pendiente) |
| discount_pct | DECIMAL | | Descuento solicitado |
| reason | VARCHAR | | Motivo obligatorio (volumen, cliente estratégico, liquidación…) |
| decision | VARCHAR | | `pendiente` → `aprobado` / `rechazado` |
| requested_at | DATETIME | | Cuándo se pidió |
| decided_at | DATETIME | | Cuándo se decidió |

**Límite del MVP:** el "jefe/a" es un perfil simulado con un selector y `approved_by` guarda el nombre del perfil, no una persona autenticada. Con inicio de sesión real, `approved_by` y `requested_by` serán el `employee_id` de quien actuó.

---

## 5. Devoluciones (fuera del MVP)

### `returns_rma` y `rma_lines` [Base]
**Por qué existen:** un pedido despachado ya no se anula; si el cliente devuelve productos, se registra una devolución que apunta al pedido. Están en el MER para que el ciclo quede completo; la pantalla queda para una versión futura.

| Tabla.Columna | Tipo | Llave | Descripción |
|---|---|---|---|
| returns_rma.rma_id | INT | PK | Identificador |
| returns_rma.sales_order_id | INT | FK → sales_orders | Pedido devuelto (debe estar despachado o facturado) |
| returns_rma.customer_id | INT | FK → customers | Cliente (el mismo del pedido) |
| returns_rma.rma_date | DATE | | Fecha |
| returns_rma.reason | VARCHAR | | Producto dañado, error de despacho, no corresponde |
| returns_rma.status | VARCHAR | | `solicitada → aprobada → recibida` / `rechazada` |
| rma_lines.rma_line_id | INT | PK | Identificador |
| rma_lines.rma_id | INT | FK → returns_rma | Devolución |
| rma_lines.product_id | INT | FK → products | Producto (debe estar en el pedido) |
| rma_lines.quantity | INT | | Unidades enteras (> 0 y ≤ las vendidas; DECIMAL en el modelo del curso) |

---

## 6. Tablas de otros módulos que usa Ventas [Externo]

En el MER se dibujan solo con las columnas que Ventas necesita. Ventas las **lee**; no las crea ni las modifica.

| Tabla (módulo) | Columnas usadas | Para qué la usa Ventas |
|---|---|---|
| `employees` (RR.HH.) | `employee_id`, `first_name`, `last_name` | Vendedor, ejecutivo asignado, quién pide y quién aprueba descuentos |
| `addresses` (Core) | `address_id`, `city` | Dirección de despacho y facturación del cliente |
| `currencies` (Core) | `currency_code`, `symbol` | Moneda de listas de precios y pedidos |
| `tax_codes` (Core) | `tax_code_id`, `tax_name`, `tax_rate` | IVA de cada línea |
| `products` (Inventario) | `product_id`, `sku`, `product_name`, `standard_cost` | Qué se vende; el costo permite calcular el margen |
| `opportunities` (CRM) | `opportunity_id`, `customer_id`, `estimated_value` | Negocio del que nace una cotización |
| `shipments` (Logística) | `shipment_id`, `sales_order_id` | Despacho de un pedido → estado `despachado` |
| `ar_invoices` (Finanzas) | `ar_invoice_id`, `sales_order_id` | Factura de un pedido → estado `facturado` |

A futuro, al confirmar un pedido se reservará stock en Inventario (`inventory_stock.quantity_reserved`).

## 7. Cómo quedó implementado en el MVP (`localStorage`)

| Tabla del MER | En el MVP | Dónde |
|---|---|---|
| `customers` | Entidad del template | clave `erp_base_module:entities` |
| `sales_quotes` + `sales_orders` | **Un solo** Documento con estado (ver transiciones) | clave `erp_base_module:documents` |
| `sales_quote_lines` / `sales_order_lines` | Arreglo `lines` dentro de cada documento (1:N anidada) | dentro del documento |
| `discount_approvals` | Lista propia, con `sales_order_id` = id del documento | clave `erp_base_module:discount_approvals` |
| `products` + `price_list_items` | Catálogo con `unitPrice` y `standardCost` | `src/profiles/ventas.js` → `sales.products` |
| `lost_reasons` | Lista cerrada (campo `motivoPerdida`) | `src/profiles/ventas.js` |
| `employees` (vendedores) | Lista cerrada de nombres (campos `vendedor` y `ejecutivo`) | `src/profiles/ventas.js` |
| `addresses`, `currencies`, `tax_codes`, `opportunities` | Dirección como texto; moneda `CLP` e IVA 19 % fijos en el perfil; sin oportunidades | — |
| `returns_rma`, `rma_lines`, `shipments`, `ar_invoices` | Fuera del MVP; los estados `despachado` y `facturado` dejan lista la conexión | — |

**Correspondencia de campos (template → MER)**

| Campo del template (etiqueta en Ventas) | Columna del MER |
|---|---|
| Cliente: `name` (Razón social) | `customers.customer_name` |
| Cliente: `code` (Código de cliente) | `customers.customer_code` |
| Cliente: `taxId` (RUT) | `customers.tax_id` |
| Cliente: `email`, `phone` | `customers.email`, `customers.phone` |
| Cliente: `address` | `customers.address_id` → `addresses` (texto en el MVP) |
| Cliente: `category` (Segmento) | `customers.segment` |
| Cliente: `targetDate` (Próximo contacto) | `customers.next_contact_date` |
| Cliente: `description` | `customers.notes` |
| Cliente: `creditLimit`, `paymentTerms` | `customers.credit_limit`, `customers.payment_terms` |
| Cliente: `ejecutivo` (campo propio) | `customers.assigned_employee_id` |
| Documento: `series` + `folio` (NV-1001) | número visible de `sales_quotes` / `sales_orders` |
| Documento: `startDate` (Fecha de emisión) | `quote_date` / `order_date` |
| Documento: `endDate` (Válida hasta / entrega) | `expiry_date` (cotización) / `delivery_date` (pedido) |
| Documento: `currency`, `paymentTerms`, `notes` | `currency_code`, `payment_terms`, `notes` de `sales_quotes` / `sales_orders` |
| Documento: `subtotal`, `discount`, `taxAmount`, `totalAmount` | columnas homónimas de `sales_quotes` / `sales_orders` |
| Documento: `quantity` (Unidades totales) | Σ `quantity` de las líneas |
| Documento: `vendedor` (campo propio) | `employee_id` |
| Documento: `status` | ver la tabla de estados siguiente |
| Documento: `motivoPerdida` (campo propio) | `sales_quotes.lost_reason_id` |
| Línea: `sku`, `name`, `quantity`, `unitPrice`, `discountPct` | `product_id` (por SKU), `quantity`, `unit_price`, `discount_pct` |

**Estados del MVP → tablas del MER**

| Estado en el MVP | Dónde queda en el MER |
|---|---|
| `cotización`, `enviada` | `sales_quotes.status` con el mismo valor (aún no hay pedido) |
| `perdida` | `sales_quotes.status = perdida` + `lost_reason_id` |
| `confirmado` | se crea `sales_orders` (`status = confirmado`, `quote_id` → la cotización) y la cotización pasa a `aceptada`; si fue venta directa, no hay cotización |
| `despachado`, `facturado` | `sales_orders.status` con el mismo valor |
| `anulado` | si nunca se confirmó: `sales_quotes.status = anulada`; si ya era pedido: `sales_orders.status = anulado` |

Contrato completo: [contracts/ventas-storage.md](contracts/ventas-storage.md).

## 8. Escalabilidad del modelo

Al pasar a una base de datos real (PostgreSQL, por ejemplo), el MVP se separa en las tablas del MER sin cambiar nombres:

1. `documents` se divide en `sales_quotes` y `sales_orders`, y `lines` pasa a `sales_quote_lines` y `sales_order_lines`.
2. Las listas del perfil pasan a `products`, `price_lists`, `price_list_items`, `employees` y `lost_reasons`.
3. Se agregan índices por `customer_id`, `status` y `order_date`, que son las columnas usadas por los filtros e indicadores.

Ver [`docs/analisis-escalabilidad.md`](../../docs/analisis-escalabilidad.md).

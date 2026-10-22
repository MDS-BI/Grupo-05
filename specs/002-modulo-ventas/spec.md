# Especificación de la Funcionalidad: Módulo de Ventas (ERP)

**Rama de la funcionalidad**: `002-modulo-ventas`
**Creada**: 2026-10-13
**Estado**: Implementada (MVP)
**Grupo**: 5 · Modelación de Sistemas 580211-1 · UdeC 2026-2
**Base**: [`specs/001-erp-base-module`](../001-erp-base-module/spec.md) (template del curso)
**Entrada**: Descripción del grupo: "Construir el módulo de Ventas de un ERP sobre el módulo base. Debe permitir registrar clientes, cotizar con una lista de precios, convertir cotizaciones en pedidos con IVA y descuentos, controlar el crédito de cada cliente, exigir aprobación para descuentos altos, registrar por qué se pierden ventas y mostrar indicadores comerciales en un panel."

## Problema

Una pyme distribuidora del Gran Concepción (caso ficticio: ~150 clientes empresa, 300 productos, 4 vendedores) gestiona sus ventas con planillas, mensajes y facturas sueltas. Eso produce:

1. **Precios inconsistentes**: cada vendedor cotiza con su propia planilla y aplica descuentos sin control.
2. **Cotizaciones sin seguimiento**: no se sabe cuáles se ganaron, cuáles se perdieron ni por qué.
3. **Riesgo de no pago**: se confirman pedidos a clientes que ya usaron todo su crédito.
4. **Decisiones sin datos**: ventas por cliente, vendedor o mes se calculan a mano y tarde.

## Solución

Un módulo de Ventas web, construido sobre el template *ERP Software Base Module*. Ofrece:

- un **maestro de clientes** con RUT validado, límite de crédito y condición de pago;
- un **documento de venta único** que nace como **cotización** y avanza a **pedido confirmado → despachado → facturado** (o termina como **perdida** o **anulado**), con líneas de producto, precio de lista, descuento por línea e IVA calculado automáticamente;
- **reglas de control**: crédito, aprobación de descuentos sobre 10 % y motivo obligatorio de pérdida;
- un **panel** con indicadores (ventas del mes, conversión, ticket, descuento y margen), aprobaciones pendientes, top de clientes, motivos de pérdida y pronóstico de ventas.

## Usuarios

| Usuario | Objetivo | Acceso |
|---|---|---|
| Vendedor/a | Cotizar rápido con precios correctos y saber si el cliente tiene crédito | Clientes, cotizaciones y pedidos; **no** ve margen ni costos; no aprueba |
| Jefe/a de ventas | Controlar descuentos y desempeño comercial | Todo, incluido margen; aprueba o rechaza descuentos |
| Administración / Facturación | Recibir pedidos completos para facturar | Pedidos confirmados (lectura) — fuera del MVP |
| Gerencia | Ver tendencia y concentración de ventas | Panel agregado — fuera del MVP |

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1: Registrar clientes con datos válidos (Prioridad: P1)

Como vendedor/a, quiero registrar clientes con su RUT, contacto, segmento, límite de crédito y condición de pago, para cotizarles sin volver a pedir sus datos.

**Por qué esta prioridad**: sin clientes no hay cotizaciones ni pedidos; un RUT inválido impide facturar.

**Prueba Independiente**: crear un cliente con RUT válido y verlo en el selector; intentar uno con dígito verificador erróneo y ver el error.

**Escenarios de Aceptación**:

1. **Dado** el formulario de cliente, **cuando** ingreso razón social, código y un RUT válido (con o sin puntos), **entonces** se guarda con el RUT formateado `12.345.678-5`.
2. **Dado** un RUT con dígito verificador incorrecto, **cuando** guardo, **entonces** el sistema lo impide y explica que el RUT no es válido.
3. **Dado** un cliente ya registrado con un RUT, **cuando** intento crear otro con el mismo RUT, **entonces** el sistema lo impide e indica qué cliente ya lo tiene.
4. **Dado** un cliente con límite de crédito, **cuando** lo selecciono para editarlo, **entonces** veo cuánto crédito ha usado y cuánto tiene disponible.

---

### Historia de Usuario 2: Cotizar con la lista de precios (Prioridad: P1)

Como vendedor/a, quiero armar una cotización eligiendo productos de la lista de precios vigente y ver al instante subtotal, descuento, IVA y total, para responder al cliente sin errores de cálculo.

**Por qué esta prioridad**: es la tarea diaria central del módulo.

**Prueba Independiente**: crear una cotización con 10 unidades de un producto de $4.990 y 5 % de descuento, y verificar subtotal $49.900, descuento $2.495, IVA $9.007 y total $56.412.

**Escenarios de Aceptación**:

1. **Dado** un nuevo pedido de venta, **cuando** abro el formulario, **entonces** aparecen la serie `NV`, el siguiente folio, la fecha de hoy, una vigencia de 15 días y el estado `cotización`.
2. **Dado** que elijo un producto, **cuando** lo selecciono, **entonces** su precio de lista se copia a la línea (y no cambia si la lista se modifica después).
3. **Dadas** varias líneas con cantidades y descuentos, **cuando** edito cualquiera, **entonces** los totales se recalculan de inmediato y no se pueden escribir a mano.
4. **Dada** una cotización sin productos o sin vendedor, **cuando** guardo, **entonces** el sistema lo impide y explica qué falta.

---

### Historia de Usuario 3: Convertir la cotización en pedido respetando el crédito (Prioridad: P1)

Como jefe/a de ventas, quiero que un pedido solo pueda confirmarse si cabe dentro del crédito disponible del cliente, para no vender a quien probablemente no pagará.

**Prueba Independiente**: con un cliente de límite $50.000, intentar confirmar un pedido de $59.381 y ver el bloqueo.

**Escenarios de Aceptación**:

1. **Dado** un cliente con límite de crédito, **cuando** confirmo un pedido cuyo total supera el crédito disponible, **entonces** el sistema lo impide e informa el disponible y el monto del pedido.
2. **Dado** que el crédito usado = suma de pedidos `confirmado` y `despachado` del cliente, **cuando** un pedido pasa a `facturado`, **entonces** deja de consumir crédito (la cobranza la gestiona Finanzas).
3. **Dado** un pedido confirmado, **cuando** intento cambiar sus productos, **entonces** el sistema lo impide; solo puede avanzar de estado o anularse.
4. **Dado** el ciclo `cotización → enviada → confirmado → despachado → facturado`, **cuando** intento un salto no permitido (p. ej., de `cotización` a `facturado`), **entonces** el sistema lo rechaza.

---

### Historia de Usuario 4: Aprobar descuentos altos (Prioridad: P1)

Como jefe/a de ventas, quiero aprobar o rechazar los descuentos de más de 10 % antes de que el pedido se confirme, para proteger el margen y tratar de forma pareja a clientes similares.

**Por qué esta prioridad**: evita la **suboptimización**, es decir, que un vendedor maximice su volumen regalando el margen de la empresa.

**Prueba Independiente**: guardar una cotización con una línea al 15 % y comprobar que aparece pendiente en el panel; confirmarla solo después de aprobarla con el perfil jefe/a.

**Escenarios de Aceptación**:

1. **Dada** una línea con descuento > 10 %, **cuando** guardo la cotización, **entonces** se crea una solicitud de aprobación con el % y el motivo escrito por el vendedor.
2. **Dada** una solicitud pendiente, **cuando** intento confirmar el pedido, **entonces** el sistema lo impide hasta que se apruebe.
3. **Dado** el perfil vendedor/a, **cuando** veo el panel, **entonces** veo la solicitud pero no los botones Aprobar/Rechazar.
4. **Dado** el perfil jefe/a, **cuando** apruebo, **entonces** queda registrado quién y cuándo, y el pedido puede confirmarse.

---

### Historia de Usuario 5: Registrar por qué se pierde una venta (Prioridad: P2)

Como jefe/a de ventas, quiero que toda cotización perdida tenga un motivo (precio, plazo, sin stock, competencia u otro), para analizar también lo que **no** vendemos y no solo lo que ganamos.

**Prueba Independiente**: marcar una cotización como `perdida` sin motivo (bloqueado) y luego con motivo (guardado); ver el conteo en el panel.

**Escenarios de Aceptación**:

1. **Dada** una cotización, **cuando** la marco como perdida sin motivo, **entonces** el sistema lo impide y explica por qué el dato importa.
2. **Dadas** cotizaciones perdidas, **cuando** abro el panel, **entonces** veo cuántas se perdieron por cada motivo.

---

### Historia de Usuario 6: Ver indicadores de ventas (Prioridad: P2)

Como jefe/a de ventas o gerente, quiero un panel con ventas del mes, cotizaciones abiertas, tasa de conversión, ticket promedio, descuento promedio, margen, top 5 clientes, concentración de Pareto y un pronóstico, para decidir con datos.

**Prueba Independiente**: cargar los datos de demostración y verificar que todos los indicadores muestran valores.

**Escenarios de Aceptación**:

1. **Dados** pedidos confirmados, **cuando** abro el panel, **entonces** veo las ventas del mes y el número de pedidos del mes.
2. **Dados** pedidos ganados y cotizaciones perdidas, **cuando** abro el panel, **entonces** la conversión = ganadas / (ganadas + perdidas).
3. **Dado** el perfil vendedor/a, **cuando** abro el panel, **entonces** no veo el margen bruto (dato sensible).
4. **Dados** al menos dos meses cerrados con ventas, **cuando** abro el panel, **entonces** veo un gráfico mensual y un pronóstico por recta de mínimos cuadrados, además del promedio móvil de 3 meses. El mes en curso se muestra, pero no entra al pronóstico por estar incompleto.

---

### Historia de Usuario 7: Buscar clientes y ver sus pedidos (Prioridad: P2)

Como vendedor/a, quiero buscar un cliente por nombre, código, RUT (con o sin puntos), correo o segmento, y ver sus pedidos con su estado, para responder consultas por teléfono.

**Escenarios de Aceptación**:

1. **Dado** un término, **cuando** escribo, **entonces** veo solo los clientes que coinciden, con sus pedidos, monto y estado.
2. **Dado** un término sin coincidencias, **cuando** busco, **entonces** veo un mensaje claro y puedo intentar de nuevo.

---

### Historia de Usuario 8: Respaldar y demostrar (Prioridad: P3)

Como jefe/a de ventas, quiero cargar datos ficticios de demostración, exportar e importar los datos en JSON y borrarlos, para presentar el módulo y no perder información al cambiar de navegador.

### Casos Límite

- Cliente sin límite de crédito: no se bloquea por crédito (se asume contado o crédito sin tope).
- Eliminación de un cliente: si solo tiene cotizaciones abiertas, se eliminan en cascada junto con sus solicitudes de aprobación (comportamiento del módulo base). Si tiene documentos en cualquier otro estado (confirmado, despachado, facturado, perdida o anulado), no se puede eliminar (FR-V17).
- Rechazo de un descuento: el vendedor puede bajar el descuento (≤ 10 % no requiere aprobación) o pedir una nueva aprobación.
- Mes en curso incompleto: no se usa para el pronóstico.
- Configuración inválida en el perfil: se muestra un aviso y se usan los valores por defecto.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-V01**: El sistema DEBE presentarse con la terminología de Ventas (Cliente, Pedido de Venta, RUT, Razón social, etc.) definida solo en el perfil de configuración.
- **FR-V02**: El sistema DEBE validar el RUT con el algoritmo módulo 11, exigirlo, guardarlo formateado e impedir RUT duplicados.
- **FR-V03**: El documento de venta DEBE tener una o más líneas con producto, cantidad entera positiva, precio unitario > 0 y descuento entre 0 y 100 %.
- **FR-V04**: El precio unitario DEBE copiarse desde la lista de precios al elegir el producto.
- **FR-V05**: El sistema DEBE calcular `subtotal = Σ cantidad × precio`, `descuento = Σ cantidad × precio × desc%`, `IVA = (subtotal − descuento) × 19 %` y `total = subtotal − descuento + IVA`, redondeando a pesos.
- **FR-V06**: Los estados DEBEN seguir el ciclo configurado y rechazar transiciones no permitidas, cualquiera sea la vía del cambio. Un documento nuevo solo puede crearse como `cotización` o `confirmado` (venta directa).
- **FR-V07**: El sistema DEBE impedir pasar a `confirmado` si el total supera el crédito disponible (límite − pedidos confirmados y despachados).
- **FR-V08**: El sistema DEBE registrar una solicitud de aprobación cuando algún descuento de línea supere el 10 %, e impedir confirmar sin una aprobación vigente por un % igual o mayor.
- **FR-V09**: Solo el perfil jefe/a de ventas DEBE poder aprobar o rechazar; la decisión guarda quién decidió (en el MVP, el perfil simulado) y cuándo.
- **FR-V10**: El sistema DEBE exigir un motivo al marcar un documento como `perdida`.
- **FR-V11**: Un documento que ya no está abierto (confirmado, despachado, facturado, perdido o anulado) NO DEBE permitir modificar sus líneas.
- **FR-V12**: El panel DEBE mostrar los indicadores de la Historia 6 y ocultar el margen al perfil vendedor/a.
- **FR-V13**: La búsqueda DEBE encontrar clientes por RUT con o sin formato, y mostrar sus pedidos con monto y estado.
- **FR-V14**: El sistema DEBE permitir cargar datos ficticios de demostración, y exportar, importar y borrar los datos. Con el perfil de Ventas, solo el jefe/a de ventas ve y usa estas acciones.
- **FR-V15**: Todo contenido ingresado por usuarios DEBE mostrarse como texto (sin interpretar HTML) para prevenir inyección de scripts.
- **FR-V16**: Todos los requisitos FR-001 a FR-039 del módulo base DEBEN seguir cumpliéndose con la configuración por defecto (sin regresiones). Con el perfil de Ventas, FR-V17 restringe el borrado en cascada.
- **FR-V17**: Solo los documentos en estado `cotización` o `enviada` se pueden eliminar. Un documento en cualquier otro estado (confirmado, despachado, facturado, perdida o anulado), o un cliente que tenga alguno, NO DEBE eliminarse: queda en la historia de ventas.
- **FR-V18**: Cuando un descuento requiere aprobación, el motivo DEBE ser obligatorio y la solicitud DEBE registrar al vendedor que la pide.

### Requisitos de Datos y Privacidad

- **DR-01**: El límite de crédito lo fija la jefatura según el historial de pago del cliente (en producción, con datos de Finanzas; en el MVP se ingresa a mano); el sistema no almacena ni usa atributos personales (edad, género, comuna de residencia de personas naturales) para decisiones comerciales.
- **DR-02**: Los datos de demostración son 100 % ficticios; no se cargan datos reales de personas en la demo.
- **DR-03**: El margen y el costo estándar son datos sensibles: en el MVP, visibles solo para el perfil jefe/a de ventas (en producción, también para gerencia).
- **DR-04**: Cada aprobación de descuento guarda el motivo (obligatorio), quién la pidió, quién decidió y cuándo (trazabilidad).

### Entidades Clave

- **Cliente** (`customers`): razón social, código, RUT, contacto, segmento, límite de crédito, condición de pago y ejecutivo asignado.
- **Pedido de Venta** (`sales_quotes` + `sales_orders` en un documento con estado): cliente, serie-folio, fechas, líneas, totales, vendedor, estado y motivo de pérdida.
- **Línea** (`sales_quote_lines` / `sales_order_lines`): producto, cantidad entera, precio unitario y % de descuento.
- **Producto / precio** (`products`, `price_list_items`): catálogo con precio de lista y costo estándar.
- **Aprobación de descuento** (`discount_approvals`): cotización o pedido, %, motivo, solicitante, decisión, aprobador y fechas.
- **Motivo de pérdida** (`lost_reasons`): lista cerrada.

Detalle completo en [data-model.md](data-model.md).

## Criterios de Éxito *(obligatorio)*

- **SC-V01**: Un vendedor crea una cotización de 3 productos en menos de 2 minutos.
- **SC-V02**: El 100 % de los documentos guardados tiene totales iguales al cálculo de sus líneas (verificado por pruebas automáticas).
- **SC-V03**: Ningún pedido confirmado supera el crédito disponible del cliente al momento de confirmarse.
- **SC-V04**: El 100 % de los pedidos confirmados con descuento > 10 % tiene una aprobación registrada.
- **SC-V05**: El 100 % de las cotizaciones perdidas tiene un motivo.
- **SC-V06**: La suite de pruebas del template (111 pruebas) sigue pasando sin regresiones.
- **SC-V07**: Cualquier persona puede ejecutar el módulo siguiendo el README en menos de 5 minutos.

## Suposiciones

- Es un MVP **solo frontend**: los datos viven en `localStorage` del navegador (un usuario, un navegador).
- Los perfiles vendedor/jefe se **simulan** con un selector; no hay inicio de sesión real.
- Cotización y pedido son el mismo documento en distintos estados (simplifica el template, que trae un solo tipo de documento).
- Hay una sola lista de precios vigente, definida en el perfil; varias listas con vigencia quedan para desarrollo futuro.
- Devoluciones (`returns_rma`), despacho real (Logística) y facturación electrónica (Finanzas/SII) quedan fuera del MVP; el estado del pedido deja lista la conexión.
- La moneda es CLP y el IVA es 19 %.

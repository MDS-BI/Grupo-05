# Especificación de la Funcionalidad: Módulo de Ventas (ERP)

**Rama de la funcionalidad**: `002-modulo-ventas`
**Creada**: 2026-10-13
**Actualizada**: 2026-10-26 (historias de usuario, feedback del avance 01) y 2026-11-03 (modificaciones e incremental, feedback del avance 02)
**Estado**: MVP implementado (US-01 a US-08) · Iteración 2 en curso, del 3 al 16 de noviembre (modificaciones M-01 a M-06 y nuevas US-09, US-10 y US-12)
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
| Administración / Facturación | Recibir pedidos completos para facturar | Pedidos confirmados (lectura), fuera del MVP |
| Gerencia | Ver tendencia y concentración de ventas | Panel agregado, fuera del MVP |

## Historias de Usuario (US)

Escribimos cada historia con el formato **"Como [usuario], quiero [acción], para [beneficio]"**. Cada una tiene sus criterios de aceptación (cómo sabemos que está lista), una prioridad (P1 = imprescindible, P2 = importante, P3 = deseable), las tablas del MER que toca y la persona del grupo que la tiene a cargo. Las tareas de [`tasks.md`](tasks.md) se generan a partir de estas historias, así que cada tarea queda marcada con su US (o con su código M-xx si es una modificación).

### Resumen

| US | Historia (corta) | Usuario | Prioridad | Iteración | Estado |
|---|---|---|---|---|---|
| US-01 | Registrar clientes con RUT válido | Vendedor/a | P1 | 1 (MVP) | Hecha |
| US-02 | Cotizar con la lista de precios | Vendedor/a | P1 | 1 (MVP) | Hecha · ajuste M-01 en la iteración 2 |
| US-03 | Confirmar pedidos solo si hay crédito | Jefe/a de ventas | P1 | 1 (MVP) | Hecha · ajustes M-02 y M-06 en la iteración 2 |
| US-04 | Aprobar descuentos sobre 10 % | Jefe/a de ventas | P1 | 1 (MVP) | Hecha · ajuste M-03 en la iteración 2 |
| US-05 | Registrar por qué se pierde una venta | Jefe/a de ventas | P2 | 1 (MVP) | Hecha · ajuste M-04 en la iteración 2 |
| US-06 | Ver indicadores y pronóstico | Jefe/a o gerente | P2 | 1 (MVP) | Hecha |
| US-07 | Buscar clientes y ver sus pedidos | Vendedor/a | P2 | 1 (MVP) | Hecha · ajuste M-05 en la iteración 2 |
| US-08 | Datos de demostración y respaldo | Jefe/a de ventas | P3 | 1 (MVP) | Hecha |
| US-09 | Mantener la lista de precios | Jefe/a de ventas | P1 | 2 (3 – 16 nov) | En curso |
| US-10 | Ver cotizaciones por vencer y vencidas | Vendedor/a | P1 | 2 (3 – 16 nov) | En curso |
| US-11 | Enviar la cotización al cliente | Vendedor/a | P2 | 3 (17 – 29 nov) | Pendiente |
| US-12 | Ver el historial de estados de un pedido | Jefe/a de ventas | P2 | 2 (3 – 16 nov) | En curso |
| US-13 | Fijar metas mensuales por vendedor | Jefe/a de ventas | P3 | 3 (17 – 29 nov) | Pendiente |
| US-14 | Ver el stock antes de confirmar | Vendedor/a | P3 | 3 (17 – 29 nov) | Pendiente |

### Iteración 2 (3 – 16 nov): modificaciones e incremental

En el avance 02 (2 de noviembre) el profe revisó el módulo en local y no encontró errores de funcionamiento. Nos pidió proponer **modificaciones** (ajustes a lo que ya funciona) e **incremental** (funcionalidad nueva), registrarlas en este spec y dividir el grupo en dos. La versión integrada se junta en `main` el **lunes 16 de noviembre**.

Para armar la lista de modificaciones usamos la app con los datos de demostración, con los dos perfiles, y anotamos lo que confundía o faltaba. No son errores que rompan algo: son cosas que un vendedor real notaría el primer día.

| Equipo | Integrantes | Qué hace |
|---|---|---|
| Modificaciones | Pedro, Francisca y Sebastián | Ajusta las historias que ya están hechas (M-01 a M-06) |
| Incremental | Joaquín, Ezequiel y Antonio | Agrega las historias nuevas US-09, US-10 y US-12 |

Cada persona revisa el trabajo de alguien del otro equipo: Pedro ↔ Joaquín, Francisca ↔ Ezequiel y Sebastián ↔ Antonio. Así los dos equipos conocen todo el módulo, que es lo que nos pueden preguntar en la presentación.

#### Modificaciones (ajustes a historias que ya existen)

| Código | Historia | Qué vimos al usar la app | Qué cambia | Responsable |
|---|---|---|---|---|
| M-01 | US-02 | El subtotal, descuento, IVA y total del pedido salen como número suelto (`183280`), mientras que el resto de la app muestra `$183.280`. | Los montos del pedido se muestran con formato de pesos. Lo que se guarda sigue siendo un número. | Pedro |
| M-02 | US-03 | En un pedido confirmado o facturado los productos ya no se pueden cambiar, pero cantidad, precio y descuento se ven igual que un campo editable y la ✕ de quitar línea sigue a la vista. | Los campos bloqueados se ven en gris y la ✕ se oculta, para que se note que el pedido está cerrado. | Pedro |
| M-03 | US-04 | Después de pedir un descuento, al volver al pedido el campo "Motivo del descuento" aparece vacío. Si el jefe rechaza, el vendedor ve que se rechazó pero no sabe por qué. | El pedido muestra el motivo que se guardó en la solicitud. Al rechazar, el jefe escribe un comentario que el vendedor ve en el pedido. | Sebastián |
| M-04 | US-05 | El campo "Motivo de pérdida" aparece en todos los pedidos, incluso en uno facturado. | El campo aparece solo cuando el estado es `perdida`. | Francisca |
| M-05 | US-07 | En la búsqueda se ven los pedidos de cada cliente, pero no se pueden abrir, y no se puede buscar por folio. | Hacer clic en un pedido lo abre en "Pedidos de Venta", y se puede buscar por folio (por ejemplo, `NV-1037`). | Francisca |
| M-06 | US-03 | Con los datos de demostración hay 39 pedidos en un solo selector, y encontrar uno es lento. | Sobre el selector se agrega un filtro por estado y por vendedor. | Sebastián |

#### Incremental (funcionalidad nueva)

| US | Responsable | Revisa | Nota |
|---|---|---|---|
| US-09 Mantener la lista de precios | Joaquín | Pedro | La lista sale del perfil (`ventas.js`) y pasa a guardarse en `localStorage`, igual que clientes y pedidos. |
| US-10 Cotizaciones por vencer y vencidas | Ezequiel | Francisca | Usa la vigencia (`expiry_date`) que ya existe; agrega el motivo "Cotización vencida". |
| US-12 Historial de estados de un pedido | Antonio | Sebastián | Necesita la tabla nueva `sales_order_status_history`; Joaquín la agrega al MER. |

US-11, US-13 y US-14 pasan a la iteración 3 (17 – 29 nov). En dos semanas no alcanzábamos a hacer las seis historias nuevas con sus pruebas. Elegimos las dos P1 y el historial de estados, porque deja registro de quién cambió cada pedido y cuándo, igual que ya hacemos con los descuentos (DR-04); las otras tres se pueden agregar después sin cambiar lo que ya existe.

**Cómo trabajamos esta iteración**: cada persona trabaja en una rama con el código de su historia (por ejemplo, `m-01-montos` o `us-09-lista-precios`) y abre un *pull request* que revisa su pareja del otro equipo. Antes de pedir revisión, `npx vitest run` tiene que pasar entero. El viernes 6 de noviembre cada uno muestra en el grupo cómo va, y el lunes 16 queda todo unido en `main`.

---

### Historia de Usuario 1 (US-01): Registrar clientes con RUT válido (Prioridad: P1)

**Como** vendedor/a, **quiero** registrar clientes con su RUT, contacto, segmento, límite de crédito y condición de pago, **para** cotizarles sin volver a pedirles los datos.

**Por qué es P1**: sin clientes no hay cotizaciones ni pedidos, y con un RUT malo no se puede facturar.

**Tablas**: `customers`

**Criterios de aceptación**:

1. **Dado** el formulario de cliente, **cuando** ingreso razón social, código y un RUT válido (con o sin puntos), **entonces** se guarda con el RUT formateado `12.345.678-5`.
2. **Dado** un RUT con dígito verificador incorrecto, **cuando** guardo, **entonces** el sistema no lo deja y explica que el RUT no es válido.
3. **Dado** un cliente ya registrado con un RUT, **cuando** intento crear otro con el mismo RUT, **entonces** el sistema no lo deja e indica qué cliente ya lo tiene.
4. **Dado** un cliente con límite de crédito, **cuando** lo abro para editarlo, **entonces** veo cuánto crédito ha usado y cuánto le queda.

**Cómo lo probamos**: creamos un cliente con RUT válido y lo vemos en el selector; después intentamos uno con el dígito verificador malo y aparece el error.

---

### Historia de Usuario 2 (US-02): Cotizar con la lista de precios (Prioridad: P1)

**Como** vendedor/a, **quiero** armar una cotización eligiendo productos de la lista de precios y ver al tiro el subtotal, descuento, IVA y total, **para** responderle al cliente sin errores de cálculo.

**Por qué es P1**: es lo que más se hace en el día a día del área.

**Tablas**: `sales_quotes`, `sales_quote_lines`, `price_list_items`

**Criterios de aceptación**:

1. **Dado** un pedido de venta nuevo, **cuando** abro el formulario, **entonces** aparecen la serie `NV`, el siguiente folio, la fecha de hoy, una vigencia de 15 días y el estado `cotización`.
2. **Dado** que elijo un producto, **cuando** lo selecciono, **entonces** su precio de lista se copia a la línea y no cambia aunque después se modifique la lista.
3. **Dadas** varias líneas con cantidades y descuentos, **cuando** edito cualquiera, **entonces** los totales se recalculan de inmediato y no se pueden escribir a mano.
4. **Dada** una cotización sin productos o sin vendedor, **cuando** guardo, **entonces** el sistema no la guarda y dice qué falta.
5. **Ajuste M-01 (iteración 2)**: **Dado** un pedido con líneas, **cuando** veo el subtotal, descuento, IVA y total, **entonces** aparecen con formato de pesos (`$56.412`).

**Cómo lo probamos**: 10 unidades de un producto de $4.990 con 5 % de descuento tienen que dar subtotal $49.900, descuento $2.495, IVA $9.007 y total $56.412.

---

### Historia de Usuario 3 (US-03): Confirmar pedidos solo si hay crédito (Prioridad: P1)

**Como** jefe/a de ventas, **quiero** que un pedido solo se pueda confirmar si cabe en el crédito disponible del cliente, **para** no venderle a alguien que probablemente no va a pagar.

**Tablas**: `sales_orders`, `customers`

**Criterios de aceptación**:

1. **Dado** un cliente con límite de crédito, **cuando** confirmo un pedido cuyo total supera el crédito disponible, **entonces** el sistema no lo deja y muestra el disponible y el monto del pedido.
2. **Dado** que el crédito usado es la suma de los pedidos `confirmado` y `despachado` del cliente, **cuando** un pedido pasa a `facturado`, **entonces** deja de ocupar crédito (la cobranza la ve Finanzas).
3. **Dado** un pedido confirmado, **cuando** intento cambiarle los productos, **entonces** el sistema no lo deja; solo puede avanzar de estado o anularse.
4. **Dado** el ciclo `cotización → enviada → confirmado → despachado → facturado`, **cuando** intento un salto que no corresponde (por ejemplo, de `cotización` a `facturado`), **entonces** el sistema lo rechaza.
5. **Ajuste M-02 (iteración 2)**: **Dado** un pedido confirmado, despachado o facturado, **cuando** lo abro, **entonces** los campos de productos se ven en gris y no aparece la ✕ para quitar líneas.
6. **Ajuste M-06 (iteración 2)**: **Dados** muchos pedidos, **cuando** elijo un estado o un vendedor en el filtro, **entonces** el selector muestra solo esos pedidos.

**Cómo lo probamos**: con un cliente de límite $50.000 intentamos confirmar un pedido de $59.381 y tiene que salir el bloqueo.

---

### Historia de Usuario 4 (US-04): Aprobar descuentos sobre 10 % (Prioridad: P1)

**Como** jefe/a de ventas, **quiero** aprobar o rechazar los descuentos de más de 10 % antes de que se confirme el pedido, **para** cuidar el margen y tratar parecido a clientes parecidos.

**Por qué es P1**: evita la **suboptimización**, o sea, que un vendedor suba su volumen regalando el margen de la empresa.

**Tablas**: `discount_approvals`, `sales_order_lines`

**Criterios de aceptación**:

1. **Dada** una línea con descuento mayor a 10 %, **cuando** guardo la cotización, **entonces** se crea una solicitud de aprobación con el % y el motivo que escribió el vendedor (el motivo es obligatorio).
2. **Dada** una solicitud pendiente, **cuando** intento confirmar el pedido, **entonces** el sistema no lo deja hasta que se apruebe.
3. **Dado** el perfil vendedor/a, **cuando** veo el panel, **entonces** veo la solicitud pero no los botones Aprobar/Rechazar.
4. **Dado** el perfil jefe/a, **cuando** apruebo, **entonces** queda registrado quién y cuándo, y el pedido ya se puede confirmar.
5. **Ajuste M-03 (iteración 2)**: **Dado** un pedido con una solicitud de descuento, **cuando** lo abro, **entonces** veo el motivo que se guardó. **Dado** el perfil jefe/a, **cuando** rechazo, **entonces** tengo que escribir un comentario, y el vendedor lo ve en el pedido.

**Cómo lo probamos**: guardamos una cotización con una línea al 15 %, revisamos que aparezca pendiente en el panel y la confirmamos solo después de aprobarla con el perfil jefe/a.

---

### Historia de Usuario 5 (US-05): Registrar por qué se pierde una venta (Prioridad: P2)

**Como** jefe/a de ventas, **quiero** que toda cotización perdida tenga un motivo (precio, plazo, sin stock, competencia u otro), **para** analizar también lo que **no** vendemos y no solo lo que ganamos.

**Tablas**: `sales_quotes`, `lost_reasons`

**Criterios de aceptación**:

1. **Dada** una cotización, **cuando** la marco como perdida sin motivo, **entonces** el sistema no lo deja y explica por qué el dato importa.
2. **Dadas** varias cotizaciones perdidas, **cuando** abro el panel, **entonces** veo cuántas se perdieron por cada motivo.
3. **Ajuste M-04 (iteración 2)**: **Dado** un pedido en cualquier estado distinto de `perdida`, **cuando** lo abro, **entonces** no aparece el campo "Motivo de pérdida".

**Cómo lo probamos**: marcamos una cotización como `perdida` sin motivo (bloqueado) y después con motivo (se guarda), y revisamos el conteo en el panel.

---

### Historia de Usuario 6 (US-06): Ver indicadores y pronóstico (Prioridad: P2)

**Como** jefe/a de ventas o gerente, **quiero** un panel con ventas del mes, cotizaciones abiertas, tasa de conversión, ticket promedio, descuento promedio, margen, top 5 de clientes, concentración de Pareto y un pronóstico, **para** decidir con datos y no a ojo.

**Tablas**: `sales_orders`, `sales_order_lines`, `sales_quotes` (solo lectura, agregados)

**Criterios de aceptación**:

1. **Dados** pedidos confirmados, **cuando** abro el panel, **entonces** veo las ventas del mes y el número de pedidos del mes.
2. **Dados** pedidos ganados y cotizaciones perdidas, **cuando** abro el panel, **entonces** la conversión es ganadas / (ganadas + perdidas).
3. **Dado** el perfil vendedor/a, **cuando** abro el panel, **entonces** no veo el margen bruto (es un dato sensible).
4. **Dados** al menos dos meses cerrados con ventas, **cuando** abro el panel, **entonces** veo un gráfico mensual, un pronóstico por mínimos cuadrados y el promedio móvil de 3 meses. El mes en curso se muestra, pero no entra al pronóstico porque está incompleto.

**Cómo lo probamos**: cargamos los datos de demostración y revisamos que todos los indicadores tengan valor.

---

### Historia de Usuario 7 (US-07): Buscar clientes y ver sus pedidos (Prioridad: P2)

**Como** vendedor/a, **quiero** buscar un cliente por nombre, código, RUT (con o sin puntos), correo o segmento y ver sus pedidos con su estado, **para** responder rápido cuando un cliente llama.

**Tablas**: `customers`, `sales_orders`

**Criterios de aceptación**:

1. **Dado** un término, **cuando** escribo, **entonces** veo solo los clientes que coinciden, con sus pedidos, monto y estado.
2. **Dado** un término sin coincidencias, **cuando** busco, **entonces** aparece un mensaje claro y puedo intentar de nuevo.
3. **Ajuste M-05 (iteración 2)**: **Dado** un cliente con pedidos en los resultados, **cuando** hago clic en uno, **entonces** se abre en "Pedidos de Venta". **Dado** un folio como `NV-1037`, **cuando** lo busco, **entonces** aparece el cliente de ese pedido.

---

### Historia de Usuario 8 (US-08): Datos de demostración y respaldo (Prioridad: P3)

**Como** jefe/a de ventas, **quiero** cargar datos ficticios de demostración, exportar e importar los datos en JSON y borrarlos, **para** mostrar el módulo y no perder la información si cambio de navegador.

**Tablas**: todas las del módulo (respaldo completo)

**Criterios de aceptación**:

1. **Dado** el perfil jefe/a, **cuando** cargo la demo, **entonces** aparecen clientes, cotizaciones y pedidos ficticios en varios estados y meses.
2. **Dado** el perfil jefe/a, **cuando** exporto, **entonces** se descarga un JSON que después se puede importar y deja todo igual.
3. **Dado** el perfil vendedor/a, **cuando** abro la aplicación, **entonces** no veo los botones de cargar, exportar, importar ni borrar.

---

### Historia de Usuario 9 (US-09): Mantener la lista de precios (Prioridad: P1) · Iteración 2 · Joaquín

**Como** jefe/a de ventas, **quiero** agregar productos a la lista de precios, cambiar sus precios y desactivar los que ya no vendemos, **para** que todos los vendedores coticen con el mismo precio sin tener que tocar el código.

**Por qué es P1**: hoy la lista vive dentro del perfil (`ventas.js`). Si cambia un precio hay que editar el código, y eso en una empresa real no pasa.

**Tablas**: `price_lists`, `price_list_items`, `products` [Externo, Inventario]

**Criterios de aceptación**:

1. **Dado** el perfil jefe/a, **cuando** abro "Lista de precios", **entonces** veo cada producto con su SKU, nombre, precio neto y costo, y puedo editar el precio.
2. **Dado** un precio nuevo, **cuando** guardo, **entonces** las cotizaciones y pedidos ya hechos mantienen el precio que tenían (el precio se copia a la línea, US-02).
3. **Dado** un producto desactivado, **cuando** un vendedor arma una cotización, **entonces** ese producto no aparece para elegir, pero sí sigue visible en los documentos antiguos.
4. **Dado** un precio de $0 o negativo, **cuando** guardo, **entonces** el sistema no lo deja.
5. **Dado** el perfil vendedor/a, **cuando** abro la aplicación, **entonces** puede ver los precios pero no editarlos.

---

### Historia de Usuario 10 (US-10): Ver cotizaciones por vencer y vencidas (Prioridad: P1) · Iteración 2 · Ezequiel

**Como** vendedor/a, **quiero** ver qué cotizaciones vencen en los próximos 3 días y cuáles ya vencieron, **para** llamar al cliente a tiempo y no dejar ventas botadas.

**Por qué es P1**: una cotización que vence sin que nadie la siga es justo la venta perdida que no queda registrada. Esto completa US-05.

**Tablas**: `sales_quotes` (usa `expiry_date`), `lost_reasons`

**Criterios de aceptación**:

1. **Dadas** cotizaciones abiertas (`cotización` o `enviada`), **cuando** abro el panel, **entonces** veo una lista "Por vencer" con las que vencen en 3 días o menos, ordenadas por fecha.
2. **Dada** una cotización con la vigencia pasada, **cuando** la abro, **entonces** aparece marcada como **vencida** y no se puede confirmar sin antes extender la vigencia.
3. **Dada** una cotización vencida, **cuando** decido no seguirla, **entonces** puedo marcarla como `perdida` con el motivo "Cotización vencida", que se suma a la lista de motivos.
4. **Dado** el perfil vendedor/a, **cuando** veo "Por vencer", **entonces** veo primero las mías.

---

### Historia de Usuario 11 (US-11): Enviar la cotización al cliente (Prioridad: P2) · Iteración 3

**Como** vendedor/a, **quiero** generar una versión imprimible de la cotización (o guardarla como PDF desde el navegador), **para** mandársela al cliente con un formato ordenado y no como captura de pantalla.

**Tablas**: `sales_quotes`, `sales_quote_lines`, `customers`

**Criterios de aceptación**:

1. **Dada** una cotización con líneas, **cuando** presiono "Imprimir / PDF", **entonces** se abre una vista con los datos de la empresa, el cliente (razón social y RUT), serie-folio, fecha, vigencia, líneas, descuento, IVA, total y condición de pago.
2. **Dado** el perfil vendedor/a, **cuando** imprimo, **entonces** el documento no muestra costos ni margen.
3. **Dada** una cotización en estado `cotización`, **cuando** confirmo que la envié, **entonces** pasa a `enviada`.
4. **Dada** una cotización con un descuento pendiente de aprobación, **cuando** intento imprimirla, **entonces** el sistema avisa que el precio todavía no está aprobado.

---

### Historia de Usuario 12 (US-12): Ver el historial de estados de un pedido (Prioridad: P2) · Iteración 2 · Antonio

**Como** jefe/a de ventas, **quiero** ver cuándo y quién cambió de estado cada pedido, **para** saber dónde se atrasan las ventas y tener trazabilidad si hay un reclamo.

**Tablas**: `sales_order_status_history` **[Nuevo, hay que agregarla al MER]**, `sales_orders`, `employees` [Externo]

**Criterios de aceptación**:

1. **Dado** un pedido, **cuando** cambia de estado, **entonces** se guarda el estado anterior, el nuevo, la fecha y hora y el perfil que hizo el cambio.
2. **Dado** un pedido, **cuando** lo abro, **entonces** veo su historial en orden, desde la cotización hasta el estado actual.
3. **Dado** el historial, **cuando** alguien intenta editarlo o borrarlo, **entonces** no se puede (solo se agregan registros, igual que FR-V17).
4. **Dados** varios pedidos facturados, **cuando** abro el panel, **entonces** veo cuántos días demora en promedio un pedido entre `confirmado` y `despachado`.

---

### Historia de Usuario 13 (US-13): Fijar metas mensuales por vendedor (Prioridad: P3) · Iteración 3

**Como** jefe/a de ventas, **quiero** fijar una meta de ventas mensual para cada vendedor y ver cuánto lleva cada uno, **para** saber a tiempo quién necesita apoyo antes de que termine el mes.

**Tablas**: `sales_targets` **[Nuevo, hay que agregarla al MER]**, `employees` [Externo], `sales_orders`

**Criterios de aceptación**:

1. **Dado** el perfil jefe/a, **cuando** ingreso una meta en pesos para un vendedor y un mes, **entonces** se guarda (una sola meta por vendedor y mes).
2. **Dadas** las metas del mes, **cuando** abro el panel, **entonces** veo por vendedor la meta, lo vendido (pedidos confirmados, despachados y facturados) y el % de avance.
3. **Dado** el perfil vendedor/a, **cuando** abro el panel, **entonces** veo solo su propio avance.
4. **Dado** que la meta se mide en ventas, **cuando** se muestra el avance, **entonces** al lado aparece el descuento promedio del vendedor, para que la meta no empuje a regalar margen (mismo cuidado que US-04).

---

### Historia de Usuario 14 (US-14): Ver el stock antes de confirmar (Prioridad: P3) · Iteración 3

**Como** vendedor/a, **quiero** ver el stock disponible de cada producto cuando lo agrego a la cotización, **para** no prometer algo que no hay y no perder la venta por "sin stock".

**Tablas**: `inventory_stock` [Externo, Inventario] (solo lectura), `sales_order_lines`

**Criterios de aceptación**:

1. **Dado** un producto, **cuando** lo agrego a una línea, **entonces** veo su stock disponible (en el MVP es un dato simulado en el catálogo, porque el módulo de Inventario lo hace otro grupo).
2. **Dada** una cantidad mayor al stock disponible, **cuando** la escribo, **entonces** aparece un aviso, pero igual se puede cotizar (puede llegar mercadería).
3. **Dada** una línea sin stock suficiente, **cuando** intento confirmar el pedido, **entonces** el sistema pide confirmar de nuevo y deja anotado que se confirmó sin stock.
4. **Dado** un pedido confirmado, **cuando** se guarda, **entonces** queda claro qué cantidad tendría que reservar Inventario (`quantity_reserved`), aunque en el MVP no se descuente de verdad.

---

### Casos Límite

- Cliente sin límite de crédito: no se bloquea por crédito (se asume contado o crédito sin tope).
- Eliminación de un cliente: si solo tiene cotizaciones abiertas, se eliminan en cascada junto con sus solicitudes de aprobación (comportamiento del módulo base). Si tiene documentos en cualquier otro estado (confirmado, despachado, facturado, perdida o anulado), no se puede eliminar (FR-V17).
- Rechazo de un descuento: el vendedor puede bajar el descuento (≤ 10 % no requiere aprobación) o pedir una nueva aprobación.
- Mes en curso incompleto: no se usa para el pronóstico.
- Configuración inválida en el perfil: se muestra un aviso y se usan los valores por defecto.
- Cotización que vence el mismo día que se mira: cuenta como "por vencer", no como vencida (US-10).
- Producto desactivado que está en una cotización abierta: la cotización se puede seguir trabajando, pero no se puede agregar otra línea con ese producto (US-09).
- Vendedor sin meta en el mes: aparece en el panel con "sin meta" en vez de 0 % (US-13).

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

**Requisitos incrementales** (US-09 a US-14; US-09, US-10 y US-12 en la iteración 2, el resto en la iteración 3):

- **FR-V19** (US-09): Solo el perfil jefe/a de ventas DEBE poder crear, editar y desactivar productos y precios de la lista. Un precio DEBE ser mayor que 0. Un producto desactivado no se ofrece en documentos nuevos, pero se mantiene en los antiguos.
- **FR-V20** (US-10): El sistema DEBE marcar como vencida toda cotización abierta cuya vigencia ya pasó, e impedir confirmarla sin extender la vigencia. El motivo "Cotización vencida" DEBE agregarse a la lista de motivos de pérdida.
- **FR-V21** (US-11): El sistema DEBE generar una vista imprimible de la cotización sin costos ni margen, y avisar si tiene un descuento sin aprobar.
- **FR-V22** (US-12): Cada cambio de estado de un documento DEBE guardarse en un historial que solo admite agregar registros (estado anterior, estado nuevo, fecha y perfil).
- **FR-V23** (US-13): El sistema DEBE permitir una meta mensual por vendedor y mostrar el avance; el vendedor/a ve solo la suya.
- **FR-V24** (US-14): El sistema DEBE mostrar el stock disponible al agregar un producto y advertir (sin bloquear la cotización) cuando la cantidad lo supera.

**Requisitos de las modificaciones** (iteración 2):

- **FR-V25** (M-01): Todos los montos del documento DEBEN mostrarse con formato de pesos chilenos; el valor guardado sigue siendo numérico.
- **FR-V26** (M-02): Los campos de un documento cerrado DEBEN verse deshabilitados, sin la opción de quitar líneas.
- **FR-V27** (M-03): El documento DEBE mostrar el motivo de su última solicitud de descuento. Rechazar una solicitud DEBE exigir un comentario, que queda guardado con la decisión y lo ve el vendedor.
- **FR-V28** (M-04): El motivo de pérdida DEBE pedirse y mostrarse solo cuando el estado es `perdida`.
- **FR-V29** (M-05): La búsqueda DEBE encontrar clientes por el folio de sus pedidos, y cada pedido de los resultados DEBE abrirse al hacer clic.
- **FR-V30** (M-06): La lista de documentos DEBE poder filtrarse por estado y por vendedor.

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
- **SC-V08** (US-10): Ninguna cotización vencida queda abierta más de 7 días sin que alguien la extienda o la marque como perdida.
- **SC-V09** (US-12): El 100 % de los cambios de estado hechos desde la segunda iteración queda en el historial.

## Suposiciones

- Es un MVP **solo frontend**: los datos viven en `localStorage` del navegador (un usuario, un navegador).
- Los perfiles vendedor/jefe se **simulan** con un selector; no hay inicio de sesión real.
- Cotización y pedido son el mismo documento en distintos estados (simplifica el template, que trae un solo tipo de documento).
- Hay una sola lista de precios vigente, definida en el perfil; varias listas con vigencia quedan para desarrollo futuro.
- Devoluciones (`returns_rma`), despacho real (Logística) y facturación electrónica (Finanzas/SII) quedan fuera del MVP; el estado del pedido deja lista la conexión.
- La moneda es CLP y el IVA es 19 %.

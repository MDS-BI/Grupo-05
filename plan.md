# Plan de Trabajo: Módulo de Ventas (ERP) · Grupo 5

**Asignatura**: Modelación de Sistemas 580211-1 · Universidad de Concepción · 2026-2
**Módulo asignado**: Ventas
**Actualizado**: 20 de octubre de 2026

Este plan describe **qué hace nuestro módulo de Ventas, cómo se conecta con el resto del ERP y cómo lo construimos**. El detalle técnico vive en [`specs/002-modulo-ventas/`](specs/002-modulo-ventas/): historias de usuario en [`spec.md`](specs/002-modulo-ventas/spec.md) y modelo de datos en [`data-model.md`](specs/002-modulo-ventas/data-model.md), con su diagrama en [`docs/mer.png`](docs/mer.png).

## 1. El módulo en una frase

El módulo de Ventas lleva una venta **desde la cotización hasta el pedido confirmado, despachado y facturado**. En el camino controla precios, descuentos y crédito del cliente, y registra también las ventas que se pierden.

## 2. Problema y cliente

**Cliente (caso ficticio):** una pyme distribuidora de insumos de construcción del Gran Concepción (una ferretería mayorista) que vende a constructoras y contratistas. Tiene ~150 clientes empresa, ~300 productos y 4 vendedores.

**Problema actual:** cotiza con planillas y correos, lo que produce:

| Problema | Consecuencia |
|---|---|
| Cada vendedor usa su propia planilla de precios | Precios distintos para el mismo producto y descuentos sin control |
| Las cotizaciones no se siguen | No se sabe cuáles se ganaron, cuáles se perdieron ni por qué |
| Se confirman pedidos sin revisar la deuda del cliente | Riesgo de no pago |
| Los reportes se arman a mano | Decisiones tardías y sin datos |

## 3. Usuarios y permisos

| Usuario | Qué necesita | En el MVP |
|---|---|---|
| Vendedor/a | Cotizar rápido con precios correctos y saber si el cliente tiene crédito | Implementado (perfil "Vendedor/a") |
| Jefe/a de ventas | Controlar descuentos, margen y desempeño | Implementado (perfil "Jefe/a de ventas") |
| Administración / Facturación | Recibir pedidos confirmados completos para facturar | No implementado: usará el estado `facturado` y el módulo de Finanzas |
| Gerencia | Ver tendencia, margen y concentración de ventas | No implementado: verá el mismo panel que la jefatura |

**Qué puede hacer cada perfil del MVP**

| Acción | Vendedor/a | Jefe/a de ventas |
|---|---|---|
| Crear y editar clientes, cotizaciones y pedidos | Sí | Sí |
| Eliminar cotizaciones abiertas | Sí | Sí |
| Eliminar documentos en cualquier estado distinto de `cotización` o `enviada`, o clientes que los tengan | No | No |
| Pedir un descuento sobre 10 % (con motivo obligatorio) | Sí | Sí |
| Cambiar el límite de crédito de un cliente | No (lo ve, pero no lo edita) | Sí |
| Aprobar o rechazar descuentos | No | Sí |
| Ver margen y costo | No | Sí |
| Cargar datos de demostración, exportar, importar o borrar todos los datos | No | Sí |

En el MVP los perfiles se eligen con un selector, sin contraseña, porque es solo frontend. En producción habrá inicio de sesión y cada vendedor verá solo su cartera (§9).

## 4. Historias de usuario

| # | Como… | quiero… | Tablas |
|---|---|---|---|
| HU1 | vendedor/a | registrar clientes con RUT válido y crédito | `customers` |
| HU2 | vendedor/a | cotizar con la lista de precios | `sales_quotes`, `sales_quote_lines`, `price_list_items` |
| HU3 | jefe/a de ventas | que un pedido solo se confirme si cabe en el crédito del cliente | `sales_orders`, `customers` |
| HU4 | jefe/a de ventas | aprobar los descuentos altos | `discount_approvals` |
| HU5 | jefe/a de ventas | saber por qué se pierden ventas | `lost_reasons` |
| HU6 | jefe/a o gerente | ver indicadores y un pronóstico | agregados de pedidos y líneas |
| HU7 | vendedor/a | buscar un cliente y ver sus pedidos | `customers`, `sales_orders` |
| HU8 | jefe/a de ventas | respaldar los datos y mostrar una demo | todas |

Escenarios de aceptación y requisitos (FR-V01 a FR-V18): [`spec.md`](specs/002-modulo-ventas/spec.md).

## 5. Qué hace la herramienta (funcionalidades)

| # | Funcionalidad | Regla o cálculo |
|---|---|---|
| 1 | Maestro de **clientes** | RUT con dígito verificador (módulo 11), obligatorio y sin duplicados; límite de crédito y condición de pago |
| 2 | **Cotización** con líneas de productos | El precio se copia desde la lista de precios; cantidad entera; descuento por línea entre 0 y 100 % |
| 3 | **Totales automáticos** | subtotal = Σ cantidad × precio; IVA 19 % sobre (subtotal − descuento); total = subtotal − descuento + IVA |
| 4 | **Ciclo de estados** | Ver tabla abajo; cualquier transición no permitida se rechaza |
| 5 | **Control de crédito** | No se confirma si el total supera el crédito disponible (límite − pedidos confirmados y despachados) |
| 6 | **Aprobación de descuentos** | Si una línea supera 10 %, el vendedor escribe el motivo y se crea una solicitud; solo el jefe/a la aprueba o rechaza; queda quién pidió, quién decidió y cuándo |
| 7 | **Motivo de pérdida** | Obligatorio al marcar una cotización como perdida (precio, plazo, sin stock, competencia, otro) |
| 8 | **Historia protegida** | Un pedido confirmado no cambia sus líneas y no se borra (se anula); un cliente con pedidos cerrados no se borra |
| 9 | **Panel de indicadores** | Ventas del mes, cotizaciones abiertas, conversión, ticket promedio, descuento promedio, margen (solo jefe/a), top 5 clientes, nota de Pareto, motivos de pérdida y pronóstico |
| 10 | **Búsqueda y respaldo** | Buscar por nombre o RUT (con o sin puntos); datos de demostración ficticios; exportar e importar (solo jefe/a) |

**Estados del documento**

| Estado | Puede pasar a |
|---|---|
| `cotización` | `enviada`, `confirmado` (venta directa), `perdida`, `anulado` |
| `enviada` | `confirmado`, `perdida`, `anulado` |
| `confirmado` | `despachado`, `anulado` |
| `despachado` | `facturado` (ya salió mercadería: no se anula, se corrige con una devolución) |
| `perdida`, `facturado`, `anulado` | Estados finales |

Un documento nuevo solo puede crearse como `cotización` o `confirmado` (venta directa); los demás estados se alcanzan avanzando el documento. En el MER, la cotización que se convierte en pedido queda `aceptada` y la anulada antes de confirmar queda `anulada` (mapeo completo en `data-model.md` §7).

**Complejidad:** el template del curso solo trae una entidad y un documento con campos simples. Nuestro módulo agrega **líneas de documento, cálculo tributario, reglas que cruzan tablas (crédito, aprobaciones), permisos por perfil y análisis cuantitativo**. Todo está cubierto por **142 pruebas automáticas** (111 del template + 31 nuevas).

## 6. Modelo de datos y compatibilidad con la estructura base

![MER del módulo de Ventas](docs/mer.png)

Vista simplificada para la presentación: [`docs/mer-nucleo.png`](docs/mer-nucleo.png).

El MER tiene **19 tablas** en tres colores:

- **Verde, base del curso (9):** las 8 tablas de *Sales Module* del modelo ERP del curso (`price_lists`, `price_list_items`, `sales_quotes`, `sales_quote_lines`, `sales_orders`, `sales_order_lines`, `returns_rma`, `rma_lines`) más `customers` de CRM, que Ventas crea y edita. Se usan **con los mismos nombres de tablas y columnas**.
- **Naranja, nuevas (2):** `lost_reasons` (evita el sesgo de supervivencia) y `discount_approvals` (evita la suboptimización por descuentos).
- **Gris, de otros módulos (8):** `employees` (RR.HH.), `addresses`, `currencies`, `tax_codes` (Core), `products` (Inventario), `opportunities` (CRM), `shipments` (Logística) y `ar_invoices` (Finanzas). Ventas solo las **lee** por llave foránea; no copia ni modifica sus datos.

Las columnas que el grupo agrega a tablas base (RUT, crédito, descuento por línea, desglose de IVA, etc.) están marcadas "nuevo" en el diagrama y justificadas una por una en `data-model.md`.

**Cómo se conecta con los otros módulos** (relaciones numeradas en el §9 del modelo del curso):

| Ventas se conecta con | Por medio de | Para qué |
|---|---|---|
| CRM | `customer_id`, `opportunity_id` (24, 25, 28, 29, 33) | Saber a quién se vende y de qué negocio viene |
| RR.HH. | `employee_id`, `assigned_employee_id` (17, 26, 30); `requested_by`, `approved_by` (relaciones nuevas, sin n.º en el §9) | Saber qué vendedor vendió, quién pidió y quién aprobó un descuento |
| Inventario | `product_id` (27, 31, 32, 34) | Qué producto se vende; a futuro, reservar stock al confirmar |
| Logística | `shipments.sales_order_id` (14) | El despacho cumple un pedido (estado `despachado`) |
| Finanzas | `ar_invoices.sales_order_id` (7) | La factura cobra un pedido (estado `facturado`) |

**Compatibilidad con el template:** `customers` es la **Entidad** del template y el pedido de venta es su **Documento**. Toda la terminología de Ventas está en un solo archivo de configuración (`src/profiles/ventas.js`), como pide el template. Si se cambia a `userConfig = null`, la aplicación vuelve a ser el módulo base sin cambios. La correspondencia campo a campo está en `data-model.md` §7.

## 7. Método de análisis

| Indicador | Cómo se calcula en el MVP | Para qué sirve |
|---|---|---|
| Ventas del mes | Σ total (con IVA) de pedidos confirmados, despachados o facturados, según su fecha de emisión | Ver la tendencia |
| Tasa de conversión | Pedidos confirmados o posteriores / (esos pedidos + cotizaciones perdidas). Incluye ventas directas sin cotización | Efectividad comercial |
| Ticket promedio | Σ total / n.º de pedidos, de todo el período registrado | Tamaño típico de compra |
| Descuento promedio | Σ descuento $ / Σ venta bruta $, solo de pedidos confirmados o posteriores | Control de precios |
| Margen bruto | (venta neta sin IVA − costo estándar) / venta neta, solo de pedidos confirmados o posteriores | Rentabilidad (solo jefe/a) |
| Concentración (Pareto) | % de las ventas que hace el 20 % de los clientes con compras que más compra | Dependencia de pocos clientes |
| Motivos de pérdida | Conteo por motivo | Qué mejorar |
| Pronóstico | Recta de mínimos cuadrados (y = a + b·t) y promedio móvil de 3 meses, calculados con los meses ya cerrados que tienen ventas (de los últimos 6 que muestra el gráfico) | Estimar cómo debería cerrar el mes en curso |

El mes en curso **no** entra al cálculo del pronóstico, porque está incompleto y haría parecer una caída; el pronóstico se compara con él.

**Lectura de sistemas (conceptos del curso):**

- **Stock y flujo:** las cotizaciones abiertas son un stock; entran cotizaciones nuevas y salen las ganadas o perdidas.
- **Bucle de balance (B):** el crédito usado se acerca al límite → el sistema bloquea nuevos pedidos → el pedido se despacha y se factura → la deuda pasa a Finanzas y se libera crédito en Ventas. Riesgo: si el cliente no paga la factura, Ventas no lo ve hasta conectarse con cuentas por cobrar (`ar_invoices`).
- **Suboptimización (Meadows):** si el vendedor maximiza volumen con descuentos, perjudica el margen de la empresa. La aprobación de descuentos alinea ambas metas.
- **Sesgo de supervivencia:** si solo se guardan las ventas ganadas, nunca se sabe por qué se pierde. Por eso existe `lost_reasons`.

## 8. Riesgos y sesgos de datos

| Riesgo | Cómo lo maneja el diseño |
|---|---|
| Datos personales de clientes (Ley 19.628 y Ley 21.719) | Solo se guarda lo necesario para vender, cobrar y despachar; la demo usa datos ficticios |
| Información sensible para el negocio | Margen y costo visibles solo para el jefe/a; exportar y borrar datos, solo jefe/a |
| Discriminación en el crédito | El límite lo fija la jefatura según historial de pago; nunca por ubicación ni atributos personales |
| Descuentos desiguales entre clientes | Toda excepción queda registrada con motivo obligatorio, quién pidió, quién decidió y cuándo |
| Sesgo de supervivencia | Motivo obligatorio al perder una venta y gráfico de motivos |
| Pérdida de historia | Pedidos cerrados y sus clientes no se pueden borrar |
| Inyección de código | Todo texto ingresado se muestra como texto, sin interpretar HTML |
| Pérdida de datos del navegador | Exportar e importar respaldos en JSON |

**Límites del MVP:** los perfiles son simulados (cualquiera puede elegir "jefe/a"), `approved_by` guarda el nombre del perfil y no una persona autenticada, y un archivo importado reemplaza los datos. Decidir descuentos y cambiar el crédito se validan también en el almacenamiento; exportar, importar y borrar todo se ocultan solo en la interfaz. Se resuelven con inicio de sesión y servidor (§9).

Análisis completo: [`docs/riesgos-y-sesgos.md`](docs/riesgos-y-sesgos.md). La constitución del proyecto incluye un principio de **privacidad y sesgos de datos** ([`.specify/memory/constitution.md`](.specify/memory/constitution.md)).

## 9. Arquitectura, escalabilidad y desarrollo futuro

| Capa | Archivo | Qué hace |
|---|---|---|
| Configuración | `src/profiles/ventas.js` | Términos, campos, estados, catálogo, vendedores y parámetros (IVA, umbral de descuento) |
| Reglas de negocio | `src/sales/sales-logic.js` | Funciones puras: RUT, totales, crédito, indicadores y pronóstico |
| Datos | `src/storage.js` | Guardar, validar, aprobaciones, exportar e importar (`localStorage`) |
| Pantallas | `src/components/` | Panel, clientes, pedidos y búsqueda |
| Pruebas | `tests/` | Unitarias e integración (Vitest) |

**Tecnología:** Vite + JavaScript, sin dependencias nuevas sobre el template. Es solo frontend, como pide el trabajo.

| Escala | Qué cambia | Qué se reutiliza |
|---|---|---|
| Hoy: 1 usuario, 1 navegador | Nada (`localStorage`, ~5 MB, unos 4.000 pedidos) | — |
| Equipo de ventas | Servidor con base de datos (PostgreSQL), API e inicio de sesión real; crédito validado en una transacción; cada vendedor ve su cartera | Reglas de negocio, MER y pantallas |
| Varios años de datos | Índices por cliente, estado y fecha; resúmenes mensuales; paginación | MER |
| ERP completo | Reservar stock al confirmar (Inventario), despachos (Logística), facturas y cobranza (Finanzas), devoluciones (`returns_rma`) | Estados del pedido y llaves del MER |

Análisis completo: [`docs/analisis-escalabilidad.md`](docs/analisis-escalabilidad.md).

## 10. Equipo, roles y cronograma

| Integrante | GitHub | Rol principal | Revisa |
|---|---|---|---|
| Joaquín Ignacio Espinoza Mella | @mellajoaco-hub | Datos: MER y `data-model.md` | Specs |
| Ezequiel Ernesto Romero Cifuentes | @EzequielERC | Specs: `spec.md` e historias de usuario | Datos |
| Pedro Pablo Chávez González | @pedropablochavez | Implementación: código y `tasks.md` | Pruebas |
| Antonio Alberto Araneda Lepe | @antonio-araneda | Pruebas y datos de demostración | Implementación |
| Francisca Belén Arias Díaz | @frarias11 | Usuarios, riesgos y sesgos | Documentación |
| Sebastián Eduardo Amigo Pereira | @xTatan | Documentación, README y presentación | Riesgos |

| Fecha | Hito | Estado |
|---|---|---|
| 13–20 oct | MER, `data-model.md`, specs y MVP funcionando (con apoyo de IA) | Hecho |
| 22 oct, 15:00 | **Revisión del avance**: MER y este `plan.md` | En revisión |
| 23 oct–9 nov | Incorporar el feedback; registrar las decisiones como Issues; cada integrante revisa su parte | Pendiente |
| 10–24 nov | Mejoras según feedback y nuevas pruebas | Pendiente |
| 25–29 nov | README final y ensayo de 5 minutos (los seis integrantes) | Pendiente |
| Semana del 30 nov | **Presentación y repositorio final**; coevaluación | Pendiente |

**Forma de trabajo:** Spec Driven Development con Speckit (constitución → spec → plan → tareas → implementación con IA). Desde esta revisión, cada cambio irá en una rama con *pull request* revisado por un compañero, y las decisiones se registrarán como Issues con la etiqueta `decision` (lista para copiar en [`docs/decisiones.md`](docs/decisiones.md)).

## 11. Fuentes

- Equipo docente MDS 2026-2. *Modelación de Sistemas 2026-2: Trabajo Grupal* (instructivo y rúbrica). Universidad de Concepción.
- Equipo docente MDS 2026-2. *ERP Relational Data Model* (`erp_data_model.md`), §4 CRM, §5 Sales y §9 mapa entre módulos.
- Caro, J. C. (2026). *ERP Software Base Module* (template del curso) y su especificación en [`specs/001-erp-base-module/`](specs/001-erp-base-module/). Repositorio MDS-BI en GitHub.
- Meadows, D. H. (2008). *Thinking in Systems: A Primer*. Chelsea Green Publishing.
- Decreto Ley N.º 825 (1974), Ley sobre Impuesto a las Ventas y Servicios (tasa de IVA de 19 %).
- Servicio de Impuestos Internos (SII). Cálculo del dígito verificador del RUT (algoritmo módulo 11).
- Ley N.º 19.628 (1999), sobre protección de la vida privada, y Ley N.º 21.719 (2024), que regula la protección y el tratamiento de los datos personales.

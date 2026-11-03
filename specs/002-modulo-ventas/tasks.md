# Tareas: Módulo de Ventas (ERP)

**Entrada**: Documentos de diseño desde `/specs/002-modulo-ventas/`
**Prerrequisitos**: plan.md, spec.md, research.md, data-model.md, contracts/

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: puede hacerse en paralelo (archivos distintos, sin dependencias)
- **[US#]**: historia de usuario de `spec.md`

---

## Fase 1: Configuración

- [X] T001 Revisar el template: specs `001-erp-base-module`, README y las 12 suites de prueba como contrato de la interfaz
- [X] T002 Instalar dependencias (`npm install`) y verificar que Vitest corre
- [X] T003 [P] Registrar en `docs/plan-de-trabajo.md` las decisiones y preguntas abiertas para el equipo docente

## Fase 2: Fundacional: reconstruir el núcleo del template (bloqueante)

**Propósito**: el repositorio no traía `src/` ni `index.html`. Sin el núcleo, ninguna historia funciona.

- [X] T004 Crear `index.html` con todas las pantallas y los ids que usan las pruebas
- [X] T005 Implementar `src/module-config.js`: valores por defecto, `normalizeConfig`, campos personalizados, ciclo de vida, color y concordancia gramatical (el/la)
- [X] T006 Implementar `src/storage.js`: CRUD de entidades y documentos, validación, cascada y búsqueda normalizada
- [X] T007 [P] Implementar `src/components/shell.js` (logotipo SVG, módulo activo, color) y `src/styles.css` (tokens)
- [X] T008 [P] Implementar `src/components/custom-fields.js`
- [X] T009 Implementar `entity-form.js`, `document-form.js`, `search.js`, `dashboard.js` y `app.js`
- [X] T010 Ejecutar las 111 pruebas del template → todas en verde

**Punto de control**: el módulo base funciona igual que el template.

## Fase 3: Perfil de Ventas y extensión `sales`

- [X] T011 Crear `src/profiles/ventas.js` (terminología, nombres de campos, vendedor, motivo de pérdida, ciclo de vida, catálogo y parámetros) y conectarlo en `userConfig`
- [X] T012 Agregar `fieldLabels` y `sales` a `normalizeConfig`, con validación y mensajes claros
- [X] T013 Crear `src/sales/sales-logic.js` con funciones puras (RUT, líneas, totales, crédito, indicadores, mínimos cuadrados)
- [X] T014 [P] Pruebas unitarias en `tests/unit/sales-logic.test.js`
- [X] T015 Ajustar las 5 pruebas del template que usan `boot()` para que verifiquen el módulo base con la configuración por defecto, y actualizar la prueba de `loadModuleConfig`

## Fase 4: US1: Registrar clientes con RUT (P1)

- [X] T016 [US1] Validar RUT (módulo 11, obligatorio y único) y guardarlo formateado en `storage.js`
- [X] T017 [US1] Mostrar el crédito usado y disponible al editar un cliente (`entity-form.js`)
- [X] T018 [US1] Prueba de integración: RUT inválido y RUT duplicado

## Fase 5: US2: Cotizar con lista de precios (P1)

- [X] T019 [US2] Editor de líneas con selector de producto, precio copiado de la lista, cantidad, % de descuento y total de línea
- [X] T020 [US2] Totales calculados y de solo lectura (subtotal, descuento, IVA y total)
- [X] T021 [US2] Valores por defecto de un nuevo pedido: serie NV, folio siguiente, fechas y estado `cotización`
- [X] T022 [US2] Pruebas: cálculo 10 × $4.990 con 5 % → $56.412; vendedor y productos obligatorios

## Fase 6: US3: Confirmar respetando el crédito (P1)

- [X] T023 [US3] Bloquear la entrada a `confirmado` si el total supera el crédito disponible
- [X] T024 [US3] Bloquear cambios de líneas en documentos no abiertos (interfaz y almacenamiento)
- [X] T025 [US3] Pruebas: bloqueo por crédito, líneas bloqueadas y transición de estados

## Fase 7: US4: Aprobación de descuentos (P1)

- [X] T026 [US4] Almacén `discount_approvals`: solicitar, decidir y última aprobación
- [X] T027 [US4] Solicitud automática al guardar con descuento > 10 %, con el motivo del vendedor
- [X] T028 [US4] Lista de pendientes en el panel; botones solo para el perfil jefe/a
- [X] T029 [US4] Prueba de extremo a extremo: solicitar → bloqueo → aprobar → confirmar

## Fase 8: US5 y US6: Motivos de pérdida e indicadores (P2)

- [X] T030 [US5] Motivo obligatorio para `perdida`
- [X] T031 [US6] Indicadores: ventas del mes, cotizaciones abiertas, conversión, ticket, descuento y margen (solo jefe/a)
- [X] T032 [US6] Top 5 clientes, nota de Pareto (20/80), motivos de pérdida
- [X] T033 [US6] Gráfico mensual (CSS) con pronóstico por mínimos cuadrados y promedio móvil; el mes en curso no entra al pronóstico
- [X] T034 [US5][US6] Pruebas de indicadores y de margen oculto al vendedor

## Fase 9: US7 y US8: Búsqueda y respaldo (P2/P3)

- [X] T035 [US7] Buscar por RUT con o sin formato; mostrar pedidos con monto y estado
- [X] T036 [US8] Datos de demostración ficticios y deterministas (10 clientes, ~40 pedidos, 6 meses)
- [X] T037 [US8] Exportar, importar y borrar datos (JSON)

## Fase 10: Pulido y documentación

- [X] T038 Revisión visual en escritorio (1360 px) y móvil (390 px); corregir `[hidden]` vs `display: flex`
- [X] T039 [P] README: instalación, uso, estructura y pruebas
- [X] T040 [P] `docs/analisis-escalabilidad.md`, `docs/riesgos-y-sesgos.md` y `docs/guion-presentacion.md`
- [X] T041 Constitución v1.1.0: principio V de privacidad y sesgos de datos
- [ ] T042 Revisión del grupo y ensayo de la presentación de 5 minutos (todos los integrantes)
- [X] T043 Incorporar el feedback del avance 01: borrar `plan.md` de la raíz, historias de usuario en el spec, reparto por persona y versión integrada (26 de octubre)

## Fase 11: Avance para la revisión del 22 de octubre

- [X] T044 `plan.md` en la raíz (el 26 de octubre, por el feedback, se repartió entre `specs/002-modulo-ventas/plan.md` y `docs/plan-de-trabajo.md`): módulo, usuarios, funcionalidades, compatibilidad con el ERP, análisis, riesgos, escalabilidad, roles y cronograma
- [X] T045 MER con colores por origen (base, nuevo, otro módulo) y estados alineados con la app
- [X] T046 `data-model.md`: sección de compatibilidad con la estructura base, normalización (3FN) e historias → tablas
- [X] T047 README con módulo asignado, integrantes y propósito
- [ ] T048 Registrar las decisiones de `docs/decisiones.md` como Issues
- [X] T049 Reglas tras la revisión interna: no borrar documentos cerrados ni clientes con ellos (FR-V17); motivo obligatorio y vendedor solicitante en las aprobaciones (FR-V18); `perdida` desde `cotización`; exportar, importar y borrar solo para jefe/a
- [X] T050 MER simplificado para la presentación (`docs/mer-nucleo.png`)
- [X] T051 Segunda revisión interna: folio único por serie, solo jefe/a cambia el crédito y carga la demo, montos y folio también en `sales_quotes`, tabla de estados MVP → MER
- [X] T052 Tercera revisión: un documento nuevo solo nace como cotización o confirmado; decidir aprobaciones se valida también en el almacenamiento

## Fase 12: Iteración 2, equipo Modificaciones (3 – 16 nov)

Ajustes a historias que ya funcionan. Detalle y criterios en [`spec.md`](spec.md#modificaciones-ajustes-a-historias-que-ya-existen).

- [ ] T053 [M-01][US2] Mostrar subtotal, descuento, IVA y total con formato de pesos usando `money()` de `format.js`, sin cambiar el valor guardado (Pedro)
- [ ] T054 [M-02][US3] Estilo de campo deshabilitado en `styles.css` y ocultar la ✕ de las líneas cuando el documento está cerrado (`setLinesLocked` en `document-form.js`) (Pedro)
- [ ] T055 [P][M-01][M-02] Pruebas: montos formateados y campos bloqueados en un pedido facturado (Pedro)
- [ ] T056 [M-03][US4] Cargar en el formulario el motivo de la última solicitud de descuento (`latestApproval`) (Sebastián)
- [ ] T057 [M-03][US4] Pedir un comentario obligatorio al rechazar en el panel; guardarlo en `discount_approvals` (columna nueva `decision_comment`, avisar a Joaquín para el MER) y mostrarlo en el pedido (Sebastián)
- [ ] T058 [M-06][US3] Filtro por estado y por vendedor sobre el selector de pedidos (Sebastián)
- [ ] T059 [P][M-03][M-06] Pruebas: motivo visible, rechazo sin comentario bloqueado, filtro por estado (Sebastián)
- [ ] T060 [M-04][US5] Mostrar "Motivo de pérdida" solo cuando el estado es `perdida`, y volver a ocultarlo si el estado cambia (Francisca)
- [ ] T061 [M-05][US7] Buscar también por folio de pedido (`NV-1037` o `1037`) en `search.js` (Francisca)
- [ ] T062 [M-05][US7] Hacer clic en un pedido de los resultados lo abre en "Pedidos de Venta" (Francisca)
- [ ] T063 [P][M-04][M-05] Pruebas: motivo oculto en un pedido facturado, búsqueda por folio y clic que abre el pedido (Francisca)

## Fase 13: Iteración 2, equipo Incremental (3 – 16 nov)

Funcionalidad nueva. Detalle y criterios en [`spec.md`](spec.md#incremental-funcionalidad-nueva).

- [ ] T064 [US9] Guardar la lista de precios en `localStorage` (clave `erp_base_module:price_list`), partiendo de la lista del perfil la primera vez (Joaquín)
- [ ] T065 [US9] Pantalla "Lista de precios" solo para jefe/a: editar precio, agregar producto y desactivar; precio > 0 (Joaquín)
- [ ] T066 [US9] Productos desactivados fuera del selector de líneas nuevas, pero visibles en documentos antiguos (Joaquín)
- [ ] T067 [P][US9] Pruebas: el precio nuevo no cambia pedidos antiguos; el vendedor no puede editar precios (Joaquín)
- [ ] T068 [US10] Función pura `quoteExpiry(doc, hoy)` en `sales-logic.js` que devuelve "vigente", "por vencer" (3 días o menos) o "vencida" (Ezequiel)
- [ ] T069 [US10] Lista "Por vencer" en el panel y aviso de cotización vencida en el formulario; no confirmar sin extender la vigencia (Ezequiel)
- [ ] T070 [US10] Agregar "Cotización vencida" a los motivos de pérdida en `ventas.js` (Ezequiel)
- [ ] T071 [P][US10] Pruebas unitarias de `quoteExpiry` (incluido el caso que vence hoy) y de integración del panel (Ezequiel)
- [ ] T072 [US12] Agregar `sales_order_status_history` al MER y a `data-model.md` (Joaquín, con Antonio)
- [ ] T073 [US12] Guardar un registro por cada cambio de estado (estado anterior, nuevo, fecha y perfil) en `storage.js`, sin permitir editarlo ni borrarlo (Antonio)
- [ ] T074 [US12] Mostrar el historial en el pedido y los días promedio entre `confirmado` y `despachado` en el panel (Antonio)
- [ ] T075 [P][US12] Pruebas: el historial crece con cada cambio y no se puede modificar (Antonio)

## Fase 14: Versión integrada de la iteración 2 (16 nov)

- [ ] T076 Cada rama con su *pull request* revisado por la pareja del otro equipo (Pedro ↔ Joaquín, Francisca ↔ Ezequiel, Sebastián ↔ Antonio)
- [ ] T077 Unir todo en `main`, correr `npx vitest run` (todas en verde) y revisar a mano con `npm run dev` en los dos perfiles
- [ ] T078 Actualizar el estado de las historias en `spec.md`, las capturas de `docs/capturas/` y el README

## Dependencias

Fase 2 → Fase 3 → (Fases 4 a 9, en orden de prioridad) → Fase 10 → Fase 11 → (Fases 12 y 13 en paralelo) → Fase 14. Dentro de cada fase, las tareas [P] pueden repartirse entre integrantes. T072 (tabla en el MER) va antes de T073.

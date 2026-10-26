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
- [ ] T043 Incorporar el feedback de la revisión del avance (22 de octubre)

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

## Dependencias

Fase 2 → Fase 3 → (Fases 4 a 9, en orden de prioridad) → Fase 10 → Fase 11. Dentro de cada fase, las tareas [P] pueden repartirse entre integrantes.

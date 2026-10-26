# Plan de Implementación: Módulo de Ventas (ERP)

**Rama**: `002-modulo-ventas` | **Fecha**: 2026-10-13 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación desde `/specs/002-modulo-ventas/spec.md`

## Resumen

Adaptar el template *ERP Software Base Module* (Vite + JavaScript vanilla, `localStorage`) para convertirlo en el **Módulo de Ventas**:

1. **Perfil de configuración** `src/profiles/ventas.js`, enchufado en `userConfig` de `src/module-config.js`. Define terminología, nombres de campos, campos personalizados (ejecutivo, vendedor, motivo de pérdida), ciclo de vida y color.
2. **Extensión `sales`** del núcleo, activada solo si el perfil la declara. Agrega:
   - líneas de producto con lista de precios;
   - cálculo de IVA y totales;
   - validación de RUT;
   - control de crédito;
   - aprobación de descuentos (`discount_approvals`);
   - motivo de pérdida;
   - indicadores y pronóstico en el panel.
3. **Sin regresiones**: con la configuración por defecto, la aplicación se comporta exactamente como el módulo base. Las 111 pruebas del template siguen pasando.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS
**Dependencias Principales**: Vite 8 (desarrollo y build). Sin frameworks de interfaz.
**Almacenamiento**: `localStorage` del navegador. Claves `erp_base_module:entities`, `erp_base_module:documents` y `erp_base_module:discount_approvals`.
**Pruebas**: Vitest + jsdom (unitarias e integración)
**Plataforma Objetivo**: Navegadores modernos de escritorio y móviles
**Tipo de Proyecto**: Aplicación web de una página (solo frontend)
**Objetivos de Rendimiento**: búsqueda y listas ágiles con 500+ clientes (prueba del template)
**Restricciones**: el perfil de Ventas se activa solo por configuración; la lógica de negocio va en funciones puras y comprobables.
**Escala/Alcance**: 1 empresa, 1 navegador, ~150 clientes, ~300 productos y cientos de pedidos.

## Verificación de la Constitución

- **I. Calidad**: reglas de negocio en `src/sales/sales-logic.js` (funciones puras, sin DOM). Almacenamiento y validación en `src/storage.js`; interfaz en `src/components/`.
- **II. Pruebas**: 29 pruebas nuevas (unitarias de reglas y de integración por historia de usuario), más 111 del template.
- **III. Experiencia de usuario**: mismos patrones del template (marco, barra lateral, mensajes de validación junto al campo). Toda la terminología sale de la configuración.
- **IV. Rendimiento**: sin dependencias nuevas; el bundle de producción pesa ~50 kB (16 kB gzip).
- **V. Privacidad y sesgos de datos** (principio agregado por el grupo): datos de demo ficticios, margen oculto al vendedor, crédito sin atributos personales y registro de motivos de pérdida y aprobaciones. Ver [`docs/riesgos-y-sesgos.md`](../../docs/riesgos-y-sesgos.md).

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/002-modulo-ventas/
├── spec.md            # problema, usuarios, historias, requisitos
├── plan.md            # este archivo
├── research.md        # decisiones técnicas y alternativas
├── data-model.md      # tablas, columnas, justificación y mapeo a localStorage
├── quickstart.md      # cómo ejecutar y probar la demo
├── contracts/
│   └── ventas-storage.md
├── checklists/
│   └── requirements.md
└── tasks.md           # tareas ejecutadas, por historia de usuario
```

### Código Fuente

```text
index.html                  # marcado de todas las pantallas (ids estables usados por las pruebas)
src/
├── main.js                 # punto de entrada de Vite
├── app.js                  # initApp/boot: aplica configuración, etiquetas y navegación
├── module-config.js        # núcleo de configuración + userConfig = perfil de Ventas
├── profiles/ventas.js      # ★ perfil del Módulo de Ventas (todo lo específico del dominio)
├── storage.js              # CRUD, validación, crédito, aprobaciones, export/import
├── sales/
│   ├── sales-logic.js      # ★ RUT, totales, crédito, indicadores, mínimos cuadrados
│   └── demo-data.js        # ★ datos ficticios deterministas
├── components/
│   ├── shell.js            # logotipo, módulo activo, color de acento, avisos
│   ├── dashboard.js        # acciones rápidas, estadísticas, ★ indicadores y aprobaciones
│   ├── entity-form.js      # clientes (+ crédito usado)
│   ├── document-form.js    # pedidos (+ ★ líneas, totales, aprobación, crédito)
│   ├── search.js           # búsqueda de clientes con sus pedidos
│   ├── custom-fields.js    # campos personalizados desde la configuración
│   └── format.js           # formato CLP, %, fechas
└── styles.css              # tokens de diseño (--accent) y estilos
tests/
├── unit/                   # module-config, storage, ★ sales-logic
└── integration/            # 10 archivos del template + ★ ventas.test.js
```

★ = archivos nuevos o lógica nueva del Grupo 5.

**Decisión de estructura**: el template indicaba que toda la adaptación vive en la configuración. Lo respetamos para la **terminología y los campos**: `src/profiles/ventas.js` es el único archivo con conocimiento del dominio. Las **líneas de documento**, el **crédito** y las **aprobaciones** no existen en el template; el propio `data-model.md` del template los llama "puntos de extensión naturales". Los implementamos como una extensión **opcional** (`sales`) del núcleo. Así, otro grupo podría reutilizarla (por ejemplo, para Compras) y el módulo base sigue intacto cuando no se declara.

## Fases

| Fase | Contenido | Estado |
|---|---|---|
| 0. Investigación | Leer template, specs y pruebas; modelo ERP del curso; decisiones en `research.md` | ✓ |
| 1. Diseño | `data-model.md`, MER (`docs/mer.png`), contrato de almacenamiento | ✓ |
| 2. Núcleo | Reconstruir `src/` del template que no venía en el repositorio (pruebas del template en verde) | ✓ |
| 3. Perfil + extensión | Perfil de Ventas, reglas de negocio, líneas, crédito, aprobaciones, panel | ✓ |
| 4. Calidad | Pruebas de Ventas, revisión visual en escritorio y móvil | ✓ |
| 5. Documentación | README, análisis de escalabilidad, riesgos y guion de presentación | ✓ |
| 6. Segunda iteración | US-09 a US-14 del [spec](spec.md#historias-de-usuario-us), dos historias por semana (27 oct – 16 nov), con versión integrada cada viernes | En curso |

## Seguimiento de Complejidad

| Desviación | Por qué | Alternativa descartada |
|---|---|---|
| Extensión `sales` en el núcleo (no solo configuración) | Las líneas, el crédito y las aprobaciones no pueden expresarse como campos simples | Guardar líneas en un campo de texto: no se valida ni calcula |
| 5 archivos de prueba del template arrancan con la configuración por defecto | `boot()` ahora carga el perfil de Ventas; esas pruebas verifican el **módulo base** | Mantener `userConfig = null`: contradice el README del template, que pide adaptar ahí |
| Prueba `loadModuleConfig` actualizada | `userConfig` ya no es `null`, sino el perfil de Ventas | — |

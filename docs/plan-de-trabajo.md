# Plan de Trabajo · Grupo 5 · Módulo de Ventas

El plan de trabajo vigente está en **[`plan.md`](../plan.md)**, en la raíz del repositorio: descripción del módulo, usuarios, compatibilidad con el ERP, riesgos, escalabilidad, roles y cronograma.

Este archivo guarda solo los acuerdos de trabajo del grupo.

## Forma de trabajo en el repositorio

- Una rama por funcionalidad y un *pull request* revisado por al menos un compañero antes de unir a `main`.
- Cada decisión importante se registra como **Issue** con la etiqueta `decision` (lista en [`decisiones.md`](decisiones.md)).
- Las tareas de [`tasks.md`](../specs/002-modulo-ventas/tasks.md) pueden pasarse a Issues con `/speckit.taskstoissues` y asignarse a un integrante.
- Después de cada cambio: `npx vitest run` (todas las pruebas en verde) y `npm run dev` para revisar a mano.
- Herramienta de IA: OpenCode (viene configurado en el template), salvo que el equipo docente indique otra.
- Como en la presentación habla un integrante al azar, **todos** revisan todo antes de cada entrega.

## Preguntas para el equipo docente

1. El repositorio entregado no traía `src/` ni `index.html`. El grupo reconstruyó el núcleo desde los specs y las 111 pruebas del template (todas pasan). ¿Es válido así?
2. ¿Se puede extender el núcleo del template (líneas de documento, aprobaciones) además de `module-config.js`? Lo hicimos como una extensión opcional que no cambia el módulo base.

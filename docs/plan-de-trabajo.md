# Plan de Trabajo · Grupo 5 · Módulo de Ventas

Siguiendo el feedback del avance, sacamos el `plan.md` de la raíz. El plan del módulo (resumen, aspectos técnicos y fases) quedó en [`specs/002-modulo-ventas/plan.md`](../specs/002-modulo-ventas/plan.md) y las historias de usuario con su reparto en [`specs/002-modulo-ventas/spec.md`](../specs/002-modulo-ventas/spec.md#historias-de-usuario-us). Este archivo guarda los acuerdos del grupo: roles, permisos, fechas y forma de trabajo.

## Equipo y roles

| Integrante | GitHub | Rol principal | Revisa |
|---|---|---|---|
| Joaquín Ignacio Espinoza Mella | @mellajoaco-hub | Datos: MER y `data-model.md` | Specs |
| Ezequiel Ernesto Romero Cifuentes | @EzequielERC | Specs: `spec.md` e historias de usuario | Datos |
| Pedro Pablo Chávez González | @pedropablochavez | Implementación: código y `tasks.md` | Pruebas |
| Antonio Alberto Araneda Lepe | @antonio-araneda | Pruebas y datos de demostración | Implementación |
| Francisca Belén Arias Díaz | @frarias11 | Usuarios, riesgos y sesgos | Documentación |
| Sebastián Eduardo Amigo Pereira | @xTatan | Documentación, README y presentación | Riesgos |

Las historias de la segunda iteración (US-09 a US-14) están repartidas una por persona; la tabla está en el [spec](../specs/002-modulo-ventas/spec.md#resumen-y-reparto).

## Permisos de cada perfil

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

En el MVP los perfiles se eligen con un selector, sin contraseña, porque es solo frontend. En producción habrá inicio de sesión y cada vendedor verá solo su cartera (ver [`analisis-escalabilidad.md`](analisis-escalabilidad.md)).

## Cronograma

| Fecha | Hito | Estado |
|---|---|---|
| 13 – 20 oct | MER, `data-model.md`, specs y MVP funcionando | Hecho |
| 22 oct | Revisión del avance (MER y plan) | Hecho: "excelente trabajo", borrar `plan.md` de la raíz |
| 26 oct | Historias de usuario (US) en el spec, repartidas por persona | Hecho |
| 27 oct – 2 nov | Semana 1: US-09 y US-10. Generar `tasks.md` desde el spec | Pendiente |
| 3 – 9 nov | Semana 2: US-11 y US-12 | Pendiente |
| 10 – 16 nov | Semana 3: US-13 y US-14 | Pendiente |
| 17 – 23 nov | Semana 4: correcciones, pruebas y versión integrada final | Pendiente |
| 24 – 29 nov | README final y ensayo de 5 minutos (los seis) | Pendiente |
| Semana del 30 nov | Presentación y repositorio final; coevaluación | Pendiente |

Cada viernes juntamos lo de la semana en `main` y probamos la versión integrada.

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

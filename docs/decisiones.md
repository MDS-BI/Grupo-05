# Decisiones del Grupo 5 · Módulo de Ventas

La pauta pide registrar las decisiones en **Issues**. Esta lista es la fuente (aún no están creados como Issues): cada fila se copia como un Issue con la etiqueta `decision` (título = columna "Decisión"; cuerpo = "Por qué" + enlace al detalle). El detalle técnico de cada una está en [`research.md`](../specs/002-modulo-ventas/research.md).

| # | Decisión | Por qué | Alternativa descartada | Detalle |
|---|---|---|---|---|
| 1 | Módulo de **Ventas** para una pyme distribuidora (ferretería mayorista ficticia) | Asignado al grupo; una distribuidora tiene cotizaciones, crédito y descuentos, que muestran bien el módulo | Retail con boleta: casi no usa cotizaciones ni crédito | [propuesta](propuesta-mvp.md) |
| 2 | Reconstruir `src/` del template desde sus specs y pruebas | El repositorio no traía el código; las 111 pruebas eran el contrato | Escribir una app desde cero: perdía la base común del curso | D1 |
| 3 | Cotización y pedido en **un solo documento** con estados | El template tiene un solo tipo de documento; el estado muestra el embudo completo | Dos documentos separados: duplica pantallas y lógica | D2 |
| 4 | Líneas guardadas **dentro** del pedido | En `localStorage` no hay *joins*; el MER mantiene la tabla `sales_order_lines` para el futuro | Lista separada de líneas: más código sin beneficio en el MVP | D3 |
| 5 | **Copiar** el precio de lista a la línea | Si la lista cambia, los pedidos antiguos no deben cambiar | Leer el precio siempre desde la lista | D4 |
| 6 | Crédito usado = pedidos **confirmados + despachados** | Lo facturado pasa a cuentas por cobrar (otro módulo) | Contar también cotizaciones: bloquea ventas que no existen | D5 |
| 7 | Descuento > 10 % requiere **aprobación** (tabla `discount_approvals`) | Evita la suboptimización: el vendedor maximiza ventas regalando margen | Bloquear todo descuento alto: frena negocios legítimos | D6 |
| 8 | Motivo **obligatorio** al perder una cotización (`lost_reasons`) | Sin motivo, solo vemos ventas ganadas (sesgo de supervivencia) | Campo libre opcional: casi nadie lo llena | D7 |
| 9 | Perfiles simulados vendedor / jefe | Mostrar permisos (margen oculto, aprobar) sin construir inicio de sesión | Login real: fuera del alcance de un frontend | D8 |
| 10 | Pronóstico por **mínimos cuadrados + promedio móvil**, sin el mes en curso | Es explicable en 1 minuto; el mes incompleto deformaba la tendencia | Modelos más complejos: pocos datos, difíciles de explicar | D9 |
| 11 | RUT con dígito verificador (módulo 11), obligatorio y único | Evita clientes duplicados y errores de tipeo | Texto libre | D10 |
| 12 | El límite de crédito lo fija la jefatura según el historial de pago, nunca por comuna u otros atributos personales | Principio V de la constitución; evita discriminar | Puntaje por ubicación | [riesgos](riesgos-y-sesgos.md) |
| 13 | Sin dependencias nuevas | Bundle de ~50 kB; nada que instalar aparte de Vite | Librerías de gráficos | D11 |
| 14 | La historia de ventas no se borra: solo se eliminan documentos en `cotización` o `enviada`; los demás (y sus clientes) quedan; un pedido confirmado se anula en vez de borrarse | Sin historia no hay trazabilidad ni indicadores confiables | Borrado libre en cascada del template | [spec FR-V17](../specs/002-modulo-ventas/spec.md) |
| 15 | La aprobación de descuento se pide sobre la cotización, con motivo obligatorio y vendedor solicitante | Se aprueba antes de confirmar; deja registro de quién pidió | Pedir aprobación ya confirmado el pedido | [data-model](../specs/002-modulo-ventas/data-model.md) |

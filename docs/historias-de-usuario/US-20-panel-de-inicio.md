# US-20: Panel de inicio con lo que tengo que hacer hoy

**Escrita por**: Sebastián Amigo
**Iteración**: 3 (16 al 22 de noviembre)
**Prioridad**: P2
**Depende de**: US-15 (para saber quién entró)

## Historia

**Como** vendedor/a, **quiero** que al entrar el panel me salude por mi nombre y me muestre lo que tengo pendiente hoy, **para** partir el día sabiendo qué hacer sin revisar pedido por pedido.

## Por qué es P2

El panel de hoy parte con las tarjetas del template ("Nuevo Cliente: Registrar un dato maestro", "Registrar una transacción", "Buscar registros"), que no dicen nada de ventas. Los indicadores están bien, pero son iguales para todos y no dicen qué hacer. Si el sistema ya sabe quién entró (US-15), el panel puede mostrar lo de cada uno.

## Cómo se prueba sola

Entrar como Camila Rojas con los datos de demostración y ver sus pendientes. Entrar como jefe/a y ver que el panel cambia.

## Tablas

`sales_quotes` (vigencia), `customers` (próximo contacto), `discount_approvals`, `sales_orders`.

## Criterios de aceptación

1. **Dado** que entro con mi cuenta, **cuando** se abre el panel, **entonces** veo "Hola, [mi nombre]" y la fecha de hoy.
2. **Dada** una cuenta de vendedor/a, **cuando** miro el panel, **entonces** veo "Mis pendientes de hoy": cotizaciones que vencen en 3 días o menos, clientes con próximo contacto hoy o atrasado, y mis descuentos esperando respuesta o rechazados con su comentario.
3. **Dado** un pendiente, **cuando** hago clic, **entonces** se abre esa cotización, ese cliente o ese pedido.
4. **Dada** una cuenta de jefe/a, **cuando** miro el panel, **entonces** arriba aparecen los descuentos por aprobar y las ventas del mes comparadas con el mes pasado.
5. **Dado** el panel, **cuando** lo abro, **entonces** ya no están las tarjetas genéricas del template. Los botones dicen lo que hacen en ventas: "Nueva cotización", "Nuevo cliente" y "Ver pedidos".
6. **Dada** cualquier pantalla, incluida la de entrada, **cuando** la abro, **entonces** se ve el nombre y el logo de la distribuidora, con los mismos colores en todo el sistema.
7. **Dado** un celular, **cuando** abro el panel, **entonces** se ve en una sola columna y los pendientes van primero.

## Notas

El nombre de la empresa del caso lo definimos como grupo (propuesta: "Distribuidora Biobío"). Los indicadores de la US-06 se mantienen, pero bajan después de los pendientes.

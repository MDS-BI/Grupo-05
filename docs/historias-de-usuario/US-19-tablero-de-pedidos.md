# US-19: Seguir los pedidos en un tablero por estado

**Escrita por**: Antonio Araneda
**Iteración**: 3 (16 al 22 de noviembre)
**Prioridad**: P2

## Historia

**Como** vendedor/a, **quiero** ver mis cotizaciones y pedidos en columnas según su estado, **para** saber de un vistazo en qué va cada venta y cuáles tengo que mover.

## Por qué es P2

Hoy los 39 pedidos de demostración están en un solo selector y para ver uno hay que abrirlo. No se ve cuántas cotizaciones hay abiertas ni cuántos pedidos faltan por despachar. Además es otra pantalla igual a la del template. Esta historia reemplaza la idea del filtro de la M-06 por algo más útil.

## Cómo se prueba sola

Cargar los datos de demostración, abrir "Pedidos", mover una cotización a "Confirmado" y ver que cambia de columna. Intentar lo mismo con un cliente sin crédito y ver que no deja.

## Tablas

`sales_quotes`, `sales_orders`, `sales_order_status_history`, `lost_reasons`.

## Criterios de aceptación

1. **Dado** que abro "Pedidos", **cuando** carga la pantalla, **entonces** veo una columna por estado (cotización, enviada, confirmado, despachado y facturado), y cada pedido es una tarjeta con folio, cliente, total en pesos y vendedor.
2. **Dado** el título de cada columna, **cuando** lo miro, **entonces** dice cuántos pedidos hay y la suma de sus totales.
3. **Dada** una tarjeta, **cuando** hago clic, **entonces** se abre el pedido completo.
4. **Dada** una tarjeta, **cuando** la paso al estado siguiente (con el botón "Avanzar" o arrastrándola), **entonces** el estado cambia solo si ese cambio está permitido y se cumplen las reglas de crédito (US-03) y de descuento aprobado (US-04). Si no, la tarjeta vuelve a su columna y aparece el motivo.
5. **Dada** una tarjeta que paso a "perdida", **cuando** la suelto, **entonces** el sistema me pide el motivo de pérdida (US-05) antes de guardarla.
6. **Dados** los filtros de vendedor y de fecha, **cuando** elijo uno, **entonces** el tablero muestra solo esos pedidos.
7. **Dados** pedidos perdidos o anulados, **cuando** miro el tablero, **entonces** no ocupan columna; se ven aparte en "Cerrados sin venta".

## Notas

Cada movimiento de una columna a otra queda en el historial de estados (US-12) con el nombre de quien lo hizo (US-16). Las pruebas que ya existen para las transiciones de estado se tienen que seguir cumpliendo.
# US-18: Ver mis clientes en una lista y abrir su ficha

**Escrita por**: Ezequiel Romero
**Iteración**: 3 (16 al 22 de noviembre)
**Prioridad**: P2

## Historia

**Como** vendedor/a, **quiero** ver mis clientes en una tabla que pueda buscar y ordenar, y abrir la ficha de cada uno, **para** encontrar rápido a un cliente y ver cómo está sin buscarlo en un selector.

## Por qué es P2

La pantalla de Clientes de hoy es la misma del template: un selector "Editar o eliminar el cliente" y un formulario largo abajo. Con 10 clientes de demostración se puede usar, pero el caso tiene unos 150 y así no sirve. El profe nos dijo que el módulo se ve casi igual al template, y esta es una de las pantallas donde más se nota.

## Cómo se prueba sola

Cargar los datos de demostración, abrir Clientes, escribir "Ferre" en el buscador, ordenar por crédito disponible y abrir la ficha de un cliente.

## Tablas

`customers`, `sales_orders` (para el crédito usado y los últimos pedidos).

## Criterios de aceptación

1. **Dado** que abro "Clientes", **cuando** carga la pantalla, **entonces** veo una tabla con razón social, RUT, ejecutivo, crédito disponible y próximo contacto.
2. **Dado** un texto en el buscador, **cuando** escribo, **entonces** la tabla se filtra al tiro por razón social o RUT.
3. **Dado** un clic en el título de una columna, **cuando** lo hago, **entonces** la tabla se ordena por esa columna (y al volver a hacer clic, al revés).
4. **Dado** un clic en un cliente, **cuando** se abre su ficha, **entonces** veo sus datos, una barra con el crédito usado y el disponible, y sus últimos 5 pedidos, con los botones "Editar" y "Nueva cotización".
5. **Dado** un cliente que ya usó el 90 % o más de su crédito, **cuando** lo veo en la tabla, **entonces** aparece marcado para que no le confirme un pedido sin revisar (regla de US-03).
6. **Dada** una cuenta de vendedor/a, **cuando** abro la lista, **entonces** parte filtrada en "Mis clientes" (los que tengo asignados) y puedo cambiar a "Todos".
7. **Dado** el botón "Nuevo cliente", **cuando** lo presiono, **entonces** el formulario se abre en una ventana aparte y no queda pegado al final de la pantalla.

## Notas

Eliminar o editar un cliente se hace desde su ficha, no desde un selector. Las validaciones que ya tenemos (RUT con dígito verificador, código único) se mantienen igual.

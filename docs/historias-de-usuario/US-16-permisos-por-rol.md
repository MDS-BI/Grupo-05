# US-16: Ver y hacer solo lo que le toca a mi rol

*Escrita por*: Pedro Pablo Chávez
*Iteración*: 3 (16 al 22 de noviembre)
*Prioridad*: P1
*Depende de*: US-15 (inicio de sesión)

## Historia

*Como* jefe/a de ventas, *quiero* que cada cuenta tenga un rol (vendedor/a o jefe/a) y que el sistema muestre y deje hacer solo lo que corresponde a ese rol, *para* que un vendedor no pueda aprobar sus propios descuentos ni ver costos y márgenes.

## Por qué es P1

Ya tenemos reglas que dependen del rol: solo el jefe/a aprueba descuentos sobre 10 % (US-04) y solo el jefe/a ve el margen. Pero hoy el rol se elige en un selector, así que cualquiera se lo cambia. Si el rol sale de la cuenta con la que entraste, esas reglas por fin se cumplen.

## Cómo se prueba sola

Entrar como vendedor/a, abrir un pedido con un descuento pendiente y ver que no aparecen "Aprobar" ni "Rechazar". Después entrar como jefe/a y aprobarlo.

## Tablas

users (columna role), discount_approvals, sales_orders, sales_order_status_history.

## Criterios de aceptación

1. *Dado* que entré con mi cuenta, *cuando* miro la barra de arriba, *entonces* ya no está el selector "Perfil": mi rol sale de mi cuenta y no lo puedo cambiar.
2. *Dada* una cuenta de vendedor/a, *cuando* abro un pedido con un descuento pendiente, *entonces* no veo los botones "Aprobar" ni "Rechazar", y tampoco veo el costo ni el margen.
3. *Dada* una cuenta de vendedor/a, *cuando* creo una cotización, *entonces* el campo "Vendedor" se llena solo con mi nombre y no lo puedo cambiar.
4. *Dada* una cuenta de vendedor/a, *cuando* abro "Pedidos", *entonces* veo mis pedidos primero. Puedo mirar los de otros vendedores, pero solo puedo editar los míos.
5. *Dado* cualquier cambio de estado o cualquier aprobación, *cuando* se guarda, *entonces* queda registrado con el nombre de la persona que tenía la sesión abierta (ya no con el "perfil"), y se ve en el historial del pedido (US-12).
6. *Dada* una cuenta de vendedor/a, *cuando* abro el panel, *entonces* no aparecen "Borrar todos los datos" ni "Importar datos". Eso queda solo para el jefe/a.
7. *Dada* una cuenta de jefe/a, *cuando* entro, *entonces* veo todo, incluido el margen y los descuentos por aprobar.

## Notas

Ojo: no basta con esconder los botones. La función que aprueba un descuento también tiene que revisar el rol de quien tiene la sesión abierta, porque si no alguien lo podría saltar desde la consola del navegador. Esto lo dejamos con una prueba en tests/.

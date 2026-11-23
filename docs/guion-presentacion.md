# Guion de Presentación (5 minutos) · Grupo 5 · Ventas

El profesor elige **a una persona del grupo al azar**, así que los seis tenemos que poder decir este guion. Se presenta **directo en la página**, sin diapositivas. Cada parte tiene su tiempo y una idea clave para recordar.

## Antes de empezar (dejar la pantalla lista)

1. Abrir la app (`npm run dev` o el link publicado) en una ventana grande.
2. Entrar como **jefa** (`jefa@biobio.cl` / `Jefa2026`), apretar **Cargar datos de demostración** (abajo en el Panel) y cerrar sesión.
3. Dejar abierta la pantalla de entrada. En otra pestaña, abrir `docs/mer.png`.

---

## 0:00 – 0:30 · El problema y el cliente

> "Nuestro cliente es **Distribuidora Biobío**, una empresa chica que vende materiales de construcción a constructoras, colegios y ferreterías. Hoy hace sus cotizaciones en planillas y por correo. Tiene tres problemas: pierde ventas y no sabe por qué, cada vendedor da el descuento que quiere, y a veces le vende a clientes que ya no tienen crédito."

Idea clave: **cotizar rápido, controlar el crédito y los descuentos, y saber por qué se pierden ventas.**

## 0:30 – 1:10 · Quién usa el sistema y qué puede hacer

> "El sistema lo usan dos tipos de personas, cada una con su propia cuenta. El **vendedor** crea clientes y cotizaciones, pero solo puede cambiar sus propios pedidos. La **jefa de ventas** aprueba los descuentos de más de 10 %, decide cuánto crédito tiene cada cliente, ve cuánto gana la empresa en cada venta y maneja las cuentas del equipo. Cada regla se revisa dos veces: en la pantalla y al guardar los datos. Así nadie se puede saltar un permiso."

Idea clave: **cada uno ve y hace solo lo que le toca.** (Detalle en `docs/usuarios-y-roles.md`.)

## 1:10 – 3:20 · Demostración en vivo

1. **Entrar como Camila** (`camila@biobio.cl` / `Venta2026`). "La página la saluda por su nombre y le muestra lo que tiene que hacer hoy: cotizaciones que están por vencer y clientes que tiene que llamar." (20 s)
2. **Pedidos de Venta → nueva cotización**: elegir un cliente, agregar dos productos y poner **15 % de descuento** en uno. "El vendedor ya dice Camila y no se puede cambiar. El IVA y el total se calculan solos. Como el descuento es más de 10 %, el sistema le pide explicar por qué." Guardar. (40 s)
3. Abrir un pedido de **Diego**: "Camila lo puede ver, pero no lo puede cambiar: dice *solo lectura*." (10 s)
4. **Cerrar sesión** y entrar como **Andrea, la jefa**. "En su página aparece *Aprobar descuento*. Si dice que no, tiene que escribir por qué." Aprobar o rechazar con un comentario. Mostrar **cuánto se gana** en el pedido y el **historial de estados**, que dice quién hizo cada cambio y cuándo. (40 s)
5. **Equipo**: "La jefa crea las cuentas, las desactiva cuando alguien se va (no se borran, para no perder sus ventas) y cambia la contraseña si alguien la olvida. Si alguien se equivoca 5 veces con la contraseña, la cuenta se bloquea 15 minutos." (20 s)

## 3:20 – 4:00 · Cómo se guardan los datos (mostrar `docs/mer.png`)

> "Este es nuestro diagrama de datos. Partimos del modelo que nos dio el curso. Al centro está el **pedido de venta** con sus productos, conectado a los clientes, los productos y la lista de precios. Agregamos cuatro tablas nuestras, cada una por una razón: **motivos de pérdida**, para saber por qué se pierde una venta; **aprobaciones de descuento**, para que nadie regale la ganancia; **historial de estados**, para saber quién hizo qué; y **usuarios**, para las cuentas y los permisos."

## 4:00 – 4:35 · Riesgos con los datos y errores de juicio

> "Las contraseñas nunca se guardan tal cual: se guardan convertidas en un código que no se puede leer. De los vendedores guardamos solo lo necesario, sin RUT ni dirección."

> "Usamos dos ideas del curso. La primera es el **sesgo de supervivencia**: si solo guardamos las ventas que se hicieron, nunca sabemos por qué perdemos las otras. Por eso, cuando se pierde una venta, el motivo es obligatorio. La segunda es la **suboptimización**: un vendedor que solo quiere vender más puede dar descuentos muy grandes y la empresa gana menos. Por eso los descuentos grandes los aprueba la jefa."

> "Lo que todavía falta: hoy todo se guarda en el navegador. Para una empresa real, los datos tienen que ir a un servidor."

## 4:35 – 5:00 · Cómo trabajamos y cierre

> "Trabajamos con **Spec Driven Development**, que significa que primero escribimos qué tiene que hacer el sistema y después lo programamos con ayuda de inteligencia artificial. Cada parte tiene un responsable, y antes de juntarla con el resto la revisa otro compañero en GitHub. El sistema tiene **159 pruebas automáticas** y todas pasan. Lo que sigue: una lista de clientes, un tablero de pedidos, poder cambiar la lista de precios y conectarlo con bodega y facturación."

---

## Preguntas probables

| Pregunta | Respuesta corta |
|---|---|
| ¿Quién es el cliente y quién el usuario? | El cliente es la empresa que compra el sistema (Distribuidora Biobío). Los usuarios son los vendedores y la jefa de ventas. |
| ¿Por qué solo dos tipos de usuario? | Son los que usan el sistema todos los días. Finanzas y gerencia quedan para después; gerencia solo podría mirar. |
| ¿Cómo evitan que un vendedor se salte un permiso? | La regla está en la pantalla y también donde se guardan los datos (`storage.js`, `auth.js`). Las pruebas revisan las dos. |
| ¿Cómo guardan las contraseñas? | Cada contraseña se mezcla con un código distinto por persona y se convierte con SHA-256, así no se puede leer. En una empresa real se usaría un método más fuerte (bcrypt o Argon2) en un servidor. |
| ¿Por qué desactivar y no borrar una cuenta? | Para no perder de quién era cada pedido. Las ventas antiguas siguen con el nombre de quien las hizo. |
| ¿Por qué cotización y pedido son un solo documento? | El modelo del curso tiene un solo tipo de documento; el estado muestra todo el camino, de cotización a pedido. En una base de datos real se pueden separar. |
| ¿Cómo se calcula el IVA? | 19 % sobre el precio después del descuento: (subtotal − descuento) × 0,19. |
| ¿Qué es el crédito usado? | La suma de los pedidos confirmados y despachados que todavía no se facturan. |
| ¿Cómo funciona el pronóstico? | Se dibuja la recta que mejor sigue las ventas de los meses pasados (mínimos cuadrados) y se compara con el promedio de los últimos 3 meses. |
| ¿Qué hizo la IA y qué hicieron ustedes? | Nosotros definimos el problema, las reglas y las historias de usuario. La IA escribió código a partir de eso, y nosotros lo revisamos y probamos. |
| ¿Qué pasa si se borran los datos del navegador? | Se pierden. Por eso se pueden exportar e importar. En una versión real estarían en un servidor. |
| ¿Dónde están las decisiones? | En `docs/decisiones.md` y en los Issues de GitHub. |

# Guion de Presentación (5 minutos) · Grupo 5 · Ventas

El profesor elige **un integrante al azar**, así que los seis tenemos que poder decir este guion. Se presenta **directo en la página** (no hay diapositivas). Cada bloque tiene su tiempo y una frase clave para recordar.

## Antes de empezar (preparar la pantalla)

1. Abrir la app (`npm run dev` o el link publicado) en una ventana grande.
2. Entrar como **jefa** (`jefa@biobio.cl` / `Jefa2026`), presionar **Cargar datos de demostración** y cerrar sesión.
3. Dejar abierta la pantalla de entrada. En otra pestaña, `docs/mer.png`.

---

## 0:00 – 0:30 · Problema y cliente

> "Nuestro cliente es **Distribuidora Biobío**, una pyme que vende materiales de construcción a constructoras, colegios y ferreterías. Hoy cotiza con planillas y correos. Pierde ventas sin saber por qué, cada vendedor da el descuento que quiere y a veces le vende a clientes que ya no tienen crédito."

Frase clave: **cotizar rápido, controlar crédito y descuentos, y aprender de lo que se pierde.**

## 0:30 – 1:10 · Usuarios y qué puede hacer cada uno

> "Hay dos usuarios con cuenta. El **vendedor** crea clientes y cotizaciones, pero solo modifica sus propios pedidos. La **jefa de ventas** aprueba descuentos sobre 10 %, fija el crédito, ve el margen y administra las cuentas del equipo. Cada regla se revisa dos veces: en la pantalla y en los datos. Así nadie se salta un permiso aunque abra la consola."

Frase clave: **cada uno ve y hace solo lo que le toca.** (Detalle en `docs/usuarios-y-roles.md`.)

## 1:10 – 3:20 · Demo en vivo

1. **Entrar como Camila** (`camila@biobio.cl` / `Venta2026`). "El panel la saluda y le muestra sus pendientes de hoy: cotizaciones por vencer y clientes que hay que llamar." (20 s)
2. **Pedidos de Venta → nueva cotización**: un cliente, dos productos, **15 % de descuento** en uno. "El vendedor ya dice Camila y no se puede cambiar. El IVA y los totales se calculan solos. Como el descuento pasa el 10 %, pide un motivo." Guardar. (40 s)
3. Abrir un pedido de **Diego**: "Camila lo puede mirar, pero no modificar: dice *solo lectura*." (10 s)
4. **Cerrar sesión** y entrar como **Andrea, la jefa**. "En su panel aparece *Aprobar descuento*. Si lo rechaza, tiene que escribir por qué." Rechazar o aprobar con comentario. Mostrar el **margen** y el **historial de estados** del pedido con el nombre de quién hizo cada cambio. (40 s)
5. **Equipo**: "La jefa crea cuentas, las desactiva cuando alguien se va (no se borran, para no perder sus ventas) y restablece contraseñas. Si alguien se equivoca 5 veces, la cuenta se bloquea 15 minutos." (20 s)

## 3:20 – 4:00 · Datos y modelo (mostrar `docs/mer.png`)

> "Partimos del modelo ERP del curso. El centro es el **pedido de venta** con sus **líneas**, conectado a clientes, productos y lista de precios. Agregamos cuatro tablas propias, cada una con su razón: **motivos de pérdida** para saber por qué se pierde, **aprobaciones de descuento** para controlar el margen, **historial de estados** para saber quién hizo qué, y **usuarios** para las cuentas y los roles."

## 4:00 – 4:35 · Riesgos de los datos y sesgos

> "Las contraseñas nunca se guardan como texto: se guardan revueltas con un código distinto por persona. Del vendedor guardamos solo lo necesario, sin RUT ni dirección. Y usamos dos ideas del curso: **sesgo de supervivencia**, si solo guardamos lo que se vendió nunca sabemos por qué perdemos, por eso el motivo es obligatorio; y **suboptimización**, un vendedor que solo busca vender más puede regalar el margen, por eso existen las aprobaciones."

> "Lo que reconocemos: todo vive en el navegador. Para una empresa real esto va a un servidor con base de datos."

## 4:35 – 5:00 · Cómo trabajamos y cierre

> "Trabajamos con **Spec Driven Development**: primero escribimos qué hay que hacer y después programamos con ayuda de IA. Cada historia tiene un responsable y entra a GitHub por un pull request que revisa otro compañero. Tenemos **159 pruebas automáticas** en verde. Lo que sigue: lista de clientes, tablero de pedidos, mantener la lista de precios y conectar con inventario y facturación."

---

## Preguntas probables

| Pregunta | Respuesta corta |
|---|---|
| ¿Quién es el cliente y quién el usuario? | El cliente es la empresa que adopta el sistema (Distribuidora Biobío). Los usuarios son los vendedores y la jefa de ventas. |
| ¿Por qué solo dos roles? | Son los que usan el módulo todos los días. Finanzas y gerencia quedan para después, gerencia como rol de solo lectura. |
| ¿Cómo evitan que un vendedor se salte un permiso? | La regla está en la pantalla y también en la capa de datos (`storage.js`, `auth.js`); las pruebas revisan las dos. |
| ¿Cómo guardan las contraseñas? | Como SHA-256 de sal + contraseña, con una sal por cuenta. En producción se usaría bcrypt o Argon2 en un servidor. |
| ¿Por qué desactivar y no borrar? | Para no perder de quién era cada pedido; los datos históricos siguen con su nombre. |
| ¿Por qué cotización y pedido son un solo documento? | El template tiene un tipo de documento; el estado muestra todo el camino. En una base de datos real se pueden separar. |
| ¿Cómo se calcula el IVA? | 19 % sobre el neto: (subtotal − descuento) × 0,19. |
| ¿Qué es el crédito usado? | La suma de pedidos confirmados y despachados que aún no se facturan. |
| ¿Cómo funciona el pronóstico? | Recta de mínimos cuadrados sobre los meses cerrados, más promedio móvil de 3 meses. |
| ¿Qué hizo la IA y qué hicieron ustedes? | Nosotros definimos el problema, las reglas y las historias; la IA escribió código desde esos specs; nosotros revisamos y probamos. |
| ¿Qué pasa si se borran los datos del navegador? | Se pierden; por eso existe exportar e importar. En una versión real los datos estarían en un servidor. |
| ¿Dónde están las decisiones? | En `docs/decisiones.md` y en los Issues de GitHub. |

# Guion de Presentación (5 minutos) · Grupo 5 · Ventas

El profesor elige **un integrante al azar**, así que todos deben poder decir este guion. Cada bloque tiene su tiempo y una frase clave para recordar.

Antes de empezar: `npm run dev` abierto; elegir el perfil **Jefe/a de ventas**, cargar los datos de demo (solo el jefe/a ve ese botón) y volver al perfil **Vendedor/a**.

---

## 0:00 – 0:40 · Problema y cliente

> "Elegimos una **ferretería mayorista** que vende a constructoras. Hoy cotiza por planilla y correo. Pierde cotizaciones sin saber por qué, los vendedores dan descuentos sin control y a veces venden a clientes que ya no tienen crédito."

Frase clave: **cotizar, controlar crédito y descuentos, y aprender de lo que se pierde.**

## 0:40 – 1:30 · Modelo de datos (mostrar `docs/mer.png`)

> "Partimos del modelo ERP del curso, sección Ventas. El centro es el **pedido de venta** con sus **líneas**. El pedido se conecta con el cliente, los productos y la lista de precios. Agregamos dos tablas propias: **motivos de pérdida** y **aprobaciones de descuento**. Ambas nacen de un sesgo que queríamos evitar."

## 1:30 – 3:30 · Demo en vivo

1. **Panel**: "Ventas del mes, conversión y top 5 de clientes. La nota de Pareto muestra que el 20 % de los clientes concentra gran parte de las ventas." (20 s)
2. **Pedidos de Venta** → nuevo: cliente, 2 productos, **15 % de descuento**, motivo. Guardar. "El IVA y los totales se calculan solos." (40 s)
3. Cambiar estado a `confirmado` → **bloqueado**: "Sobre 10 % necesita aprobación." (15 s)
4. Perfil **Jefe/a** → aparece el **margen** → aprobar en el Panel → confirmar el pedido. (30 s)
5. **Clientes** → RUT `12.345.678-9` → "RUT inválido". Mostrar crédito usado y disponible. (15 s)

## 3:30 – 4:20 · Sistemas: sesgos y escalabilidad

> "Usamos dos ideas del curso. **Sesgo de supervivencia**: si solo guardamos ventas ganadas, nunca sabemos por qué perdemos; por eso el motivo es obligatorio. **Suboptimización**: el vendedor que maximiza ventas puede destruir el margen; por eso existen las aprobaciones."

> "Hoy los datos viven en el navegador; sirve para un usuario. Para un equipo se necesita un servidor y una base de datos, y el MER ya está separado en esas tablas."

## 4:20 – 5:00 · Cómo lo hicimos y cierre

> "Trabajamos con **Spec Driven Development**: primero la constitución, luego spec, plan, modelo de datos y tareas, y después el código con IA. Tenemos **142 pruebas automáticas** en verde. Lo que sigue: inventario y facturación."

---

## Preguntas probables

| Pregunta | Respuesta corta |
|---|---|
| ¿Por qué cotización y pedido son un solo documento? | El template tiene un tipo de documento; el estado muestra todo el embudo. En la base de datos real se separan. |
| ¿Cómo se calcula el IVA? | 19 % sobre el neto: (subtotal − descuento) × 0,19. |
| ¿Qué es el crédito usado? | La suma de pedidos confirmados y despachados. Cuando se factura, la deuda pasa a Finanzas; conectar con la cobranza es parte del desarrollo futuro. |
| ¿Cómo funciona el pronóstico? | Recta de mínimos cuadrados sobre los meses cerrados, más promedio móvil de 3 meses. El mes en curso no entra porque está incompleto. |
| ¿Qué hizo la IA y qué hicieron ustedes? | La IA escribió código a partir de nuestras specs; nosotros definimos reglas, revisamos y probamos. |
| ¿Dónde están las decisiones? | En `docs/decisiones.md`; los Issues de GitHub se crean a partir de esa tabla. |

# US-15: Iniciar y cerrar sesión con mi cuenta

**Escrita por**: Francisca Arias
**Iteración**: 3 (16 al 22 de noviembre)
**Prioridad**: P1

## Historia

**Como** vendedor/a o jefe/a de ventas, **quiero** entrar al sistema con mi correo y una contraseña, **para** que el sistema sepa quién soy y que nadie más pueda usar mi cuenta.

## Por qué es P1

Hoy cualquiera abre la app y en el selector "Perfil" de arriba elige "Jefe/a de ventas". Con eso un vendedor puede aprobarse su propio descuento, y la regla del 10 % (US-04) no sirve de nada. Además el sistema no sabe quién está usando la app, entonces tampoco puede guardar quién hizo cada cambio. El profe nos dijo que faltaba esto: una cuenta, una contraseña y saber quién es.

## Cómo se prueba sola

Abrir la app sin sesión, entrar con una de las cuentas de prueba, ver el nombre arriba, cerrar sesión y ver que vuelve a la pantalla de entrada.

## Tablas

`users` (nueva, Joaquín la agrega al MER en la US-17) y `employees` (externa).

## Criterios de aceptación

1. **Dado** que no he iniciado sesión, **cuando** abro la app, **entonces** veo solo la pantalla de entrada (correo y contraseña) y no puedo ver clientes ni pedidos.
2. **Dado** un correo y una contraseña correctos, **cuando** presiono "Entrar", **entonces** llego al panel y arriba aparece mi nombre y mi rol.
3. **Dada** una contraseña incorrecta, **cuando** intento entrar, **entonces** aparece "Correo o contraseña incorrectos", sin decir cuál de los dos está malo.
4. **Dados** 5 intentos fallidos seguidos con la misma cuenta, **cuando** intento otra vez, **entonces** la cuenta queda bloqueada 15 minutos y se avisa cuánto falta.
5. **Dada** una sesión abierta, **cuando** presiono "Cerrar sesión" o paso 30 minutos sin usar la app, **entonces** vuelvo a la pantalla de entrada.
6. **Dada** cualquier cuenta, **cuando** se guarda su contraseña, **entonces** se guarda cifrada (con hash), nunca como texto que se pueda leer en el navegador.

## Notas

- Cuentas de prueba: una de jefe/a de ventas y una por cada vendedor de los datos de demostración (Camila, Diego, Valentina y Matías). Las contraseñas de prueba van en el README.
- Como el módulo no tiene servidor, todo queda guardado en el navegador (localStorage). Para el prototipo sirve, pero en una empresa real el inicio de sesión tiene que estar en un servidor. Lo agrego a `docs/riesgos-y-sesgos.md`.
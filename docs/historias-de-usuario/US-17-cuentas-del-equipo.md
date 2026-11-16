# US-17: Administrar las cuentas del equipo

**Escrita por**: Joaquín Espinoza
**Iteración**: 3 (16 al 22 de noviembre)
**Prioridad**: P2
**Depende de**: US-15 y US-16

## Historia

**Como** jefe/a de ventas, **quiero** crear cuentas para los vendedores nuevos, desactivar las de quienes se van y restablecer una contraseña olvidada, **para** controlar quién entra al sistema sin depender de otra persona.

## Por qué es P2

Con las cuentas de prueba ya se puede usar el sistema, por eso no es P1. Pero en una empresa real entran y salen vendedores, y una cuenta activa de alguien que ya no trabaja ahí es un riesgo: podría seguir viendo los clientes y los precios.

## Cómo se prueba sola

Como jefe/a, crear una cuenta nueva, entrar con ella, volver a la cuenta del jefe/a, desactivarla y ver que ya no puede entrar.

## Tablas

`users` (nueva, la agrego al MER) y `employees` (externa).

Cada cuenta (`users`) pertenece a un empleado (`employees`), relación 1 a 1. Campos: `user_id`, `employee_id`, `email`, `password_hash`, `role` (vendedor o jefe), `active`, `failed_attempts`, `locked_until`, `must_change_password` y `last_login_at`.

## Criterios de aceptación

1. **Dada** una cuenta de jefe/a, **cuando** abro "Equipo", **entonces** veo la lista de cuentas con nombre, correo, rol, estado (activa o desactivada) y último ingreso.
2. **Dados** un nombre, un correo, un rol y una contraseña inicial, **cuando** guardo, **entonces** se crea la cuenta. Si el correo ya existe, no se crea y el sistema avisa.
3. **Dada** una contraseña de menos de 8 caracteres o sin ningún número, **cuando** guardo, **entonces** el sistema no la acepta y dice por qué.
4. **Dada** una cuenta desactivada, **cuando** esa persona intenta entrar, **entonces** no puede. Sus clientes y pedidos no se borran y siguen saliendo con su nombre.
5. **Dada** una contraseña restablecida por el jefe/a, **cuando** la persona entra, **entonces** el sistema le pide cambiarla antes de seguir.
6. **Dado** que solo queda un jefe/a activo, **cuando** intento desactivarlo, **entonces** el sistema no deja, para que nunca quede el sistema sin nadie que lo administre.
7. **Dada** una cuenta de vendedor/a, **cuando** miro el menú, **entonces** no aparece "Equipo".

## Notas

En el MER agrego la tabla `users` con su relación a `employees` y actualizo `docs/mer.mmd`, `docs/mer.png` y el `data-model.md`. Se desactiva en vez de borrar para no perder de quién era cada pedido.

# Usuarios y roles · Módulo de Ventas

Este documento junta en un solo lugar **quién usa el módulo, qué puede hacer cada uno y cómo lo controla el sistema**. Lo escribimos en la iteración 3 (16 al 29 de noviembre), cuando reemplazamos el selector "Perfil" por inicio de sesión real (US-15), permisos por rol (US-16) y administración de cuentas (US-17).

## 1. Cliente y usuarios

El **cliente** es quien paga o adopta el sistema: una pyme distribuidora de materiales de construcción (en la demo, *Distribuidora Biobío*), con 3 a 10 vendedores y una jefatura de ventas. Los **usuarios** son las personas que lo usan todos los días.

| Usuario | Quién es en la empresa | Qué necesita | ¿Tiene cuenta en el MVP? |
|---|---|---|---|
| **Vendedor/a** | Ejecutivo comercial que atiende a constructoras, colegios y ferreterías | Cotizar rápido con precios correctos, saber si el cliente tiene crédito y no olvidar sus pendientes | Sí, rol `vendedor` |
| **Jefe/a de ventas** | Responsable del equipo comercial | Controlar descuentos y crédito, ver el margen y el desempeño, y administrar quién entra al sistema | Sí, rol `jefe` |
| Administración / Facturación | Persona de Finanzas que factura | Recibir pedidos confirmados y completos | No (fuera del MVP; lee los pedidos desde su módulo) |
| Gerencia | Dueño o gerente general | Ver la tendencia de ventas y la concentración de clientes | No (fuera del MVP; en una versión futura, rol de solo lectura) |

## 2. Qué puede hacer cada rol

Cada regla de esta tabla se revisa **dos veces**: en la pantalla (se ocultan o bloquean botones) y en la capa de datos (`src/storage.js` y `src/auth.js`). Así, aunque alguien abra la consola del navegador y llame a la función directamente, el sistema lo rechaza. Las pruebas de `tests/integration/ventas.test.js` revisan las dos capas.

| Acción | Vendedor/a | Jefe/a de ventas | Dónde se controla |
|---|---|---|---|
| Entrar con correo y contraseña | Sí | Sí | `auth.js` → `login` |
| Ver clientes y pedidos de todo el equipo | Sí (solo mirar) | Sí | — |
| Crear clientes y cotizaciones | Sí | Sí | `storage.js` |
| Elegir el vendedor de un pedido | No: se llena solo con su nombre | Sí | `addDocument` / `applySellerLock` |
| Modificar, avanzar o eliminar un pedido | Solo los suyos | Todos | `canEditDocument` |
| Fijar o cambiar el límite de crédito de un cliente | No | Sí | `updateEntity` |
| Pedir un descuento sobre 10 % (con motivo) | Sí | Sí | `requestApproval` |
| Aprobar o rechazar descuentos | No | Sí (rechazar exige comentario) | `decideApproval` |
| Ver costo y margen bruto | No | Sí | `refreshSales` (DR-03) |
| Cargar demo, exportar, importar y borrar datos | No | Sí | `dashboard.js` |
| Ver el menú "Equipo" y administrar cuentas | No | Sí | `team.js` / `requireBoss` |
| Ver el historial de estados de un pedido | Sí | Sí | `statusHistory` |

## 3. Cómo funciona la cuenta

| Regla | Valor | Historia |
|---|---|---|
| Identificador de la cuenta | Correo (único, en minúsculas) | US-15 |
| Contraseña mínima | 8 caracteres y al menos un número | US-17 |
| Cómo se guarda la contraseña | SHA-256 de `sal + contraseña`, con una sal distinta por cuenta (Web Crypto). Nunca como texto | US-15 · issue #27 |
| Mensaje si falla | "Correo o contraseña incorrectos." (no dice cuál de los dos) | US-15 |
| Intentos fallidos | 5 seguidos → cuenta bloqueada 15 minutos, con aviso del tiempo que falta | US-15 |
| Inactividad | 30 minutos sin usar la app → vuelve a la pantalla de entrada | US-15 |
| Cuenta nueva o contraseña restablecida | La persona debe cambiarla al entrar | US-17 |
| Alguien deja la empresa | La cuenta se **desactiva**, no se borra: sus pedidos siguen con su nombre | US-17 · issue #25 |
| Último jefe/a activo | No se puede desactivar (el sistema quedaría sin administrador) | US-17 |
| Quién hizo cada cosa | Cambios de estado y decisiones de descuento guardan el nombre de quien tenía la sesión | US-16 · US-12 |

## 4. Cuentas de prueba

Son ficticias y existen solo para probar el prototipo. Se crean la primera vez que se abre la app.

| Nombre | Correo | Contraseña | Rol |
|---|---|---|---|
| Andrea Lagos | `jefa@biobio.cl` | `Jefa2026` | Jefe/a de ventas |
| Camila Rojas | `camila@biobio.cl` | `Venta2026` | Vendedor/a |
| Diego Muñoz | `diego@biobio.cl` | `Venta2026` | Vendedor/a |
| Valentina Soto | `valentina@biobio.cl` | `Venta2026` | Vendedor/a |
| Matías Fuentes | `matias@biobio.cl` | `Venta2026` | Vendedor/a |

## 5. Datos que se guardan de cada persona

Tabla `users` (nueva en el MER, relación 1 a 1 con `employees` de RR.HH.):

| Columna | Para qué sirve |
|---|---|
| `user_id`, `employee_id` | Identifican la cuenta y la persona |
| `email` | Para entrar |
| `password_hash`, `salt` | Para revisar la contraseña sin guardarla |
| `role` | `vendedor` o `jefe`: decide qué puede hacer |
| `active` | Desactivar en vez de borrar |
| `failed_attempts`, `locked_until` | Bloqueo por intentos fallidos |
| `must_change_password` | Obliga a cambiar la contraseña temporal |
| `last_login_at` | Último ingreso (lo ve el jefe/a en "Equipo") |

No guardamos RUT, dirección, edad ni ningún otro dato personal del vendedor: no hacen falta para vender, y menos datos significa menos riesgo (principio de minimización).

## 6. Límites que reconocemos

- Todo vive en el navegador (`localStorage`). Sirve para el prototipo, pero alguien con acceso al computador podría borrar o copiar los datos. En una empresa real, las cuentas y las reglas tienen que estar en un servidor con base de datos y conexión segura (HTTPS).
- SHA-256 con sal es mejor que guardar la contraseña a la vista, pero en producción se usaría un algoritmo lento hecho para contraseñas (bcrypt o Argon2) en el servidor.
- Las contraseñas de prueba están escritas en este documento y en la pantalla de entrada para que el profe pueda revisar. En un sistema real no se publicarían.

Detalle de riesgos y sesgos en [`riesgos-y-sesgos.md`](riesgos-y-sesgos.md).

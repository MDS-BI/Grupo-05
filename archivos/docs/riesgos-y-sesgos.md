# Riesgos de Datos, Privacidad y Sesgos · Módulo de Ventas

Este documento responde al **principio V** de la [constitución](../.specify/memory/constitution.md) y a la pauta, que pide analizar usuarios, riesgos de datos y sesgos.

## 1. Usuarios y lo que ven

| Usuario | Qué hace | Qué **no** ve |
|---|---|---|
| Vendedor/a | Clientes, cotizaciones, pedidos; pide descuentos con motivo | Margen y costo; no aprueba descuentos; no exporta ni borra datos |
| Jefe/a de ventas | Todo lo anterior + aprobar descuentos, exportar e importar | — |
| Administración (fuera del MVP) | Recibe pedidos para facturar | Margen y costo |
| Gerencia (fuera del MVP) | Indicadores del panel, incluido el margen | — |

Matriz completa de permisos: [`plan.md` §3](../plan.md).

En el MVP los perfiles son **simulados** (selector arriba a la derecha). En producción se necesita inicio de sesión real.

## 2. Riesgos de datos personales

| Riesgo | Ejemplo | Cómo lo maneja el MVP | Pendiente para producción |
|---|---|---|---|
| Guardar datos de más | Pedir fecha de nacimiento del contacto | Solo datos para vender, cobrar y despachar (RUT, contacto, dirección) | Política de retención |
| Datos reales en pruebas | Usar la base de un cliente real en la demo | Datos de demostración **ficticios** y deterministas | — |
| Filtración desde el navegador | Otro usuario del mismo computador abre la app | — (limitación de `localStorage`) | Backend con login y cifrado |
| Exportación sin control | Archivo JSON con todos los clientes | Exportar, importar y borrar todo: solo perfil jefe/a | Registrar quién exporta (requiere login) |
| Inyección de código | Un nombre de cliente con `<script>` | Todo se muestra como texto (FR-V15) | — |

Marco legal: **Ley 19.628** de protección de la vida privada y la nueva **Ley 21.719** (vigencia gradual). Los datos de empresas (RUT de persona jurídica) son menos sensibles, pero un cliente puede ser persona natural.

## 3. Sesgos en los datos y en las reglas

| Sesgo | Cómo aparecería | Qué hicimos |
|---|---|---|
| **Sesgo de supervivencia** | Si solo se guardan las ventas ganadas, el panel dice "todo va bien" y nadie sabe por qué se pierden clientes | Motivo **obligatorio** al marcar `perdida`; gráfico de motivos en el panel; tasa de conversión |
| **Suboptimización** (Meadows) | El vendedor premiado por monto vendido regala descuentos y destruye el margen | Descuentos > 10 % pasan por aprobación con motivo obligatorio, vendedor solicitante, quién decidió y cuándo; margen visible para el jefe/a |
| **Trato desigual** | Descuentos generosos solo para clientes "conocidos" | Registro de aprobaciones; descuento promedio en el panel. Límite del MVP: el perfil jefe/a es simulado, así que el registro es auditable solo cuando haya inicio de sesión real |
| **Discriminación en el crédito** | Negar crédito por la comuna del cliente | El crédito se evalúa solo con el límite y los pedidos vigentes, nunca con ubicación ni atributos personales |
| **Sesgo del mes incompleto** | El mes en curso parece una caída de ventas y arrastra el pronóstico hacia abajo | El mes en curso se marca con `*` y **no** entra al cálculo de tendencia |
| **Pocos datos** | Un pronóstico con 5 meses parece más seguro de lo que es | Se presenta como referencia, junto al promedio móvil, no como meta |
| **Concentración (Pareto)** | Depender de 2–3 clientes grandes | Nota 20/80 en el panel: % de ventas del 20 % de clientes que más compran |

## 4. Riesgos operativos

- **Datos que se pierden:** `localStorage` se borra si el usuario limpia el navegador → botón de **exportar** como respaldo.
- **Doble confirmación de crédito** con varios usuarios → ver [análisis de escalabilidad](analisis-escalabilidad.md) §2.
- **Errores de tipeo en el RUT** → validación módulo 11 y unicidad.
- **Borrar la historia** → un documento en cualquier estado distinto de `cotización` o `enviada`, y el cliente que lo tenga, no se puede eliminar (FR-V17).
- **Deuda facturada no pagada** → el crédito usado cuenta pedidos confirmados y despachados; al facturar, la deuda pasa a Finanzas y Ventas no la ve hasta integrarse con cuentas por cobrar (`ar_invoices`). Mientras tanto, la jefatura debe ajustar el límite de crédito de clientes morosos.
- **Perfiles simulados** → cualquiera puede elegir "jefe/a" en el MVP; con inicio de sesión real, las aprobaciones guardarán el `employee_id` de quien decide.

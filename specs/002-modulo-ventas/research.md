# Investigación y Decisiones: Módulo de Ventas

Cada decisión indica qué elegimos, por qué y qué alternativas se descartaron. Las decisiones de alcance también están registradas como *Issues* con la etiqueta `decision`.

## D1. Partir del módulo base del curso y reconstruir `src/`

**Decisión**: el repositorio recibido traía specs, pruebas y README del template, pero no la carpeta `src/` ni el `index.html`. Reconstruimos el núcleo siguiendo `specs/001-erp-base-module` y su contrato de pruebas: las **111 pruebas del template pasan**.
**Por qué**: las pruebas definen con precisión la interfaz (ids, mensajes y funciones exportadas). Cumplirlas garantiza que el módulo es compatible con el template de los demás grupos.
**Alternativa**: escribir una app de Ventas desde cero. Se descartó porque rompería la "interconexión entre módulos" que pide el objetivo del trabajo.

## D2. Cotización y pedido como un solo documento con estados

**Decisión**: un `Pedido de Venta` nace como `cotización` y avanza por `enviada → confirmado → despachado → facturado`, o termina en `perdida` o `anulado`.
**Por qué**: el template maneja un solo tipo de documento. Además, así se mide la **tasa de conversión** sin cruzar dos tablas.
**Alternativa**: dos documentos (`sales_quotes` y `sales_orders`), como en el modelo ERP del curso. Queda como desarrollo futuro; el MER muestra ambas tablas y la relación "se convierte en".

## D3. Líneas de producto guardadas dentro del documento

**Decisión**: `lines` es un arreglo dentro de cada documento en `localStorage`. Equivale a la tabla `sales_order_lines` (relación 1:N).
**Por qué**: `localStorage` guarda listas JSON; anidar evita "joins" manuales y mantiene atómico el guardado del pedido.
**Alternativa**: una clave separada `sales_order_lines`. En una base de datos real sí sería una tabla aparte (ver escalabilidad).

## D4. Copiar el precio de lista a la línea

**Por qué**: si la lista cambia mañana, los pedidos antiguos no deben cambiar su valor. Es una práctica estándar en ERP.

## D5. Crédito usado = pedidos `confirmado` + `despachado`

**Por qué**: sin módulo de cobranza, un pedido `facturado` pasa a Finanzas (cuentas por cobrar). Lo comprometido y aún no facturado es lo que Ventas controla.
**Limitación**: no considera facturas impagas. Cuando exista el módulo de Finanzas, el crédito usado debe sumar `ar_invoices` pendientes.

## D6. Aprobación de descuentos sobre 10 % en una tabla propia

**Decisión**: `discount_approvals` con %, motivo, decisión, aprobador y fechas. Solo se confirma con una aprobación vigente por un % igual o mayor.
**Por qué (sistémico)**: si la meta del vendedor es el volumen, tiende a dar descuentos que reducen el margen global. Es **suboptimización** (Meadows, cap. 3: jerarquía). La aprobación reconecta la meta local con la del sistema.
**Por qué (sesgos)**: los descuentos discrecionales pueden tratar distinto a clientes parecidos; dejar motivo y aprobador permite auditarlo.

## D7. Motivo obligatorio al perder una cotización

**Por qué**: analizar solo las ventas ganadas produce **sesgo de supervivencia**. Si no se sabe por qué se pierde, no se puede corregir (precio, plazo o stock).

## D8. Perfiles simulados (vendedor / jefe)

**Decisión**: un selector en la barra superior; el vendedor no ve margen ni aprueba.
**Por qué**: el MVP es solo frontend y no tiene inicio de sesión. Igual demostramos el **principio de mínimo privilegio** sobre datos sensibles (costos y margen).
**Limitación conocida**: cualquiera puede cambiar el selector. Es una demostración del diseño, no una medida de seguridad.

## D9. Pronóstico simple y explicable

**Decisión**: recta de **mínimos cuadrados** `y = a + b·t` sobre los meses cerrados, más un promedio móvil de 3 meses. El mes en curso no se usa porque está incompleto.
**Por qué**: el usuario lo puede entender y verificar en Excel o MATLAB (la misma técnica de Cálculo Numérico). Modelos más complejos no se justifican con pocos meses de datos.

## D10. RUT validado con módulo 11

**Por qué**: un RUT mal escrito impide facturar y duplica clientes. Se guarda formateado y se busca con o sin puntos.

## D11. Sin dependencias nuevas

**Por qué**: el template prioriza un mínimo de librerías. Gráfico de barras hecho con CSS, formato CLP propio y texto siempre insertado con `textContent` (previene XSS).

## Fuentes

- Template *ERP Software Base Module* (J. C. Caro, repositorio MDS-BI).
- *ERP Relational Data Model* del equipo docente (sección 5, Sales Module).
- Meadows, D. H. (2008). *Thinking in Systems: A Primer*. Chelsea Green.
- Servicio de Impuestos Internos (SII): IVA 19 %; el RUT usa dígito verificador módulo 11.

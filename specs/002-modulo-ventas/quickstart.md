# Inicio Rápido: Módulo de Ventas

## Requisitos

- [Node.js](https://nodejs.org/) 20 o superior (incluye `npm`)
- Un navegador moderno (Chrome, Edge, Firefox o Safari)

## Ejecutar

```bash
git clone https://github.com/MDS-BI/grupo-05.git
cd grupo-05
npm install
npm run dev
```

Abre la dirección que muestra la terminal (normalmente http://localhost:5173).

## Recorrido de demostración (≈ 3 minutos)

1. Arriba a la derecha, cambia el **Perfil** a *Jefe/a de ventas*: aparecen el **margen bruto**, los botones para aprobar descuentos y los de datos (cargar demo, exportar, importar, borrar).
2. En el **Panel**, presiona **Cargar datos de demostración** (todos los datos son ficticios).
3. Revisa los indicadores, el top 5 de clientes, los motivos de pérdida y el gráfico con pronóstico.
4. Ve a **Pedidos de Venta**:
   - elige un cliente, agrega 2 productos y pon 15 % de descuento en uno;
   - escribe el motivo del descuento y guarda;
   - cambia el estado a `confirmado` y guarda: el sistema lo bloquea hasta que se apruebe.
5. Vuelve al **Panel** y **aprueba** la solicitud. Regresa al pedido y confírmalo.
6. Ve a **Clientes**, elige uno y revisa su crédito usado y disponible. Prueba guardar un RUT inválido (`12.345.678-9`).
7. En **Búsqueda**, escribe parte de un RUT sin puntos o el nombre de un cliente: verás sus pedidos con el estado.

## Pruebas automáticas

```bash
npm test          # modo observación
npx vitest run    # una sola ejecución (142 pruebas)
```

## Volver al módulo base genérico

En `src/module-config.js`, cambia `export const userConfig = ventasProfile;` por `export const userConfig = null;`.

# Contrato de Almacenamiento: Módulo de Ventas

Extiende [`001-erp-base-module/contracts/entity-storage.md`](../../001-erp-base-module/contracts/entity-storage.md). Todo se guarda en `localStorage` como listas JSON.

| Clave | Contenido | Tabla del MER |
|---|---|---|
| `erp_base_module:entities` | Clientes | `customers` |
| `erp_base_module:documents` | Cotizaciones y pedidos, con sus líneas anidadas | `sales_quotes` + `sales_quote_lines` + `sales_orders` + `sales_order_lines` |
| `erp_base_module:discount_approvals` | Solicitudes y decisiones de descuento | `discount_approvals` |
| `erp_base_module:role` | Perfil simulado (`vendedor` / `jefe`) | (sesión) |

Catálogo de productos, vendedores y motivos de pérdida: viven en `src/profiles/ventas.js` (equivalen a `products`/`price_list_items`, `employees` y `lost_reasons`).

## Cliente (además de los campos base)

```json
{
  "id": "ent_…", "entity_id": "E_…",
  "name": "Constructora Bío Bío Sur Ltda.", "code": "CLI-001",
  "taxId": "76.100.000-4", "email": "compras1@cliente-demo.cl",
  "category": "Empresa", "creditLimit": 6000000, "paymentTerms": "Neto 30",
  "ejecutivo": "Camila Rojas",
  "createdAt": "2026-10-13T…", "updatedAt": "2026-10-13T…"
}
```

## Pedido de Venta

```json
{
  "id": "doc_…", "entity_id": "E_…", "series": "NV", "folio": 1001,
  "startDate": "2026-10-13", "endDate": "2026-10-28",
  "lines": [ { "sku": "TOR-001", "name": "Tornillo…", "quantity": 10, "unitPrice": 4990, "discountPct": 5 } ],
  "quantity": 10, "subtotal": 49900, "discount": 2495, "taxAmount": 9007, "totalAmount": 56412,
  "currency": "CLP", "paymentTerms": "Neto 30", "notes": "",
  "status": "cotización", "vendedor": "Camila Rojas", "motivoPerdida": "",
  "createdAt": "…", "updatedAt": "…"
}
```

Invariantes:

- `subtotal`, `discount`, `taxAmount`, `totalAmount` y `quantity` **siempre** se recalculan desde `lines` al guardar; no se aceptan valores escritos a mano.
- `status ∈ statusLifecycle.statuses` y cada cambio respeta `transitions`.
- Si `status = perdida`, entonces `motivoPerdida ≠ ""`.
- Si `status ∉ openStatuses`, `lines` no puede cambiar.
- Si `status ∉ openStatuses`, el documento no se elimina; un cliente con documentos así tampoco.

## Aprobación de descuento

```json
{
  "approval_id": "apr_…", "sales_order_id": "doc_…", "discount_pct": 15,
  "reason": "Compra por volumen", "requested_by": "Camila Rojas",
  "decision": "pendiente | aprobado | rechazado",
  "approved_by": "Jefe/a de ventas", "requested_at": "…", "decided_at": "…"
}
```

## Operaciones nuevas (`src/storage.js`)

| Función | Qué hace |
|---|---|
| `requestApproval(docId, pct, reason)` | Crea una solicitud `pendiente` (no duplica si ya hay una vigente por ese %) |
| `decideApproval(approvalId, decision, approver)` | Registra `aprobado` o `rechazado`, quién decidió y cuándo |
| `latestApproval(docId)` / `pendingApprovals()` | Consultas para la interfaz y la validación |
| `nextFolio(series)` | Siguiente folio de la serie (inicia en 1001) |
| `exportData()` / `importData(data)` | Respaldo y restauración en JSON |
| `validateDocument(input, { id })` | Validación base + reglas de ventas (líneas, pérdida, aprobación, crédito) |

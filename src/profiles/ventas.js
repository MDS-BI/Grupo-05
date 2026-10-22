// Perfil del Módulo de Ventas (Grupo 5).
// Todos los datos de ejemplo (productos, vendedores) son ficticios.

export const ventasProfile = {
  moduleName: 'Ventas',

  labels: {
    entity: 'Cliente',
    entities: 'Clientes',
    document: 'Pedido de Venta',
    documents: 'Pedidos de Venta'
  },

  // Nombres de los campos base tal como los ve el usuario de Ventas.
  fieldLabels: {
    entity: {
      name: 'Razón social',
      code: 'Código de cliente',
      taxId: 'RUT',
      category: 'Segmento',
      targetDate: 'Próximo contacto',
      creditLimit: 'Límite de crédito (CLP)',
      paymentTerms: 'Condición de pago'
    },
    document: {
      series: 'Serie',
      folio: 'Folio',
      startDate: 'Fecha de emisión',
      endDate: 'Válida hasta / entrega',
      quantity: 'Unidades totales',
      subtotal: 'Subtotal bruto',
      discount: 'Descuento ($)',
      taxAmount: 'IVA',
      totalAmount: 'Total',
      paymentTerms: 'Condición de pago'
    }
  },

  customFields: [
    { target: 'entity', key: 'ejecutivo', label: 'Ejecutivo asignado', type: 'select', options: ['Camila Rojas', 'Diego Muñoz', 'Valentina Soto', 'Matías Fuentes'] },
    { target: 'document', key: 'vendedor', label: 'Vendedor', type: 'select', required: true, options: ['Camila Rojas', 'Diego Muñoz', 'Valentina Soto', 'Matías Fuentes'] },
    { target: 'document', key: 'motivoPerdida', label: 'Motivo de pérdida', type: 'select', options: ['Precio', 'Plazo de entrega', 'Sin stock', 'Competencia', 'Otro'] }
  ],

  // Ciclo de vida: la cotización y el pedido son el mismo documento en distintas etapas.
  statusLifecycle: {
    statuses: ['cotización', 'enviada', 'perdida', 'confirmado', 'despachado', 'facturado', 'anulado'],
    transitions: {
      'cotización': ['enviada', 'confirmado', 'perdida', 'anulado'],
      'enviada': ['confirmado', 'perdida', 'anulado'],
      'perdida': [],
      'confirmado': ['despachado', 'anulado'],
      'despachado': ['facturado'],
      'facturado': [],
      'anulado': []
    }
  },

  theme: { accentColor: '#0f766e' },

  // Extensión propia del Módulo de Ventas.
  sales: {
    taxRate: 0.19,                    // IVA Chile
    currency: 'CLP',
    discountApprovalThreshold: 10,    // % de descuento por línea sobre el cual se exige aprobación
    validateRut: true,
    openStatuses: ['cotización', 'enviada'],
    newDocumentStatuses: ['cotización', 'confirmado'],   // estados con los que puede nacer un documento (confirmado = venta directa)
    confirmedStatuses: ['confirmado', 'despachado', 'facturado'],
    committedStatuses: ['confirmado', 'despachado'],   // consumen crédito del cliente
    lostStatus: 'perdida',
    lostReasonField: 'motivoPerdida',
    sellers: ['Camila Rojas', 'Diego Muñoz', 'Valentina Soto', 'Matías Fuentes'],
    lostReasons: ['Precio', 'Plazo de entrega', 'Sin stock', 'Competencia', 'Otro'],
    // Lista de precios vigente (price_list_items). Precios netos en CLP.
    products: [
      { sku: 'TOR-001', name: 'Tornillo autoperforante 8x1" (caja 100)', unitPrice: 4990, standardCost: 3100 },
      { sku: 'TOR-002', name: 'Tornillo volcanita 6x1 1/4" (caja 500)', unitPrice: 8990, standardCost: 5600 },
      { sku: 'PIN-010', name: 'Pintura látex blanco 1 galón', unitPrice: 15990, standardCost: 10200 },
      { sku: 'PIN-011', name: 'Esmalte sintético negro 1/4 galón', unitPrice: 7990, standardCost: 4800 },
      { sku: 'CEM-100', name: 'Cemento especial saco 25 kg', unitPrice: 5490, standardCost: 4300 },
      { sku: 'FIE-200', name: 'Fierro estriado 10 mm x 6 m', unitPrice: 6290, standardCost: 4900 },
      { sku: 'HER-300', name: 'Taladro percutor 650 W', unitPrice: 39990, standardCost: 26500 },
      { sku: 'HER-301', name: 'Esmeril angular 4 1/2" 850 W', unitPrice: 34990, standardCost: 23800 },
      { sku: 'ELE-400', name: 'Cable eléctrico 2,5 mm rollo 100 m', unitPrice: 54990, standardCost: 41000 },
      { sku: 'GAS-500', name: 'Llave de paso gas 1/2"', unitPrice: 9490, standardCost: 5900 },
      { sku: 'SEG-600', name: 'Guantes de seguridad nitrilo (par)', unitPrice: 2490, standardCost: 1300 },
      { sku: 'SEG-601', name: 'Casco de seguridad blanco', unitPrice: 6990, standardCost: 4100 }
    ]
  }
};

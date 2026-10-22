import { describe, it, expect } from 'vitest';
import {
  isValidRut, formatRut, rutCheckDigit, computeLine, computeTotals, validateLines, requiresApproval,
  maxDiscountPct, creditUsed, creditCheck, salesKpis, monthlySales, movingAverage, linearTrend
} from '../../src/sales/sales-logic.js';
import { normalizeConfig } from '../../src/module-config.js';
import { ventasProfile } from '../../src/profiles/ventas.js';
import { buildDemoData } from '../../src/sales/demo-data.js';

const sales = normalizeConfig(ventasProfile).config.sales;

describe('RUT chileno', () => {
  it('acepta RUT válidos con y sin formato', () => {
    expect(isValidRut('12.345.678-5')).toBe(true);
    expect(isValidRut('123456785')).toBe(true);
    expect(isValidRut('7.654.321-6')).toBe(true);
  });

  it('acepta dígito verificador K y 0', () => {
    const bodyK = ['1000005', '1000013', '1000021', '1000048'].find(b => rutCheckDigit(b) === 'K');
    expect(bodyK).toBeDefined();
    expect(isValidRut(`${bodyK}-k`)).toBe(true);
    expect(rutCheckDigit('11111111')).toBe('1');
  });

  it('rechaza dígitos verificadores incorrectos y textos mal formados', () => {
    expect(isValidRut('12.345.678-9')).toBe(false);
    expect(isValidRut('abc')).toBe(false);
    expect(isValidRut('')).toBe(false);
  });

  it('formatea con puntos y guion', () => {
    expect(formatRut('123456785')).toBe('12.345.678-5');
  });
});

describe('líneas y totales del pedido', () => {
  it('calcula el total de línea con descuento', () => {
    expect(computeLine({ quantity: 10, unitPrice: 1000, discountPct: 5 })).toEqual({ gross: 10000, discountAmount: 500, lineTotal: 9500 });
  });

  it('calcula subtotal, descuento, IVA 19 % y total', () => {
    const t = computeTotals([
      { quantity: 10, unitPrice: 1000, discountPct: 5 },
      { quantity: 2, unitPrice: 2500, discountPct: 0 }
    ], 0.19);
    expect(t).toEqual({ quantity: 12, subtotal: 15000, discount: 500, taxAmount: 2755, totalAmount: 17255 });
  });

  it('exige al menos una línea válida', () => {
    expect(validateLines([])).toHaveLength(1);
    expect(validateLines([{ sku: '', quantity: 0, unitPrice: 0, discountPct: 120 }]).length).toBe(4);
    expect(validateLines([{ sku: 'A', quantity: 2, unitPrice: 10, discountPct: 0 }])).toEqual([]);
  });

  it('detecta descuentos que requieren aprobación (más de 10 %)', () => {
    const lines = [{ discountPct: 5 }, { discountPct: 12 }];
    expect(maxDiscountPct(lines)).toBe(12);
    expect(requiresApproval(lines, 10)).toBe(true);
    expect(requiresApproval([{ discountPct: 10 }], 10)).toBe(false);
  });
});

describe('crédito del cliente', () => {
  const docs = [
    { id: 'a', entity_id: 'E1', status: 'confirmado', totalAmount: 300 },
    { id: 'b', entity_id: 'E1', status: 'despachado', totalAmount: 200 },
    { id: 'c', entity_id: 'E1', status: 'facturado', totalAmount: 900 },
    { id: 'd', entity_id: 'E1', status: 'cotización', totalAmount: 999 },
    { id: 'e', entity_id: 'E2', status: 'confirmado', totalAmount: 50 }
  ];

  it('suma solo pedidos confirmados y despachados del cliente', () => {
    expect(creditUsed('E1', docs, sales.committedStatuses)).toBe(500);
    expect(creditUsed('E1', docs, sales.committedStatuses, 'a')).toBe(200);
  });

  it('bloquea cuando el pedido supera el crédito disponible', () => {
    const entity = { entity_id: 'E1', creditLimit: 1000 };
    expect(creditCheck(entity, docs, sales.committedStatuses, 500).ok).toBe(true);
    expect(creditCheck(entity, docs, sales.committedStatuses, 501).ok).toBe(false);
    expect(creditCheck({ entity_id: 'E1', creditLimit: '' }, docs, sales.committedStatuses, 1e9).ok).toBe(true);
  });
});

describe('indicadores y pronóstico', () => {
  const docs = [
    { id: '1', entity_id: 'E1', status: 'facturado', startDate: '2026-10-02', totalAmount: 1190, lines: [{ sku: 'TOR-001', quantity: 1, unitPrice: 1000, discountPct: 0 }] },
    { id: '2', entity_id: 'E2', status: 'confirmado', startDate: '2026-09-10', totalAmount: 595, lines: [{ sku: 'TOR-001', quantity: 1, unitPrice: 500, discountPct: 0 }] },
    { id: '3', entity_id: 'E2', status: 'perdida', startDate: '2026-10-05', totalAmount: 100, motivoPerdida: 'Precio', lines: [] },
    { id: '4', entity_id: 'E1', status: 'enviada', startDate: '2026-10-06', totalAmount: 100, lines: [] }
  ];
  const entities = [{ entity_id: 'E1', name: 'Uno' }, { entity_id: 'E2', name: 'Dos' }];

  it('calcula ventas del mes, conversión, cotizaciones abiertas y motivos de pérdida', () => {
    const k = salesKpis(docs, entities, sales, '2026-10');
    expect(k.monthSales).toBe(1190);
    expect(k.openQuotes).toBe(1);
    expect(k.conversionRate).toBeCloseTo(2 / 3);
    expect(k.lostByReason).toEqual({ Precio: 1 });
    expect(k.topCustomers[0]).toEqual({ entity_id: 'E1', name: 'Uno', amount: 1190 });
  });

  it('calcula el margen bruto con el costo estándar', () => {
    const k = salesKpis(docs, entities, sales, '2026-10');
    // ventas netas 1500, costo 2 × 3100 = 6200 → margen negativo en este ejemplo artificial
    expect(k.marginPct).toBeCloseTo((1500 - 6200) / 1500);
  });

  it('agrupa ventas por mes y proyecta con mínimos cuadrados', () => {
    expect(monthlySales(docs, sales.confirmedStatuses)).toEqual([
      { month: '2026-09', amount: 595 }, { month: '2026-10', amount: 1190 }
    ]);
    const trend = linearTrend([10, 20, 30]);
    expect(trend.b).toBeCloseTo(10);
    expect(trend.a).toBeCloseTo(0);
    expect(trend.next).toBeCloseTo(40);
    expect(movingAverage([10, 20, 30, 40], 3)).toBe(30);
    expect(linearTrend([5])).toBeNull();
  });
});

describe('datos de demostración', () => {
  it('genera clientes con RUT válidos y pedidos con totales consistentes', () => {
    const data = buildDemoData(sales, '2026-10-13');
    expect(data.entities.length).toBe(10);
    expect(data.entities.every(e => isValidRut(e.taxId))).toBe(true);
    expect(data.documents.length).toBeGreaterThan(20);
    for(const d of data.documents){
      expect(d.totalAmount).toBe(computeTotals(d.lines, 0.19).totalAmount);
      if(d.status === 'perdida') expect(d.motivoPerdida).not.toBe('');
      expect(d.startDate <= '2026-10-13').toBe(true);
    }
  });
});

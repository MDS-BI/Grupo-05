// Datos de demostración 100 % ficticios (empresas, RUT y montos inventados).
// Son deterministas para que la demo se vea igual en cada computador.

import { rutCheckDigit, formatRut, computeTotals } from './sales-logic.js';

const CUSTOMERS = [
  ['Constructora Bío Bío Sur Ltda.', 'Empresa', 6000000, 'Neto 30'],
  ['Ferretería El Faro SpA', 'Mayorista', 4000000, 'Neto 30'],
  ['Inmobiliaria Andalién S.A.', 'Empresa', 8000000, 'Neto 60'],
  ['Comercial Lomas Coloradas Ltda.', 'Mayorista', 2500000, 'Neto 30'],
  ['Maestranza Talcahuano SpA', 'Empresa', 3000000, 'Neto 30'],
  ['Juan Pérez Soto (contratista)', 'Minorista', 500000, 'Contado'],
  ['Servicios Eléctricos Penco Ltda.', 'Empresa', 1500000, 'Neto 30'],
  ['Ferretería Chiguayante Express', 'Mayorista', 2000000, 'Neto 30'],
  ['Colegio Particular Pedro de Valdivia', 'Empresa', 1000000, 'Neto 30'],
  ['Remodelaciones Hualpén SpA', 'Minorista', 800000, 'Contado']
];
const EXECUTIVES = ['Camila Rojas', 'Diego Muñoz', 'Valentina Soto', 'Matías Fuentes'];

// Generador pseudoaleatorio simple con semilla fija (mulberry32).
function rng(seed){
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shiftMonth(dateStr, months, day){
  const [y, m] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, day));
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, days){
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function buildDemoData(sales, todayStr){
  const rand = rng(20261013);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const ts = new Date().toISOString();

  const entities = CUSTOMERS.map(([name, segment, limit, terms], i) => {
    const body = String(76100000 + i * 13457);
    return {
      id: `ent_demo${i}`,
      entity_id: `E_demo${i}`,
      name,
      code: `CLI-${String(i + 1).padStart(3, '0')}`,
      taxId: formatRut(body + rutCheckDigit(body)),
      email: `compras${i + 1}@cliente-demo.cl`,
      phone: `+56 41 2${String(100000 + i * 7919).slice(-6)}`,
      address: 'Concepción, Región del Biobío',
      category: segment,
      description: '',
      targetDate: '',
      creditLimit: limit,
      paymentTerms: terms,
      ejecutivo: EXECUTIVES[i % EXECUTIVES.length],
      createdAt: ts,
      updatedAt: ts
    };
  });

  const documents = [];
  const approvals = [];
  let folio = 1000;
  const todayDay = Number(todayStr.slice(8, 10));
  // 6 meses de historia: más pedidos en los meses recientes (tendencia al alza).
  for(let back = 5; back >= 0; back--){
    const count = 4 + (5 - back);
    for(let n = 0; n < count; n++){
      const customer = entities[Math.floor(Math.pow(rand(), 1.6) * entities.length)];
      const maxDay = back === 0 ? Math.max(1, todayDay) : 26;
      const startDate = shiftMonth(todayStr, -back, 1 + Math.floor(rand() * maxDay));
      if(startDate > todayStr) continue;
      const lineCount = 1 + Math.floor(rand() * 3);
      const lines = [];
      for(let j = 0; j < lineCount; j++){
        const p = pick(sales.products);
        if(lines.some(l => l.sku === p.sku)) continue;
        const discountPct = rand() < 0.7 ? 0 : pick([3, 5, 8, 10, 15]);
        lines.push({ sku: p.sku, name: p.name, quantity: 1 + Math.floor(rand() * 12), unitPrice: p.unitPrice, discountPct });
      }
      const r = rand();
      let status;
      if(back >= 2) status = r < 0.55 ? 'facturado' : r < 0.75 ? 'perdida' : r < 0.85 ? 'despachado' : 'anulado';
      else if(back === 1) status = r < 0.35 ? 'facturado' : r < 0.6 ? 'despachado' : r < 0.8 ? 'perdida' : 'confirmado';
      else status = r < 0.3 ? 'cotización' : r < 0.55 ? 'enviada' : r < 0.8 ? 'confirmado' : 'perdida';

      folio += 1;
      const doc = {
        id: `doc_demo${folio}`,
        entity_id: customer.entity_id,
        series: 'NV',
        folio,
        startDate,
        endDate: addDays(startDate, 15),
        lines,
        ...computeTotals(lines, sales.taxRate),
        currency: sales.currency,
        paymentTerms: customer.paymentTerms,
        notes: '',
        status,
        vendedor: customer.ejecutivo,
        motivoPerdida: status === 'perdida' ? pick(['Precio', 'Precio', 'Plazo de entrega', 'Sin stock', 'Competencia']) : '',
        createdAt: ts,
        updatedAt: ts
      };
      documents.push(doc);
      const maxPct = Math.max(...lines.map(l => l.discountPct));
      if(maxPct > sales.discountApprovalThreshold){
        const confirmed = sales.confirmedStatuses.includes(status);
        approvals.push({
          approval_id: `apr_demo${folio}`,
          sales_order_id: doc.id,
          discount_pct: maxPct,
          reason: 'Compra por volumen',
          requested_by: doc.vendedor,
          decision: confirmed ? 'aprobado' : 'pendiente',
          approved_by: confirmed ? 'Jefe/a de ventas' : '',
          requested_at: ts,
          decided_at: confirmed ? ts : ''
        });
      }
    }
  }
  // Garantiza un caso de descuento pendiente para mostrar el flujo de aprobación en la demo.
  if(!approvals.some(a => a.decision === 'pendiente')){
    const open = [...documents].reverse().find(d => sales.openStatuses.includes(d.status));
    if(open){
      open.lines[0].discountPct = 15;
      Object.assign(open, computeTotals(open.lines, sales.taxRate));
      approvals.push({
        approval_id: `apr_demo${open.folio}`, sales_order_id: open.id, discount_pct: 15,
        reason: 'Cliente estratégico: pidió igualar precio de la competencia', requested_by: open.vendedor, decision: 'pendiente',
        approved_by: '', requested_at: ts, decided_at: ''
      });
    }
  }
  return { entities, documents, discount_approvals: approvals };
}

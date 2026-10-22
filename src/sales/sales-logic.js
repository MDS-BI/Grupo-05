// Reglas de negocio del Módulo de Ventas (funciones puras, sin DOM ni almacenamiento).

// ---------------------------------------------------------------------------
// RUT chileno
// ---------------------------------------------------------------------------

/** Limpia un RUT: quita puntos, espacios y guion, y deja la K en mayúscula. */
export function cleanRut(rut){
  return String(rut ?? '').replace(/[.\s-]/g, '').toUpperCase();
}

/** Calcula el dígito verificador con el algoritmo módulo 11. */
export function rutCheckDigit(body){
  let sum = 0;
  let factor = 2;
  for(let i = body.length - 1; i >= 0; i--){
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const rest = 11 - (sum % 11);
  if(rest === 11) return '0';
  if(rest === 10) return 'K';
  return String(rest);
}

export function isValidRut(rut){
  const clean = cleanRut(rut);
  if(!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  return rutCheckDigit(body) === clean.slice(-1);
}

/** Formato 12.345.678-5 */
export function formatRut(rut){
  const clean = cleanRut(rut);
  if(clean.length < 2) return clean;
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${body}-${clean.slice(-1)}`;
}

// ---------------------------------------------------------------------------
// Líneas y totales del pedido
// ---------------------------------------------------------------------------

const round = (n) => Math.round(n);

/**
 * Una línea: cantidad × precio unitario, menos el % de descuento.
 * line_total = quantity × unit_price × (1 − discount_pct / 100)
 */
export function computeLine({ quantity, unitPrice, discountPct = 0 }){
  const q = Number(quantity) || 0;
  const p = Number(unitPrice) || 0;
  const d = Number(discountPct) || 0;
  const gross = round(q * p);
  const discountAmount = round(gross * d / 100);
  return { gross, discountAmount, lineTotal: gross - discountAmount };
}

/**
 * Totales del documento a partir de sus líneas.
 * subtotal = Σ bruto, discount = Σ descuentos, IVA = (subtotal − descuento) × tasa.
 */
export function computeTotals(lines, taxRate){
  let quantity = 0, subtotal = 0, discount = 0;
  for(const line of lines || []){
    const c = computeLine(line);
    quantity += Number(line.quantity) || 0;
    subtotal += c.gross;
    discount += c.discountAmount;
  }
  const net = subtotal - discount;
  const taxAmount = round(net * taxRate);
  return { quantity, subtotal, discount, taxAmount, totalAmount: net + taxAmount };
}

export function validateLines(lines){
  const errors = [];
  if(!Array.isArray(lines) || lines.length === 0){
    errors.push('Agrega al menos un producto al pedido.');
    return errors;
  }
  lines.forEach((l, i) => {
    const n = i + 1;
    if(!l.sku) errors.push(`Línea ${n}: elige un producto.`);
    const q = Number(l.quantity);
    if(!Number.isInteger(q) || q <= 0) errors.push(`Línea ${n}: la cantidad debe ser un entero positivo.`);
    const p = Number(l.unitPrice);
    if(!Number.isFinite(p) || p <= 0) errors.push(`Línea ${n}: el precio debe ser mayor que 0.`);
    const d = Number(l.discountPct ?? 0);
    if(!Number.isFinite(d) || d < 0 || d > 100) errors.push(`Línea ${n}: el descuento debe estar entre 0 y 100 %.`);
  });
  return errors;
}

export function maxDiscountPct(lines){
  return (lines || []).reduce((m, l) => Math.max(m, Number(l.discountPct) || 0), 0);
}

export function requiresApproval(lines, threshold){
  return maxDiscountPct(lines) > threshold;
}

// ---------------------------------------------------------------------------
// Crédito del cliente
// ---------------------------------------------------------------------------

/** Suma de pedidos que consumen crédito (confirmados y despachados, aún no facturados). */
export function creditUsed(entityId, documents, committedStatuses, excludeDocId = null){
  return documents
    .filter(d => d.entity_id === entityId && d.id !== excludeDocId && committedStatuses.includes(d.status))
    .reduce((s, d) => s + (Number(d.totalAmount) || 0), 0);
}

export function creditCheck(entity, documents, committedStatuses, newTotal, excludeDocId = null){
  const limit = Number(entity?.creditLimit);
  const used = creditUsed(entity?.entity_id, documents, committedStatuses, excludeDocId);
  if(!Number.isFinite(limit) || entity?.creditLimit === undefined || entity?.creditLimit === ''){
    return { ok: true, used, limit: null, available: null };
  }
  const available = limit - used;
  return { ok: newTotal <= available, used, limit, available };
}

// ---------------------------------------------------------------------------
// Indicadores (panel)
// ---------------------------------------------------------------------------

export function monthKey(dateStr){
  return String(dateStr || '').slice(0, 7);
}

/**
 * Indicadores del panel de ventas.
 * @param {object[]} documents  pedidos/cotizaciones
 * @param {object[]} entities   clientes
 * @param {object}   sales      configuración sales normalizada
 * @param {object[]} products   catálogo (para costo y margen)
 * @param {string}   month      "YYYY-MM" del período a mostrar
 */
export function salesKpis(documents, entities, sales, month){
  const confirmed = documents.filter(d => sales.confirmedStatuses.includes(d.status));
  const monthDocs = confirmed.filter(d => monthKey(d.startDate) === month);
  const monthSales = monthDocs.reduce((s, d) => s + (Number(d.totalAmount) || 0), 0);
  const openQuotes = documents.filter(d => sales.openStatuses.includes(d.status));
  const lost = documents.filter(d => d.status === sales.lostStatus);
  const closed = confirmed.length + lost.length;
  const conversionRate = closed ? confirmed.length / closed : null;
  const avgTicket = confirmed.length ? confirmed.reduce((s, d) => s + (Number(d.totalAmount) || 0), 0) / confirmed.length : 0;

  // Margen bruto sobre ventas netas (sin IVA) de pedidos confirmados.
  const costBySku = Object.fromEntries((sales.products || []).map(p => [p.sku, p.standardCost]));
  let netSales = 0, cost = 0, grossSales = 0, discountTotal = 0;
  for(const d of confirmed){
    for(const l of d.lines || []){
      const c = computeLine(l);
      netSales += c.lineTotal;
      grossSales += c.gross;
      discountTotal += c.discountAmount;
      cost += (costBySku[l.sku] ?? 0) * (Number(l.quantity) || 0);
    }
  }
  const marginPct = netSales ? (netSales - cost) / netSales : null;
  const avgDiscountPct = grossSales ? discountTotal / grossSales : null;

  // Top clientes por monto confirmado.
  const byEntity = new Map();
  for(const d of confirmed){
    byEntity.set(d.entity_id, (byEntity.get(d.entity_id) || 0) + (Number(d.totalAmount) || 0));
  }
  const nameOf = Object.fromEntries(entities.map(e => [e.entity_id, e.name]));
  const ranking = [...byEntity.entries()].sort((a, b) => b[1] - a[1]);
  const topCustomers = ranking.slice(0, 5).map(([id, amount]) => ({ entity_id: id, name: nameOf[id] ?? '(cliente eliminado)', amount }));
  const totalConfirmed = ranking.reduce((s, [, a]) => s + a, 0);
  const top20Count = Math.max(1, Math.ceil(ranking.length * 0.2));
  const paretoShare = totalConfirmed ? ranking.slice(0, top20Count).reduce((s, [, a]) => s + a, 0) / totalConfirmed : null;

  // Motivos de pérdida.
  const lostByReason = {};
  for(const d of lost){
    const r = d[sales.lostReasonField] || 'Sin motivo';
    lostByReason[r] = (lostByReason[r] || 0) + 1;
  }

  return {
    monthSales, monthOrders: monthDocs.length, openQuotes: openQuotes.length, lostCount: lost.length,
    conversionRate, avgTicket, marginPct, avgDiscountPct, topCustomers, paretoShare, lostByReason
  };
}

/** Ventas confirmadas agrupadas por mes, ordenadas: [{ month, amount }] */
export function monthlySales(documents, confirmedStatuses){
  const map = new Map();
  for(const d of documents){
    if(!confirmedStatuses.includes(d.status)) continue;
    const k = monthKey(d.startDate);
    if(!k) continue;
    map.set(k, (map.get(k) || 0) + (Number(d.totalAmount) || 0));
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => ({ month, amount }));
}

/** Promedio móvil de los últimos n valores. */
export function movingAverage(values, n = 3){
  if(values.length === 0) return null;
  const last = values.slice(-n);
  return last.reduce((s, v) => s + v, 0) / last.length;
}

/**
 * Recta de mínimos cuadrados y = a + b·t con t = 1..n.
 * b = (nΣty − ΣtΣy) / (nΣt² − (Σt)²),  a = (Σy − bΣt) / n
 */
export function linearTrend(values){
  const n = values.length;
  if(n < 2) return null;
  let st = 0, sy = 0, sty = 0, stt = 0;
  values.forEach((y, i) => { const t = i + 1; st += t; sy += y; sty += t * y; stt += t * t; });
  const den = n * stt - st * st;
  const b = (n * sty - st * sy) / den;
  const a = (sy - b * st) / n;
  return { a, b, next: a + b * (n + 1) };
}

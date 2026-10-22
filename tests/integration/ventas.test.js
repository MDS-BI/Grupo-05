import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let storage;

function qs(id){ return document.getElementById(id); }
function submit(formId){
  qs(formId).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}
function change(el, value){
  el.value = value;
  el.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}

beforeEach(async () => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();
  vi.resetModules();
  const { boot } = await import('../../src/app.js');
  await boot();
  storage = await import('../../src/storage.js');
});

afterEach(() => {
  dom.window.close();
});

function createCustomer(fields = {}){
  return storage.addEntity({ name: 'Constructora Demo', code: 'CLI-001', taxId: '12.345.678-5', creditLimit: 1000000, ...fields });
}

/** Llena el formulario de pedido con una línea del catálogo. */
function fillOrder(entity, { sku = 'TOR-001', quantity = 10, discountPct = 0, status } = {}){
  qs('nav-documents').click();
  qs('reset-document').click();
  change(qs('document-entity'), entity.entity_id);
  const row = qs('lines-body').querySelector('tr');
  change(row.querySelector('[data-field="sku"]'), sku);
  change(row.querySelector('[data-field="quantity"]'), String(quantity));
  change(row.querySelector('[data-field="discountPct"]'), String(discountPct));
  change(qs('cf-vendedor'), 'Camila Rojas');
  if(status) qs('status').value = status;
}

describe('Módulo de Ventas - perfil y terminología', () => {
  it('arranca como módulo de Ventas con su terminología y campos', () => {
    expect(document.title).toBe('Ventas');
    expect(qs('nav-entities-label').textContent).toBe('Clientes');
    expect(qs('action-new-document-title').textContent).toBe('Nuevo Pedido de Venta');
    expect(document.querySelector('label[for="taxId"]').textContent).toBe('RUT *');
    expect(qs('sales-dashboard').hidden).toBe(false);
    expect(qs('sales-lines').hidden).toBe(false);
    expect(qs('config-errors').hidden).toBe(true);
  });
});

describe('Historia: registrar clientes con RUT', () => {
  it('rechaza un RUT con dígito verificador incorrecto', () => {
    qs('nav-entities').click();
    qs('name').value = 'Cliente X';
    qs('code').value = 'CLI-009';
    qs('taxId').value = '12.345.678-9';
    submit('entity-form');
    expect(storage.loadEntities().length).toBe(0);
    expect(qs('error-taxId').textContent).toContain('RUT no es válido');
  });

  it('guarda el RUT formateado e impide duplicados', () => {
    qs('nav-entities').click();
    qs('name').value = 'Cliente X';
    qs('code').value = 'CLI-009';
    qs('taxId').value = '123456785';
    submit('entity-form');
    expect(storage.loadEntities()[0].taxId).toBe('12.345.678-5');

    qs('reset-entity').click();
    qs('name').value = 'Cliente Y';
    qs('code').value = 'CLI-010';
    qs('taxId').value = '12345678-5';
    submit('entity-form');
    expect(storage.loadEntities().length).toBe(1);
    expect(qs('error-taxId').textContent).toContain('Ya existe');
  });
});

describe('Historia: cotizar y confirmar un pedido', () => {
  it('calcula subtotal, descuento, IVA y total desde las líneas', () => {
    const c = createCustomer();
    fillOrder(c, { quantity: 10, discountPct: 5 });
    // TOR-001 cuesta $4.990: bruto 49.900, descuento 2.495, neto 47.405, IVA 9.007, total 56.412
    expect(qs('subtotal').value).toBe('49900');
    expect(qs('discount').value).toBe('2495');
    expect(qs('taxAmount').value).toBe('9007');
    expect(qs('totalAmount').value).toBe('56412');
    submit('document-form');
    const [doc] = storage.loadDocuments();
    expect(doc.status).toBe('cotización');
    expect(doc.series).toBe('NV');
    expect(doc.totalAmount).toBe(56412);
    expect(doc.lines[0]).toMatchObject({ sku: 'TOR-001', quantity: 10, unitPrice: 4990, discountPct: 5 });
  });

  it('exige vendedor y al menos un producto', () => {
    const c = createCustomer();
    qs('nav-documents').click();
    qs('reset-document').click();
    change(qs('document-entity'), c.entity_id);
    submit('document-form');
    expect(storage.loadDocuments().length).toBe(0);
    expect(qs('error-lines').textContent).toContain('elige un producto');
    expect(qs('error-cf-vendedor').textContent).toContain('obligatorio');
  });

  it('pide motivo al marcar una cotización como perdida', () => {
    const c = createCustomer();
    fillOrder(c);
    submit('document-form');
    const [doc] = storage.loadDocuments();
    change(qs('edit-document'), doc.id);
    qs('status').value = 'perdida';
    submit('document-form');
    expect(storage.loadDocuments()[0].status).toBe('cotización');
    expect(qs('error-cf-motivoPerdida').textContent).toContain('motivo de pérdida');
    change(qs('cf-motivoPerdida'), 'Precio');
    submit('document-form');
    expect(storage.loadDocuments()[0]).toMatchObject({ status: 'perdida', motivoPerdida: 'Precio' });
  });

  it('un documento nuevo solo nace como cotización o confirmado', () => {
    const c = createCustomer();
    fillOrder(c);
    const offered = [...qs('status').options].map(o => o.value).filter(Boolean);
    expect(offered).toEqual(['cotización', 'confirmado']);
    for(const status of ['facturado', 'anulado', 'perdida', 'despachado']){
      expect(() => storage.addDocument({
        entityId: c.entity_id, series: 'NV', folio: 900, startDate: '2026-10-01', endDate: '2026-10-10', status,
        vendedor: 'Camila Rojas', motivoPerdida: 'Precio',
        lines: [{ sku: 'TOR-001', name: 'x', quantity: 1, unitPrice: 4990, discountPct: 0 }],
      })).toThrow(/solo puede crearse/);
    }
  });

  it('bloquea la confirmación si el pedido supera el crédito del cliente', () => {
    const c = createCustomer({ creditLimit: 50000 });
    fillOrder(c, { quantity: 10, status: 'confirmado' });
    submit('document-form');
    expect(storage.loadDocuments().length).toBe(0);
    expect(qs('error-status').textContent).toContain('crédito disponible');
  });
});

describe('Historia: los pedidos confirmados no se modifican', () => {
  it('bloquea los productos de un pedido confirmado y rechaza cambios por código', () => {
    const c = createCustomer();
    fillOrder(c, { quantity: 2, status: 'confirmado' });
    submit('document-form');
    const [doc] = storage.loadDocuments();
    expect(doc.status).toBe('confirmado');
    expect(qs('lines-body').querySelector('input').disabled).toBe(true);
    expect(qs('lines-locked').hidden).toBe(false);
    expect(() => storage.updateDocument(doc.id, { lines: [{ ...doc.lines[0], quantity: 99 }] })).toThrow(/ya no se puede modificar/);
    expect(storage.updateDocument(doc.id, { status: 'despachado' }).status).toBe('despachado');
  });
});

describe('Historia: la historia de ventas no se borra', () => {
  it('permite borrar cotizaciones abiertas, pero no pedidos confirmados ni sus clientes', () => {
    const c = createCustomer();
    fillOrder(c, { quantity: 1 });
    submit('document-form');
    fillOrder(c, { quantity: 2, status: 'confirmado' });
    submit('document-form');
    const [quote, order] = storage.loadDocuments();
    expect(quote.status).toBe('cotización');
    expect(order.status).toBe('confirmado');
    expect(() => storage.deleteDocument(order.id)).toThrow(/no se elimina/);
    qs('nav-documents').click();
    change(qs('edit-document'), order.id);
    expect(qs('delete-document').disabled).toBe(true);
    change(qs('edit-document'), quote.id);
    expect(qs('delete-document').disabled).toBe(false);
    expect(() => storage.deleteEntity(c.id)).toThrow(/No se puede eliminar un cliente/);
    storage.deleteDocument(quote.id);
    expect(storage.loadDocuments().map(d => d.id)).toEqual([order.id]);
    expect(storage.loadEntities().length).toBe(1);
  });

  it('no permite dos documentos con la misma serie y folio', () => {
    const c = createCustomer();
    fillOrder(c, { quantity: 1 });
    submit('document-form');
    const [first] = storage.loadDocuments();
    fillOrder(c, { quantity: 2 });
    qs('folio').value = String(first.folio);
    submit('document-form');
    expect(storage.loadDocuments().length).toBe(1);
    expect(qs('error-folio').textContent).toContain('Ya existe');
  });

  it('solo el jefe/a puede decidir una aprobación de descuento', () => {
    const c = createCustomer();
    fillOrder(c, { quantity: 5, discountPct: 15 });
    qs('approval-reason').value = 'Volumen';
    submit('document-form');
    const [pending] = storage.pendingApprovals();
    expect(() => storage.decideApproval(pending.approval_id, 'aprobado', 'x')).toThrow(/Solo el jefe/);
    change(qs('role-select'), 'jefe');
    expect(storage.decideApproval(pending.approval_id, 'aprobado', 'Jefe/a de ventas').decision).toBe('aprobado');
  });

  it('solo el jefe/a puede cambiar el límite de crédito', () => {
    const c = createCustomer({ creditLimit: 500000 });
    qs('nav-entities').click();
    expect(qs('creditLimit').disabled).toBe(true);
    expect(() => storage.updateEntity(c.id, { creditLimit: 9000000 })).toThrow(/Solo el jefe/);
    change(qs('role-select'), 'jefe');
    qs('nav-entities').click();
    expect(qs('creditLimit').disabled).toBe(false);
    expect(storage.updateEntity(c.id, { creditLimit: 9000000 }).creditLimit).toBe(9000000);
  });

  it('una cotización puede marcarse como perdida sin haber sido enviada', () => {
    const c = createCustomer();
    fillOrder(c, { quantity: 1 });
    submit('document-form');
    const [doc] = storage.loadDocuments();
    expect(storage.allowedNextStatuses('cotización')).toContain('perdida');
    expect(storage.updateDocument(doc.id, { status: 'perdida', motivoPerdida: 'Competencia' }).status).toBe('perdida');
  });
});

describe('Historia: aprobar descuentos sobre 10 %', () => {
  it('envía la solicitud al jefe y solo permite confirmar después de aprobarla', () => {
    const c = createCustomer();
    fillOrder(c, { quantity: 5, discountPct: 15 });
    // Sin motivo no se guarda: el jefe necesita saber por qué.
    submit('document-form');
    expect(storage.loadDocuments().length).toBe(0);
    expect(qs('error-approval-reason').textContent).toContain('motivo del descuento');
    qs('approval-reason').value = 'Compra por volumen';
    submit('document-form');
    const [doc] = storage.loadDocuments();
    const [pending] = storage.pendingApprovals();
    expect(pending).toMatchObject({ sales_order_id: doc.id, discount_pct: 15, reason: 'Compra por volumen', requested_by: 'Camila Rojas', decision: 'pendiente' });

    // Sin aprobación no se puede confirmar.
    qs('status').value = 'confirmado';
    submit('document-form');
    expect(storage.loadDocuments()[0].status).toBe('cotización');
    expect(qs('error-status').textContent).toContain('aprobación del jefe de ventas');

    // Un vendedor no ve los botones de aprobación ni el respaldo masivo; el jefe sí.
    qs('nav-dashboard').click();
    expect(qs('approvals-list').querySelector('[data-decision]')).toBeNull();
    expect(qs('export-data').hidden).toBe(true);
    expect(qs('clear-data').hidden).toBe(true);
    change(qs('role-select'), 'jefe');
    expect(qs('export-data').hidden).toBe(false);
    qs('approvals-list').querySelector('[data-decision="aprobado"]').click();
    expect(storage.latestApproval(doc.id).decision).toBe('aprobado');

    // Ahora sí se confirma.
    qs('nav-documents').click();
    change(qs('edit-document'), doc.id);
    qs('status').value = 'confirmado';
    submit('document-form');
    expect(storage.loadDocuments()[0].status).toBe('confirmado');
  });
});

describe('Panel de ventas', () => {
  it('muestra indicadores a partir de los datos de demostración', () => {
    change(qs('role-select'), 'jefe');
    qs('load-demo').click();
    expect(storage.loadEntities().length).toBe(10);
    expect(Number(qs('stat-documents').textContent)).toBeGreaterThan(20);
    expect(qs('kpi-conversion').textContent).toMatch(/%$/);
    expect(qs('top-customers').children.length).toBe(5);
    expect(qs('monthly-chart').querySelectorAll('.bar').length).toBeGreaterThan(2);
  });

  it('oculta el margen al perfil vendedor (dato sensible)', () => {
    change(qs('role-select'), 'vendedor');
    expect(qs('kpi-margin-card').hidden).toBe(true);
    change(qs('role-select'), 'jefe');
    expect(qs('kpi-margin-card').hidden).toBe(false);
  });
});

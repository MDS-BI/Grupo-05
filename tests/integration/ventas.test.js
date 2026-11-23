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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Entra por la pantalla de inicio de sesión (US-15) y espera a que cargue el panel. */
async function loginAs(email, password){
  if(qs('login-view').hidden) qs('logout-button').click();
  qs('login-email').value = email;
  qs('login-password').value = password;
  submit('login-form');
  for(let i = 0; i < 200 && !qs('login-view').hidden; i++) await sleep(5);
}
const asSeller = () => loginAs('camila@biobio.cl', 'Venta2026');
const asBoss = () => loginAs('jefa@biobio.cl', 'Jefa2026');

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
  await asSeller();
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
    expect(document.title).toBe('Ventas · Distribuidora Biobío');
    expect(qs('nav-entities-label').textContent).toBe('Clientes');
    expect(qs('action-new-document-title').textContent).toBe('Nueva cotización');
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

  it('exige vendedor y al menos un producto (el jefe/a elige el vendedor)', async () => {
    await asBoss();
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

  it('solo el jefe/a puede decidir una aprobación de descuento', async () => {
    const c = createCustomer();
    fillOrder(c, { quantity: 5, discountPct: 15 });
    qs('approval-reason').value = 'Volumen';
    submit('document-form');
    const [pending] = storage.pendingApprovals();
    expect(() => storage.decideApproval(pending.approval_id, 'aprobado', 'x')).toThrow(/Solo el jefe/);
    await asBoss();
    expect(storage.decideApproval(pending.approval_id, 'aprobado', 'Jefe/a de ventas').decision).toBe('aprobado');
  });

  it('solo el jefe/a puede cambiar el límite de crédito', async () => {
    const c = createCustomer({ creditLimit: 500000 });
    qs('nav-entities').click();
    expect(qs('creditLimit').disabled).toBe(true);
    expect(() => storage.updateEntity(c.id, { creditLimit: 9000000 })).toThrow(/Solo el jefe/);
    await asBoss();
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
  it('envía la solicitud al jefe y solo permite confirmar después de aprobarla', async () => {
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
    await asBoss();
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
  it('muestra indicadores a partir de los datos de demostración', async () => {
    await asBoss();
    qs('load-demo').click();
    expect(storage.loadEntities().length).toBe(10);
    expect(Number(qs('stat-documents').textContent)).toBeGreaterThan(20);
    expect(qs('kpi-conversion').textContent).toMatch(/%$/);
    expect(qs('top-customers').children.length).toBe(5);
    expect(qs('monthly-chart').querySelectorAll('.bar').length).toBeGreaterThan(2);
  });

  it('oculta el margen al perfil vendedor (dato sensible)', async () => {
    await asSeller();
    expect(qs('kpi-margin-card').hidden).toBe(true);
    await asBoss();
    expect(qs('kpi-margin-card').hidden).toBe(false);
  });
});

describe('Iteración 3: inicio de sesión (US-15)', () => {
  it('sin sesión solo se ve la pantalla de entrada', async () => {
    qs('logout-button').click();
    expect(qs('login-view').hidden).toBe(false);
    expect(document.querySelector('.workspace').hidden).toBe(true);
    expect(qs('user-box').hidden).toBe(true);
  });

  it('muestra nombre y rol de quien entró, y ya no existe el selector de perfil', () => {
    expect(qs('role-select')).toBeNull();
    expect(qs('user-name').textContent).toBe('Camila Rojas');
    expect(qs('user-role').textContent).toBe('Vendedor/a');
  });

  it('una contraseña mala da un mensaje que no dice qué falló', async () => {
    qs('logout-button').click();
    await loginAs('camila@biobio.cl', 'otra-cosa1');
    expect(qs('login-view').hidden).toBe(false);
    expect(qs('login-error').textContent).toBe('Correo o contraseña incorrectos.');
    await loginAs('nadie@biobio.cl', 'Venta2026');
    expect(qs('login-error').textContent).toBe('Correo o contraseña incorrectos.');
  });

  it('bloquea la cuenta 15 minutos después de 5 intentos fallidos', async () => {
    const auth = await import('../../src/auth.js');
    auth.logout();
    for(let i = 0; i < 4; i++) expect((await auth.login('diego@biobio.cl', 'mala12345')).ok).toBe(false);
    const fifth = await auth.login('diego@biobio.cl', 'mala12345');
    expect(fifth.error).toMatch(/bloqueada.*15 minutos/);
    // Aunque ahora ponga la contraseña correcta, sigue bloqueada.
    const right = await auth.login('diego@biobio.cl', 'Venta2026');
    expect(right.ok).toBe(false);
    expect(right.error).toMatch(/bloqueada/);
    // Pasados 16 minutos ya puede entrar.
    const later = await auth.login('diego@biobio.cl', 'Venta2026', Date.now() + 16 * 60e3);
    expect(later.ok).toBe(true);
  });

  it('cierra la sesión después de 30 minutos sin uso', async () => {
    const auth = await import('../../src/auth.js');
    expect(auth.currentUser()).not.toBeNull();
    expect(auth.currentUser(Date.now() + 31 * 60e3)).toBeNull();
  });

  it('guarda la contraseña con hash y sal, nunca como texto', () => {
    const raw = localStorage.getItem('erp_base_module:users');
    expect(raw).not.toContain('Venta2026');
    expect(raw).not.toContain('Jefa2026');
    const users = JSON.parse(raw);
    expect(users[0].password_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(new Set(users.map(u => u.salt)).size).toBe(users.length);
  });
});

describe('Iteración 3: permisos por rol (US-16)', () => {
  it('el vendedor/a queda puesto solo y no se puede cambiar', () => {
    const c = createCustomer();
    qs('nav-documents').click();
    qs('reset-document').click();
    expect(qs('cf-vendedor').value).toBe('Camila Rojas');
    expect(qs('cf-vendedor').disabled).toBe(true);
    change(qs('document-entity'), c.entity_id);
    const row = qs('lines-body').querySelector('tr');
    change(row.querySelector('[data-field="sku"]'), 'TOR-001');
    change(row.querySelector('[data-field="quantity"]'), '2');
    submit('document-form');
    expect(storage.loadDocuments()[0].vendedor).toBe('Camila Rojas');
  });

  it('un vendedor/a mira pedidos ajenos, pero no los modifica (ni desde la consola)', async () => {
    await asBoss();
    const c = createCustomer();
    fillOrder(c, { quantity: 1 });
    change(qs('cf-vendedor'), 'Diego Muñoz');
    submit('document-form');
    const [doc] = storage.loadDocuments();
    expect(doc.vendedor).toBe('Diego Muñoz');
    await asSeller();
    qs('nav-documents').click();
    change(qs('edit-document'), doc.id);
    expect(qs('document-submit-button').disabled).toBe(true);
    expect(qs('document-readonly').textContent).toContain('Diego Muñoz');
    expect(() => storage.updateDocument(doc.id, { status: 'perdida', motivoPerdida: 'Precio' })).toThrow(/solo su vendedor/);
    expect(() => storage.deleteDocument(doc.id)).toThrow(/solo su vendedor/);
  });

  it('el jefe/a debe comentar al rechazar, y el vendedor/a ve el comentario', async () => {
    const c = createCustomer();
    fillOrder(c, { quantity: 5, discountPct: 20 });
    qs('approval-reason').value = 'Igualar a la competencia';
    submit('document-form');
    const [doc] = storage.loadDocuments();
    const [pending] = storage.pendingApprovals();
    await asBoss();
    expect(() => storage.decideApproval(pending.approval_id, 'rechazado', 'x', '')).toThrow(/Escribe por qué/);
    qs(`comment-${pending.approval_id}`).value = 'Con 20 % perdemos plata; ofrece 10 %';
    qs('approvals-list').querySelector('[data-decision="rechazado"]').click();
    const decided = storage.latestApproval(doc.id);
    expect(decided).toMatchObject({ decision: 'rechazado', approved_by: 'Andrea Lagos', decision_comment: 'Con 20 % perdemos plata; ofrece 10 %' });
    await asSeller();
    qs('nav-documents').click();
    change(qs('edit-document'), doc.id);
    expect(qs('approval-info').textContent).toContain('ofrece 10 %');
    expect(qs('approval-reason').value).toBe('Igualar a la competencia');
  });

  it('cada cambio de estado queda en el historial con el nombre de quien lo hizo', () => {
    const c = createCustomer();
    fillOrder(c, { quantity: 1 });
    submit('document-form');
    const [doc] = storage.loadDocuments();
    storage.updateDocument(doc.id, { status: 'enviada' });
    const h = storage.statusHistory(doc.id);
    expect(h.map(x => [x.from_status, x.to_status, x.changed_by])).toEqual([
      ['', 'cotización', 'Camila Rojas'],
      ['cotización', 'enviada', 'Camila Rojas']
    ]);
    qs('nav-documents').click();
    change(qs('edit-document'), doc.id);
    expect(qs('status-history').hidden).toBe(false);
    expect(qs('status-history-list').children.length).toBe(2);
  });
});

describe('Iteración 3: cuentas del equipo (US-17)', () => {
  it('el menú Equipo solo aparece para el jefe/a', async () => {
    expect(qs('nav-team').hidden).toBe(true);
    await asBoss();
    expect(qs('nav-team').hidden).toBe(false);
  });

  it('el jefe/a crea una cuenta; la persona cambia su contraseña al entrar', async () => {
    await asBoss();
    qs('nav-team').click();
    qs('team-name').value = 'Rocío Pérez';
    qs('team-email').value = 'rocio@biobio.cl';
    qs('team-role').value = 'vendedor';
    qs('team-password').value = 'corta';
    submit('team-form');
    await sleep(20);
    expect(qs('error-team-password').textContent).toContain('8 caracteres');
    qs('team-password').value = 'Inicio2026';
    submit('team-form');
    for(let i = 0; i < 100 && !qs('team-body').textContent.includes('rocio@biobio.cl'); i++) await sleep(5);
    expect(qs('team-body').textContent).toContain('Rocío Pérez');
    // Correo repetido: no se crea.
    qs('team-name').value = 'Otra';
    qs('team-email').value = 'rocio@biobio.cl';
    qs('team-password').value = 'Inicio2026';
    submit('team-form');
    await sleep(30);
    expect(qs('error-team-email').textContent).toContain('Ya existe');

    qs('logout-button').click();
    await loginAs('rocio@biobio.cl', 'Inicio2026');
    expect(qs('change-password-form').hidden).toBe(false);
    qs('new-password').value = 'MiClave2026';
    submit('change-password-form');
    for(let i = 0; i < 100 && !qs('login-view').hidden; i++) await sleep(5);
    expect(qs('user-name').textContent).toBe('Rocío Pérez');
    // La nueva vendedora aparece como opción de vendedor.
    expect([...qs('cf-vendedor').options].map(o => o.value)).toContain('Rocío Pérez');
  });

  it('una cuenta desactivada no entra y no se puede dejar al sistema sin jefe/a', async () => {
    await asBoss();
    const auth = await import('../../src/auth.js');
    const users = auth.loadUsers();
    const matias = users.find(u => u.email === 'matias@biobio.cl');
    const jefa = users.find(u => u.email === 'jefa@biobio.cl');
    auth.setUserActive(matias.user_id, false);
    expect(() => auth.setUserActive(jefa.user_id, false)).toThrow(/único jefe/);
    qs('logout-button').click();
    await loginAs('matias@biobio.cl', 'Venta2026');
    expect(qs('login-view').hidden).toBe(false);
    expect(qs('login-error').textContent).toContain('desactivada');
  });

  it('un vendedor/a no puede administrar cuentas ni desde la consola', async () => {
    const auth = await import('../../src/auth.js');
    await expect(auth.createUser({ name: 'X', email: 'x@biobio.cl', role: 'jefe', password: 'Clave12345' })).rejects.toThrow(/Solo el jefe/);
  });
});

describe('Iteración 3: panel de inicio (US-20)', () => {
  it('saluda por el nombre y muestra los pendientes que vencen', () => {
    const c = createCustomer();
    fillOrder(c, { quantity: 1 });
    submit('document-form');
    const [doc] = storage.loadDocuments();
    const fmt = (d) => d.toISOString().slice(0, 10);
    const t = new Date();
    t.setDate(t.getDate() + 1);
    storage.updateDocument(doc.id, { endDate: fmt(new Date(t.getTime())) });
    qs('nav-dashboard').click();
    expect(qs('dashboard-heading').textContent).toBe('Hola, Camila');
    expect(qs('my-pending').hidden).toBe(false);
    const item = qs('pending-list').querySelector('[data-open="document"]');
    expect(item.textContent).toMatch(/vence/);
    item.click();
    expect(qs('view-documents').hidden).toBe(false);
    expect(qs('document-id').value).toBe(doc.id);
  });

  it('el jefe/a ve los descuentos por aprobar y las ventas del mes', async () => {
    const c = createCustomer();
    fillOrder(c, { quantity: 5, discountPct: 15 });
    qs('approval-reason').value = 'Volumen';
    submit('document-form');
    await asBoss();
    expect(qs('pending-heading').textContent).toBe('Por revisar hoy');
    expect(qs('pending-list').textContent).toContain('Ventas del mes');
    expect(qs('pending-list').textContent).toContain('Aprobar descuento de 15 %');
  });

  it('ya no están las tarjetas genéricas del template', () => {
    const text = document.querySelector('.quick-actions').textContent;
    expect(text).not.toContain('Registrar un dato maestro');
    expect(text).toContain('Nueva cotización');
    expect(text).toContain('Ver pedidos');
  });
});

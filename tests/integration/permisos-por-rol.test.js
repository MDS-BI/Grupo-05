// US-16: el rol sale de la cuenta con la que se entró, y los permisos se revisan
// dentro de cada función (no solo escondiendo botones). Estas pruebas simulan la
// sesión de US-15 con `setCurrentUserProvider`.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

const jefa = { name: 'Andrea Vidal', role: 'jefe' };
const camila = { name: 'Camila Rojas', role: 'vendedor' };
const diego = { name: 'Diego Muñoz', role: 'vendedor' };

let dom;
let storage;
let sessionUser;

function qs(id){ return document.getElementById(id); }
function submit(formId){
  qs(formId).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}
function change(el, value){
  el.value = value;
  el.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}
function loginAs(user){ sessionUser = user; }

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
  sessionUser = camila;
  storage.setCurrentUserProvider(() => sessionUser);
});

afterEach(() => {
  dom.window.close();
});

function createCustomer(){
  return storage.addEntity({ name: 'Constructora Demo', code: 'CLI-001', taxId: '12.345.678-5', creditLimit: 1000000 });
}

/** Crea un pedido desde el formulario, eligiendo en el campo "Vendedor" a `vendedor`. */
function createOrder(entity, { discountPct = 0, vendedor = 'Camila Rojas' } = {}){
  qs('nav-documents').click();
  qs('reset-document').click();
  change(qs('document-entity'), entity.entity_id);
  const row = qs('lines-body').querySelector('tr');
  change(row.querySelector('[data-field="sku"]'), 'TOR-001');
  change(row.querySelector('[data-field="quantity"]'), '5');
  change(row.querySelector('[data-field="discountPct"]'), String(discountPct));
  change(qs('cf-vendedor'), vendedor);
  if(discountPct > 10) qs('approval-reason').value = 'Compra por volumen';
  submit('document-form');
  return storage.loadDocuments().at(-1);
}

describe('Historia US-16: ver y hacer solo lo que le toca a mi rol', () => {
  it('un vendedor/a no puede aprobar un descuento ni desde la consola, aunque cambie el "perfil" guardado', () => {
    const doc = createOrder(createCustomer(), { discountPct: 15 });
    const [pending] = storage.pendingApprovals();
    expect(pending.sales_order_id).toBe(doc.id);
    // Lo que alguien podría escribir en la consola del navegador:
    localStorage.setItem(storage.ROLE_KEY, 'jefe');
    expect(() => storage.decideApproval(pending.approval_id, 'aprobado', 'Jefe/a de ventas')).toThrow(/Solo el jefe/);
    expect(storage.latestApproval(doc.id).decision).toBe('pendiente');
  });

  it('la aprobación queda a nombre de quien tiene la sesión abierta (criterio 5)', () => {
    const doc = createOrder(createCustomer(), { discountPct: 15 });
    const [pending] = storage.pendingApprovals();
    expect(pending.requested_by).toBe('Camila Rojas');
    loginAs(jefa);
    const decided = storage.decideApproval(pending.approval_id, 'aprobado', 'Jefe/a de ventas');
    expect(decided.approved_by).toBe('Andrea Vidal');
    expect(storage.latestApproval(doc.id).decision).toBe('aprobado');
  });

  it('el campo "Vendedor" queda siempre con el nombre de quien creó la cotización (criterio 3)', () => {
    const doc = createOrder(createCustomer(), { vendedor: 'Diego Muñoz' });
    expect(doc.vendedor).toBe('Camila Rojas');
    expect(storage.updateDocument(doc.id, { vendedor: 'Diego Muñoz' }).vendedor).toBe('Camila Rojas');
  });

  it('un vendedor/a puede mirar los pedidos de otros, pero editar solo los suyos (criterio 4)', () => {
    loginAs(diego);
    const doc = createOrder(createCustomer());
    expect(doc.vendedor).toBe('Diego Muñoz');
    loginAs(camila);
    expect(storage.loadDocuments().map(d => d.id)).toContain(doc.id);
    expect(() => storage.updateDocument(doc.id, { notes: 'cambio' })).toThrow(/solo puedes mirarlo/);
    expect(() => storage.deleteDocument(doc.id)).toThrow(/solo puedes mirarlo/);
    loginAs(jefa);
    expect(storage.updateDocument(doc.id, { notes: 'revisado' }).notes).toBe('revisado');
  });

  it('borrar, importar y exportar datos queda solo para el jefe/a, también fuera de la interfaz (criterio 6)', () => {
    createCustomer();
    expect(() => storage.clearAll()).toThrow(/Solo el jefe/);
    expect(() => storage.importData({ entities: [], documents: [] })).toThrow(/Solo el jefe/);
    expect(() => storage.exportData()).toThrow(/Solo el jefe/);
    expect(storage.loadEntities().length).toBe(1);
    loginAs(jefa);
    expect(storage.exportData().entities.length).toBe(1);
    storage.clearAll();
    expect(storage.loadEntities().length).toBe(0);
  });

  it('sin sesión abierta no se puede hacer nada de jefatura', () => {
    loginAs(null);
    expect(storage.currentRole()).toBe('vendedor');
    expect(() => storage.clearAll()).toThrow(/Solo el jefe/);
  });
});

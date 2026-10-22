// Formulario de documentos (cotizaciones / pedidos de venta), con líneas de producto
// cuando la extensión de ventas está activa.

import { getConfig, labelFor, grammar } from '../module-config.js';
import {
  loadEntities, loadDocuments, addDocument, updateDocument, deleteDocument, validateDocument,
  allowedNextStatuses, documentNumber, findEntityByEntityId, nextFolio, latestApproval, requestApproval
} from '../storage.js';
import { computeLine, computeTotals, maxDiscountPct, requiresApproval, creditCheck } from '../sales/sales-logic.js';
import { renderCustomFields, readCustomFields, fillCustomFields, isCustomKey } from './custom-fields.js';
import { flash } from './shell.js';
import { money, today, addDays } from './format.js';

const $ = (id) => document.getElementById(id);
const AMOUNT_INPUTS = ['quantity', 'subtotal', 'discount', 'taxAmount', 'totalAmount'];

let onChange = () => {};
let lines = [];

export function initDocumentForm({ onDataChanged }){
  onChange = onDataChanged || (() => {});
  renderCustomFields('document', $('document-custom-fields'), $('document-custom-fields-grid'));
  renderStatusControl('');

  const sales = getConfig().sales;
  $('sales-lines').hidden = !sales;
  if(sales){
    for(const k of AMOUNT_INPUTS){ $(k).readOnly = true; $(k).classList.add('computed'); }
    $('add-line').addEventListener('click', () => { lines.push(emptyLine()); renderLines(); });
    $('lines-body').addEventListener('input', onLineInput);
    $('lines-body').addEventListener('change', onLineInput);
    $('lines-body').addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-remove]');
      if(!btn) return;
      lines.splice(Number(btn.dataset.remove), 1);
      renderLines();
    });
    $('document-entity').addEventListener('change', updateSalesInfo);
  }

  $('document-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    submitDocument();
  });
  $('reset-document').addEventListener('click', () => resetDocumentForm());
  $('edit-document').addEventListener('change', () => {
    const id = $('edit-document').value;
    if(!id){ resetDocumentForm(); return; }
    const doc = loadDocuments().find(d => d.id === id);
    if(doc) populateDocumentForm(doc);
  });
  $('delete-document').addEventListener('click', () => {
    const id = $('edit-document').value;
    if(!id) return;
    const g = grammar(labelFor('document'));
    if(!confirm(`¿Eliminar ${g.article} ${labelFor('document').toLowerCase()} ${g.selected}?`)) return;
    try { deleteDocument(id); } catch (err){ flash(err.message); return; }
    resetDocumentForm();
    refreshDocumentSelectors();
    flash(`${labelFor('document')} eliminado/a.`);
    onChange();
  });
}

// ---------------------------------------------------------------------------
// Selectores
// ---------------------------------------------------------------------------

export function refreshDocumentSelectors(selectedDocId = ''){
  const entities = loadEntities();
  const entSel = $('document-entity');
  const keepEntity = entSel.value;
  entSel.innerHTML = '';
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = `— Selecciona ${grammar(labelFor('entity')).indefinite} ${labelFor('entity').toLowerCase()} —`;
  entSel.append(ph);
  for(const e of entities){
    const o = document.createElement('option');
    o.value = e.entity_id;
    o.textContent = `${e.name} — ${e.code}`;
    entSel.append(o);
  }
  entSel.value = entities.some(e => e.entity_id === keepEntity) ? keepEntity : '';

  const names = Object.fromEntries(entities.map(e => [e.entity_id, e.name]));
  const docSel = $('edit-document');
  const docs = loadDocuments();
  docSel.innerHTML = '';
  const dph = document.createElement('option');
  dph.value = '';
  dph.textContent = docs.length ? `— Selecciona para editar (${docs.length}) —` : '— No hay registros —';
  docSel.append(dph);
  for(const d of docs){
    const o = document.createElement('option');
    o.value = d.id;
    const status = d.status ? ` · ${d.status}` : '';
    o.textContent = `${documentNumber(d)} · ${names[d.entity_id] ?? '?'}${status}`;
    docSel.append(o);
  }
  docSel.value = selectedDocId;
  syncDeleteButton(docs.find(d => d.id === docSel.value));
}

/** En Ventas solo se borran documentos abiertos; el botón se desactiva para el resto (la regla vive en storage). */
function syncDeleteButton(doc){
  const btn = $('delete-document');
  const sales = getConfig().sales;
  const closed = Boolean(doc && sales && !sales.openStatuses.includes(doc.status));
  btn.disabled = !doc || closed;
  btn.title = closed ? 'Este documento ya no está abierto: queda en la historia (si corresponde, anúlalo).' : '';
}

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

function renderStatusControl(current, isEditing = false){
  const holder = $('status-control');
  holder.innerHTML = '';
  const lc = getConfig().statusLifecycle;
  let control;
  if(lc){
    control = document.createElement('select');
    const restricted = getConfig().sales?.newDocumentStatuses;
    const newStatuses = restricted?.length ? restricted : lc.statuses;
    const options = isEditing && current ? allowedNextStatuses(current) : ['', ...newStatuses];
    for(const s of options){
      const o = document.createElement('option');
      o.value = s;
      o.textContent = s || '--';
      control.append(o);
    }
    control.value = current || '';
  } else {
    control = document.createElement('input');
    control.type = 'text';
    control.value = current || '';
  }
  control.id = 'status';
  holder.append(control);
}

// ---------------------------------------------------------------------------
// Líneas de producto (extensión de ventas)
// ---------------------------------------------------------------------------

function emptyLine(){
  return { sku: '', name: '', quantity: 1, unitPrice: '', discountPct: 0 };
}

function productBySku(sku){
  return getConfig().sales.products.find(p => p.sku === sku);
}

function renderLines(){
  const body = $('lines-body');
  body.innerHTML = '';
  const products = getConfig().sales.products;
  lines.forEach((line, i) => {
    const tr = document.createElement('tr');
    tr.dataset.index = String(i);

    const tdP = document.createElement('td');
    const sel = document.createElement('select');
    sel.dataset.field = 'sku';
    sel.setAttribute('aria-label', `Producto línea ${i + 1}`);
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = '— Producto —';
    sel.append(ph);
    for(const p of products){
      const o = document.createElement('option');
      o.value = p.sku;
      o.textContent = `${p.sku} · ${p.name}`;
      sel.append(o);
    }
    sel.value = line.sku;
    tdP.append(sel);

    const mk = (field, value, attrs) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.dataset.field = field;
      input.value = value;
      input.setAttribute('aria-label', `${attrs.label} línea ${i + 1}`);
      Object.entries(attrs).forEach(([k, v]) => { if(k !== 'label') input.setAttribute(k, v); });
      td.append(input);
      return td;
    };
    const tdQ = mk('quantity', line.quantity, { min: '1', step: '1', label: 'Cantidad' });
    const tdU = mk('unitPrice', line.unitPrice, { min: '1', step: '1', label: 'Precio unitario' });
    const tdD = mk('discountPct', line.discountPct, { min: '0', max: '100', step: '0.5', label: 'Descuento' });

    const tdT = document.createElement('td');
    tdT.className = 'num';
    tdT.dataset.total = String(i);
    tdT.textContent = money(computeLine(line).lineTotal);

    const tdX = document.createElement('td');
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'icon-button';
    rm.dataset.remove = String(i);
    rm.setAttribute('aria-label', `Quitar línea ${i + 1}`);
    rm.textContent = '✕';
    tdX.append(rm);

    tr.append(tdP, tdQ, tdU, tdD, tdT, tdX);
    body.append(tr);
  });
  updateTotals();
}

function onLineInput(ev){
  const el = ev.target;
  const tr = el.closest('tr');
  if(!tr || !el.dataset.field) return;
  const line = lines[Number(tr.dataset.index)];
  const field = el.dataset.field;
  if(field === 'sku'){
    line.sku = el.value;
    const p = productBySku(el.value);
    line.name = p ? p.name : '';
    if(p){
      line.unitPrice = p.unitPrice;
      tr.querySelector('[data-field="unitPrice"]').value = p.unitPrice;
    }
  } else {
    line[field] = el.value;
  }
  tr.querySelector('[data-total]').textContent = money(computeLine(line).lineTotal);
  updateTotals();
}

function updateTotals(){
  const sales = getConfig().sales;
  if(!sales) return;
  const t = computeTotals(lines, sales.taxRate);
  $('quantity').value = t.quantity || '';
  $('subtotal').value = t.subtotal;
  $('discount').value = t.discount;
  $('taxAmount').value = t.taxAmount;
  $('totalAmount').value = t.totalAmount;
  updateSalesInfo();
}

function updateSalesInfo(){
  const sales = getConfig().sales;
  if(!sales) return;
  const docId = $('document-id').value;
  const pct = maxDiscountPct(lines);
  const box = $('approval-info');
  const reasonField = $('approval-reason-field');
  if(requiresApproval(lines, sales.discountApprovalThreshold)){
    const a = latestApproval(docId);
    let state = 'Se enviará al jefe de ventas para aprobación al guardar.';
    if(a && a.discount_pct >= pct){
      if(a.decision === 'aprobado') state = `Aprobado por ${a.approved_by || 'jefatura'}.`;
      else if(a.decision === 'pendiente') state = 'Solicitud pendiente de aprobación.';
      else state = 'La última solicitud fue rechazada: baja el descuento o solicita de nuevo.';
    }
    box.textContent = `Descuento máximo ${pct} % (tope sin aprobación: ${sales.discountApprovalThreshold} %). ${state}`;
    box.hidden = false;
    reasonField.hidden = false;
  } else {
    box.hidden = true;
    reasonField.hidden = true;
  }

  const credit = $('doc-credit-info');
  const entity = findEntityByEntityId($('document-entity').value);
  if(entity && entity.creditLimit !== '' && entity.creditLimit !== undefined){
    const total = Number($('totalAmount').value) || 0;
    const c = creditCheck(entity, loadDocuments(), sales.committedStatuses, total, docId || null);
    credit.textContent = `Crédito disponible del cliente: ${money(c.available)} (límite ${money(c.limit)}).${c.ok ? '' : ' ⚠ Este pedido lo supera: no se podrá confirmar.'}`;
    credit.classList.toggle('warn', !c.ok);
    credit.hidden = false;
  } else {
    credit.hidden = true;
  }
}

// ---------------------------------------------------------------------------
// Formulario
// ---------------------------------------------------------------------------

function clearErrors(){
  document.querySelectorAll('#document-form .error').forEach(el => { el.textContent = ''; });
}

function showErrors(errors){
  clearErrors();
  const map = { entityId: 'error-document-entity', paymentTerms: 'error-docPaymentTerms', approvalReason: 'error-approval-reason' };
  for(const [key, msg] of Object.entries(errors)){
    const id = isCustomKey('document', key) ? `error-cf-${key}` : (map[key] || `error-${key}`);
    const el = $(id);
    if(el) el.textContent = msg;
  }
}

export function resetDocumentForm(){
  $('document-form').reset();
  $('document-id').value = '';
  $('document-entity').value = '';
  fillCustomFields('document', null);
  renderStatusControl('');
  $('document-submit-button').textContent = `Guardar ${labelFor('document')}`;
  $('edit-document').value = '';
  syncDeleteButton(null);
  clearErrors();
  const sales = getConfig().sales;
  if(sales){
    $('series').value = 'NV';
    $('folio').value = nextFolio('NV');
    const d = today();
    $('startDate').value = d;
    $('endDate').value = addDays(d, 15);
    $('currency').value = sales.currency;
    $('status').value = sales.openStatuses[0] || '';
    lines = [emptyLine()];
    renderLines();
    setLinesLocked(false);
  }
}

export function populateDocumentForm(doc){
  clearErrors();
  $('document-id').value = doc.id;
  $('document-entity').value = doc.entity_id;
  for(const k of ['series', 'folio', 'startDate', 'endDate', ...AMOUNT_INPUTS, 'currency', 'notes']){
    $(k).value = doc[k] ?? '';
  }
  $('docPaymentTerms').value = doc.paymentTerms ?? '';
  fillCustomFields('document', doc);
  renderStatusControl(doc.status, true);
  $('document-submit-button').textContent = `Actualizar ${labelFor('document')}`;
  $('edit-document').value = doc.id;
  syncDeleteButton(doc);
  const sales = getConfig().sales;
  if(sales){
    lines = (doc.lines || []).map(l => ({ ...l }));
    if(lines.length === 0) lines = [emptyLine()];
    renderLines();
    setLinesLocked(!sales.openStatuses.includes(doc.status));
  }
}

/** Un documento que ya no es cotización ni enviada no cambia sus productos: solo avanza de estado. */
function setLinesLocked(locked){
  $('lines-body').querySelectorAll('input, select, button').forEach(el => { el.disabled = locked; });
  $('add-line').hidden = locked;
  const note = $('lines-locked');
  if(note) note.hidden = !locked;
}

function readForm(){
  const data = {
    entityId: $('document-entity').value,
    series: $('series').value,
    folio: $('folio').value,
    startDate: $('startDate').value,
    endDate: $('endDate').value,
    currency: $('currency').value,
    paymentTerms: $('docPaymentTerms').value,
    notes: $('notes').value,
    status: $('status').value,
    ...readCustomFields('document')
  };
  for(const k of AMOUNT_INPUTS) data[k] = $(k).value;
  if(getConfig().sales){
    data.lines = lines.map(l => ({ ...l, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice), discountPct: Number(l.discountPct) || 0 }));
    data.paymentTerms = data.paymentTerms || findEntityByEntityId(data.entityId)?.paymentTerms || '';
  }
  return data;
}

function submitDocument(){
  const data = readForm();
  const id = $('document-id').value;
  const { valid, errors } = validateDocument(data, { id: id || null });
  const sales = getConfig().sales;
  if(valid && sales && requiresApproval(data.lines, sales.discountApprovalThreshold)){
    const a = latestApproval(id);
    const covered = a && a.discount_pct >= maxDiscountPct(data.lines) && a.decision !== 'rechazado';
    if(!covered && !$('approval-reason').value.trim()){
      showErrors({ approvalReason: 'Escribe el motivo del descuento para el jefe de ventas.' });
      return;
    }
  }
  if(!valid){ showErrors(errors); return; }
  try {
    const saved = id ? updateDocument(id, data) : addDocument(data);
    let note = '';
    if(sales && requiresApproval(saved.lines, sales.discountApprovalThreshold)){
      const a = requestApproval(saved.id, maxDiscountPct(saved.lines), $('approval-reason').value);
      if(a.decision === 'pendiente') note = ' Se envió la solicitud de descuento al jefe de ventas.';
    }
    refreshDocumentSelectors(saved.id);
    populateDocumentForm(saved);
    flash(`${labelFor('document')} ${documentNumber(saved)} guardado/a.${note}`);
    onChange();
  } catch (err){
    showErrors(err.fieldErrors || { status: err.message });
  }
}

export function focusDocumentForm(){
  $('document-entity').focus();
}

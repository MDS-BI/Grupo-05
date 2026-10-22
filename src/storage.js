// Capa de almacenamiento: identidad, marcas de tiempo, validación, integridad referencial y búsqueda.
// Persiste en localStorage; es el único archivo que habría que cambiar para usar un backend.

import { getConfig, customFieldsFor, labelFor, grammar } from './module-config.js';
import { isValidRut, cleanRut, formatRut, validateLines, computeTotals, creditCheck, requiresApproval, maxDiscountPct } from './sales/sales-logic.js';

export const ENTITY_KEY = 'erp_base_module:entities';
export const DOCUMENT_KEY = 'erp_base_module:documents';
export const APPROVAL_KEY = 'erp_base_module:discount_approvals';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function read(key){
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(key, list){
  localStorage.setItem(key, JSON.stringify(list));
}

let counter = 0;
export function generateId(prefix){
  counter = (counter + 1) % 1e6;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

const now = () => new Date().toISOString();

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
const trimmed = (v) => (isBlank(v) ? '' : String(v).trim());
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidDate(value){
  if(typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Texto normalizado para búsqueda: minúsculas y sin tildes. */
export function normalizeText(value){
  return String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function toNumberOrBlank(v){
  if(isBlank(v)) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

// ---------------------------------------------------------------------------
// Campos personalizados
// ---------------------------------------------------------------------------

function validateCustom(target, input, errors){
  for(const f of customFieldsFor(target)){
    const v = input[f.key];
    const errKey = f.key;
    if(isBlank(v)){
      if(f.required) errors[errKey] = `${f.label} es obligatorio.`;
      continue;
    }
    if(f.type === 'number' && !Number.isFinite(Number(v))) errors[errKey] = `${f.label} debe ser un número.`;
    if(f.type === 'date' && !isValidDate(String(v))) errors[errKey] = `${f.label} debe ser una fecha válida (AAAA-MM-DD).`;
    if(f.type === 'select' && !f.options.includes(String(v))) errors[errKey] = `${f.label} debe ser uno de: ${f.options.join(', ')}.`;
  }
}

function pickCustom(target, input){
  const out = {};
  for(const f of customFieldsFor(target)){
    if(!(f.key in input)) continue;
    const v = input[f.key];
    if(isBlank(v)) out[f.key] = '';
    else out[f.key] = f.type === 'number' ? Number(v) : String(v).trim();
  }
  return out;
}

// ---------------------------------------------------------------------------
// Entidades (clientes)
// ---------------------------------------------------------------------------

export function loadEntities(){
  return read(ENTITY_KEY);
}

export function validateEntity(input, { excludeId = null } = {}){
  const errors = {};
  const cfg = getConfig();
  if(isBlank(input.name)) errors.name = 'El nombre es obligatorio.';
  if(isBlank(input.code)) errors.code = 'El código es obligatorio.';
  if(!isBlank(input.email) && !EMAIL.test(String(input.email).trim())) errors.email = 'Ingresa un correo electrónico válido (ej.: ventas@empresa.cl).';
  if(!isBlank(input.creditLimit)){
    const n = Number(input.creditLimit);
    if(!Number.isFinite(n) || n < 0) errors.creditLimit = 'El límite de crédito debe ser un número no negativo.';
  }
  if(!isBlank(input.targetDate) && !isValidDate(String(input.targetDate))) errors.targetDate = 'La fecha debe ser válida (AAAA-MM-DD).';

  if(cfg.sales?.validateRut){
    if(isBlank(input.taxId)) errors.taxId = 'El RUT es obligatorio.';
    else if(!isValidRut(input.taxId)) errors.taxId = 'El RUT no es válido (revisa el dígito verificador).';
    else {
      const clean = cleanRut(input.taxId);
      const dup = loadEntities().find(e => e.id !== excludeId && cleanRut(e.taxId) === clean);
      if(dup) errors.taxId = `Ya existe un ${labelFor('entity').toLowerCase()} con ese RUT (${dup.name}).`;
    }
  }
  validateCustom('entity', input, errors);
  return { valid: Object.keys(errors).length === 0, errors };
}

function buildEntityFields(input){
  const cfg = getConfig();
  const out = {
    name: trimmed(input.name),
    code: trimmed(input.code)
  };
  for(const k of ['taxId', 'email', 'phone', 'address', 'category', 'description', 'paymentTerms', 'targetDate']){
    if(k in input) out[k] = trimmed(input[k]);
  }
  if(cfg.sales?.validateRut && out.taxId) out.taxId = formatRut(out.taxId);
  if('creditLimit' in input) out.creditLimit = isBlank(input.creditLimit) ? '' : Number(input.creditLimit);
  return { ...out, ...pickCustom('entity', input) };
}

export function addEntity(input){
  const { valid, errors } = validateEntity(input);
  if(!valid) throw new Error(Object.values(errors).join(' '));
  const ts = now();
  const entity = { id: generateId('ent'), entity_id: generateId('E'), ...buildEntityFields(input), createdAt: ts, updatedAt: ts };
  const all = loadEntities();
  all.push(entity);
  write(ENTITY_KEY, all);
  return entity;
}

export function updateEntity(id, changes){
  const all = loadEntities();
  const idx = all.findIndex(e => e.id === id);
  if(idx === -1) throw new Error('Registro no encontrado.');
  const merged = { ...all[idx], ...changes };
  if(getConfig().sales && 'creditLimit' in changes && currentRole() !== 'jefe'
    && String(changes.creditLimit ?? '') !== String(all[idx].creditLimit ?? '')){
    throw new Error('Solo el jefe/a de ventas puede cambiar el límite de crédito.');
  }
  const { valid, errors } = validateEntity(merged, { excludeId: id });
  if(!valid) throw new Error(Object.values(errors).join(' '));
  const updated = { ...all[idx], ...buildEntityFields(merged), id: all[idx].id, entity_id: all[idx].entity_id, updatedAt: now() };
  all[idx] = updated;
  write(ENTITY_KEY, all);
  return updated;
}

/** Perfil simulado del MVP (vendedor / jefe). En producción vendrá del inicio de sesión. */
export const ROLE_KEY = 'erp_base_module:role';
export function currentRole(){
  try { return localStorage.getItem(ROLE_KEY) || 'vendedor'; } catch { return 'vendedor'; }
}

export function deleteEntity(id){
  const all = loadEntities();
  const target = all.find(e => e.id === id);
  if(!target) return false;
  const sales = getConfig().sales;
  if(sales && documentsForEntity(target.entity_id).some(d => !sales.openStatuses.includes(d.status))){
    throw new Error('No se puede eliminar un cliente con documentos cerrados (cualquier estado distinto de cotización o enviada): quedan en la historia de ventas.');
  }
  write(ENTITY_KEY, all.filter(e => e.id !== id));
  deleteDocumentsForEntity(target.entity_id);
  return true;
}

export function findEntityByEntityId(entityId){
  return loadEntities().find(e => e.entity_id === entityId) || null;
}

function entitySearchText(e){
  const parts = [e.name, e.code, e.taxId, cleanRut(e.taxId), e.email, e.phone, e.address, e.category, e.description, e.targetDate, e.paymentTerms, e.creditLimit];
  for(const f of customFieldsFor('entity')) parts.push(e[f.key]);
  return normalizeText(parts.filter(p => !isBlank(p)).join(' '));
}

export function searchEntities(term){
  const q = normalizeText(term);
  const all = loadEntities();
  if(!q) return all;
  return all.filter(e => entitySearchText(e).includes(q));
}

// ---------------------------------------------------------------------------
// Documentos (cotizaciones / pedidos de venta)
// ---------------------------------------------------------------------------

export function loadDocuments(){
  return read(DOCUMENT_KEY);
}

export function documentsForEntity(entityId){
  return loadDocuments().filter(d => d.entity_id === entityId);
}

export function documentNumber(doc){
  return doc.series ? `${doc.series}-${doc.folio}` : String(doc.folio);
}

export function nextFolio(series){
  const docs = loadDocuments().filter(d => (d.series || '') === (series || ''));
  return docs.reduce((m, d) => Math.max(m, Number(d.folio) || 0), 1000) + 1;
}

function entityIdOf(input){
  return input.entityId ?? input.entity_id;
}

/**
 * Valida un documento. `context.id` identifica el documento que se edita (para el crédito y la aprobación).
 */
export function validateDocument(input, context = {}){
  const errors = {};
  const cfg = getConfig();
  const entityTerm = labelFor('entity');
  const g = grammar(entityTerm);

  const entityId = entityIdOf(input);
  const entity = isBlank(entityId) ? null : findEntityByEntityId(entityId);
  if(!entity) errors.entityId = `Selecciona ${g.indefinite} ${entityTerm.toLowerCase()} existente.`;

  if(isBlank(input.folio)) errors.folio = 'El folio es obligatorio.';
  else {
    const f = Number(input.folio);
    if(!Number.isInteger(f) || f <= 0) errors.folio = 'El folio debe ser un entero positivo.';
    else if(cfg.sales){
      const series = trimmed(input.series);
      const dup = loadDocuments().some(d => d.id !== context.id && trimmed(d.series) === series && Number(d.folio) === f);
      if(dup) errors.folio = `Ya existe un documento ${series ? series + '-' : ''}${f}.`;
    }
  }

  if(isBlank(input.startDate)) errors.startDate = 'La fecha de inicio es obligatoria.';
  else if(!isValidDate(String(input.startDate))) errors.startDate = 'La fecha de inicio no es válida (AAAA-MM-DD).';
  if(isBlank(input.endDate)) errors.endDate = 'La fecha de fin es obligatoria.';
  else if(!isValidDate(String(input.endDate))) errors.endDate = 'La fecha de fin no es válida (AAAA-MM-DD).';
  if(!errors.startDate && !errors.endDate && String(input.endDate) < String(input.startDate)){
    errors.endDate = 'La fecha de fin debe ser igual o posterior a la fecha de inicio.';
  }

  if(!isBlank(input.quantity)){
    const q = Number(input.quantity);
    if(!Number.isInteger(q) || q <= 0) errors.quantity = 'La cantidad debe ser un entero positivo.';
  }
  for(const k of ['subtotal', 'discount', 'taxAmount', 'totalAmount']){
    if(isBlank(input[k])) continue;
    const n = Number(input[k]);
    if(!Number.isFinite(n) || n < 0) errors[k] = 'El importe debe ser un número no negativo.';
  }
  if(!errors.subtotal && !errors.discount && !isBlank(input.discount) && Number(input.discount) > (isBlank(input.subtotal) ? 0 : Number(input.subtotal))){
    errors.discount = 'El descuento no puede superar el subtotal.';
  }

  const lc = cfg.statusLifecycle;
  if(lc && !isBlank(input.status) && !lc.statuses.includes(String(input.status))){
    errors.status = `El estado debe ser uno de: ${lc.statuses.join(', ')}.`;
  }
  validateCustom('document', input, errors);

  if(cfg.sales) validateSalesRules(input, context, entity, errors, cfg.sales);
  return { valid: Object.keys(errors).length === 0, errors };
}

function validateSalesRules(input, context, entity, errors, sales){
  const lineErrors = validateLines(input.lines);
  if(lineErrors.length) errors.lines = lineErrors.join(' ');

  const status = String(input.status || '');
  if(status === sales.lostStatus && sales.lostReasonField && isBlank(input[sales.lostReasonField])){
    errors[sales.lostReasonField] = 'Indica el motivo de pérdida: sin este dato, el análisis solo vería las ventas ganadas.';
  }

  const previous = context.id ? loadDocuments().find(d => d.id === context.id) : null;
  if(!previous && status && sales.newDocumentStatuses.length && !sales.newDocumentStatuses.includes(status)){
    errors.status = `Un documento nuevo solo puede crearse como ${sales.newDocumentStatuses.join(' o ')}; los demás estados se alcanzan avanzando el documento.`;
    return;
  }
  const entering = sales.committedStatuses.includes(status) && !(previous && sales.committedStatuses.includes(previous.status));
  if(!entering || errors.lines || !entity) return;

  if(requiresApproval(input.lines, sales.discountApprovalThreshold)){
    const approval = latestApproval(context.id);
    const pct = maxDiscountPct(input.lines);
    if(!approval || approval.decision !== 'aprobado' || approval.discount_pct < pct){
      errors.status = `Hay un descuento de ${pct} % (más de ${sales.discountApprovalThreshold} %). Necesita la aprobación del jefe de ventas antes de confirmar.`;
      return;
    }
  }
  const total = computeTotals(input.lines, sales.taxRate).totalAmount;
  const credit = creditCheck(entity, loadDocuments(), sales.committedStatuses, total, context.id);
  if(!credit.ok){
    const fmt = (n) => `$${Math.round(n).toLocaleString('es-CL')}`;
    errors.status = `Supera el crédito disponible del cliente: disponible ${fmt(credit.available)}, pedido ${fmt(total)}.`;
  }
}

function normalizeLines(lines){
  return (lines || []).map(l => ({
    sku: String(l.sku),
    name: String(l.name ?? ''),
    quantity: Number(l.quantity),
    unitPrice: Number(l.unitPrice),
    discountPct: Number(l.discountPct) || 0
  }));
}

function buildDocumentFields(input){
  const cfg = getConfig();
  const out = {
    entity_id: String(entityIdOf(input)),
    series: trimmed(input.series),
    folio: Number(input.folio),
    startDate: String(input.startDate),
    endDate: String(input.endDate)
  };
  for(const k of ['quantity', 'subtotal', 'discount', 'taxAmount', 'totalAmount']){
    if(k in input) out[k] = isBlank(input[k]) ? '' : Number(input[k]);
  }
  for(const k of ['currency', 'paymentTerms', 'notes', 'status']){
    if(k in input) out[k] = trimmed(input[k]);
  }
  if(cfg.sales && Array.isArray(input.lines)){
    out.lines = normalizeLines(input.lines);
    Object.assign(out, computeTotals(out.lines, cfg.sales.taxRate));
    if(!out.currency) out.currency = cfg.sales.currency;
  }
  return { ...out, ...pickCustom('document', input) };
}

function failWith(errors){
  const err = new Error(Object.values(errors).join(' '));
  err.fieldErrors = errors;
  return err;
}

export function addDocument(input){
  const { valid, errors } = validateDocument(input);
  if(!valid) throw failWith(errors);
  const ts = now();
  const doc = { id: generateId('doc'), ...buildDocumentFields(input), createdAt: ts, updatedAt: ts };
  const all = loadDocuments();
  all.push(doc);
  write(DOCUMENT_KEY, all);
  return doc;
}

export function allowedNextStatuses(current){
  const lc = getConfig().statusLifecycle;
  if(!lc) return null;
  if(isBlank(current) || !lc.statuses.includes(current)) return [...lc.statuses];
  return [current, ...lc.transitions[current]];
}

export function updateDocument(id, changes){
  const all = loadDocuments();
  const idx = all.findIndex(d => d.id === id);
  if(idx === -1) throw new Error('Documento no encontrado.');
  const current = all[idx];
  const lc = getConfig().statusLifecycle;
  if(lc && 'status' in changes && !isBlank(current.status) && changes.status !== current.status){
    const allowed = lc.transitions[current.status] || [];
    if(!allowed.includes(changes.status)){
      throw new Error(`Transición de estado inválida: de "${current.status}" a "${changes.status}".`);
    }
  }
  const sales = getConfig().sales;
  if(sales && 'lines' in changes && !sales.openStatuses.includes(current.status)
    && JSON.stringify(normalizeLines(changes.lines)) !== JSON.stringify(normalizeLines(current.lines))){
    throw failWith({ lines: `Un documento en estado "${current.status}" ya no se puede modificar; anúlalo y crea uno nuevo.` });
  }
  const merged = { ...current, ...changes };
  const { valid, errors } = validateDocument(merged, { id });
  if(!valid) throw failWith(errors);
  const updated = { ...current, ...buildDocumentFields(merged), id: current.id, updatedAt: now() };
  all[idx] = updated;
  write(DOCUMENT_KEY, all);
  return updated;
}

export function deleteDocument(id){
  const all = loadDocuments();
  const sales = getConfig().sales;
  const target = all.find(d => d.id === id);
  if(sales && target && !sales.openStatuses.includes(target.status)){
    throw new Error(`Un documento en estado "${target.status}" no se elimina: queda en la historia (si corresponde, anúlalo).`);
  }
  write(DOCUMENT_KEY, all.filter(d => d.id !== id));
  write(APPROVAL_KEY, loadApprovals().filter(a => a.sales_order_id !== id));
}

export function deleteDocumentsForEntity(entityId){
  const removed = loadDocuments().filter(d => d.entity_id === entityId).map(d => d.id);
  write(DOCUMENT_KEY, loadDocuments().filter(d => d.entity_id !== entityId));
  if(removed.length) write(APPROVAL_KEY, loadApprovals().filter(a => !removed.includes(a.sales_order_id)));
}

// ---------------------------------------------------------------------------
// Aprobaciones de descuento (discount_approvals)
// ---------------------------------------------------------------------------

export function loadApprovals(){
  return read(APPROVAL_KEY);
}

export function latestApproval(docId){
  if(!docId) return null;
  const list = loadApprovals().filter(a => a.sales_order_id === docId);
  return list.length ? list[list.length - 1] : null;
}

/** Registra la solicitud (decision = pendiente) si no hay una vigente para ese descuento. */
export function requestApproval(docId, discountPct, reason){
  const last = latestApproval(docId);
  if(last && last.discount_pct >= discountPct && (last.decision === 'pendiente' || last.decision === 'aprobado')) return last;
  if(!trimmed(reason)) throw new Error('El motivo del descuento es obligatorio.');
  const record = {
    approval_id: generateId('apr'),
    sales_order_id: docId,
    discount_pct: discountPct,
    reason: trimmed(reason),
    requested_by: loadDocuments().find(d => d.id === docId)?.vendedor || '',
    decision: 'pendiente',
    approved_by: '',
    requested_at: now(),
    decided_at: ''
  };
  write(APPROVAL_KEY, [...loadApprovals(), record]);
  return record;
}

export function decideApproval(approvalId, decision, approver){
  if(getConfig().sales && currentRole() !== 'jefe') throw new Error('Solo el jefe/a de ventas puede aprobar o rechazar descuentos.');
  if(decision !== 'aprobado' && decision !== 'rechazado') throw new Error('La decisión debe ser "aprobado" o "rechazado".');
  const all = loadApprovals();
  const idx = all.findIndex(a => a.approval_id === approvalId);
  if(idx === -1) throw new Error('Solicitud no encontrada.');
  all[idx] = { ...all[idx], decision, approved_by: trimmed(approver), decided_at: now() };
  write(APPROVAL_KEY, all);
  return all[idx];
}

export function pendingApprovals(){
  return loadApprovals().filter(a => a.decision === 'pendiente');
}

// ---------------------------------------------------------------------------

export function clearAll(){
  localStorage.removeItem(ENTITY_KEY);
  localStorage.removeItem(DOCUMENT_KEY);
  localStorage.removeItem(APPROVAL_KEY);
}

export function exportData(){
  return { entities: loadEntities(), documents: loadDocuments(), discount_approvals: loadApprovals(), exportedAt: now() };
}

export function importData(data){
  if(!data || !Array.isArray(data.entities) || !Array.isArray(data.documents)) throw new Error('El archivo no tiene el formato esperado.');
  write(ENTITY_KEY, data.entities);
  write(DOCUMENT_KEY, data.documents);
  write(APPROVAL_KEY, Array.isArray(data.discount_approvals) ? data.discount_approvals : []);
}

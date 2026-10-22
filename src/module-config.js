// Configuración del módulo. Todo lo específico de Ventas vive en `userConfig`;
// el resto del archivo es el núcleo genérico del template (valores por defecto y validación).

import { ventasProfile } from './profiles/ventas.js';

// ---------------------------------------------------------------------------
// Perfil activo del módulo. Para volver al módulo base genérico, usar `null`.
// ---------------------------------------------------------------------------
export const userConfig = ventasProfile;

export const FIELD_TYPES = ['text', 'number', 'date', 'select'];

export const BASE_FIELDS = {
  entity: ['id', 'entity_id', 'name', 'code', 'taxId', 'email', 'phone', 'address', 'category', 'description', 'targetDate', 'creditLimit', 'paymentTerms', 'createdAt', 'updatedAt'],
  document: ['id', 'entity_id', 'series', 'folio', 'startDate', 'endDate', 'quantity', 'subtotal', 'discount', 'taxAmount', 'totalAmount', 'currency', 'paymentTerms', 'notes', 'status', 'createdAt', 'updatedAt']
};

// Campos reservados por la extensión de ventas (líneas del documento).
const RESERVED_KEYS = ['lines', 'entityId'];

export const DEFAULT_CONFIG = Object.freeze({
  moduleName: 'Módulo Base ERP',
  labels: Object.freeze({ entity: 'Entidad', entities: 'Entidades', document: 'Documento', documents: 'Documentos' }),
  customFields: Object.freeze([]),
  statusLifecycle: null,
  theme: Object.freeze({ accentColor: '#2563eb' }),
  fieldLabels: Object.freeze({ entity: Object.freeze({}), document: Object.freeze({}) }),
  sales: null
});

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

function cloneDefaults(){
  return {
    moduleName: DEFAULT_CONFIG.moduleName,
    labels: { ...DEFAULT_CONFIG.labels },
    customFields: [],
    statusLifecycle: null,
    theme: { ...DEFAULT_CONFIG.theme },
    fieldLabels: { entity: {}, document: {} },
    sales: null
  };
}

function isPlainObject(v){
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function normalizeCustomFields(fields, errors){
  if(fields === undefined || fields === null) return [];
  if(!Array.isArray(fields)){
    errors.push('customFields debe ser una lista de campos.');
    return [];
  }
  const seen = { entity: new Set(), document: new Set() };
  const result = [];
  fields.forEach((f, i) => {
    const where = `customFields[${i}]`;
    if(!isPlainObject(f)){ errors.push(`${where} debe ser un objeto.`); return; }
    const { target, key, label, type, required, options } = f;
    let ok = true;
    if(target !== 'entity' && target !== 'document'){
      errors.push(`${where}.target debe ser "entity" o "document".`); ok = false;
    }
    if(typeof key !== 'string' || !KEY_PATTERN.test(key)){
      errors.push(`${where}.key debe ser un identificador válido (letras, números y _).`); ok = false;
    } else if(ok && (BASE_FIELDS[target].includes(key) || RESERVED_KEYS.includes(key))){
      errors.push(`${where}.key "${key}" choca con un campo base.`); ok = false;
    } else if(ok && seen[target].has(key)){
      errors.push(`${where}.key "${key}" está declarado más de una vez.`); ok = false;
    }
    if(typeof label !== 'string' || !label.trim()){
      errors.push(`${where}.label es obligatorio.`); ok = false;
    }
    if(!FIELD_TYPES.includes(type)){
      errors.push(`${where}.type "${type}" no es válido; usa uno de: ${FIELD_TYPES.join(', ')}.`); ok = false;
    }
    if(type === 'select' && (!Array.isArray(options) || options.length === 0 || options.some(o => typeof o !== 'string'))){
      errors.push(`${where}.options es obligatorio para campos select (lista de textos).`); ok = false;
    }
    if(!ok) return;
    seen[target].add(key);
    const field = { target, key, label: label.trim(), type, required: required === true };
    if(type === 'select') field.options = [...options];
    result.push(field);
  });
  return result;
}

function normalizeLifecycle(lc, errors){
  if(lc === undefined || lc === null) return null;
  if(!isPlainObject(lc) || !Array.isArray(lc.statuses) || lc.statuses.length === 0){
    errors.push('statusLifecycle.statuses debe ser una lista no vacía de estados.');
    return null;
  }
  const statuses = lc.statuses;
  if(statuses.some(s => typeof s !== 'string' || !s.trim())){
    errors.push('statusLifecycle.statuses solo puede contener textos no vacíos.');
    return null;
  }
  if(new Set(statuses).size !== statuses.length){
    errors.push('statusLifecycle.statuses tiene estados repetidos.');
    return null;
  }
  const transitions = {};
  const raw = isPlainObject(lc.transitions) ? lc.transitions : {};
  let ok = true;
  for(const [from, tos] of Object.entries(raw)){
    if(!statuses.includes(from)){
      errors.push(`statusLifecycle.transitions usa el estado desconocido "${from}".`); ok = false; continue;
    }
    if(!Array.isArray(tos)){
      errors.push(`statusLifecycle.transitions["${from}"] debe ser una lista.`); ok = false; continue;
    }
    for(const to of tos){
      if(!statuses.includes(to)){
        errors.push(`statusLifecycle.transitions["${from}"] apunta al estado desconocido "${to}".`); ok = false;
      }
    }
    transitions[from] = [...tos];
  }
  if(!ok) return null;
  statuses.forEach(s => { if(!transitions[s]) transitions[s] = []; });
  return { statuses: [...statuses], transitions };
}

function normalizeFieldLabels(fl, errors){
  const out = { entity: {}, document: {} };
  if(fl === undefined || fl === null) return out;
  if(!isPlainObject(fl)){ errors.push('fieldLabels debe ser un objeto { entity, document }.'); return out; }
  for(const target of ['entity', 'document']){
    const map = fl[target];
    if(map === undefined) continue;
    if(!isPlainObject(map)){ errors.push(`fieldLabels.${target} debe ser un objeto.`); continue; }
    for(const [k, v] of Object.entries(map)){
      if(!BASE_FIELDS[target].includes(k)){ errors.push(`fieldLabels.${target}.${k} no es un campo base.`); continue; }
      if(typeof v !== 'string' || !v.trim()){ errors.push(`fieldLabels.${target}.${k} debe ser un texto.`); continue; }
      out[target][k] = v.trim();
    }
  }
  return out;
}

function normalizeSales(sales, statusLifecycle, errors){
  if(sales === undefined || sales === null) return null;
  if(!isPlainObject(sales)){ errors.push('sales debe ser un objeto.'); return null; }
  const out = {
    taxRate: 0.19,
    currency: 'CLP',
    discountApprovalThreshold: 10,
    validateRut: true,
    products: [],
    sellers: [],
    lostReasons: [],
    lostStatus: null,
    lostReasonField: null,
    confirmedStatuses: [],
    openStatuses: [],
    newDocumentStatuses: [],   // vacío = un documento nuevo puede nacer en cualquier estado
    committedStatuses: []
  };
  const num = (k, min, max) => {
    if(sales[k] === undefined) return;
    const v = sales[k];
    if(typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max){
      errors.push(`sales.${k} debe ser un número entre ${min} y ${max}.`); return;
    }
    out[k] = v;
  };
  num('taxRate', 0, 1);
  num('discountApprovalThreshold', 0, 100);
  if(sales.currency !== undefined){
    if(typeof sales.currency === 'string' && /^[A-Z]{3}$/.test(sales.currency)) out.currency = sales.currency;
    else errors.push('sales.currency debe ser un código ISO de 3 letras (p. ej., CLP).');
  }
  if(sales.validateRut !== undefined) out.validateRut = sales.validateRut === true;

  if(sales.products !== undefined){
    if(!Array.isArray(sales.products)) errors.push('sales.products debe ser una lista.');
    else {
      const skus = new Set();
      sales.products.forEach((p, i) => {
        if(!isPlainObject(p) || typeof p.sku !== 'string' || !p.sku.trim() || typeof p.name !== 'string'
          || typeof p.unitPrice !== 'number' || p.unitPrice <= 0 || typeof p.standardCost !== 'number' || p.standardCost < 0){
          errors.push(`sales.products[${i}] necesita sku, name, unitPrice > 0 y standardCost ≥ 0.`); return;
        }
        if(skus.has(p.sku)){ errors.push(`sales.products[${i}].sku "${p.sku}" está repetido.`); return; }
        skus.add(p.sku);
        out.products.push({ sku: p.sku, name: p.name, unitPrice: p.unitPrice, standardCost: p.standardCost, uom: p.uom || 'un' });
      });
    }
  }
  for(const k of ['sellers', 'lostReasons']){
    if(sales[k] === undefined) continue;
    if(!Array.isArray(sales[k]) || sales[k].some(s => typeof s !== 'string' || !s.trim())) errors.push(`sales.${k} debe ser una lista de textos.`);
    else out[k] = [...sales[k]];
  }
  const statuses = statusLifecycle ? statusLifecycle.statuses : [];
  for(const k of ['confirmedStatuses', 'openStatuses', 'committedStatuses', 'newDocumentStatuses']){
    if(sales[k] === undefined) continue;
    if(!Array.isArray(sales[k]) || sales[k].some(s => !statuses.includes(s))){
      errors.push(`sales.${k} debe contener solo estados del statusLifecycle.`);
    } else out[k] = [...sales[k]];
  }
  if(sales.lostStatus !== undefined){
    if(statuses.includes(sales.lostStatus)) out.lostStatus = sales.lostStatus;
    else errors.push('sales.lostStatus debe ser un estado del statusLifecycle.');
  }
  if(sales.lostReasonField !== undefined) out.lostReasonField = String(sales.lostReasonField);
  return out;
}

/**
 * Valida una configuración y la combina con los valores por defecto.
 * Nunca lanza error: devuelve { config, errors } para que la app muestre los problemas.
 */
export function normalizeConfig(raw){
  const errors = [];
  const config = cloneDefaults();
  if(raw === undefined || raw === null) return { config, errors };
  if(!isPlainObject(raw)){
    errors.push('La configuración del módulo debe ser un objeto.');
    return { config, errors };
  }

  if(raw.moduleName !== undefined){
    if(typeof raw.moduleName === 'string' && raw.moduleName.trim()) config.moduleName = raw.moduleName.trim();
    else errors.push('moduleName debe ser un texto no vacío.');
  }

  if(raw.labels !== undefined){
    if(!isPlainObject(raw.labels)) errors.push('labels debe ser un objeto.');
    else {
      for(const k of ['entity', 'entities', 'document', 'documents']){
        const v = raw.labels[k];
        if(v === undefined) continue;
        if(typeof v === 'string' && v.trim()) config.labels[k] = v.trim();
        else errors.push(`labels.${k} debe ser un texto no vacío.`);
      }
    }
  }

  config.customFields = normalizeCustomFields(raw.customFields, errors);
  config.statusLifecycle = normalizeLifecycle(raw.statusLifecycle, errors);

  if(raw.theme !== undefined && raw.theme !== null){
    if(!isPlainObject(raw.theme)) errors.push('theme debe ser un objeto como { accentColor: "#2563eb" }.');
    else if(raw.theme.accentColor !== undefined){
      if(typeof raw.theme.accentColor === 'string' && HEX_COLOR.test(raw.theme.accentColor)) config.theme.accentColor = raw.theme.accentColor;
      else errors.push(`theme.accentColor "${raw.theme.accentColor}" no es un color hexadecimal válido; se usa el color por defecto.`);
    }
  }

  config.fieldLabels = normalizeFieldLabels(raw.fieldLabels, errors);
  config.sales = normalizeSales(raw.sales, config.statusLifecycle, errors);
  return { config, errors };
}

export async function loadModuleConfig(){
  return normalizeConfig(userConfig);
}

// ---------------------------------------------------------------------------
// Configuración activa (compartida por almacenamiento e interfaz)
// ---------------------------------------------------------------------------
let active = null;

export function setActiveConfig(config){
  if(!config){ active = null; return; }
  const base = cloneDefaults();
  active = {
    ...base,
    ...config,
    labels: { ...base.labels, ...(config.labels || {}) },
    theme: { ...base.theme, ...(config.theme || {}) },
    customFields: config.customFields || [],
    statusLifecycle: config.statusLifecycle ?? null,
    fieldLabels: config.fieldLabels || base.fieldLabels,
    sales: config.sales ?? null
  };
}

export function getConfig(){
  return active || cloneDefaults();
}

export function labelFor(key){
  return getConfig().labels[key] ?? DEFAULT_CONFIG.labels[key];
}

export function customFieldsFor(target){
  return getConfig().customFields.filter(f => f.target === target);
}

// --- Concordancia gramatical en español ------------------------------------
const FEMININE_ENDINGS = /(a|dad|tad|ión|tud|umbre|ez)$/i;

export function isFeminine(term){
  const first = String(term).trim().split(/\s+/)[0] || '';
  return FEMININE_ENDINGS.test(first);
}

/** Devuelve "el/la", "un/una", "nuevo/nueva", "seleccionado/seleccionada" según el término. */
export function grammar(term){
  const f = isFeminine(term);
  return {
    article: f ? 'la' : 'el',
    indefinite: f ? 'una' : 'un',
    newWord: f ? 'Nueva' : 'Nuevo',
    selected: f ? 'seleccionada' : 'seleccionado'
  };
}

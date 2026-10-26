// Formulario de creación/edición de entidades (clientes) y selector para editar o eliminar.

import { getConfig, labelFor, grammar } from '../module-config.js';
import { loadEntities, addEntity, updateEntity, deleteEntity, validateEntity, loadDocuments, currentRole } from '../storage.js';
import { creditUsed } from '../sales/sales-logic.js';
import { renderCustomFields, readCustomFields, fillCustomFields, isCustomKey } from './custom-fields.js';
import { flash } from './shell.js';
import { money } from './format.js';

const BASE_INPUTS = ['name', 'code', 'taxId', 'email', 'phone', 'address', 'category', 'description', 'targetDate', 'creditLimit', 'paymentTerms'];
const $ = (id) => document.getElementById(id);

let onChange = () => {};

export function initEntityForm({ onDataChanged }){
  onChange = onDataChanged || (() => {});
  renderCustomFields('entity', $('entity-custom-fields'), $('entity-custom-fields-grid'));

  $('entity-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    submitEntity();
  });
  $('reset-entity').addEventListener('click', () => resetEntityForm());
  $('edit-entity').addEventListener('change', () => {
    const id = $('edit-entity').value;
    if(!id){ resetEntityForm(); return; }
    const entity = loadEntities().find(e => e.id === id);
    if(entity) populateEntityForm(entity);
  });
  $('delete-entity').addEventListener('click', () => {
    const id = $('edit-entity').value;
    if(!id) return;
    const term = labelFor('entity').toLowerCase();
    const g = grammar(labelFor('entity'));
    const docs = labelFor('documents').toLowerCase();
    if(!confirm(`¿Eliminar ${g.article} ${term} ${g.selected}? También se eliminarán sus ${docs}.`)) return;
    try { deleteEntity(id); } catch (err){ flash(err.message); return; }
    resetEntityForm();
    refreshEntitySelector();
    flash(`${labelFor('entity')} eliminado/a.`);
    onChange();
  });
}

export function refreshEntitySelector(selectedId = ''){
  applyCreditPermission();
  const select = $('edit-entity');
  const entities = loadEntities();
  const frag = document.createDocumentFragment();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = entities.length ? `— Selecciona para editar (${entities.length}) —` : '— No hay registros —';
  frag.append(placeholder);
  for(const e of entities){
    const o = document.createElement('option');
    o.value = e.id;
    o.textContent = `${e.name} — ${e.code}`;
    frag.append(o);
  }
  select.innerHTML = '';
  select.append(frag);
  select.value = selectedId;
  $('delete-entity').disabled = !select.value;
}

function clearErrors(){
  document.querySelectorAll('#entity-form .error').forEach(el => { el.textContent = ''; });
}

function showErrors(errors){
  clearErrors();
  for(const [key, msg] of Object.entries(errors)){
    const el = isCustomKey('entity', key) ? $(`error-cf-${key}`) : $(`error-${key}`);
    if(el) el.textContent = msg;
  }
}

export function resetEntityForm(){
  $('entity-form').reset();
  $('entity-id').value = '';
  fillCustomFields('entity', null);
  $('submit-button').textContent = 'Guardar';
  $('edit-entity').value = '';
  $('delete-entity').disabled = true;
  $('entity-credit-info').hidden = true;
  applyCreditPermission();
  clearErrors();
}

/** En Ventas, solo el jefe/a fija el límite de crédito (DR-01). */
function applyCreditPermission(){
  const locked = Boolean(getConfig().sales) && currentRole() !== 'jefe';
  $('creditLimit').disabled = locked;
  $('creditLimit').title = locked ? 'Solo el jefe/a de ventas puede fijar el límite de crédito.' : '';
}

export function populateEntityForm(entity){
  clearErrors();
  $('entity-id').value = entity.id;
  for(const k of BASE_INPUTS) $(k).value = entity[k] ?? '';
  fillCustomFields('entity', entity);
  $('submit-button').textContent = 'Actualizar';
  $('edit-entity').value = entity.id;
  $('delete-entity').disabled = false;
  applyCreditPermission();
  showCreditInfo(entity);
}

function showCreditInfo(entity){
  const sales = getConfig().sales;
  const box = $('entity-credit-info');
  if(!sales || entity.creditLimit === '' || entity.creditLimit === undefined){ box.hidden = true; return; }
  const used = creditUsed(entity.entity_id, loadDocuments(), sales.committedStatuses);
  box.textContent = `Crédito usado: ${money(used)} de ${money(entity.creditLimit)} · disponible ${money(entity.creditLimit - used)}`;
  box.hidden = false;
}

function readForm(){
  const data = {};
  for(const k of BASE_INPUTS) data[k] = $(k).value;
  return { ...data, ...readCustomFields('entity') };
}

function submitEntity(){
  const data = readForm();
  const id = $('entity-id').value;
  const { valid, errors } = validateEntity(data, { excludeId: id || null });
  if(!valid){ showErrors(errors); return; }
  try {
    if(id){
      const updated = updateEntity(id, data);
      refreshEntitySelector(updated.id);
      populateEntityForm(updated);
      flash(`${labelFor('entity')} actualizado/a.`);
    } else {
      addEntity(data);
      resetEntityForm();
      refreshEntitySelector();
      flash(`${labelFor('entity')} guardado/a.`);
    }
    onChange();
  } catch (err){
    showErrors({ name: err.message });
  }
}

export function focusEntityForm(){
  $('name').focus();
}

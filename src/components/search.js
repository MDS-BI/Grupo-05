// Pantalla de búsqueda de entidades (clientes), con sus documentos y estado de un vistazo.

import { getConfig, customFieldsFor, labelFor } from '../module-config.js';
import { searchEntities, documentsForEntity, documentNumber } from '../storage.js';
import { money } from './format.js';

const $ = (id) => document.getElementById(id);
const MAX_RESULTS = 100;

export function initSearch(){
  $('search-input').addEventListener('input', runSearch);
}

export function runSearch(){
  const term = $('search-input').value;
  const results = searchEntities(term);
  const list = $('search-results-list');
  list.innerHTML = '';
  const frag = document.createDocumentFragment();
  const fl = getConfig().fieldLabels.entity;
  const showMoney = Boolean(getConfig().sales);
  for(const e of results.slice(0, MAX_RESULTS)){
    const li = document.createElement('li');
    li.className = 'entity-item';
    const title = document.createElement('strong');
    title.textContent = `${e.name} — ${e.code}`;
    li.append(title);

    const meta = [];
    if(e.taxId) meta.push(`${fl.taxId || 'Identificación fiscal'}: ${e.taxId}`);
    if(e.email) meta.push(e.email);
    if(e.category) meta.push(`${fl.category || 'Categoría'}: ${e.category}`);
    if(e.targetDate) meta.push(`${fl.targetDate || 'Fecha objetivo'}: ${e.targetDate}`);
    for(const f of customFieldsFor('entity')){
      if(e[f.key] !== undefined && e[f.key] !== '') meta.push(`${f.label}: ${e[f.key]}`);
    }
    if(meta.length){
      const p = document.createElement('div');
      p.className = 'meta';
      p.textContent = meta.join(' · ');
      li.append(p);
    }

    const docs = documentsForEntity(e.entity_id);
    if(docs.length){
      const ul = document.createElement('ul');
      ul.className = 'doc-list';
      ul.setAttribute('aria-label', labelFor('documents'));
      for(const d of docs){
        const item = document.createElement('li');
        item.textContent = `${documentNumber(d)} · ${d.startDate}${showMoney && d.totalAmount !== '' && d.totalAmount !== undefined ? ` · ${money(d.totalAmount)}` : ''} `;
        if(d.status){
          const badge = document.createElement('span');
          badge.className = 'status-badge';
          badge.dataset.status = d.status;
          badge.textContent = d.status;
          item.append(badge);
        }
        ul.append(item);
      }
      li.append(ul);
    }
    frag.append(li);
  }
  list.append(frag);
  $('search-empty').hidden = results.length > 0;
  $('search-count').textContent = results.length > MAX_RESULTS
    ? `Mostrando ${MAX_RESULTS} de ${results.length} resultados. Escribe más para afinar.`
    : (term.trim() ? `${results.length} resultado(s).` : '');
}

export function focusSearch(){
  $('search-input').focus();
}

// Renderiza los campos personalizados declarados en la configuración.

import { customFieldsFor } from '../module-config.js';

export function renderCustomFields(target, fieldset, grid){
  const fields = customFieldsFor(target);
  grid.innerHTML = '';
  fieldset.hidden = fields.length === 0;
  for(const f of fields){
    const wrap = document.createElement('div');
    wrap.className = 'field custom-field';
    const label = document.createElement('label');
    label.htmlFor = `cf-${f.key}`;
    label.textContent = `${f.label}${f.required ? ' *' : ''}`;
    let control;
    if(f.type === 'select'){
      control = document.createElement('select');
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = '--';
      control.append(empty);
      for(const opt of f.options){
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        control.append(o);
      }
    } else {
      control = document.createElement('input');
      control.type = f.type;
      if(f.type === 'number') control.step = 'any';
    }
    control.id = `cf-${f.key}`;
    control.dataset.key = f.key;
    const error = document.createElement('span');
    error.className = 'error';
    error.id = `error-cf-${f.key}`;
    wrap.append(label, control, error);
    grid.append(wrap);
  }
}

export function readCustomFields(target){
  const out = {};
  for(const f of customFieldsFor(target)){
    const el = document.getElementById(`cf-${f.key}`);
    if(el) out[f.key] = el.value;
  }
  return out;
}

export function fillCustomFields(target, record){
  for(const f of customFieldsFor(target)){
    const el = document.getElementById(`cf-${f.key}`);
    if(el) el.value = record?.[f.key] ?? '';
  }
}

export function isCustomKey(target, key){
  return customFieldsFor(target).some(f => f.key === key);
}

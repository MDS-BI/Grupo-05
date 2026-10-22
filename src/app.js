// Orquestador de la aplicación: aplica la configuración, conecta pantallas y navegación.

import { loadModuleConfig, setActiveConfig, labelFor, grammar } from './module-config.js';
import { renderLogo, setActiveModule, applyAccent } from './components/shell.js';
import { initDashboard, refreshDashboard } from './components/dashboard.js';
import { initEntityForm, refreshEntitySelector, resetEntityForm, focusEntityForm } from './components/entity-form.js';
import { initDocumentForm, refreshDocumentSelectors, resetDocumentForm, focusDocumentForm } from './components/document-form.js';
import { initSearch, runSearch, focusSearch } from './components/search.js';

const $ = (id) => document.getElementById(id);

function setText(id, text){
  const el = $(id);
  if(el) el.textContent = text;
}

function applyLabels(config){
  const entity = labelFor('entity');
  const entities = labelFor('entities');
  const docTerm = labelFor('document');
  const documents = labelFor('documents');
  const ge = grammar(entity);
  const gd = grammar(docTerm);

  document.title = config.moduleName;
  setText('brand-name', config.moduleName);
  setText('dashboard-heading', config.moduleName);

  setText('nav-dashboard-label', 'Panel');
  setText('nav-entities-label', entities);
  setText('nav-documents-label', documents);
  setText('nav-search-label', 'Búsqueda');

  setText('action-new-entity-title', `${ge.newWord} ${entity}`);
  setText('action-new-document-title', `${gd.newWord} ${docTerm}`);
  setText('action-open-entities-title', entities);
  setText('action-find-title', 'Buscar registros');
  setText('stat-entities-label', entities);
  setText('stat-documents-label', documents);

  setText('entities-view-heading', entities);
  setText('entity-form-heading', `Agregar / Editar ${entity}`);
  setText('edit-entity-heading', `Editar o eliminar ${ge.article} ${entity.toLowerCase()}`);
  setText('delete-entity', `Eliminar ${ge.article} ${entity.toLowerCase()} ${ge.selected}`);

  setText('documents-view-heading', documents);
  setText('document-form-heading', `Agregar / Editar ${docTerm}`);
  setText('edit-document-heading', `Editar o eliminar ${gd.article} ${docTerm.toLowerCase()}`);
  setText('delete-document', `Eliminar ${gd.article} ${docTerm.toLowerCase()} ${gd.selected}`);
  setText('document-entity-label', `${entity} *`);
  setText('document-submit-button', `Guardar ${docTerm}`);

  setText('search-view-heading', `Buscar ${entities}`);

  // Etiquetas de campos base renombradas por el perfil (p. ej., taxId → RUT).
  for(const target of ['entity', 'document']){
    const form = target === 'entity' ? 'entity-form' : 'document-form';
    for(const [field, text] of Object.entries(config.fieldLabels[target])){
      const inputId = target === 'document' && field === 'paymentTerms' ? 'docPaymentTerms' : field;
      const label = document.querySelector(`#${form} label[for="${inputId}"]`);
      if(!label) continue;
      const required = /\*\s*$/.test(label.textContent);
      label.textContent = `${text}${required ? ' *' : ''}`;
    }
  }
  if(config.sales?.validateRut){
    const label = document.querySelector('#entity-form label[for="taxId"]');
    if(label && !label.textContent.endsWith('*')) label.textContent += ' *';
    $('taxId').placeholder = '12.345.678-5';
  }
}

function showConfigErrors(errors){
  const box = $('config-errors');
  if(!errors || errors.length === 0){ box.hidden = true; box.textContent = ''; return; }
  box.innerHTML = '';
  const title = document.createElement('strong');
  title.textContent = 'La configuración del módulo tiene problemas; se usan valores por defecto donde corresponde:';
  const ul = document.createElement('ul');
  for(const e of errors){
    const li = document.createElement('li');
    li.textContent = e;
    ul.append(li);
  }
  box.append(title, ul);
  box.hidden = false;
}

export function navigate(module, { fresh = false } = {}){
  setActiveModule(module);
  if(module === 'dashboard') refreshDashboard();
  if(module === 'entities'){
    refreshEntitySelector($('entity-id').value);
    if(fresh){ resetEntityForm(); focusEntityForm(); }
  }
  if(module === 'documents'){
    refreshDocumentSelectors($('document-id').value);
    if(fresh){ resetDocumentForm(); focusDocumentForm(); }
  }
  if(module === 'search') runSearch();
}

/**
 * Inicia la aplicación con una configuración ya normalizada: { config, errors }.
 */
export async function initApp({ config, errors = [] } = {}){
  setActiveConfig(config);
  applyAccent(config.theme.accentColor);
  renderLogo($('logo-mark'), config.moduleName);
  applyLabels(config);
  showConfigErrors(errors);

  const onDataChanged = () => {
    refreshDashboard();
    refreshEntitySelector($('entity-id').value);
    refreshDocumentSelectors($('document-id').value);
  };
  initDashboard({ onDataChanged });
  initEntityForm({ onDataChanged });
  initDocumentForm({ onDataChanged });
  initSearch();

  document.querySelectorAll('.nav-module').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.module));
  });
  $('action-new-entity').addEventListener('click', () => navigate('entities', { fresh: true }));
  $('action-new-document').addEventListener('click', () => navigate('documents', { fresh: true }));
  $('action-open-entities').addEventListener('click', () => navigate('entities'));
  $('action-find').addEventListener('click', () => { navigate('search'); focusSearch(); });

  refreshEntitySelector();
  refreshDocumentSelectors();
  resetDocumentForm();
  navigate('dashboard');
}

/** Arranque normal: lee el perfil declarado en `src/module-config.js`. */
export async function boot(){
  await initApp(await loadModuleConfig());
}

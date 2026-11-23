// Orquestador de la aplicación: aplica la configuración, conecta pantallas y navegación.

import { loadModuleConfig, setActiveConfig, labelFor, grammar } from './module-config.js';
import { renderLogo, setActiveModule, applyAccent } from './components/shell.js';
import { initDashboard, refreshDashboard } from './components/dashboard.js';
import { initEntityForm, refreshEntitySelector, resetEntityForm, focusEntityForm, populateEntityForm } from './components/entity-form.js';
import { initDocumentForm, refreshDocumentSelectors, resetDocumentForm, focusDocumentForm, populateDocumentForm, syncSellerOptions } from './components/document-form.js';
import { initSearch, runSearch, focusSearch } from './components/search.js';
import { initTeam, refreshTeam } from './components/team.js';
import { authEnabled, ensureSeedUsers, currentUser, login, logout, touchSession, changeOwnPassword, ROLES, IDLE_MINUTES } from './auth.js';
import { loadEntities, loadDocuments } from './storage.js';

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

  document.title = config.companyName ? `${config.moduleName} · ${config.companyName}` : config.moduleName;
  setText('brand-name', config.companyName ? `${config.companyName} · ${config.moduleName}` : config.moduleName);
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

  // US-20: en Ventas las acciones dicen lo que hacen, ya no las tarjetas genéricas del template.
  if(config.sales){
    setText('action-new-document-title', 'Nueva cotización');
    setText('action-new-entity-title', 'Nuevo cliente');
    setText('action-open-entities-title', 'Ver pedidos');
    setText('action-find-title', 'Buscar cliente o pedido');
    const hints = document.querySelectorAll('.quick-actions .action-hint');
    const texts = ['Registrar una empresa con su RUT', 'Armar un presupuesto con productos e IVA', 'Revisar, avanzar o anular pedidos', 'Por nombre, RUT o código'];
    hints.forEach((h, i) => { h.textContent = texts[i] ?? h.textContent; });
  }
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
  if(module === 'team') refreshTeam();
}

// ---------------------------------------------------------------------------
// Sesión (US-15): pantalla de entrada, usuario arriba, cierre por inactividad
// ---------------------------------------------------------------------------

let idleTimer = null;

function showLogin(message = ''){
  $('login-view').hidden = false;
  $('login-form').hidden = false;
  $('change-password-form').hidden = true;
  document.querySelector('.workspace').hidden = true;
  $('user-box').hidden = true;
  $('login-error').textContent = message;
  $('login-password').value = '';
  $('flash').hidden = true;
}

function showWorkspace(){
  const me = currentUser();
  $('login-view').hidden = true;
  document.querySelector('.workspace').hidden = false;
  $('user-box').hidden = !me;
  if(me){
    setText('user-name', me.name);
    setText('user-role', ROLES[me.role]);
  }
  $('nav-team').hidden = !(me && me.role === 'jefe');
  syncSellerOptions();
  refreshEntitySelector();
  refreshDocumentSelectors();
  resetDocumentForm();
  resetEntityForm();
  navigate('dashboard');
}

function initSession(){
  $('login-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const res = await login($('login-email').value, $('login-password').value);
    if(!res.ok){
      $('login-error').textContent = res.error;
      $('login-password').value = '';
      return;
    }
    $('login-error').textContent = '';
    if(res.mustChangePassword){
      $('login-form').hidden = true;
      $('change-password-form').hidden = false;
      $('new-password').focus?.();
      return;
    }
    showWorkspace();
  });
  $('change-password-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    try {
      await changeOwnPassword($('new-password').value);
      $('new-password').value = '';
      showWorkspace();
    } catch (err){
      $('change-password-error').textContent = err.message;
    }
  });
  $('logout-button').addEventListener('click', () => {
    logout();
    showLogin('Cerraste sesión.');
  });
  // Cualquier uso de la app cuenta como actividad; sin uso por 30 minutos, se vuelve a la entrada.
  for(const type of ['click', 'keydown', 'input']){
    document.addEventListener(type, () => touchSession(), true);
  }
  clearInterval(idleTimer);
  idleTimer = setInterval(() => {
    if(!$('login-view').hidden) return;
    if(!currentUser()) showLogin(`Tu sesión se cerró porque pasaron ${IDLE_MINUTES} minutos sin usar la app.`);
  }, 60e3);
  if(typeof idleTimer === 'object' && idleTimer?.unref) idleTimer.unref();
}

/** Abre un pendiente del panel (US-20, criterio 3). */
function openItem(kind, id){
  if(kind === 'document'){
    const doc = loadDocuments().find(d => d.id === id);
    navigate('documents');
    if(doc){ refreshDocumentSelectors(doc.id); populateDocumentForm(doc); }
  }
  if(kind === 'entity'){
    const ent = loadEntities().find(e => e.id === id);
    navigate('entities');
    if(ent){ refreshEntitySelector(ent.id); populateEntityForm(ent); }
  }
}

/**
 * Inicia la aplicación con una configuración ya normalizada: { config, errors }.
 */
export async function initApp({ config, errors = [] } = {}){
  setActiveConfig(config);
  applyAccent(config.theme.accentColor);
  renderLogo($('logo-mark'), config.moduleName);
  if(config.companyName){
    renderLogo($('logo-mark'), config.companyName);
    renderLogo($('login-logo'), config.companyName);
    setText('login-heading', config.companyName);
  }
  applyLabels(config);
  showConfigErrors(errors);

  const onDataChanged = () => {
    refreshDashboard();
    refreshEntitySelector($('entity-id').value);
    refreshDocumentSelectors($('document-id').value);
  };
  initDashboard({ onDataChanged, onOpenItem: openItem });
  initEntityForm({ onDataChanged });
  initDocumentForm({ onDataChanged });
  initSearch();
  initTeam({ onTeamChanged: () => { syncSellerOptions(); onDataChanged(); } });

  document.querySelectorAll('.nav-module').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.module));
  });
  $('action-new-entity').addEventListener('click', () => navigate('entities', { fresh: true }));
  $('action-new-document').addEventListener('click', () => navigate('documents', { fresh: true }));
  $('action-open-entities').addEventListener('click', () => navigate(config.sales ? 'documents' : 'entities'));
  $('action-find').addEventListener('click', () => { navigate('search'); focusSearch(); });

  if(authEnabled()){
    await ensureSeedUsers();
    initSession();
    if(currentUser()) showWorkspace();
    else showLogin();
    return;
  }

  refreshEntitySelector();
  refreshDocumentSelectors();
  resetDocumentForm();
  navigate('dashboard');
}

/** Arranque normal: lee el perfil declarado en `src/module-config.js`. */
export async function boot(){
  await initApp(await loadModuleConfig());
}

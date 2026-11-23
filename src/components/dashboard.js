// Panel de inicio: acciones rápidas, estadísticas y, en Ventas, indicadores comerciales.

import { getConfig } from '../module-config.js';
import {
  loadEntities, loadDocuments, pendingApprovals, decideApproval, documentNumber,
  clearAll, exportData, importData, currentRole, loadApprovals
} from '../storage.js';
import { currentUser, authEnabled, ROLES } from '../auth.js';
import { salesKpis, monthlySales, movingAverage, linearTrend } from '../sales/sales-logic.js';
import { buildDemoData } from '../sales/demo-data.js';
import { money, percent, today, monthLabel } from './format.js';
import { flash } from './shell.js';

const $ = (id) => document.getElementById(id);

let onChange = () => {};
let onOpen = () => {};

export { currentRole };

export function initDashboard({ onDataChanged, onOpenItem }){
  onChange = onDataChanged || (() => {});
  onOpen = onOpenItem || (() => {});
  const sales = getConfig().sales;
  $('sales-dashboard').hidden = !sales;
  if(!sales) return;

  $('dashboard-lead').textContent = 'Cotiza, confirma pedidos y revisa cómo van las ventas.';

  $('approvals-list').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-decision]');
    if(!btn) return;
    if(currentRole() !== 'jefe') return;
    const comment = document.getElementById(`comment-${btn.dataset.id}`)?.value || '';
    try {
      decideApproval(btn.dataset.id, btn.dataset.decision, 'Jefe/a de ventas', comment);
    } catch (err){
      flash(err.message);
      return;
    }
    flash(btn.dataset.decision === 'aprobado' ? 'Descuento aprobado.' : 'Descuento rechazado. El vendedor/a verá tu comentario en el pedido.');
    onChange();
  });

  $('pending-list').addEventListener('click', (ev) => {
    const item = ev.target.closest('[data-open]');
    if(!item) return;
    onOpen(item.dataset.open, item.dataset.id);
  });

  $('load-demo').addEventListener('click', () => {
    if(getConfig().sales && currentRole() !== 'jefe') return;
    if(loadEntities().length && !confirm('Esto reemplazará los datos actuales por datos ficticios de demostración. ¿Continuar?')) return;
    importData(buildDemoData(getConfig().sales, today()));
    flash('Datos de demostración cargados (todos son ficticios).');
    onChange();
  });
  $('export-data').addEventListener('click', () => {
    if(getConfig().sales && currentRole() !== 'jefe') return;
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ventas-respaldo-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('import-data').addEventListener('change', async () => {
    const file = $('import-data').files[0];
    if(!file || (getConfig().sales && currentRole() !== 'jefe')) return;
    try {
      importData(JSON.parse(await file.text()));
      flash('Datos importados.');
      onChange();
    } catch (err){
      flash(`No se pudo importar: ${err.message}`);
    }
    $('import-data').value = '';
  });
  $('clear-data').addEventListener('click', () => {
    if(getConfig().sales && currentRole() !== 'jefe') return;
    if(!confirm('¿Borrar todos los clientes, pedidos y aprobaciones de este navegador?')) return;
    clearAll();
    flash('Datos borrados.');
    onChange();
  });
}

export function refreshDashboard(){
  $('stat-entities').textContent = String(loadEntities().length);
  $('stat-documents').textContent = String(loadDocuments().length);
  const sales = getConfig().sales;
  if(sales) refreshSales(sales);
}

function refreshSales(sales){
  const docs = loadDocuments();
  const entities = loadEntities();
  const month = today().slice(0, 7);
  const k = salesKpis(docs, entities, sales, month);
  const isBoss = currentRole() === 'jefe';
  renderGreeting(docs, entities, sales, isBoss);

  $('kpi-month-sales').textContent = money(k.monthSales);
  $('kpi-month-orders').textContent = `${k.monthOrders} pedido(s) este mes`;
  $('kpi-open-quotes').textContent = String(k.openQuotes);
  $('kpi-conversion').textContent = percent(k.conversionRate);
  $('kpi-ticket').textContent = money(k.avgTicket);
  $('kpi-discount').textContent = percent(k.avgDiscountPct, 1);
  $('kpi-margin-card').hidden = !isBoss;
  // Respaldo y borrado masivo: solo la jefatura (datos de todos los clientes).
  $('load-demo').hidden = !isBoss;
  $('export-data').hidden = !isBoss;
  $('import-data').closest('label').hidden = !isBoss;
  $('clear-data').hidden = !isBoss;
  $('kpi-margin').textContent = percent(k.marginPct, 1);

  // Aprobaciones pendientes
  const list = $('approvals-list');
  list.innerHTML = '';
  const byId = Object.fromEntries(docs.map(d => [d.id, d]));
  const names = Object.fromEntries(entities.map(e => [e.entity_id, e.name]));
  const pending = pendingApprovals().filter(a => byId[a.sales_order_id]);
  for(const a of pending){
    const d = byId[a.sales_order_id];
    const li = document.createElement('li');
    li.className = 'approval-item';
    const text = document.createElement('span');
    text.textContent = `${documentNumber(d)} · ${names[d.entity_id] ?? '?'} · ${d.vendedor || 'sin vendedor'} · ${a.discount_pct} % · ${money(d.totalAmount)} · "${a.reason}"`;
    li.append(text);
    if(isBoss){
      const comment = document.createElement('input');
      comment.id = `comment-${a.approval_id}`;
      comment.className = 'small-input';
      comment.placeholder = 'Comentario (obligatorio si rechazas)';
      comment.setAttribute('aria-label', `Comentario para ${documentNumber(d)}`);
      li.append(comment);
      const ok = document.createElement('button');
      ok.type = 'button';
      ok.className = 'small';
      ok.dataset.id = a.approval_id;
      ok.dataset.decision = 'aprobado';
      ok.textContent = 'Aprobar';
      const no = document.createElement('button');
      no.type = 'button';
      no.className = 'small secondary';
      no.dataset.id = a.approval_id;
      no.dataset.decision = 'rechazado';
      no.textContent = 'Rechazar';
      li.append(ok, no);
    }
    list.append(li);
  }
  $('approvals-empty').hidden = pending.length > 0;
  $('approvals-empty').textContent = 'No hay solicitudes pendientes.';
  if(pending.length && !isBoss){
    const note = document.createElement('li');
    note.className = 'muted';
    note.textContent = 'Solo el jefe/a de ventas puede aprobar o rechazar.';
    list.append(note);
  }

  // Top clientes
  const top = $('top-customers');
  top.innerHTML = '';
  for(const c of k.topCustomers){
    const li = document.createElement('li');
    li.textContent = `${c.name}: ${money(c.amount)}`;
    top.append(li);
  }
  if(!k.topCustomers.length){
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Aún no hay pedidos confirmados.';
    top.append(li);
  }
  $('pareto-note').textContent = k.paretoShare === null ? '' : `El 20 % de los clientes con más compras concentra el ${percent(k.paretoShare)} de las ventas.`;

  // Motivos de pérdida
  const lost = $('lost-reasons');
  lost.innerHTML = '';
  const entries = Object.entries(k.lostByReason).sort((a, b) => b[1] - a[1]);
  for(const [reason, count] of entries){
    const li = document.createElement('li');
    li.textContent = `${reason}: ${count}`;
    lost.append(li);
  }
  if(!entries.length){
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'No hay cotizaciones perdidas registradas.';
    lost.append(li);
  }

  renderMonthly(docs, sales);
}

function renderMonthly(docs, sales){
  const current = today().slice(0, 7);
  const series = monthlySales(docs, sales.confirmedStatuses).slice(-6);
  const chart = $('monthly-chart');
  chart.innerHTML = '';
  // El mes en curso está incompleto: se muestra, pero no entra en el pronóstico.
  const values = series.filter(s => s.month < current).map(s => s.amount);
  const trend = linearTrend(values);
  const avg = movingAverage(values, 3);
  const forecast = trend ? Math.max(0, trend.next) : null;
  const max = Math.max(1, ...series.map(s => s.amount), forecast ?? 0);
  const bar = (label, amount, extra = '') => {
    const col = document.createElement('div');
    col.className = `bar ${extra}`;
    const fill = document.createElement('span');
    fill.className = 'bar-fill';
    fill.style.height = `${Math.round((amount / max) * 100)}%`;
    fill.title = money(amount);
    const lab = document.createElement('span');
    lab.className = 'bar-label';
    lab.textContent = label;
    col.append(fill, lab);
    chart.append(col);
  };
  series.forEach(s => bar(s.month === current ? `${monthLabel(s.month)}*` : monthLabel(s.month), s.amount, s.month === current ? 'partial' : ''));
  if(forecast !== null) bar('pronóst.', forecast, 'forecast');
  $('forecast-note').textContent = values.length < 2
    ? 'Se necesitan al menos dos meses cerrados con ventas para estimar la tendencia.'
    : `* Mes en curso (parcial). Pronóstico del mes en curso con meses cerrados: ${money(forecast)} (recta de mínimos cuadrados); promedio móvil de 3 meses: ${money(avg)}.`;
}

// ---------------------------------------------------------------------------
// US-20: saludo y "Mis pendientes de hoy"
// ---------------------------------------------------------------------------

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function longDate(iso){
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAY_NAMES[date.getDay()]} ${d} de ${MONTH_NAMES[m - 1]} de ${y}`;
}

function daysBetween(fromIso, toIso){
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 864e5);
}

/** Pendientes del día para quien entró. Función pura para poder probarla. */
export function pendingFor(user, docs, entities, approvals, sales, todayIso){
  const items = [];
  if(!user) return items;
  const names = Object.fromEntries(entities.map(e => [e.entity_id, e.name]));
  const byId = Object.fromEntries(docs.map(d => [d.id, d]));
  if(user.role === 'jefe'){
    for(const a of approvals.filter(x => x.decision === 'pendiente' && byId[x.sales_order_id])){
      const d = byId[a.sales_order_id];
      items.push({ kind: 'document', id: d.id, text: `Aprobar descuento de ${a.discount_pct} % en ${documentNumber(d)} (${names[d.entity_id] ?? '?'}), pedido por ${a.requested_by || 'un vendedor/a'}` });
    }
    return items;
  }
  const mine = docs.filter(d => d.vendedor === user.name);
  for(const d of mine.filter(x => sales.openStatuses.includes(x.status) && x.endDate)){
    const left = daysBetween(todayIso, d.endDate);
    if(left < 0) items.push({ kind: 'document', id: d.id, text: `${documentNumber(d)} (${names[d.entity_id] ?? '?'}) venció hace ${-left} día(s)` });
    else if(left <= 3) items.push({ kind: 'document', id: d.id, text: `${documentNumber(d)} (${names[d.entity_id] ?? '?'}) vence ${left === 0 ? 'hoy' : `en ${left} día(s)`}` });
  }
  for(const e of entities.filter(x => x.ejecutivo === user.name && x.targetDate && x.targetDate <= todayIso)){
    items.push({ kind: 'entity', id: e.id, text: `Contactar a ${e.name}${e.targetDate < todayIso ? ` (atrasado desde el ${e.targetDate})` : ' (hoy)'}` });
  }
  const myIds = new Set(mine.map(d => d.id));
  const latest = {};
  for(const a of approvals.filter(x => myIds.has(x.sales_order_id))) latest[a.sales_order_id] = a;
  for(const a of Object.values(latest)){
    const d = byId[a.sales_order_id];
    if(a.decision === 'pendiente') items.push({ kind: 'document', id: d.id, text: `Descuento de ${a.discount_pct} % en ${documentNumber(d)} esperando al jefe/a` });
    if(a.decision === 'rechazado') items.push({ kind: 'document', id: d.id, text: `Descuento rechazado en ${documentNumber(d)}${a.decision_comment ? `: "${a.decision_comment}"` : ''}` });
  }
  return items;
}

function renderGreeting(docs, entities, sales, isBoss){
  const user = authEnabled() ? currentUser() : null;
  const box = $('my-pending');
  if(!user){ box.hidden = true; return; }
  const first = user.name.split(' ')[0];
  $('dashboard-heading').textContent = `Hola, ${first}`;
  $('dashboard-lead').textContent = `Hoy es ${longDate(today())}. Entraste como ${ROLES[user.role].toLowerCase()}.`;
  $('pending-heading').textContent = isBoss ? 'Por revisar hoy' : 'Mis pendientes de hoy';
  const items = pendingFor(user, docs, entities, loadApprovals(), sales, today());
  const list = $('pending-list');
  list.innerHTML = '';
  if(isBoss){
    const month = today().slice(0, 7);
    const [y, m] = month.split('-').map(Number);
    const prev = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}`;
    const cur = salesKpis(docs, entities, sales, month).monthSales;
    const before = salesKpis(docs, entities, sales, prev).monthSales;
    const li = document.createElement('li');
    li.className = 'pending-summary';
    const diff = before ? ` (${cur >= before ? '+' : ''}${Math.round((cur - before) / before * 100)} % vs. mes pasado: ${money(before)})` : '';
    li.textContent = `Ventas del mes: ${money(cur)}${diff}`;
    list.append(li);
  }
  for(const it of items){
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'link-button';
    btn.dataset.open = it.kind;
    btn.dataset.id = it.id;
    btn.textContent = it.text;
    li.append(btn);
    list.append(li);
  }
  $('pending-empty').hidden = items.length > 0;
  box.hidden = false;
}

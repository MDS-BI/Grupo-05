// Panel de inicio: acciones rápidas, estadísticas y, en Ventas, indicadores comerciales.

import { getConfig } from '../module-config.js';
import {
  loadEntities, loadDocuments, pendingApprovals, decideApproval, documentNumber,
  clearAll, exportData, importData, currentRole, ROLE_KEY
} from '../storage.js';
import { salesKpis, monthlySales, movingAverage, linearTrend } from '../sales/sales-logic.js';
import { buildDemoData } from '../sales/demo-data.js';
import { money, percent, today, monthLabel } from './format.js';
import { flash } from './shell.js';

const $ = (id) => document.getElementById(id);

let onChange = () => {};

export { currentRole };

export function initDashboard({ onDataChanged }){
  onChange = onDataChanged || (() => {});
  const sales = getConfig().sales;
  $('sales-dashboard').hidden = !sales;
  $('role-switch').hidden = !sales;
  if(!sales) return;

  $('dashboard-lead').textContent = 'Cotiza, confirma pedidos y revisa cómo van las ventas.';
  $('role-select').value = currentRole();
  $('role-select').addEventListener('change', () => {
    localStorage.setItem(ROLE_KEY, $('role-select').value);
    refreshDashboard();
  });

  $('approvals-list').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-decision]');
    if(!btn) return;
    if(currentRole() !== 'jefe') return;
    decideApproval(btn.dataset.id, btn.dataset.decision, 'Jefe/a de ventas');
    flash(btn.dataset.decision === 'aprobado' ? 'Descuento aprobado.' : 'Descuento rechazado.');
    onChange();
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
    note.textContent = 'Solo el perfil Jefe/a de ventas puede aprobar o rechazar.';
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

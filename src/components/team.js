// Pantalla "Equipo" (US-17): el jefe/a crea, desactiva y reactiva cuentas, y restablece contraseñas.

import { loadUsers, publicUser, createUser, setUserActive, resetPassword, isBoss, currentUser, ROLES } from '../auth.js';
import { flash } from './shell.js';

const $ = (id) => document.getElementById(id);
let onChange = () => {};

function formatDateTime(iso){
  if(!iso) return 'Nunca';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function initTeam({ onTeamChanged } = {}){
  onChange = onTeamChanged || (() => {});

  $('team-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    for(const k of ['name', 'email', 'role', 'password']) $(`error-team-${k}`).textContent = '';
    try {
      const u = await createUser({
        name: $('team-name').value,
        email: $('team-email').value,
        role: $('team-role').value,
        password: $('team-password').value
      });
      $('team-form').reset();
      flash(`Cuenta creada para ${u.name}. Al entrar por primera vez tendrá que cambiar su contraseña.`);
      refreshTeam();
      onChange();
    } catch (err){
      const fields = err.fieldErrors || { name: err.message };
      for(const [k, msg] of Object.entries(fields)){
        const el = $(`error-team-${k}`);
        if(el) el.textContent = msg;
      }
    }
  });

  $('team-body').addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-action]');
    if(!btn) return;
    $('team-message').textContent = '';
    const id = btn.dataset.id;
    try {
      if(btn.dataset.action === 'toggle'){
        const u = setUserActive(id, btn.dataset.active !== 'true');
        flash(u.active ? `Cuenta de ${u.name} reactivada.` : `Cuenta de ${u.name} desactivada. Sus clientes y pedidos se mantienen.`);
      }
      if(btn.dataset.action === 'reset'){
        const input = $(`reset-${id}`);
        const u = await resetPassword(id, input.value);
        flash(`Contraseña de ${u.name} restablecida. Tendrá que cambiarla al entrar.`);
      }
      refreshTeam();
      onChange();
    } catch (err){
      $('team-message').textContent = err.message;
    }
  });
}

export function refreshTeam(){
  const body = $('team-body');
  if(!body) return;
  body.innerHTML = '';
  if(!isBoss()) return;
  const me = currentUser();
  for(const u of loadUsers().map(publicUser)){
    const tr = document.createElement('tr');
    if(!u.active) tr.className = 'inactive';
    const cells = [u.name + (me && me.user_id === u.user_id ? ' (tú)' : ''), u.email, ROLES[u.role] || u.role,
      u.active ? (u.must_change_password ? 'Activa · debe cambiar contraseña' : 'Activa') : 'Desactivada',
      formatDateTime(u.last_login_at)];
    for(const text of cells){
      const td = document.createElement('td');
      td.textContent = text;
      tr.append(td);
    }
    const actions = document.createElement('td');
    actions.className = 'team-actions';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = u.active ? 'small danger-link' : 'small secondary';
    toggle.dataset.action = 'toggle';
    toggle.dataset.id = u.user_id;
    toggle.dataset.active = String(u.active);
    toggle.textContent = u.active ? 'Desactivar' : 'Reactivar';
    const reset = document.createElement('input');
    reset.id = `reset-${u.user_id}`;
    reset.placeholder = 'Contraseña temporal';
    reset.setAttribute('aria-label', `Contraseña temporal para ${u.name}`);
    reset.className = 'small-input';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'small secondary';
    resetBtn.dataset.action = 'reset';
    resetBtn.dataset.id = u.user_id;
    resetBtn.textContent = 'Restablecer';
    actions.append(toggle, reset, resetBtn);
    tr.append(actions);
    body.append(tr);
  }
}

// Marco del espacio de trabajo: barra superior con logotipo, barra lateral y módulo activo.

export function monogram(name){
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if(words.length === 0) return 'ERP';
  if(words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function renderLogo(container, name){
  const letters = monogram(name);
  container.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 40 40');
  svg.setAttribute('width', '32');
  svg.setAttribute('height', '32');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Logotipo de ${name}`);
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('width', '40');
  rect.setAttribute('height', '40');
  rect.setAttribute('rx', '9');
  rect.setAttribute('fill', 'var(--accent)');
  const text = document.createElementNS(ns, 'text');
  text.setAttribute('x', '20');
  text.setAttribute('y', '26');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', letters.length > 2 ? '13' : '16');
  text.setAttribute('font-weight', '700');
  text.setAttribute('fill', '#ffffff');
  text.textContent = letters;
  svg.append(rect, text);
  container.append(svg);
}

export function setActiveModule(module){
  document.querySelectorAll('.nav-module').forEach(btn => {
    if(btn.dataset.module === module) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
  document.querySelectorAll('.view').forEach(view => {
    view.hidden = view.id !== `view-${module}`;
  });
}

export function applyAccent(color){
  document.documentElement.style.setProperty('--accent', color);
}

let flashTimer = null;
export function flash(message){
  const el = document.getElementById('flash');
  if(!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { el.hidden = true; }, 3500);
}

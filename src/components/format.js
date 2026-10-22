// Formatos de presentación (moneda chilena, porcentajes, fechas).

export function money(value){
  const n = Math.round(Number(value) || 0);
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function percent(ratio, digits = 0){
  if(ratio === null || ratio === undefined || !Number.isFinite(ratio)) return '—';
  return `${(ratio * 100).toFixed(digits).replace('.', ',')} %`;
}

export function today(){
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(dateStr, days){
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function monthLabel(key){
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
}

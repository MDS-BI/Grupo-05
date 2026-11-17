// Permisos por rol (US-16). Funciones puras: reciben el usuario con sesión
// abierta ({ name, role }) y responden qué puede ver o hacer. No leen nada del
// navegador, así se pueden probar solas y usarse tanto en la interfaz (esconder
// botones) como en el almacenamiento (rechazar la acción aunque la llamen desde
// la consola).

export const ROLES = Object.freeze({ VENDEDOR: 'vendedor', JEFE: 'jefe' });

/** Acciones que solo puede hacer el jefe/a de ventas. */
export const BOSS_ONLY = Object.freeze([
  'decidir-descuento', // aprobar o rechazar descuentos sobre el umbral (US-04)
  'ver-margen',        // margen bruto y costo estándar (dato sensible, principio V)
  'cambiar-credito',   // límite de crédito del cliente (DR-01)
  'borrar-datos',      // "Borrar todos los datos"
  'importar-datos',
  'exportar-datos',
  'cargar-demo'
]);

const MESSAGES = {
  'decidir-descuento': 'Solo el jefe/a de ventas puede aprobar o rechazar descuentos.',
  'ver-margen': 'Solo el jefe/a de ventas puede ver costos y márgenes.',
  'cambiar-credito': 'Solo el jefe/a de ventas puede cambiar el límite de crédito.',
  'borrar-datos': 'Solo el jefe/a de ventas puede borrar todos los datos.',
  'importar-datos': 'Solo el jefe/a de ventas puede importar datos.',
  'exportar-datos': 'Solo el jefe/a de ventas puede exportar datos.',
  'cargar-demo': 'Solo el jefe/a de ventas puede cargar los datos de demostración.'
};

export function isBoss(user){
  return Boolean(user) && user.role === ROLES.JEFE;
}

/** ¿El usuario puede hacer esta acción? Sin sesión no puede nada. */
export function can(user, action){
  if(!user || !user.role) return false;
  if(isBoss(user)) return true;
  return !BOSS_ONLY.includes(action);
}

/** Lanza un error con un mensaje claro si el usuario no puede hacer la acción. */
export function assertCan(user, action){
  if(!can(user, action)) throw new Error(MESSAGES[action] || 'No tienes permiso para hacer esto.');
}

/**
 * ¿El usuario puede editar este documento? El jefe/a edita todos; un vendedor/a
 * solo los suyos (criterio 4 de US-16). Un documento sin vendedor asignado lo
 * puede tomar cualquiera.
 */
export function canEditDocument(user, doc){
  if(!user || !user.role) return false;
  if(isBoss(user)) return true;
  if(!doc || !doc.vendedor) return true;
  return doc.vendedor === user.name;
}

/** Ordena los documentos dejando primero los del usuario (criterio 4), sin perder el orden original. */
export function ownFirst(docs, user){
  if(!user || !user.name) return [...docs];
  const mine = docs.filter(d => d.vendedor === user.name);
  const others = docs.filter(d => d.vendedor !== user.name);
  return [...mine, ...others];
}

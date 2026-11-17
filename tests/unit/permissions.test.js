import { describe, it, expect } from 'vitest';
import { can, assertCan, canEditDocument, ownFirst, isBoss, BOSS_ONLY } from '../../src/auth/permissions.js';

const jefa = { name: 'Andrea Vidal', role: 'jefe' };
const camila = { name: 'Camila Rojas', role: 'vendedor' };

describe('US-16: permisos por rol', () => {
  it('el jefe/a puede hacer todo', () => {
    expect(isBoss(jefa)).toBe(true);
    for(const action of BOSS_ONLY) expect(can(jefa, action)).toBe(true);
  });

  it('un vendedor/a no puede hacer lo que es solo de jefatura', () => {
    for(const action of BOSS_ONLY) expect(can(camila, action)).toBe(false);
    expect(can(camila, 'crear-cotizacion')).toBe(true);
  });

  it('sin sesión no se puede hacer nada', () => {
    expect(can(null, 'crear-cotizacion')).toBe(false);
    expect(can({ name: 'X' }, 'crear-cotizacion')).toBe(false);
    expect(canEditDocument(null, { vendedor: 'Camila Rojas' })).toBe(false);
  });

  it('assertCan explica por qué no se puede', () => {
    expect(() => assertCan(camila, 'decidir-descuento')).toThrow(/Solo el jefe\/a de ventas puede aprobar o rechazar/);
    expect(() => assertCan(camila, 'borrar-datos')).toThrow(/borrar todos los datos/);
    expect(() => assertCan(jefa, 'decidir-descuento')).not.toThrow();
  });

  it('un vendedor/a edita solo sus documentos; el jefe/a, todos', () => {
    expect(canEditDocument(camila, { vendedor: 'Camila Rojas' })).toBe(true);
    expect(canEditDocument(camila, { vendedor: 'Diego Muñoz' })).toBe(false);
    expect(canEditDocument(camila, { vendedor: '' })).toBe(true);
    expect(canEditDocument(jefa, { vendedor: 'Diego Muñoz' })).toBe(true);
  });

  it('muestra primero los documentos propios sin cambiar el orden de los demás', () => {
    const docs = [{ id: 1, vendedor: 'Diego Muñoz' }, { id: 2, vendedor: 'Camila Rojas' }, { id: 3, vendedor: 'Valentina Soto' }, { id: 4, vendedor: 'Camila Rojas' }];
    expect(ownFirst(docs, camila).map(d => d.id)).toEqual([2, 4, 1, 3]);
    expect(ownFirst(docs, null).map(d => d.id)).toEqual([1, 2, 3, 4]);
  });
});

Feedback Avance (26/10/26)

- excelente trabajo, solo seguir con los proximos pasos. Borrar plan.md de la raiz del repo.

Proximos pasos:
 
- rectificar puntos anteriores 
- trabajar en los specs (historias de usuario, US) para definir tareas
- dividirse las US y tareas para una siguiente iteracion (avances cada semana)
- ejecutar una version integrada de prueba

 Feedback Avance 02 (2/11/26)

- Excelente avance, revisado el modulo en local, operativamente no hay errores. Proponer modificaciones/incremental para proxima iteracion
- Buena actividad del grupo por US

Proximos pasos:

- registar modificaciones/incremental y volver al spec
- dividir el grupo entre modificaciones (ajustes previos) e incremental (nueva funcionalidad)
- integrar nueva version en 2 semanas

Feedback Avance 03 (16/11/26)

Cambios en la especificación:

- spec.md agrega la iteración 2: modificaciones M-01 a M-06 con criterios de aceptación, equipos y parejas de revisión. US-09, US-10 y US-12 pasan a "En curso", y US-11, US-13 y US-14 a la iteración 3.
- tasks.md agrega las fases 12 a 14 (T053-T078) y marca T043. Las tareas citan M-xx y US, así que spec y tasks son coherentes.

Consistencia sitio–especificación:

- Ninguna tarea T053-T078 está marcada y el código lo confirma: `ventas.js` mantiene la lista de precios fija y sin "Cotización vencida" (T064, T070), y `storage.js` no guarda historial de estados (T073) ni comentario de rechazo (T057). `search.js` no busca por folio ni abre pedidos (T061-T062).
- M-01, M-02, M-04 y M-06 (T053, T054, T058, T060) viven en `document-form.js` y `styles.css`, que no se incluyeron: no verificable.
- `docs/historias-de-usuario/US-20-panel-de-inicio.md` habla de una US-20 que no existe en spec.md (llega hasta US-14).
- hacer mejoras de funcionalidad e interfaz de usuario, incluir data simulada para probar campos, incluir mejoras de estilo, transicion, navegacion, etcetera.

Presentacion de MVP final en 2 semanas.

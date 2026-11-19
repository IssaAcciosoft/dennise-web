// @ts-check
/**
 * Lógica pura de la integración con AccioGest, en .mjs para poder probarla con `npm test`
 * (node --test, sin compilar TypeScript). La usan src/lib/services.ts y BookingSlot.astro.
 */

/**
 * ¿Está despublicado en AccioGest un id enlazado? Solo si HAY catálogo (nuevo o última copia
 * buena) y el id no está en él. Sin catálogo (la ruta /catalogo no existe y responde 404:
 * WEB-INTEGRACION 12-11 §4) no se marca ningún id: el widget conserva su `service`.
 * @param {{ servicios: { id: string }[] } | null | undefined} catalog
 * @returns {(id: string | null) => boolean}
 */
export function unpublishedIn(catalog) {
  const ids = new Set((catalog?.servicios ?? []).map((s) => s.id));
  return (id) => Boolean(catalog) && id !== null && !ids.has(id);
}

/**
 * Dirección de /gracias/ tras una reserva: `&cita=<id>` solo si `citaId` es un entero positivo
 * (llega como número, WEB-INTEGRACION 12-11 §4; se acepta también texto de dígitos).
 * @param {string} thanks p. ej. «/gracias/?tipo=reserva»
 * @param {unknown} citaId
 * @returns {string}
 */
export function bookingThanksUrl(thanks, citaId) {
  const cita =
    typeof citaId === 'number' && Number.isSafeInteger(citaId) && citaId > 0
      ? String(citaId)
      : typeof citaId === 'string' && /^\d{1,18}$/.test(citaId) && /[1-9]/.test(citaId)
        ? citaId
        : '';
  return cita ? `${thanks}&cita=${encodeURIComponent(cita)}` : thanks;
}

/**
 * Cambia de servicio el widget ya cargado con window.AccioGestBooking.setService(id), sin volver
 * a cargar el script (WEB-INTEGRACION 12-11 §4; '' → null = sin servicio elegido).
 * Devuelve false si el script no lo expone (versión vieja en caché): entonces se usa el
 * respaldo de quitar y volver a inyectar el script.
 * @param {{ setService?: unknown } | null | undefined} api window.AccioGestBooking
 * @param {string | null} service
 * @returns {boolean}
 */
export function setServiceInPlace(api, service) {
  if (!api || typeof api.setService !== 'function') return false;
  api.setService(service || null);
  return true;
}

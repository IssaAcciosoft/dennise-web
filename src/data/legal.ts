/**
 * Textos legales compartidos entre los formularios y las páginas legales.
 * Los textos EXACTOS de las casillas de consentimiento están en src/data/consent.ts (los que
 * AccioGest guarda como prueba del consentimiento, handoff 19-11-2026 §2); la política de
 * privacidad (§2) los cita desde allí. Desde el handoff del 19-11 ya no se envía la versión de
 * la política: se guarda el texto de la casilla y la fecha del envío.
 */
import type { FormKey } from '~/config/acciogest';

export { CONSENT_TEXT } from './consent';

/** Nombre visible de cada formulario (política de privacidad). */
export const FORM_NAMES: Record<FormKey, string> = {
  historia: 'Formulario «Cuéntame tu historia» (Empoderando Voces)',
  servicio: 'Formulario «Solicitar información» (servicios y citas)',
  contacto: 'Formulario de contacto',
};

/**
 * Datos identificativos de la titular (LSSI art. 10 / RGPD art. 13), confirmados el 02/10/2026.
 * ⚠️ El nombre completo (holder) y el NIE se muestran SOLO en las páginas legales (aviso legal, privacidad y condiciones):
 * nunca en JSON-LD, en el pie ni en el resto de la web. Importar solo desde esas páginas.
 */
export const LEGAL_ID = {
  holder: 'Denisse Elena González Barbosa',
  nie: 'Z1195681P',
  tradeName: 'DG Gestores y Abogados',
} as const;

/**
 * Proveedor de alojamiento web (política de privacidad, apartado 5). El alojamiento aún no está
 * decidido (revisión legal de AccioGest, 24-11-2026). Mientras `name` esté vacío se muestra el
 * marcador {ALOJAMIENTO} y `npm run check:publish` falla: no se publica con el marcador.
 */
export const HOSTING: { name: string; country: string } = { name: 'Netlify, Inc.', country: 'Estados Unidos' };
export const HOSTING_PLACEHOLDER = '{ALOJAMIENTO}';
export const HOSTING_LABEL = HOSTING.name ? `${HOSTING.name}${HOSTING.country ? ` (${HOSTING.country})` : ''}` : HOSTING_PLACEHOLDER;

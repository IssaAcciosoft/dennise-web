/**
 * Textos legales compartidos entre los formularios y la política de privacidad.
 * El texto de cada casilla de consentimiento DEBE coincidir con las finalidades descritas en
 * /politica-privacidad/ (§3), que los muestra desde aquí. Versión: POLICY_VERSION
 * (src/config/acciogest.ts), que se envía con cada formulario como «Versión política».
 */
import type { FormKey } from '~/config/acciogest';

/** Va detrás de «He leído y acepto la política de privacidad y…». */
export const CONSENT: Record<FormKey, string> = {
  historia:
    'consiento expresamente el tratamiento de los datos de mi historia, incluidos los datos sensibles que decida incluir, para que Denisse González pueda leerla, contactarme y, solo si lo he indicado, compartirla públicamente.',
  servicio:
    'consiento el tratamiento de mis datos para que Denisse González atienda mi solicitud de información sobre el servicio elegido y se ponga en contacto conmigo.',
  contacto:
    'consiento el tratamiento de mis datos para que Denisse González responda a mi mensaje y se ponga en contacto conmigo.',
};

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

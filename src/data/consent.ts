/**
 * ============================================================================
 *  Textos EXACTOS de las casillas de consentimiento (handoff de AccioGest, 19-11-2026, §2)
 * ============================================================================
 *  AccioGest guarda el VALOR de cada casilla como prueba del consentimiento: el valor que se
 *  envía en `response_data` es este texto plano, carácter a carácter (sin el enlace). En la web
 *  se muestra el mismo texto con el enlace en «política de privacidad» (→ /politica-privacidad/):
 *  ver `linkParts()`.
 *
 *  NO editar sin que AccioGest / la revisión legal lo pidan. Sin datos personales de la titular:
 *  este módulo va también en el JS del cliente (src/scripts/acciogest.ts).
 *
 *  Los planes de Autogestión DG (pago único) NO llevan casillas en la web: las casillas, incluida
 *  «Desistimiento», están en la página de pago de cada plan en AccioGest (respuesta del 23-11-2026).
 * ============================================================================
 */
import type { FormKey } from '~/config/acciogest';

/** Casilla «Consentimiento RGPD» de los formularios de leads (servicio, historia, contacto). */
export const CONSENT_TEXT: Record<FormKey, string> = {
  servicio:
    'He leído y acepto la política de privacidad y consiento el tratamiento de mis datos para que Denisse González atienda mi solicitud de información sobre el servicio elegido y se ponga en contacto conmigo',
  historia:
    'He leído y acepto la política de privacidad y consiento expresamente el tratamiento de los datos de mi historia, incluidos los datos sensibles que decida incluir, para que Denisse González pueda leerla, contactarme y, solo si lo he indicado, compartirla públicamente',
  contacto:
    'He leído y acepto la política de privacidad y consiento el tratamiento de mis datos para que Denisse González responda a mi mensaje y se ponga en contacto conmigo',
};

/** Frases que llevan enlace dentro de las casillas. */
export const LINK_PHRASES = {
  privacy: 'política de privacidad',
} as const;

/**
 * Parte un texto en [antes, frase, después] por la PRIMERA aparición de `phrase` (para pintar
 * la frase como enlace sin cambiar ni un carácter del texto). Sin la frase: [texto, '', ''].
 */
export function linkParts(text: string, phrase: string): [string, string, string] {
  const i = text.indexOf(phrase);
  if (i < 0) return [text, '', ''];
  return [text.slice(0, i), phrase, text.slice(i + phrase.length)];
}

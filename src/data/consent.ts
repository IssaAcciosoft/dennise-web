/**
 * ============================================================================
 *  Textos EXACTOS de las casillas de consentimiento (handoff de AccioGest, 19-11-2026, §2)
 * ============================================================================
 *  AccioGest guarda el VALOR de cada casilla como prueba del consentimiento: el valor que se
 *  envía en `response_data` es este texto plano, carácter a carácter (sin el enlace). En la web
 *  se muestra el mismo texto con enlaces en «política de privacidad» (→ /politica-privacidad/) y
 *  «condiciones de contratación» (→ /condiciones-contratacion/): ver `linkParts()`.
 *
 *  NO editar sin que AccioGest / la revisión legal lo pidan. Sin datos personales de la titular:
 *  este módulo va también en el JS del cliente (src/scripts/acciogest.ts y plan-checkout.ts).
 * ============================================================================
 */
import type { FormKey, PlanKey } from '~/config/acciogest';

/** Casilla «Consentimiento RGPD» de los formularios de leads (servicio, historia, contacto). */
export const CONSENT_TEXT: Record<FormKey, string> = {
  servicio:
    'He leído y acepto la política de privacidad y consiento el tratamiento de mis datos para que Denisse González atienda mi solicitud de información sobre el servicio elegido y se ponga en contacto conmigo',
  historia:
    'He leído y acepto la política de privacidad y consiento expresamente el tratamiento de los datos de mi historia, incluidos los datos sensibles que decida incluir, para que Denisse González pueda leerla, contactarme y, solo si lo he indicado, compartirla públicamente',
  contacto:
    'He leído y acepto la política de privacidad y consiento el tratamiento de mis datos para que Denisse González responda a mi mensaje y se ponga en contacto conmigo',
};

/** Casilla «Consentimiento RGPD» del diálogo de contratación de un plan. */
export const PLAN_PRIVACY_TEXT = 'He leído la política de privacidad';

/** Importe de la cuota tal y como va en la casilla: 242 → «242», 315.5 → «315,50». */
export const feeAmount = (amount: number): string =>
  Number.isInteger(amount)
    ? String(amount)
    : amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Nombre de cada plan TAL Y COMO va en la casilla «Desistimiento» (handoff §2: «Básico 242 €,
 * Estándar 315 €, Premium 425 €»). Fijo a propósito: NO se toma del `nombre` del catálogo de
 * AccioGest, para que un cambio de nombre allí no cambie en silencio el texto que se guarda como
 * prueba del consentimiento. Cambiarlo solo si AccioGest / la revisión legal lo piden.
 */
export const PLAN_LEGAL_NAME: Record<PlanKey, string> = {
  basico: 'Plan Básico',
  estandar: 'Plan Estándar',
  premium: 'Plan Premium',
};

/**
 * Casilla «Desistimiento» del diálogo de contratación: un texto por plan (nombre de
 * PLAN_LEGAL_NAME e importe del catálogo, p. ej. «Plan Básico» y 242). Texto del handoff, sin
 * cambiar nada más.
 * PENDIENTE (revisión legal): «servicio completamente prestado» y el cálculo de la «parte
 * proporcional» no están definidos en la web; no inventarlos aquí.
 */
export const planDesistimientoText = (planName: string, amount: number): string =>
  `Contrato el ${planName}: cuota de ${feeAmount(amount)} € al mes (IVA incluido), que se cobra con tarjeta cada mes hasta que me dé de baja. Pido que el servicio empiece ya, sin esperar a que pasen los 14 días en que puedo desistir. Sé que, si desisto antes de que el servicio esté completamente prestado, pagaré la parte proporcional de lo ya prestado hasta ese momento, y que perderé el derecho a desistir cuando esté completamente prestado. Acepto las condiciones de contratación`;

/** Frases que llevan enlace dentro de las casillas. */
export const LINK_PHRASES = {
  privacy: 'política de privacidad',
  terms: 'condiciones de contratación',
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

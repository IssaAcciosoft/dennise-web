/**
 * ============================================================================
 *  Configuración de la integración con AccioGest (docs/integracion-acciogest.md)
 * ============================================================================
 *  ÚNICO sitio donde se ponen los IDs. Mientras un ID tenga su valor de ejemplo
 *  (FORM_ID_… / PLUGIN_ID), esa pieza funciona en MODO SIMULADO:
 *    - formularios: se simula la respuesta de la API (no se envía nada) y se avisa;
 *    - planes: el diálogo de contratación simula create-checkout-session (no se cobra nada) y
 *      lleva a /gracias/?tipo=plan&…&pago=ok&response_id=mock;
 *    - reservas: se muestra un panel con «Solicitar cita» y WhatsApp.
 *  Al poner los IDs reales, pasa a producción sin tocar nada más.
 *
 *  Dos formas de poner los IDs:
 *    1. Editar los valores de ejemplo de este archivo, o
 *    2. Variables de entorno al compilar (tienen prioridad), p. ej. en GitHub → Settings →
 *       Secrets and variables → Actions → Variables (ver README → AccioGest):
 *         PUBLIC_ACCIOGEST_API                  (por defecto https://api.acciogest.com)
 *         PUBLIC_ACCIOGEST_FORM_SERVICIO        PUBLIC_ACCIOGEST_FORM_HISTORIA
 *         PUBLIC_ACCIOGEST_FORM_CONTACTO
 *         PUBLIC_ACCIOGEST_PLAN_BASICO          PUBLIC_ACCIOGEST_PLAN_ESTANDAR
 *         PUBLIC_ACCIOGEST_PLAN_PREMIUM         PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID
 *         PUBLIC_STRIPE_PORTAL_URL              (portal de cliente de Stripe de Denisse:
 *                                                https://billing.stripe.com/p/login/…)
 *         PUBLIC_ACCIOGEST_WIDGET_ORIGINS       (opcional, orígenes extra del iframe de reservas)
 *  Todos los IDs son números enteros (el del plugin es su id, no el token). Se leen AL COMPILAR:
 *  tras cambiarlos en Netlify, «Clear cache and deploy site».
 *  Son IDs públicos (van en el HTML/JS de la web): no son secretos.
 *  (La URL del build hook de Netlify SÍ es secreta y nunca va aquí: README → AccioGest.)
 * ============================================================================
 */
import { PHONE } from '~/data/site';

/** Valor de una variable PUBLIC_* (o el de ejemplo si no está definida o está vacía). */
const pick = (value: string | undefined, fallback: string): string => (value && value.trim()) || fallback;

export const ACCIOGEST_API = pick(import.meta.env.PUBLIC_ACCIOGEST_API, 'https://api.acciogest.com').replace(/\/+$/, '');

/** Formularios de leads (form-builder público de AccioGest). */
export const FORMS = {
  servicio: pick(import.meta.env.PUBLIC_ACCIOGEST_FORM_SERVICIO, 'FORM_ID_SERVICIO'),
  historia: pick(import.meta.env.PUBLIC_ACCIOGEST_FORM_HISTORIA, 'FORM_ID_HISTORIA'),
  contacto: pick(import.meta.env.PUBLIC_ACCIOGEST_FORM_CONTACTO, 'FORM_ID_CONTACTO'),
} as const;

/**
 * Planes de Autogestión DG (/autogestion-dg/), cuota mensual (handoff 19-11-2026 §3): id del
 * formulario de cada plan en AccioGest. El diálogo de contratación (PlanCheckoutDialog.astro +
 * src/scripts/plan-checkout.ts) hace POST {API}/form-builder/public/{id}/create-checkout-session
 * y lleva a la página de pago de Stripe que devuelve AccioGest.
 */
export const PLANES = {
  basico: pick(import.meta.env.PUBLIC_ACCIOGEST_PLAN_BASICO, 'FORM_ID_BASICO'),
  estandar: pick(import.meta.env.PUBLIC_ACCIOGEST_PLAN_ESTANDAR, 'FORM_ID_ESTANDAR'),
  premium: pick(import.meta.env.PUBLIC_ACCIOGEST_PLAN_PREMIUM, 'FORM_ID_PREMIUM'),
} as const;

/** Widget de reservas (iframe con servicio, día y hora, modalidad, datos, RGPD y pago). */
export const BOOKING_PLUGIN_ID = pick(import.meta.env.PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID, 'PLUGIN_ID');

export type FormKey = keyof typeof FORMS;
export type PlanKey = keyof typeof PLANES;

/**
 * Etiquetas EXACTAS de los campos en AccioGest (claves de `response_data`), por formulario.
 * Clave = nombre interno del campo en el HTML (atributo name) · valor = etiqueta en AccioGest.
 * Si AccioGest cambia una etiqueta, se cambia solo aquí. Compruébalas con ?acciogest_debug=1.
 */
// Desde el handoff del 19-11-2026: «Consentimiento RGPD» lleva como valor el TEXTO de la
// casilla (src/data/consent.ts), ya no se envía «Versión política» y los utm_* van en la raíz
// del cuerpo, no dentro de response_data.
const COMMON = {
  consentimiento: 'Consentimiento RGPD',
} as const;

export const FIELD_LABELS = {
  servicio: {
    nombre: 'Nombre',
    email: 'Email',
    telefono: 'Teléfono',
    servicio: 'Servicio',
    mensaje: 'Mensaje',
    ...COMMON,
  },
  historia: {
    nombre: 'Nombre',
    email: 'Email',
    telefono: 'Teléfono',
    pais: 'País',
    tema: 'Tema',
    historia: 'Historia',
    compartir: 'Compartir públicamente',
    anonimato: 'Anonimato',
    contacto: 'Cómo contactarte',
    instagram: 'Instagram',
    ...COMMON,
  },
  contacto: {
    nombre: 'Nombre',
    email: 'Email',
    telefono: 'Teléfono',
    mensaje: 'Mensaje',
    ...COMMON,
  },
} as const satisfies Record<FormKey, Record<string, string>>;

/**
 * Diálogo de contratación de un plan: etiquetas EXACTAS de `response_data` (handoff §2).
 * Clave = name del campo en el HTML · valor = etiqueta en AccioGest.
 */
export const PLAN_FIELD_LABELS = {
  nombre: 'Nombre',
  email: 'Email',
  telefono: 'Teléfono',
  rgpd: 'Consentimiento RGPD',
  desistimiento: 'Desistimiento',
} as const;

/**
 * Versión de la política de privacidad. Desde el handoff del 19-11-2026 YA NO se envía con los
 * formularios (se guarda el texto de la casilla y la fecha): solo la muestra la página
 * /politica-privacidad/. Cambiarla aquí al publicar una política nueva.
 */
export const POLICY_VERSION = '2026-11';

/** UTM que se envían con cada lead y cada contratación, en la RAÍZ del cuerpo (de la URL de
 *  llegada; se guardan para toda la visita). */
export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;
/** Clave en sessionStorage (la usan BaseLayout y src/scripts/acciogest.ts). */
export const UTM_STORAGE_KEY = 'dg:utm';

/** Número para la alternativa por WhatsApp (sin «+»), desde src/data/site.ts. */
export const WHATSAPP_NUMBER: string = PHONE.wa;

const PLACEHOLDER = /^(FORM_ID_[A-Z_]*|PLUGIN_ID)$/;

/** true si el ID es real: no vacío y no es un valor de ejemplo (FORM_ID_… / PLUGIN_ID). */
export function isConfigured(id: string | null | undefined): id is string {
  const value = (id ?? '').trim();
  return /^\d+$/.test(value) && !PLACEHOLDER.test(value);
}

/** POST que crea la sesión de pago de Stripe de un plan (null = ID de ejemplo: modo simulado). */
export const checkoutSessionUrl = (key: PlanKey): string | null =>
  isConfigured(PLANES[key])
    ? `${ACCIOGEST_API}/form-builder/public/${encodeURIComponent(PLANES[key])}/create-checkout-session`
    : null;

/**
 * Portal de cliente de Stripe de Denisse (baja de los planes, recibos, tarjeta). Solo se acepta
 * un enlace que empiece por https://billing.stripe.com/p/login/ (handoff §4); cualquier otro
 * valor (o vacío) → null y no se muestra ningún enlace.
 */
const STRIPE_PORTAL_PREFIX = 'https://billing.stripe.com/p/login/';
export function stripePortalUrl(value: string | undefined = import.meta.env.PUBLIC_STRIPE_PORTAL_URL): string | null {
  const v = String(value ?? '').trim();
  if (!v.startsWith(STRIPE_PORTAL_PREFIX) || v.length <= STRIPE_PORTAL_PREFIX.length || /[\s"'<>]/.test(v)) return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && u.hostname === 'billing.stripe.com' ? u.href : null;
  } catch {
    return null;
  }
}
export const STRIPE_PORTAL_URL: string | null = stripePortalUrl();

/**
 * Script del widget de reservas. `service` = acciogest_id del servicio que abre ya elegido
 * (`&service=`; servicios.json → consultations[].prices[].acciogest_id).
 */
export const bookingScriptUrl = (service?: string | null): string | null =>
  isConfigured(BOOKING_PLUGIN_ID)
    ? `${ACCIOGEST_API}/plugin-citas-embed.js?pluginId=${encodeURIComponent(BOOKING_PLUGIN_ID)}` +
      (service ? `&service=${encodeURIComponent(service)}` : '')
    : null;

/** Mensajes que el iframe de reservas envía a la web (window.parent.postMessage). */
export const BOOKING_MESSAGES = { height: 'acciogest:booking:height', done: 'acciogest:booking:done' } as const;

/**
 * Orígenes desde los que se aceptan esos mensajes: el de ACCIOGEST_API y, si el iframe se sirve
 * desde otro dominio, los de PUBLIC_ACCIOGEST_WIDGET_ORIGINS (separados por comas).
 * TODO (AccioGest): confirmar desde qué origen se sirve el iframe del widget.
 */
export const bookingMessageOrigins = (): string[] =>
  [ACCIOGEST_API, ...String(import.meta.env.PUBLIC_ACCIOGEST_WIDGET_ORIGINS ?? '').split(',')]
    .map((value) => {
      try {
        return value.trim() ? new URL(value.trim()).origin : '';
      } catch {
        return '';
      }
    })
    .filter((origin, i, all) => origin && origin !== 'null' && all.indexOf(origin) === i);

/** Alto del widget de reservas: mínimo reservado (sin CLS) y máximo aceptado de un mensaje. */
export const BOOKING_MIN_HEIGHT = 760;
export const BOOKING_MAX_HEIGHT = 6000;

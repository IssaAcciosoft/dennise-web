/**
 * ============================================================================
 *  Configuración de la integración con AccioGest (docs/integracion-acciogest.md)
 * ============================================================================
 *  ÚNICO sitio donde se ponen los IDs. Mientras un ID tenga su valor de ejemplo
 *  (FORM_ID_… / PLUGIN_ID), esa pieza funciona en MODO SIMULADO:
 *    - formularios: se simula la respuesta de la API (no se envía nada) y se avisa;
 *    - planes: «Contratar» abre el formulario de solicitud en lugar del pago;
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
 *  Son IDs públicos (van en el HTML/JS de la web): no son secretos.
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

/** Planes del Programa Autogestiona: cada uno es una página de pago de AccioGest (Stripe). */
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
const COMMON = {
  consentimiento: 'Consentimiento RGPD',
  politica: 'Versión política',
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign',
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
 * Versión de la política de privacidad que se acepta al enviar un formulario
 * (se envía como «Versión política»). Cambiarla aquí al publicar una política nueva:
 * la página /politica-privacidad/ la muestra desde esta misma constante.
 */
export const POLICY_VERSION = '2026-10';

/** UTM que se envían con cada lead (de la URL de llegada; se guardan para toda la visita). */
export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;
/** Clave en sessionStorage (la usan BaseLayout y src/scripts/acciogest.ts). */
export const UTM_STORAGE_KEY = 'dg:utm';

/** Número para la alternativa por WhatsApp (sin «+»), desde src/data/site.ts. */
export const WHATSAPP_NUMBER: string = PHONE.wa;

const PLACEHOLDER = /^(FORM_ID_[A-Z_]*|PLUGIN_ID)$/;

/** true si el ID es real: no vacío y no es un valor de ejemplo (FORM_ID_… / PLUGIN_ID). */
export function isConfigured(id: string | null | undefined): id is string {
  const value = (id ?? '').trim();
  return value !== '' && !PLACEHOLDER.test(value);
}

/** Página pública de pago de un plan (se abre en una pestaña nueva). */
export const planPageUrl = (key: PlanKey): string | null =>
  isConfigured(PLANES[key]) ? `${ACCIOGEST_API}/form-builder/public/${encodeURIComponent(PLANES[key])}/page` : null;

/** Script del widget de reservas. */
export const bookingScriptUrl = (): string | null =>
  isConfigured(BOOKING_PLUGIN_ID)
    ? `${ACCIOGEST_API}/plugin-citas-embed.js?pluginId=${encodeURIComponent(BOOKING_PLUGIN_ID)}`
    : null;

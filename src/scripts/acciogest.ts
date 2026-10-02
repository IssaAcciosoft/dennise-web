/**
 * Cliente de leads de AccioGest (docs/integracion-acciogest.md §4). Sin dependencias ni
 * framework: lo usan los formularios (src/scripts/lead-form.ts) y se puede usar desde React.
 *
 *   submitLead('contacto', { nombre, email, telefono, mensaje, consentimiento: true })
 *     → POST {API}/form-builder/public/{FORM_ID}/submit  { "response_data": { "<Etiqueta>": "…" } }
 *     → resultado normalizado (LeadResult): ok | validation | unavailable | rate_limited | network | server
 *
 * - Claves de response_data = etiquetas EXACTAS (FIELD_LABELS en src/config/acciogest.ts).
 * - sí/no en minúscula; «Consentimiento RGPD» = «sí»; «Versión política» = POLICY_VERSION.
 * - UTM (utm_source / utm_medium / utm_campaign) de la URL de llegada, guardadas en
 *   sessionStorage para toda la visita (las captura también BaseLayout en cada página).
 * - MODO SIMULADO si el ID es de ejemplo: misma forma de respuesta tras ~700 ms; errores
 *   forzados con ?acciogest_mock=400 | 400-email | 429 | 429-5 | 403 | 404 | 500 | network | timeout.
 * - DEPURACIÓN con IDs reales: ?acciogest_debug=1 compara las etiquetas con
 *   GET {API}/form-builder/public/{FORM_ID} y avisa en la consola de las diferencias.
 */
import {
  ACCIOGEST_API,
  FIELD_LABELS,
  FORMS,
  POLICY_VERSION,
  UTM_KEYS,
  UTM_STORAGE_KEY,
  WHATSAPP_NUMBER,
  isConfigured,
  type FormKey,
} from '~/config/acciogest';

export type FieldValue = string | boolean | null | undefined;
export type LeadValues = Record<string, FieldValue>;

type Base = { mock: boolean };
export type LeadResult =
  | (Base & { ok: true; kind: 'success'; status: number; message: string; responseId: number | null })
  /** 400: campos que faltan o no son válidos (nombres internos del HTML). */
  | (Base & { ok: false; kind: 'validation'; status: 400; message: string; fields: string[] })
  /** 403 / 404: formulario inactivo o inexistente. */
  | (Base & { ok: false; kind: 'unavailable'; status: 403 | 404; message: string })
  /** 429: demasiados envíos; `retryAfter` en segundos. */
  | (Base & { ok: false; kind: 'rate_limited'; status: 429; message: string; retryAfter: number })
  /** Sin conexión, CORS o más de 15 s sin respuesta (`timeout`). */
  | (Base & { ok: false; kind: 'network'; status: 0; message: string; timeout: boolean })
  /** Cualquier otra respuesta (5xx…). */
  | (Base & { ok: false; kind: 'server'; status: number; message: string });

export const SUBMIT_TIMEOUT_MS = 15_000;
const MOCK_DELAY_MS = 700;
const DEFAULT_RETRY_S = 60;

/* --------------------------------------------------------------------------
 * UTM
 * ----------------------------------------------------------------------- */

/** Lee las UTM de la URL; si hay alguna, sustituye las guardadas. Devuelve las vigentes. */
export function captureUtms(search: string = location.search): Record<string, string> {
  const params = new URLSearchParams(search);
  const fresh: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) fresh[key] = value.slice(0, 200);
  }
  if (Object.keys(fresh).length) {
    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      /* almacenamiento bloqueado (modo privado, cookies desactivadas…) */
    }
    return fresh;
  }
  return readStoredUtms();
}

function readStoredUtms(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === 'string' && value) out[key] = value.slice(0, 200);
    }
    return out;
  } catch {
    return {};
  }
}

/* --------------------------------------------------------------------------
 * Utilidades
 * ----------------------------------------------------------------------- */
const params = () => new URLSearchParams(typeof location === 'undefined' ? '' : location.search);

export const isMock = (formKey: FormKey): boolean => !isConfigured(FORMS[formKey]);

/** Enlace de WhatsApp (alternativa cuando el formulario no está disponible). */
export function whatsappLink(text?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** sí/no en minúscula; cadenas recortadas; vacío → ''. */
function normaliseValue(value: FieldValue): string {
  if (value === true) return 'sí';
  if (value === false) return 'no';
  if (value == null) return '';
  const text = String(value).trim();
  if (/^s[ií]$/i.test(text)) return 'sí';
  if (/^no$/i.test(text)) return 'no';
  return text;
}

const META_FIELDS = new Set(['consentimiento', 'politica', ...UTM_KEYS]);

/**
 * Construye `response_data` con las etiquetas exactas, en el orden de FIELD_LABELS.
 * Los campos opcionales vacíos no se envían.
 */
export function buildResponseData(formKey: FormKey, values: LeadValues): Record<string, string> {
  const labels = FIELD_LABELS[formKey] as Record<string, string>;
  const data: Record<string, string> = {};
  for (const [name, label] of Object.entries(labels)) {
    if (META_FIELDS.has(name)) continue;
    const value = normaliseValue(values[name]);
    if (value) data[label] = value;
  }
  data[labels.consentimiento] = 'sí';
  data[labels.politica] = POLICY_VERSION;
  const utms = captureUtms();
  for (const key of UTM_KEYS) {
    if (utms[key]) data[labels[key]] = utms[key];
  }
  return data;
}

/** Etiqueta de AccioGest → nombre interno del campo (para marcar errores). */
function labelToName(formKey: FormKey, label: string): string | null {
  const labels = FIELD_LABELS[formKey] as Record<string, string>;
  const wanted = label.trim().toLowerCase();
  const hit = Object.entries(labels).find(([, l]) => l.toLowerCase() === wanted);
  return hit ? hit[0] : null;
}

function parseRetryAfter(header: string | null, body: Record<string, unknown>): number {
  let seconds = NaN;
  if (header) {
    seconds = /^\d+$/.test(header.trim()) ? Number(header) : (Date.parse(header) - Date.now()) / 1000;
  }
  if (!Number.isFinite(seconds) && typeof body.retry_after === 'number') seconds = body.retry_after;
  if (!Number.isFinite(seconds) || seconds <= 0) seconds = DEFAULT_RETRY_S;
  return Math.min(3600, Math.max(1, Math.ceil(seconds)));
}

type RawResponse = { status: number; headers: { get(name: string): string | null }; body: Record<string, unknown> };

/** Normaliza una respuesta de la API (real o simulada) en un LeadResult. */
function normalise(formKey: FormKey, res: RawResponse, mock: boolean): LeadResult {
  const { status, body } = res;
  const text = (key: string) => (typeof body[key] === 'string' ? (body[key] as string) : '');

  if (status >= 200 && status < 300) {
    const id = body.response_id;
    return {
      ok: true,
      kind: 'success',
      status,
      mock,
      message: text('message') || 'Hemos recibido tu mensaje correctamente.',
      responseId: typeof id === 'number' ? id : typeof id === 'string' && id ? Number(id) || null : null,
    };
  }
  if (status === 400) {
    const fields = new Set<string>();
    if (Array.isArray(body.missing_fields)) {
      for (const label of body.missing_fields) {
        const name = typeof label === 'string' ? labelToName(formKey, label) : null;
        if (name) fields.add(name);
      }
    }
    // {"error":"El campo \"Email\" debe ser un email válido"}
    for (const match of text('error').matchAll(/["«“]([^"»”]+)["»”]/g)) {
      const name = labelToName(formKey, match[1]);
      if (name) fields.add(name);
    }
    return {
      ok: false,
      kind: 'validation',
      status: 400,
      mock,
      message: text('error') || text('message') || 'Faltan campos obligatorios o no son válidos.',
      fields: [...fields],
    };
  }
  if (status === 403 || status === 404) {
    return {
      ok: false,
      kind: 'unavailable',
      status,
      mock,
      message: text('error') || text('message') || 'Este formulario no está disponible en este momento.',
    };
  }
  if (status === 429) {
    return {
      ok: false,
      kind: 'rate_limited',
      status: 429,
      mock,
      message: text('error') || text('message') || 'Demasiados envíos seguidos.',
      retryAfter: parseRetryAfter(res.headers.get('Retry-After'), body),
    };
  }
  return {
    ok: false,
    kind: 'server',
    status,
    mock,
    message: text('error') || text('message') || 'Error del servidor.',
  };
}

const networkResult = (mock: boolean, timeout: boolean): LeadResult => ({
  ok: false,
  kind: 'network',
  status: 0,
  mock,
  timeout,
  message: timeout ? 'La solicitud ha tardado demasiado.' : 'No se ha podido conectar con el servidor.',
});

/* --------------------------------------------------------------------------
 * Modo simulado
 * ----------------------------------------------------------------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const announced = new Set<FormKey>();

async function mockSubmit(formKey: FormKey, data: Record<string, string>): Promise<LeadResult> {
  const forced = (params().get('acciogest_mock') ?? '').trim().toLowerCase();
  if (!announced.has(formKey)) {
    announced.add(formKey);
    console.info(
      `[AccioGest] Modo simulado en el formulario «${formKey}» (ID de ejemplo ${FORMS[formKey]}): no se envía nada. ` +
        'Errores de prueba: ?acciogest_mock=400 | 400-email | 429 | 404 | network.',
    );
  }
  console.info('[AccioGest] response_data simulado:', data);
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const headers = new Map<string, string>();
  const reply = (status: number, body: Record<string, unknown>) =>
    normalise(formKey, { status, headers: { get: (n) => headers.get(n.toLowerCase()) ?? null }, body }, true);

  if (forced === 'network') return networkResult(true, false);
  if (forced === 'timeout') return networkResult(true, true);
  if (forced === '400') return reply(400, { error: 'Faltan campos obligatorios', missing_fields: ['Email'] });
  if (forced === '400-email') return reply(400, { error: 'El campo "Email" debe ser un email válido' });
  if (forced === '403') return reply(403, { error: 'Este formulario no está activo' });
  if (forced === '404') return reply(404, { error: 'Formulario no encontrado' });
  if (forced === '500') return reply(500, { error: 'Error interno' });
  if (forced.startsWith('429')) {
    headers.set('retry-after', forced.split('-')[1] || '30');
    return reply(429, { error: 'Demasiadas solicitudes. Inténtalo más tarde.' });
  }
  // Validación como la de la API: obligatorios mínimos y formato del email.
  const missing = ['Nombre', 'Email'].filter((label) => !data[label]);
  if (missing.length) return reply(400, { error: 'Faltan campos obligatorios', missing_fields: missing });
  if (!EMAIL_RE.test(data.Email)) return reply(400, { error: 'El campo "Email" debe ser un email válido' });
  return reply(201, {
    success: true,
    message: 'Formulario enviado correctamente.',
    response_id: Math.floor(Math.random() * 100000),
  });
}

/* --------------------------------------------------------------------------
 * Envío
 * ----------------------------------------------------------------------- */
export async function submitLead(
  formKey: FormKey,
  values: LeadValues,
  { timeoutMs = SUBMIT_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<LeadResult> {
  const mock = isMock(formKey);
  if (values.consentimiento !== true) {
    return { ok: false, kind: 'validation', status: 400, mock, message: 'Falta el consentimiento.', fields: ['consentimiento'] };
  }
  const data = buildResponseData(formKey, values);
  if (mock) return mockSubmit(formKey, data);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${ACCIOGEST_API}/form-builder/public/${encodeURIComponent(FORMS[formKey])}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ response_data: data }),
      credentials: 'omit',
      signal: controller.signal,
    });
    let body: Record<string, unknown> = {};
    try {
      const parsed: unknown = await response.json();
      if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
    } catch {
      /* cuerpo vacío o no JSON */
    }
    return normalise(formKey, { status: response.status, headers: response.headers, body }, false);
  } catch (error) {
    return networkResult(false, controller.signal.aborted || (error as Error)?.name === 'AbortError');
  } finally {
    clearTimeout(timer);
  }
}

/* --------------------------------------------------------------------------
 * Depuración de etiquetas (?acciogest_debug=1, solo con IDs reales)
 * ----------------------------------------------------------------------- */
const checked = new Set<FormKey>();

/**
 * Compara FIELD_LABELS con la definición pública del formulario en AccioGest.
 * `requiredHere`: nombres internos obligatorios en el HTML (para detectar campos que
 * AccioGest exige y la web deja opcionales).
 */
export async function debugLabels(formKey: FormKey, requiredHere: string[] = []): Promise<void> {
  const flag = params().get('acciogest_debug');
  if (!flag || flag === '0' || checked.has(formKey)) return;
  checked.add(formKey);
  const tag = `[AccioGest debug · ${formKey}]`;
  if (isMock(formKey)) {
    console.info(`${tag} ID de ejemplo (${FORMS[formKey]}): modo simulado, no hay etiquetas que comprobar.`);
    return;
  }
  try {
    const response = await fetch(`${ACCIOGEST_API}/form-builder/public/${encodeURIComponent(FORMS[formKey])}`, {
      headers: { Accept: 'application/json' },
      credentials: 'omit',
    });
    if (!response.ok) {
      console.warn(`${tag} GET del formulario respondió ${response.status}: ¿ID correcto y formulario activo?`);
      return;
    }
    const definition = (await response.json()) as { fields?: unknown; data?: { fields?: unknown } };
    const rawFields = (Array.isArray(definition.fields) ? definition.fields : definition.data?.fields) as
      | { label?: unknown; is_required?: unknown }[]
      | undefined;
    if (!Array.isArray(rawFields)) {
      console.warn(`${tag} La respuesta no tiene fields[]:`, definition);
      return;
    }
    const remote = new Map<string, boolean>();
    for (const field of rawFields) {
      if (typeof field?.label === 'string') remote.set(field.label.trim(), Boolean(field.is_required));
    }
    const labels = FIELD_LABELS[formKey] as Record<string, string>;
    const ours = Object.values(labels);
    const unknown = ours.filter((label) => !remote.has(label));
    const notSent = [...remote].filter(([label, required]) => required && !ours.includes(label)).map(([label]) => label);
    const optionalHere = Object.entries(labels)
      .filter(([name, label]) => remote.get(label) && !META_FIELDS.has(name) && !requiredHere.includes(name))
      .map(([, label]) => label);

    if (unknown.length) console.warn(`${tag} Etiquetas de la web que NO existen en AccioGest:`, unknown);
    if (notSent.length) console.warn(`${tag} Campos OBLIGATORIOS en AccioGest que la web no envía:`, notSent);
    if (optionalHere.length) console.warn(`${tag} Obligatorios en AccioGest pero opcionales en la web:`, optionalHere);
    if (!unknown.length && !notSent.length && !optionalHere.length) {
      console.info(`${tag} Las etiquetas coinciden con AccioGest.`, [...remote.keys()]);
    }
  } catch (error) {
    console.warn(`${tag} No se pudo consultar la definición del formulario:`, error);
  }
}

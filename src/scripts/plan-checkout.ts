/**
 * ============================================================================
 *  Contratación de un plan de Autogestión DG (cuota mensual) — handoff AccioGest 19-11-2026 §3
 * ============================================================================
 *  HTML: src/components/services/PlanCheckoutDialog.astro. Disparadores: [data-plan-checkout].
 *
 *  POST {API}/form-builder/public/{PLAN_ID}/create-checkout-session
 *    { "response_data": { "Nombre", "Email", "Teléfono", "Consentimiento RGPD", "Desistimiento" },
 *      "utm_source", "utm_medium", "utm_campaign" }                  (utm_* en la RAÍZ, si existen)
 *  Se envía con referrerPolicy 'no-referrer-when-downgrade': AccioGest usa el Referer para la
 *  dirección de cancelación de Stripe y, con la política del sitio (strict-origin-when-cross-origin,
 *  netlify.toml), llegaría sin ruta y «Atrás» en Stripe llevaría a la portada.
 *  Respuestas (tabla «Errores y qué mostrar» de WEB-INTEGRACION 12-11 §1):
 *    200 { url, sessionId, response_id } → se comprueba que url es https://checkout.stripe.com/… y se va allí;
 *    400 { error, missing_fields } → se marcan los campos; si falta «Desistimiento», se explica;
 *    400 «…"Email" debe ser un email válido», «…"Teléfono" debe ser un número de teléfono válido»,
 *        «Hace falta un email válido para la suscripción» → se marca el campo con ese mensaje;
 *    400 otro (sin cobro mensual, Stripe sin configurar, sin dirección de vuelta, URL de
 *        redirección no válida, USAR_CHECKOUT_SUSCRIPCION) → fallo de configuración: «Este plan
 *        no se puede contratar online ahora mismo» + WhatsApp (no se muestra el texto interno);
 *    403 / 404    → «no está disponible ahora mismo» + WhatsApp (404 también si el id no es entero);
 *    429          → botón bloqueado 60 s con cuenta atrás (Retry-After no se puede leer desde la web;
 *                   límite: 120 envíos cada 10 min por conexión, compartido con los leads);
 *    502 / 500    → el mensaje del servidor y se deja reintentar en el acto;
 *    red / > 15 s → «No se ha podido conectar» (los datos se conservan) + WhatsApp.
 *  Campo trampa `website`, guardia de doble envío y botón con aria-disabled (el foco no se pierde).
 *
 *  MODO SIMULADO (solo mientras NINGÚN plan tiene ID real, PLAN_CHECKOUT_MOCK): no se envía
 *  nada; tras ~700 ms se va a /gracias/?tipo=plan&plan=<plan>&pago=ok&response_id=mock. Errores
 *  de prueba con ?acciogest_mock=400 (falta Desistimiento) | 400-rgpd | 400-tel | 400-email
 *  (email no válido) | 400-tel-invalido | 400-email-sub (email para la suscripción) |
 *  400-config (Stripe sin configurar) | 403 | 404 | 429 | 500 | 502 | network | timeout |
 *  bad-url (200 con una url que no es de Stripe).
 * ============================================================================
 */
import { setupDialog, bindTriggers } from './dialog';
import { buildRequestBody, cleanPhone } from './acciogest';

type PlanConf = { name: string; fee: string; desist: string; endpoint: string | null };
type Labels = { nombre: string; email: string; telefono: string; rgpd: string; desistimiento: string };
type Config = { plans: Record<string, PlanConf>; labels: Labels; privacy: string; mock: boolean; thanks: string; wa: string };
type FieldName = keyof Labels;

export type CheckoutResult =
  | { kind: 'redirect'; url: string; mock: boolean }
  /** `fromServer`: AccioGest rechaza el valor (email/teléfono) aunque la web lo dé por bueno. */
  | { kind: 'validation'; fields: FieldName[]; message: string; fromServer?: boolean }
  /** 403 / 404 (plan inactivo o inexistente) o 400 de configuración (status 400). */
  | { kind: 'unavailable'; status: number }
  | { kind: 'rate_limited'; retryAfter: number }
  | { kind: 'network'; timeout: boolean }
  | { kind: 'server'; status: number; message: string };

export const CHECKOUT_TIMEOUT_MS = 15_000;
/** Bloqueo del botón tras un 429 (handoff §3: «el botón se bloquea 60 s»; Retry-After no se puede leer). */
export const RATE_LIMIT_S = 60;
const MOCK_DELAY_MS = 700;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// «+» solo al principio (AccioGest rechaza uno en medio); los puntos se aceptan y cleanPhone()
// los convierte en espacios antes de enviar.
const TEL_RE = /^\+?[()\d\s.\-]{6,25}$/;
const FIELDS: FieldName[] = ['nombre', 'email', 'telefono', 'rgpd', 'desistimiento'];

/**
 * ¿Es la `url` de la respuesta 200 una página de Stripe Checkout? Solo https, sin usuario,
 * contraseña ni puerto, y solo en checkout.stripe.com (no vale cualquier *.stripe.com). Es el
 * único host que acepta el código de referencia de WEB-INTEGRACION 12-11 §1.
 */
const CHECKOUT_HOSTS: readonly string[] = ['checkout.stripe.com'];

export function isStripeCheckoutUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  try {
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      !u.port &&
      CHECKOUT_HOSTS.includes(u.hostname)
    );
  } catch {
    return false;
  }
}

const params = () => new URLSearchParams(location.search);

/** Etiqueta de AccioGest (missing_fields) → name del campo en el HTML. */
function labelToField(labels: Labels, label: string): FieldName | null {
  const wanted = label.trim().toLowerCase();
  return FIELDS.find((name) => labels[name].toLowerCase() === wanted) ?? null;
}

type Raw = { status: number; headers: { get(name: string): string | null }; body: Record<string, unknown> };

/** Mensaje de 502 / 500 (o 200 sin url de Stripe) cuando el servidor no da ninguno. */
export const SERVER_FALLBACK = 'No se ha podido preparar el pago. Inténtalo de nuevo.';

export function normalise(labels: Labels, res: Raw, thanksMock: string | null): CheckoutResult {
  const { status, body } = res;
  const text = (key: string) => (typeof body[key] === 'string' ? (body[key] as string).trim() : '');
  const error = text('error');
  if (status >= 200 && status < 300) {
    if (thanksMock) return { kind: 'redirect', url: thanksMock, mock: true };
    // 200 { url, sessionId, response_id } (url en la raíz). No se guarda nada.
    if (isStripeCheckoutUrl(body.url)) return { kind: 'redirect', url: body.url, mock: false };
    return { kind: 'server', status, message: SERVER_FALLBACK };
  }
  if (status === 400 && Array.isArray(body.missing_fields)) {
    const fields = new Set<FieldName>();
    for (const label of body.missing_fields) {
      const name = typeof label === 'string' ? labelToField(labels, label) : null;
      if (name) fields.add(name);
    }
    return { kind: 'validation', fields: [...fields], message: error || 'Faltan campos obligatorios' };
  }
  if (status === 400 && /email|teléfono|telefono/i.test(error)) {
    // «El campo "Email" debe ser un email válido», «…"Teléfono" debe ser un número de teléfono
    // válido», «Hace falta un email válido para la suscripción».
    const fields = new Set<FieldName>();
    for (const match of error.matchAll(/["«“]([^"»”]+)["»”]/g)) {
      const name = labelToField(labels, match[1]);
      if (name === 'email' || name === 'telefono') fields.add(name);
    }
    if (!fields.size) fields.add(/tel[eé]fono/i.test(error) ? 'telefono' : 'email');
    return { kind: 'validation', fields: [...fields], message: error, fromServer: true };
  }
  // 400 de configuración (no del cliente) y 403 / 404: no se puede contratar online.
  if (status === 400 || status === 403 || status === 404) return { kind: 'unavailable', status };
  if (status === 429) return { kind: 'rate_limited', retryAfter: RATE_LIMIT_S };
  return { kind: 'server', status, message: error || SERVER_FALLBACK };
}

async function mockCheckout(labels: Labels, data: Record<string, string>, thanksUrl: string): Promise<CheckoutResult> {
  const forced = (params().get('acciogest_mock') ?? '').trim().toLowerCase();
  console.info('[AccioGest] Modo simulado (plan con ID de ejemplo): no se crea ningún pago. Cuerpo simulado:', buildRequestBody(data));
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  const reply = (status: number, body: Record<string, unknown>) =>
    normalise(labels, { status, headers: { get: () => null }, body }, status < 300 ? thanksUrl : null);
  if (forced === 'network') return { kind: 'network', timeout: false };
  if (forced === 'timeout') return { kind: 'network', timeout: true };
  if (forced === '400') return reply(400, { error: 'Faltan campos obligatorios', missing_fields: [labels.desistimiento] });
  if (forced === '400-rgpd') return reply(400, { error: 'Faltan campos obligatorios', missing_fields: [labels.rgpd] });
  if (forced === '400-tel') return reply(400, { error: 'Faltan campos obligatorios', missing_fields: [labels.telefono] });
  if (forced === '400-email') return reply(400, { error: `El campo "${labels.email}" debe ser un email válido` });
  if (forced === '400-tel-invalido') return reply(400, { error: `El campo "${labels.telefono}" debe ser un número de teléfono válido` });
  if (forced === '400-email-sub') return reply(400, { error: 'Hace falta un email válido para la suscripción' });
  if (forced === '400-config') return reply(400, { error: 'Stripe no está configurado para esta empresa' });
  if (forced === '403') return reply(403, { error: 'Este formulario no está activo' });
  if (forced === '404') return reply(404, { error: 'Formulario no encontrado o inactivo' });
  if (forced === '500') return reply(500, { error: 'Error al preparar el pago' });
  if (forced === '502') return reply(502, { error: 'No se pudo preparar el pago. Inténtalo de nuevo.' });
  if (forced === 'bad-url') return normalise(labels, { status: 200, headers: { get: () => null }, body: { url: 'https://example.com/pago' } }, null);
  if (forced.startsWith('429')) return reply(429, { error: 'Demasiadas solicitudes. Inténtalo más tarde.' });
  // Como la API: todos obligatorios.
  const missing = Object.values(labels).filter((label) => !data[label]);
  if (missing.length) return reply(400, { error: 'Faltan campos obligatorios', missing_fields: missing });
  return reply(200, { url: thanksUrl, sessionId: 'cs_test_mock', response_id: 0 });
}

/**
 * Crea la sesión de pago. Sin ID real (endpoint null) solo se simula si `mock` (ningún plan
 * configurado); si no, el plan no está disponible (nunca una compra simulada en producción).
 */
export async function createCheckoutSession(
  plan: PlanConf,
  labels: Labels,
  data: Record<string, string>,
  mockThanksUrl: string,
  { timeoutMs = CHECKOUT_TIMEOUT_MS, mock = true }: { timeoutMs?: number; mock?: boolean } = {},
): Promise<CheckoutResult> {
  if (!plan.endpoint) return mock ? mockCheckout(labels, data, mockThanksUrl) : { kind: 'unavailable', status: 404 };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(plan.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(buildRequestBody(data)),
      credentials: 'omit',
      // IMPRESCINDIBLE (WEB-INTEGRACION 12-11 §1): con la política del sitio
      // (strict-origin-when-cross-origin) el Referer llegaría sin ruta y, si el cliente cancela en
      // Stripe, AccioGest lo devolvería a la portada. Así llega la URL completa (/autogestion-dg/).
      referrerPolicy: 'no-referrer-when-downgrade',
      signal: controller.signal,
    });
    let body: Record<string, unknown> = {};
    try {
      const parsed: unknown = await response.json();
      if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
    } catch {
      /* cuerpo vacío o no JSON */
    }
    return normalise(labels, { status: response.status, headers: response.headers, body }, null);
  } catch (error) {
    return { kind: 'network', timeout: controller.signal.aborted || (error as Error)?.name === 'AbortError' };
  } finally {
    clearTimeout(timer);
  }
}

/* ============================================================================
 *  Controlador del diálogo
 * ========================================================================= */
export function initPlanCheckout(dialog: HTMLDialogElement | null): void {
  if (!dialog || typeof dialog.showModal !== 'function' || dialog.dataset.planReady) return;
  const root = dialog.querySelector<HTMLElement>('[data-plan-checkout-root]');
  const form = dialog.querySelector<HTMLFormElement>('form[data-plan-form]');
  if (!root || !form) return;
  let config: Config;
  try {
    config = JSON.parse(root.dataset.config ?? '') as Config;
  } catch {
    return;
  }
  if (!config?.plans || !Object.keys(config.plans).length) return;
  dialog.dataset.planReady = '1';
  const { labels } = config;

  const q = <T extends HTMLElement = HTMLElement>(sel: string) => dialog.querySelector<T>(sel);
  const title = q('[data-dialog-title]');
  const summary = q('[data-plan-summary]');
  const summaryName = q('[data-plan-summary-name]');
  const summaryFee = q('[data-plan-summary-fee]');
  const mockNote = q('[data-plan-mock]');
  const status = q('[data-form-status]')!;
  const submitBtn = q<HTMLButtonElement>('[data-submit]')!;
  const submitLabel = q('[data-submit-label]')!;
  const idleLabel = submitLabel.textContent || 'Pagar y contratar';
  submitBtn.disabled = false;

  const input = (name: FieldName) => form.elements.namedItem(name) as HTMLInputElement | null;
  let current = '';
  let attempted = false;
  let sending = false;
  let leaving = false;
  let lockedUntil = 0;
  let lockTimer = 0;

  /* ---------- Validación ---------- */
  function ruleFor(name: FieldName): string {
    const el = input(name);
    if (!el) return '';
    const msg = (fallback: string) => el.dataset.msgRequired || fallback;
    if (el.type === 'checkbox') return el.checked ? '' : msg('Debes marcar esta casilla para continuar.');
    const value = el.value.trim();
    if (!value) return msg('Este campo es obligatorio.');
    if (el.type === 'email' && !EMAIL_RE.test(value)) return 'Escribe un email válido, por ejemplo nombre@dominio.com.';
    if (el.type === 'tel' && (!TEL_RE.test(value) || cleanPhone(value).replace(/\D/g, '').length < 6)) {
      return 'Escribe un teléfono válido (puedes incluir el prefijo, por ejemplo +34).';
    }
    return '';
  }
  function setFieldError(name: FieldName, message: string) {
    const el = input(name);
    if (message) el?.setAttribute('aria-invalid', 'true');
    else el?.removeAttribute('aria-invalid');
    const box = form!.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
    if (box) box.textContent = message;
  }
  const validate = (name: FieldName) => {
    const m = ruleFor(name);
    setFieldError(name, m);
    return !m;
  };
  const focusField = (name: FieldName) => {
    const el = input(name);
    if (!el) return;
    el.focus({ preventScroll: true });
    (el.closest('.field') ?? el).scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  /* ---------- Estado ---------- */
  function setStatus(text: string, tone: 'error' | 'info' | '' = '', withWhatsApp = false) {
    status.replaceChildren();
    if (tone) status.dataset.tone = tone;
    else delete status.dataset.tone;
    if (!text) return;
    const span = document.createElement('span');
    span.textContent = text;
    status.append(span);
    if (withWhatsApp) {
      const a = document.createElement('a');
      a.href = config.wa;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'form-status-link';
      a.textContent = 'Escríbenos por WhatsApp';
      status.append(a);
    }
  }
  const summaryText = (n: number) => (n === 1 ? 'Revisa el campo marcado antes de continuar.' : `Revisa los ${n} campos marcados antes de continuar.`);
  function setBusy(busy: boolean) {
    sending = busy;
    submitBtn.setAttribute('aria-busy', String(busy));
    if (busy || lockedUntil) submitBtn.setAttribute('aria-disabled', 'true');
    else submitBtn.removeAttribute('aria-disabled');
    if (!lockedUntil) submitLabel.textContent = busy ? 'Preparando el pago…' : idleLabel;
  }
  function lock(seconds: number) {
    lockedUntil = Date.now() + seconds * 1000;
    submitBtn.setAttribute('aria-disabled', 'true');
    window.clearInterval(lockTimer);
    const tick = () => {
      const left = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (left <= 0) {
        window.clearInterval(lockTimer);
        lockedUntil = 0;
        submitBtn.removeAttribute('aria-disabled');
        submitLabel.textContent = idleLabel;
        setStatus('Ya puedes volver a intentarlo.', 'info');
        return;
      }
      submitLabel.textContent = `Espera ${left} s`;
    };
    tick();
    lockTimer = window.setInterval(tick, 1000);
  }

  /* ---------- Plan elegido ---------- */
  function select(key: string) {
    const plan = config.plans[key];
    if (!plan) return;
    current = key;
    if (title) title.textContent = `Contratar el ${plan.name}`;
    if (summary && summaryName && summaryFee) {
      summaryName.textContent = plan.name;
      summaryFee.textContent = plan.fee;
      summary.hidden = false;
    }
    dialog!.querySelectorAll<HTMLElement>('[data-desist-for]').forEach((el) => (el.hidden = el.dataset.desistFor !== key));
    if (mockNote) mockNote.hidden = Boolean(plan.endpoint);
    // Ninguna casilla marcada de entrada (handoff §2): se desmarcan cada vez que se abre.
    (['rgpd', 'desistimiento'] as const).forEach((name) => {
      const el = input(name);
      if (el) el.checked = false;
      setFieldError(name, '');
    });
    if (!lockedUntil && !sending) setStatus('');
  }

  /* ---------- Resultado ---------- */
  function handle(res: CheckoutResult) {
    const plan = config.plans[current];
    switch (res.kind) {
      case 'redirect':
        leaving = true;
        submitBtn.setAttribute('aria-disabled', 'true');
        submitLabel.textContent = 'Abriendo el pago…';
        setStatus(res.mock ? 'Modo de prueba: se simula el pago…' : 'Te llevamos a la página de pago seguro de Stripe…', 'info');
        window.location.assign(res.url);
        return;
      case 'validation': {
        attempted = true;
        if (res.fromServer) {
          // AccioGest rechaza el email o el teléfono: se marca el campo con su mensaje aunque la
          // validación de la web lo diera por bueno.
          res.fields.forEach((name) => setFieldError(name, res.message));
          setStatus(res.message, 'error');
          if (res.fields[0]) focusField(res.fields[0]);
          return;
        }
        // Campos que AccioGest da por vacíos pero que aquí están bien (casilla marcada, campo
        // relleno): suele ser un desajuste de etiqueta o valor. No se le pide al usuario que
        // marque o rellene algo que ya ha hecho.
        const invalidHere = res.fields.filter((name) => ruleFor(name) !== '');
        if (res.fields.length && !invalidHere.length) {
          console.warn('[acciogest] 400 con campos válidos en la web (¿etiqueta o valor distinto?):', res.fields);
          setStatus(
            'No se ha podido iniciar el pago. No se ha cobrado nada. Inténtalo de nuevo o escríbenos por WhatsApp.',
            'error',
            true,
          );
          return;
        }
        invalidHere.forEach((name) => setFieldError(name, ruleFor(name)));
        res.fields = invalidHere;
        if (res.fields.includes('desistimiento')) {
          setStatus(
            `Para contratar el ${plan?.name ?? 'plan'} tienes que marcar la casilla «Contrato el ${plan?.name ?? 'plan'}…». ` +
              'Con ella pides que el servicio empiece ya, sin esperar a que pasen los 14 días en que puedes desistir, y aceptas las condiciones de contratación.',
            'error',
          );
          focusField(res.fields[0]);
        } else if (res.fields.length) {
          setStatus(`${res.message}. ${summaryText(res.fields.length)}`.replace('..', '.'), 'error');
          focusField(res.fields[0]);
        } else {
          setStatus(`No se ha podido iniciar el pago: ${res.message}.`.replace('..', '.'), 'error', true);
        }
        return;
      }
      case 'unavailable':
        setStatus(
          res.status === 400
            ? 'Este plan no se puede contratar online ahora mismo. Escríbenos por WhatsApp y te ayudamos a contratarlo.'
            : 'Este plan no está disponible ahora mismo. Escríbenos por WhatsApp y te ayudamos a contratarlo.',
          'error',
          true,
        );
        return;
      case 'rate_limited':
        setStatus(
          `Se han hecho demasiados intentos seguidos. Por seguridad, espera ${res.retryAfter} segundos antes de volver a intentarlo.`,
          'error',
        );
        lock(res.retryAfter);
        return;
      case 'network':
        setStatus(
          res.timeout
            ? 'La conexión con el sistema de pago está tardando demasiado y se ha cancelado. No se ha cobrado nada y tus datos siguen aquí: inténtalo de nuevo en unos minutos.'
            : 'No se ha podido conectar con el sistema de pago: parece que hay un problema de conexión. No se ha cobrado nada y tus datos siguen aquí: comprueba tu conexión e inténtalo de nuevo.',
          'error',
          true,
        );
        return;
      default:
        // 502 / 500: el mensaje del servidor; el botón queda libre para reintentar en el acto.
        {
          const m = res.message || SERVER_FALLBACK;
          setStatus(`${/[.!?…]$/.test(m) ? m : `${m}.`} No se ha cobrado nada.`, 'error', true);
        }
    }
  }

  /* ---------- Eventos ---------- */
  const onEdit = (e: Event) => {
    const name = (e.target as HTMLInputElement).name as FieldName;
    if (!attempted || !FIELDS.includes(name)) return;
    validate(name);
    if (status.dataset.tone === 'error' && !sending && !lockedUntil && FIELDS.every((n) => !ruleFor(n))) setStatus('');
  };
  form.addEventListener('input', onEdit);
  form.addEventListener('change', onEdit);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Guardia de doble envío: enviando, bloqueado (429) o ya saliendo hacia Stripe.
    if (sending || lockedUntil || leaving) return;
    const plan = config.plans[current];
    if (!plan) return;
    attempted = true;
    const invalid = FIELDS.filter((name) => !validate(name));
    if (invalid.length) {
      setStatus(summaryText(invalid.length), 'error');
      focusField(invalid[0]);
      return;
    }
    // Campo trampa: los bots lo rellenan. No se envía nada.
    const trap = form.elements.namedItem('website') as HTMLInputElement | null;
    if (trap?.value) {
      setBusy(true);
      await new Promise((r) => setTimeout(r, 600));
      setBusy(false);
      setStatus('Hemos recibido tus datos.', 'info');
      return;
    }
    const data: Record<string, string> = {
      [labels.nombre]: input('nombre')!.value.trim(),
      [labels.email]: input('email')!.value.trim(),
      [labels.telefono]: cleanPhone(input('telefono')!.value),
      // Valor de cada casilla = su texto plano exacto (src/data/consent.ts).
      [labels.rgpd]: config.privacy,
      [labels.desistimiento]: plan.desist,
    };
    const thanks = `${config.thanks}?tipo=plan&plan=${encodeURIComponent(current)}&pago=ok&response_id=mock`;
    setBusy(true);
    setStatus('Preparando el pago seguro…', 'info');
    let res: CheckoutResult;
    try {
      res = await createCheckoutSession(plan, labels, data, thanks, { mock: config.mock !== false });
    } catch {
      res = { kind: 'server', status: 0, message: SERVER_FALLBACK };
    }
    setBusy(false);
    handle(res);
  });

  // Al volver desde Stripe con «Atrás» (bfcache), el botón vuelve a estar disponible.
  window.addEventListener('pageshow', (e) => {
    if (!(e as PageTransitionEvent).persisted || !leaving) return;
    leaving = false;
    setBusy(false);
    setStatus('');
  });

  const modal = setupDialog(dialog, { initialFocus: () => input('nombre') ?? title });
  for (const key of Object.keys(config.plans)) {
    bindTriggers(`[data-plan-checkout="${CSS.escape(key)}"]`, {
      open(trigger) {
        select(key);
        modal.open(trigger);
      },
      close: modal.close,
    });
  }
}

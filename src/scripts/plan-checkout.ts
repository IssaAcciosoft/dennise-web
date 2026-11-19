/**
 * ============================================================================
 *  Contratación de un plan de Autogestión DG (cuota mensual) — handoff AccioGest 19-11-2026 §3
 * ============================================================================
 *  HTML: src/components/services/PlanCheckoutDialog.astro. Disparadores: [data-plan-checkout].
 *
 *  POST {API}/form-builder/public/{PLAN_ID}/create-checkout-session
 *    { "response_data": { "Nombre", "Email", "Teléfono", "Consentimiento RGPD", "Desistimiento" },
 *      "utm_source", "utm_medium", "utm_campaign" }                  (utm_* en la RAÍZ, si existen)
 *  Respuestas (tabla del punto 1 de WEB-INTEGRACION.md, que no está disponible aquí: se aplica la
 *  lectura más prudente, la misma que en los formularios de leads):
 *    200 { url }  → se comprueba que es https en un dominio de Stripe y se va allí;
 *    400 { error, missing_fields } → se marcan los campos; si falta «Desistimiento», se explica;
 *    403 / 404    → «no disponible» + WhatsApp;
 *    429          → botón bloqueado 60 s con cuenta atrás (o lo que diga Retry-After, si es más);
 *    red / > 15 s → mensaje de conexión (los datos se conservan) + WhatsApp;
 *    otro         → error genérico + WhatsApp.
 *  Campo trampa `website`, guardia de doble envío y botón con aria-disabled (el foco no se pierde).
 *
 *  MODO SIMULADO (ID del plan de ejemplo): no se envía nada; tras ~700 ms se va a
 *  /gracias/?tipo=plan&plan=<plan>&pago=ok&response_id=mock. Errores de prueba con
 *  ?acciogest_mock=400 (falta Desistimiento) | 400-rgpd | 400-tel | 403 | 404 | 429 | 500 |
 *  network | timeout | bad-url (200 con una url que no es de Stripe).
 * ============================================================================
 */
import { setupDialog, bindTriggers } from './dialog';
import { buildRequestBody, cleanPhone, parseRetryAfter } from './acciogest';

type PlanConf = { name: string; fee: string; desist: string; endpoint: string | null };
type Labels = { nombre: string; email: string; telefono: string; rgpd: string; desistimiento: string };
type Config = { plans: Record<string, PlanConf>; labels: Labels; privacy: string; thanks: string; wa: string };
type FieldName = keyof Labels;

export type CheckoutResult =
  | { kind: 'redirect'; url: string; mock: boolean }
  | { kind: 'validation'; fields: FieldName[]; message: string }
  | { kind: 'unavailable'; status: number }
  | { kind: 'rate_limited'; retryAfter: number }
  | { kind: 'network'; timeout: boolean }
  | { kind: 'server'; status: number; message: string };

export const CHECKOUT_TIMEOUT_MS = 15_000;
/** Bloqueo mínimo del botón tras un 429 (handoff §3: «el botón se bloquea 60 s»). */
export const RATE_LIMIT_S = 60;
const MOCK_DELAY_MS = 700;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEL_RE = /^[+()\d\s.\-]{6,25}$/;
const FIELDS: FieldName[] = ['nombre', 'email', 'telefono', 'rgpd', 'desistimiento'];

/**
 * ¿Es la `url` de la respuesta 200 una página de Stripe Checkout? Solo https, sin usuario,
 * contraseña ni puerto, y solo en los hosts de CHECKOUT_HOSTS (no vale cualquier *.stripe.com).
 * PREGUNTA ABIERTA (AccioGest): si la cuenta de Stripe usa un dominio propio de Checkout
 * (p. ej. pagos.dominio.es), esa url se rechazaría: habría que añadirlo a CHECKOUT_HOSTS.
 */
const CHECKOUT_HOSTS: readonly string[] = [
  'checkout.stripe.com',
  // Dominio propio de Checkout, solo si AccioGest lo confirma (ver PREGUNTA ABIERTA arriba).
];

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

function normalise(labels: Labels, res: Raw, thanksMock: string | null): CheckoutResult {
  const { status, body } = res;
  const text = (key: string) => (typeof body[key] === 'string' ? (body[key] as string) : '');
  if (status >= 200 && status < 300) {
    if (thanksMock) return { kind: 'redirect', url: thanksMock, mock: true };
    const url = body.url ?? (body.data as Record<string, unknown> | undefined)?.url;
    if (isStripeCheckoutUrl(url)) return { kind: 'redirect', url, mock: false };
    return { kind: 'server', status, message: 'La respuesta no trae una página de pago válida.' };
  }
  if (status === 400) {
    const fields = new Set<FieldName>();
    if (Array.isArray(body.missing_fields)) {
      for (const label of body.missing_fields) {
        const name = typeof label === 'string' ? labelToField(labels, label) : null;
        if (name) fields.add(name);
      }
    }
    for (const match of text('error').matchAll(/["«“]([^"»”]+)["»”]/g)) {
      const name = labelToField(labels, match[1]);
      if (name) fields.add(name);
    }
    return { kind: 'validation', fields: [...fields], message: text('error') || text('message') || 'Faltan campos obligatorios' };
  }
  if (status === 403 || status === 404) return { kind: 'unavailable', status };
  if (status === 429) {
    return { kind: 'rate_limited', retryAfter: Math.max(RATE_LIMIT_S, parseRetryAfter(res.headers.get('Retry-After'), body)) };
  }
  return { kind: 'server', status, message: text('error') || text('message') };
}

async function mockCheckout(labels: Labels, data: Record<string, string>, thanksUrl: string): Promise<CheckoutResult> {
  const forced = (params().get('acciogest_mock') ?? '').trim().toLowerCase();
  console.info('[AccioGest] Modo simulado (plan con ID de ejemplo): no se crea ningún pago. Cuerpo simulado:', buildRequestBody(data));
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  const headers = new Map<string, string>();
  const reply = (status: number, body: Record<string, unknown>) =>
    normalise(labels, { status, headers: { get: (n) => headers.get(n.toLowerCase()) ?? null }, body }, status < 300 ? thanksUrl : null);
  if (forced === 'network') return { kind: 'network', timeout: false };
  if (forced === 'timeout') return { kind: 'network', timeout: true };
  if (forced === '400') return reply(400, { error: 'Faltan campos obligatorios', missing_fields: [labels.desistimiento] });
  if (forced === '400-rgpd') return reply(400, { error: 'Faltan campos obligatorios', missing_fields: [labels.rgpd] });
  if (forced === '400-tel') return reply(400, { error: 'Faltan campos obligatorios', missing_fields: [labels.telefono] });
  if (forced === '403') return reply(403, { error: 'Este formulario no está activo' });
  if (forced === '404') return reply(404, { error: 'Formulario no encontrado' });
  if (forced === '500') return reply(500, { error: 'Error interno' });
  if (forced === 'bad-url') return normalise(labels, { status: 200, headers: { get: () => null }, body: { url: 'https://example.com/pago' } }, null);
  if (forced.startsWith('429')) {
    const s = forced.split('-')[1];
    if (s) headers.set('retry-after', s);
    return reply(429, { error: 'Demasiadas solicitudes. Inténtalo más tarde.' });
  }
  // Como la API: todos obligatorios.
  const missing = Object.values(labels).filter((label) => !data[label]);
  if (missing.length) return reply(400, { error: 'Faltan campos obligatorios', missing_fields: missing });
  return reply(200, { url: thanksUrl });
}

/** Crea la sesión de pago (o la simula si el plan no tiene ID real: endpoint null). */
export async function createCheckoutSession(
  plan: PlanConf,
  labels: Labels,
  data: Record<string, string>,
  mockThanksUrl: string,
  { timeoutMs = CHECKOUT_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<CheckoutResult> {
  if (!plan.endpoint) return mockCheckout(labels, data, mockThanksUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(plan.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(buildRequestBody(data)),
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
  const idleLabel = submitLabel.textContent ?? 'Continuar al pago';
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
        setStatus('La contratación de este plan no está disponible en este momento. Escríbenos por WhatsApp y te ayudamos a contratarlo.', 'error', true);
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
        setStatus('Ha ocurrido un error al preparar el pago. No se ha cobrado nada. Inténtalo de nuevo más tarde o escríbenos por WhatsApp.', 'error', true);
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
      res = await createCheckoutSession(plan, labels, data, thanks);
    } catch {
      res = { kind: 'server', status: 0, message: '' };
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

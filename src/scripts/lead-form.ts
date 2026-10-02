/**
 * Controlador de los formularios de leads (historia, solicitud de servicio, contacto).
 * HTML de src/components/forms/LeadForm.astro; envío con src/scripts/acciogest.ts.
 *
 * - Validación en español a partir de los atributos del HTML: required, type=email,
 *   type=tel, minlength y data-required-when="campo=Valor1|Valor2" (obligatorio si…).
 *   Mensajes propios con data-msg-required / data-msg-email / data-msg-minlength / data-msg-tel.
 * - Honeypot (name="website"): si viene relleno no se envía nada y se finge éxito.
 * - Botón con aria-disabled mientras se envía (el foco no se pierde) y región aria-live.
 * - 201: muestra el `message` de la API y resetea · 400: marca los campos · 403/404: no
 *   disponible + WhatsApp · 429: cuenta atrás con el botón bloqueado · red/timeout: reintentar.
 */
import { submitLead, debugLabels, whatsappLink, type LeadResult, type LeadValues } from './acciogest';
import { FIELD_LABELS, type FormKey } from '~/config/acciogest';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEL_RE = /^[+()\d\s.\-]{6,25}$/;
const HONEYPOT = 'website';

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export interface LeadFormController {
  /** Rellena campos (p. ej. el servicio preseleccionado). */
  preset: (values: Record<string, string>) => void;
  /** Vuelve a mostrar el formulario si se envió con éxito (al cerrar un diálogo). */
  resetIfDone: () => void;
  /** Elemento al que llevar el foco al abrir (título del resultado o null). */
  focusTarget: () => HTMLElement | null;
}

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initLeadForm(rootEl: HTMLElement | null): LeadFormController | null {
  if (!rootEl || rootEl.dataset.leadReady) return null;
  const formEl = rootEl.querySelector<HTMLFormElement>('form[data-lead-form]');
  const formKey = rootEl.dataset.lead as FormKey | undefined;
  if (!formEl || !formKey || !(formKey in FIELD_LABELS)) return null;
  const root: HTMLElement = rootEl;
  const form: HTMLFormElement = formEl;
  root.dataset.leadReady = '1';

  const q = <T extends HTMLElement = HTMLElement>(sel: string, ctx: ParentNode = root) => ctx.querySelector<T>(sel);
  const status = q('[data-form-status]', form)!;
  const submitBtn = q<HTMLButtonElement>('[data-submit]', form)!;
  const submitLabel = q('[data-submit-label]', form)!;
  const result = q('[data-lead-result]');
  const resultTitle = q('[data-result-title]');
  const resultText = q('[data-result-text]');
  const resultMock = q('[data-result-mock]');
  const idleLabel = submitLabel.textContent ?? 'Enviar';
  const waHref = whatsappLink(root.dataset.waText || undefined);

  let attempted = false;
  let sending = false;
  let lockedUntil = 0;
  let lockTimer = 0;
  let completed = false;

  /* ---------- Campos ---------- */
  const names = (): string[] => {
    const set = new Set<string>();
    for (const el of Array.from(form.elements) as Control[]) {
      if (el.name && el.name !== HONEYPOT && el.type !== 'submit' && el.type !== 'button') set.add(el.name);
    }
    return [...set];
  };
  const controlsOf = (name: string): Control[] =>
    (Array.from(form.elements) as Control[]).filter((el) => el.name === name);
  const valueOf = (name: string): string => {
    const controls = controlsOf(name);
    const first = controls[0];
    if (!first) return '';
    if (first instanceof HTMLInputElement && first.type === 'radio') {
      return (controls as HTMLInputElement[]).find((c) => c.checked)?.value ?? '';
    }
    if (first instanceof HTMLInputElement && first.type === 'checkbox') return first.checked ? 'sí' : '';
    return first.value.trim();
  };
  const msg = (el: Control, key: string, fallback: string) => el.dataset[key] || fallback;

  function ruleFor(name: string): string {
    const controls = controlsOf(name);
    const first = controls[0];
    if (!first) return '';
    const value = valueOf(name);
    const required = controls.some((c) => c.required);
    if (!value) {
      if (required) {
        return msg(first, 'msgRequired', first.type === 'checkbox' ? 'Debes marcar esta casilla para continuar.' : 'Este campo es obligatorio.');
      }
      const when = first.dataset.requiredWhen; // «contacto=Teléfono|WhatsApp»
      if (when) {
        const [other, list] = when.split('=');
        if (list?.split('|').includes(valueOf(other))) return msg(first, 'msgRequiredWhen', 'Este campo es obligatorio.');
      }
      return '';
    }
    if (first.type === 'email' && !EMAIL_RE.test(value)) {
      return msg(first, 'msgEmail', 'Escribe un email válido, por ejemplo nombre@dominio.com.');
    }
    if (first.type === 'tel' && !TEL_RE.test(value)) {
      return msg(first, 'msgTel', 'Escribe un teléfono válido (puedes incluir el prefijo, por ejemplo +34).');
    }
    const min = Number(first.getAttribute('minlength') || 0);
    if (min && value.length < min) return msg(first, 'msgMinlength', `Escribe al menos ${min} caracteres.`);
    return '';
  }

  function setFieldError(name: string, message: string) {
    const controls = controlsOf(name);
    controls.forEach((c) => (message ? c.setAttribute('aria-invalid', 'true') : c.removeAttribute('aria-invalid')));
    controls[0]?.closest('fieldset')?.toggleAttribute('data-invalid', Boolean(message));
    const errorEl = q(`[data-error-for="${name}"]`, form);
    if (errorEl) errorEl.textContent = message;
  }
  const validateField = (name: string) => {
    const message = ruleFor(name);
    setFieldError(name, message);
    return !message;
  };
  const clearErrors = () => names().forEach((name) => setFieldError(name, ''));

  function focusField(name: string) {
    const target = controlsOf(name)[0];
    if (!target) return;
    target.focus({ preventScroll: true });
    (target.closest('.field') ?? target).scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
  }

  /* ---------- Estado ---------- */
  function setStatus(text: string, tone: 'error' | 'info' | '' = '', withWhatsApp = false) {
    status.replaceChildren();
    if (tone) status.dataset.tone = tone;
    else delete status.dataset.tone;
    if (!text) return;
    const p = document.createElement('span');
    p.textContent = text;
    status.append(p);
    if (withWhatsApp) {
      const a = document.createElement('a');
      a.href = waHref;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'form-status-link';
      a.textContent = 'Escríbeme por WhatsApp';
      status.append(a);
    }
  }
  const invalidSummary = (n: number) =>
    n === 1 ? 'Revisa el campo marcado antes de enviar.' : `Revisa los ${n} campos marcados antes de enviar.`;

  // Tras un intento fallido, el aviso general se actualiza (o desaparece) al corregir.
  function refreshSummary() {
    const kind = status.dataset.kind;
    if (sending || lockedUntil || (kind !== 'invalid' && kind !== 'server-invalid')) return;
    const remaining = names().filter((name) => ruleFor(name)).length;
    if (kind === 'server-invalid' && remaining) return; // conserva el mensaje de la API
    if (remaining) {
      const text = invalidSummary(remaining);
      if (status.textContent !== text) setStatus(text, 'error');
      status.dataset.kind = 'invalid';
    } else if (kind === 'invalid') {
      setStatus('');
      delete status.dataset.kind;
    }
  }

  function setBusy(busy: boolean) {
    sending = busy;
    submitBtn.setAttribute('aria-busy', String(busy));
    if (busy || lockedUntil) submitBtn.setAttribute('aria-disabled', 'true');
    else submitBtn.removeAttribute('aria-disabled');
    if (!lockedUntil) submitLabel.textContent = busy ? 'Enviando…' : idleLabel;
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
        setStatus('Ya puedes volver a enviar el formulario.', 'info');
        return;
      }
      submitLabel.textContent = `Espera ${left} s`;
    };
    tick();
    lockTimer = window.setInterval(tick, 1000);
  }

  /* ---------- Resultado ---------- */
  function showSuccess(message: string, mock: boolean) {
    completed = true;
    form.reset();
    clearErrors();
    setStatus('');
    attempted = false;
    updateCounters();
    if (resultText) resultText.textContent = message;
    if (resultMock) resultMock.hidden = !mock;
    if (result) {
      form.hidden = true;
      result.hidden = false;
      root.classList.add('is-done');
      const scroller = root.closest('dialog')?.querySelector<HTMLElement>('[data-dialog-scroll]');
      if (scroller) scroller.scrollTop = 0;
      resultTitle?.focus({ preventScroll: true });
      if (!scroller) {
        // El formulario (largo) se sustituye por el resultado (corto): llevarlo a la vista.
        const top = root.getBoundingClientRect().top;
        if (top < 120 || top > window.innerHeight * 0.6) {
          root.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
        }
      }
    } else {
      setStatus(message, 'info');
    }
  }

  function showForm(focusFirst = false) {
    completed = false;
    if (result) result.hidden = true;
    form.hidden = false;
    root.classList.remove('is-done');
    if (focusFirst) (form.querySelector<HTMLElement>('input:not([type=hidden]):not([tabindex="-1"]), select, textarea'))?.focus();
  }

  function handle(res: LeadResult) {
    status.dataset.kind = res.kind;
    switch (res.kind) {
      case 'success':
        showSuccess(res.message, res.mock);
        return;
      case 'validation': {
        const fields = res.fields.filter((name) => controlsOf(name).length);
        fields.forEach((name) => {
          const first = controlsOf(name)[0];
          const apiSaysEmail = first.type === 'email' && /v[aá]lid/i.test(res.message);
          setFieldError(
            name,
            ruleFor(name) ||
              (apiSaysEmail ? msg(first, 'msgEmail', 'Escribe un email válido, por ejemplo nombre@dominio.com.') : 'Revisa este campo.'),
          );
        });
        attempted = true;
        if (fields.length) {
          setStatus(`${res.message}. ${invalidSummary(fields.length)}`.replace('..', '.'), 'error');
          status.dataset.kind = 'server-invalid';
          focusField(fields[0]);
        } else {
          setStatus(`No se ha podido enviar: ${res.message}.`.replace('..', '.'), 'error', true);
        }
        return;
      }
      case 'unavailable':
        setStatus('Este formulario no está disponible en este momento. Mientras tanto, puedes contactarme por WhatsApp.', 'error', true);
        return;
      case 'rate_limited':
        setStatus(
          `Se han hecho demasiados envíos seguidos. Por seguridad, espera ${res.retryAfter} segundos antes de volver a intentarlo.`,
          'error',
        );
        lock(res.retryAfter);
        return;
      case 'network':
        setStatus(
          res.timeout
            ? 'El envío está tardando demasiado y se ha cancelado. Tus datos siguen aquí: inténtalo de nuevo en unos minutos.'
            : 'No se ha podido enviar: parece que hay un problema de conexión. Tus datos siguen aquí: comprueba tu conexión e inténtalo de nuevo.',
          'error',
          true,
        );
        return;
      default:
        setStatus('Ha ocurrido un error al enviar el formulario. Inténtalo de nuevo más tarde.', 'error', true);
    }
  }

  /* ---------- Contadores de caracteres ---------- */
  const counters = Array.from(root.querySelectorAll<HTMLElement>('[data-count-for]'));
  function updateCounters() {
    counters.forEach((c) => {
      const el = controlsOf(c.dataset.countFor!)[0];
      if (el) c.textContent = String(el.value.length);
    });
  }

  /* ---------- Eventos ---------- */
  function onEdit(e: Event) {
    const name = (e.target as Control).name;
    if (e.type === 'input' && counters.length) updateCounters();
    if (!attempted || !name || name === HONEYPOT) return;
    validateField(name);
    // Campos que dependen de este (data-required-when)
    form.querySelectorAll<Control>(`[data-required-when^="${name}="]`).forEach((dep) => validateField(dep.name));
    refreshSummary();
  }
  form.addEventListener('input', onEdit);
  form.addEventListener('change', onEdit);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending || lockedUntil) return;
    attempted = true;
    const invalid = names().filter((name) => !validateField(name));
    if (invalid.length) {
      setStatus(invalidSummary(invalid.length), 'error');
      status.dataset.kind = 'invalid';
      focusField(invalid[0]);
      return;
    }

    const values: LeadValues = {};
    for (const name of Object.keys(FIELD_LABELS[formKey])) {
      const first = controlsOf(name)[0];
      if (!first) continue;
      values[name] = first instanceof HTMLInputElement && first.type === 'checkbox' ? first.checked : valueOf(name);
    }

    // Campo trampa: los bots lo rellenan. No se envía nada y se finge éxito.
    const trap = form.elements.namedItem(HONEYPOT) as HTMLInputElement | null;
    if (trap?.value) {
      setBusy(true);
      await new Promise((r) => setTimeout(r, 600));
      setBusy(false);
      showSuccess(root.dataset.successText || 'Hemos recibido tu mensaje correctamente.', false);
      return;
    }

    setBusy(true);
    setStatus('Enviando…', 'info');
    status.dataset.kind = 'sending';
    let res: LeadResult;
    try {
      res = await submitLead(formKey, values);
    } catch {
      res = { ok: false, kind: 'server', status: 0, mock: false, message: '' };
    }
    setBusy(false);
    handle(res);
  });

  root.querySelectorAll<HTMLElement>('[data-lead-again]').forEach((btn) =>
    btn.addEventListener('click', () => showForm(true)),
  );

  updateCounters();
  void debugLabels(
    formKey,
    names().filter((name) => controlsOf(name).some((c) => c.required)),
  );

  return {
    preset(values) {
      if (completed) showForm();
      for (const [name, value] of Object.entries(values)) {
        const controls = controlsOf(name);
        controls.forEach((c) => {
          if (c instanceof HTMLInputElement && (c.type === 'radio' || c.type === 'checkbox')) c.checked = c.value === value;
          else if (c instanceof HTMLSelectElement) {
            if (Array.from(c.options).some((o) => o.value === value)) c.value = value;
          } else c.value = value;
        });
        if (attempted) validateField(name);
      }
    },
    resetIfDone() {
      if (completed) showForm();
    },
    focusTarget: () => (completed ? resultTitle : null),
  };
}

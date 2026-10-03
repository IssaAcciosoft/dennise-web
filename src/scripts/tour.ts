/**
 * Visita guiada de /servicios/ con driver.js (MIT; este fragmento diferido, con el CSS, pesa
 * ≈ 13 KB gzip).
 *
 * Se carga SOLO al pulsar «¿Te guío?» (import() dinámico desde ServicesTour.astro): ni el JS
 * ni el CSS de driver.js están en la carga inicial. Nunca arranca sola.
 *
 * Recorrido (en el orden de la página, sin saltos atrás): servicios de extranjería en España →
 * asesorías (online / presencial) → orientación académica → Programa Autogestiona (trámites,
 * planes, «Todos los planes incluyen») → Reserva tu asesoría → preguntas
 * frecuentes («¿Tienes dudas?», con el botón «Solicitar información»).
 * Textos: solo hechos de docs/contenido.md y de la propia página (precios desde
 * src/data/servicios.json). Sin plazos ni promesas.
 *
 * Accesibilidad: cada paso es un role="dialog" con título y descripción; el foco va al botón
 * «Siguiente»; Tab queda dentro del paso; ← → para navegar; Esc cierra; al cerrar, el foco
 * vuelve a «¿Te guío?». Movimiento (Emil): tarjeta 200 ms ease-out desde 0,97 y origen en el
 * lado del elemento; foco del escenario 300 ms; con «reducir movimiento», sin desplazamiento
 * suave ni animación del escenario (solo un fundido corto).
 */
import { driver, type DriveStep, type Driver, type PopoverDOM } from 'driver.js';
// CSS como texto (?inline) dentro de este mismo chunk diferido: si se importara como hoja de
// estilos, Astro lo incrustaría en el HTML de /servicios/ (carga inicial).
import driverCss from 'driver.js/dist/driver.css?inline';
import tourCss from '~/styles/tour.css?inline';
import { consultations, autogestiona, immigration, formatAmount, CATALOG } from '~/lib/services';

function injectStyles(): void {
  if (document.getElementById('dg-tour-styles')) return;
  const style = document.createElement('style');
  style.id = 'dg-tour-styles';
  style.textContent = `${driverCss}\n${tourCss}`;
  document.head.append(style);
}

const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const euros = (n: number | undefined) => (n === undefined ? '' : `${formatAmount(n)} €`);
const priceOf = (id: string, modality: string) =>
  consultations.find((c) => c.id === id)?.prices.find((p) => p.modality === modality)?.amount;

/** Móviles: el paso y su tarjeta deben caber a la vez en la pantalla (sin taparse). */
const isNarrow = () => window.matchMedia('(max-width: 599.98px)').matches;

/*
 * En móvil, los bloques altos (trámites, «Todos los planes incluyen») se
 * señalan con un «proxy»: una caja invisible sobre su título y sus primeras filas (las que caben
 * con la tarjeta debajo), para que el bloque resaltado y la tarjeta quepan juntos en la
 * pantalla. Se retiran al cerrar la visita.
 */
const proxies: HTMLElement[] = [];
function proxyFor(selector: string, rows: string, count: number): () => Element {
  let made: HTMLElement | null = null;
  return () => {
    if (made?.isConnected) return made;
    const box = document.querySelector<HTMLElement>(selector);
    const items = box ? Array.from(box.querySelectorAll<HTMLElement>(rows)).slice(0, count) : [];
    if (!box || !items.length) return box ?? document.body;
    const a = box.getBoundingClientRect();
    // Además, que quepa con la tarjeta (≈ 240 px) bajo la cabecera en pantallas bajas.
    const header = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0;
    const room = window.innerHeight - header - 14 - 2 * 10 - 12 - 240;
    const fitting = items.filter((it, i) => i === 0 || it.getBoundingClientRect().bottom - a.top <= room);
    const last = fitting[fitting.length - 1].getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'dg-tour-proxy';
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, {
      position: 'absolute',
      left: `${a.left + window.scrollX}px`,
      top: `${a.top + window.scrollY}px`,
      width: `${a.width}px`,
      height: `${last.bottom - a.top - 6}px`,
      pointerEvents: 'none',
    });
    document.body.append(el);
    proxies.push(el);
    made = el;
    return el;
  };
}

function buildSteps(): DriveStep[] {
  const narrow = isNarrow();
  const main = consultations.find((c) => c.id === 'asesoria-migratoria-60') ?? consultations[0];
  const academic = consultations.find((c) => c.id.startsWith('orientacion'));
  const durations = consultations.filter((c) => c.name === main.name).map((c) => c.duration_label);
  const procedures = autogestiona.procedures;
  const plans = autogestiona.plans;
  const plansText = plans.map((p) => `${p.name} ${euros(p.amount)}`);
  const placeholder = document.querySelector('[data-booking-placeholder]');

  const immServices = immigration.services.map((s) => s.name);
  const steps: (DriveStep | null)[] = [
    {
      element: '[data-tour="extranjeria"]',
      popover: {
        title: immigration.title,
        description: `${immServices.slice(0, 3).join(', ').replace(/, ([A-ZÁÉÍÓÚ])/g, (_, c: string) => `, ${c.toLowerCase()}`)}${immServices.length > 3 ? ` y ${immServices.length - 3} servicios más` : ''}. En cada uno puedes «Solicitar información».`,
      },
    },
    {
      element: `[data-service-id="${main.id}"]`,
      popover: {
        title: 'Asesorías',
        description: `${main.name} de ${durations.join(' o de ')}${academic ? ` y ${lcFirst(academic.name)}` : ''}. Precios por sesión.`,
      },
    },
    {
      element: `[data-service-id="${main.id}"] .price-pair`,
      popover: {
        title: 'Online o presencial',
        description: `Cada asesoría tiene su precio online y presencial. Por ejemplo, ${lcFirst(main.name)} de ${main.duration_label}: ${euros(priceOf(main.id, 'online'))} online o ${euros(priceOf(main.id, 'presencial'))} presencial.`,
      },
    },
    academic
      ? {
          element: narrow ? `[data-service-id="${academic.id}"] .consult-main` : `[data-service-id="${academic.id}"]`,
          popover: {
            title: 'Orientación académica',
            description: `${academic.description ?? ''} ${academic.duration_label}: ${euros(priceOf(academic.id, 'online'))} online o ${euros(priceOf(academic.id, 'presencial'))} presencial.`.trim(),
          },
        }
      : null,
    {
      element: narrow ? proxyFor('[data-tour="tramites"]', '.chip-list li', 99) : '[data-tour="tramites"]',
      popover: {
        title: autogestiona.name,
        description: `${autogestiona.procedures_title}: ${procedures.slice(0, 3).map(lcFirst).join(', ')}${procedures.length > 3 ? ` y ${procedures.length - 3} más` : ''}.`,
      },
    },
    {
      // Móvil: una sola tarjeta (la destacada, si la cliente marca alguna; si no, la primera).
      element: narrow
        ? `[data-tour="planes"] > ${plans.some((p) => p.featured) ? '.plan-card--featured' : 'li:first-child'}`
        : '[data-tour="planes"]',
      popover: {
        title: 'Planes',
        description: `${plansText.slice(0, -1).join(', ')} y ${plansText.at(-1)}, ${CATALOG.tax_label}. Pago seguro con tarjeta.`,
        // Escritorio: encima de las tarjetas (debajo no cabe y driver.js la pondría sobre el
        // plan del centro, tapando su precio).
        side: 'top',
        align: 'center',
      },
    },
    {
      element: narrow ? proxyFor('[data-tour="incluye"]', '.check-list li', 3) : '[data-tour="incluye"]',
      popover: {
        title: autogestiona.includes_title,
        description: `${autogestiona.includes.slice(0, -1).join(', ')} y ${lcFirst(autogestiona.includes.at(-1) ?? '')}.`.replace(/, ([A-ZÁÉÍÓÚ])/g, (_, c: string) => `, ${c.toLowerCase()}`),
      },
    },
    {
      element: '[data-tour="reservar"]',
      popover: {
        title: 'Reserva tu asesoría',
        description: placeholder
          ? 'Solicita tu cita indicando la asesoría que te interesa y si la prefieres online o presencial.'
          : 'Eliges el servicio, el día y la hora de tu asesoría, online o presencial. La asesoría se paga al reservar.',
      },
    },
    {
      element: '[data-tour="preguntas"]',
      popover: {
        title: '¿Tienes dudas?',
        description: 'Aquí tienes las preguntas frecuentes. Y en cada servicio de extranjería y en cada asesoría encontrarás «Solicitar información»: cuéntame qué necesitas y me pondré en contacto contigo.',
      },
    },
  ];
  return steps
    .filter((s): s is DriveStep => Boolean(s && (!s.element || typeof s.element !== 'string' || document.querySelector(s.element))))
    .map((s) => (narrow ? { ...s, popover: { ...s.popover, side: 'bottom' as const, align: 'start' as const } } : s));
}

/** Móvil: posición de scroll que deja el elemento justo bajo la cabecera (la tarjeta va debajo). */
function topUnderHeader(el: Element): number {
  const header = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0;
  return Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - header - 14));
}

function placeUnderHeader(el: Element | undefined): void {
  if (!el || !isNarrow()) return;
  window.scrollTo({ top: topUnderHeader(el), behavior: 'instant' });
}

/**
 * Móvil: antes de pasar de paso, desplaza la página con suavidad hasta el siguiente bloque
 * (en vez de saltar de golpe) y resuelve al terminar. Con movimiento reducido, sin animación.
 */
function glideTo(selector: DriveStep['element'], reduced: boolean): Promise<void> {
  const el = typeof selector === 'string' ? document.querySelector(selector) : null;
  if (!el || !isNarrow()) return Promise.resolve();
  const top = topUnderHeader(el);
  if (Math.abs(window.scrollY - top) < 2) return Promise.resolve();
  if (reduced) {
    window.scrollTo({ top, behavior: 'instant' });
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('scrollend', finish);
      resolve();
    };
    window.addEventListener('scrollend', finish, { once: true });
    window.setTimeout(finish, 1200); // navegadores sin «scrollend»
    window.scrollTo({ top, behavior: 'smooth' });
  });
}

/*
 * driver.js marca el elemento resaltado como disparador de un diálogo (aria-haspopup,
 * aria-expanded, aria-controls). En bloques estáticos (<div>, <dl>…) aria-expanded no está
 * permitido (axe: aria-allowed-attr) y un lector lo anunciaría como desplegable: se retiran.
 * Se llama al pintar la tarjeta y al terminar el resaltado (driver.js los pone entre medias).
 */
const DRIVER_ARIA = ['aria-haspopup', 'aria-expanded', 'aria-controls'] as const;
function stripDriverAria(el: Element | undefined): void {
  if (!el || el.matches('button, a[href], [role="button"]')) return;
  DRIVER_ARIA.forEach((a) => el.removeAttribute(a));
}

let active: Driver | null = null;

export function startTour(trigger: HTMLElement): void {
  if (active?.isActive()) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // La visita es una acción explícita: lo que aún espera su aparición al hacer scroll se
  // muestra ya (si no, el foco del escenario se calcularía con la tarjeta a medio subir).
  document.querySelectorAll<HTMLElement>('[data-reveal-state="pending"]').forEach((el) => {
    el.dataset.revealState = 'done';
  });

  injectStyles();
  const steps = buildSteps();
  let returnFocus: HTMLElement | null = trigger;

  const tour = driver({
    steps,
    popoverClass: 'dg-tour',
    showProgress: true,
    progressText: '{{current}} de {{total}}',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    doneBtnText: 'Terminar',
    allowClose: true,
    allowKeyboardControl: true,
    overlayClickBehavior: 'close',
    overlayColor: '#2C0A32',
    overlayOpacity: 0.5,
    stagePadding: 10,
    stageRadius: 20,
    popoverOffset: 12,
    animate: !reduced,
    smoothScroll: !reduced,
    duration: 300,
    onHighlightStarted: (el) => placeUnderHeader(el),
    // Móvil: desplazamiento suave entre pasos; la tarjeta se oculta mientras la página se mueve.
    onNextClick: (_el, _step, { driver: d }) => {
      const i = d.getActiveIndex() ?? 0;
      if (!isNarrow() || i >= steps.length - 1) return d.moveNext();
      document.body.classList.add('dg-tour-moving');
      glideTo(steps[i + 1].element, reduced).then(() => {
        document.body.classList.remove('dg-tour-moving');
        d.moveNext();
      });
    },
    onPrevClick: (_el, _step, { driver: d }) => {
      const i = d.getActiveIndex() ?? 0;
      if (!isNarrow() || i <= 0) return d.movePrevious();
      document.body.classList.add('dg-tour-moving');
      glideTo(steps[i - 1].element, reduced).then(() => {
        document.body.classList.remove('dg-tour-moving');
        d.movePrevious();
      });
    },
    onHighlighted: (el) => {
      stripDriverAria(el);
      // Si hubo desplazamiento durante la transición, driver.js recoloca la tarjeta con el
      // elemento del paso ANTERIOR (estado aún sin actualizar) y no vuelve a hacerlo al terminar:
      // la tarjeta podía quedar sobre el bloque nuevo. refresh() (en el siguiente frame) la
      // recoloca con el elemento y el lado del paso actual.
      tour.refresh();
    },
    onPopoverRender: (popover: PopoverDOM, { state }) => {
      stripDriverAria(state.activeElement);
      // driver.js pinta el título en un <header id="driver-popover-title"> (nombre del diálogo
      // por aria-labelledby). role="heading" no está permitido en <header>: dentro, un <h2> real.
      const heading = document.createElement('h2');
      heading.className = 'dg-tour-title-text';
      heading.textContent = popover.title.textContent;
      popover.title.replaceChildren(heading);
      // Y el <header> suelto en <body> no debe ser un segundo «banner» de la página.
      popover.title.setAttribute('role', 'none');
      // <footer> suelto en <body>: no es una región de la página.
      popover.footer.setAttribute('role', 'group');
      popover.closeButton.setAttribute('aria-label', 'Cerrar la visita guiada');
      popover.closeButton.innerHTML =
        '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/></svg>';
      popover.wrapper.setAttribute('aria-modal', 'false');
      const isLast = state.activeIndex === steps.length - 1;
      if (isLast) {
        const cta = document.createElement('button');
        cta.type = 'button';
        cta.className = 'dg-tour-cta';
        cta.textContent = 'Solicitar información';
        cta.addEventListener('click', () => {
          returnFocus = trigger;
          tour.destroy();
          // Abre el diálogo «Solicitar información» (ServiceRequestDialog); al cerrarlo, el foco
          // vuelve a «¿Te guío?».
          document.dispatchEvent(new CustomEvent('dg:service-request', { detail: { trigger } }));
        });
        popover.description.after(cta);
      }
      // driver.js enfoca el primer botón (cerrar): mejor «Siguiente» (o la acción final).
      window.setTimeout(() => {
        const target = isLast ? popover.wrapper.querySelector<HTMLElement>('.dg-tour-cta') : popover.nextButton;
        target?.focus({ preventScroll: true });
      }, 0);
    },
    onDestroyed: () => {
      document.body.classList.remove('dg-tour-moving');
      active = null;
      proxies.splice(0).forEach((el) => el.remove());
      document.documentElement.removeAttribute('data-tour-active');
      returnFocus?.focus({ preventScroll: true });
    },
  });

  active = tour;
  document.documentElement.setAttribute('data-tour-active', '');
  tour.drive();
}

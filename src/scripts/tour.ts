/**
 * Visita guiada de /servicios/ con driver.js (MIT, ~7 KB gzip + 1 KB de CSS).
 *
 * Se carga SOLO al pulsar «¿Te guío?» (import() dinámico desde ServicesTour.astro): ni el JS
 * ni el CSS de driver.js están en la carga inicial. Nunca arranca sola.
 *
 * Recorrido (en el orden de la página, sin saltos atrás): asesorías (online / presencial) →
 * orientación académica → Programa Autogestiona (trámites, planes, «¿Cómo funciona?»,
 * «Todos los planes incluyen») → Reserva tu asesoría → «Solicitar información».
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
import { consultations, autogestiona, formatAmount, CATALOG } from '~/lib/services';

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

function buildSteps(): DriveStep[] {
  const main = consultations.find((c) => c.id === 'asesoria-migratoria-60') ?? consultations[0];
  const academic = consultations.find((c) => c.id.startsWith('orientacion'));
  const durations = consultations.filter((c) => c.name === main.name).map((c) => c.duration_label);
  const procedures = autogestiona.procedures;
  const plans = autogestiona.plans;
  const plansText = plans.map((p) => `${p.name} ${euros(p.amount)}`);
  const placeholder = document.querySelector('[data-booking-placeholder]');

  const steps: (DriveStep | null)[] = [
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
          element: `[data-service-id="${academic.id}"]`,
          popover: {
            title: 'Orientación académica',
            description: `${academic.description ?? ''} ${academic.duration_label}: ${euros(priceOf(academic.id, 'online'))} online o ${euros(priceOf(academic.id, 'presencial'))} presencial.`.trim(),
          },
        }
      : null,
    {
      element: '[data-tour="tramites"]',
      popover: {
        title: autogestiona.name,
        description: `${autogestiona.procedures_title}: ${procedures.slice(0, 3).map(lcFirst).join(', ')}${procedures.length > 3 ? ` y ${procedures.length - 3} más` : ''}.`,
      },
    },
    {
      element: '[data-tour="planes"]',
      popover: {
        title: 'Planes',
        description: `${plansText.slice(0, -1).join(', ')} y ${plansText.at(-1)}, ${CATALOG.tax_label}. Pago seguro con tarjeta.`,
      },
    },
    {
      // Mismo orden que «¿Cómo funciona?» (Autogestiona.astro)
      element: '[data-tour="como-funciona"]',
      popover: {
        title: '¿Cómo funciona?',
        description:
          'Eliges tu plan y realizas el pago de forma segura. Después vienen la asesoría inicial con un experto en extranjería, la cumplimentación de los formularios y la presentación del expediente.',
      },
    },
    {
      element: '[data-tour="incluye"]',
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
      popover: {
        title: '¿Tienes dudas?',
        description: 'En cada servicio encontrarás «Solicitar información»: cuéntame qué necesitas y me pondré en contacto contigo.',
      },
    },
  ];
  return steps.filter((s): s is DriveStep => Boolean(s && (!s.element || document.querySelector(String(s.element)))));
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
    onPopoverRender: (popover: PopoverDOM, { state }) => {
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
      active = null;
      document.documentElement.removeAttribute('data-tour-active');
      returnFocus?.focus({ preventScroll: true });
    },
  });

  active = tour;
  document.documentElement.setAttribute('data-tour-active', '');
  tour.drive();
}

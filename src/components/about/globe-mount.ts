/**
 * Globo 3D de Conóceme (WebGL con cobe): México, España y Nueva York. Sin React: lo carga el
 * <script> de GlobeSlot.astro con import() cuando la caja se acerca a la pantalla, y solo sin
 * «reducir movimiento» (≈ 8 KB gzip con cobe; antes, como isla de React, ≈ 75 KB).
 *
 * Va encima del póster estático (GlobeSlot.astro), que es el mismo globo renderizado con la
 * misma vista (scripts/render-globe-poster.mjs). Por eso:
 * - antes de cargar, sin JavaScript, sin WebGL o con «reducir movimiento» se ve el póster;
 * - al montar, el lienzo se funde sobre el póster sin salto (mismo encuadre, mismo tamaño).
 *
 * Rendimiento (README → Globo 3D):
 * - El contexto WebGL se crea en un momento ocioso (lo decide GlobeSlot.astro).
 * - Bucle propio con requestAnimationFrame (cobe 2 no tiene bucle): ~30 fps en reposo (el
 *   vaivén es lentísimo), fotogramas completos solo al arrastrar; se detiene fuera de pantalla
 *   y con la pestaña oculta.
 * - Densidad de píxeles ≤ 2. Las etiquetas HTML se mueven con transform (sin layout).
 * - cobe inserta una <style> que reescribe en cada fotograma (para anclar elementos con CSS
 *   Anchor Positioning, que no usamos): se retira del documento → sin recálculo de estilos.
 *
 * Movimiento (Emil Kowalski): vaivén lento y lineal en el tiempo (movimiento constante), los
 * tres lugares siempre a la vista. Arrastrar en horizontal lo gira (captura del puntero,
 * inercia con rozamiento); al soltar, tras una pausa, vuelve con suavidad a su vista.
 * En táctil, el gesto vertical sigue desplazando la página (touch-action: pan-y).
 * El vaivén automático se frena y se detiene a los 5 s sin interacción (WCAG 2.2.2); al
 * arrastrar vuelve a moverse.
 */
import createGlobe from 'cobe';
import { PLACES, VIEW, cobeOptions, project } from './globe-config';

const IDLE_FRAME_MS = 1000 / 30 - 2;
const RETURN_AFTER_MS = 2200;
const MAX_VELOCITY = 0.005; // rad/ms (un golpe rápido no lo hace girar sin control)
const IDLE_SWAY_MS = 5000; // vaivén automático sin interacción antes de detenerse (WCAG 2.2.2)
const SETTLE_MS = 1500; // tramo final en el que el vaivén se frena

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function mountGlobe(host: HTMLElement, slot: HTMLElement | null): (() => void) | undefined {
  const canvas = document.createElement('canvas');
  canvas.className = 'globe-canvas';
  host.append(canvas);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let size = Math.round(host.getBoundingClientRect().width) || 480;
  const headBefore = new Set(Array.from(document.head.children));

  let globe: ReturnType<typeof createGlobe>;
  try {
    globe = createGlobe(canvas, { ...cobeOptions(), devicePixelRatio: dpr, width: size, height: size });
  } catch {
    canvas.remove();
    return undefined;
  }
  // La <style> que cobe reescribe en cada fotograma: fuera del documento.
  for (const el of Array.from(document.head.children)) if (!headBefore.has(el) && el.tagName === 'STYLE') el.remove();
  // cobe envuelve el lienzo en un <div>: es lo que hay que retirar al desmontar.
  const wrapper = canvas.parentElement && canvas.parentElement !== host ? canvas.parentElement : canvas;
  wrapper.classList.add('globe-gl-wrap');

  const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
  if (!gl) {
    globe.destroy();
    wrapper.remove();
    return undefined; // sin WebGL: se queda el póster
  }

  // Etiquetas (HTML del póster): se desplazan con transform respecto a su posición inicial.
  const labels = PLACES.map((place) => ({
    place,
    el: slot?.querySelector<HTMLElement>(`[data-globe-label="${place.id}"]`) ?? null,
    base: project(place.location, VIEW.phi, VIEW.theta),
  }));
  const placeLabels = (phi: number) => {
    for (const l of labels) {
      if (!l.el) continue;
      const q = project(l.place.location, phi, VIEW.theta);
      l.el.style.transform = `translate3d(${((q.x - l.base.x) * size).toFixed(2)}px, ${((q.y - l.base.y) * size).toFixed(2)}px, 0)`;
      l.el.style.opacity = smoothstep(0, 0.18, q.z).toFixed(3); // se apaga al pasar detrás
    }
  };

  // Estado del movimiento
  let raf = 0;
  let last = 0;
  let lastDraw = -Infinity;
  let clock = 0; // tiempo acumulado solo mientras se anima (sin saltos al volver)
  let offset = 0;
  let velocity = 0;
  let dragging = false;
  let pointerId = -1;
  let lastX = 0;
  let lastMove = 0;
  let lastInteraction = -Infinity;
  let inView = true;
  let pageVisible = document.visibilityState !== 'hidden';
  let shown = false;
  let frames = 0;
  let swayed = 0; // ms de vaivén automático desde la última interacción
  let settled = false;

  const draw = (now: number) => {
    const phi = VIEW.phi + VIEW.sway * Math.sin((clock / VIEW.swayPeriod) * Math.PI * 2) + offset;
    globe.update({ phi });
    placeLabels(phi);
    lastDraw = now;
    // La textura del mapa llega unos fotogramas después: entonces se funde sobre el póster.
    if (!shown && ++frames > 6) {
      shown = true;
      slot?.setAttribute('data-globe', 'live');
    }
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(now - last, 64);
    last = now;
    const active = dragging || Math.abs(velocity) > 1e-5 || Math.abs(offset) > 1e-4 || !shown;
    // Vaivén: a velocidad 1 hasta acercarse a IDLE_SWAY_MS; luego se frena (smoothstep) hasta 0.
    if (!active) swayed += dt;
    const rate = 1 - smoothstep(IDLE_SWAY_MS - SETTLE_MS, IDLE_SWAY_MS, swayed);
    clock += dt * rate;
    if (!active && rate <= 0) {
      draw(now);
      settled = true;
      cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    if (!active && now - lastDraw < IDLE_FRAME_MS) return;

    if (!dragging) {
      if (Math.abs(velocity) > 1e-5) {
        offset += velocity * dt;
        velocity *= Math.pow(0.93, dt / 16.67); // rozamiento
        if (Math.abs(velocity) <= 1e-5) {
          velocity = 0;
          lastInteraction = now;
        }
      } else if (offset !== 0 && now - lastInteraction > RETURN_AFTER_MS) {
        offset = wrapAngle(offset); // por el camino corto
        offset *= Math.exp(-dt / 700); // vuelta suave a la vista inicial
        if (Math.abs(offset) < 1e-4) offset = 0;
      }
    }
    draw(now);
  };

  const sync = () => {
    const run = inView && pageVisible && !settled;
    if (run && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  });
  io.observe(host);
  const onVisibility = () => {
    pageVisible = document.visibilityState !== 'hidden';
    sync();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const ro = new ResizeObserver(([entry]) => {
    const next = Math.round(entry.contentRect.width);
    if (next > 0 && next !== size) {
      size = next;
      globe.update({ width: size, height: size });
      draw(performance.now());
    }
  });
  ro.observe(host);

  // Arrastre horizontal (ratón, lápiz o dedo)
  const onDown = (e: PointerEvent) => {
    if (dragging || (e.pointerType === 'mouse' && e.button !== 0)) return; // un solo puntero
    dragging = true;
    pointerId = e.pointerId;
    lastX = e.clientX;
    lastMove = e.timeStamp;
    velocity = 0;
    canvas.setPointerCapture(e.pointerId);
    slot?.setAttribute('data-dragging', '');
    // La interacción vuelve a poner en marcha el bucle (y el vaivén, otros 5 s como mucho).
    swayed = 0;
    if (settled) {
      settled = false;
      sync();
    }
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== pointerId) return;
    const delta = ((e.clientX - lastX) / size) * Math.PI; // todo el ancho = media vuelta
    const dt = Math.max(1, e.timeStamp - lastMove);
    offset += delta;
    velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity * 0.2 + (delta / dt) * 0.8));
    lastX = e.clientX;
    lastMove = e.timeStamp;
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = -1;
    if (e.timeStamp - lastMove > 80) velocity = 0; // se detuvo antes de soltar: sin inercia
    lastInteraction = performance.now();
    swayed = 0;
    slot?.removeAttribute('data-dragging');
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  // Si el navegador retira el contexto WebGL, vuelve el póster.
  const onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    slot?.removeAttribute('data-globe');
  };
  canvas.addEventListener('webglcontextlost', onLost);

  draw(performance.now());
  sync();

  return () => {
    cancelAnimationFrame(raf);
    raf = 0;
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onLost);
    slot?.removeAttribute('data-globe');
    slot?.removeAttribute('data-dragging');
    for (const l of labels) {
      l.el?.style.removeProperty('transform');
      l.el?.style.removeProperty('opacity');
    }
    globe.destroy();
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    wrapper.remove();
  };
}

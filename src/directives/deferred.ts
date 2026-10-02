/**
 * Directiva de hidratación propia: `client:deferred={{ … }}` (registrada en astro.config.mjs).
 * Decide ANTES de descargar la isla (React + su código), no después:
 *
 *   media      — solo si coincide la media query (p. ej. '(min-width: 768px)'); si cambia
 *                después (girar la tableta), se hidrata entonces.
 *   motion     — true: con «reducir movimiento» no se hidrata nunca (queda el HTML / póster).
 *   on         — 'idle' (por defecto): tras el evento load y en un momento ocioso, fuera de la
 *                ventana del LCP · 'visible': cuando la isla se acerca a la pantalla.
 *   rootMargin — margen del IntersectionObserver con on: 'visible'.
 *
 * Sustituye a client:media en Empoderando Voces: en escritorio client:media se comporta como
 * client:load (React, ogl y la aurora competían con la imagen LCP y las tipografías).
 */
import type { ClientDirective } from 'astro';

interface Options {
  media?: string;
  motion?: boolean;
  on?: 'idle' | 'visible';
  rootMargin?: string;
}

const deferred: ClientDirective = (load, opts, el) => {
  const o: Options = typeof opts.value === 'object' && opts.value ? (opts.value as Options) : {};
  if (o.motion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let started = false;
  const go = async () => {
    if (started) return;
    started = true;
    const hydrate = await load();
    await hydrate();
  };

  const schedule = () => {
    if (o.on === 'visible' && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io.disconnect();
          void go();
        },
        { rootMargin: o.rootMargin ?? '0px' },
      );
      for (const child of Array.from(el.children)) io.observe(child);
      return;
    }
    const idle = () => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => void go(), { timeout: 3000 });
      else window.setTimeout(() => void go(), 300);
    };
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true });
  };

  if (!o.media) {
    schedule();
    return;
  }
  const mq = window.matchMedia(o.media);
  if (mq.matches) {
    schedule();
    return;
  }
  const onChange = () => {
    if (!mq.matches) return;
    mq.removeEventListener('change', onChange);
    schedule();
  };
  mq.addEventListener('change', onChange);
};

export default deferred;

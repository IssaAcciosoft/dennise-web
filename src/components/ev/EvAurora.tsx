/**
 * Fondo vivo de la cabecera de Empoderando Voces: aurora WebGL (React Bits · Aurora) en
 * ciruela y oro, sobre el póster estático de CSS (.ev-hero-bg).
 * - Isla con client:deferred (≥ 768 px, tras load y en un momento ocioso; en móvil y con
 *   «reducir movimiento» no se descarga). La aurora y ogl llegan aparte (import() diferido) y
 *   el contexto WebGL se crea cuando termina la View Transition de llegada (no le roba
 *   fotogramas al morph ni compite con el LCP).
 * - Se pausa fuera de pantalla y con la pestaña oculta; media resolución y 30 fps.
 * - Se detiene sola, con suavidad, a los 5 s (WCAG 2.2.2: nada se mueve indefinidamente junto
 *   al contenido sin un control para pararlo).
 * - El lienzo aparece con un fundido largo (decorativo) cuando ya hay un primer fotograma.
 */
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useInView, usePageVisible, usePrefersReducedMotion } from '../islands/hooks';

const Aurora = lazy(() => import('../react-bits/Aurora/Aurora'));
const SETTLE_AFTER_MS = 5000;

const STOPS: [string, string, string] = ['#5E2470', '#A04C9C', '#D9AE63'];

export default function EvAurora() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref);
  const visible = usePageVisible();
  const [ready, setReady] = useState(false);
  // Si se llegó con una View Transition, no crear el contexto WebGL hasta que termine.
  const [afterTransition, setAfterTransition] = useState(false);
  useEffect(() => {
    let alive = true;
    let idleId = 0;
    const pending = window.__evTransition;
    (pending ?? Promise.resolve()).then(() => {
      // Y además en un momento ocioso: el contexto WebGL nunca compite con la carga.
      const start = () => alive && setAfterTransition(true);
      if (typeof window.requestIdleCallback === 'function') idleId = window.requestIdleCallback(start, { timeout: 1500 });
      else idleId = globalThis.setTimeout(start, 300) as unknown as number;
    });
    return () => {
      alive = false;
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
      else globalThis.clearTimeout(idleId);
    };
  }, []);

  return (
    <div ref={ref} className="ev-aurora" data-ready={ready ? '' : undefined} aria-hidden="true">
      {!reduced && afterTransition && (
        <Suspense fallback={null}>
          <Aurora
            colorStops={STOPS}
            amplitude={0.85}
            blend={0.65}
            speed={0.45}
            dpr={0.5}
            fps={30}
            settleAfter={SETTLE_AFTER_MS}
            paused={!inView || !visible}
            onReady={() => setReady(true)}
          />
        </Suspense>
      )}
    </div>
  );
}

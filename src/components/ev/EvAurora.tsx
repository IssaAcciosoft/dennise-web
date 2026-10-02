/**
 * Fondo vivo de la cabecera de Empoderando Voces: aurora WebGL (React Bits · Aurora) en
 * ciruela y oro, sobre el póster estático de CSS (.ev-hero-bg).
 * - Isla con client:media (≥ 768 px; en móvil no se carga). El contexto WebGL se crea en un
 *   momento ocioso y, si se llega con una View Transition, cuando esta termina (no le roba
 *   fotogramas al morph ni compite con el LCP).
 * - Con «reducir movimiento» no se monta (queda el póster); se pausa fuera de pantalla y
 *   con la pestaña oculta; media resolución y 30 fps.
 * - El lienzo aparece con un fundido largo (decorativo) cuando ya hay un primer fotograma.
 */
import { useEffect, useRef, useState } from 'react';
import Aurora from '../react-bits/Aurora/Aurora';
import { useInView, usePageVisible, usePrefersReducedMotion } from '../islands/hooks';

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
    const pending = (window as Window & { __evTransition?: Promise<unknown> }).__evTransition;
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
        <Aurora
          colorStops={STOPS}
          amplitude={0.85}
          blend={0.65}
          speed={0.45}
          dpr={0.5}
          fps={30}
          paused={!inView || !visible}
          onReady={() => setReady(true)}
        />
      )}
    </div>
  );
}

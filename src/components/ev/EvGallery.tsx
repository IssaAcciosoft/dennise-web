/**
 * Galería inmersiva de Empoderando Voces (React Bits · CircularGallery, WebGL con ogl).
 *
 * Mejora progresiva sobre la lista estática que pinta Astro ([data-ev-strip], con <img> y
 * texto alternativo): antes de hidratar, sin JavaScript, sin WebGL o con «reducir movimiento»
 * esa lista es la galería (desplazable con el dedo, el trackpad o el teclado).
 * Cuando la primera foto está en la GPU, el lienzo se funde encima y la lista pasa a ser solo
 * para lectores de pantalla (sigue en el árbol de accesibilidad; deja de ser enfocable).
 * Botones «anterior / siguiente» siempre visibles y una región aria-live que anuncia la foto.
 * El lienzo no anima nada en reposo (sin rAF permanente) y solo se mueve con el gesto.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import CircularGallery, { type CircularGalleryHandle, type GalleryItem } from '../react-bits/CircularGallery/CircularGallery';
import { usePrefersReducedMotion } from '../islands/hooks';

interface Props {
  items: GalleryItem[];
}

const Arrow = ({ dir }: { dir: 'prev' | 'next' }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      d={dir === 'next' ? 'M5 12h14M13 6l6 6-6 6' : 'M19 12H5M11 6l-6 6 6 6'}
    />
  </svg>
);

export default function EvGallery({ items }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<CircularGalleryHandle>(null);
  const reduced = usePrefersReducedMotion(); // true en SSR y primer render: monta WebGL después
  const [glOn, setGlOn] = useState(false);
  const [index, setIndex] = useState(0);
  const [announce, setAnnounce] = useState('');
  const interacted = useRef(false);
  const n = items.length;

  const host = () => layerRef.current?.closest<HTMLElement>('[data-ev-gallery]') ?? null;

  useEffect(() => {
    const el = host();
    if (!el) return;
    el.toggleAttribute('data-gl', glOn);
    const strip = el.querySelector<HTMLElement>('[data-ev-strip]');
    if (!strip) return;
    if (glOn) strip.removeAttribute('tabindex');
    else strip.setAttribute('tabindex', '0');
  }, [glOn]);

  const onIndexChange = useCallback(
    (i: number) => {
      setIndex(i);
      if (interacted.current) setAnnounce(`Foto ${i + 1} de ${n}: ${items[i]?.text ?? ''}`);
    },
    [items, n],
  );

  const step = (delta: number) => {
    interacted.current = true;
    if (glOn) {
      galleryRef.current?.go(delta);
      return;
    }
    const strip = host()?.querySelector<HTMLElement>('[data-ev-strip]');
    if (!strip) return;
    const first = strip.querySelector<HTMLElement>('li');
    const gap = parseFloat(getComputedStyle(strip).columnGap) || 0;
    const w = first ? first.getBoundingClientRect().width + gap : strip.clientWidth * 0.8;
    const target = Math.max(0, Math.min(n - 1, Math.round(strip.scrollLeft / w) + delta));
    strip.scrollTo({ left: target * w, behavior: reduced ? 'auto' : 'smooth' });
    setAnnounce(`Foto ${target + 1} de ${n}: ${items[target]?.text ?? ''}`);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    }
  };

  return (
    <>
      <div ref={layerRef} className="ev-gallery-gl" aria-hidden="true">
        {!reduced && (
          <CircularGallery
            ref={galleryRef}
            items={items}
            bend={2.4}
            textColor="#E9D8EC"
            font={'italic 500 56px "Cormorant Garamond"'}
            borderRadius={0.02}
            planeHeight={0.66}
            offsetY={0.085}
            scrollEase={0.075}
            onReady={() => setGlOn(true)}
            onIndexChange={onIndexChange}
          />
        )}
      </div>
      <div className="ev-gallery-controls" onKeyDown={onKey}>
        <p className="ev-gallery-hint">
          <span className="ev-gallery-count" aria-hidden="true">
            {glOn ? `${String(index + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}` : `${String(n).padStart(2, '0')} fotos`}
          </span>
          <span>{glOn ? 'Arrastra o usa las flechas' : 'Desliza para ver más'}</span>
        </p>
        <div className="ev-gallery-buttons">
          <button type="button" className="ev-gallery-btn" onClick={() => step(-1)} aria-label="Foto anterior">
            <Arrow dir="prev" />
          </button>
          <button type="button" className="ev-gallery-btn" onClick={() => step(1)} aria-label="Foto siguiente">
            <Arrow dir="next" />
          </button>
        </div>
        <p className="visually-hidden" aria-live="polite">
          {announce}
        </p>
      </div>
    </>
  );
}

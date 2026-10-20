/**
 * Galería inmersiva de Empoderando Voces (React Bits · CircularGallery, WebGL con ogl).
 *
 * Mejora progresiva sobre la lista estática que pinta Astro ([data-ev-strip], con <img> y
 * texto alternativo): antes de hidratar, sin JavaScript, sin WebGL, con «reducir movimiento»
 * o por debajo de 480 px esa lista es la galería (desplazable con el dedo, el trackpad o el teclado).
 * Cuando la primera foto está en la GPU, el lienzo se funde encima y la lista pasa a ser solo
 * para lectores de pantalla (sigue en el árbol de accesibilidad; deja de ser enfocable).
 * Botones «anterior / siguiente» siempre visibles y una región aria-live que anuncia la foto.
 * El lienzo no anima nada en reposo (sin rAF permanente) y solo se mueve con el gesto.
 *
 * Rendimiento: CircularGallery y ogl se descargan aparte (import() diferido) y SOLO sin
 * «reducir movimiento» (con él, la isla solo aporta los botones y el anuncio). Las texturas son
 * los mismos archivos que ya eligió cada <img> de la lista (currentSrc: AVIF o WebP, 450 o
 * 600 px según la pantalla): una sola descarga por foto.
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { CircularGalleryHandle, GalleryItem } from '../react-bits/CircularGallery/CircularGallery';
import { usePrefersReducedMotion } from '../islands/hooks';

const CircularGallery = lazy(() => import('../react-bits/CircularGallery/CircularGallery'));

/** `wideHidden`: la foto ya está en la portada en escritorio (≥ 960 px); allí no se repite en
 *  la galería (la lista estática la oculta con CSS: li[data-wide-hidden]). */
export type EvGalleryItem = GalleryItem & { wideHidden?: boolean };
interface Props {
  items: EvGalleryItem[];
}

const WIDE = '(min-width: 960px)';
const NARROW = '(max-width: 479.98px)';
const useMedia = (query: string) => {
  const [on, setOn] = useState(false); // false en SSR y primer render
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setOn(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);
  return on;
};

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
  const wide = useMedia(WIDE);
  // Móvil: sin WebGL (ver abajo); la lista estática es la galería.
  const narrow = useMedia(NARROW);
  const list = useMemo(() => (wide ? items.filter((it) => !it.wideHidden) : items), [items, wide]);
  const n = list.length;

  const host = () => layerRef.current?.closest<HTMLElement>('[data-ev-gallery]') ?? null;

  // Texturas: el archivo que el navegador eligió para cada foto de la lista (srcset).
  const [glItems, setGlItems] = useState<GalleryItem[] | null>(null);
  useEffect(() => {
    // Móvil (< 480 px): la lista con scroll-snap ES la galería (foto ≈ 80 % del ancho). La curva
    // WebGL dejaba la foto central en ≈ 62 % y su relevo se veía como doble imagen.
    if (reduced || window.matchMedia(NARROW).matches) {
      setGlItems(null);
      return;
    }
    const all = Array.from(host()?.querySelectorAll<HTMLImageElement>('[data-ev-strip] img') ?? []);
    const isWide = window.matchMedia(WIDE).matches;
    const keep = (it: EvGalleryItem) => !(isWide && it.wideHidden);
    const shown = items.filter(keep);
    if (all.length !== items.length) {
      setGlItems(shown.map(({ image, text }) => ({ image, text })));
      return;
    }
    const imgs = all.filter((_, i) => keep(items[i]));
    let alive = true;
    const urlOf = (img: HTMLImageElement, i: number) =>
      new Promise<string>((resolve) => {
        const done = () => resolve(img.currentSrc || shown[i].image);
        if (img.complete && img.naturalWidth) return done();
        img.loading = 'eager'; // la galería las necesita todas: que no esperen al scroll
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', () => resolve(shown[i].image), { once: true });
      });
    Promise.all(imgs.map(urlOf)).then((urls) => {
      if (alive) setGlItems(shown.map((item, i) => ({ text: item.text, image: urls[i] })));
    });
    return () => {
      alive = false;
    };
  }, [reduced, items, wide, narrow]);

  // Si la ventana pasa a móvil con el lienzo ya montado, se vuelve a la lista.
  useEffect(() => {
    if (narrow) setGlOn(false);
  }, [narrow]);

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
      if (interacted.current) setAnnounce(`Foto ${i + 1} de ${n}: ${list[i]?.text ?? ''}`);
    },
    [list, n],
  );

  const step = (delta: number) => {
    interacted.current = true;
    if (glOn) {
      galleryRef.current?.go(delta);
      return;
    }
    const strip = host()?.querySelector<HTMLElement>('[data-ev-strip]');
    if (!strip) return;
    const first = Array.from(strip.querySelectorAll<HTMLElement>('li')).find((li) => li.offsetWidth > 0);
    const gap = parseFloat(getComputedStyle(strip).columnGap) || 0;
    const w = first ? first.getBoundingClientRect().width + gap : strip.clientWidth * 0.8;
    const target = Math.max(0, Math.min(n - 1, Math.round(strip.scrollLeft / w) + delta));
    strip.scrollTo({ left: target * w, behavior: reduced ? 'auto' : 'smooth' });
    setAnnounce(`Foto ${target + 1} de ${n}: ${list[target]?.text ?? ''}`);
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
        {!reduced && !narrow && glItems && (
          <Suspense fallback={null}>
            <CircularGallery
              ref={galleryRef}
              items={glItems}
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
          </Suspense>
        )}
      </div>
      <div className="ev-gallery-controls" onKeyDown={onKey}>
        <p className="ev-gallery-hint">
          <span className="ev-gallery-count" aria-hidden="true">
            {glOn ? `${String(index + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}` : `${n} fotos`}
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

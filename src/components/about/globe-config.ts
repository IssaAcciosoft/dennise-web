/**
 * Globo de Conóceme (México · España · Nueva York): datos, vista y colores compartidos por
 * - la isla WebGL (Globe.tsx, cobe),
 * - las etiquetas HTML y el póster estático (GlobeSlot.astro),
 * - el generador del póster (scripts/render-globe-poster.mjs → src/assets/globe-poster.png).
 * Si cambias la vista o los colores, regenera el póster: `npm run globe-poster`.
 *
 * Sin sintaxis exclusiva de TypeScript (enums, etc.): Node lo importa directamente.
 */

export type LatLon = [number, number];

export interface Place {
  id: 'mx' | 'es' | 'ny';
  label: string;
  location: LatLon;
  /** Lado de la etiqueta respecto al punto. */
  side: 'below' | 'above' | 'left' | 'right';
}

/** Ciudad de México, Madrid y Nueva York (docs/contenido.md: «México · España · Nueva York»). */
export const PLACES: Place[] = [
  { id: 'mx', label: 'México', location: [19.4326, -99.1332], side: 'below' },
  { id: 'ny', label: 'Nueva York', location: [40.7128, -74.006], side: 'left' },
  { id: 'es', label: 'España', location: [40.4168, -3.7038], side: 'below' },
];

const at = (id: Place['id']) => PLACES.find((p) => p.id === id)!.location;

/** Arcos: México → España y España → Nueva York. */
export const ARCS: { from: LatLon; to: LatLon }[] = [
  { from: at('mx'), to: at('es') },
  { from: at('es'), to: at('ny') },
];

/** Vista inicial (= póster): centrada en el Atlántico norte, inclinada hacia el norte. */
export const VIEW = {
  phi: -0.66,
  theta: 0.5,
  /** Vaivén automático (rad) y su periodo (ms): los tres lugares siempre a la vista. */
  sway: 0.24,
  swayPeriod: 28000,
};

/** Colores de marca en 0–1 (cobe): globo marfil/lavanda, puntos malva, marcas ciruela. */
export const STYLE = {
  dark: 0,
  diffuse: 1.8,
  mapSamples: 16000,
  mapBrightness: 1.3,
  baseColor: [0.93, 0.89, 0.95] as [number, number, number],
  markerColor: [0.431, 0.114, 0.478] as [number, number, number], // #6E1D7A
  glowColor: [0.94, 0.88, 0.96] as [number, number, number],
  arcColor: [0.431, 0.114, 0.478] as [number, number, number],
  arcWidth: 0.6,
  arcHeight: 0.28,
  markerElevation: 0.02,
  markerSize: 0.05,
  scale: 1,
};

/**
 * Proyección de un punto (lat, lon) con la misma fórmula que cobe 2.x (vista ortográfica).
 * Devuelve x, y en 0–1 dentro del lienzo cuadrado y z = coseno del ángulo con el centro de la
 * vista (1 = de frente, 0 = en el borde, < 0 = detrás del globo).
 */
export function project([lat, lon]: LatLon, phi: number, theta: number): { x: number; y: number; z: number } {
  const r = (lat * Math.PI) / 180;
  const a = (lon * Math.PI) / 180 - Math.PI;
  const o = Math.cos(r);
  const R = 0.8 + STYLE.markerElevation;
  const t0 = -o * Math.cos(a) * R;
  const t1 = Math.sin(r) * R;
  const t2 = o * Math.sin(a) * R;
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const c = cp * t0 + sp * t2;
  const s = sp * st * t0 + ct * t1 - cp * st * t2;
  const z = -sp * ct * t0 + st * t1 + cp * ct * t2;
  return { x: (c * STYLE.scale + 1) / 2, y: (-s * STYLE.scale + 1) / 2, z: z / R };
}

/** Opciones completas para createGlobe (sin tamaño ni densidad de píxeles). */
export function cobeOptions(phi = VIEW.phi, theta = VIEW.theta) {
  const { markerSize, ...style } = STYLE;
  return {
    ...style,
    phi,
    theta,
    markers: PLACES.map((p) => ({ location: p.location, size: markerSize })),
    arcs: ARCS,
  };
}

/**
 * Rutas internas con soporte de `base` (GitHub Pages en subdirectorio) y URLs absolutas
 * (canonical, Open Graph, JSON-LD).
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** '/servicios/#reservar' → '/base/servicios/#reservar' (o igual si base = '/'). */
export function url(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${clean}`;
}

/** URL absoluta a partir de una ruta interna, usando `site` de astro.config. */
export function absoluteUrl(path: string, site: URL | undefined): string {
  if (/^https?:/.test(path)) return path;
  const origin = site ?? new URL('https://denissegonzalez.example');
  return new URL(url(path), origin).href;
}

/** Normaliza un pathname para comparar rutas (con barra final, sin base). */
export function normalizePath(pathname: string): string {
  let p = pathname;
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length) || '/';
  if (!p.endsWith('/')) p += '/';
  return p;
}

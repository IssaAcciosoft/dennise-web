// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';
import acciogestCatalog from './src/integrations/acciogest-catalog.mjs';

/**
 * URL pública del sitio (canonical, Open Graph, JSON-LD, sitemap y robots.txt).
 *
 * Dominio definitivo: https://dggestoresyabogados.com (AccioGest, 19-11-2026; las direcciones
 * de vuelta de los planes y los enlaces de las casillas en AccioGest ya usan este dominio).
 * - Producción y compilaciones locales: ese dominio (o SITE_URL si se define).
 * - Netlify, vistas previas de ramas y pull requests: DEPLOY_PRIME_URL, para que el canonical
 *   y el sitemap de la vista previa no apunten a producción.
 *
 * BASE_PATH solo hace falta si la web se sirve en un subdirectorio (p. ej. GitHub Pages sin
 * dominio propio: `https://usuario.github.io/dennise-web/` → BASE_PATH=/dennise-web).
 */
export const PRODUCTION_SITE_URL = 'https://dggestoresyabogados.com';
const NETLIFY_PREVIEW_URL =
  process.env.NETLIFY && process.env.CONTEXT !== 'production' ? process.env.DEPLOY_PRIME_URL : undefined;
const SITE_URL = process.env.SITE_URL || NETLIFY_PREVIEW_URL || PRODUCTION_SITE_URL;
const BASE_PATH = process.env.BASE_PATH || '/';

// Páginas fuera del sitemap (también llevan <meta name="robots" content="noindex">).
// /gracias/: agradecimiento tras pagar un plan o reservar en AccioGest (no se indexa).
const NOINDEX = ['/404/', '/gracias/'];

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  output: 'static',
  trailingSlash: 'always',
  // /dubai/ pasó a /apertura-de-empresas/ (docs/cambios-2026-10.md §2.3). En Netlify la
  // redirección es un 301 real (netlify.toml); aquí Astro genera además /dubai/index.html con
  // <meta http-equiv="refresh"> y canonical, para que funcione en cualquier alojamiento.
  redirects: {
    '/dubai/': '/apertura-de-empresas/',
  },
  build: {
    format: 'directory',
    // Todo el CSS va en línea: cero hojas de estilo que bloqueen el renderizado.
    inlineStylesheets: 'always',
  },
  integrations: [
    // Catálogo de AccioGest al compilar (precios, nombres y duraciones de las asesorías y planes),
    // con la última copia buena si AccioGest no responde. docs/integracion-acciogest.md → «Fase A».
    acciogestCatalog(),
    // Islas de React: hidratar SIEMPRE con client:visible / client:idle (nunca client:load
    // salvo que sea imprescindible). Ver README → «Islas de React».
    react(),
    // client:deferred={{ media, motion, on, rootMargin }}: decide antes de descargar la isla
    // (src/directives/deferred.ts). Ver README → «Islas de React».
    {
      name: 'client-deferred',
      hooks: {
        'astro:config:setup': ({ addClientDirective }) => {
          addClientDirective({
            name: 'deferred',
            entrypoint: fileURLToPath(new URL('./src/directives/deferred.ts', import.meta.url)),
          });
        },
      },
    },
    sitemap({
      filter: (page) => !NOINDEX.some((path) => new URL(page).pathname.endsWith(path)),
    }),
  ],
  vite: {
    build: {
      // Los .woff2 nunca se incrustan como data: URI (se precargan como archivo).
      assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
    },
  },
  devToolbar: { enabled: false },
});

// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

/**
 * URL pública del sitio (canonical, Open Graph, JSON-LD, sitemap y robots.txt).
 *
 * ⚠️ PLACEHOLDER: el dominio definitivo está PENDIENTE. Hasta entonces se usa
 * `https://denissegonzalez.example`. Para publicar, compila con la variable de entorno
 * SITE_URL (p. ej. `SITE_URL=https://www.midominio.es npm run build`) o define la variable
 * de repositorio SITE_URL en GitHub (Settings → Secrets and variables → Actions → Variables).
 *
 * BASE_PATH solo hace falta si la web se sirve en un subdirectorio (p. ej. GitHub Pages sin
 * dominio propio: `https://usuario.github.io/dennise-web/` → BASE_PATH=/dennise-web).
 */
export const SITE_URL_PLACEHOLDER = 'https://denissegonzalez.example';
const SITE_URL = process.env.SITE_URL || SITE_URL_PLACEHOLDER;
const BASE_PATH = process.env.BASE_PATH || '/';

// Páginas fuera del sitemap (también llevan <meta name="robots" content="noindex">).
// /gracias/: agradecimiento tras pagar un plan o reservar en AccioGest (no se indexa).
const NOINDEX = ['/404/', '/gracias/'];

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Todo el CSS va en línea: cero hojas de estilo que bloqueen el renderizado.
    inlineStylesheets: 'always',
  },
  integrations: [
    // Islas de React: hidratar SIEMPRE con client:visible / client:idle (nunca client:load
    // salvo que sea imprescindible). Ver README → «Islas de React».
    react(),
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

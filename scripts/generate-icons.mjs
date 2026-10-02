/**
 * Genera los iconos PNG de la web a partir de los SVG del logotipo.
 *   npm run icons
 *
 * - public/favicon.svg            → favicon-32.png (pestañas de navegadores sin soporte SVG)
 * - scripts/icon-source.svg       → apple-touch-icon.png (180), icon-192.png, icon-512.png,
 *                                   icon-maskable-512.png (fondo opaco a sangre, monograma
 *                                   dentro de la zona segura del 80 %)
 *
 * Usa sharp (dependencia de Astro). Revisa SIEMPRE el resultado abriendo los PNG.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const out = (name) => fileURLToPath(new URL(`public/${name}`, root));

const favicon = await readFile(new URL('public/favicon.svg', root));
const square = await readFile(new URL('scripts/icon-source.svg', root));

const render = (svg, size, file) =>
  sharp(svg, { density: Math.max(72, Math.ceil((72 * size) / 64) * 2) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out(file))
    .then(() => console.log(`✔ public/${file} (${size}×${size})`));

await render(favicon, 32, 'favicon-32.png');
await render(square, 180, 'apple-touch-icon.png');
await render(square, 192, 'icon-192.png');
await render(square, 512, 'icon-512.png');
await render(square, 512, 'icon-maskable-512.png');

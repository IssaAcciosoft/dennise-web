/**
 * Genera el póster estático del globo de Conóceme (src/assets/globe-poster.png) con el MISMO
 * motor (cobe), la misma vista y los mismos colores que la isla WebGL
 * (src/components/about/globe-config.ts). Así, al hidratar, el lienzo sustituye al póster sin
 * salto visible; y con «reducir movimiento» o sin WebGL, el póster es el globo.
 *
 *   npm run globe-poster
 *
 * Requiere Playwright con Chromium (`npx playwright install chromium` en tu equipo). No forma
 * parte de la compilación: solo hay que ejecutarlo si cambias globe-config.ts. Revisa el PNG.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';
import { cobeOptions } from '../src/components/about/globe-config.ts';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Falta Playwright: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const SIZE = 960;
const root = new URL('../', import.meta.url);
const cobe = await readFile(new URL('node_modules/cobe/dist/index.esm.js', root), 'utf8');
const out = fileURLToPath(new URL('src/assets/globe-poster.png', root));

const html = `<!doctype html><body style="margin:0;background:transparent">
<canvas id="c" style="width:${SIZE}px;height:${SIZE}px"></canvas>
<script type="module">
import createGlobe from '/cobe.js';
const canvas = document.getElementById('c');
const globe = createGlobe(canvas, { ...${JSON.stringify(cobeOptions())}, devicePixelRatio: 1, width: ${SIZE}, height: ${SIZE} });
let n = 0;
// cobe carga la textura del mapa en diferido: varios fotogramas antes de leer el lienzo.
const tick = () => {
  globe.update({});
  if (++n < 90) return requestAnimationFrame(tick);
  window.png = canvas.toDataURL('image/png'); // mismo fotograma que el dibujo (sin preserveDrawingBuffer)
};
requestAnimationFrame(tick);
</script></body>`;

const browser = await chromium.launch({
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
await page.route('http://poster.local/**', (route) =>
  route.request().url().endsWith('/cobe.js')
    ? route.fulfill({ body: cobe, contentType: 'text/javascript' })
    : route.fulfill({ body: html, contentType: 'text/html' }),
);
await page.goto('http://poster.local/');
const dataUrl = await page.waitForFunction(() => window.png, null, { timeout: 60_000 }).then((h) => h.jsonValue());
await browser.close();

const png = Buffer.from(String(dataUrl).split(',')[1], 'base64');
await writeFile(out, await sharp(png).png({ compressionLevel: 9, palette: false }).toBuffer());
console.log(`✔ src/assets/globe-poster.png (${SIZE}×${SIZE}) — revisa el resultado`);

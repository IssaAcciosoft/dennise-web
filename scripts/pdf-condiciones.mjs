/**
 * PDF de las condiciones de contratación (AccioGest lo adjunta al correo de confirmación de cada
 * contratación; revisión legal del 24-11-2026). Se genera desde la página ya compilada, con los
 * estilos de impresión de LegalLayout:
 *   npm run build && npm run pdf:condiciones && npm run build
 * Resultado: public/docs/condiciones-contratacion.pdf (publicado en /docs/condiciones-contratacion.pdf).
 * Regenerarlo SIEMPRE que cambie el texto de /condiciones-contratacion/.
 */
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, normalize, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Playwright con Chromium (como scripts/render-og-images.mjs): no es dependencia de la web.
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Falta Playwright: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const out = join(root, 'public/docs/condiciones-contratacion.pdf');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(dist, p));
    const rel = relative(dist, file);
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('fuera de dist');
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const { port } = server.address();

// Se carga con la dirección del dominio definitivo (servida desde dist/): así los enlaces del PDF
// (política de privacidad, aviso legal, teléfono…) apuntan a la web publicada, no a 127.0.0.1.
const SITE = 'https://dggestoresyabogados.com';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.route(`${SITE}/**`, async (route) => {
    const u = new URL(route.request().url());
    const r = await fetch(`http://127.0.0.1:${port}${u.pathname}`);
    await route.fulfill({ status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'application/octet-stream' }, body: Buffer.from(await r.arrayBuffer()) });
  });
  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
  const res = await page.goto(`${SITE}/condiciones-contratacion/`, { waitUntil: 'networkidle' });
  if (!res?.ok()) throw new Error(`No se encuentra /condiciones-contratacion/ en dist (¿npm run build?): ${res?.status()}`);
  await page.evaluate(() => document.fonts.ready);
  await mkdir(join(root, 'public/docs'), { recursive: true });
  await page.pdf({
    path: out,
    format: 'A4',
    printBackground: false,
    margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:8px;width:100%;padding:0 16mm;color:#666">DG Gestores y Abogados · Condiciones de contratación</div>',
    footerTemplate: '<div style="font-size:8px;width:100%;padding:0 16mm;color:#666;text-align:right">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
  });
  console.log(`PDF: ${relative(root, out)}`);
} finally {
  await browser.close();
  server.close();
}

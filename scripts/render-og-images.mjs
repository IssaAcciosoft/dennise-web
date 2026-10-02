/**
 * Imágenes para redes (Open Graph, 1200×630) con la tipografía y los colores de la web:
 *
 * - public/og-image.jpg  → por defecto (inicio y resto): titular del hero de la cliente
 *   («Derecho que conecta personas, oportunidades y derechos»), áreas y retrato en arco.
 * - public/og-dubai.jpg  → /dubai/: «Abre tu empresa en Dubái», estructuras y el arco con la
 *   celosía de ocho puntas (mismo motivo que la portada de la página).
 *
 *   npm run og-images
 *
 * Requiere Playwright con Chromium (`npx playwright install chromium` en tu equipo). No forma
 * parte de la compilación: ejecutarlo solo si cambian estos textos. Revisa los JPG generados.
 * Todo va en línea (fuentes e imágenes en data:), sin peticiones de red.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Falta Playwright: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const root = new URL('../', import.meta.url);
const file = (p) => fileURLToPath(new URL(p, root));
const b64 = async (p) => (await readFile(file(p))).toString('base64');
const font = async (name) => `data:font/woff2;base64,${await b64(`node_modules/@fontsource/${name}`)}`;

const fonts = {
  cg600: await font('cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2'),
  cg500i: await font('cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2'),
  b500: await font('barlow/files/barlow-latin-500-normal.woff2'),
  b600: await font('barlow/files/barlow-latin-600-normal.woff2'),
};
const logo = `data:image/svg+xml;base64,${await b64('src/assets/logo/dg-mark.svg')}`;
const portraitJpg = await sharp(file('src/assets/img/retrato.jpg')).resize(680).jpeg({ quality: 88 }).toBuffer();
const portrait = `data:image/jpeg;base64,${portraitJpg.toString('base64')}`;

const lattice = (color, width = 0.9) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><g fill='none' stroke='${color}' stroke-width='${width}'><path d='M18 18h24v24H18zM30 13.03 46.97 30 30 46.97 13.03 30z'/><path d='M30 0v13.03M30 46.97V60M0 30h13.03M46.97 30H60M0 0l18 18M60 0 42 18M60 60 42 42M0 60l18-18'/></g></svg>`,
  )}")`;

const base = `
@font-face{font-family:CG;font-weight:600;font-style:normal;src:url(${fonts.cg600}) format("woff2")}
@font-face{font-family:CG;font-weight:500;font-style:italic;src:url(${fonts.cg500i}) format("woff2")}
@font-face{font-family:B;font-weight:500;src:url(${fonts.b500}) format("woff2")}
@font-face{font-family:B;font-weight:600;src:url(${fonts.b600}) format("woff2")}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:B,sans-serif;color:#241A27;
  background:radial-gradient(700px 520px at 100% 0%,rgba(232,221,236,.9),transparent 65%),
  radial-gradient(520px 380px at 0% 100%,rgba(247,238,232,.95),transparent 70%),#FBF8F5}
.wrap{position:absolute;inset:0;padding:64px 80px;display:grid;grid-template-columns:1fr 360px;gap:56px;align-items:center}
.brand{display:flex;align-items:center;gap:18px;margin-bottom:46px}
.brand img{width:96px}
.brand b{display:block;font-family:CG;font-weight:600;font-size:30px;line-height:1}
.brand span{display:block;margin-top:8px;color:#5E5463;font-size:13px;font-weight:600;letter-spacing:.3em;text-transform:uppercase}
h1{font-family:CG;font-weight:600;font-size:68px;line-height:1.02;letter-spacing:-.01em}
h1 em{font-style:italic;font-weight:500;color:#6E1D7A}
.sub{display:flex;align-items:center;gap:18px;margin-top:34px;color:#3E3342;font-size:18px;font-weight:500;letter-spacing:.02em;white-space:nowrap}
.sub::before{content:"";width:40px;height:1px;background:#6E1D7A}
.arch{position:relative;width:340px;height:500px;border-radius:999px 999px 16px 16px;overflow:hidden;box-shadow:0 30px 60px -24px rgba(44,10,50,.35)}
.arch-outline{position:absolute;width:340px;height:500px;border:1px solid rgba(110,29,122,.3);border-radius:999px 999px 20px 20px;transform:translate(-14px,14px)}
.media{position:relative}
`;

const pages = [
  {
    out: 'public/og-image.jpg',
    html: `<style>${base}
.arch img{width:100%;height:100%;object-fit:cover;object-position:50% 62%}
</style>
<div class="wrap">
  <div>
    <div class="brand"><img src="${logo}" alt=""><div><b>Denisse González</b><span>Abogada</span></div></div>
    <h1>Derecho que conecta <em>personas, oportunidades y&nbsp;derechos</em></h1>
    <p class="sub">Derecho internacional · Movilidad internacional · Derechos humanos</p>
  </div>
  <div class="media"><div class="arch-outline"></div><div class="arch"><img src="${portrait}" alt=""></div></div>
</div>`,
  },
  {
    out: 'public/og-dubai.jpg',
    html: `<style>${base}
.brand span{letter-spacing:.22em}
.kicker{display:flex;align-items:center;gap:14px;margin-bottom:20px;color:#6E1D7A;font-size:15px;font-weight:600;letter-spacing:.24em;text-transform:uppercase}
.kicker::before{content:"";width:40px;height:1px;background:currentColor}
h1{font-size:84px}
.arch{display:grid;place-items:center;color:#DDB56C;
  background:radial-gradient(70% 45% at 50% 0%,rgba(221,181,108,.28),transparent 70%),
  linear-gradient(to bottom,rgba(31,16,36,0) 45%,rgba(31,16,36,.85) 100%),
  linear-gradient(rgba(44,10,50,.32),rgba(44,10,50,.32)),
  ${lattice('#DDB56C')} 50% 0/60px 60px,
  linear-gradient(170deg,#4A1554 0%,#2C0A32 55%,#1F1024 100%)}
.star{width:150px;margin-top:-80px}
.legend{position:absolute;left:0;right:0;bottom:34px;text-align:center;color:#F7EFF3;font-family:CG;font-style:italic;font-weight:500;font-size:40px;line-height:1}
.legend span{display:block;margin-top:10px;color:#DDB56C;font-family:B;font-style:normal;font-weight:600;font-size:12px;letter-spacing:.26em;text-transform:uppercase}
</style>
<div class="wrap">
  <div>
    <div class="brand"><img src="${logo}" alt=""><div><b>DG Gestores y Abogados</b><span>Denisse González</span></div></div>
    <p class="kicker">Crea tu empresa</p>
    <h1>Abre tu empresa en <em>Dubái</em></h1>
    <p class="sub">Holding · Real Estate · Trading</p>
  </div>
  <div class="media"><div class="arch-outline"></div><div class="arch">
    <svg class="star" viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width=".9"><path d="M29 29h42v42H29z"/><path d="M50 20.3 79.7 50 50 79.7 20.3 50z"/><circle cx="50" cy="50" r="12"/></g></svg>
    <p class="legend">Dubái<span>Emiratos Árabes Unidos</span></p>
  </div></div>
</div>`,
  },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const p of pages) {
  await page.setContent(`<!doctype html><html lang="es"><meta charset="utf-8"><body>${p.html}</body></html>`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: 'png' });
  await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(file(p.out));
  console.log('✓', p.out);
}
await browser.close();

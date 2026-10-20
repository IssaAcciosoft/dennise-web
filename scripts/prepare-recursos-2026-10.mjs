/**
 * Prepara los recursos de octubre de 2026 (_originales/recursos-2026-10/, sin tocar) para
 * src/assets (docs/cambios-2026-10.md §1, §3, §4 y §6). Coordenadas ajustadas a mano y revisadas
 * visualmente; después astro:assets genera AVIF/WebP y los anchos.
 *
 * - despacho-retrato.jpg: recorte 4:5 de «despacho-banderas-cuadrado» (Denisse en su despacho
 *   con el logo DG y las banderas de México, España y la UE) → portada del inicio y Conóceme
 *   (el mismo archivo en las dos: retrato compartido entre páginas).
 * - equipo/denisse-despacho.jpg: recorte cuadrado de «despacho-banderas-circular» (cara y
 *   hombros, dentro del círculo: sin las esquinas negras) → «Nuestro equipo».
 * - emlhis-2026-denisse.jpg: Agenda 2026 (EMLHIS Impulsa Madrid, 19/10/2026).
 * - partners/*: logos de De la Flor Abogados, Espiga Exports y «Bienvenido / Welcome!»
 *   (reducidos, sin cambiar proporciones) y retrato cuadrado de Ariel Noriega.
 * - ev/*: logos principal y secundario de Empoderando Voces (fondo blanco original, con un
 *   margen blanco: las letras llegan pegadas al borde).
 *
 * Uso: npm run recursos-2026-10-images  (sobrescribe los destinos; revisar el resultado).
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SRC = `${root}_originales/recursos-2026-10/`;
const OUT = `${root}src/assets/img/`;

await Promise.all(['equipo', 'partners', 'ev'].map((d) => mkdir(OUT + d, { recursive: true })));

/** crop: [left, top, width, height] en píxeles del original; width: ancho final (opcional). */
const JOBS = [
  { src: 'despacho-banderas-cuadrado.webp', out: 'despacho-retrato.jpg', crop: [260, 110, 880, 1100] },
  { src: 'despacho-banderas-circular.webp', out: 'equipo/denisse-despacho.jpg', crop: [470, 290, 380, 380] },  // cara centrada, sin el texto del logo de la pared
  { src: 'emlhis-2026-denisse.webp', out: 'emlhis-2026-denisse.jpg' },
  { src: 'ariel-noriega.png', out: 'partners/ariel-noriega.jpg', crop: [160, 110, 370, 370] },  // sin la placa «…MÉXICO» de la izquierda
  { src: 'partner-de-la-flor-abogados.webp', out: 'partners/de-la-flor-abogados.png', width: 960 },
  { src: 'partner-espiga-exports.png', out: 'partners/espiga-exports.png', width: 960 },
  { src: 'partner-everardo-bienvenido-welcome.png', out: 'partners/bienvenido-welcome.png', width: 960 },
  // Principal: el PNG suelto llega con la «O» final de «EMPODERANDO» cortada en el borde; se toma
  // la mitad izquierda de la hoja conjunta (palabra completa), se recorta al dibujo y se añade
  // un margen blanco del 4 %.
  { src: 'logos-empoderando-voces.webp', out: 'ev/logo-ev-principal.png', crop: [20, 10, 920, 875], trim: true, pad: 0.04 },
  // Secundario: letras pegadas al borde: margen blanco del 5 % alrededor.
  { src: 'logo-ev-secundario.png', out: 'ev/logo-ev-secundario.png', pad: 0.05 },
];

for (const job of JOBS) {
  let img = sharp(SRC + job.src).rotate();
  if (job.crop) {
    const [left, top, width, height] = job.crop;
    img = img.extract({ left, top, width, height });
  }
  if (job.trim) img = sharp(await img.toBuffer()).trim({ background: '#ffffff', threshold: 24 });
  if (job.width) img = img.resize({ width: job.width, withoutEnlargement: true });
  if (job.pad) {
    const { width } = await sharp(await img.toBuffer()).metadata();
    const p = Math.round(width * job.pad);
    img = sharp(await img.toBuffer()).extend({ top: p, bottom: p, left: p, right: p, background: '#ffffff' });
  }
  img = job.out.endsWith('.png') ? img.png({ compressionLevel: 9 }) : img.jpeg({ quality: 88, mozjpeg: true });
  await img.toFile(OUT + job.out);
  console.log('✓', job.out);
}

/**
 * Prepara las imágenes de la web anterior (_originales/web-anterior/, sin tocar) para src/assets:
 *
 * - Equipo (Conóceme → «Conoce al equipo»): recortes 4:5 de cabeza y hombros con el mismo
 *   encuadre en las tres fotos (cara completa, ojos a ~35-45 % de la altura, cabeza ~55-65 %).
 *   Las fotos de origen son muy distintas (retrato profesional, foto de pasaporte y foto social
 *   de baja resolución): las coordenadas están ajustadas a mano y revisadas visualmente.
 *   La de Stephanie (cara de ~170 px en el original) se amplía 2× con lanczos y un enfoque suave
 *   para que el navegador no la amplíe peor.
 * - Logo de Poplavsky (partner en Dubái): sin cambios de encuadre, reducido a 900 px.
 *
 * Después, astro:assets genera AVIF/WebP/JPG y los anchos (componente Photo).
 * Uso: npm run web-anterior-images  (sobrescribe los archivos de destino; revisar el resultado).
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SRC = `${root}_originales/web-anterior/`;
const OUT = `${root}src/assets/img/`;

/** [left, top, width, height] en píxeles del original; todos 4:5. */
const TEAM = [
  { src: 'denisse-equipo.png', out: 'equipo/denisse-gonzalez.jpg', crop: [272, 0, 656, 820] },
  { src: 'everardo-corona.jpg', out: 'equipo/everardo-corona.jpg', crop: [59, 100, 1200, 1500], width: 960 },
  { src: 'stephanie-gonzalez.jpg', out: 'equipo/stephanie-gonzalez.jpg', crop: [160, 255, 280, 350], upscale: 2 },
];

await mkdir(`${OUT}equipo`, { recursive: true });

for (const item of TEAM) {
  const [left, top, width, height] = item.crop;
  let img = sharp(SRC + item.src).rotate().extract({ left, top, width, height });
  if (item.upscale) {
    img = img.resize(width * item.upscale, height * item.upscale, { kernel: 'lanczos3' }).sharpen({ sigma: 0.7 });
  } else if (item.width && item.width < width) {
    img = img.resize(item.width);
  }
  await img.jpeg({ quality: 88, mozjpeg: true }).toFile(OUT + item.out);
  console.log('✓', item.out);
}

await sharp(`${SRC}poplavsky-logo.jpg`).resize(900).jpeg({ quality: 90, mozjpeg: true }).toFile(`${OUT}poplavsky-logo.jpg`);
console.log('✓ poplavsky-logo.jpg');

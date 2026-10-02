import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * /licencias.txt — avisos y licencias de terceros que se publican con la web (enlazado desde el
 * aviso legal §4). Se genera al compilar a partir de THIRD_PARTY_NOTICES.md, la licencia de
 * React Bits y los archivos de licencia de las librerías que llegan al navegador, así que siempre
 * coincide con lo que se publica (el minificador elimina los comentarios de licencia del JS).
 */
const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8').trim();

const LIBRARIES: { name: string; file: string }[] = [
  { name: 'React (react)', file: 'node_modules/react/LICENSE' },
  { name: 'React DOM (react-dom)', file: 'node_modules/react-dom/LICENSE' },
  { name: 'Astro (runtime de las islas)', file: 'node_modules/astro/LICENSE' },
  { name: 'cobe', file: 'node_modules/cobe/LICENSE' },
  { name: 'driver.js', file: 'node_modules/driver.js/license' },
  { name: 'Cormorant Garamond (@fontsource/cormorant-garamond)', file: 'node_modules/@fontsource/cormorant-garamond/LICENSE' },
  { name: 'Barlow (@fontsource/barlow)', file: 'node_modules/@fontsource/barlow/LICENSE' },
  { name: 'Barlow Condensed (@fontsource/barlow-condensed)', file: 'node_modules/@fontsource/barlow-condensed/LICENSE' },
];

const rule = '='.repeat(78);

export const GET: APIRoute = () => {
  const parts = [
    'Avisos y licencias de terceros · Web de Denisse González',
    rule,
    read('THIRD_PARTY_NOTICES.md'),
    '',
    rule,
    'React Bits (Aurora, CircularGallery, Magnet, SpotlightCard) — licencia completa',
    rule,
    read('src/components/react-bits/LICENSE.md'),
    '',
    rule,
    'ogl — The Unlicense (dominio público): https://unlicense.org',
    ...LIBRARIES.flatMap(({ name, file }) => ['', rule, name, rule, read(file)]),
    '',
  ];
  return new Response(parts.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

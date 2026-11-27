/**
 * Comprobación antes de publicar: falla si en dist/ queda algún marcador que no puede publicarse
 * (p. ej. el proveedor de alojamiento {ALOJAMIENTO} de la política de privacidad) o si el PDF
 * de las condiciones no existe o es más antiguo que la página. Uso: npm run build && npm run check:publish
 */
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const problems = [];
const MARKERS = ['{ALOJAMIENTO}', 'FORM_ID_', 'PLUGIN_ID'];
for (const page of ['politica-privacidad', 'condiciones-contratacion', 'aviso-legal', 'autogestion-dg', 'servicios', 'contacto', 'empoderando-voces']) {
  const html = await readFile(join(root, 'dist', page, 'index.html'), 'utf8').catch(() => '');
  if (!html) problems.push(`falta dist/${page}/index.html (¿npm run build?)`);
  for (const m of MARKERS) if (html.includes(m)) problems.push(`/${page}/ contiene el marcador «${m}»`);
}
const pdf = await stat(join(root, 'public/docs/condiciones-contratacion.pdf')).catch(() => null);
const src = await stat(join(root, 'src/pages/condiciones-contratacion.astro')).catch(() => null);
if (!pdf) problems.push('falta public/docs/condiciones-contratacion.pdf (npm run pdf:condiciones)');
else if (src && src.mtimeMs > pdf.mtimeMs + 1000) problems.push('el PDF de las condiciones es más antiguo que la página: regenerarlo (npm run pdf:condiciones)');
if (problems.length) {
  console.error('No publicar todavía:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log('OK: sin marcadores pendientes y PDF de las condiciones al día.');

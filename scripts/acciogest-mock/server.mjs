#!/usr/bin/env node
/**
 * Servidor de PRUEBA que imita las rutas públicas de AccioGest que usa la web (fase A):
 *
 *   GET /plugin-citas/public/{id}/catalogo   → scripts/acciogest-mock/catalogo.json
 *   GET /form-builder/public/{id}             → scripts/acciogest-mock/plan-form.json (por plan)
 *   GET /plugin-citas-embed.js?pluginId=…&service=…
 *                                             → crea en #acciogest-booking un iframe de prueba
 *   GET /mock/booking-frame.html              → el iframe: envía a window.parent
 *        { type: 'acciogest:booking:height', height } y { type: 'acciogest:booking:done', citaId, serviceId }
 *
 * Opcional: --dist dist sirve también la web compilada (todo en un mismo puerto).
 *
 * Uso (npm run mock:acciogest -- --port 4322 [--dist dist]):
 *   PUBLIC_ACCIOGEST_API=http://127.0.0.1:4322 PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID=demo \
 *   ACCIOGEST_MOCK_CATALOG=fetch npm run build
 * y abrir la web desde OTRO origen (p. ej. http://localhost:4322/servicios/#reservar): el iframe
 * llega de 127.0.0.1, que es el origen de PUBLIC_ACCIOGEST_API (el único permitido).
 * Nada de esto se publica: no está en src/ ni en public/.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, relative, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const PORT = Number(arg('port', process.env.PORT || 4322));
const DIST = args.includes('--dist') ? resolve(arg('dist', 'dist')) : null;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.avif': 'image/avif', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };

const embedJs = `(function () {
  var me = document.currentScript;
  var src = new URL(me.src);
  var host = document.getElementById('acciogest-booking');
  if (!host) return;
  var f = document.createElement('iframe');
  f.title = 'Reserva (PRUEBA)';
  f.src = src.origin + '/mock/booking-frame.html?pluginId=' + encodeURIComponent(src.searchParams.get('pluginId') || '') +
    '&service=' + encodeURIComponent(src.searchParams.get('service') || '');
  f.style.width = '100%';
  f.style.border = '0';
  host.appendChild(f);
})();`;

const frameHtml = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Reserva (PRUEBA)</title>
<style>body{font:16px system-ui;margin:0;padding:24px;background:#fffaf3}button{font:inherit;padding:10px 16px;margin:6px 6px 0 0}#pad{height:0;transition:none}</style>
<h1>Widget de reservas de PRUEBA</h1>
<p>Servicio preseleccionado: <strong id="svc"></strong></p>
<button id="grow" type="button">Más alto (+400 px)</button>
<button id="shrink" type="button">Más bajo (−400 px)</button>
<button id="done" type="button">Completar la reserva</button>
<div id="pad"></div>
<script>
  var q = new URLSearchParams(location.search), svc = q.get('service') || '';
  document.getElementById('svc').textContent = svc || '(ninguno)';
  var pad = document.getElementById('pad'), extra = 0;
  function send() { parent.postMessage({ type: 'acciogest:booking:height', height: document.documentElement.scrollHeight }, '*'); }
  document.getElementById('grow').onclick = function () { extra += 400; pad.style.height = extra + 'px'; send(); };
  document.getElementById('shrink').onclick = function () { extra = Math.max(0, extra - 400); pad.style.height = extra + 'px'; send(); };
  document.getElementById('done').onclick = function () { parent.postMessage({ type: 'acciogest:booking:done', citaId: 'MOCK-' + Date.now(), serviceId: svc || null }, '*'); };
  addEventListener('load', send);
</script></html>`;

const json = async (file) => JSON.parse(await readFile(join(HERE, file), 'utf8'));

const server = createServer(async (req, res) => {
  const u = new URL(req.url ?? '/', 'http://x');
  const send = (code, type, body) => {
    const headers = { 'content-type': type, 'access-control-allow-origin': '*', 'cache-control': 'no-store' };
    // gzip para textos (como en producción), para que Lighthouse en local sea comparable.
    if (/text|json|javascript|svg|xml/.test(type) && /gzip/.test(req.headers['accept-encoding'] ?? '')) {
      body = gzipSync(body);
      headers['content-encoding'] = 'gzip';
    }
    res.writeHead(code, headers);
    res.end(body);
  };
  try {
    let m;
    if ((m = u.pathname.match(/^\/plugin-citas\/public\/([^/]+)\/catalogo\/?$/))) return send(200, 'application/json', JSON.stringify(await json('catalogo.json')));
    if ((m = u.pathname.match(/^\/form-builder\/public\/([^/]+)\/?$/))) {
      const forms = await json('plan-form.json');
      const key = ['basico', 'estandar', 'premium'].find((k) => decodeURIComponent(m[1]).toLowerCase().includes(k)) ?? 'basico';
      return send(200, 'application/json', JSON.stringify(forms[key]));
    }
    if (u.pathname === '/plugin-citas-embed.js') return send(200, 'text/javascript', embedJs);
    if (u.pathname === '/mock/booking-frame.html') return send(200, 'text/html; charset=utf-8', frameHtml);
    if (DIST) {
      let file = normalize(join(DIST, decodeURIComponent(u.pathname)));
      const rel = relative(DIST, file); if (rel.startsWith('..') || isAbsolute(rel)) return send(403, 'text/plain', 'forbidden');
      if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file).catch(() => null);
      if (body) return send(200, TYPES[extname(file)] ?? 'application/octet-stream', body);
    }
    send(404, 'text/plain', 'not found');
  } catch (e) {
    send(500, 'text/plain', String(e));
  }
});
server.listen(PORT, '127.0.0.1', () => console.log(`AccioGest de PRUEBA en http://127.0.0.1:${PORT} (y http://localhost:${PORT})${DIST ? ` · web: ${DIST}` : ''}`));

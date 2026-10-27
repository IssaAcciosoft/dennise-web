// @ts-check
/**
 * ============================================================================
 *  Catálogo de AccioGest al compilar (docs/integracion-acciogest.md → «Fase A»)
 * ============================================================================
 *  Integración de Astro que sirve el módulo virtual `virtual:acciogest-catalog`, que lee
 *  src/lib/services.ts (y solo él). Aquí NO se mezcla nada: solo se obtienen y validan los datos
 *  de AccioGest; la mezcla con servicios.json (por `acciogest_id`) está en services.ts.
 *
 *  - Catálogo de reservas: solo si BOOKING_PLUGIN_ID está configurado →
 *      GET {API}/plugin-citas/public/{BOOKING_PLUGIN_ID}/catalogo   (8 s como máximo)
 *  - Precio de cada plan: solo si su PLANES.<plan> está configurado →
 *      GET {API}/form-builder/public/{PLAN_FORM_ID}                  (campo de pago)
 *
 *  Si una petición va bien, se guarda como «última copia buena» en
 *    src/data/acciogest-catalogo.last.json      (versionado: solo se reescribe si cambia) y
 *    node_modules/.cache/acciogest/…last.json   (caché de compilación de Netlify).
 *  Si falla, tarda demasiado o la respuesta no tiene la forma esperada: aviso claro en el log
 *  de la compilación y se usa la última copia buena (la más reciente de las dos) o, si no hay,
 *  solo servicios.json. La compilación nunca falla por AccioGest.
 *
 *  Pruebas sin AccioGest (nunca escriben la copia buena):
 *    ACCIOGEST_MOCK_CATALOG=1      → fixture local scripts/acciogest-mock/*.json, sin red;
 *    ACCIOGEST_MOCK_CATALOG=fetch  → peticiones reales a PUBLIC_ACCIOGEST_API (p. ej. el
 *                                    servidor de prueba: npm run mock:acciogest).
 *  En los dos casos, los elementos con `acciogest_id: null` se enlazan con un id de prueba
 *  (`mock-<id de la asesoría>-<modalidad>`, `mock-plan-<id del plan>`), los del fixture.
 * ============================================================================
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const VIRTUAL_ID = 'virtual:acciogest-catalog';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const TIMEOUT_MS = 8000;
const PLAN_KEYS = /** @type {const} */ (['basico', 'estandar', 'premium']);
/** Mismo criterio que isConfigured() de src/config/acciogest.ts. */
const PLACEHOLDER = /^(FORM_ID_[A-Z_]*|PLUGIN_ID)$/;
const isConfigured = (/** @type {string | undefined} */ id) => {
  const v = (id ?? '').trim();
  return v !== '' && !PLACEHOLDER.test(v);
};

/**
 * Lee los valores por defecto de `pick(import.meta.env.PUBLIC_ACCIOGEST_X, 'valor')` en
 * src/config/acciogest.ts: así un ID puesto a mano en ese archivo también vale aquí (las variables
 * de entorno tienen prioridad, igual que en la web).
 * @param {string} root
 */
function configDefaults(root) {
  /** @type {Record<string, string>} */
  const out = {};
  try {
    const src = readFileSync(join(root, 'src/config/acciogest.ts'), 'utf8');
    for (const m of src.matchAll(/pick\(\s*import\.meta\.env\.(PUBLIC_ACCIOGEST_\w+)\s*,\s*'([^']*)'\s*\)/g)) out[m[1]] = m[2];
  } catch {
    /* sin archivo: solo variables de entorno */
  }
  return out;
}

/** @param {unknown} v */
const isObj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
/** Número desde 121, "121", "121.00" o "121,00". @param {unknown} v */
const toNumber = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string' && /^\s*\d+(?:[.,]\d+)?\s*$/.test(v)) return Number(v.replace(',', '.'));
  return undefined;
};

/** Límites de los textos del catálogo (los de servicios.json son mucho más cortos). */
const MAX_NOMBRE = 120;
const MAX_DESCRIPCION = 600;
/**
 * Texto del catálogo, limpio: sin caracteres de control, sin nada que parezca una etiqueta HTML
 * (`<b>`, `</p>`, `<br/>`, `<img/src=x …>`, `<!-- … -->` y también una etiqueta sin cerrar, que se
 * quita hasta el final: los textos son texto plano), espacios normalizados y longitud máxima.
 * Un `<` que no abre etiqueta («menores de <18», «a < b») o un `>` suelto se conservan: Astro
 * escapa el texto al pintarlo, dentro de un <script> (JSON-LD, /gracias/) safeJson() de
 * src/lib/json.ts lo escribe como \u003C y la visita guiada (src/scripts/tour.ts) lo escapa.
 * Vacío → null (se queda el texto de servicios.json).
 * @param {unknown} v
 * @param {number} max
 */
export function cleanText(v, max) {
  if (typeof v !== 'string') return null;
  const t = v
    .replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]+/g, ' ')
    .replace(/<[a-z!?/][^>]*>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/**
 * `mostrar_precio` normalizado. Visible: true, 1, "1", "true", "si"/"sí", "yes" o sin el campo
 * (null/undefined). Oculto: false, 0, "0", "false", "no" y cualquier otro valor (con aviso):
 * ante la duda, el precio NO se publica.
 * @param {unknown} v
 * @param {(msg: string) => void} [warn]
 * @param {string} [id]
 */
export function showPrice(v, warn, id = '') {
  if (v === undefined || v === null || v === true || v === 1) return true;
  if (v === false || v === 0) return false;
  if (typeof v === 'string') {
    const t = v.trim().toLowerCase();
    if (['1', 'true', 'si', 'sí', 'yes'].includes(t)) return true;
    if (['0', 'false', 'no', ''].includes(t)) return false;
  }
  warn?.(`mostrar_precio no reconocido en el servicio «${id}» (${JSON.stringify(v)}): se oculta su precio.`);
  return false;
}

/**
 * Valida GET /plugin-citas/public/{id}/catalogo. Devuelve el catálogo normalizado o un error.
 * Elementos sueltos inválidos se descartan (con aviso); forma general inválida → error.
 * También es un error que no quede NINGÚN servicio válido (lista vacía o todos descartados) o
 * que, si servicios.json enlaza ids, no esté ninguno de ellos: una respuesta así no es una
 * «copia buena» (se usa la anterior y no se sobrescribe).
 * @param {unknown} json
 * @param {string} currency moneda de servicios.json
 * @param {(msg: string) => void} warn
 * @param {string[]} [linkedIds] ids de AccioGest que enlaza servicios.json
 */
export function validateCatalog(json, currency, warn, linkedIds = []) {
  if (!isObj(json)) return { error: 'la respuesta no es un objeto JSON' };
  const j = /** @type {Record<string, unknown>} */ (json);
  if (!Array.isArray(j.servicios)) return { error: 'falta el array «servicios»' };
  if (typeof j.currency === 'string' && j.currency.toUpperCase() !== currency.toUpperCase()) {
    return { error: `moneda ${j.currency} distinta de la de servicios.json (${currency})` };
  }
  const servicios = [];
  for (const raw of j.servicios) {
    if (!isObj(raw)) continue;
    const s = /** @type {Record<string, unknown>} */ (raw);
    const id = typeof s.id === 'string' || typeof s.id === 'number' ? String(s.id).trim() : '';
    const precio = toNumber(s.precio_bruto);
    if (!id || precio === undefined || precio < 0) {
      warn(`servicio del catálogo descartado (id o precio_bruto no válidos): ${JSON.stringify(raw).slice(0, 120)}`);
      continue;
    }
    const dur = toNumber(s.duracion_min);
    servicios.push({
      id,
      nombre: cleanText(s.nombre, MAX_NOMBRE),
      descripcion: cleanText(s.descripcion, MAX_DESCRIPCION),
      duracion_min: dur !== undefined && dur > 0 ? Math.round(dur) : null,
      precio_bruto: precio,
      mostrar_precio: showPrice(s.mostrar_precio, warn, id),
    });
  }
  // Orden fijo (por id): el mismo catálogo en otro orden no reescribe la copia buena.
  servicios.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  if (!servicios.length) {
    return { error: j.servicios.length ? 'ningún servicio válido (todos descartados)' : 'el catálogo está vacío' };
  }
  if (linkedIds.length && !servicios.some((s) => linkedIds.includes(s.id))) {
    return { error: `no está ninguno de los ${linkedIds.length} servicios que enlaza servicios.json` };
  }
  return {
    data: { updated_at: typeof j.updated_at === 'string' ? j.updated_at : null, currency: currency.toUpperCase(), servicios },
  };
}

/**
 * Ids de AccioGest que enlaza servicios.json (consultations[].prices[] y planes), con la misma
 * regla que linkedId() de src/lib/services.ts: en modo de prueba, los null → `mock-…`.
 * @param {any} json servicios.json
 * @param {boolean} mock
 * @typedef {{ id: string, where: string, plan: boolean, auto: boolean, name?: string, minutes?: number, lead?: string }} Linked
 * @returns {Linked[]}  auto = id de prueba; name / minutes / lead = los de servicios.json
 */
export function linkedServiceIds(json, mock) {
  /** @type {Linked[]} */
  const out = [];
  const add = (/** @type {unknown} */ id, /** @type {string} */ mockId, /** @type {string} */ where, plan = false, extra = {}) => {
    const own = id !== null && id !== undefined && String(id).trim() !== '' ? String(id).trim() : null;
    if (own) out.push({ id: own, where, plan, auto: false, ...extra });
    else if (mock) out.push({ id: mockId, where, plan, auto: true, ...extra });
  };
  for (const c of Array.isArray(json?.consultations) ? json.consultations : []) {
    const extra = { name: c?.name, minutes: c?.duration_minutes, lead: c?.lead_value };
    for (const p of Array.isArray(c?.prices) ? c.prices : []) add(p?.acciogest_id, `mock-${c.id}-${p.modality}`, `${c.id} (${p.modality})`, false, extra);
  }
  for (const prog of Array.isArray(json?.programs) ? json.programs : []) {
    for (const plan of Array.isArray(prog?.plans) ? prog.plans : []) {
      add(plan?.acciogest_id, `mock-plan-${plan.id}`, `plan ${plan.id}`, true, { name: plan?.name, lead: plan?.lead_value });
    }
  }
  return out;
}

/**
 * Precio de un plan desde GET /form-builder/public/{PLAN_FORM_ID}.
 * TODO (AccioGest): confirmar el nombre exacto del campo de pago y de su importe, y si es con
 * IVA incluido (la web lo muestra como «IVA incluido»). Mientras tanto se busca, de forma
 * tolerante, un campo cuyo tipo parezca de pago (payment / pago / stripe…) con un importe en
 * amount / precio / price / importe / monto (o en su config / settings / options / payment), y
 * en céntimos si la clave lo dice (amount_cents…). Si hay varios, se usa el primero.
 * @param {unknown} json
 * @returns {number | undefined}
 */
export function extractPlanAmount(json) {
  if (!isObj(json)) return undefined;
  const j = /** @type {Record<string, any>} */ (json);
  const fields = [j.fields, j.data?.fields, j.form?.fields, j.form?.data?.fields].find(Array.isArray) ?? [];
  const AMOUNT_KEYS = ['precio_bruto', 'amount', 'precio', 'price', 'importe', 'monto', 'amount_cents', 'price_cents', 'importe_centimos'];
  /** @param {Record<string, unknown>} o */
  const amountIn = (o) => {
    for (const key of AMOUNT_KEYS) {
      const n = toNumber(o[key]);
      if (n !== undefined && n > 0) return /cent/i.test(key) ? n / 100 : n;
    }
    return undefined;
  };
  for (const f of fields) {
    if (!isObj(f)) continue;
    const type = String(f.type ?? f.field_type ?? f.tipo ?? '');
    if (!/pay|pago|stripe|cobro/i.test(type)) continue;
    for (const where of [f, f.config, f.settings, f.options, f.payment, f.properties]) {
      if (!isObj(where)) continue;
      const n = amountIn(where);
      if (n !== undefined) return n;
    }
  }
  return undefined;
}

/** @param {string} url */
async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** @param {unknown} e */
const reason = (e) => {
  if (!(e instanceof Error)) return String(e);
  if (e.name === 'TimeoutError') return `sin respuesta en ${TIMEOUT_MS / 1000} s`;
  const cause = /** @type {any} */ (e).cause;
  return cause?.code || cause?.message ? `${e.message} (${cause.code ?? cause.message})` : e.message;
};

/** @param {string} file */
function readSnapshot(file) {
  try {
    const j = JSON.parse(readFileSync(file, 'utf8'));
    return isObj(j) ? j : null;
  } catch {
    return null;
  }
}

/**
 * @param {{ root?: string }} [options]
 * @returns {import('astro').AstroIntegration}
 */
export default function acciogestCatalog(options = {}) {
  return {
    name: 'acciogest-catalog',
    hooks: {
      'astro:config:setup': ({ config, command, updateConfig, logger }) => {
        const root = options.root ?? fileURLToPath(config.root);
        const SNAPSHOT = join(root, 'src/data/acciogest-catalogo.last.json');
        const CACHE = join(root, 'node_modules/.cache/acciogest/catalogo.last.json');
        const MOCK_DIR = join(root, 'scripts/acciogest-mock');

        /** @type {Promise<object> | undefined} */
        let pending;
        const load = async () => {
          const mode = command === 'build' ? 'production' : 'development';
          // Como pick() de src/config/acciogest.ts: una variable vacía no anula el valor por defecto.
          /** @type {Record<string, string>} */
          const env = { ...configDefaults(root) };
          for (const src of [loadEnv(mode, root, ''), process.env]) {
            for (const [k, v] of Object.entries(src)) if (typeof v === 'string' && v.trim()) env[k] = v;
          }
          const api = (env.PUBLIC_ACCIOGEST_API || 'https://api.acciogest.com').replace(/\/+$/, '');
          const pluginId = (env.PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID ?? '').trim();
          const mockFlag = (env.ACCIOGEST_MOCK_CATALOG ?? '').trim().toLowerCase();
          const mock = mockFlag === 'fetch' ? 'fetch' : mockFlag && mockFlag !== '0' && mockFlag !== 'false' ? 'fixture' : null;
          const ours = JSON.parse(readFileSync(join(root, 'src/data/servicios.json'), 'utf8'));
          const ourCurrency = String(ours.currency ?? 'EUR');
          const linked = linkedServiceIds(ours, Boolean(mock));
          const warn = (/** @type {string} */ m) => logger.warn(m);

          const committed = readSnapshot(SNAPSHOT);
          const cached = readSnapshot(CACHE);
          /** La copia buena más reciente que cumpla `match` (por saved_at). @param {(s: any) => any} pickPart */
          const lastGood = (pickPart) =>
            [committed, cached]
              .map((s) => (s ? pickPart(s) : null))
              .filter(Boolean)
              .sort((a, b) => String(b.saved_at ?? '').localeCompare(String(a.saved_at ?? '')))[0] ?? null;

          /** @type {any} */
          const out = { mock: Boolean(mock), plugin_id: null, catalog: null, catalog_source: 'off', plans: {} };
          /** @type {any} */
          const fresh = { plugin_id: null, catalog: null, plans: {} };
          const now = new Date().toISOString();
          /** form_id configurado de cada plan (para elegir su copia buena al escribir). @type {Record<string, string>} */
          const planFormIds = {};

          // ---- Catálogo de reservas (en paralelo con los planes: 8 s como máximo en total) ----
          const loadCatalog = async () => {
            if (!isConfigured(pluginId)) {
              if (mock) warn('ACCIOGEST_MOCK_CATALOG necesita un BOOKING_PLUGIN_ID (vale uno inventado): sin ID no se mezcla nada.');
              return;
            }
            out.plugin_id = pluginId;
            const url = `${api}/plugin-citas/public/${encodeURIComponent(pluginId)}/catalogo`;
            try {
              const json = mock === 'fixture' ? JSON.parse(readFileSync(join(MOCK_DIR, 'catalogo.json'), 'utf8')) : await getJson(url);
              const v = validateCatalog(json, ourCurrency, warn, linked.map((l) => l.id));
              if ('error' in v) throw new Error(`respuesta no válida: ${v.error}`);
              out.catalog = v.data;
              out.catalog_source = mock ? 'mock' : 'api';
              fresh.plugin_id = pluginId;
              fresh.catalog = { saved_at: now, data: v.data };
              logger.info(`Catálogo de AccioGest${mock ? ' (PRUEBA)' : ''}: ${v.data.servicios.length} servicios.`);
            } catch (e) {
              const good = lastGood((s) => (s.plugin_id === pluginId && isObj(s.catalog) ? s.catalog : null));
              out.catalog = good?.data ?? null;
              out.catalog_source = good ? 'last-good' : 'none';
              warn(
                `⚠ No se ha podido leer el catálogo de AccioGest (${url}): ${reason(e)}. ` +
                  (good
                    ? `Se usa la última copia buena (guardada el ${good.saved_at}).`
                    : 'No hay copia buena: se usan los precios de src/data/servicios.json.'),
              );
            }
          };

          // ---- Precio de cada plan (form-builder) ----
          const loadPlan = async (/** @type {(typeof PLAN_KEYS)[number]} */ key) => {
            const formId = (env[`PUBLIC_ACCIOGEST_PLAN_${key.toUpperCase()}`] ?? '').trim();
            if (!isConfigured(formId)) return;
            planFormIds[key] = formId;
            const url = `${api}/form-builder/public/${encodeURIComponent(formId)}`;
            try {
              const json = mock === 'fixture' ? JSON.parse(readFileSync(join(MOCK_DIR, 'plan-form.json'), 'utf8'))[key] : await getJson(url);
              const amount = extractPlanAmount(json);
              if (amount === undefined) throw new Error('no se encuentra el importe del campo de pago');
              out.plans[key] = { form_id: formId, amount };
              fresh.plans[key] = { form_id: formId, amount, saved_at: now };
            } catch (e) {
              const good = lastGood((s) => (isObj(s.plans?.[key]) && s.plans[key].form_id === formId ? s.plans[key] : null));
              if (good) out.plans[key] = { form_id: formId, amount: good.amount };
              warn(
                `⚠ No se ha podido leer el precio del plan «${key}» en AccioGest (${url}): ${reason(e)}. ` +
                  (good ? `Se usa la última copia buena (${good.amount} €, ${good.saved_at}).` : 'Se usa el de servicios.json.'),
              );
            }
          };

          await Promise.all([loadCatalog(), ...PLAN_KEYS.map(loadPlan)]);

          // ---- Enlazados que no están en el catálogo usado (nuevo o última copia buena) ----
          // Despublicados o borrados en AccioGest: services.ts oculta ese precio (asesoría o plan)
          // y no lo pasa al widget. Se avisa para revisar acciogest_id (no por los ids de prueba
          // `mock-…` que el fixture no trae). Y si el nombre o la duración no coinciden con
          // servicios.json, se avisa de que lead_value no cambia solo.
          if (out.catalog) {
            const got = new Map(out.catalog.servicios.map((/** @type {any} */ s) => [s.id, s]));
            const from = out.catalog_source === 'last-good' ? ' (última copia buena)' : '';
            for (const l of linked) {
              const s = got.get(l.id);
              if (!s) {
                if (l.auto) continue;
                warn(
                  `⚠ El servicio «${l.id}» (servicios.json → ${l.where}) no está en el catálogo de AccioGest${from}: ` +
                    (l.plan ? 'no se muestra el precio del plan.' : 'no se muestra su precio ni se ofrece en el widget.'),
                );
                continue;
              }
              const renamed = s.nombre && l.name && s.nombre !== l.name;
              const retimed = !l.plan && s.duracion_min && l.minutes && s.duracion_min !== l.minutes;
              if (renamed || retimed) {
                warn(
                  `El servicio «${l.id}» (servicios.json → ${l.where}) se llama «${s.nombre ?? l.name}»` +
                    (retimed ? ` y dura ${s.duracion_min} min (servicios.json: ${l.minutes} min)` : '') +
                    ` en AccioGest; su lead_value sigue siendo «${l.lead}»: revísalo en src/data/servicios.json.`,
                );
              }
            }
          }

          // ---- Última copia buena (nunca en modo de prueba) ----
          if (!mock && (fresh.catalog || Object.keys(fresh.plans).length)) {
            // Cada parte sale de la copia más reciente que la tenga (la recién descargada, la
            // caché de compilación o el archivo versionado), no solo del archivo versionado: en
            // Netlify ese archivo sigue como en git y la copia buena solo vive en la caché.
            // Con los mismos filtros que la lectura: primero la copia del ID configurado ahora (para
            // no pisar la copia buena de este ID con otra más reciente de otro ID, p. ej. staging vs
            // producción) y, solo si no hay ninguna, la más reciente sin filtrar.
            const catalogPart = (/** @type {any} */ s) =>
              isObj(s.catalog) ? { plugin_id: s.plugin_id ?? null, catalog: s.catalog, saved_at: s.catalog.saved_at } : null;
            const goodCatalog = fresh.catalog
              ? { plugin_id: fresh.plugin_id, catalog: fresh.catalog }
              : (lastGood((s) => (s.plugin_id === pluginId ? catalogPart(s) : null)) ??
                lastGood(catalogPart) ?? {
                  plugin_id: null,
                  catalog: null,
                });
            /** @type {Record<string, unknown>} */
            const plans = {};
            for (const key of PLAN_KEYS) {
              const formId = planFormIds[key];
              const good =
                fresh.plans[key] ??
                (formId ? lastGood((s) => (isObj(s.plans?.[key]) && s.plans[key].form_id === formId ? s.plans[key] : null)) : null) ??
                lastGood((s) => (isObj(s.plans?.[key]) ? s.plans[key] : null));
              if (good) plans[key] = good;
            }
            const next = {
              _comment:
                'Última respuesta buena de AccioGest (la escribe la compilación: src/integrations/acciogest-catalog.mjs). Se usa si AccioGest no responde. No editar a mano.',
              plugin_id: goodCatalog.plugin_id,
              catalog: goodCatalog.catalog,
              plans,
            };
            // El archivo versionado solo se reescribe si cambian los datos (no por la fecha).
            // Sin fechas y con los servicios ordenados por id: ni el orden de la API ni saved_at cuentan.
            const strip = (/** @type {any} */ s) =>
              JSON.stringify(s, (k, v) => {
                if (k === 'saved_at' || k === '_comment') return undefined;
                if (k === 'servicios' && Array.isArray(v)) {
                  return [...v].sort((a, b) => String(a?.id ?? '').localeCompare(String(b?.id ?? ''), 'en', { numeric: true }));
                }
                return v;
              });
            try {
              if (!committed || strip(committed) !== strip(next)) writeFileSync(SNAPSHOT, `${JSON.stringify(next, null, 2)}\n`);
            } catch (e) {
              warn(`No se ha podido guardar ${SNAPSHOT}: ${reason(e)}`);
            }
            try {
              mkdirSync(dirname(CACHE), { recursive: true });
              writeFileSync(CACHE, `${JSON.stringify(next, null, 2)}\n`);
            } catch {
              /* sin caché: no pasa nada */
            }
          }
          return out;
        };

        updateConfig({
          vite: {
            plugins: [
              {
                name: 'acciogest-catalog',
                resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
                async load(id) {
                  if (id !== RESOLVED_ID) return undefined;
                  pending ??= load();
                  return `export default ${JSON.stringify(await pending)};`;
                },
              },
            ],
          },
        });
      },
    },
  };
}

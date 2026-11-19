# Cómo conectar la web de Denisse a AccioGest (cambios en la web)

Para: quien mantiene `IssaAcciosoft/dennise-web` (rama `claude/exciting-hypatia-hfwwmq`, último commit revisado `3d494b4`, 10-11).
Fecha: 12-11-2026. Escrito contra la rama de la API `feat/denisse-planes-mensuales` (aún no en producción) y el montaje `planes-2026-10-27/sql/montaje-619.sql` (aún no aplicado).

Este documento dice qué fichero y qué función de la web hay que tocar, con el código. Complementa `RESPUESTAS-WEB.md` (que responde a las dudas del `TODO (AccioGest)`) y no lo sustituye.

## 0. Lo que tiene que ocurrir antes (no depende de la web)

Orden obligatorio. La web no se publica con los cambios de planes hasta el paso 4.

1. AccioGest despliega la rama `feat/denisse-planes-mensuales` en producción (suscripciones, webhook y widget con `service`).
2. El usuario de AccioGest aplica `montaje-619.sql`. Salen los ids (SELECT del punto 5).
3. Denisse pone sus claves de Stripe en AccioGest (hoy la empresa 619 no tiene ninguna) y el webhook de Stripe apunta a `https://api.acciogest.com/webhooks/stripe/619` (esto lo hace AccioGest con ella). Mientras no haya claves, solo vale probar con las claves de prueba de AccioGest.
4. AccioGest aplica `planes-mensuales-619.sql` (pone `payment_interval = 'month'` a los 3 planes). **Desde ese momento el enlace actual de «Contratar» (la página `…/form-builder/public/<id>/page`) deja de funcionar** (esa página cobra un pago único y la API le contesta 400 `USAR_CHECKOUT_SUSCRIPCION`). Por eso la web nueva y este UPDATE se publican el mismo día: primero se prepara la web, se ponen las variables de Netlify, y justo antes de publicar se aplica el UPDATE.
5. Dos cosas que AccioGest tiene que hacer y que la web necesita (están descritas en el punto 6): añadir a los 3 planes el campo de la casilla de desistimiento y fijar el horario de Denisse (usuario 909) para que el widget de reservas ofrezca huecos.

Hasta que los pasos 1 a 4 estén hechos, la web sigue en modo simulado (los ids siguen siendo `FORM_ID_…`) y no pasa nada.

---

## 1. Planes mensuales: el botón «Contratar» ya no abre la página de AccioGest

### Qué cambia

Hoy, `src/components/services/AutogestionPlans.astro` pone un enlace (`planPageUrl()` de `src/config/acciogest.ts`) a `…/form-builder/public/<id>/page` en pestaña nueva. Con la cuota mensual eso ya no sirve. La web tiene que:

1. pedir los datos al cliente (nombre, email, teléfono, dos casillas) en un diálogo propio de la web,
2. llamar a `POST https://api.acciogest.com/form-builder/public/<id>/create-checkout-session`,
3. redirigir a la dirección de Stripe que devuelve.

AccioGest guarda la respuesta como «pendiente de pago» antes de ir a Stripe. Cuando Stripe confirma el cobro (webhook), la marca como pagada y registra cada cuota. La web no tiene que hacer nada con eso.

### Ficheros a tocar

| Fichero | Cambio |
|---|---|
| `src/config/acciogest.ts` | Añadir `PLAN_FIELD_LABELS`, `STRIPE_PORTAL_URL` y `planCheckoutUrl()`. Dejar `planPageUrl()` pero ya no usarlo. |
| `src/scripts/acciogest.ts` | Nueva función `startPlanCheckout()` (junto a `submitLead`). |
| `src/components/services/AutogestionPlans.astro` | El enlace «Contratar» pasa a ser un botón que abre un diálogo; el texto de precio pasa a «al mes». |
| `src/components/forms/PlanCheckoutDialog.astro` y `src/scripts/plan-checkout.ts` (nuevos) | El diálogo y su controlador. Copiar la estructura de `FormDialog.astro` + `LeadForm.astro` + `lead-form.ts` (mismas clases, honeypot, `aria-live`, cuenta atrás del 429). |
| `src/pages/gracias.astro` | Texto de cuota mensual y enlace al portal (punto 6). |

### `src/config/acciogest.ts`

```ts
/** Etiquetas EXACTAS de los campos de los formularios de plan en AccioGest (montaje-619.sql + la casilla de desistimiento, punto 6). */
export const PLAN_FIELD_LABELS = {
  nombre: 'Nombre',
  email: 'Email',
  telefono: 'Teléfono',
  consentimiento: 'Consentimiento RGPD',
  desistimiento: 'Inicio inmediato del servicio',
} as const;

/** Enlace al portal de cliente de Stripe (cancelar, cambiar tarjeta, recibos). Vacío = no se muestra. */
export const STRIPE_PORTAL_URL = pick(import.meta.env.PUBLIC_STRIPE_PORTAL_URL, '');

/** Ruta que crea el pago mensual de un plan. */
export const planCheckoutUrl = (key: PlanKey): string | null =>
  isConfigured(PLANES[key])
    ? `${ACCIOGEST_API}/form-builder/public/${encodeURIComponent(PLANES[key])}/create-checkout-session`
    : null;
```

(`pick` ya existe en ese fichero. Si `PUBLIC_STRIPE_PORTAL_URL` no se define, `pick` debe devolver `''`; si su segundo argumento es obligatorio, pasar `''`.)

### `src/scripts/acciogest.ts`: `startPlanCheckout()`

Reutiliza `captureUtms`, `UTM_KEYS`, `ACCIOGEST_API` e `isConfigured`, que ya están importados en el fichero. Añadir `PLAN_FIELD_LABELS`, `PLANES`, `planCheckoutUrl` y `type PlanKey` al `import … from '~/config/acciogest'`.

```ts
export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; kind: 'validation'; message: string; fields: string[] }       // 400 de datos
  | { ok: false; kind: 'unavailable'; message: string }                         // 404, o plan sin configurar, o 400 de configuración
  | { ok: false; kind: 'rate_limited'; message: string; retryAfter: number }    // 429
  | { ok: false; kind: 'network'; message: string }                             // red, CORS o > 15 s
  | { ok: false; kind: 'server'; message: string };                             // 502 / 500

/** El teléfono que acepta AccioGest: opcional «+» al principio y solo dígitos, espacios, guiones y paréntesis (sin puntos). */
export function cleanPhone(raw: string): string {
  const t = raw.trim().replace(/\./g, ' ').replace(/(?!^)\+/g, '');
  return t.replace(/[^\d\s\-()+]/g, '').replace(/\s{2,}/g, ' ').trim();
}

export async function startPlanCheckout(
  plan: PlanKey,
  v: { nombre: string; email: string; telefono: string; consentimiento: boolean; desistimiento: boolean },
): Promise<CheckoutResult> {
  const endpoint = planCheckoutUrl(plan);
  if (!endpoint) return { ok: false, kind: 'unavailable', message: 'Este plan no está disponible ahora mismo.' };
  if (!v.consentimiento || !v.desistimiento) {
    return { ok: false, kind: 'validation', message: 'Falta aceptar las casillas obligatorias.', fields: ['consentimiento', 'desistimiento'] };
  }
  const L = PLAN_FIELD_LABELS;
  const body = {
    response_data: {
      [L.nombre]: v.nombre.trim(),
      [L.email]: v.email.trim(),
      [L.telefono]: cleanPhone(v.telefono),
      [L.consentimiento]: 'sí',
      [L.desistimiento]: 'sí',
    },
    ...captureUtms(), // utm_source, utm_medium, utm_campaign EN LA RAÍZ del cuerpo (no dentro de response_data)
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
      // IMPRESCINDIBLE: con la política del sitio (strict-origin-when-cross-origin) el Referer llega sin ruta
      // y, si el cliente cancela en Stripe, AccioGest lo devolvería a la portada. Con esta política llega la URL completa.
      referrerPolicy: 'no-referrer-when-downgrade',
      signal: controller.signal,
    });
    let json: Record<string, unknown> = {};
    try { const p: unknown = await res.json(); if (p && typeof p === 'object') json = p as Record<string, unknown>; } catch { /* sin cuerpo */ }
    const err = typeof json.error === 'string' ? json.error : '';

    if (res.status === 200 && typeof json.url === 'string') {
      // Solo se redirige a Stripe: nunca a una dirección que devuelva otra cosa.
      try { if (new URL(json.url).hostname === 'checkout.stripe.com') return { ok: true, url: json.url }; } catch { /* inválida */ }
      return { ok: false, kind: 'server', message: 'No se ha podido preparar el pago. Inténtalo de nuevo.' };
    }
    if (res.status === 400 && Array.isArray(json.missing_fields)) {
      return { ok: false, kind: 'validation', message: err || 'Faltan campos obligatorios.', fields: json.missing_fields.map(String) };
    }
    if (res.status === 400 && /email|teléfono|telefono/i.test(err)) {
      return { ok: false, kind: 'validation', message: err, fields: [] };
    }
    if (res.status === 400 || res.status === 404 || res.status === 403) {
      // 400 «no tiene cobro mensual», «Stripe no está configurado», «USAR_CHECKOUT_SUSCRIPCION»…: configuración, no el cliente.
      return { ok: false, kind: 'unavailable', message: 'Este plan no se puede contratar online ahora mismo.' };
    }
    if (res.status === 429) return { ok: false, kind: 'rate_limited', message: 'Demasiados intentos seguidos.', retryAfter: 60 };
    return { ok: false, kind: 'server', message: 'No se ha podido preparar el pago. Inténtalo de nuevo.' };
  } catch {
    return { ok: false, kind: 'network', message: 'No se ha podido conectar con el servidor.' };
  } finally {
    clearTimeout(timer);
  }
}
```

### El cuerpo exacto que espera la ruta

```json
POST https://api.acciogest.com/form-builder/public/<id del plan>/create-checkout-session
Content-Type: application/json

{
  "response_data": {
    "Nombre": "Ana Pérez",
    "Email": "ana@correo.com",
    "Teléfono": "+34 600 000 000",
    "Consentimiento RGPD": "sí",
    "Inicio inmediato del servicio": "sí"
  },
  "utm_source": "instagram",
  "utm_medium": "social",
  "utm_campaign": "lanzamiento"
}
```

- Las claves de `response_data` son las etiquetas de los campos del formulario del plan, escritas igual (con tilde y mayúsculas). Son obligatorios los marcados con * en AccioGest: Nombre, Email, Teléfono, Consentimiento RGPD y la casilla de desistimiento (cuando AccioGest la añada, punto 6).
- El email tiene que ser válido. El teléfono solo puede llevar `+` al principio, dígitos, espacios, guiones y paréntesis (sin puntos): por eso `cleanPhone()`.
- La empresa, el importe, la moneda y las direcciones de vuelta salen del formulario en AccioGest. La web no envía ni puede cambiar nada de eso.
- No hace falta `redirect_con_retorno` en esta ruta: siempre añade `response_id`, `pago=ok` y `session_id`.

### Respuesta correcta (200)

```json
{ "url": "https://checkout.stripe.com/c/pay/cs_test_…", "sessionId": "cs_test_…", "response_id": 123 }
```

La web hace `window.location.assign(url)`. No hay que guardar nada.

### Errores y qué mostrar

| Código | Cuerpo (ejemplo) | Qué muestra la web |
|---|---|---|
| 400 | `{"error":"Faltan campos obligatorios","missing_fields":["Teléfono"]}` | Marcar esos campos (mapear etiqueta a campo con `PLAN_FIELD_LABELS`). |
| 400 | `{"error":"El campo \"Email\" debe ser un email válido"}` o `…"Teléfono" debe ser un número de teléfono válido` | Marcar el campo y mostrar el mensaje. |
| 400 | `{"error":"Hace falta un email válido para la suscripción"}` | Marcar el email. |
| 400 | `{"error":"Este formulario no tiene cobro mensual configurado"}`, `{"error":"Stripe no está configurado para esta empresa"}`, `{"error":"No se puede saber a dónde volver tras el pago"}`, `{"error":"La URL de redirección del formulario no es válida"}` | Es un fallo de configuración, no del cliente: «Este plan no se puede contratar online ahora mismo» + WhatsApp. Avisar a AccioGest. |
| 400 | `{"error":"…usa create-checkout-session","code":"USAR_CHECKOUT_SUSCRIPCION"}` | **Solo llega si se llama a `/submit` o a `/create-payment-intent` de un plan mensual** (error de programación en la web). No debe verse nunca si se usa la ruta de este apartado. |
| 404 | `{"error":"Formulario no encontrado o inactivo"}` | «Este plan no está disponible ahora mismo» + WhatsApp. (También sale 404 si el id del plan no es un número entero.) |
| 429 | `{"error":"…"}` | Bloquear el botón 60 s con cuenta atrás. La cabecera `Retry-After` no se puede leer desde la web. El límite es 120 envíos cada 10 minutos por conexión, compartido con los formularios de contacto. |
| 502 | `{"error":"No se pudo preparar el pago. Inténtalo de nuevo."}` | Mostrar ese mensaje y dejar reintentar. La respuesta queda guardada como «fallida» en AccioGest y no aparece en su lista. Stripe tiene 10 s de tiempo máximo y un reintento. |
| 500 | `{"error":"Error al preparar el pago"}` | Igual que 502. |
| Red / > 15 s | — | «No se ha podido conectar», conservar los datos, botón de reintentar y WhatsApp. |

Cada intento que llega a Stripe crea una fila «pendiente» en AccioGest; si el cliente cancela, queda así y no cuenta como venta. No hay que hacer nada para limpiarla.

### `AutogestionPlans.astro`

Sustituir el `<a … href={payUrl} target="_blank">` por un botón que abre el diálogo; el enlace a WhatsApp del `else` se queda igual para cuando el plan no esté configurado:

```astro
{checkoutOn ? (
  <button type="button" class="btn btn--block btn--outline" data-plan-checkout={plan.form_key}
          data-plan-name={plan.name} data-lead-value={plan.lead_value}>
    <span>Contratar {plan.name}</span>
  </button>
) : ( /* el <a> de WhatsApp de ahora */ )}
```

con `const checkoutOn = planCheckoutUrl(plan.form_key as PlanKey) !== null;` en lugar de `payUrl`. El precio pasa a decir que es mensual: donde hoy está `<span class="currency">€</span>` poner `<span class="currency">€ al mes</span>` y en `plan-vat` «{CATALOG.tax_label} · cuota mensual, cancelas cuando quieras» (el texto exacto de la baja, el del punto 6). El pie `plan-terms` pasa a: «Pago seguro con tarjeta, cuota mensual. Al contratar aceptas las condiciones de contratación».

### El diálogo (`PlanCheckoutDialog.astro` + `plan-checkout.ts`)

Contenido, antes del botón de pago y en la misma pantalla (lo exige la ley de consumo para una cuota recurrente):

- Plan elegido y su importe: «Plan Estándar · 315 € al mes (IVA incluido)».
- «Se cobra cada mes con tu tarjeta hasta que te des de baja. Primer cobro: hoy.»
- «Cómo darte de baja: …» (texto del punto 6) y el enlace a `/condiciones-contratacion/`.
- Campos: Nombre*, Email*, Teléfono* (este formulario lo exige), la casilla del consentimiento de privacidad* y la casilla de desistimiento* con el texto exacto del punto 6.
- Honeypot `website`, como en `LeadForm`.
- Botón «Pagar y contratar» (mismo texto que ya tiene el formulario en AccioGest).

Controlador (resumen; la validación en español y los estados son los de `lead-form.ts`):

```ts
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (sending || honeypotFilled()) return;
  sending = true; setBusy(true);
  const r = await startPlanCheckout(planKey, {
    nombre: val('nombre'), email: val('email'), telefono: val('telefono'),
    consentimiento: checked('consentimiento'), desistimiento: checked('desistimiento'),
  });
  if (r.ok) { window.location.assign(r.url); return; }   // no se libera el botón: se está yendo a Stripe
  sending = false; setBusy(false);
  showError(r);   // validation → marcar r.fields; rate_limited → cuenta atrás r.retryAfter; network/server/unavailable → mensaje + WhatsApp
});
```

### Qué llega a `/gracias/`

Tras pagar, Stripe devuelve al cliente a la `redirect_url` del plan (`https://denisseg.netlify.app/gracias/?tipo=plan&plan=<basico|estandar|premium>`, ya configurada en el SQL) con tres parámetros añadidos:

```
/gracias/?tipo=plan&plan=estandar&response_id=123&pago=ok&session_id=cs_test_a1b2…
```

| Parámetro | Valor | Uso en la web |
|---|---|---|
| `tipo` | `plan` | Ya lo lee `gracias.astro` (bloque «plan»). |
| `plan` | `basico`, `estandar` o `premium` | Ya lo lee (nombre del plan y lo que incluye). |
| `pago` | `ok` | Ya lo lee: distinto de `ok` = «pago no completado». |
| `response_id` | número de la respuesta en AccioGest | No mostrar. Sirve para soporte («dame tu número de pedido»). |
| `session_id` | `cs_…` de Stripe | No mostrar ni guardar. |

Atención: `pago=ok` lo trae la dirección de vuelta, no lo comprueba nadie; la página es solo informativa (como ya es). El cobro real lo confirma el webhook en AccioGest. Si el cliente cancela en Stripe vuelve a la página desde la que empezó (por eso el `referrerPolicy` de arriba), sin parámetros.

---

## 2. Formularios servicio, historia y contacto

Fichero: `src/scripts/acciogest.ts`, funciones `buildResponseData()` y `submitLead()`. Lo que ya hace la web bien: usar las etiquetas exactas, omitir opcionales vacíos, `sí`/`no` en minúscula, honeypot, tratar 201/400/403/404/429.

### Etiquetas exactas (las del SQL, ya coinciden con `FIELD_LABELS`)

| Formulario | Etiquetas de `response_data` (* = obligatorio en AccioGest) |
|---|---|
| servicio | Nombre*, Email*, Teléfono, Servicio*, Mensaje, Consentimiento RGPD* |
| historia | Nombre*, Email*, Teléfono, País*, Tema*, Historia*, Compartir públicamente*, Anonimato*, Cómo contactarte*, Instagram, Consentimiento RGPD* |
| contacto | Nombre*, Email*, Teléfono, Mensaje*, Consentimiento RGPD* |

`Versión política` no es un campo en AccioGest: se puede seguir enviando (la respuesta se guarda entera) y sirve de prueba de qué política se aceptó.

### Cambio 1: UTM a la raíz del cuerpo, no dentro de `response_data`

AccioGest solo lee `utm_source`, `utm_medium` y `utm_campaign` (y `utm_content`, `utm_term`) de la raíz. Dentro de `response_data` se guardan pero no cuentan para el origen del lead.

En `buildResponseData()` borrar el bloque:

```ts
const utms = captureUtms();
for (const key of UTM_KEYS) {
  if (utms[key]) data[labels[key]] = utms[key];
}
```

y en `submitLead()` cambiar el cuerpo:

```ts
body: JSON.stringify({ response_data: data, ...captureUtms() }),
```

En `src/config/acciogest.ts`, quitar las tres claves `utm_*` de `COMMON` (si no, `?acciogest_debug=1` avisará de que no existen en AccioGest). `META_FIELDS` puede seguir igual.

### Cambio 2: teléfono

El formulario de la web acepta puntos (`TEL_RE = /^[+()\d\s.\-]{6,25}$/` en `src/scripts/lead-form.ts`) pero AccioGest responde 400 «debe ser un número de teléfono válido» si hay un punto o un `+` que no esté al principio. Dos opciones, la primera es la buena:

1. Limpiar antes de enviar con la misma `cleanPhone()` del punto 1, y en `buildResponseData()`: `const value = name === 'telefono' ? cleanPhone(normaliseValue(values[name])) : normaliseValue(values[name]);`.
2. O quitar el `.` de `TEL_RE`.

Mínimo de AccioGest: el campo `Teléfono` es opcional en servicio, historia y contacto, y obligatorio en los planes.

### Cambio 3 (opcional): recibir `response_id` en una redirección

Los formularios de leads no tienen `redirect_url` (la web muestra el `message` del 201). Si algún día se quiere redirigir a otra página con el número de respuesta, enviar `"redirect_con_retorno": true` en el cuerpo y poner `redirect_url` al formulario en AccioGest: el 201 devuelve entonces `redirect_url` con `&response_id=…` añadido. Sin esa clave, todo sigue igual. Hoy no hace falta.

### Respuesta correcta

`201 {"success":true,"message":"…","response_id":456,"redirect_url":null,"payment_id":null}`. La web ya muestra `message`.

---

## 3. Importe de los planes: leer la raíz del JSON

Fichero: `src/integrations/acciogest-catalog.mjs`, función `extractPlanAmount(json)` (línea 207). Hoy solo busca dentro de `fields[]` y no lo encuentra, así que cada compilación avisa «no se encuentra el importe» y usa el de `servicios.json`.

`GET https://api.acciogest.com/form-builder/public/<id>` devuelve en la raíz:

```json
{ "payment_enabled": true, "payment_amount": 315, "payment_currency": "EUR",
  "payment_interval": "month", "payment_concept": "Autogestión DG · Plan Estándar",
  "payment_button_text": "Pagar y contratar", "fields": [ … ] }
```

(`payment_amount` es un número en euros, tal cual se cobra, sin céntimos; `payment_interval` es `"month"` en los mensuales y `null` en los de pago único.) Añadir al principio de la función, tras comprobar `isObj(json)`:

```js
  // AccioGest: importe en la raíz del JSON (no en fields[]).
  if (j.payment_enabled === true) {
    const root = toNumber(j.payment_amount);
    if (root !== undefined && root > 0) return root;
  }
```

El resto de la función (búsqueda en `fields[]`) puede quedarse como respaldo. Opcional: en `loadPlan()`, tras leer `json`, avisar en la compilación si `json.payment_interval !== 'month'` («el plan X no es mensual en AccioGest: falta aplicar planes-mensuales-619.sql»); así se detecta el olvido del UPDATE del punto 0. Actualizar también el fixture `tests/…/plan-form.json` (los tres planes) con esos campos de raíz para que la prueba `ACCIOGEST_MOCK_CATALOG=1` cubra el caso real.

El importe va tal cual: 242 / 315 / 425 son lo que Stripe cobra cada mes. Si Denisse confirma que el IVA **no** está incluido, hay que cambiarlo en AccioGest y quitar el «IVA incluido» de la web (`tax_label` en `servicios.json`, `AutogestionPlans.astro` y `condiciones-contratacion.astro`).

---

## 4. Reservas (widget de citas)

Ficheros: `src/config/acciogest.ts` (`bookingScriptUrl`), `src/components/services/BookingSlot.astro` (script de cliente), `src/data/servicios.json`.

### Qué es cada id

El parámetro `service` es el **`plugin_citas_services.id`** (un número entero, p. ej. `41`) del servicio dentro del plugin 619, no un uuid ni un id de catálogo. Hay 6 servicios (online y presencial separados) y salen del SELECT del punto 5. El widget ignora un `service` que no sea de ese plugin.

### `servicios.json`: `acciogest_id`

En cada elemento de `consultations[].prices[]` poner el id como **texto**:

```json
{ "modality": "online", "amount": 60, "acciogest_id": "41" }
```

Los planes (`programs[].plans[]`) se dejan con `"acciogest_id": null`: el importe de los planes sale del formulario (punto 3), no del plugin.

### La ruta `/catalogo` no existe

`GET /plugin-citas/public/<id>/catalogo` no está en la API ni se va a hacer por ahora. Con `PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID` puesto, `acciogest-catalog.mjs` la pide, recibe 404 y cae a los precios de `servicios.json` con el aviso «No se ha podido leer el catálogo de AccioGest» en el log de la compilación. Es el comportamiento previsto y **no rompe la compilación ni quita el `service` del widget** (con catálogo ausente, `services.ts` no marca ningún id como «despublicado»). Resultado: nombres, duraciones y precios son los de `servicios.json`, que coinciden con el SQL (60/80/30/50/45/65 €). Si se quiere quitar el aviso del log, se puede dejar de llamar a `loadCatalog()` cuando no haya catálogo; no es necesario.

### Script de incrustación

URL final (la arma `bookingScriptUrl()`):

```
https://api.acciogest.com/plugin-citas-embed.js?pluginId=<id del plugin>&service=<plugin_citas_services.id>&autoHeight=1
```

- `pluginId`: `plugin_citas_config.id` (número). **No** el `plugin_token`.
- `service` (opcional): servicio con el que se abre ya elegido.
- `autoHeight=1` (opcional): el propio script ajusta la altura del iframe. **La web ya ajusta la altura con el mensaje `height` (ver abajo), así que no hace falta**; si se añade, el iframe fija su `height` y la web se lo vuelve a fijar en el mismo mensaje (mismo valor salvo que sea menor de 760 px, donde la web gana por su mínimo). Recomendado: no añadirlo, para que solo haya un sitio que cambie la altura.

En `src/config/acciogest.ts` solo cambia el comentario de `bookingScriptUrl` (el `service` ahora es el id del servicio del plugin, no un `acciogest_id` de catálogo); la función ya añade `&service=`.

### Cambiar de servicio sin recargar la página

El script define `window.AccioGestBooking.setService(id)`: vuelve a montar el iframe con ese servicio (pasar `null` o `''` lo deja sin servicio elegido). Hoy `BookingSlot.astro` lo hace quitando y volviendo a inyectar el script, que funciona pero deja escuchas duplicadas. Cambiar, dentro de `inject()`, el bloque «Recarga con otro servicio»:

```ts
declare global {
  interface Window { AccioGestBooking?: { setService: (id: string | number | null) => void } }
}
// …
const inject = () => {
  if (loadedService === service) return;
  // Widget ya cargado: se cambia de servicio sin recargar el script ni la página.
  if (loadedService !== null && window.AccioGestBooking?.setService) {
    window.AccioGestBooking.setService(service || null);
    loadedService = service;
    cancelAnimationFrame(raf);
    frameHeight = 0;
    host.style.removeProperty('height');
    if (errorBox) errorBox.hidden = true;
    return;
  }
  // … (el resto igual: primera carga o respaldo si el script no expone setService)
```

Mantener el bloque antiguo como respaldo (por si el script viejo, sin `setService`, siguiera en caché).

### Mensajes `postMessage` del iframe

El iframe (origen **`https://api.acciogest.com`**) manda a `window.parent`:

| Mensaje | Cuándo | Contenido |
|---|---|---|
| `{ type: 'acciogest:booking:height', height: <px> }` | al cargar, al redimensionar y al cambiar de paso | altura del contenido |
| `{ type: 'acciogest:booking:done', citaId: <número o null>, serviceId: <número o null> }` | cita confirmada (y cobrada) | solo ids, sin datos personales |

La web ya los trata bien en `BookingSlot.astro` (comprueba el origen contra `bookingMessageOrigins()`, que por omisión es `ACCIOGEST_API`, y que el mensaje venga de su iframe). Comprobaciones que hay que mantener:

```ts
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://api.acciogest.com') return;     // equivalente: allowed.has(e.origin)
  if (e.source !== host.querySelector('iframe')?.contentWindow) return;
  …
});
```

`PUBLIC_ACCIOGEST_WIDGET_ORIGINS` no hace falta. `citaId` llega como **número**: la web ya lo acepta (`typeof … === 'number'`) y va a `/gracias/?tipo=reserva&cita=<id>`.

Cosas que conviene saber: al confirmar, si el plugin tuviera una `redirect_url` propia el widget la abre solo 2,5 s después, pero la web navega a `/gracias/` en el acto y gana; el montaje no pone `redirect_url` al plugin. El widget solo ofrece huecos del horario de la agenda de Denisse: si está vacío se ve un calendario sin días (ver el punto 7).

---

## 5. Variables de Netlify

Netlify → Site configuration → Environment variables (el README habla de las variables del repositorio de GitHub, pero el hosting es Netlify y es allí donde se leen al compilar). Son valores de **compilación**: tras cambiarlas hay que lanzar un despliegue nuevo (Deploys → Trigger deploy → Clear cache and deploy site).

Los ids salen de esta consulta que AccioGest ejecuta tras aplicar `montaje-619.sql`:

```sql
SELECT id, name FROM forms WHERE company_id = 619 ORDER BY id;
SELECT id, name FROM plugin_citas_config WHERE company_id = 619;
SELECT s.id, s.name, s.duration_min, s.price FROM plugin_citas_services s JOIN plugin_citas_config p ON p.id = s.plugin_id WHERE p.company_id = 619 ORDER BY s.position;
```

| Variable | Qué poner | Valor |
|---|---|---|
| `PUBLIC_ACCIOGEST_FORM_SERVICIO` | `forms.id` de «Solicitud de servicio» | `____` |
| `PUBLIC_ACCIOGEST_FORM_HISTORIA` | `forms.id` de «Cuéntame tu historia» | `____` |
| `PUBLIC_ACCIOGEST_FORM_CONTACTO` | `forms.id` de «Contacto» | `____` |
| `PUBLIC_ACCIOGEST_PLAN_BASICO` | `forms.id` de «Plan Básico» | `____` |
| `PUBLIC_ACCIOGEST_PLAN_ESTANDAR` | `forms.id` de «Plan Estándar» | `____` |
| `PUBLIC_ACCIOGEST_PLAN_PREMIUM` | `forms.id` de «Plan Premium» | `____` |
| `PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID` | `plugin_citas_config.id` (NO el token) | `____` |
| `PUBLIC_STRIPE_PORTAL_URL` (nueva) | Enlace del portal de cliente de Stripe (punto 6) | `https://billing.stripe.com/p/login/____` |
| `PUBLIC_ACCIOGEST_API` | No hace falta (por omisión `https://api.acciogest.com`) | — |
| `PUBLIC_ACCIOGEST_WIDGET_ORIGINS` | No hace falta | — |

Ids de los servicios de reserva para `servicios.json` (punto 4), a rellenar con la tercera consulta:

| Servicio en AccioGest | Precio | `acciogest_id` |
|---|---|---|
| Asesoría migratoria · 1 hora · online | 60 € | `____` |
| Asesoría migratoria · 1 hora · presencial | 80 € | `____` |
| Asesoría migratoria · 30 min · online | 30 € | `____` |
| Asesoría migratoria · 30 min · presencial | 50 € | `____` |
| Sesión de orientación académica · 30 min · online | 45 € | `____` |
| Sesión de orientación académica · 30 min · presencial | 65 € | `____` |

Los ids son números enteros sueltos (por ejemplo `32`), no uuid. `isConfigured()` los acepta.

---

## 6. Textos

Todos estos textos se pasan por revisión legal (agente `muro-legal`, solicitada por AccioGest) antes de publicarlos. Lo que va entre corchetes es una decisión de Denisse.

### 6.1 Condiciones de contratación (`src/pages/condiciones-contratacion.astro`)

El apartado 4 también necesita ajuste, además del 6 y el 7, porque dice «cada plan se contrata en su página de pago, que se abre en una pestaña nueva» y «las páginas de pago de AccioGest».

**Apartado 4, viñeta de Autogestión DG** (sustituir):

> Autogestión DG: cada plan se contrata en la propia web, con una **cuota mensual** que se cobra con tarjeta, a través de Stripe, el día de la contratación y el mismo día de cada mes siguiente hasta que te des de baja. El importe de la cuota es el indicado en el apartado 3.

**Apartado 4, viñeta del pago por adelantado** (sustituir): «El pago se realiza por adelantado, con tarjeta, a través de la plataforma de pago Stripe integrada en el sistema de reservas y en el proceso de contratación de los planes. Esta web no recibe ni guarda los datos de tu tarjeta.»

**Apartado 4, «Confirmación de la contratación»** (quitar el PENDIENTE): «Recibirás el recibo de cada pago de Stripe en el correo que indiques al contratar. En el caso de las asesorías, recibirás además un correo de confirmación de la cita.» (Solo es verdad si Denisse activa los recibos por correo en Stripe → Configuración → Correos electrónicos de clientes; confirmar con AccioGest antes de publicar.)

**Apartado 6, derecho de desistimiento** (añadir, tras la primera viñeta):

> **Planes de cuota mensual:** el plazo de 14 días se cuenta desde la primera cuota. Si desistes dentro de ese plazo, tras haber pedido que el servicio empiece de inmediato, pagarás la parte proporcional del servicio ya prestado hasta ese momento. Las cuotas siguientes se pagan por el servicio del mes que comienza, y solo puedes dejar de pagarlas dándote de baja como se explica en el apartado 7.

Y quitar el comentario `{/* PENDIENTE … casilla … */}` una vez que las casillas estén puestas.

**Apartado 7, añadir un párrafo nuevo:**

> **Baja de los planes mensuales.** Puedes darte de baja en cualquier momento, sin penalización y sin necesidad de justificarlo, desde tu portal de cliente de Stripe [enlace], o escribiéndonos por WhatsApp al {PHONE.display} o a {EMAIL.address}. La baja [surte efecto al terminar el mes que ya has pagado: no se cobrará la cuota siguiente y conservas el servicio hasta esa fecha] / [DECIDIR]. No se reembolsan cuotas ya pagadas por meses ya iniciados, sin perjuicio del derecho de desistimiento del apartado 6.

El apartado 7 actual («Una vez realizado el pago, las asesorías no se cancelan ni se reembolsan…») se queda, pero que diga «las asesorías». Importante: lo que se escriba tiene que ser lo que Stripe haga de verdad. El portal de cliente tiene un ajuste «Cancelar suscripciones: inmediatamente / al final del periodo»; Denisse lo fija a la vez (6.3).

### 6.2 Casilla de desistimiento (obligatoria en los 3 planes, y en la reserva)

> **DESFASADO (19-11):** la clave es `Desistimiento` (texto por plan en `HANDOFF-WEB.md`, punto 2) y el campo ya lo crea `montaje-619.sql`; no hace falta el INSERT de abajo. La reserva ya lleva su casilla en `legal_text`.

Texto de la casilla, junto a la casilla de privacidad, nunca premarcada:

```text
Solicito expresamente que el servicio comience a prestarse ya, dentro del plazo de desistimiento de 14 días. Sé que, si desisto, debo pagar la parte proporcional del servicio ya prestado, y que perderé el derecho a desistir cuando el servicio se haya prestado por completo.
```

- **Planes:** va en el diálogo del punto 1 y se envía como `"Inicio inmediato del servicio": "sí"`. Para que la API acepte esa clave y no se pueda saltar, AccioGest tiene que añadirla como campo del formulario (los campos del montaje solo se crean en formularios vacíos, así que va con un `INSERT` suelto, que ejecuta AccioGest, no la web):
  ```sql
  INSERT INTO form_fields (form_id, field_type, label, placeholder, is_required, field_order, options)
  SELECT f.id, 'checkbox', 'Inicio inmediato del servicio', NULL, 1, 5, '["sí"]'
  FROM forms f WHERE f.company_id = 619 AND f.name IN ('Plan Básico','Plan Estándar','Plan Premium')
    AND NOT EXISTS (SELECT 1 FROM form_fields x WHERE x.form_id = f.id AND x.label = 'Inicio inmediato del servicio');
  ```
  Hasta que se aplique, la web puede enviarla igual (se guarda en la respuesta aunque no sea campo) pero el servidor no la exige.
- **Reservas:** el widget es un iframe de AccioGest y la web no puede poner una casilla dentro. Hoy el widget tiene una sola casilla, «He leído y acepto la política de privacidad y las condiciones de contratación». Para cubrir el desistimiento, AccioGest cambia `plugin_citas_config.legal_text` de la 619 (`UPDATE`, ejecuta AccioGest) para incluir el texto de arriba. La web mantiene su línea bajo el widget («Pago seguro con tarjeta. Al reservar aceptas las condiciones de contratación»), pero esa línea sola no basta para el desistimiento.

### 6.3 Portal de cliente de Stripe (cancelar, cambiar tarjeta, recibos)

1. Denisse lo activa en su cuenta de Stripe: Configuración → Facturación → **Portal de clientes**: activar «Los clientes pueden cancelar suscripciones», «actualizar el método de pago» y «ver el historial de facturas»; marcar cómo se cancela (al final del periodo es lo habitual) y copiar el **enlace de inicio de sesión** (`https://billing.stripe.com/p/login/…`). El cliente entra con el correo con el que contrató.
2. Ese enlace es `PUBLIC_STRIPE_PORTAL_URL` (punto 5). La web lo pone en tres sitios: `/gracias/` (plan), `/condiciones-contratacion/` (apartado 7) y el diálogo de contratación («Podrás darte de baja cuando quieras desde tu portal de cliente»).
3. AccioGest todavía **no** manda el enlace del portal por correo ni genera enlaces personales; es el siguiente paso de su lado.
4. Cuando el cliente se da de baja en el portal, Stripe avisa a AccioGest (webhook) y la suscripción queda marcada como baja; el equipo lo ve en la app.

En `src/config/acciogest.ts`, usar `STRIPE_PORTAL_URL` solo si empieza por `https://billing.stripe.com/`; si no, no mostrar el enlace.

`src/pages/gracias.astro`, dentro del bloque `data-thanks="plan"`, tras el `<h1>`:

```astro
<p class="lead">Tu plan es de cuota mensual: se cobra cada mes con la tarjeta que has usado hasta que te des de baja. Recibirás el recibo de cada pago por correo.</p>
{portalOk && (
  <p><a class="btn btn--ghost" href={STRIPE_PORTAL_URL} target="_blank" rel="noopener">Gestionar mi suscripción o darme de baja</a></p>
)}
```

con `const portalOk = STRIPE_PORTAL_URL.startsWith('https://billing.stripe.com/');`. Y el `<p class="lead">` del bloque `data-thanks="reserva"` queda como está.

---

## 7. Lista de comprobación final (con tarjeta de prueba)

Hacerla en un despliegue de prueba de Netlify (rama o «deploy preview»), con las claves de prueba de Stripe puestas en AccioGest (no las de producción de Denisse). Tarjeta: `4242 4242 4242 4242`, cualquier fecha futura, cualquier CVC y código postal.

Antes de empezar:
- [ ] Variables de Netlify rellenadas y despliegue nuevo hecho; `acciogest_id` de los 6 servicios puestos en `servicios.json`.
- [ ] En AccioGest: rama de suscripciones en producción, `montaje-619.sql` y `planes-mensuales-619.sql` aplicados, claves de Stripe en la 619, casilla de desistimiento añadida, horario del usuario 909 fijado.
- [ ] En el log de la compilación no aparece «no se encuentra el importe del campo de pago» y los precios de los planes salen de AccioGest (242 / 315 / 425).
- [ ] La consola con `?acciogest_debug=1` no avisa de etiquetas que no existen (salvo `Versión política`).

Formularios:
- [ ] Contacto, solicitud de servicio e historia: enviar uno de cada con datos de prueba. Salen en AccioGest (empresa 619) con el lead y la etiqueta `web-contacto` / `web-servicio` / `web-historia`.
- [ ] Un envío con `?utm_source=prueba&utm_medium=web&utm_campaign=nov` aparece con esa atribución en el lead.
- [ ] Un teléfono con punto («600.123.456») se envía limpio y no da 400.
- [ ] Dejar un campo obligatorio vacío: la web marca el campo; sin consentimiento no se envía.

Planes (repetir con los tres):
- [ ] «Contratar» abre el diálogo y muestra «X € al mes», cuándo se cobra, cómo darse de baja y las dos casillas sin marcar.
- [ ] Sin teléfono o sin la casilla de desistimiento: no se envía y marca el campo.
- [ ] Con todo correcto: redirige a Stripe y la sesión pide **la cuota del plan al mes** (importe y «cada mes»), con el email puesto.
- [ ] Pagar con 4242: llega a `/gracias/?tipo=plan&plan=…&response_id=…&pago=ok&session_id=…`, con el nombre del plan, lo que incluye, el texto de cuota mensual y el enlace al portal.
- [ ] En AccioGest: la respuesta aparece como pagada, hay una fila de pago por la primera cuota, el lead y el cliente están creados.
- [ ] Cancelar en Stripe («Atrás»): vuelve a `/autogestion-dg/` (no a la portada) sin parámetros.
- [ ] Tarjeta que falla (`4000 0000 0000 0002`): Stripe lo rechaza dentro de su página y no llega a `/gracias/`.
- [ ] En el panel de Stripe (modo prueba): una suscripción activa por plan contratado; cancelar una desde el portal y comprobar que AccioGest la marca como baja.

Reservas:
- [ ] El widget carga (sin el aviso «No se ha podido cargar»), con calendario con huecos.
- [ ] «Reservar» en la tarjeta de «Asesoría migratoria 1 hora» abre el widget con ese servicio elegido; pulsar «Reservar» en otra tarjeta cambia de servicio **sin recargar la página**.
- [ ] La altura del widget se ajusta al pasar de paso (sin barra de scroll interna).
- [ ] Reservar y pagar con 4242: la web salta a `/gracias/?tipo=reserva&cita=<id>`; en AccioGest la cita está confirmada y pagada, y llega el correo de confirmación.
- [ ] Un mensaje `postMessage` simulado desde otro origen (consola del navegador) no hace nada.

Textos:
- [ ] Condiciones de contratación actualizadas (4, 6 y 7), sin comentarios `PENDIENTE`, y coherentes con lo que hace Stripe al darse de baja.
- [ ] La casilla de desistimiento está en los planes (y el `legal_text` de la reserva incluye el texto).
- [ ] El enlace del portal funciona (entrando con el email de la compra de prueba).

Al terminar la prueba, AccioGest borra los datos de prueba de la 619 y Denisse pone sus claves de producción de Stripe; hacer una compra real mínima antes de anunciar.

---

## Incoherencias detectadas entre la web y la API

1. **La página de pago de AccioGest deja de servir para los planes mensuales.** `…/form-builder/public/<id>/page` cobra un pago único; con `payment_interval = 'month'` la API le contesta 400. Por eso el botón de la web tiene que cambiar y publicarse junto con el UPDATE (punto 0).
2. **Referer y cancelación.** La web emite `Referrer-Policy: strict-origin-when-cross-origin` (`netlify.toml`); la API usa el Referer para la dirección de cancelación de Stripe, que así llegaría sin ruta (la portada). Se arregla en la llamada con `referrerPolicy: 'no-referrer-when-downgrade'`.
3. **Teléfono.** La web admite puntos, la API los rechaza con 400.
4. **UTM dentro de `response_data`.** La web las guarda ahí; la API solo las lee de la raíz del cuerpo.
5. **`extractPlanAmount()`** busca el importe en `fields[]` y está en la raíz del JSON (`payment_amount`).
6. **El catálogo (`/catalogo`) y `acciogest_id` por uuid de catálogo no existen**; el `service` del widget es el id del servicio del plugin. La web tolera el 404 (aviso en el log).
7. **El widget y `autoHeight`.** La web ya gestiona la altura con su propio escuchador; con `autoHeight=1` habría dos sitios cambiándola.
8. **La casilla de desistimiento no existe aún en AccioGest** (ni en los planes ni en la reserva) y las condiciones de la web tienen un comentario `PENDIENTE` por eso.
9. **Condiciones de contratación desfasadas**: el apartado 4 habla de pago en «página de pago… pestaña nueva» y el 6 y el 7 de pago único.
10. **Correo de confirmación al que paga un plan:** AccioGest no envía ninguno; solo llegará el recibo de Stripe si Denisse lo activa. La web no debe prometer más.
11. **El README de la web** dice que las variables se leen de las variables del repositorio de GitHub; el hosting es Netlify y allí es donde van.
12. **Baja de la suscripción:** la API registra la baja que llega de Stripe (`customer.subscription.deleted`) pero no tiene aún pantalla ni correo con el enlace del portal; la baja solo se puede hacer desde el portal de Stripe o pidiéndola a Denisse por WhatsApp o email (y ella la hace en Stripe).

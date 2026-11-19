# Integración web ↔ AccioGest

Fuente: respuestas del equipo de AccioGest (02/10/2026; fase A, 27/10/2026; planes mensuales,
handoff del 19/11/2026 en `docs/handoff-acciogest-2026-11-19.md`, que **prevalece** sobre lo
anterior donde no coincidan: ver «Planes mensuales (handoff 19-11)» al final). Este
documento es la especificación que sigue el código (`src/config/acciogest.ts`,
`src/scripts/acciogest.ts`, `src/scripts/lead-form.ts`, `src/data/servicios.json`,
`src/integrations/acciogest-catalog.mjs`, `src/lib/services.ts`). Resumen de uso: README →
«AccioGest».

## Resumen

| Pieza | Cómo se integra | Estado |
|---|---|---|
| Reservas de asesorías (con pago previo) | Widget de AccioGest embebido (iframe): servicio, día y hora, modalidad, datos, RGPD y pago con Stripe | Falta `BOOKING_PLUGIN_ID` |
| Catálogo de servicios | `src/data/servicios.json` + catálogo público de AccioGest al compilar, mezclado por `acciogest_id` (fase A) | Hecho; en desarrollo en AccioGest |
| Planes Autogestión DG (242 / 315 / 425 €/mes, cuota mensual) | Diálogo propio (`PlanCheckoutDialog.astro` + `plan-checkout.ts`) → `create-checkout-session` → Stripe; el importe, de la raíz del JSON del formulario (handoff 19-11) | Faltan los 3 IDs; no publicar hasta que AccioGest lo diga |
| Leads: solicitud de servicio, "Cuéntame tu historia", contacto | HTML propio + `fetch` POST al form-builder público | Faltan los 3 `FORM_ID` |
| Captcha | No existe en AccioGest; no se usa. Se usa un campo honeypot | — |

No hace falta backend, proxy ni claves secretas: CORS está abierto para estas rutas.

## Configuración (`src/config/acciogest.ts`)

```ts
export const ACCIOGEST_API = 'https://api.acciogest.com';
export const FORMS = { servicio: 'FORM_ID_SERVICIO', historia: 'FORM_ID_HISTORIA', contacto: 'FORM_ID_CONTACTO' };
export const PLANES = { basico: 'FORM_ID_BASICO', estandar: 'FORM_ID_ESTANDAR', premium: 'FORM_ID_PREMIUM' };
export const BOOKING_PLUGIN_ID = 'PLUGIN_ID';
export const POLICY_VERSION = '2026-11'; // solo se muestra en /politica-privacidad/; ya no se envía
// + PUBLIC_STRIPE_PORTAL_URL → STRIPE_PORTAL_URL (null si no empieza por https://billing.stripe.com/p/login/)
```

Cada ID se puede dar también con una variable de entorno al compilar (tiene prioridad):
`PUBLIC_ACCIOGEST_FORM_SERVICIO`, `PUBLIC_ACCIOGEST_FORM_HISTORIA`,
`PUBLIC_ACCIOGEST_FORM_CONTACTO`, `PUBLIC_ACCIOGEST_PLAN_BASICO`, `PUBLIC_ACCIOGEST_PLAN_ESTANDAR`,
`PUBLIC_ACCIOGEST_PLAN_PREMIUM`, `PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID` (y
`PUBLIC_ACCIOGEST_API`). El workflow de GitHub Pages las lee de las variables del repositorio.

Mientras un ID siga con su valor de ejemplo (`FORM_ID_…` / `PLUGIN_ID`), la web funciona en
**modo simulado** para esa pieza (ver más abajo). Al poner los IDs reales, pasa a producción
sin tocar nada más (`isConfigured(id)`: no vacío y no es un valor de ejemplo).

## 1. Reservas (widget)

```html
<div id="acciogest-booking"></div>
<script src="https://api.acciogest.com/plugin-citas-embed.js?pluginId=PLUGIN_ID"></script>
```

- Carga un iframe con la reserva completa y el cobro con Stripe (a la cuenta de Denisse).
- La web **no** implementa pagos ni disponibilidad.
- Contenedor: mínimo **760 px** de alto, reservado antes de cargar (sin saltos de diseño).
- Los botones "Reservar" de las tarjetas de servicios y todos los "Reserva tu asesoría" llevan
  a esta sección (`/servicios/#reservar`).
- Implementación: el script se inyecta justo después del contenedor **solo** cuando la sección
  se acerca a la pantalla (IntersectionObserver, 1200 px antes) o en el acto si se llega con
  `#reservar`; así no hay peticiones a terceros al cargar la página. El widget se da por
  cargado cuando aparece su iframe («Cargando el calendario de reservas…» hasta entonces). Si
  el script falla, o carga pero no pinta su iframe (8 s después de cargar, 15 s como máximo),
  se muestra «Solicitar cita» + WhatsApp + teléfono dentro del mismo hueco reservado.
- Bajo el widget (y en el panel sin configurar): «Pago seguro con tarjeta. Al reservar aceptas
  las condiciones de contratación» con enlace a `/condiciones-contratacion/`.
- Sin `BOOKING_PLUGIN_ID`: panel con lo que incluye la reserva (servicio, día y hora,
  modalidad, pago seguro con tarjeta), «Solicitar cita» (formulario `servicio`) y WhatsApp.

## 2. Catálogo

`src/data/servicios.json`: precios en EUR; los planes de Autogestión DG, con IVA incluido (las
asesorías: pendiente de confirmar si lo incluyen). Astro genera el HTML desde el JSON al
compilar (`src/lib/services.ts`). Desde la fase A, con `BOOKING_PLUGIN_ID` configurado, los
precios, nombres y duraciones de las asesorías salen del catálogo de AccioGest (ver «Fase A»).

## 3. Planes Autogestiona

> **Sustituido por el handoff del 19-11-2026** (cuota mensual, diálogo propio y
> `create-checkout-session`): ver «Planes mensuales (handoff 19-11)». Lo que sigue es la forma
> anterior, que deja de funcionar el día que AccioGest pasa los planes a mensuales.

Cada plan era un formulario de pago de AccioGest:

```
https://api.acciogest.com/form-builder/public/{FORM_ID_PLAN}/page
```

Esa página ya cobra con Stripe y crea el lead. Se abre en una pestaña nueva. Sin ID del plan,
«Contratar Plan X» abre el formulario `servicio` con el plan preseleccionado. Junto a los
planes: «Al contratar aceptas las condiciones de contratación» (`/condiciones-contratacion/`).
Tras el pago se vuelve a la URL de redirección configurada en cada formulario de plan
(`/gracias/?tipo=plan&plan=basico|estandar|premium`, ver «Fase A»).

## 4. Leads

```
POST https://api.acciogest.com/form-builder/public/{FORM_ID}/submit
Content-Type: application/json

{ "response_data": { "<Etiqueta del campo>": "<valor>", ... },
  "utm_source": "…", "utm_medium": "…", "utm_campaign": "…" }
```

- Las claves de `response_data` son **exactamente** las etiquetas de los campos del
  formulario en AccioGest (lista final pendiente de confirmar). Se pueden consultar con
  `GET /form-builder/public/{FORM_ID}`, que devuelve `fields[].label` e `is_required`.
- `Nombre`, `Email` y `Teléfono` se guardan en la ficha del lead. El resto, como datos
  adicionales.
- Solicitud de servicio: el servicio o plan elegido va con la etiqueta `Servicio`.
- UTM: se leen de la URL de llegada (en cualquier página), se guardan en `sessionStorage`
  durante la visita y se envían como `utm_source`, `utm_medium` y `utm_campaign` **en la raíz
  del cuerpo** (no dentro de `response_data`; handoff 19-11). Solo las que existen.
- `Teléfono`: se limpia con `cleanPhone()` (solo `+`, dígitos, espacios, guiones y paréntesis).
- Los campos opcionales vacíos (p. ej. `Teléfono`, `Mensaje` en servicio) no se envían.
- Consentimiento: `Consentimiento RGPD` = **texto exacto de la casilla** (`src/data/consent.ts`,
  handoff 19-11 §2). Ya no se envía `Versión política`.
- Valores sí/no en minúscula: `sí` / `no`.

Etiquetas que usa la web (editables en `src/config/acciogest.ts` → `FIELD_LABELS`):

| Formulario | Etiquetas |
|---|---|
| servicio | Nombre, Email, Teléfono, Servicio, Mensaje, Consentimiento RGPD |
| historia | Nombre, Email, Teléfono, País, Tema, Historia, Compartir públicamente, Anonimato, Cómo contactarte, Instagram, Consentimiento RGPD |
| contacto | Nombre, Email, Teléfono, Mensaje, Consentimiento RGPD |
| plan (diálogo de contratación) | Nombre, Email, Teléfono, Consentimiento RGPD, Desistimiento |

Valores: `Servicio` = `lead_value` de `servicios.json` (p. ej. `Asesoría migratoria · 1 hora`,
`Programa Autogestiona · Plan Estándar`, `Extranjería · Arraigos` y el resto de servicios de
extranjería en España, `Extranjería · Nómadas digitales`, `Apertura de empresa en Dubái`) u
`Otro trámite / no lo sé`. El diálogo de solicitud está en /servicios/ y en /dubai/ (allí el
servicio llega preseleccionado como `Apertura de empresa en Dubái`); `Tema` = Migración,
Superación, Derechos humanos, Lucha, Transformación, Justicia u Otra; `Cómo contactarte` =
`Email`, `Teléfono`, `WhatsApp` o `Instagram` (con Teléfono/WhatsApp el teléfono es obligatorio en la web;
con Instagram se pide y se envía `Instagram` = usuario de Instagram, que solo se envía en ese caso).

Respuestas:

| Código | Cuerpo | Qué hace la web |
|---|---|---|
| 201 | `{"success":true,"message":"…","response_id":456}` | Muestra `message` y resetea el formulario |
| 400 | `{"error":"Faltan campos obligatorios","missing_fields":["Email"]}` o `{"error":"El campo \"Email\" debe ser un email válido"}` | Muestra el error y marca los campos afectados |
| 403 / 404 | formulario inactivo o inexistente | Mensaje de "no disponible" + alternativa WhatsApp |
| 429 | demasiados envíos, cabecera `Retry-After` | Mensaje con los segundos de espera; bloquea el botón hasta entonces (60 s si no se puede leer la cabecera: por CORS, AccioGest debe enviar `Access-Control-Expose-Headers: Retry-After`) |
| Red / > 15 s | sin respuesta | Mensaje de conexión, se conservan los datos, alternativa WhatsApp |

En la web: honeypot (si viene relleno, no se envía nada y se finge éxito), botón
desactivado mientras se envía, y se muestra el `message` de la respuesta.

## 5. Pruebas

- **Modo simulado** (IDs de ejemplo): `src/scripts/acciogest.ts` responde con la misma forma
  que la API (201 / 400) tras ~700 ms y lo indica en la consola (`console.info`). El formulario
  muestra un aviso visible de «Modo de prueba» (para que nadie crea haber enviado algo si la
  web se publicara sin IDs). Para forzar errores en pruebas manuales:
  `?acciogest_mock=400`, `400-email`, `429` (o `429-5`), `403`, `404`, `500`, `network`,
  `timeout`.
- **Comprobación de etiquetas**: con IDs reales, abrir la web con `?acciogest_debug=1`; la
  consola compara las etiquetas de la web con `GET /form-builder/public/{FORM_ID}` y avisa de
  las que no coinciden o falten como obligatorias.
- Antes de publicar, AccioGest probará el pago con tarjetas de prueba de Stripe.

## Fase A — catálogo, widget y redirecciones

Respuesta de AccioGest del 27/10/2026. **Todo está en desarrollo en AccioGest**: hasta que
avisen de que está en pruebas, la web sigue en **modo simulado** (IDs de ejemplo) y nada de
esto hace peticiones. El cobro va a la cuenta de Stripe de Denisse, que pone sus claves
directamente en AccioGest (sin Stripe Connect): la web no toca claves ni pagos.

### A1. `acciogest_id` en `servicios.json`

Cada elemento con precio lleva `acciogest_id` (id del servicio en AccioGest; `null` = aún sin
enlazar, se usa el precio del JSON):

- cada entrada de `consultations[].prices[]`: **online y presencial son dos servicios
  distintos** en AccioGest, cada uno con su id;
- cada plan de `programs[].plans[]`.

Los bloques sin precio (`immigration`, `firm_services`, `companies`, `dubai`) siguen solo en el
JSON.

### A2. Catálogo al compilar

```
GET {API}/plugin-citas/public/{BOOKING_PLUGIN_ID}/catalogo
→ { updated_at, currency, servicios: [{ id, nombre, descripcion, categoria, duracion_min,
    precio_neto, iva_pct, precio_bruto, mostrar_precio, orden }] }
```

- Lo descarga `src/integrations/acciogest-catalog.mjs` (integración de Astro), **solo** si
  `BOOKING_PLUGIN_ID` está configurado, con 8 s como máximo. Lo valida (array `servicios`,
  `id` y `precio_bruto` numérico en cada uno, misma moneda que el JSON, al menos un servicio
  válido y, si `servicios.json` enlaza ids, al menos uno de ellos; `nombre` y `descripcion` se
  limpian: sin etiquetas HTML enteras (`<b>`, `</p>`…) ni caracteres de control, 120 / 600
  caracteres como máximo; un `<` o `>` suelto se conserva; `mostrar_precio` se normaliza:
  `false`, `0`, `"0"`, `"false"`, `"no"` y cualquier valor no reconocido (con aviso) ocultan el
  precio; `true`, `1`, `"1"`, `"true"` o sin el campo lo muestran; `servicios` se ordena por `id`
  para que el orden de la API no cambie la copia buena) y lo entrega a
  `src/lib/services.ts` como módulo virtual `virtual:acciogest-catalog`.
- `src/lib/services.ts` mezcla por `acciogest_id`: `nombre` → `name`, `descripcion` →
  `description` (si viene vacía se queda la del JSON), `duracion_min` → `duration_minutes` y
  `duration_label` (30 → «30 min», 60 → «1 hora», 90 → «1 h 30 min», 120 → «2 horas»), `precio_bruto` → `amount`
  (IVA incluido, como `tax_included: true`). El nombre, la descripción y la duración de la
  tarjeta salen del primer precio enlazado (online). `mostrar_precio: false` oculta ese precio;
  la tarjeta y su «Reservar» se quedan. Un id enlazado que no está en el catálogo (el recién
  descargado o, si AccioGest falla, la última copia buena: despublicado o borrado en AccioGest)
  se trata igual (nunca se publica el precio viejo del JSON) y además no se pasa al widget;
  el log de la compilación lo avisa (`⚠ El servicio «…» … no está en el catálogo`). Ids que la web no conoce se ignoran y nunca se quita un
  elemento del JSON. `categoria`, `orden`, `precio_neto` e `iva_pct` no se usan (el orden y los
  grupos son los de la web). `lead_value` **no cambia** (decisión: es el valor del campo
  «Servicio» que recibe AccioGest y debe ser estable; no se le añade el nombre de la API porque
  cambiaría el valor con cada renombrado). Si el nombre o la duración de AccioGest no coinciden
  con los de `servicios.json`, el selector «Servicio» enseña el texto nuevo («Asesoría migratoria
  · 1 h 30 min») con el mismo valor, y la compilación avisa (`El servicio «…» se llama «…» … su
  lead_value sigue siendo «…»`) para actualizar `lead_value` a mano si conviene.
- Toda la web (asesorías, resumen de inicio, visita guiada, JSON-LD, condiciones, /gracias/,
  diálogos) lee el catálogo mezclado desde `src/lib/services.ts`.
- **Planes**: si `PLANES.<plan>` está configurado, se lee `GET {API}/form-builder/public/{PLAN_FORM_ID}`
  y se toma el importe del campo de pago (`extractPlanAmount()`, tolerante mientras AccioGest no
  confirme el nombre del campo). Prioridad: campo de pago > catálogo (si el plan tiene
  `acciogest_id`) > `servicios.json`. `mostrar_precio` se aplica igual que en las asesorías:
  `false` (o un id enlazado que no está en el catálogo, con aviso en el log)
  oculta el precio del plan en toda la web (tarjeta «Precio al contratar», sin `price` en el
  JSON-LD, «el precio se indica en su página de pago» en las condiciones), aunque su formulario
  tenga importe; la página de pago de AccioGest lo enseña al contratar.
- Los textos que llegan de AccioGest y van dentro de un `<script>` (JSON-LD, nombres de plan de
  /gracias/) se escriben con `safeJson()` de `src/lib/json.ts` (escapa `<`, `>` y `&` como `\u003C`…, sin borrar nada), nunca
  con `JSON.stringify` a secas.
- **Última copia buena**: cada respuesta válida se guarda en
  `src/data/acciogest-catalogo.last.json` (versionado; solo se reescribe si cambian los datos) y
  en `node_modules/.cache/acciogest/catalogo.last.json` (Netlify conserva esa caché entre
  compilaciones). Si AccioGest falla, no responde en 8 s o la respuesta no es válida (también
  un catálogo vacío: nunca sustituye a la copia buena): aviso
  `⚠ No se ha podido leer el catálogo de AccioGest …` en el log y se usa la copia más reciente
  **del mismo `BOOKING_PLUGIN_ID`** (o del mismo `FORM_ID`, en los planes); si no hay, los precios
  de `servicios.json`. Al reescribir la copia, cada parte (catálogo y cada plan) sale de la copia
  buena más reciente entre la respuesta nueva, la caché y el archivo versionado (en Netlify el
  archivo sigue como en git y la buena puede estar solo en la caché). La compilación nunca falla por AccioGest. Conviene versionar el archivo
  tras una compilación local con los IDs reales, para que haya copia también en un clon nuevo.

### A2 bis. Build hook de Netlify

AccioGest llamará a un **build hook** de Netlify cuando Denisse cambie un servicio publicado
(agrupando los cambios seguidos en una sola llamada), y Netlify recompila la web con el
catálogo nuevo. Cómo crearlo: README → AccioGest → «Build hook». La URL del hook es **secreta**
(quien la tenga puede lanzar compilaciones): se envía a AccioGest por un canal privado y nunca
se escribe en el repositorio.

### A3. Widget de reservas

- `&service={acciogest_id}` en la URL del script abre el widget con ese servicio elegido. El
  «Reservar» de cada tarjeta lleva sus servicios por modalidad (`data-booking-services`); se
  usa el online salvo que el botón diga otra cosa (`data-booking-modality`). Si el widget ya
  estaba cargado, se recarga con el servicio nuevo. **Desde el handoff 19-11 nunca se abre sin
  servicio** (la API rechaza la reserva): una tarjeta sin `acciogest_id` abre el servicio por
  defecto (primera asesoría reservable enlazada, online primero) y, si no hay ninguna enlazada,
  no se carga el widget (panel «Solicitar cita»).
- El iframe envía a `window.parent`:
  - `{ type: 'acciogest:booking:height', height }` → alto del contenedor y del iframe (entre
    760 y 6000 px; los 760 px siguen como `min-height` en CSS, por si no llega el mensaje);
  - `{ type: 'acciogest:booking:done', citaId, serviceId }` → `/gracias/?tipo=reserva`
    (con `&cita=` solo si `citaId` es un entero positivo, como número o como texto de dígitos;
    no se muestra).
- Solo se aceptan mensajes cuyo `event.origin` esté en `bookingMessageOrigins()`
  (`src/config/acciogest.ts`: el origen de `ACCIOGEST_API` más los de
  `PUBLIC_ACCIOGEST_WIDGET_ORIGINS`, si el iframe se sirve desde otro dominio) **y** que vengan
  de un iframe del propio contenedor; se valida la forma de cada mensaje.

### A4. Redirecciones (configurar en AccioGest)

| Formulario de AccioGest | URL de redirección (con el dominio definitivo) |
|---|---|
| Plan Básico | `https://DOMINIO/gracias/?tipo=plan&plan=basico` |
| Plan Estándar | `https://DOMINIO/gracias/?tipo=plan&plan=estandar` |
| Plan Premium | `https://DOMINIO/gracias/?tipo=plan&plan=premium` |

AccioGest añade `&response_id=…&pago=ok`. En `/gracias/`: `pago=ok` (o sin `pago`) → «Gracias
por contratar el plan…»; `pago` con cualquier otro valor → «El pago no se ha completado», con
«Volver a intentarlo» (`/autogestion-dg/`; con `tipo=reserva`, `/servicios/#reservar`) y
WhatsApp. Ningún parámetro se escribe en la página (solo se eligen bloques ya escritos).

### A5. Pruebas sin AccioGest

- `ACCIOGEST_MOCK_CATALOG=1` + un `PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID` inventado (y, si se
  quiere, `PUBLIC_ACCIOGEST_PLAN_*` inventados): usa `scripts/acciogest-mock/catalogo.json` y
  `plan-form.json` sin red. Los elementos con `acciogest_id: null` se enlazan con ids de prueba
  (`mock-<id de la asesoría>-<modalidad>`, `mock-plan-<id>`). Nunca escribe la copia buena.
- `ACCIOGEST_MOCK_CATALOG=fetch`: igual, pero con peticiones reales a `PUBLIC_ACCIOGEST_API`.
- `npm run mock:acciogest -- --port 4322 --dist dist`: servidor de prueba con el catálogo, los
  formularios de los planes y un widget falso (`plugin-citas-embed.js`) cuyo iframe envía los
  dos mensajes (botones «Más alto», «Completar la reserva»). Compilar con
  `PUBLIC_ACCIOGEST_API=http://127.0.0.1:4322` y abrir `http://localhost:4322/servicios/#reservar`
  (orígenes distintos, como en producción).

### Pendiente (fuera de la fase A)

- Cliente: modelo de cobro de los planes (pago único / mensual / N plazos), IVA de las
  asesorías y correos de las cuentas.
- AccioGest (ver «TODO (AccioGest)» en el código): nombre exacto del campo de pago y de su
  importe en el formulario de cada plan (y si es con IVA); origen desde el que se sirve el iframe
  del widget; si el script del widget admite cargarse otra vez con otro `service`; si online y
  presencial comparten nombre y duración; aviso de cuándo pasa a pruebas.

## Planes mensuales (handoff 19-11)

Fuente: `docs/handoff-acciogest-2026-11-19.md` (19/11/2026). `WEB-INTEGRACION.md` (12-11), al
que remite el handoff para el detalle, **no está en este repositorio**: donde el handoff es
ambiguo se ha elegido la lectura más prudente, aislada en un único sitio comentado del código,
y figura abajo como pregunta abierta.

**No publicar en producción** los planes mensuales (diálogo y textos legales) hasta que AccioGest
lo diga: ese día pasa los planes a mensuales y la contratación anterior deja de funcionar. Los
textos legales nuevos pasan antes por la revisión legal de AccioGest (muro-legal).

### Variables de Netlify

```
PUBLIC_ACCIOGEST_FORM_SERVICIO      PUBLIC_ACCIOGEST_PLAN_BASICO       PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID
PUBLIC_ACCIOGEST_FORM_HISTORIA      PUBLIC_ACCIOGEST_PLAN_ESTANDAR     PUBLIC_STRIPE_PORTAL_URL
PUBLIC_ACCIOGEST_FORM_CONTACTO      PUBLIC_ACCIOGEST_PLAN_PREMIUM
```

- Todos los IDs son números enteros. El del plugin es su id, no el token.
- `PUBLIC_STRIPE_PORTAL_URL`: portal de cliente de Stripe de Denisse
  (`https://billing.stripe.com/p/login/…`). Si no empieza así, no se muestra el enlace
  (`stripePortalUrl()` en `src/config/acciogest.ts`). Aparece en las condiciones (apartado 7) y
  en `/gracias/?tipo=plan`.
- Se leen **al compilar**: tras definirlas en Netlify (Site configuration → Environment
  variables), **Deploys → Trigger deploy → «Clear cache and deploy site»**.

### Diálogo de contratación

`src/components/services/PlanCheckoutDialog.astro` + `src/scripts/plan-checkout.ts`; se abre
con `data-plan-checkout="basico|estandar|premium"` (sin JavaScript, el botón es un enlace a
WhatsApp). Campos: `Nombre`*, `Email`*, `Teléfono`*, `Consentimiento RGPD`* («He leído la
política de privacidad») y `Desistimiento`* (texto por plan con su nombre y cuota del catálogo,
`planDesistimientoText()` en `src/data/consent.ts`). Dos casillas separadas, sin marcar al abrir
(se desmarcan cada vez), las dos obligatorias; errores en español con `aria-invalid` y
`aria-describedby`. El valor de cada casilla es su texto plano exacto; en la web «política de
privacidad» enlaza a `/politica-privacidad/` y «condiciones de contratación» a
`/condiciones-contratacion/`.

```
POST {API}/form-builder/public/{PLAN_ID}/create-checkout-session
{ "response_data": { "Nombre": "…", "Email": "…", "Teléfono": "…",
                     "Consentimiento RGPD": "He leído la política de privacidad",
                     "Desistimiento": "Contrato el Plan Básico: cuota de 242 € al mes (IVA incluido), …" },
  "utm_source": "…", "utm_medium": "…", "utm_campaign": "…" }
```

| Respuesta | Qué hace la web |
|---|---|
| 200 `{ url }` | Va a `url` solo si es https en `checkout.stripe.com` u otro subdominio de `stripe.com` (`isStripeCheckoutUrl()`); si no, error genérico + WhatsApp |
| 400 `{ error, missing_fields }` | Marca los campos; si falta `Desistimiento`, explica que hay que marcar «Contrato el Plan …» (inicio inmediato y condiciones) |
| 403 / 404 | «La contratación de este plan no está disponible» + WhatsApp |
| 429 | Botón bloqueado **60 s** con cuenta atrás (más si `Retry-After` pide más) |
| Red / > 15 s | Mensaje de conexión («no se ha cobrado nada»), se conservan los datos, WhatsApp |
| Otro | Error genérico + WhatsApp |

Campo trampa `website` (si viene relleno no se envía nada), guardia de doble envío (enviando,
bloqueado o ya saliendo hacia Stripe) y, al volver con «Atrás» desde Stripe, el botón se
reactiva. Vuelta de Stripe: `/gracias/?tipo=plan&plan=…&response_id=…&pago=ok&session_id=…`
(texto de cuota mensual y, si existe, enlace al portal).

**Modo simulado** (ID del plan de ejemplo): aviso visible, no se envía nada y se va a
`/gracias/?tipo=plan&plan=…&pago=ok&response_id=mock`. Errores de prueba: `?acciogest_mock=400`
(falta `Desistimiento`), `400-rgpd`, `400-tel`, `403`, `404`, `429`, `500`, `network`,
`timeout`, `bad-url`.

### Importe de los planes

`extractPlanAmount()` (`src/integrations/acciogest-catalog.mjs`) lee al compilar
`GET {API}/form-builder/public/{PLAN_ID}` y toma el importe de la **raíz** del JSON (`amount`,
`precio`, `importe`, `price`…, número o texto numérico); solo si la raíz no trae importe, usa el
criterio anterior (campo de pago). Se muestra como «242 €/mes» en `/autogestion-dg/`, las
condiciones, `/gracias/` y el JSON-LD (`Offer` con `UnitPriceSpecification`, `unitCode: MON`,
`valueAddedTaxIncluded`). La visita guiada de `/servicios/` no muestra los planes.

### Textos legales

Condiciones (apartados 3, 4, 6 y 7) y política de privacidad (finalidad y conservación de la
cuota mensual, Zoom y correo del sistema de Google, IP/navegador/página de origen, frases de la
casilla y de las UTM, apartado 10), con fecha 19 de noviembre de 2026 y versión `2026-11`. Lo
pendiente va en comentarios `PENDIENTE` del código (no visibles).

### Preguntas abiertas

1. **Nombre de la clave del importe** en la raíz de `GET /form-builder/public/{PLAN_ID}`, si es
   con IVA y si va en euros o céntimos (`extractPlanAmount()`).
2. **Forma exacta de la respuesta 200** de `create-checkout-session` (¿`url` en la raíz?, ¿otros
   campos?) y si Stripe puede devolver un dominio propio de Checkout (hoy solo se acepta
   `checkout.stripe.com`; `CHECKOUT_HOSTS` en `plan-checkout.ts`).
3. **Tabla de errores del checkout** (WEB-INTEGRACION.md §1, no disponible): se ha aplicado la de
   los leads; ¿hay otros códigos (409, 422…)? ¿`Retry-After` expuesto por CORS?
4. **UTM «cuando abres el formulario»** (frase de la política de privacidad): la web solo los
   envía al enviar un formulario o al contratar (no al abrirlo, y la URL del widget de reservas
   no lleva `utm_*`); ¿se espera que la web los envíe al abrir un formulario o que los pase al
   widget, o los registra AccioGest por su cuenta? Para muro-legal: el apartado 5 de la política
   dice «La web solo se comunica con AccioGest cuando envías un formulario, cuando contratas un
   plan o cuando se carga el sistema de reservas», que no incluye «al abrir»; las dos frases
   llevan un comentario PENDIENTE (no visible). Según la respuesta, añadir «cuando abres un
   formulario» al apartado 5 o pedir que se cambie la frase del handoff (que no se toca).
4b. **«Página de origen»** (política de privacidad): el cuerpo de las peticiones no lleva la
   página; AccioGest solo recibe la cabecera `Referer`, y con `Referrer-Policy:
   strict-origin-when-cross-origin` (netlify.toml) es solo el dominio, sin la ruta. ¿La leen del
   `Referer` (entonces se cambia la política de esa petición para enviar la ruta) o esperan un
   campo en el cuerpo (¿con qué nombre?)? No se ha inventado ningún campo.
5. **Plan con el precio oculto** (`mostrar_precio: false`): sin importe no hay texto de
   «Desistimiento»; hoy su «Contratar» abre «Solicitar información». Confirmar.
6. **Reservas**: servicio por defecto cuando una tarjeta no tiene `acciogest_id` (hoy, la primera
   asesoría reservable enlazada); ¿lo prefieren así o que esa tarjeta no ofrezca «Reservar»?
7. **Denisse**: cuándo surte efecto la baja («al terminar el mes que ya has pagado») y que
   coincida con el portal de Stripe; activar el portal de cliente y los recibos por correo
   (la frase «Recibirás el recibo de cada pago…» solo es cierta con ellos).
8. **Abogado**: qué es «servicio completamente prestado» en una cuota mensual y cómo se calcula
   la parte proporcional (no se ha inventado ninguna definición).
9. Política de privacidad: entidades de Zoom y de Google (correo), su condición y transferencias
   internacionales.

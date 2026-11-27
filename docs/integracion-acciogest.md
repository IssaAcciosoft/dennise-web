# Integración web ↔ AccioGest

Fuente: respuestas del equipo de AccioGest (02/10/2026; fase A, 27/10/2026; handoff del
19/11/2026 en `docs/handoff-acciogest-2026-11-19.md` y respuestas del 19/11; y la **decisión final
del 23/11/2026**, `docs/respuestas-acciogest-2026-11-23-pago-unico.md`: los planes son de **pago
único** por trámite, que **prevalece** sobre todo lo anterior: ver «Planes: pago único (respuesta
23-11)» al final; lo de los planes mensuales del handoff 19-11 queda **sustituido**). Este
documento es la especificación que sigue el código (`src/config/acciogest.ts`,
`src/scripts/acciogest.ts`, `src/scripts/lead-form.ts`, `src/data/servicios.json`,
`src/integrations/acciogest-catalog.mjs`, `src/lib/services.ts`). Resumen de uso: README →
«AccioGest».

## Estado 27-11-2026: AccioGest en real

Desde el **27-11-2026** AccioGest funciona **en real** para la empresa 619 y **los pagos son
reales** (Stripe en vivo, a la cuenta de Denisse). Lo que sigue en este documento sobre modo
simulado, claves o tarjetas de prueba de Stripe y «faltan los IDs» es **historia**: no vale para
producción.

- **IDs** (valores por defecto en `src/config/acciogest.ts`; las variables `PUBLIC_ACCIOGEST_*`
  los sustituyen si se definen): formularios de leads 46 (servicio), 47 (historia), 48
  (contacto) → `POST /form-builder/public/<id>/submit`; planes de pago único, IVA incluido: 49
  Básico (242 €), 50 Estándar (315 €), 51 Premium (425 €); plugin de reservas 24 con los
  servicios 133-138 (`acciogest_id` de `servicios.json`), todos con pago previo.
- **Planes:** «Contratar» = `https://api.acciogest.com/form-builder/public/<49|50|51>/page` en la
  misma pestaña. Tras pagar, AccioGest vuelve a
  `/gracias/?tipo=plan&plan=<basico|estandar|premium>&response_id=…&pago=ok` (solo redirige con el
  pago completado). `/gracias/` muestra el éxito con o sin esos parámetros (nunca «pago no
  completado»): nombre del plan, «Pago único: N € (IVA incluido)», «Recibirás por correo el
  justificante del pago.», lo que incluye y el enlace a las condiciones.
- **Reservas:** el widget se carga con `?service=<id>` y cambia con `setService`.
- **Stripe:** recibos por correo activados en la cuenta de Denisse; AccioGest pasa el email del
  cliente a Stripe (27-11 o 30-11).
- **Qué cambió en la web:** los IDs reales son los valores por defecto, así que el modo simulado
  (y su aviso «Modo de prueba») no se activa nunca con ellos; `?acciogest_mock` no hace nada con
  IDs reales y `?acciogest_debug=1` solo escribe en la consola. Se quitaron los comentarios
  pendientes de AccioGest ya resueltos. Publicada el 27-11-2026 (PR #1, fusionada a las 18:36) con
  alojamiento en Netlify, Inc. (Estados Unidos) (`HOSTING` en `src/data/legal.ts`). Si se cambia
  de alojamiento, se actualiza `HOSTING`; con el nombre vacío se muestra `{ALOJAMIENTO}` y
  `npm run check:publish` falla mientras siga.
- **Pruebas en real:** no enviar formularios, reservas ni pagos de prueba contra
  `api.acciogest.com` (la tarjeta 4242 se rechaza). En pruebas automáticas, interceptar los POST a
  AccioGest y responder con un 201 falso.

## Resumen

| Pieza | Cómo se integra | Estado |
|---|---|---|
| Reservas de asesorías (con pago previo) | Widget de AccioGest embebido (iframe): servicio, día y hora, modalidad, datos, RGPD y pago con Stripe | En real (plugin 24, servicios 133-138) |
| Catálogo de servicios | `src/data/servicios.json` + catálogo público de AccioGest al compilar, mezclado por `acciogest_id` (fase A) | Hecho (la ruta `/catalogo` no existe: datos de `servicios.json`) |
| Planes Autogestión DG (242 / 315 / 425 €, IVA incluido, pago único por trámite) | Enlace a la página de pago del plan en AccioGest (`/form-builder/public/{id}/page`, misma pestaña), que lleva las casillas, el importe y el pago con Stripe; el importe que muestra la web, de la raíz del JSON del formulario (respuesta 23-11) | En real (49 / 50 / 51) |
| Leads: solicitud de servicio, "Cuéntame tu historia", contacto | HTML propio + `fetch` POST al form-builder público | En real (46 / 47 / 48) |
| Captcha | No existe en AccioGest; no se usa. Se usa un campo honeypot | — |

No hace falta backend, proxy ni claves secretas: CORS está abierto para estas rutas.

## Configuración (`src/config/acciogest.ts`)

```ts
export const ACCIOGEST_API = 'https://api.acciogest.com';
export const FORMS = { servicio: '46', historia: '47', contacto: '48' };
export const PLANES = { basico: '49', estandar: '50', premium: '51' };
export const BOOKING_PLUGIN_ID = '24';
export const POLICY_VERSION = '2026-11'; // solo se muestra en /politica-privacidad/; ya no se envía
```

Cada ID se puede dar también con una variable de entorno al compilar (tiene prioridad):
`PUBLIC_ACCIOGEST_FORM_SERVICIO`, `PUBLIC_ACCIOGEST_FORM_HISTORIA`,
`PUBLIC_ACCIOGEST_FORM_CONTACTO`, `PUBLIC_ACCIOGEST_PLAN_BASICO`, `PUBLIC_ACCIOGEST_PLAN_ESTANDAR`,
`PUBLIC_ACCIOGEST_PLAN_PREMIUM`, `PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID` (y
`PUBLIC_ACCIOGEST_API`). El workflow de GitHub Pages las lee de las variables del repositorio.

Los valores por defecto son los IDs de producción (27-11-2026). Solo si un ID se sustituye por un
valor de ejemplo (`FORM_ID_…` / `PLUGIN_ID`), esa pieza funciona en **modo simulado** (desarrollo
local; ver más abajo). Con los IDs reales funciona en producción (`isConfigured(id)`: un número entero, no un valor de ejemplo).

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

> **Vigente otra vez desde la respuesta de AccioGest del 23-11-2026** (pago único por trámite):
> el diálogo propio y `create-checkout-session` de los planes mensuales (handoff 19-11) se han
> quitado. Detalle: «Planes: pago único (respuesta 23-11)».

Cada plan es un formulario de pago de AccioGest (`planPageUrl()` en `src/config/acciogest.ts`):

```
https://api.acciogest.com/form-builder/public/{FORM_ID_PLAN}/page
```

Esa página lleva las casillas de AccioGest (incluida «Desistimiento»), el importe y el pago con
tarjeta (Stripe), y crea el lead. Se abre en la **misma pestaña** (decisión de la web: así la vuelta
tras pagar sigue en la misma pestaña). Sin ID real del plan, o con el precio oculto
(`mostrar_precio: false`), «Contratar Plan X» abre el formulario `servicio` con el plan
preseleccionado (sin JavaScript, WhatsApp). Junto a los planes: «Pago único y seguro con
tarjeta. Al contratar aceptas las condiciones de contratación» (`/condiciones-contratacion/`).
Tras el pago se vuelve a la URL de redirección configurada en cada formulario de plan
(`/gracias/?tipo=plan&plan=basico|estandar|premium`, ver «Fase A» → A4).

## 4. Leads

```
POST https://api.acciogest.com/form-builder/public/{FORM_ID}/submit
Content-Type: application/json

{ "response_data": { "<Etiqueta del campo>": "<valor>", ... },
  "utm_source": "…", "utm_medium": "…", "utm_campaign": "…" }
```

- Las claves de `response_data` son **exactamente** las etiquetas de los campos del
  formulario en AccioGest, **confirmadas**: las de la tabla de abajo coinciden con las del SQL
  de AccioGest (WEB-INTEGRACION 12-11 §2 y handoff 19-11 §2). Se pueden consultar con
  `GET /form-builder/public/{FORM_ID}`, que devuelve `fields[].label` e `is_required`.
- `Nombre`, `Email` y `Teléfono` se guardan en la ficha del lead. El resto, como datos
  adicionales.
- Solicitud de servicio: el servicio o plan elegido va con la etiqueta `Servicio`.
- UTM: se leen de la URL de llegada (en cualquier página), se guardan en `sessionStorage`
  durante la visita y se envían como `utm_source`, `utm_medium` y `utm_campaign` **en la raíz
  del cuerpo** (no dentro de `response_data`; handoff 19-11). Solo las que existen.
- `Teléfono`: se limpia con `cleanPhone()` (WEB-INTEGRACION 12-11 §1 y §2): los puntos pasan a
  espacios, se quita cualquier `+` que no sea el primer carácter y todo lo que no sea dígito,
  espacio, guion o paréntesis (AccioGest responde 400 si hay un punto o un `+` en medio). Lo que
  se valida es el valor limpio (al menos 6 dígitos).
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

- **Modo simulado** (solo con IDs de ejemplo, nunca con los reales): `src/scripts/acciogest.ts` responde con la misma forma
  que la API (201 / 400) tras ~700 ms y lo indica en la consola (`console.info`). El formulario
  muestra un aviso visible de «Modo de prueba» (para que nadie crea haber enviado algo si la
  web se publicara sin IDs). Para forzar errores en pruebas manuales:
  `?acciogest_mock=400`, `400-email`, `429` (o `429-5`), `403`, `404`, `500`, `network`,
  `timeout` (con IDs reales, `?acciogest_mock` no hace nada).
- **Comprobación de etiquetas**: con IDs reales, abrir la web con `?acciogest_debug=1`; la
  consola compara las etiquetas de la web con `GET /form-builder/public/{FORM_ID}` y avisa de
  las que no coinciden o falten como obligatorias (solo consola; no envía nada).
- Pagos en real desde el 27-11-2026: no hacer pagos de prueba en producción (ver «Estado 27-11-2026»).

## Fase A — catálogo, widget y redirecciones

Respuesta de AccioGest del 27/10/2026. **Todo está en desarrollo en AccioGest**: hasta que
avisen de que está en pruebas, la web sigue en **modo simulado** (IDs de ejemplo) y nada de
esto hace peticiones. El cobro va a la cuenta de Stripe de Denisse, que pone sus claves
directamente en AccioGest (sin Stripe Connect): la web no toca claves ni pagos.

### A1. `acciogest_id` en `servicios.json`

Cada entrada de `consultations[].prices[]` lleva `acciogest_id` = el **`plugin_citas_services.id`**
del servicio en el plugin de citas (un número entero, p. ej. `41`, escrito como **texto**: `"41"`;
`null` = aún sin enlazar). No es un uuid ni un id de catálogo (WEB-INTEGRACION 12-11 §4).
**Online y presencial son dos servicios distintos** del plugin, cada uno con su id (6 en total;
AccioGest los saca del SELECT de su §5 tras montar la empresa). **Sin ellos no se carga el widget
de reservas** (se queda el panel «Solicitar cita»): es un bloqueo para publicar las reservas.

Los planes (`programs[].plans[]`) se quedan con `"acciogest_id": null`: su importe sale de la raíz
del formulario del plan (`payment_amount`, ver «Importe de los planes»), no del plugin.

Los bloques sin precio (`immigration`, `firm_services`, `companies`, `dubai`) siguen solo en el
JSON.

### A2. Catálogo al compilar

**La ruta `/catalogo` no existe en la API** (WEB-INTEGRACION 12-11 §4) ni se va a hacer por ahora.
Con `PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID` puesto, la compilación la pide, recibe **404** y avisa
(`⚠ No se ha podido leer el catálogo de AccioGest …`): es lo previsto. No rompe la compilación ni
quita el `service` del widget (sin catálogo no se marca ningún id como despublicado). Nombres,
duraciones y precios salen de `servicios.json`, que coinciden con el SQL (60/80/30/50/45/65 €).
Lo que sigue describe lo que haría la web si algún día existiera:

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
  y se toma `payment_amount` de la **raíz** (euros, solo con `payment_enabled === true`;
  `extractPlanAmount()`, ver «Importe de los planes»). Prioridad: `payment_amount` de la raíz >
  campo de pago de `fields[]` (respaldo) > catálogo > `servicios.json`. `mostrar_precio` se aplica igual que en las asesorías:
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

- URL del script: `{API}/plugin-citas-embed.js?pluginId=<plugin_citas_config.id>&service=<plugin_citas_services.id>`
  (`pluginId` es el id del plugin, **no** el `plugin_token`; sin `autoHeight=1`: la altura la
  ajusta solo la web). `&service={acciogest_id}` abre el widget con ese servicio elegido. El
  «Reservar» de cada tarjeta lleva sus servicios por modalidad (`data-booking-services`); se
  usa el online salvo que el botón diga otra cosa (`data-booking-modality`). Si el widget ya
  estaba cargado, se cambia de servicio **sin recargar** con
  `window.AccioGestBooking.setService(id)` (`null` o `''` = sin servicio); solo si el script no
  lo expone (versión vieja en caché) se quita y se vuelve a inyectar, que funciona pero deja
  escuchas duplicadas (WEB-INTEGRACION 12-11 §4). **Desde el handoff 19-11 nunca se abre sin
  servicio** (la API rechaza la reserva): una tarjeta sin `acciogest_id` abre el servicio por
  defecto (primera asesoría reservable enlazada, online primero) y, si no hay ninguna enlazada,
  no se carga el widget (panel «Solicitar cita»).
- El iframe envía a `window.parent`:
  - `{ type: 'acciogest:booking:height', height }` → alto del contenedor y del iframe (entre
    760 y 6000 px; los 760 px siguen como `min-height` en CSS, por si no llega el mensaje);
  - `{ type: 'acciogest:booking:done', citaId, serviceId }` (`citaId` y `serviceId`: número o
    `null`) → `/gracias/?tipo=reserva` (con `&cita=` solo si `citaId` es un entero positivo,
    como número o como texto de dígitos; no se muestra; `bookingThanksUrl()` en
    `src/lib/acciogest-helpers.mjs`). La web navega en el acto y gana a la redirección de 2,5 s
    del widget (el plugin no tiene `redirect_url`).
- Solo se aceptan mensajes cuyo `event.origin` esté en `bookingMessageOrigins()`
  (`src/config/acciogest.ts`: el origen de `ACCIOGEST_API`, que es desde donde se sirve el
  iframe, `https://api.acciogest.com`; `PUBLIC_ACCIOGEST_WIDGET_ORIGINS` no hace falta) **y** que
  vengan de un iframe del propio contenedor; se valida la forma de cada mensaje.

### A4. Redirecciones (configurar en AccioGest)

| Formulario de AccioGest | URL de redirección (con el dominio definitivo) |
|---|---|
| Plan Básico | `https://DOMINIO/gracias/?tipo=plan&plan=basico` |
| Plan Estándar | `https://DOMINIO/gracias/?tipo=plan&plan=estandar` |
| Plan Premium | `https://DOMINIO/gracias/?tipo=plan&plan=premium` |

`DOMINIO` = `dggestoresyabogados.com`. Desde la respuesta del 23-11-2026 (§6) la vuelta es
exactamente esa, **sin** `response_id` ni `pago=ok`, y la página de pago **solo redirige cuando el
pago se ha completado**: `/gracias/` no comprueba ningún parámetro de pago y muestra «Gracias por
contratar el plan…» con el nombre, el importe (pago único) y lo que incluye. Ningún parámetro se
escribe en la página (solo se eligen bloques ya escritos y nombres e importes conocidos).

### A5. Pruebas sin AccioGest

- `ACCIOGEST_MOCK_CATALOG=1` + un `PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID` inventado (y, si se
  quiere, `PUBLIC_ACCIOGEST_PLAN_*` inventados): usa `scripts/acciogest-mock/catalogo.json` y
  `plan-form.json` sin red. Los elementos con `acciogest_id: null` se enlazan con ids de prueba
  (`mock-<id de la asesoría>-<modalidad>`, `mock-plan-<id>`). Nunca escribe la copia buena.
- `ACCIOGEST_MOCK_CATALOG=fetch`: igual, pero con peticiones reales a `PUBLIC_ACCIOGEST_API`.
- `npm run mock:acciogest -- --port 4322 --dist dist`: servidor de prueba que imita la API real:
  `/catalogo` responde 404 (con `--catalogo`, el fixture), los formularios de los planes con
  `payment_amount` en la raíz y un widget falso (`plugin-citas-embed.js`) que define
  `window.AccioGestBooking.setService(id)` y cuyo iframe envía los dos mensajes (botones «Más
  alto», «Completar la reserva», con `citaId` numérico). Compilar con
  `PUBLIC_ACCIOGEST_API=http://127.0.0.1:4322` y abrir `http://localhost:4322/servicios/#reservar`
  (orígenes distintos, como en producción).

### Pendiente (fuera de la fase A)

- ~~Cliente: modelo de cobro de los planes~~ → pago único por trámite (AccioGest, 23-11).
- Cliente: IVA de las asesorías y correos de las cuentas.
- AccioGest: los IDs reales (formularios, planes, plugin) y los 6 `plugin_citas_services.id` de
  las asesorías para `servicios.json`; aviso de cuándo pasa a producción.
- Resuelto por WEB-INTEGRACION 12-11: importe de los planes (`payment_amount` en la raíz, §3),
  origen del iframe (`https://api.acciogest.com`, §4), cambio de servicio (`setService`, §4) y
  nombre y duración de online / presencial (sin catálogo salen de `servicios.json`, §4).

## Planes: pago único (respuesta 23-11)

Fuente: `docs/respuestas-acciogest-2026-11-23-pago-unico.md` (decisión final de AccioGest,
23/11/2026). **Prevalece** sobre el handoff 19-11 y WEB-INTEGRACION 12-11 en todo lo de los planes:

1. No se aplica `planes-mensuales-619.sql`: los planes se quedan con `payment_interval = null`.
2. **Sin portal de cliente de Stripe** (no hay `PUBLIC_STRIPE_PORTAL_URL`).
3. «Contratar» abre `https://api.acciogest.com/form-builder/public/<id del plan>/page` (la web
   eligió la **misma pestaña**). Esa página lleva las casillas, el importe y el pago con tarjeta.
   Sin diálogo propio ni `create-checkout-session`.
4. El texto de «Desistimiento» («Contrato el {Plan}: pago único de {importe} € (IVA incluido). Pido
   que el servicio empiece ya…») lo pone AccioGest en su página de cada plan. **En la web no hay
   casilla** para los planes.
5. Condiciones: sin nada de la cuota mensual; el texto de pago único del 10/11 con el art. 108.4.
   Pasa por muro-legal con el resto.
6. Vuelta tras pagar: `/gracias/?tipo=plan&plan=<basico|estandar|premium>` (en real, 27-11, con
   `&response_id=…&pago=ok`); solo se redirige con el pago completado, así que `/gracias/` no
   comprueba nada y muestra el éxito con o sin esos parámetros.

Lo demás sigue igual: formularios de leads, reservas con un id por servicio, privacidad con Zoom y
Google, dominio `dggestoresyabogados.com` y los IDs.

### Variables de Netlify (7)

```
PUBLIC_ACCIOGEST_FORM_SERVICIO      PUBLIC_ACCIOGEST_PLAN_BASICO       PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID
PUBLIC_ACCIOGEST_FORM_HISTORIA      PUBLIC_ACCIOGEST_PLAN_ESTANDAR
PUBLIC_ACCIOGEST_FORM_CONTACTO      PUBLIC_ACCIOGEST_PLAN_PREMIUM
```

- Todos los IDs son números enteros. El del plugin es su id, no el token.
- Se leen **al compilar**: tras definirlas en Netlify (Site configuration → Environment
  variables), **Deploys → Trigger deploy → «Clear cache and deploy site»**.

### Contratación en la web

- Plan con ID real y precio visible → `<a href="{API}/form-builder/public/{PLAN_ID}/page">`
  (`planPageUrl()`), sin `target="_blank"` (misma pestaña, sin aviso de «pestaña nueva»).
- Plan sin ID real (valor de ejemplo, o modo simulado) o con el precio oculto → «Solicitar
  información» con el plan preseleccionado (`data-service-request`); sin JavaScript, WhatsApp.
- La web no envía nada a AccioGest al contratar un plan (es la página de AccioGest la que recoge
  los datos y cobra).
- Precio en las tarjetas: «242 €» + «IVA incluido · pago único»; en condiciones, `/gracias/` y
  JSON-LD, «242 €» (`Offer` con `price`, sin `UnitPriceSpecification`).

### Importe de los planes

`extractPlanAmount()` (`src/integrations/acciogest-catalog.mjs`) lee al compilar
`GET {API}/form-builder/public/{PLAN_ID}` y toma `payment_amount` de la **raíz** del JSON
(WEB-INTEGRACION 12-11 §3): un número en euros, tal cual se cobra, sin céntimos, y solo si
`payment_enabled === true`. La raíz trae también `payment_currency` (`EUR`), `payment_interval`
(`null` en los de pago único), `payment_concept` y `payment_button_text`. Solo si la raíz no trae
importe, se usa el campo de pago de `fields[]` (respaldo). Si `payment_interval` **no es `null`**
(p. ej. `"month"`), la compilación avisa (`⚠ El plan «…» tiene cobro recurrente en AccioGest
(payment_interval="month"); debe ser pago único …`, `planIntervalWarning()`). Prioridad:
`payment_amount` > `fields[]` > catálogo > `servicios.json`. 242 / 315 / 425 € se muestran «IVA
incluido» (si Denisse confirma que no lo incluyen, se cambia en AccioGest y se quita de
`tax_label` en `servicios.json`, `AutogestionPlans.astro` y las condiciones). Fixture de prueba:
`scripts/acciogest-mock/plan-form.json` (con `payment_interval: null`).

### Textos legales

- Condiciones: texto del 10/11 aprobado por la titular, con la corrección art. 108.3 → 108.4 y
  «pago único» en el apartado 4. Sin cuota mensual, baja ni portal. «Confirmación de la
  contratación»: texto de la revisión legal del 24-11 (ya aplicado).
- Política de privacidad: sin la finalidad ni la conservación de la cuota mensual; Stripe, para el
  pago único de reservas y planes. Se mantienen la frase de las UTM de AccioGest (19-11), Zoom y
  Google (revisados por muro-legal el 24-11 y ya aplicados).

### Preguntas abiertas (23-11)

> Actualizado el 27-11-2026: la 1 se resolvió con la revisión legal del 24-11 (no se añaden UTM al
> enlace de «Contratar»); la 2, con el texto de «Confirmación de la contratación» de esa revisión
> (apartado 4 de las condiciones, sin `PENDIENTE`); la 3 y la 4, con el paso a real del 27-11.

1. **UTM y página de origen al contratar un plan** (AccioGest, muro-legal). Con la página de pago
   alojada, la web no envía nada a AccioGest al contratar un plan, pero la frase de las UTM de la
   política (apartado 2) y la del apartado 5 dicen «… o contratas un plan» (texto de AccioGest del
   19-11, que no se cambia sin ellos). Preguntar: ¿la página `/page` del plan registra el origen de
   la visita (`Referer`, aviso de visita)? ¿Hay que añadir `utm_source` / `utm_medium` /
   `utm_campaign` a la URL de `/page` para que se guarden? Según la respuesta, añadir las UTM al
   enlace o ajustar las dos frases con muro-legal. Marcado con `PENDIENTE (AccioGest, muro-legal)`
   en `src/pages/politica-privacidad.astro`.
2. **Confirmación de la contratación** (AccioGest, muro-legal). El apartado 4 de las condiciones
   sigue con el `PENDIENTE` del 10/11. Preguntar si AccioGest (o Stripe, si se activan los recibos
   por correo) envía un email de confirmación al comprar un plan o reservar, y con qué contenido.
   Redacción propuesta, si se confirma: «recibirás el recibo del pago de Stripe en el correo que
   indiques al contratar. En el caso de las asesorías, recibirás además un correo de confirmación
   de la cita.» No se publica hasta tener la respuesta.
3. **AccioGest**: los IDs (3 formularios, 3 planes, plugin), los 6 `plugin_citas_services.id`, la
   API en producción, `montaje-619.sql`, el horario, el webhook, la revisión legal (muro-legal) y
   el aviso para publicar.
4. **Prueba en una vista previa**: las vueltas de los planes van a
   `https://dggestoresyabogados.com/gracias/…` (configuradas en AccioGest), no a la vista previa.

## Planes mensuales (handoff 19-11) — SUSTITUIDO

> **Sustituido por la respuesta de AccioGest del 23-11-2026** (pago único): ver «Planes: pago
> único (respuesta 23-11)». Se deja solo como registro; las especificaciones archivadas son
> `docs/handoff-acciogest-2026-11-19.md` y `docs/web-integracion-acciogest-2026-11-12.md`.

Lo que se quitó de la web: el diálogo de contratación (`PlanCheckoutDialog.astro`,
`src/scripts/plan-checkout.ts`), la llamada `POST …/create-checkout-session` y su configuración
(`checkoutSessionUrl`, `PLAN_CHECKOUT_MOCK`, `planCheckoutEnabled`, `PLAN_FIELD_LABELS`, la lista
de dominios de Stripe Checkout), las casillas de los planes de `src/data/consent.ts` (texto «Contrato
el … cuota … al mes …» y «He leído la política de privacidad»), `PUBLIC_STRIPE_PORTAL_URL`, los
textos de cuota mensual, baja y portal (tarjetas, `/gracias/`, condiciones, privacidad, JSON-LD
con `UnitPriceSpecification`) y la comprobación de `pago` en `/gracias/`. Se mantienen todos los
cambios de los leads, las reservas, el dominio y la privacidad que trajeron el handoff y las
respuestas del 19-11.

### Resueltas antes (WEB-INTEGRACION 12-11 y respuestas 19-11), que siguen valiendo

- Importe: `payment_amount` en la raíz de `GET /form-builder/public/{PLAN_ID}`, en euros (sin
  céntimos), solo con `payment_enabled === true` (WEB-INTEGRACION 12-11 §3).
- ~~Etiquetas de los leads~~ → confirmadas: coinciden con `FIELD_LABELS` (WEB-INTEGRACION 12-11 §2).
- ~~Origen del iframe y recarga del widget~~ → `https://api.acciogest.com` (sin
  `PUBLIC_ACCIOGEST_WIDGET_ORIGINS`); `window.AccioGestBooking.setService(id)` para cambiar de
  servicio, con la reinyección como respaldo (WEB-INTEGRACION 12-11 §4).
- ~~Qué es `service` / `/catalogo`~~ → `plugin_citas_services.id` (entero, como texto en
  `acciogest_id`); los planes quedan con `acciogest_id: null`; `/catalogo` no existe (404 previsto,
  se usa `servicios.json`) (WEB-INTEGRACION 12-11 §4).
- ~~UTM «cuando abres el formulario»~~ → sustituida por la frase de AccioGest: «… se envía a
  AccioGest, junto con la página de origen, solo cuando envías un formulario o contratas un plan,
  sin cookies y sin identificarte». No se envía nada al abrir ni se pasan UTM al widget (ver la
  pregunta abierta 1 de arriba sobre los planes).
- ~~«Página de origen» en los leads~~ → del `Referer`: `referrerPolicy: 'no-referrer-when-downgrade'`
  en el `fetch` de `/submit`, sin cambiar la política de toda la web.
- ~~`utm_content` / `utm_term`~~ → opcionales; se queda con las tres.
- ~~Plan con el precio oculto~~ → abre «Solicitar información».
- ~~Tarjeta sin id~~ → con el widget activo, esa tarjeta no ofrece «Reservar» con otro servicio:
  «Reservar por WhatsApp». Online y presencial son servicios distintos, cada uno con su id: si la
  tarjeta tiene los dos, un botón por modalidad (`Consultations.astro`).
- ~~Valor de las casillas de los leads~~ → clave = etiqueta exacta, valor = texto de la casilla
  sin el markdown de los enlaces (`src/data/consent.ts`).
- ~~Zoom y Google~~ → propuesta de AccioGest puesta en la política (apartados 5 y 6), pendiente de
  muro-legal.
- ~~Denisse~~ → con Denisse solo habla AccioGest (Stripe, recibos por correo). Horario: lunes a
  viernes de 9 a 18.
- **Dominio definitivo**: `https://dggestoresyabogados.com`. `astro.config.mjs` lo usa en
  producción; hay que conectarlo en Netlify como dominio principal con HTTPS.


## IDs de producción (AccioGest, 24-11-2026)

Formularios 46 (servicio), 47 (historia), 48 (contacto); planes 49 (Básico), 50 (Estándar), 51
(Premium); plugin de reservas 24. Servicios del widget: 133/134 asesoría 1 h online/presencial,
135/136 asesoría 30 min online/presencial, 137/138 orientación académica online/presencial
(`servicios.json`). En la rama `planes-mensuales` van como valores por defecto en
`src/config/acciogest.ts` (las variables `PUBLIC_ACCIOGEST_*` de Netlify los sustituyen si se
definen). No se ponen todavía como variables de Netlify a nivel de sitio: la producción actual
(rama `claude/exciting-hypatia-hfwwmq`) pasaría a enviar datos reales con el código antiguo.
Comprobado contra la API el 24-11: etiquetas, opciones, textos de consentimiento, importes
(242/315/425, `payment_interval` null), widget con `service` y `setService`, página de pago de
cada plan. **Actualizado el 27-11-2026:** AccioGest en real y Stripe en vivo (ver «Estado
27-11-2026»).


## Revisión legal de AccioGest (24-11-2026)

Aplicada tal cual (`docs/revision-legal-acciogest-2026-11-24.txt`):

- **UTM:** la web ya no guarda nada en el navegador (fuera el script de BaseLayout y
  `sessionStorage`). `captureUtms()` lee solo los `utm_*` de la dirección de la página desde la
  que se envía el formulario; si no hay, no se envía nada. No se añaden UTM al enlace de
  «Contratar».
- **Privacidad:** tramitación de Autogestión DG (apartado 2), UTM y datos del envío, interés
  legítimo, plazos con «trámites», ACCIOSOFT, S.L. (AccioGest), alojamiento web con
  `{ALOJAMIENTO}` (`HOSTING` en `src/data/legal.ts`), «cuando abres la página de contratación
  de un plan», apartado 9 sin `sessionStorage`. Apartado 6: «y, en su caso, del proveedor de
  alojamiento web» se ha integrado en la enumeración de la última frase («…de Zoom Communications,
  Inc., en su caso, de Google LLC y, en su caso, del proveedor de alojamiento web se amparan…»),
  porque añadido literalmente al final de la frase no tenía sentido.
- **Condiciones:** texto de «Confirmación de la contratación» (apartado 4).
- **PDF de las condiciones** (lo adjunta AccioGest al correo de confirmación):
  `npm run build && npm run pdf:condiciones && npm run build` →
  `public/docs/condiciones-contratacion.pdf`, publicado en `/docs/condiciones-contratacion.pdf`
  (enlace «Descargar estas condiciones en PDF» en la página). La página también es imprimible
  (sin cabecera, pie ni botones). Regenerarlo cada vez que cambie el texto.
- **Antes de publicar:** `npm run check:publish` falla mientras quede `{ALOJAMIENTO}` o el PDF
  sea más antiguo que la página.
- **Alojamiento:** al final se queda en Netlify (27-11-2026). Si algún día se cambia, en el nuevo
  alojamiento hay que reproducir lo que hoy hace
  `netlify.toml`: cabeceras (`Referrer-Policy: strict-origin-when-cross-origin`, cachés de
  `/_astro/*`), la redirección 301 de `/dubai/` a `/apertura-de-empresas/` y el comando de
  compilación (`npm run build`, carpeta `dist/`). `astro.config.mjs` usa
  `https://dggestoresyabogados.com` fuera de las vistas previas de Netlify.

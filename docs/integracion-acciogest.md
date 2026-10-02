# Integración web ↔ AccioGest

Fuente: respuesta del equipo de AccioGest (02/10/2026). Este documento es la especificación
que sigue el código (`src/config/acciogest.ts`, `src/scripts/acciogest.ts`,
`src/scripts/lead-form.ts`, `src/data/servicios.json`). Resumen de uso: README → «AccioGest».

## Resumen

| Pieza | Cómo se integra | Estado |
|---|---|---|
| Reservas de asesorías (con pago previo) | Widget de AccioGest embebido (iframe): servicio, día y hora, modalidad, datos, RGPD y pago con Stripe | Falta `BOOKING_PLUGIN_ID` |
| Catálogo de servicios | `src/data/servicios.json` estático (AccioGest **no tiene** endpoint público de catálogo) | Hecho |
| Planes Autogestiona (121 / 200 / 300 €) | Página pública de formulario de pago de AccioGest, en pestaña nueva | Faltan los 3 `FORM_ID` |
| Leads: solicitud de servicio, "Cuéntame tu historia", contacto | HTML propio + `fetch` POST al form-builder público | Faltan los 3 `FORM_ID` |
| Captcha | No existe en AccioGest; no se usa. Se usa un campo honeypot | — |

No hace falta backend, proxy ni claves secretas: CORS está abierto para estas rutas.

## Configuración (`src/config/acciogest.ts`)

```ts
export const ACCIOGEST_API = 'https://api.acciogest.com';
export const FORMS = { servicio: 'FORM_ID_SERVICIO', historia: 'FORM_ID_HISTORIA', contacto: 'FORM_ID_CONTACTO' };
export const PLANES = { basico: 'FORM_ID_BASICO', estandar: 'FORM_ID_ESTANDAR', premium: 'FORM_ID_PREMIUM' };
export const BOOKING_PLUGIN_ID = 'PLUGIN_ID';
export const POLICY_VERSION = '2026-10';
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
  `#reservar`; así no hay peticiones a terceros al cargar la página. Si el script falla, se
  muestra «Solicitar cita» + WhatsApp.
- Sin `BOOKING_PLUGIN_ID`: panel con lo que incluye la reserva (servicio, día y hora,
  modalidad, pago seguro con tarjeta), «Solicitar cita» (formulario `servicio`) y WhatsApp.

## 2. Catálogo

`src/data/servicios.json`: precios con IVA incluido, en EUR. Astro genera el HTML desde el
JSON al compilar (`src/lib/services.ts`). Cuando exista el endpoint de catálogo, solo cambia la
función que carga los datos (o se recompila la web al cambiar precios).

## 3. Planes Autogestiona

Cada plan es un formulario de pago de AccioGest:

```
https://api.acciogest.com/form-builder/public/{FORM_ID_PLAN}/page
```

Esa página ya cobra con Stripe y crea el lead. Se abre en una pestaña nueva. Sin ID del plan,
«Contratar Plan X» abre el formulario `servicio` con el plan preseleccionado. Junto a los
planes: «Al contratar aceptas las condiciones de contratación» (`/condiciones-contratacion/`).
Tras el pago (y tras una reserva), si AccioGest permite configurar una URL de redirección:
`/gracias/?tipo=plan&plan=basico|estandar|premium` y `/gracias/?tipo=reserva`.

## 4. Leads

```
POST https://api.acciogest.com/form-builder/public/{FORM_ID}/submit
Content-Type: application/json

{ "response_data": { "<Etiqueta del campo>": "<valor>", ... } }
```

- Las claves de `response_data` son **exactamente** las etiquetas de los campos del
  formulario en AccioGest (lista final pendiente de confirmar). Se pueden consultar con
  `GET /form-builder/public/{FORM_ID}`, que devuelve `fields[].label` e `is_required`.
- `Nombre`, `Email` y `Teléfono` se guardan en la ficha del lead. El resto, como datos
  adicionales.
- Solicitud de servicio: el servicio o plan elegido va con la etiqueta `Servicio`.
- UTM: se leen de la URL de llegada (en cualquier página), se guardan en `sessionStorage`
  durante la visita y se envían como `utm_source`, `utm_medium` y `utm_campaign`.
- Los campos opcionales vacíos (p. ej. `Teléfono`, `Mensaje` en servicio) no se envían.
- Consentimiento: `Consentimiento RGPD` = `sí` y `Versión política` = versión de la política
  de privacidad (p. ej. `2026-10`).
- Valores sí/no en minúscula: `sí` / `no`.

Etiquetas que usa la web (editables en `src/config/acciogest.ts` → `FIELD_LABELS`):

| Formulario | Etiquetas |
|---|---|
| servicio | Nombre, Email, Teléfono, Servicio, Mensaje, Consentimiento RGPD, Versión política, utm_source, utm_medium, utm_campaign |
| historia | Nombre, Email, Teléfono, País, Tema, Historia, Compartir públicamente, Anonimato, Cómo contactarte, Consentimiento RGPD, Versión política, utm_source, utm_medium, utm_campaign |

Valores: `Servicio` = `lead_value` de `servicios.json` (p. ej. `Asesoría migratoria · 1 hora`,
`Programa Autogestiona · Plan Estándar`) u `Otro trámite / no lo sé`; `Tema` = Migración,
Superación, Derechos humanos, Lucha, Transformación, Justicia u Otra; `Cómo contactarte` =
`Email`, `Teléfono` o `WhatsApp` (con Teléfono/WhatsApp el teléfono es obligatorio en la web).
| contacto | Nombre, Email, Teléfono, Mensaje, Consentimiento RGPD, Versión política, utm_source, utm_medium, utm_campaign |

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

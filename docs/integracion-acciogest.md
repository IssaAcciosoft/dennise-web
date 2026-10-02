# Integración web ↔ AccioGest

Fuente: respuesta del equipo de AccioGest (02/10/2026). Este documento es la especificación
que sigue el código (`js/config.js`, `js/acciogest.js`, `data/servicios.json`).

## Resumen

| Pieza | Cómo se integra | Estado |
|---|---|---|
| Reservas de asesorías (con pago previo) | Widget de AccioGest embebido (iframe): servicio, día y hora, modalidad, datos, RGPD y pago con Stripe | Falta `BOOKING_PLUGIN_ID` |
| Catálogo de servicios | `data/servicios.json` estático (AccioGest **no tiene** endpoint público de catálogo) | Hecho |
| Planes Autogestiona (121 / 200 / 300 €) | Página pública de formulario de pago de AccioGest, en pestaña nueva | Faltan los 3 `FORM_ID` |
| Leads: solicitud de servicio, "Cuéntame tu historia", contacto | HTML propio + `fetch` POST al form-builder público | Faltan los 3 `FORM_ID` |
| Captcha | No existe en AccioGest; no se usa. Se usa un campo honeypot | — |

No hace falta backend, proxy ni claves secretas: CORS está abierto para estas rutas.

## Configuración (`js/config.js`)

```js
export const ACCIOGEST_API = 'https://api.acciogest.com';
export const FORMS = { servicio: 'FORM_ID_SERVICIO', historia: 'FORM_ID_HISTORIA', contacto: 'FORM_ID_CONTACTO' };
export const PLANES = { basico: 'FORM_ID_BASICO', estandar: 'FORM_ID_ESTANDAR', premium: 'FORM_ID_PREMIUM' };
export const BOOKING_PLUGIN_ID = 'PLUGIN_ID';
```

Mientras un ID siga con su valor de ejemplo (`FORM_ID_…` / `PLUGIN_ID`), la web funciona en
**modo simulado** para esa pieza (ver más abajo). Al poner los IDs reales, pasa a producción
sin tocar nada más.

## 1. Reservas (widget)

```html
<div id="acciogest-booking"></div>
<script src="https://api.acciogest.com/plugin-citas-embed.js?pluginId=PLUGIN_ID"></script>
```

- Carga un iframe con la reserva completa y el cobro con Stripe (a la cuenta de Denisse).
- La web **no** implementa pagos ni disponibilidad.
- Contenedor: mínimo **760 px** de alto.
- Los botones "Reservar" de las tarjetas de servicios llevan a esta sección (`#reservar`).

## 2. Catálogo

`data/servicios.json`: precios con IVA incluido, en EUR. El maquetado vive en `<template>`s
del HTML y los datos salen del JSON. Cuando exista el endpoint de catálogo, solo cambia la
función que carga los datos.

## 3. Planes Autogestiona

Cada plan es un formulario de pago de AccioGest:

```
https://api.acciogest.com/form-builder/public/{FORM_ID_PLAN}/page
```

Esa página ya cobra con Stripe y crea el lead. Se abre en una pestaña nueva.

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
- UTM: se leen de la URL y se envían como `utm_source`, `utm_medium` y `utm_campaign`.
- Consentimiento: `Consentimiento RGPD` = `sí` y `Versión política` = versión de la política
  de privacidad (p. ej. `2026-10`).
- Valores sí/no en minúscula: `sí` / `no`.

Etiquetas que usa la web (editables en `js/config.js` → `FIELD_LABELS`):

| Formulario | Etiquetas |
|---|---|
| servicio | Nombre, Email, Teléfono, Servicio, Mensaje, Consentimiento RGPD, Versión política, utm_source, utm_medium, utm_campaign |
| historia | Nombre, Email, Teléfono, País, Tema, Historia, Compartir públicamente, Anonimato, Cómo contactarte, Consentimiento RGPD, Versión política, utm_source, utm_medium, utm_campaign |
| contacto | Nombre, Email, Teléfono, Mensaje, Consentimiento RGPD, Versión política, utm_source, utm_medium, utm_campaign |

Respuestas:

| Código | Cuerpo | Qué hace la web |
|---|---|---|
| 201 | `{"success":true,"message":"…","response_id":456}` | Muestra `message` y resetea el formulario |
| 400 | `{"error":"Faltan campos obligatorios","missing_fields":["Email"]}` o `{"error":"El campo \"Email\" debe ser un email válido"}` | Muestra el error y marca los campos afectados |
| 403 / 404 | formulario inactivo o inexistente | Mensaje de "no disponible" + alternativa WhatsApp |
| 429 | demasiados envíos, cabecera `Retry-After` | Mensaje con los segundos de espera; bloquea el botón hasta entonces |

En la web: honeypot (si viene relleno, no se envía nada y se finge éxito), botón
desactivado mientras se envía, y se muestra el `message` de la respuesta.

## 5. Pruebas

- **Modo simulado** (IDs de ejemplo): `js/acciogest.js` responde con la misma forma que la
  API (201 / 400) tras una pequeña espera. Para forzar errores en pruebas manuales:
  `?acciogest_mock=400`, `?acciogest_mock=429`, `?acciogest_mock=404`,
  `?acciogest_mock=network`.
- **Comprobación de etiquetas**: con IDs reales, abrir la web con `?acciogest_debug=1`; la
  consola compara las etiquetas de la web con `GET /form-builder/public/{FORM_ID}` y avisa de
  las que no coinciden o falten como obligatorias.
- Antes de publicar, AccioGest probará el pago con tarjetas de prueba de Stripe.

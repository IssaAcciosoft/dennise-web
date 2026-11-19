# Handoff para el agente de la web de Denisse (19-11-2026)

Repo `IssaAcciosoft/dennise-web`, rama `claude/exciting-hypatia-hfwwmq` (último commit `3d494b4`, 10-11). Web en https://denisseg.netlify.app (Astro, Netlify).

Lo de AccioGest (API, formularios, plugin de citas, Stripe y webhook) ya está hecho y probado. Todavía no está en producción: lo sube el equipo de AccioGest. Tú solo tocas la web.

## Reglas

- **No publiques en producción** la parte de planes mensuales (puntos 2 y 3) hasta que AccioGest lo diga. Ese día AccioGest pasa los planes a mensuales, y desde ese momento el «Contratar» actual deja de funcionar. Trabaja en una rama o en un deploy preview de Netlify.
- Los textos legales del punto 1 sí se pueden preparar ya, pero se publican el mismo día que los planes, porque describen el cobro mensual.
- Los IDs (formularios, planes, plugin) aún no existen. Te los pasa AccioGest después de montar la empresa en prod, y van en las variables de Netlify (punto 4).
- Las casillas de la web tienen que llevar **exactamente** los textos de este documento. Son los que AccioGest guarda como prueba del consentimiento.
- Al terminar, los textos legales pasan por revisión legal (muro-legal, en AccioGest) antes de publicarse.

## 1. Textos legales

### Condiciones de contratación (`src/pages/condiciones-contratacion.astro`)

1. **Apartado 4, viñeta de Autogestión DG.** Sustituir por:
   ```text
   Autogestión DG: cada plan se contrata en la propia web, con una cuota mensual que se cobra con tarjeta, a través de Stripe, el día de la contratación y el mismo día de cada mes siguiente hasta que te des de baja. El importe de la cuota es el indicado en el apartado 3 (242, 315 o 425 € al mes, IVA incluido).
   ```
2. **Apartado 4, pago por adelantado.** Sustituir por:
   ```text
   El pago se realiza por adelantado, con tarjeta, a través de la plataforma de pago Stripe integrada en el sistema de reservas y en el proceso de contratación de los planes. Esta web no recibe ni guarda los datos de tu tarjeta.
   ```
3. **Apartado 4, «Confirmación de la contratación:».** Hoy sale vacío. Rellenarlo con:
   ```text
   Recibirás el recibo de cada pago de Stripe en el correo que indiques al contratar. En el caso de las asesorías, recibirás además un correo de confirmación de la cita.
   ```
   Solo es cierto si Denisse activa en Stripe los recibos por correo (Configuración → Correos electrónicos de clientes). Déjalo marcado como pendiente de confirmar.
4. **Apartado 6, desistimiento.** Añadir después de la primera viñeta:
   ```text
   Planes de cuota mensual: el plazo de 14 días se cuenta desde la primera cuota. Si desistes dentro de ese plazo, tras haber pedido que el servicio empiece de inmediato, pagarás la parte proporcional del servicio ya prestado hasta ese momento. Las cuotas siguientes se pagan por el servicio del mes que comienza, y solo puedes dejar de pagarlas dándote de baja como se explica en el apartado 7.
   ```
   Quita también el comentario `PENDIENTE … casilla …` si sigue en el fichero.
5. **Apartado 7: párrafo nuevo** sobre la baja de los planes:
   ```text
   Baja de los planes mensuales. Puedes darte de baja en cualquier momento, sin penalización y sin necesidad de justificarlo, desde tu portal de cliente de Stripe, o escribiéndonos por WhatsApp al {PHONE.display} o a {EMAIL.address}. La baja surte efecto al terminar el mes que ya has pagado: no se cobrará la cuota siguiente y conservas el servicio hasta esa fecha. No se reembolsan cuotas ya pagadas por meses ya iniciados, sin perjuicio del derecho de desistimiento del apartado 6.
   ```
   - «al terminar el mes que ya has pagado» es una propuesta que **Denisse tiene que confirmar**, y tiene que coincidir con lo que configure en el portal de Stripe (cancelar «al final del periodo»).
   - El enlace del portal solo aparece si existe `PUBLIC_STRIPE_PORTAL_URL` (punto 4).
   - El párrafo actual («Una vez realizado el pago, las asesorías no se cancelan ni se reembolsan…») se queda, hablando solo de las asesorías.
6. **Pendiente de abogado:** qué es «servicio completamente prestado» en una cuota mensual y cómo se calcula la parte proporcional. No inventes una definición. Deja el texto del apartado 6 como está y marca la duda.

### Política de privacidad (`src/pages/politica-privacidad.astro`)

1. **Contratación de planes.** Añadir una finalidad: gestionar la cuota mensual (cobros, recibos y bajas). La base es la ejecución del contrato (art. 6.1.b RGPD). El plazo de conservación de los datos de pago es el que marca la ley fiscal y mercantil (6 años).
2. **Destinatarios.** Añadir:
   - **Zoom**, para las asesorías online;
   - el **correo del sistema (Google)**, que envía los avisos y confirmaciones;
   - Stripe y AccioGest, si no están ya.
3. **«Datos que acompañan a los formularios».** Añadir que de cada envío se guardan la dirección IP, el navegador y la página de origen.
4. **Frase de la versión.** La frase actual («La confirmación de tu consentimiento y la versión de esta política que has aceptado (versión 2026-10)…») se sustituye por:
   ```text
   El texto de la casilla que aceptas y la fecha del envío, para poder acreditar tu consentimiento.
   ```
   En el apartado 10 cambia también «…que se guarda junto a cada formulario enviado». Lo que se guarda es el texto de la casilla y la fecha, no la versión.
5. **Frase de UTM.** La actual («…no se envía a nadie hasta que mandas un formulario y se borra al cerrar la pestaña») se sustituye por:
   ```text
   Si has llegado desde un enlace de campaña o red social, el origen de la visita (utm_source, utm_medium y utm_campaign) se guarda temporalmente en tu navegador y se envía a AccioGest, junto con la página de origen, cuando abres el formulario y cuando lo envías, sin cookies y sin identificarte.
   ```
6. Actualiza la fecha de «Última actualización».

## 2. Casillas de los formularios (textos exactos)

La web envía `response_data` con las **etiquetas** como clave, escritas igual, con tildes y mayúsculas. Para una casilla, envía como valor el texto de la casilla. El texto se muestra con el enlace, y el valor se envía sin el markdown.

**Solicitud de servicio.** Campos: `Nombre`*, `Email`*, `Teléfono`, `Servicio`*, `Mensaje`, `Consentimiento RGPD`*.
```text
He leído y acepto la política de privacidad y consiento el tratamiento de mis datos para que Denisse González atienda mi solicitud de información sobre el servicio elegido y se ponga en contacto conmigo
```

**Cuéntame tu historia.** Campos:
- `Nombre`*, `Email`*, `Teléfono`, `País`*;
- `Tema`*: Migración, Superación, Derechos humanos, Lucha, Transformación, Justicia u Otra;
- `Historia`*;
- `Compartir públicamente`* y `Anonimato`*, cada uno «sí» o «no»;
- `Cómo contactarte`*: Email, Teléfono, WhatsApp o Instagram;
- `Instagram`;
- `Consentimiento RGPD`*.
```text
He leído y acepto la política de privacidad y consiento expresamente el tratamiento de los datos de mi historia, incluidos los datos sensibles que decida incluir, para que Denisse González pueda leerla, contactarme y, solo si lo he indicado, compartirla públicamente
```

**Contacto.** Campos: `Nombre`*, `Email`*, `Teléfono`, `Mensaje`*, `Consentimiento RGPD`*.
```text
He leído y acepto la política de privacidad y consiento el tratamiento de mis datos para que Denisse González responda a mi mensaje y se ponga en contacto conmigo
```

**Planes (diálogo de contratación).** Campos: `Nombre`*, `Email`*, `Teléfono`*, `Consentimiento RGPD`*, `Desistimiento`*. Hay dos casillas separadas y ninguna puede estar marcada de entrada.
- `Consentimiento RGPD`:
  ```text
  He leído la política de privacidad
  ```
- `Desistimiento`: un texto por plan, cambiando el nombre y el importe (Básico 242 €, Estándar 315 €, Premium 425 €):
  ```text
  Contrato el Plan Básico: cuota de 242 € al mes (IVA incluido), que se cobra con tarjeta cada mes hasta que me dé de baja. Pido que el servicio empiece ya, sin esperar a que pasen los 14 días en que puedo desistir. Sé que, si desisto antes de que el servicio esté completamente prestado, pagaré la parte proporcional de lo ya prestado hasta ese momento, y que perderé el derecho a desistir cuando esté completamente prestado. Acepto las condiciones de contratación
  ```
  En la web, «política de privacidad» enlaza a `/politica-privacidad/` y «condiciones de contratación» a `/condiciones-contratacion/`.

**Ojo:** la sección 6.2 de `WEB-INTEGRACION.md` está **desfasada**. La clave ya no es `Inicio inmediato del servicio`: ahora es `Desistimiento`, con el texto de arriba. AccioGest ya crea ese campo, así que no hace falta el INSERT que se menciona allí. Si falta una casilla obligatoria, la API responde 400 `Faltan campos obligatorios` con `missing_fields`.

**Reservas:** la casilla legal va dentro del widget de AccioGest, con su texto y sus enlaces, y se guarda con la cita. La web no pone casilla. Mantén la línea que hay bajo el widget.

## 3. Integración técnica (planes, formularios, reservas)

El detalle, con código por fichero, está en `WEB-INTEGRACION.md` (12-11), y sigue valiendo salvo la 6.2 (ver arriba). En resumen:

- **Planes:** el botón «Contratar» abre un diálogo propio (`PlanCheckoutDialog.astro` + `plan-checkout.ts`). Ese diálogo hace `POST https://api.acciogest.com/form-builder/public/<id del plan>/create-checkout-session` con `response_data` y los `utm_*` en la raíz del cuerpo. Después redirige a la `url` de Stripe que viene en la respuesta 200.
- **Vuelta de Stripe:** el cliente vuelve a `/gracias/?tipo=plan&plan=<basico|estandar|premium>&response_id=…&pago=ok&session_id=…`. En `/gracias/` (plan) va el texto de cuota mensual y el enlace del portal, si existe.
- **Errores del checkout** (400, 404, 429…): la tabla del punto 1 de `WEB-INTEGRACION.md`. Ante un 429, el botón se bloquea 60 s.
- **Formularios de leads:** `POST /form-builder/public/<id>/submit`.
  - Los `utm_*` van en la raíz del cuerpo, no dentro de `response_data`.
  - El teléfono se limpia con `cleanPhone()`: solo puede llevar `+`, dígitos, espacios, guiones y paréntesis.
- **Importe de los planes:** se lee de la raíz del JSON del formulario, no de un campo. AccioGest lo muestra como «315,00 €/mes».
- **Reservas:** iframe del plugin con `?service=<acciogest_id>`.
  - Cada servicio de `servicios.json` lleva su `acciogest_id`.
  - Toda reserva tiene que llevar servicio, porque sin él la API la rechaza.
  - `/catalogo` no existe: es normal que dé 404 y la web use `servicios.json`.
  - `citaId` llega por `postMessage` como número y se redirige a `/gracias/?tipo=reserva&cita=<id>`.

## 4. Variables de Netlify (cuando AccioGest pase los IDs)

```text
PUBLIC_ACCIOGEST_FORM_SERVICIO
PUBLIC_ACCIOGEST_FORM_HISTORIA
PUBLIC_ACCIOGEST_FORM_CONTACTO
PUBLIC_ACCIOGEST_PLAN_BASICO
PUBLIC_ACCIOGEST_PLAN_ESTANDAR
PUBLIC_ACCIOGEST_PLAN_PREMIUM
PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID
PUBLIC_STRIPE_PORTAL_URL
```

- Todos los IDs son números enteros. El del plugin es su id, no el token.
- `PUBLIC_STRIPE_PORTAL_URL` es el enlace del portal de cliente de Stripe de Denisse (`https://billing.stripe.com/p/login/…`). Si el valor no empieza así, no se muestra el enlace.
- Se definen en Netlify y después hay que hacer «Clear cache and deploy site», porque se leen al compilar.

## 5. Prueba antes de publicar

Hazla en un deploy preview, con las claves de prueba de Stripe puestas en AccioGest. Tarjeta `4242 4242 4242 4242`, con cualquier fecha futura y cualquier CVC.

- [ ] Los 3 formularios de leads envían bien y la respuesta llega con el texto de la casilla. Prueba también un envío con `?utm_source=prueba`.
- [ ] Sin marcar «Desistimiento», el plan da 400 y la web lo explica. Marcándolo, va a Stripe.
- [ ] Stripe muestra «… €/mes» y, tras pagar, se vuelve a `/gracias/?tipo=plan…&pago=ok`.
- [ ] La reserva de un servicio de pago pide la casilla legal, cobra y vuelve a `/gracias/?tipo=reserva`.
- [ ] Condiciones y privacidad con todos los cambios del punto 1, sin apartados vacíos.
- [ ] Revisión en móvil (390 px) del diálogo de contratación: se ven las dos casillas y el botón sin hacer scroll horizontal.

## Lo que falta de otros (no lo hace la web)

- **Denisse:**
  - confirmar cuándo surte efecto la baja;
  - activar el portal de cliente y los recibos en Stripe;
  - dar sus claves reales de Stripe;
  - confirmar el horario de la agenda.
- **Abogado:** «completamente prestado» y el cálculo de la parte proporcional.
- **AccioGest:**
  - subir la API;
  - montar la empresa y pasarte los IDs;
  - poner el webhook de Stripe;
  - pasar los planes a mensuales el día de publicar.

# Web de Denisse González · Abogada

Web estática hecha con **Astro** (todo lo estático) e **islas de React** (solo para piezas
interactivas ricas). Varias páginas, transiciones nativas entre páginas (View Transitions),
tipografías e imágenes optimizadas en el propio sitio y objetivo de **Lighthouse ≥ 95/100/100/100**.

## Comandos

Requisitos: Node 22.12 o superior y npm.

```bash
npm install          # dependencias
npm run dev          # servidor de desarrollo → http://localhost:4321
npm run build        # compila la web estática en dist/
npm run preview      # sirve dist/ para revisarla
npm run check        # comprobación de tipos y de los componentes (astro check)
npm run icons        # regenera los iconos PNG a partir del logotipo (revisar el resultado)
npm run mock:acciogest -- --port 4322 [--dist dist]  # AccioGest de PRUEBA (catálogo, planes, widget)
npm run globe-poster # regenera el póster del globo de Conóceme (necesita Playwright + Chromium)
npm run og-images    # regenera public/og-image.jpg y public/og-empresas.jpg (Playwright + Chromium)
npm run web-anterior-images # recortes del equipo y logo del partner desde _originales/web-anterior/
npm run recursos-2026-10-images # recortes y logos de _originales/recursos-2026-10/ (despacho, equipo,
                     # partners, EMLHIS, logos de Empoderando Voces)
```

Para probar la versión compilada «como en producción» (con gzip): `npx serve dist`.

## Estructura

```
astro.config.mjs            Configuración (SITE_URL, BASE_PATH, React, sitemap)
public/                     Archivos que se copian tal cual: favicon.svg, iconos PNG,
                            site.webmanifest, og-image.jpg (imagen para redes)
scripts/
  generate-icons.mjs        Genera favicon-32, apple-touch-icon (180), icon-192/512 y maskable
  icon-source.svg           Fuente de los iconos cuadrados
  render-globe-poster.mjs   Póster del globo (src/assets/globe-poster.png) con cobe y la misma vista
  render-og-images.mjs      Imágenes para redes (og-image.jpg, og-dubai.jpg) con la tipografía de la web
  prepare-web-anterior-images.mjs  Recortes 4:5 del equipo y logo de Poplavsky (web anterior)
  prepare-recursos-2026-10.mjs     Retrato del despacho (inicio + Conóceme), foto de Denisse del
                            equipo, EMLHIS, logos de partners, Ariel Noriega y logos de Empoderando Voces
src/
  pages/                    Una página por archivo (la URL sale del nombre)
    index.astro             Inicio (hero de la cliente, servicios + Dubái, testimonio)
    conoceme.astro          Conóceme · Actividad reciente (agenda 2026) · Experiencia · Mi trayectoria ·
                            globo 3D · El despacho y equipo
    servicios.astro         Extranjería en España (9 tarjetas) · Gestoría y otros trámites · Asesorías
                            · enlace sobrio a Autogestión DG · #reservar · preguntas frecuentes
                            (#preguntas) · visita guiada
    autogestion-dg.astro    Autogestión DG (página discreta: solo enlace en Servicios y en el pie):
                            vídeo (public/video/, preload="none"), trámites, planes con incluye /
                            no incluye, botones de AccioGest y aviso de condiciones
    apertura-de-empresas.astro  Apertura de empresas en España, México y Dubái (#dubai: ¿Por qué
                            Dubái?, estructuras, equipo local, partner Poplavsky, preguntas
                            frecuentes). /dubai/ redirige aquí (netlify.toml 301 + `redirects` de Astro)
    derechos-humanos.astro  Derechos humanos · Summit · cita · Mi compromiso · En medios (8M + prensa 2021)
    empoderando-voces.astro Empoderando Voces + formulario «Cuéntame tu historia»
    contacto.astro          Despacho (dirección y «Cómo llegar»), WhatsApp, teléfono, email, redes y
                            formulario de contacto
    gracias.astro           Agradecimiento tras pagar un plan o reservar (noindex, fuera del menú)
    aviso-legal.astro, politica-privacidad.astro, condiciones-contratacion.astro, 404.astro
    robots.txt.ts           robots.txt con la URL absoluta del sitemap
  layouts/
    BaseLayout.astro        <head> común (SEO, Open Graph, canonical, JSON-LD, fuentes),
                            cabecera, pie y WhatsApp flotante
    LegalLayout.astro       Páginas legales (aviso legal, privacidad y condiciones)
  components/
    layout/                 Header (menú móvil con Popover API), Footer, WhatsAppFloat, LogoMark
    seo/                    Fonts (tipografías autoalojadas + fallbacks), JsonLd
    ui/                     Icon, Photo (imágenes optimizadas), SocialLinks, Faq (<details>)
    home/ about/ services/ media/ contact/ ev/ dubai/   Secciones de cada página
                            (about/Firm.astro: El despacho + Nuestro equipo; about/Partners.astro:
                            Partners de Conóceme; about/RecentActivity.astro: agenda 2026 con dos fotos; media/PressList.astro: prensa 2021; dubai/PartnerCard.astro;
                            services/Immigration.astro y ServicesFaq.astro; home/Testimonial.astro)
                            (about/globe-mount.ts + globe-config.ts + GlobeSlot.astro: globo 3D, sin React;
                            services/ServicesTour.astro: botón «¿Te guío?»)
    forms/                  LeadForm, FormDialog, Field, ChoiceField (formularios de AccioGest)
    islands/                Islas de React (hooks.ts: reducir movimiento / pausar fuera de pantalla)
  directives/               deferred.ts: client:deferred (decide antes de descargar una isla)
    react-bits/             Componentes copiados de React Bits (con su licencia): Aurora,
                            CircularGallery, Magnet
  data/
    site.ts                 Teléfono, WhatsApp, email, despacho, redes, navegación ← ÚNICA fuente
    servicios.json          Catálogo: extranjería en España, gestoría, asesorías, Autogestión DG
                            (planes con `includes`), apertura de empresas, Dubái ← precios aquí
                            (`acciogest_id` en cada precio de asesoría; planes: null. Ver «AccioGest»)
    acciogest-catalogo.last.json  Última copia buena del catálogo de AccioGest (la escribe la
                            compilación; no se edita a mano)
    faq.ts                  Preguntas frecuentes (España / Dubái) + FAQPage para JSON-LD
    medios.ts               Artículo «8 de marzo — Voces que se unen» y su transcripción; prensa de
                            2021 (PRESS_2021: medio, fecha, titular, extracto literal, enlace)
    actividad.ts            Agenda 2026 y campañas informativas de Conóceme (docs/redes-sociales.md §4)
    legal.ts                Textos de consentimiento + datos de la titular (NIE: solo páginas legales)
  config/acciogest.ts       IDs de AccioGest, etiquetas de los campos, versión de la política
  integrations/acciogest-catalog.mjs  Catálogo de AccioGest al compilar (con copia de respaldo)
  lib/                      Utilidades (rutas con base, catálogo de servicios)
  scripts/                  JS del cliente: diálogos (dialog.ts), cliente de AccioGest
                            (acciogest.ts), controlador de formularios (lead-form.ts),
                            apariciones (reveal.ts), visita guiada (tour.ts, diferida) y
                            foco de luz de las tarjetas (spotlight.ts)
  styles/global.css         Tokens de diseño (colores, tipografía, espaciado, radios,
                            sombras, curvas y duraciones de animación) y estilos comunes
  styles/tour.css           Estilos de marca de la visita guiada (se cargan solo al abrirla)
  assets/                   Fotos originales (se optimizan al compilar), logotipo, póster del globo
docs/                       Textos de la cliente (contenido.md), web anterior (web-anterior.md),
                            redes sociales (redes-sociales.md) e integración con AccioGest
_originales/                Originales sin tocar: NO se publican (no están en src/ ni public/)
```

## Dónde se edita cada cosa

- **Precios y servicios:** `src/data/servicios.json`. Inicio y Servicios se generan desde aquí
  al compilar (no hay precios escritos a mano en las páginas). JSON-LD también. Con
  `BOOKING_PLUGIN_ID` configurado, los precios enlazados (`acciogest_id`) los manda AccioGest
  (ver «AccioGest → Catálogo»).
- **Teléfono, WhatsApp, email, dirección del despacho y redes:** `src/data/site.ts` (`PHONE`,
  `EMAIL`, `OFFICE`; si cambia algo, solo aquí: cabecera, pie, contacto, JSON-LD y legales).
- **Datos legales de la titular (nombre completo y NIE):** `src/data/legal.ts` → `LEGAL_ID`.
  Solo lo importan las páginas legales (aviso legal, privacidad, condiciones): ni el nombre
  completo de la titular ni el NIE aparecen en ninguna otra página, en el pie ni en JSON-LD
  (docs/contenido.md §1). El resto de la web usa `SITE.name` («Denisse González»).
- **Servicios de extranjería en España y Dubái:** `src/data/servicios.json` (`immigration`,
  `dubai`). Sus `lead_value` son las opciones del selector «Servicio» del formulario.
- **Preguntas frecuentes:** `src/data/faq.ts` (mismo texto en la página y en el JSON-LD).
- **Textos:** en cada página de `src/pages/` o en su sección de `src/components/`. La fuente de
  verdad de los textos es `docs/contenido.md` (textos de la cliente, tal cual).
- **Colores, tipografías, espaciado y animación:** variables en `src/styles/global.css` (§1).
- **Fotos:** `src/assets/img/`. Se usan con el componente `Photo` (AVIF + WebP + JPG, varios
  anchos, `width`/`height`, `lazy` salvo la imagen principal con `priority`).
- **Logotipo:** `src/assets/logo/` (SVG) y `src/components/layout/LogoMark.astro` (en línea en
  la cabecera). Iconos: `public/favicon.svg` y `npm run icons`.

## AccioGest (formularios, planes y reservas)

Especificación: `docs/integracion-acciogest.md`. Todo se configura en
**`src/config/acciogest.ts`**; no hace falta backend ni claves secretas.

### Estado 27-11-2026: AccioGest en real

AccioGest funciona **en real** (empresa 619) y **los pagos son reales** (Stripe en vivo). Los IDs
de producción son los valores por defecto de `src/config/acciogest.ts` (las variables
`PUBLIC_ACCIOGEST_*` los sustituyen si se definen):

| Pieza | ID |
|---|---|
| Formularios de leads: servicio / historia / contacto | 46 / 47 / 48 |
| Planes (pago único, IVA incluido): Básico 242 € / Estándar 315 € / Premium 425 € | 49 / 50 / 51 |
| Plugin de reservas (con pago previo) · servicios del widget (`servicios.json` → `acciogest_id`) | 24 · 133-138 |

- «Contratar» abre `https://api.acciogest.com/form-builder/public/<49|50|51>/page` en la misma
  pestaña; tras pagar vuelve a `/gracias/?tipo=plan&plan=<clave>&response_id=…&pago=ok`, que
  muestra el éxito (con o sin esos parámetros) y «Recibirás por correo el justificante del pago.»
  (recibos de Stripe activados en la cuenta de Denisse).
- Qué cambió: el modo simulado y su aviso «Modo de prueba» ya no se activan con los IDs
  configurados (solo con valores de ejemplo, en desarrollo); `?acciogest_mock` no hace nada con
  IDs reales y `?acciogest_debug=1` solo escribe en la consola. Fuera los comentarios pendientes
  de AccioGest ya resueltos. El alojamiento aún no está decidido (no es Netlify): la política de
  privacidad muestra `{ALOJAMIENTO}` y `npm run check:publish` falla hasta rellenar `HOSTING` en
  `src/data/legal.ts`. Las menciones a Netlify de este README son de la configuración anterior.
- **No** enviar formularios, reservas ni pagos de prueba a `api.acciogest.com` (la tarjeta 4242
  se rechaza). En pruebas automáticas, interceptar los POST a AccioGest y responder con un 201
  falso.

| Pieza | Dónde | ID |
|---|---|---|
| «Cuéntame tu historia» (diálogo en `/empoderando-voces/`, también `#cuentame`) | `components/ev/StoryDialog.astro` | `FORMS.historia` |
| «Solicitar información» (diálogo en `/servicios/`: tarjetas y «Solicitar cita»; en `/apertura-de-empresas/`, con el país preseleccionado; en `/autogestion-dg/`, planes sin ID, con `withPlans`) | `components/services/ServiceRequestDialog.astro` | `FORMS.servicio` |
| Formulario de contacto (`/contacto/#formulario-contacto`) | `components/contact/ContactForm.astro` | `FORMS.contacto` |
| «Contratar Plan X» → página de pago del plan en AccioGest (pago único, misma pestaña, `/autogestion-dg/`) | `components/services/AutogestionPlans.astro` | `PLANES.basico/estandar/premium` |
| Widget de reservas en `/servicios/#reservar` (carga diferida, 760 px reservados) | `components/services/BookingSlot.astro` | `BOOKING_PLUGIN_ID` |

**Poner los IDs** — con variables de entorno al compilar en **Netlify** (el hosting de la web:
Site configuration → Environment variables; WEB-INTEGRACION 12-11 §5) o editando los valores de
ejemplo de `src/config/acciogest.ts`. (Si algún día se publica con el workflow de GitHub Pages,
irían en Settings → Secrets and variables → Actions → Variables, que el workflow ya pasa.) Las 7
variables (3 formularios, 3 planes y el plugin de reservas):

```
PUBLIC_ACCIOGEST_FORM_SERVICIO   PUBLIC_ACCIOGEST_FORM_HISTORIA   PUBLIC_ACCIOGEST_FORM_CONTACTO
PUBLIC_ACCIOGEST_PLAN_BASICO     PUBLIC_ACCIOGEST_PLAN_ESTANDAR   PUBLIC_ACCIOGEST_PLAN_PREMIUM
PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID
```

(`PUBLIC_ACCIOGEST_API` y `PUBLIC_ACCIOGEST_WIDGET_ORIGINS` no hacen falta: la API y el iframe
de reservas son `https://api.acciogest.com`). Todos los IDs son
**números enteros**; el del plugin es su **id, no el token**. No hay portal de cliente de Stripe
(los planes son de pago único: respuesta de AccioGest del 23-11-2026). **Se leen al compilar**: tras definirlas o cambiarlas
en Netlify, **Deploys → Trigger deploy → «Clear cache and deploy site»**.

Son IDs públicos (acaban en el HTML/JS), no secretos. Ejemplo local:
`PUBLIC_ACCIOGEST_FORM_CONTACTO=123 npm run build`.

**Modo simulado** (solo desarrollo; nunca con los IDs reales) — si un ID se sustituye por un
valor de ejemplo (`FORM_ID_…` / `PLUGIN_ID`):
- formularios: no se envía nada; la respuesta se simula (~700 ms, misma forma que la API) y el
  formulario muestra un aviso visible de «Modo de prueba» con WhatsApp como alternativa;
- planes: un plan sin ID real (o con el precio oculto en AccioGest) no lleva al pago:
  «Contratar» abre «Solicitar información» con el plan preseleccionado (sin JavaScript,
  WhatsApp);
- reservas: panel con lo que incluye la reserva, «Solicitar cita» y WhatsApp.

Errores de prueba (solo en modo simulado; con IDs reales no hacen nada), añadiendo a la URL: `?acciogest_mock=400`,
`400-email`, `429` (o `429-5` para 5 s), `403`, `404`, `500`, `network`, `timeout`.

**Comprobar etiquetas** (con IDs reales): `?acciogest_debug=1` → la consola compara las
etiquetas de la web con `GET /form-builder/public/{FORM_ID}` y avisa de las que no existen, de
las obligatorias que no se envían y de las obligatorias en AccioGest pero opcionales en la web.

**Etiquetas** (`FIELD_LABELS` en `src/config/acciogest.ts`): claves de
`response_data` exactamente iguales a las del formulario en AccioGest. `Consentimiento RGPD`
lleva como valor el **texto exacto de la casilla** (`src/data/consent.ts`; el que AccioGest
guarda como prueba del consentimiento; en la web se ve con el enlace, se envía sin él). Ya **no** se envía `Versión política`. `utm_source` /
`utm_medium` / `utm_campaign` (solo las de la dirección de la página desde la que se envía el
formulario; no se guarda nada en el navegador) van en la **raíz** del cuerpo, no dentro de `response_data`. `Teléfono` se limpia con
`cleanPhone()` (`+` solo al principio, dígitos, espacios, guiones y paréntesis; los puntos
pasan a espacios); se valida el valor limpio (al menos 6 dígitos). Los campos opcionales vacíos
no se envían.

**Respuestas**: 201 → muestra el `message` de AccioGest y resetea · 400 → marca los campos
(`missing_fields` o «El campo "X"…») · 403/404 → «no disponible» + WhatsApp · 429 → cuenta
atrás con `Retry-After` (60 s si no se puede leer) y botón bloqueado · sin red o > 15 s →
mensaje y se conservan los datos. Campo trampa `website`: si llega relleno se finge éxito.

**Página `/gracias/`** (`?tipo=plan&plan=basico|estandar|premium` o `?tipo=reserva`). La página
de pago de cada plan vuelve a `/gracias/?tipo=plan&plan=<basico|estandar|premium>&response_id=…&pago=ok`
**solo cuando el pago se ha completado**, así que `/gracias/` no comprueba nada (muestra lo mismo
con o sin `response_id` / `pago`): el nombre del plan, «Pago único: N € (IVA incluido)», «Recibirás
por correo el justificante del pago.», lo que incluye y el enlace a las condiciones. Tras una reserva, el widget avisa a la web (`acciogest:booking:done`, `citaId` número;
solo un entero positivo pasa a `&cita=`) y la web lleva a `/gracias/?tipo=reserva&cita=…`.

### Planes de Autogestión DG: pago único (respuesta 23-11)

Decisión final de AccioGest (`docs/respuestas-acciogest-2026-11-23-pago-unico.md`): **pago único
por trámite**, sin cuota mensual, sin portal de cliente de Stripe y sin diálogo propio. Sustituye
a los planes mensuales del handoff 19-11 (`docs/handoff-acciogest-2026-11-19.md`, archivado).

- «Contratar Plan X» (plan con ID real y precio visible) → enlace a
  `{API}/form-builder/public/{PLAN_ID}/page` en la **misma pestaña** (`planPageUrl()`). Esa página
  de AccioGest lleva las casillas (incluida «Desistimiento»), el importe y el pago con tarjeta
  (Stripe); la web no envía nada ni muestra casillas para los planes.
- Al pagar, AccioGest vuelve a `/gracias/?tipo=plan&plan=<clave>&response_id=…&pago=ok`
  (configurado en cada formulario de plan).
- Importe de cada plan: `payment_amount` (euros, con `payment_enabled === true`) de la raíz de
  `GET /form-builder/public/{PLAN_ID}` al compilar (`extractPlanAmount()`; respaldo: el campo de
  pago de `fields[]`); aviso en el log si `payment_interval` no es `null` (cobro recurrente). Se
  muestra «242 €» + «IVA incluido · pago único».
- Reservas: el widget nunca se carga sin `&service=` (por defecto, la primera asesoría
  reservable enlazada); sin ninguna enlazada, se ve el panel de «Solicitar cita».

### Catálogo de AccioGest (fase A)

Especificación: `docs/integracion-acciogest.md` → «Fase A». En real desde el 27-11-2026 (la ruta
`/catalogo` no existe: los datos salen de `servicios.json`).

- **`acciogest_id`** (`src/data/servicios.json`): en cada `consultations[].prices[]`, el
  `plugin_citas_services.id` del servicio en el plugin de citas, como texto (p. ej. `"41"`;
  online y presencial son servicios distintos, cada uno con su id). No es un uuid ni un id de
  catálogo. `null` = sin enlazar; **sin ninguno enlazado no se carga el widget**. Puestos: 133-138
  (AccioGest, 24-11). Los planes se quedan con `acciogest_id: null` (su
  importe sale de su formulario).
- Al compilar con `BOOKING_PLUGIN_ID` configurado se pide
  `{API}/plugin-citas/public/{BOOKING_PLUGIN_ID}/catalogo` (8 s como máximo). **Esa ruta no existe
  en la API**: el 404 y el aviso «No se ha podido leer el catálogo de AccioGest» en el log son lo
  previsto, y nombres, duraciones y precios salen de `servicios.json` (sin marcar ningún id como
  despublicado). Si existiera, se mezclarían por `acciogest_id` nombre, descripción, duración y
  precio con IVA (`precio_bruto`; `mostrar_precio: false` oculta ese precio). Los planes con
  `PLANES.<plan>` configurado toman su importe de `payment_amount` en la raíz de su formulario.
  Los bloques sin precio siguen en el JSON.
- Si AccioGest no responde, aviso en el log de la compilación y se usa la **última copia buena**
  (`src/data/acciogest-catalogo.last.json`, o la caché de Netlify si es más reciente); si no hay,
  `servicios.json`. Tras compilar en local con los IDs reales, versionar ese archivo.
- **Pruebas**: `ACCIOGEST_MOCK_CATALOG=1 PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID=demo npm run build`
  (fixture `scripts/acciogest-mock/`, sin red; enlaza los `acciogest_id: null` con ids de
  prueba). Widget y mensajes del iframe: `npm run mock:acciogest -- --port 4322 --dist dist`
  tras compilar con `PUBLIC_ACCIOGEST_API=http://127.0.0.1:4322` y abrir
  `http://localhost:4322/servicios/#reservar`.
- Orígenes permitidos para los mensajes del widget: el de `PUBLIC_ACCIOGEST_API`
  (`https://api.acciogest.com`, desde donde se sirve el iframe; `PUBLIC_ACCIOGEST_WIDGET_ORIGINS`
  no hace falta). Cambiar de servicio con el widget ya cargado usa
  `window.AccioGestBooking.setService(id)`, sin recargar; quitar y volver a inyectar el script
  queda solo como respaldo.

### Build hook (recompilar cuando cambie un servicio)

AccioGest llamará a un build hook de Netlify cuando Denisse cambie un servicio publicado (los
cambios seguidos se juntan en una sola llamada). Para crearlo:

1. Netlify → el sitio → **Site configuration → Build & deploy → Continuous deployment → Build
   hooks → Add build hook**.
2. Nombre: `AccioGest catálogo`; rama: **la rama de producción** (la que publica la web).
3. Guardar y copiar la URL (`https://api.netlify.com/build_hooks/…`).
4. Enviarla a AccioGest **por un canal privado**. Es un **secreto** (quien la tenga puede lanzar
   compilaciones): **nunca** se escribe en el repositorio, en `netlify.toml`, en el código ni en
   documentos compartidos. Si se filtra, se borra el hook en Netlify y se crea otro.

Prueba manual: `curl -X POST -d '{}' "<URL del hook>"` → aparece un despliegue nuevo en Netlify.

## Sistema de movimiento

Criterios de Emil Kowalski, con tokens en `src/styles/global.css` §1 (`--ease-*`, `--dur-*`,
`--press-scale`, `--reveal-y`, `--stagger`). Elegante y nítido: nada de rebotes.

- **Curvas:** `--ease-out` para entrar/salir, `--ease-in-out` para mover en pantalla,
  `--ease-drawer` para el menú móvil, `ease` para hover/color, `linear` solo para movimiento
  constante. Nunca `ease-in`.
- **Duraciones:** la UI siempre < 300 ms; las salidas más rápidas que las entradas
  (`--dur-exit` 150 ms). Solo se animan `transform`/`opacity` (y `clip-path` para fotos).
- **Pulsar:** todo lo pulsable hace `scale(var(--press-scale))` (0,97) en `:active`, 160 ms.
  El movimiento en hover solo bajo `@media (hover: hover) and (pointer: fine)`.
- **Diálogos** (`FormDialog`, visor de la publicación): transiciones + `@starting-style`,
  opacidad + escala 0,96 → 1 en 220 ms, fondo que se funde, salida en 150 ms.
- **Menú móvil:** se despliega con `clip-path` y curva de cajón; los enlaces entran
  escalonados 40 ms.
- **Aparición al hacer scroll:** `data-reveal` (opacidad + 14 px) y `data-reveal="photo"`
  (la foto se descubre con `clip-path: inset()` y se asienta). Una sola vez, con
  IntersectionObserver (`src/scripts/reveal.ts`), escalonado 50 ms. Sin JavaScript todo se ve:
  el script solo oculta lo que al cargar está por debajo de la pantalla; nunca el contenido
  inicial ni el LCP, y lo que recibe el foco aparece al instante.
- **Títulos de sección** (inspirado en React Bits · BlurText, solo CSS): los `.section-title`
  con `data-reveal` suben 0,3 em y se enfocan desde un desenfoque leve (760 ms, `ease-out`).
  Mismas reglas: solo los que estaban bajo la pantalla; nunca el título principal ni el LCP.
- **Foco de luz en tarjetas** (React Bits · SpotlightCard, sin React: `src/scripts/spotlight.ts`):
  en `/servicios/`, una luz ciruela muy tenue sigue al ratón dentro de las tarjetas de asesorías
  y planes (`data-spotlight`, blanca en el plan destacado). Capa propia movida con `transform`,
  un cálculo por fotograma, solo con ratón fino y sin «reducir movimiento».
- **Preguntas frecuentes** (`<details>` nativos, `ui/Faq.astro`): la respuesta entra con un
  fundido + 6 px (220 ms, `ease-out`) y el «+» gira con transición; al cerrar, al instante.
- **Movimiento reducido:** nada se desplaza ni escala; quedan fundidos cortos de opacidad
  (apariciones, diálogos, menú, transiciones entre páginas). WebGL no se monta.

## Transiciones entre páginas

View Transitions entre documentos **solo con CSS** (`@view-transition { navigation: auto; }`,
`src/styles/global.css` §8), sin router en el cliente:

- La cabecera y el botón de WhatsApp persisten (no se mueven; la cabecera se funde al cambiar
  de tono, p. ej. al entrar en Empoderando Voces).
- Transición por defecto: la página anterior se funde en 150 ms y la nueva entra con 10 px de
  subida en 280 ms (`ease-out`).
- La tarjeta de Empoderando Voces del inicio y la portada de su página comparten
  `view-transition-name: ev-panel`: la tarjeta oscura se expande hasta ser la página
  (440 ms, `ease-in-out`; fundido cruzado sincronizado con `plus-lighter` y un leve desenfoque,
  y el radio de la tarjeta animado con el recorte). Solo si la tarjeta (o la portada, al volver)
  está a la vista al cambiar de página: si no, se le quita el nombre y hay fundido normal (nada
  vuela desde fuera de la pantalla). Si hay pareja, la página marca el tipo `ev-morph` y el
  inicio se queda un instante para que se vea crecer la tarjeta.
- **Retrato compartido inicio ↔ Conóceme** (clase `portrait`, nombre `portrait-<foto>`,
  420 ms, `ease-in-out`): el retrato del hero del inicio y el de «Conóceme» son el mismo
  archivo, así que la foto viaja y cambia de tamaño hasta su sitio como una sola imagen
  (fundido cruzado sincronizado). El nombre lo pone un script diminuto de `BaseLayout`
  (`pageswap` / `pagereveal`) solo en la foto `.vt-portrait` que más se ve en pantalla en cada
  lado y solo entre esas dos páginas; como el nombre incluye la foto, si las fotos son
  distintas (p. ej. la de la ONU de la tarjeta «Conóceme» del inicio) no hay pareja y cada una
  se funde en su sitio. No se guarda nada en el navegador.
- **Página actual en la navegación** (escritorio): la línea bajo el enlace activo
  (`.nav-current`, `view-transition-name: nav-current`) se desliza al enlace de la nueva página.
- Con «reducir movimiento» no hay desplazamientos ni cambios de tamaño (el retrato no se nombra):
  solo fundidos. Navegadores sin View Transitions: navegación normal, sin errores.
- Las páginas internas se precargan al pasar el ratón (Speculation Rules), así la transición es
  casi instantánea.

## Empoderando Voces (`/empoderando-voces/`)

Página editorial e inmersiva, distinta del resto: ciruela profundo (`--ev-bg` #1F1024,
derivado de la marca), oro antiguo `--ev-gold` usado con moderación (contraste AA/AAA),
Cormorant en cursiva + Barlow Condensed. Cabecera en su variante oscura translúcida
(`BaseLayout headerTone="dark"`) sobre la portada, sin corte claro/oscuro.

- Logos (`src/assets/img/ev/`, `docs/cambios-2026-10.md` §1): el principal en la firma de la
  página y como sello sobre las fotos de la tarjeta del inicio; el principal también en la franja
  «Empoderando Voces» del pie general (todas las páginas). Van sobre su fondo blanco original.
  El despacho sigue con el logo DG.
- Portada: tipográfica en móvil (el título es el LCP y no se anima); en escritorio, con la foto
  de *Education for Peace* (solo se descarga a partir de 960 px).
- Islas de React Bits (`src/components/react-bits/`, ver `THIRD_PARTY_NOTICES.md`):
  - **Aurora** (WebGL, ogl) tras la portada: `client:deferred` (≥ 768 px, tras `load` y en
    un momento ocioso, nunca con «reducir movimiento»: ni React ni ogl se descargan en móvil
    ni con movimiento reducido); el lienzo se crea tras la transición, se pausa fuera de
    pantalla, 30 fps a media resolución y **se detiene sola a los 5 s** (WCAG 2.2.2); debajo,
    un póster CSS con el mismo ambiente.
  - **CircularGallery** (WebGL, ogl) con las fotos de Nueva York: `client:visible`, sobre una
    lista estática accesible (texto alternativo, desplazable, enfocable) que es la galería sin
    JS / sin WebGL / con movimiento reducido. Botones anterior/siguiente y región `aria-live`.
    No se mueve sola (sin bucle en reposo) ni secuestra la rueda de la página. La galería
    WebGL y ogl llegan aparte (`import()`) y solo sin movimiento reducido. Fotos AVIF/WebP a
    450 y 600 px con `srcset`; las texturas reutilizan el archivo que eligió cada `<img>`.
  - **Magnet** en el gran botón «Cuéntame tu historia»: `client:deferred` (solo con ratón, al
    acercarse a la pantalla y sin movimiento reducido), desplazamiento ≤ 10 px.
- El gran botón y el de la portada abren el formulario de AccioGest (`StoryDialog`, sin cambios
  en su lógica); sin JavaScript, WhatsApp. `/empoderando-voces/#cuentame` lo abre directamente.

## Globo 3D (Conóceme, tras «Mi trayectoria»)

`src/components/about/GlobeSlot.astro` + `globe-mount.ts` (cobe 2, WebGL, ≈ 8 KB gzip, **sin
React**: lo carga un `<script>` con `import()`) + `globe-config.ts` (lugares, vista, colores y
proyección compartidos).

- México y España en ciruela sobre un globo marfil y lavanda, unidos por un arco; etiquetas HTML
  que siguen a los puntos; pie «México · España». Nueva York ya no aparece (no trabaja allí,
  `docs/cambios-2026-10.md` §2.5); el Summit de la ONU sigue en el resto de la web.
- **Póster** (`src/assets/globe-poster.png`, AVIF/WebP diferido): el mismo globo renderizado
  con cobe y la misma vista (`npm run globe-poster`), así que al hidratar no hay salto. Es lo
  que se ve antes de hidratar, sin JavaScript, sin WebGL y con «reducir movimiento».
- Caja cuadrada reservada (sin CLS); se descarga al acercarse a la pantalla (240 px de margen)
  y solo sin «reducir movimiento»; contexto WebGL en un momento ocioso; ≤ 2× de densidad; ~30 fps en reposo; se detiene fuera de pantalla y con
  la pestaña oculta. cobe reescribe una `<style>` en cada fotograma (para CSS Anchor
  Positioning, que no usamos): se retira del documento para no recalcular estilos.
- Movimiento: vaivén lento (±14°, 28 s) que mantiene los dos lugares a la vista y **se frena
  y se detiene a los 5 s** sin interacción (WCAG 2.2.2); se puede girar arrastrando en
  horizontal (inercia con rozamiento, vuelve a moverse) y vuelve solo a su vista; en táctil el
  gesto vertical sigue desplazando la página.
- Accesibilidad: la caja es `role="img"` con texto alternativo; lienzo y etiquetas, decorativos.
- Si cambias `globe-config.ts`, regenera el póster y revísalo.

## Visita guiada (`/servicios/`, «¿Te guío?»)

Botón discreto en la cabecera de Servicios (`ServicesTour.astro`). Nunca arranca sola; sin
JavaScript es un enlace a `#asesorias`. Al pulsarlo se descarga `src/scripts/tour.ts` con
driver.js y su CSS (≈ 13 KB gzip, todo en ese chunk diferido; se precarga al pasar el ratón o
enfocar el botón).

- Pasos, en el orden de la página (7): servicios de extranjería en España → gestoría y otros
  trámites → asesorías → online o presencial → orientación académica → Reserva tu asesoría →
  preguntas frecuentes (Autogestión DG ya no forma parte de la visita)
  («¿Tienes dudas?», con el botón «Solicitar información», que abre el diálogo de solicitud con
  el evento `dg:service-request`). Sin JavaScript, «¿Te guío?» lleva a `#extranjeria`.
- Textos solo con hechos de `docs/contenido.md` y de la página (precios desde
  `servicios.json`). «¿Cómo funciona?» (pasos tras la compra) y el plan destacado se retiraron
  hasta que la cliente confirme el proceso y qué diferencia los planes (`docs/contenido.md` §7):
  si se reponen, añadir su paso en `tour.ts`.
- Móvil (< 600 px): el bloque resaltado se coloca justo bajo la cabecera y la tarjeta debajo,
  sin taparlo; en los bloques altos se resalta una parte (la tarjeta del plan destacado o, si no
  hay, la primera; el título y las primeras filas de trámites / «Todos los planes incluyen»)
  para que bloque y tarjeta quepan juntos en la pantalla.
- Teclado: el foco va a «Siguiente», Tab se queda en el paso, ← → navegan, Esc cierra y el foco
  vuelve a «¿Te guío?». Estilos de marca en `src/styles/tour.css` (tarjeta 200 ms `ease-out`
  desde 0,97 con origen en el lado del elemento; foco del escenario 300 ms; con «reducir
  movimiento», sin desplazamiento suave ni animación).

## Contenido de la web anterior (denisseg.odoo.com)

Extraído, corregido y anotado en `docs/web-anterior.md` (con sus **alertas**, §9). Textos tal
cual; fotos originales en `_originales/web-anterior/` (recortes con
`npm run web-anterior-images`, revisados a mano: caras completas, mismo encuadre 4:5).

- **/dubai/** «Abre tu empresa en Dubái»: portada tipográfica (arco con celosía de ocho puntas,
  CSS + SVG en línea, sin fotos de stock; motivo `--lattice-gold` / `--lattice-plum` en
  `global.css`), ¿Por qué Dubái?, Holding · Real Estate · Trading, equipo local, partner
  Poplavsky (logo con `mix-blend-mode: lighten` sobre el ciruela), FAQ y solicitud.
  Alerta 9.1: la frase fiscal sin matices de la entradilla NO se publica; las frases fiscales
  matizadas llevan un comentario «PENDIENTE DE REVISIÓN LEGAL» en el código.
- **/servicios/**: «Servicios de extranjería en España» (6 servicios + Nómadas digitales ·
  Emprendedores · Residencias) antes de los precios y preguntas frecuentes (`<details>`,
  FAQPage en JSON-LD; la de Dubái enlaza a /dubai/#preguntas).
- **/conoceme/**: «El despacho» (historia, misión, valores) y «Conoce a nuestro equipo» +
  partner en Dubái, debajo del bloque principal (`components/about/Firm.astro`).
- **Inicio**: tarjeta «Abre tu empresa en Dubái» en el resumen de servicios y el testimonio de
  Jose (sin foto; alerta 9.4). La cifra «más de 1000 personas» (alerta 9.2) NO se publica.
- **Contacto, pie, JSON-LD y legales**: email, teléfono y despacho (DG Gestores y Abogados,
  C/ Eraso 31, local A, 28028 Madrid; «Cómo llegar» abre Google Maps, sin mapa incrustado).
  La dirección de la web antigua no se usa en ningún sitio.

## Islas de React

- Hidratar **siempre** con `client:visible`, `client:idle` o `client:deferred` (nunca
  `client:load` salvo que sea imprescindible; `client:media` tampoco: en escritorio se comporta
  como `client:load`). Inicio: ≤ ~60 KB de JS (gzip) en la carga inicial.
- `client:deferred={{ media, motion, on, rootMargin }}` (`src/directives/deferred.ts`,
  registrada en `astro.config.mjs`) decide **antes** de descargar la isla: solo si coincide la
  media query, nunca con «reducir movimiento» (`motion: true`), y tras `load` + momento ocioso
  (`on: 'idle'`) o al acercarse a la pantalla (`on: 'visible'`).
- Lo que no necesita React no es una isla: el globo de Conóceme es un `<script>` con
  `import()` (cobe), la visita guiada carga driver.js con `import()` al pulsar.
- WebGL/3D solo diferido, pausado fuera de pantalla, desactivado con `prefers-reduced-motion`
  y con un póster estático del mismo tamaño antes de hidratar (ver `GlobeSlot.astro`).
- Componentes de React Bits: conservar la cabecera de licencia y anotarlos en
  `THIRD_PARTY_NOTICES.md`.

## Rendimiento (objetivos)

| Métrica (Lighthouse móvil) | Objetivo |
|---|---|
| Performance | ≥ 95 en todas las páginas |
| Accessibility / Best Practices / SEO | 100 |
| CLS | < 0,05 |
| JS inicial en el inicio | ≤ ~60 KB gzip (hoy ~1,6 KB; Conóceme ~3,3 KB; Servicios ~10 KB; Dubái ~9 KB) |

Cómo se consigue: CSS en línea (sin hojas que bloqueen el renderizado), tipografías
autoalojadas con precarga y *fallbacks* con métricas ajustadas (anchos de línea en `em`, nunca
en `ch`, que cambia al cargar la fuente), imágenes AVIF/WebP con
`srcset`, la imagen principal nunca oculta ni animada desde opacidad 0, apariciones al hacer
scroll que nunca tocan el contenido inicial (script de ~1 KB), WebGL solo diferido y cero
peticiones a terceros al cargar.

### Tipografías

`src/components/seo/Fonts.astro`: seis caras en toda la web — Cormorant Garamond (500, 600 y
cursiva 500), Barlow (400 y 600) y Barlow Condensed (500, sobre todo Empoderando Voces),
subconjuntos latin + latin-ext. Sin cursivas 600 / Barlow 400 cursiva ni Barlow 500 (la
navegación de escritorio va en 400): menos descargas por página. Barlow 600 se precarga en
todas las páginas (cabecera).
Cada página elige qué archivos precargar (`preloadFonts` en `BaseLayout`). Las familias
«Fallback» (Times New Roman / Arial ajustadas con `size-adjust` y `ascent/descent-override`)
evitan saltos al cambiar de fuente; valores calculados con `@capsizecss/unpack`.

## Publicación

**Netlify** (el hosting de la web; dominio principal `https://dggestoresyabogados.com`, antes
`https://denisseg.netlify.app`; `netlify.toml`): comando
`npm run build`, carpeta `dist/`. Las variables de compilación (`SITE_URL` y las de AccioGest) van
en **Site configuration → Environment variables**; tras cambiarlas, **Deploys → Trigger deploy →
Clear cache and deploy site** (se leen al compilar).

**GitHub Pages** (alternativa, incluida): `.github/workflows/deploy.yml` compila con
`withastro/action` y publica en cada push a `main` (o a mano desde Actions → «Run workflow»).

1. Settings → Pages → Source: **GitHub Actions**.
2. Settings → Secrets and variables → Actions → **Variables**:
   - `SITE_URL` = `https://dggestoresyabogados.com` (o el que corresponda: canonical, Open
     Graph, JSON-LD, sitemap y robots.txt usan URLs absolutas). El workflow exige la variable
     («Check SITE_URL»); sin ella, `astro.config.mjs` usa `https://dggestoresyabogados.com`.
     Solo se publica desde `main`.
   - `BASE_PATH` = solo si la web va en un subdirectorio (`/dennise-web` en
     `usuario.github.io/dennise-web` sin dominio propio).

**Otro alojamiento (Vercel, servidor propio):** comando `npm run build`, carpeta `dist/`, con las
mismas variables de entorno.

**Caché.** Los archivos de `/_astro/` (JS, CSS, tipografías e imágenes) llevan un hash en el
nombre y se pueden guardar en caché un año (`immutable`). `public/_headers` lo configura en
Netlify y Cloudflare Pages; en Vercel, añadir la misma regla en `vercel.json` → `headers`; en un
servidor propio, `Cache-Control: public, max-age=31536000, immutable` para `/_astro/*`.
**GitHub Pages no permite cabeceras propias** (todo se sirve con `max-age=600`, así que el
navegador revalida cada 10 minutos): para caché larga, poner Cloudflare delante con una Cache
Rule para `/_astro/*` (Edge y Browser TTL de 1 año) o publicar en Cloudflare Pages / Netlify.

`docs/` y `_originales/` no se publican: solo se publica `dist/`.

## Pendiente

De la cliente (ver `docs/contenido.md` §7):

1. Qué diferencia los planes Básico, Estándar y Premium (hoy: «Todos los planes incluyen»).
2. Colegio profesional y n.º de colegiada (LSSI art. 10), si aplica; confirmar el uso del título
   «abogada» en España (requiere colegiación). Es el único dato identificativo que falta en las
   páginas legales (titular, NIE, nombre comercial, domicilio y email ya están).
3. Alertas de la web anterior (`docs/web-anterior.md` §9): fiscalidad en Dubái (frases matizadas
   marcadas como pendientes de revisión legal), cifra «más de 1000» (no publicada), permiso del
   testimonio de Jose, nacionalidad «por matrimonio o descendencia».
4. Permiso del equipo (Everardo Corona, Stephanie González, Mishell A. González) y de los
   partners (Poplavsky, De la Flor Abogados, Espiga Exports, Ariel Noriega) para publicar; una
   foto mejor de Stephanie si existe; nombre y descripción de «Bienvenido / Welcome!» (proyecto
   de Everardo Corona, PENDIENTE); originales de los logos de Empoderando Voces sin recortar.
5. ~~AccioGest: IDs, `acciogest_id` y revisión legal~~ → en real desde el 27-11-2026 (README →
   «Estado 27-11-2026»). Falta: el proveedor de alojamiento (`{ALOJAMIENTO}`, `HOSTING` en
   `src/data/legal.ts`) y, de la cliente, el proceso tras la compra de un plan.
6. Logotipo: el original dice «Gonzalez» sin tilde y así se ha reproducido; confirmar.
7. Confirmar si los precios de las asesorías (60/80 €, 30/50 €, 45/65 €) incluyen IVA. Hoy solo
   se indica «IVA incluido» en los planes.
8. Idiomas de atención y zona en la que presta servicio (JSON-LD `knowsLanguage`, `areaServed`).
9. Validar la transcripción del artículo «8 de marzo — Voces que se unen».
10. ~~Dominio definitivo~~: `https://dggestoresyabogados.com` (AccioGest, 19-11). Conectarlo en
    Netlify como dominio principal con HTTPS.
11. Redes sociales (`docs/contenido.md` §7, punto 9): enlace de TikTok de su bio de Instagram,
    original del retrato del despacho, sede de C/ Santa Catalina 7 y SANDIN & Asociados.

Técnico: hecho el sistema de movimiento, el rediseño de Empoderando Voces y su transición desde
el inicio, el globo 3D de Conóceme, el retrato compartido inicio ↔ Conóceme, la visita guiada
de Servicios, los detalles de React Bits (foco de luz en tarjetas, títulos que se enfocan) y el
contenido de la web anterior (Dubái, extranjería, FAQ, despacho y equipo, testimonio).

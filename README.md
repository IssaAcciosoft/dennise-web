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
npm run globe-poster # regenera el póster del globo de Conóceme (necesita Playwright + Chromium)
npm run og-images    # regenera public/og-image.jpg y public/og-dubai.jpg (Playwright + Chromium)
npm run web-anterior-images # recortes del equipo y logo del partner desde _originales/web-anterior/
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
src/
  pages/                    Una página por archivo (la URL sale del nombre)
    index.astro             Inicio (hero de la cliente, servicios + Dubái, testimonio)
    conoceme.astro          Conóceme · Experiencia · Mi trayectoria · globo 3D · El despacho y equipo
    servicios.astro         Extranjería en España · Asesorías · Programa Autogestiona · #reservar ·
                            preguntas frecuentes (#preguntas) · visita guiada
    dubai.astro             Abre tu empresa en Dubái (¿Por qué Dubái?, estructuras, equipo local,
                            partner Poplavsky, preguntas frecuentes, solicitud de información)
    derechos-humanos.astro  Derechos humanos · Summit · cita · Mi compromiso · En medios
    empoderando-voces.astro Empoderando Voces + formulario «Cuéntame tu historia»
    contacto.astro          Despacho (dirección y «Cómo llegar»), WhatsApp, teléfono, email, redes y
                            formulario de contacto
    gracias.astro           Agradecimiento tras pagar un plan o reservar (noindex, fuera del menú)
    aviso-legal.astro, politica-privacidad.astro, condiciones-contratacion.astro, 404.astro
    robots.txt.ts           robots.txt con la URL absoluta del sitemap
  layouts/
    BaseLayout.astro        <head> común (SEO, Open Graph, canonical, JSON-LD, fuentes),
                            cabecera, pie y WhatsApp flotante
    LegalLayout.astro       Páginas legales (borradores: completar los [PENDIENTE] antes de publicar)
  components/
    layout/                 Header (menú móvil con Popover API), Footer, WhatsAppFloat, LogoMark
    seo/                    Fonts (tipografías autoalojadas + fallbacks), JsonLd
    ui/                     Icon, Photo (imágenes optimizadas), SocialLinks, Faq (<details>)
    home/ about/ services/ media/ contact/ ev/ dubai/   Secciones de cada página
                            (about/Firm.astro: El despacho + equipo; dubai/PartnerCard.astro;
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
    servicios.json          Catálogo: extranjería en España, asesorías, planes, Dubái ← precios aquí
    faq.ts                  Preguntas frecuentes (España / Dubái) + FAQPage para JSON-LD
    medios.ts               Artículo «8 de marzo — Voces que se unen» y su transcripción
    legal.ts                Textos de consentimiento + datos de la titular (NIE: solo páginas legales)
  config/acciogest.ts       IDs de AccioGest, etiquetas de los campos, versión de la política
  lib/                      Utilidades (rutas con base, catálogo de servicios)
  scripts/                  JS del cliente: diálogos (dialog.ts), cliente de AccioGest
                            (acciogest.ts), controlador de formularios (lead-form.ts),
                            apariciones (reveal.ts), visita guiada (tour.ts, diferida) y
                            foco de luz de las tarjetas (spotlight.ts)
  styles/global.css         Tokens de diseño (colores, tipografía, espaciado, radios,
                            sombras, curvas y duraciones de animación) y estilos comunes
  styles/tour.css           Estilos de marca de la visita guiada (se cargan solo al abrirla)
  assets/                   Fotos originales (se optimizan al compilar), logotipo, póster del globo
docs/                       Textos de la cliente (contenido.md), web anterior (web-anterior.md) e
                            integración con AccioGest
_originales/                Originales sin tocar: NO se publican (no están en src/ ni public/)
```

## Dónde se edita cada cosa

- **Precios y servicios:** `src/data/servicios.json`. Inicio y Servicios se generan desde aquí
  al compilar (no hay precios escritos a mano en las páginas). JSON-LD también.
- **Teléfono, WhatsApp, email, dirección del despacho y redes:** `src/data/site.ts` (`PHONE`,
  `EMAIL`, `OFFICE`; si cambia algo, solo aquí: cabecera, pie, contacto, JSON-LD y legales).
- **Datos legales de la titular (NIE):** `src/data/legal.ts` → `LEGAL_ID`. Solo lo importan
  las páginas legales: el NIE no aparece en ninguna otra página ni en JSON-LD.
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

| Pieza | Dónde | ID |
|---|---|---|
| «Cuéntame tu historia» (diálogo en `/empoderando-voces/`, también `#cuentame`) | `components/ev/StoryDialog.astro` | `FORMS.historia` |
| «Solicitar información» (diálogo en `/servicios/`: tarjetas, planes sin ID, «Solicitar cita»; y en `/dubai/`, con «Apertura de empresa en Dubái» preseleccionado) | `components/services/ServiceRequestDialog.astro` | `FORMS.servicio` |
| Formulario de contacto (`/contacto/#formulario-contacto`) | `components/contact/ContactForm.astro` | `FORMS.contacto` |
| «Contratar Plan X» → página de pago de AccioGest en pestaña nueva | `components/services/Autogestiona.astro` | `PLANES.basico/estandar/premium` |
| Widget de reservas en `/servicios/#reservar` (carga diferida, 760 px reservados) | `components/services/BookingSlot.astro` | `BOOKING_PLUGIN_ID` |

**Poner los IDs** — editando los valores de ejemplo de `src/config/acciogest.ts` o, mejor, con
variables de entorno al compilar (en GitHub: Settings → Secrets and variables → Actions →
Variables; el workflow ya las pasa):

```
PUBLIC_ACCIOGEST_FORM_SERVICIO   PUBLIC_ACCIOGEST_FORM_HISTORIA   PUBLIC_ACCIOGEST_FORM_CONTACTO
PUBLIC_ACCIOGEST_PLAN_BASICO     PUBLIC_ACCIOGEST_PLAN_ESTANDAR   PUBLIC_ACCIOGEST_PLAN_PREMIUM
PUBLIC_ACCIOGEST_BOOKING_PLUGIN_ID                                PUBLIC_ACCIOGEST_API (opcional)
```

Son IDs públicos (acaban en el HTML/JS), no secretos. Ejemplo local:
`PUBLIC_ACCIOGEST_FORM_CONTACTO=abc123 npm run build`.

**Modo simulado** — mientras un ID tenga su valor de ejemplo (`FORM_ID_…` / `PLUGIN_ID`):
- formularios: no se envía nada; la respuesta se simula (~700 ms, misma forma que la API) y el
  formulario muestra un aviso visible de «Modo de prueba» con WhatsApp como alternativa;
- planes: «Contratar» abre el diálogo de solicitud con el plan elegido;
- reservas: panel con lo que incluye la reserva, «Solicitar cita» y WhatsApp.

Errores de prueba (solo en modo simulado), añadiendo a la URL: `?acciogest_mock=400`,
`400-email`, `429` (o `429-5` para 5 s), `403`, `404`, `500`, `network`, `timeout`.

**Comprobar etiquetas** (con IDs reales): `?acciogest_debug=1` → la consola compara las
etiquetas de la web con `GET /form-builder/public/{FORM_ID}` y avisa de las que no existen, de
las obligatorias que no se envían y de las obligatorias en AccioGest pero opcionales en la web.

**Etiquetas** (`FIELD_LABELS` en `src/config/acciogest.ts`): claves de `response_data`
exactamente iguales a las del formulario en AccioGest. Se envían también
`Consentimiento RGPD` = `sí`, `Versión política` = `POLICY_VERSION` (`2026-10`, la que muestra
la política de privacidad) y `utm_source` / `utm_medium` / `utm_campaign` (de la URL de
llegada, guardadas en `sessionStorage` durante la visita). Los campos opcionales vacíos no se
envían. Los textos de las casillas de consentimiento están en `src/data/legal.ts`.

**Respuestas**: 201 → muestra el `message` de AccioGest y resetea · 400 → marca los campos
(`missing_fields` o «El campo "X"…») · 403/404 → «no disponible» + WhatsApp · 429 → cuenta
atrás con `Retry-After` (60 s si no se puede leer) y botón bloqueado · sin red o > 15 s →
mensaje y se conservan los datos. Campo trampa `website`: si llega relleno se finge éxito.

**Página `/gracias/`** (`?tipo=plan&plan=basico|estandar|premium` o `?tipo=reserva`): hay que
configurarla en AccioGest como URL de redirección tras el pago/la reserva, si lo permite.

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

- México, España y Nueva York en ciruela sobre un globo marfil y lavanda, unidos por dos
  arcos; etiquetas HTML que siguen a los puntos; pie «México · España · Nueva York».
- **Póster** (`src/assets/globe-poster.png`, AVIF/WebP diferido): el mismo globo renderizado
  con cobe y la misma vista (`npm run globe-poster`), así que al hidratar no hay salto. Es lo
  que se ve antes de hidratar, sin JavaScript, sin WebGL y con «reducir movimiento».
- Caja cuadrada reservada (sin CLS); se descarga al acercarse a la pantalla (240 px de margen)
  y solo sin «reducir movimiento»; contexto WebGL en un momento ocioso; ≤ 2× de densidad; ~30 fps en reposo; se detiene fuera de pantalla y con
  la pestaña oculta. cobe reescribe una `<style>` en cada fotograma (para CSS Anchor
  Positioning, que no usamos): se retira del documento para no recalcular estilos.
- Movimiento: vaivén lento (±14°, 28 s) que mantiene los tres lugares a la vista y **se frena
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

- Pasos, en el orden de la página (10): servicios de extranjería en España → asesorías → online
  o presencial → orientación académica → Programa Autogestiona (trámites, planes, «¿Cómo
  funciona?», «Todos los planes incluyen») → Reserva tu asesoría → preguntas frecuentes
  («¿Tienes dudas?», con el botón «Solicitar información», que abre el diálogo de solicitud con
  el evento `dg:service-request`). Sin JavaScript, «¿Te guío?» lleva a `#extranjeria`.
- Textos solo con hechos de `docs/contenido.md` y de la página (precios desde
  `servicios.json`). Si cambian los pasos de «¿Cómo funciona?» (`Autogestiona.astro`),
  revisar el texto de ese paso en `tour.ts`.
- Móvil (< 600 px): el bloque resaltado se coloca justo bajo la cabecera y la tarjeta debajo,
  sin taparlo; en los bloques altos se resalta una parte (la tarjeta del plan destacado, el
  título y las primeras filas de trámites / «¿Cómo funciona?» / «Todos los planes incluyen»)
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

**GitHub Pages** (incluido): `.github/workflows/deploy.yml` compila con `withastro/action` y
publica en cada push a `main` (o a mano desde Actions → «Run workflow»).

1. Settings → Pages → Source: **GitHub Actions**.
2. Settings → Secrets and variables → Actions → **Variables**:
   - `SITE_URL` = dominio definitivo, p. ej. `https://www.dominio.es` (**obligatorio**: canonical,
     Open Graph, JSON-LD, sitemap y robots.txt usan URLs absolutas). Sin ella el workflow se
     detiene con un error («Check SITE_URL») y `astro.config.mjs` no compila en CI (`CI=true`);
     en local se usa el marcador `https://denissegonzalez.example`. Solo se publica desde `main`.
   - `BASE_PATH` = solo si la web va en un subdirectorio (`/dennise-web` en
     `usuario.github.io/dennise-web` sin dominio propio).

**Otro alojamiento (Netlify, Vercel, servidor propio):** comando `npm run build`, carpeta
`dist/`, con las mismas variables de entorno.

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
4. Permiso del equipo (Everardo Corona, Stephanie González) y de Poplavsky (logo) para publicar;
   una foto mejor de Stephanie si existe.
5. AccioGest: faltan los 3 `FORM_ID` de formularios, los 3 de planes y el `PLUGIN_ID` de
   reservas (README → AccioGest). Hasta entonces, modo simulado con aviso visible. Si «Servicio»
   es un desplegable en AccioGest, añadir los nuevos valores (extranjería y Dubái).
   Revisar las páginas legales (`[PENDIENTE]`), en especial las condiciones de contratación
   (borrador) y el proceso tras la compra de un plan.
6. Logotipo: el original dice «Gonzalez» sin tilde y así se ha reproducido; confirmar.
7. Confirmar si los precios de las asesorías (60/80 €, 30/50 €, 45/65 €) incluyen IVA. Hoy solo
   se indica «IVA incluido» en los planes.
8. Idiomas de atención y zona en la que presta servicio (JSON-LD `knowsLanguage`, `areaServed`).
9. Validar la transcripción del artículo «8 de marzo — Voces que se unen».
10. Dominio definitivo (`SITE_URL`).

Técnico: hecho el sistema de movimiento, el rediseño de Empoderando Voces y su transición desde
el inicio, el globo 3D de Conóceme, el retrato compartido inicio ↔ Conóceme, la visita guiada
de Servicios, los detalles de React Bits (foco de luz en tarjetas, títulos que se enfocan) y el
contenido de la web anterior (Dubái, extranjería, FAQ, despacho y equipo, testimonio).

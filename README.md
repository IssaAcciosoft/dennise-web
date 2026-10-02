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
src/
  pages/                    Una página por archivo (la URL sale del nombre)
    index.astro             Inicio
    conoceme.astro          Conóceme · Experiencia · Mi trayectoria · globo 3D
    servicios.astro         Asesorías · Programa Autogestiona · #reservar · visita guiada
    derechos-humanos.astro  Derechos humanos · Summit · cita · Mi compromiso · En medios
    empoderando-voces.astro Empoderando Voces + formulario «Cuéntame tu historia»
    contacto.astro          WhatsApp, teléfono, redes y formulario de contacto
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
    ui/                     Icon, Photo (imágenes optimizadas), SocialLinks
    home/ about/ services/ media/ contact/ ev/   Secciones de cada página
                            (about/Globe.tsx + globe-config.ts + GlobeSlot.astro: globo 3D;
                            services/ServicesTour.astro: botón «¿Te guío?»)
    forms/                  LeadForm, FormDialog, Field, ChoiceField (formularios de AccioGest)
    islands/                Islas de React (hooks.ts: reducir movimiento / pausar fuera de pantalla)
    react-bits/             Componentes copiados de React Bits (con su licencia): Aurora,
                            CircularGallery, Magnet
  data/
    site.ts                 Teléfono, WhatsApp, redes, navegación  ← ÚNICA fuente de verdad
    servicios.json          Catálogo de servicios y precios          ← precios aquí
    medios.ts               Artículo «8 de marzo — Voces que se unen» y su transcripción
    legal.ts                Textos de consentimiento (formularios = política de privacidad)
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
docs/                       Textos de la cliente (contenido.md) e integración con AccioGest
_originales/                Originales sin tocar: NO se publican (no están en src/ ni public/)
```

## Dónde se edita cada cosa

- **Precios y servicios:** `src/data/servicios.json`. Inicio y Servicios se generan desde aquí
  al compilar (no hay precios escritos a mano en las páginas). JSON-LD también.
- **Teléfono, WhatsApp y redes:** `src/data/site.ts` (si cambia el número, solo aquí).
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
| «Solicitar información» (diálogo en `/servicios/`: tarjetas, planes sin ID, «Solicitar cita») | `components/services/ServiceRequestDialog.astro` | `FORMS.servicio` |
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
  (440 ms, `ease-in-out`, con un leve desenfoque que disimula el fundido). Al llegar desde el
  inicio, la página marca el tipo `ev-morph` (evento `pagereveal`) y el inicio se queda un
  instante para que se vea crecer la tarjeta.
- **Retrato compartido inicio ↔ Conóceme** (`view-transition-name: portrait`, 420 ms,
  `ease-in-out`): la foto viaja y cambia de tamaño hasta su sitio en la otra página. El nombre
  lo pone un script diminuto de `BaseLayout` (`pageswap` / `pagereveal`) solo en la foto
  `.vt-portrait` que más se ve en pantalla en cada lado (el retrato del hero o la foto de la
  tarjeta «Conóceme» del inicio ↔ la foto de la cabecera de Conóceme) y solo entre esas dos
  páginas; si no se ve, transición normal. Si es la misma foto (tarjeta → Conóceme), fundido
  cruzado sincronizado (tipo `portrait-same`: parece una sola imagen); si son distintas, la
  anterior se desenfoca un poco mientras aparece la nueva.
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
  - **Aurora** (WebGL, ogl) tras la portada: `client:media="(min-width: 768px)"`, se crea en un
    momento ocioso y tras la transición, se pausa fuera de pantalla, 30 fps a media
    resolución; debajo, un póster CSS con el mismo ambiente (móvil, sin WebGL, movimiento
    reducido).
  - **CircularGallery** (WebGL, ogl) con las fotos de Nueva York: `client:visible`, sobre una
    lista estática accesible (texto alternativo, desplazable, enfocable) que es la galería sin
    JS / sin WebGL / con movimiento reducido. Botones anterior/siguiente y región `aria-live`.
    No se mueve sola (sin bucle en reposo) ni secuestra la rueda de la página.
  - **Magnet** en el gran botón «Cuéntame tu historia»: solo con ratón, desplazamiento ≤ 10 px.
- El gran botón y el de la portada abren el formulario de AccioGest (`StoryDialog`, sin cambios
  en su lógica); sin JavaScript, WhatsApp. `/empoderando-voces/#cuentame` lo abre directamente.

## Globo 3D (Conóceme, tras «Mi trayectoria»)

`src/components/about/GlobeSlot.astro` + isla `Globe.tsx` (cobe 2, WebGL, ~8 KB gzip con el
componente) + `globe-config.ts` (lugares, vista, colores y proyección compartidos).

- México (Ciudad de México), España (Madrid) y Nueva York en ciruela sobre un globo marfil y
  lavanda, unidos por dos arcos; etiquetas HTML que siguen a los puntos; pie
  «México · España · Nueva York».
- **Póster** (`src/assets/globe-poster.png`, AVIF/WebP diferido): el mismo globo renderizado
  con cobe y la misma vista (`npm run globe-poster`), así que al hidratar no hay salto. Es lo
  que se ve antes de hidratar, sin JavaScript, sin WebGL y con «reducir movimiento».
- Caja cuadrada reservada (sin CLS); `client:visible` con 240 px de margen; contexto WebGL en
  un momento ocioso; ≤ 2× de densidad; ~30 fps en reposo; se detiene fuera de pantalla y con
  la pestaña oculta. cobe reescribe una `<style>` en cada fotograma (para CSS Anchor
  Positioning, que no usamos): se retira del documento para no recalcular estilos.
- Movimiento: vaivén lento (±14°, 28 s) que mantiene los tres lugares a la vista; se puede
  girar arrastrando en horizontal (inercia con rozamiento) y vuelve solo a su vista; en táctil
  el gesto vertical sigue desplazando la página.
- Accesibilidad: la caja es `role="img"` con texto alternativo; lienzo y etiquetas, decorativos.
- Si cambias `globe-config.ts`, regenera el póster y revísalo.

## Visita guiada (`/servicios/`, «¿Te guío?»)

Botón discreto en la cabecera de Servicios (`ServicesTour.astro`). Nunca arranca sola; sin
JavaScript es un enlace a `#asesorias`. Al pulsarlo se descarga `src/scripts/tour.ts` con
driver.js y su CSS (≈ 11,5 KB gzip, todo en ese chunk diferido; se precarga al pasar el ratón o
enfocar el botón).

- Pasos, en el orden de la página: asesorías → online o presencial → orientación académica →
  Programa Autogestiona (trámites, planes, «¿Cómo funciona?», «Todos los planes incluyen») →
  Reserva tu asesoría → «¿Tienes dudas?» con el botón «Solicitar información» (abre el diálogo
  de solicitud con el evento `dg:service-request`).
- Textos solo con hechos de `docs/contenido.md` y de la página (precios desde
  `servicios.json`). Si cambian los pasos de «¿Cómo funciona?» (`Autogestiona.astro`),
  revisar el texto de ese paso en `tour.ts`.
- Teclado: el foco va a «Siguiente», Tab se queda en el paso, ← → navegan, Esc cierra y el foco
  vuelve a «¿Te guío?». Estilos de marca en `src/styles/tour.css` (tarjeta 200 ms `ease-out`
  desde 0,97 con origen en el lado del elemento; foco del escenario 300 ms; con «reducir
  movimiento», sin desplazamiento suave ni animación).

## Islas de React

- Hidratar **siempre** con `client:visible`, `client:idle` o `client:media` (nunca
  `client:load` salvo que sea imprescindible). Inicio: ≤ ~60 KB de JS (gzip) en la carga inicial.
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
| JS inicial en el inicio | ≤ ~60 KB gzip (hoy ~1,6 KB; Conóceme ~3,3 KB; Servicios ~9,7 KB) |

Cómo se consigue: CSS en línea (sin hojas que bloqueen el renderizado), tipografías
autoalojadas con precarga y *fallbacks* con métricas ajustadas (anchos de línea en `em`, nunca
en `ch`, que cambia al cargar la fuente), imágenes AVIF/WebP con
`srcset`, la imagen principal nunca oculta ni animada desde opacidad 0, apariciones al hacer
scroll que nunca tocan el contenido inicial (script de ~1 KB), WebGL solo diferido y cero
peticiones a terceros al cargar.

### Tipografías

`src/components/seo/Fonts.astro`: Cormorant Garamond (500, 600, cursiva 500/600), Barlow (400,
cursiva 400, 500, 600) y Barlow Condensed (500, sobre todo Empoderando Voces), subconjuntos
latin + latin-ext.
Cada página elige qué archivos precargar (`preloadFonts` en `BaseLayout`). Las familias
«Fallback» (Times New Roman / Arial ajustadas con `size-adjust` y `ascent/descent-override`)
evitan saltos al cambiar de fuente; valores calculados con `@capsizecss/unpack`.

## Publicación

**GitHub Pages** (incluido): `.github/workflows/deploy.yml` compila con `withastro/action` y
publica en cada push a `main` (o a mano desde Actions → «Run workflow»).

1. Settings → Pages → Source: **GitHub Actions**.
2. Settings → Secrets and variables → Actions → **Variables**:
   - `SITE_URL` = dominio definitivo, p. ej. `https://www.dominio.es` (**obligatorio**: canonical,
     Open Graph, JSON-LD, sitemap y robots.txt usan URLs absolutas). Mientras no exista se usa
     el marcador `https://denissegonzalez.example`.
   - `BASE_PATH` = solo si la web va en un subdirectorio (`/dennise-web` en
     `usuario.github.io/dennise-web` sin dominio propio).

**Otro alojamiento (Netlify, Vercel, servidor propio):** comando `npm run build`, carpeta
`dist/`, con las mismas variables de entorno.

`docs/` y `_originales/` no se publican: solo se publica `dist/`.

## Pendiente

De la cliente (ver `docs/contenido.md` §7):

1. Confirmar el teléfono (+34 670 647 593).
2. Qué diferencia los planes Básico, Estándar y Premium (hoy: «Todos los planes incluyen»).
3. Equipo de trabajo / socios, contenido de Dubái y de la web anterior (no se ha inventado nada).
4. Email de contacto y dirección de la oficina (asesorías presenciales).
5. Datos legales: titular, NIF, domicilio, colegio profesional y n.º de colegiada. Confirmar el
   uso del título «abogada» en España (requiere colegiación).
6. AccioGest: faltan los 3 `FORM_ID` de formularios, los 3 de planes y el `PLUGIN_ID` de
   reservas (README → AccioGest). Hasta entonces, modo simulado con aviso visible.
   Revisar las páginas legales (`[PENDIENTE]`), en especial las condiciones de contratación
   (borrador) y el proceso tras la compra de un plan.
7. Logotipo: el original dice «Gonzalez» sin tilde y así se ha reproducido; confirmar.
8. Confirmar si los precios de las asesorías (60/80 €, 30/50 €, 45/65 €) incluyen IVA. Hoy solo
   se indica «IVA incluido» en los planes.
9. Idiomas de atención y zona en la que presta servicio (JSON-LD `knowsLanguage`, `areaServed`).
10. Validar la transcripción del artículo «8 de marzo — Voces que se unen».
11. Dominio definitivo (`SITE_URL`).

Técnico: hecho el sistema de movimiento, el rediseño de Empoderando Voces y su transición desde
el inicio, el globo 3D de Conóceme, el retrato compartido inicio ↔ Conóceme, la visita guiada
de Servicios y los detalles de React Bits (foco de luz en tarjetas, títulos que se enfocan).

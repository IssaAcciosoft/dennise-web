# Avisos de terceros

Componentes y recursos de terceros incluidos en la web, con su licencia.

## Librerías

Todas llegan al navegador; sus licencias completas se publican con la web en `/licencias.txt`
(`src/pages/licencias.txt.ts`, enlazado desde el aviso legal §4), porque el minificador elimina
los comentarios de licencia del JavaScript.

| Librería | Uso | Licencia |
|---|---|---|
| `react`, `react-dom` (Meta Platforms, Inc. y afiliados) | Islas de React (Empoderando Voces) | MIT |
| `astro` (runtime de las islas) | Hidratación de las islas | MIT |
| `ogl` | WebGL de la aurora y la galería (Empoderando Voces) | The Unlicense (dominio público) |
| `cobe` (Shu Ding) | Globo 3D de Conóceme (`src/components/about/globe-mount.ts`) y su póster | MIT |
| `driver.js` (Kamran Ahmed) | Visita guiada de Servicios (`src/scripts/tour.ts`, carga diferida) | MIT |

## Marcas de terceros

| Elemento | Uso | Titular |
|---|---|---|
| Logotipo de Poplavsky International Offices (`src/assets/img/poplavsky-logo.jpg`, de la web anterior) | Bloque «Partner en Dubái» en /dubai/ y /conoceme/ | Su titular (pendiente de confirmar la autorización, `docs/contenido.md` §7) |

## Tipografías (autoalojadas con @fontsource)

| Familia | Paquete | Licencia |
|---|---|---|
| Cormorant Garamond | `@fontsource/cormorant-garamond` | SIL Open Font License 1.1 |
| Barlow | `@fontsource/barlow` | SIL Open Font License 1.1 |
| Barlow Condensed | `@fontsource/barlow-condensed` | SIL Open Font License 1.1 |

## React Bits (https://reactbits.dev · https://github.com/DavidHDev/react-bits)

Licencia MIT + Commons Clause: se pueden usar dentro de esta web, pero no revender los
componentes como tales. Cada archivo copiado conserva su cabecera de copyright/licencia.

| Componente | Categoría | Archivo en este repositorio |
|---|---|---|
| Aurora (adaptado: pausa fuera de pantalla, media resolución, 30 fps) | Backgrounds | `src/components/react-bits/Aurora/Aurora.tsx` |
| CircularGallery (adaptado: sin Google Fonts, sin secuestrar rueda/toques, sin bucle en reposo) | Components | `src/components/react-bits/CircularGallery/CircularGallery.tsx` |
| Magnet (adaptado: solo ratón, desplazamiento acotado, sin re-render por movimiento) | Animations | `src/components/react-bits/Magnet/Magnet.tsx` |
| SpotlightCard (adaptado sin React: capa propia movida con transform, solo ratón, sin «reducir movimiento») | Components | `src/scripts/spotlight.ts` + `src/styles/global.css` §6 |

Texto completo de la licencia: `src/components/react-bits/LICENSE.md`.

Al copiar un componente: mantener la cabecera de licencia en el archivo y añadir una fila aquí.

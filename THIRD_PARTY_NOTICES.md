# Avisos de terceros

Componentes y recursos de terceros incluidos en la web, con su licencia.

## Librerías

| Librería | Uso | Licencia |
|---|---|---|
| `ogl` | WebGL de la aurora y la galería (Empoderando Voces) | MIT |
| `cobe` (Shu Ding) | Globo 3D de Conóceme (`src/components/about/Globe.tsx`) y su póster | MIT |
| `driver.js` (Kamran Ahmed) | Visita guiada de Servicios (`src/scripts/tour.ts`, carga diferida) | MIT |

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

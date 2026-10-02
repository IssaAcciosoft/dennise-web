# Web de Denisse González · Abogada

Web estática (HTML + CSS + JavaScript, sin dependencias ni paso de compilación).

```
index.html                  Página principal (todas las secciones)
aviso-legal.html            Aviso legal (borrador)
politica-privacidad.html    Política de privacidad (borrador)
css/styles.css              Estilos (tokens de diseño en :root)
js/main.js                  Menú móvil, animaciones, formulario y visor de imagen
assets/logo/                Logotipo DG en SVG, favicon e iconos
assets/img/                 Fotografías optimizadas (.webp + .jpg) e imagen para redes (og-image.jpg)
docs/contenido.md           Textos y briefing de la cliente (fuente de verdad)
_originales/                Originales sin tocar: NO se enlazan desde la web
```

## Vista previa local

```bash
python3 -m http.server 8000
```

Abrir <http://localhost:8000>. (Abrir `index.html` con doble clic también funciona, pero conviene usar un servidor.)

## Formulario «Cuéntame tu historia»

Al principio de `js/main.js`:

```js
const STORY_FORM_ENDPOINT = '';            // URL del servicio de formularios
const WHATSAPP_NUMBER = '34670647593';     // sin «+» ni espacios
```

- **Vacío (por defecto):** al enviar, se redacta un mensaje con todos los campos y se abre
  WhatsApp (`wa.me`) en una pestaña nueva; el diálogo explica que la historia continúa allí.
- **Con un servicio de formularios (recomendado):** crear un formulario en
  [Formspree](https://formspree.io) (u otro compatible), copiar su URL
  (p. ej. `https://formspree.io/f/abcdwxyz`) y pegarla en `STORY_FORM_ENDPOINT`. El envío se
  hace con `fetch` (POST, `Accept: application/json`) y el diálogo muestra éxito o error
  (con opción de enviarlo por WhatsApp si falla). Campos enviados: `nombre`, `pais`, `tema`,
  `historia`, `compartir`, `anonimato`, `contacto`, `consentimiento`, `_subject` y el campo
  trampa anti-spam `_gotcha`.

## Enlaces de WhatsApp

Todos los botones abren `https://wa.me/34670647593?text=...` con un mensaje distinto para cada
servicio o plan. El texto va codificado para URL (por ejemplo con `encodeURIComponent` en la
consola del navegador). Si cambia el número:

1. Buscar y reemplazar `34670647593` en los `.html` y en `js/main.js` (enlaces `wa.me` y `tel:`,
   JSON-LD y `WHATSAPP_NUMBER`).
2. Buscar también el número formateado para lectura, que no contiene esa cadena:
   `670&nbsp;647&nbsp;593` (en `index.html`, `aviso-legal.html` y `politica-privacidad.html`) y
   `670 647 593` (en `politica-privacidad.html`).

## Publicación

**GitHub Pages:** Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/ (root)`.

**Netlify:** *Add new site* → importar el repositorio (sin comando de build, directorio de
publicación `/`), o arrastrar la carpeta al panel de Netlify.

Antes de publicar:

1. **Excluir `_originales/`** (y `docs/`): en GitHub Pages y Netlify todo lo que esté en el
   repositorio se publica. Moverlos fuera del repositorio o a otra rama.
2. Con el dominio definitivo (p. ej. `https://DOMINIO/`), en `index.html`:
   - cambiar a URL absoluta `og:image` / `twitter:image` (WhatsApp y las redes no muestran la
     imagen de vista previa con rutas relativas) y las rutas `image` y `logo` del JSON-LD;
   - añadir `<meta property="og:url" content="https://DOMINIO/">`, la propiedad
     `"url": "https://DOMINIO/"` en el JSON-LD y `<link rel="canonical" href="https://DOMINIO/">`.
3. Completar los datos `[PENDIENTE: …]` de las páginas legales.

## Pendiente de la cliente

1. Confirmar el teléfono (+34 670 647 593).
2. Qué diferencia los planes Básico, Estándar y Premium (hoy se muestra una lista común:
   «Todos los planes incluyen»).
3. Equipo de trabajo / socios, contenido de Dubái y de la web anterior (no se ha inventado nada).
4. Email de contacto y dirección de la oficina (asesorías presenciales).
5. Datos legales: titular, NIF, domicilio, colegio profesional y n.º de colegiada. Confirmar el
   uso del título «abogada» en España (requiere colegiación).
6. Servicio de formularios (p. ej. Formspree) para recibir las historias por email.
7. Logotipo: el original dice «Gonzalez» sin tilde y así se ha reproducido; confirmar si se
   prefiere «González».
8. Valorar alojar las tipografías en el propio servidor en lugar de Google Fonts (privacidad/RGPD).
9. Confirmar si los precios de las asesorías (60/80 €, 30/50 €, 45/65 €) incluyen IVA. Cuando lo
   confirme, añadir «IVA incluido» bajo «Asesorías» y quitar la salvedad del aviso legal.
10. Idiomas de atención (¿también inglés?) y zona en la que presta servicio, para añadirlos a los
    datos estructurados (JSON-LD: `knowsLanguage`, `areaServed`). Hoy no se indican.
11. Validar la transcripción del artículo «8 de marzo — Voces que se unen» (sección En medios),
    copiada literalmente del cartel publicado.

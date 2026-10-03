# Redes sociales de Denisse González — extracción de información pública

Extraído el 03/10/2026, solo de datos públicos (sin iniciar sesión), con curl, Playwright/Chromium y yt-dlp.
Pocas peticiones, sin credenciales. Las fechas de Instagram se calculan a partir del identificador de cada
publicación (son exactas al día). Las de TikTok son la marca de publicación (UTC).

> **Cómo leer este documento:** las secciones 1 a 4 son **hechos verificados** (copiados tal cual de las
> redes o de prensa). La sección 6 son **sugerencias** para la web, y van marcadas como tales.

## Resumen por red

| Red | Cuenta | Qué se obtuvo | Limitaciones |
|---|---|---|---|
| TikTok | [@lic.denissegb](https://www.tiktok.com/@lic.denissegb) | Bio, estadísticas, **80 vídeos más recientes** (14/02 a 27/09/2026) con fecha, texto completo, reproducciones y portada; 8 vídeos descargados para sacar fotogramas | La web bloquea el listado en el navegador headless; se obtuvo con yt-dlp. Vídeos solo en 480p, así que los fotogramas tienen poca resolución |
| Instagram | [@lic.denisseg](https://www.instagram.com/lic.denisseg/) | Bio, enlaces de la bio, página de Facebook vinculada, **12 publicaciones más recientes** (15/08 a 30/09/2026) con texto e imágenes de 1080 a 1600 px | La API pública responde 401 "require_login" (límite por IP). Sin sesión solo se ven las 12 primeras publicaciones. 9 de las 12 no muestran texto en la incrustación pública |
| Facebook | [Denisse Gonzalez International Legal Consulting](https://www.facebook.com/p/Denisse-Gonzalez-International-Legal-Consulting-100068039383642/) (el enlace `share/1GQdBrwuAy` redirige a `profile.php?id=100068039383642`) | Ficha completa (categoría, dirección, teléfono, email, enlaces, seguidores), **6 publicaciones recientes** (vía el plugin público de página), foto de perfil 681 px y portada | El muro completo exige iniciar sesión. Solo se ven las publicaciones del plugin, sin fecha exacta para las más antiguas |

## 1. Bios y datos de perfil (literales)

### TikTok — @lic.denissegb
- Nombre: **Denisse González | Consultora**
- Bio: **"Directora Ejecutiva de Jóvenes por los Derechos Humanos en España"**
- 2.095 seguidores · 472 seguidos · 7.514 me gusta · **252 vídeos** · cuenta creada en marzo de 2020 · idioma: es
- Foto de perfil: en el despacho, con traje morado, ventanal sobre Madrid y banderas de México y España (la misma foto que en Facebook).

### Instagram — @lic.denisseg
- Nombre: **Denisse Gonzalez| international legal consulting**
- Bio: **"Consultora internacional y Directora Ejecutiva de Jóvenes  por los Derechos Humanos en España"**
- 769 seguidores · 217 seguidos (222 en la meta descripción) · **534 publicaciones**
- Enlaces de la bio:
  - "TikTok" → `https://www.tiktok.com/@lic.denisseg?_t=ZM-8vj8MaFLDuh&_r=1`. **Ojo:** apunta a `@lic.denisseg`, pero la cuenta de TikTok real es `@lic.denissegb`. El enlace podría estar roto.
  - "Pag web" → `https://denisseg.odoo.com/` (la web anterior)
  - WhatsApp → `https://wa.me/34670647593`
  - Página de Facebook vinculada: "Denisse Gonzalez International Legal Consulting" (id 107778314817072)

### Facebook — Denisse Gonzalez International Legal Consulting
- 5.817 seguidores · 45 seguidos · Página · categoría **Asesoría**
- Intro: "Pag web https://denisseg.odoo.com/"
- Dirección: **Calle Eraso 31,A, Madrid, Spain**
- Teléfono: +34 670 64 75 93 · Email: **lic.denissegb@icloud.com**
- Enlaces: https://www.tiktok.com/@lic.denissegb · instagram.com/lic.denisseg
- Horario: "Siempre abierto" · "Todavía sin calificar (3 opiniones)"
- Comentario público en la última publicación: *"Muchas felicidades mija que sigan tus exitos"* (de Cuquis Barbosa Herrera, familiar por el apellido).

## 2. Publicaciones de Facebook visibles (plugin público, texto literal)

Las fechas relativas se cuentan desde el 03/10/2026.

1. **hace 2 días (≈30/09/2026)**: el mismo texto que el post de Instagram del Franchise Innovation Summit ("Conecta. Inspira. Crece. ✨ …", ver Instagram n.º 1). 14 reacciones, 10 comentarios, 2 compartidos.
2. **hace 5 días (≈27/09/2026)**: vídeo de 0:54 "✨ UN DÍA. TRES ESCENARIOS. UNA MISMA VISIÓN. 🌎 …" (el mismo texto que Instagram n.º 2 y TikTok n.º 1).
3. **10 sep**: "No solo somos extranjería. Somos humanidad! Por que mi prioridad siempre es tu bienestar ❤️"
4. **6 sep** (publicado desde su perfil personal "Denisse Gonzalez"): "Aún puedes denunciar denunciar contáctame 6181315456". Lleva la captura de un artículo de **Tiptip MX (26/08/2021)**: "Más de 3.000 personas de todo el mundo demandaron a China y la OMS por la pandemia de COVID-19", con una foto de Denisse en un despacho (ver imagen `en-medios-tiptip-mx-2021-captura-fb.jpg`).
5. **27 ago**: vídeo de 0:38 sin texto (el mismo que el reel de Instagram del 27/08, bandera de España "CAMBIARáN").
6. **26 ago**: vídeo de 0:28 sin texto (ferry, Estambul o similar).

Otro enlace de Facebook citado por ella en TikTok (el artículo del 8M): https://www.facebook.com/share/p/1EPK1z6scS/

## 3. Prensa: "En medios" (verificado en la web de cada medio)

Caso de la demanda internacional contra China y la OMS por la COVID-19, cuando era representante en México de Poplavsky International Law Offices:

- **Expansión (México), 31/12/2021**, nota de la agencia **AFP**: "Mexicanos reclaman a China y la OMS indemnizaciones millonarias por el COVID". Cita literal: *"Estos reclamos se presentan por la negligencia que hubo tanto de China como de la OMS en el manejo del COVID-19", dice a la AFP la abogada Denisse González, representante en México de Poplavsky.* https://expansion.mx/mundo/2021/12/31/mexicanos-reclaman-china-oms-indemnizacion-millonaria-covid
- **SDP Noticias, 29/12/2021**: "Mexicanos afectados por Covid-19 buscan indemnizaciones de China y la OMS". *"Deniss González, representante del despacho en México, aseguró que la demanda se presenta por la negligencia de China y la OMS en el manejo del Covid-19."* https://www.sdpnoticias.com/internacional/mexicanos-afectados-por-covid-19-buscan-indemnizaciones-de-china-y-la-oms/
- **Economis (Argentina), 2021**: "Más de 3.000 personas de todo el mundo demandaron a China y la OMS por la pandemia de COVID-19". Cita a Denisse Elena González Barbosa (sede mexicana de Poplavsky). https://economis.com.ar/mas-de-3-000-personas-de-todo-el-mundo-demandaron-a-china-y-la-oms-por-la-pandemia-de-covid-19/
- **Tiptip MX, 26/08/2021**: el mismo titular. Solo se ha visto la captura que compartió en Facebook; la URL no está verificada.
- La misma nota de AFP aparece, sin revisar si la nombran, en El CEO (https://elceo.com/internacional/mexicanos-reclaman-a-china-y-a-la-oms-indemnizaciones-por-covid-19/), La Patilla (29/12/2021) y Noticias RCN (Colombia).
- **Revista *Construyendo un Mundo Mejor*, 8M 2026**: su artículo "8 de marzo — Voces que se unen…" (ya está en `contenido.md`). Lo confirma su TikTok del 01/04/2026.

## 4. Eventos y actividades documentados (hechos, según sus publicaciones)

| Fecha | Evento | Lugar | Su papel | Fuente |
|---|---|---|---|---|
| 22/02/2026 (domingo, 16:30) | **"Migrar con Derechos — Tu dignidad y tu trabajo no tienen fronteras"**, encuentro informativo, entrada libre | C/ Santa Catalina 7, Madrid (metro Antón Martín o Sevilla) | Ponente: "Denisse González – Consultora Internacional experta en Extranjería", junto a Mónica Muñoz (Directora de Programas, Fundación Mejora) y Juan Antonio Martínez (Secretario de Actividades de JDH España). Organizan: Fundación para la Mejora de la Vida, la Cultura y la Sociedad; Juventud por los Derechos Humanos España; Peruanos en el Exterior España; Comité Cívico Ecuatoriano en España | TikTok 21/02/2026 (n.º 75, 76, 79) |
| 05/03/2026 | LIVE en TikTok "Derechos Humanos y Migración" (regularización en España) | Online | Presentadora | TikTok n.º 62 |
| 08/03/2026 (domingo, 16:30) | **"Migrar con Derechos — Día de la Mujer Trabajadora"**, conferencia del 8M | C/ Santa Catalina 7, Madrid | Ponente en atril; entrevistas a asistentes ("Entrevista del evento") | TikTok 08–14/03/2026 (n.º 49, 51, 52, 56, 58, 59; cartel en n.º 62) |
| Marzo de 2026 (viernes) | "Conoce tus derechos con Denisse González", charlas de los viernes | C/ Santa Catalina 7, Madrid | Imparte la charla, como "Directora Ejecutiva de Jóvenes por los Derechos Humanos España" | TikTok 19/03; carrusel de Instagram de agosto |
| Marzo de 2026 | Artículo del 8M en la revista *Construyendo un Mundo Mejor* | — | Autora | TikTok 01/04/2026 |
| Febrero–abril de 2026 | Reparto de folletos en la calle y campaña "Conoce tus derechos" (camiseta "United for Human Rights", gorra) | Calles y parques de Madrid | Voluntaria y líder de campaña | TikTok n.º 65, 67, 70; fotogramas |
| Feb–abr de 2026 | Serie educativa **"Derechos Humanos y Migración"**: un artículo de la Declaración Universal por vídeo (art. 1 a 21) | — | Divulgadora | TikTok, unos 40 vídeos |
| 14–30/04/2026 | Campaña sobre la **regularización extraordinaria** (análisis del BOE, avisos contra cobros abusivos y contra "informes de vulnerabilidad" de pago, llamada gratuita) | — | Asesora | TikTok n.º 17–32 |
| 30–31/07/2026 | 20th International Human Rights Summit, Naciones Unidas, Nueva York ("En Nueva York representando a España como Delegada de jóvenes por los Derechos Humanos") | Nueva York | Delegada | TikTok 09/08/2026 (ya en `contenido.md`) |
| Julio de 2026 | Campaña **"Estudia en España"** (FP para quien solo tiene bachillerato, mitos, errores) con el logo DG "Formación Internacional" | — | Asesora | TikTok 10–23/07/2026 |
| Agosto de 2026 | Carruseles educativos en Instagram: convenciones de la ONU (CEDAW 1979, Derechos del Niño 1989, Discriminación Racial 1965, Discapacidad 2006), línea del tiempo de los DDHH en España y el mundo, DUDH de 1948 | — | Divulgadora | Instagram 15–22/08 |
| Agosto de 2026 | Piezas de marca DG: **"Guía básica para regularizarte en España"** y "El comienzo depende de ti — España te está esperando — Servicio de extranjería" | — | — | Instagram 22 y 25/08 |
| ≈16/09/2026 | **I Encuentro Internacional de Literatura, Arte y Poesía** (agradece a "Fundacion Mariposa") | Madrid | Ponente: reflexión sobre la cultura y el arte como vía hacia los DDHH | TikTok 17/09/2026 |
| 26/09/2026 | Un día con tres eventos: cultura mexicana (**Piña Agavera**), concierto de **El Recodo** y la **Embassy Cup** (torneo deportivo entre embajadas) | Madrid | Asistente y representación | IG, FB y TikTok 27/09 |
| 30/09/2026 | **Franchise Innovation Summit** (FIS), con BBVA y Show2BE entre los patrocinadores del photocall | Madrid | Asistente con acreditación | IG y FB 30/09 |

**Dato sensible (hecho, no valoración):** la sala de la conferencia del 8M y del I Encuentro (C/ Santa Catalina 7, Madrid) es la **Iglesia de Cienciología de Madrid**. Se ve el mosaico "Iglesia de Scientology" en el suelo, la cruz de ocho puntas en el atril y el emblema detrás. Youth for Human Rights International y United for Human Rights son campañas que la Iglesia de Cienciología patrocina. Conviene que la clienta lo sepa antes de elegir fotos (las de esa sala muestran los emblemas) y que decida cómo presenta estas asociaciones en la web.

**Otra marca que aparece:** en abril de 2026, los vídeos sobre la regularización extraordinaria llevan el logo de **"SANDIN & Asociados"** ("Calle Mayor 6, Piso 2 oficina 10", "Asesoría gratuita", WhatsApp 670 647 593, que es su número). Parece que colaboró con ese despacho o asesoró bajo esa marca. Hay que confirmarlo con ella antes de mencionarlo.

## 5. Temas recurrentes (síntesis)

1. **Derechos humanos y migración** (el tema principal): la serie de artículos de la DUDH aplicada a la vida del migrante, "Conoce tus derechos", "Yo también soy migrante", la dignidad, la empatía y la violencia que no deja marcas.
2. **Extranjería y regularización en España**: la regularización extraordinaria y el BOE, la advertencia contra estafas y cobros abusivos, el informe de vulnerabilidad, demostrar 2 años en España, el asilo y la protección internacional ("si tienes miedo de volver a tu país"). Su mensaje: *"No cobramos por información que aún no es oficial. No trabajamos con rumores."*
3. **Estudiar en España**: FP con alta demanda laboral para quien solo tiene bachillerato.
4. **Jóvenes por los Derechos Humanos / Youth for Human Rights**: es Directora Ejecutiva en España y fue delegada en el Summit de Nueva York.
5. **Empoderando Voces / "Empoderando tu voz"**: historias reales y la llamada "Si tienes una historia que contar escríbeme" (TikTok 09/09/2026). Lema: *"Empoderando Voces. Afirmando la Dignidad. Construyendo conexiones."*
6. **Red internacional México–España**: Embassy Cup, cultura mexicana, Franchise Innovation Summit y "negocios internacionales y movilidad internacional".
7. **Su identidad**: *"Para mí ser abogada mexicana, migrante y hoy consultora significa no solo ver clientes ver humanos que han sufrido ponerme en los zapatos de la otra p[ersona]…"* (TikTok 15/03/2026) y *"En el despacho no vemos números. Vemos madres con miedo. Jóvenes que no saben si podrá[n]…"* (TikTok 02/03/2026).

## 6. Sugerencias para la web (no son hechos: hay que validarlas con la clienta)

- **"En medios"**: añadir la nota de AFP en Expansión (31/12/2021), SDP Noticias (29/12/2021) y Economis/Tiptip MX (2021) sobre la demanda internacional contra China y la OMS, con el texto "Citada como representante en México de Poplavsky International Law Offices". Sumarlas al artículo del 8M en *Construyendo un Mundo Mejor*. Es su presencia en prensa más sólida.
- **"Conferencias y eventos"** (cronología): Migrar con Derechos (22/02/2026), la conferencia del 8M (08/03/2026), las charlas "Conoce tus derechos" de los viernes, el Summit de la ONU en Nueva York (30–31/07/2026), el I Encuentro Internacional de Literatura, Arte y Poesía (sep. 2026), Embassy Cup y Franchise Innovation Summit (sep. 2026). Antes, revisar la cuestión de la sede (sección 4).
- **Empoderando Voces**: usar como texto de apoyo la frase de su TikTok del 09/09: *"Conoce tus derechos. Hazte escuchar. Defiende tu dignidad."* y *"una voz puede convertirse en conciencia y la conciencia puede convertirse en acción"* (TikTok 17/09). En la galería: el reparto de folletos en la calle, el collage de la campaña, el retrato sonriente con camiseta de DDHH y Nueva York.
- **Sección de recursos o blog**: aprovechar las series que ya tiene hechas:
  - "Derechos Humanos y Migración" (un artículo de la DUDH por entrada).
  - Las convenciones de la ONU, con sus infografías de Instagram.
  - "Regularización extraordinaria: lo que debes saber / cómo evitar estafas".
  - "Estudiar en España con bachillerato".
  - "Guía básica para regularizarte en España". Podría ser un lead magnet descargable si existe el PDF; hay que preguntárselo.
- **Mensajes de confianza** para la página de servicios, que ella repite a menudo: "Sin presión, sin exageración", "No cobramos por información que aún no es oficial", "llamada gratuita para que no pagues si no aplicas" y "No solo somos extranjería. Somos humanidad".
- **Enlaces sociales del pie**: Instagram `lic.denisseg`, TikTok `lic.denissegb` y Facebook `100068039383642`. Avisarle de que el enlace de TikTok en su bio de Instagram apunta a `@lic.denisseg` (sin "b").
- **Datos de contacto coherentes**: el email público de Facebook es lic.denissegb@icloud.com. Comprobar si quiere ese u otro en la web. La dirección C/ Eraso 31 A ya coincide con `contenido.md`.
- **Testimonios**: no hay testimonios de clientes en lo visible. Facebook dice "3 opiniones", pero no se pueden leer sin iniciar sesión. Habría que pedírselos a ella.
- **Fotos**: la mejor foto nueva en alta resolución es la del **Franchise Innovation Summit** (1600×1200, traje burdeos, cuerpo entero). El retrato del despacho con banderas solo llega a 681 px en redes, así que hay que pedirle el original. Muchas portadas de TikTok son **ilustraciones generadas con IA** (la serie de artículos de la DUDH, las campañas de estudiar en España y "No todo se sana"): no deben usarse como fotos reales.

## 7. Imágenes descargadas (`_originales/redes/`)

Todas están a la máxima resolución que ofrece cada red sin iniciar sesión. Los enlaces CDN de Meta y TikTok van firmados y caducan, así que se cita la publicación de origen. Las marcadas como *(IA)* o *(cartel)* no son fotos reales.

| Archivo | px | Qué muestra | Origen |
|---|---|---|---|
| `franchise-innovation-summit-photocall-2026-09-30.jpg` | 1600×1200 | **La mejor foto nueva.** Denisse de cuerpo entero, traje burdeos y acreditación, sobre el escenario ante el photocall "FIS Franchise Innovation Summit · Conecta. Inspira. Crece." | https://www.instagram.com/p/Dd6zMq8zy00/ |
| `retrato-despacho-banderas-mx-es-fb.jpg` | 681×680 | Retrato sentada en el despacho, traje morado, ventanal sobre Madrid y banderas de México, Madrid y España. Es la foto de perfil de FB y TikTok; conviene pedir el original | Foto de perfil de Facebook (página 100068039383642) |
| `retrato-sonriendo-camiseta-ddhh-tt.jpg` | 540×900 | Retrato sonriente, camiseta azul "United for Human Rights" y carpeta. Muy cálido; ideal para Empoderando Voces (resolución baja) | Portada de https://www.tiktok.com/@lic.denissegb/video/7612973680179662088 |
| `calle-madrid-folleto-ddhh-ig.jpg` | 1024×1024 | En una calle de Madrid, con gorra y camiseta azul de DDHH, mostrando un folleto. Infografía "Revolución de los Derechos Universales – 1948 París" superpuesta (logos de Youth for Human Rights y Mejora) | https://www.instagram.com/p/DcEtOOxmoas/ |
| `encuentro-literatura-arte-poesia-atril-2026-09.jpg` | 986×540 | En el atril con micrófono, chaqueta negra y camiseta azul, sosteniendo un folleto; roll-up de la "Fundación para la Mejora… Juntos somos +". Detrás se ve el emblema de la sede | Portada de https://www.tiktok.com/@lic.denissegb/video/7686456769115147527 |
| `ponencia-8m-2026-atril-tt.jpg` | 540×1080 | Conferencia del 8M: Denisse en el atril. Rótulo "8 DE MARZO DÍA DE LA MUJER"; en el suelo se lee el mosaico "Iglesia de Scientology" | Portada de https://www.tiktok.com/@lic.denissegb/video/7617221872765242632 |
| `ponencia-8m-2026-plano-general-fotograma.jpg` | 576×1152 | Fotograma de la misma ponencia: plano general de la sala con el atril y un busto | Fotograma del mismo vídeo |
| `calle-reparto-folletos-ddhh-fotograma.jpg` | 480×848 | Fotograma: con gorra y camiseta azules, repartiendo folletos a una persona en una calle comercial de Madrid ("REPARTIMOS") | Fotograma de https://www.tiktok.com/@lic.denissegb/video/7613496454086200583 |
| `collage-campana-calle-ddhh-tt.jpg` | 540×954 | Collage de la campaña en la calle (voluntarios de azul, parques y calles) con el texto "Hablar de derechos humanos es fácil, lo difícil es hacer algo al respecto" | Portada de https://www.tiktok.com/@lic.denissegb/video/7613496454086200583 |
| `collage-nueva-york-summit-2026-tt.jpg` | 540×986 | Collage de Nueva York: la ONU, la Estatua de la Libertad, el kit de delegada y el logo DG | Portada de https://www.tiktok.com/@lic.denissegb/video/7671974891561684242 |
| `collage-embassy-cup-el-recodo-2026-09.jpg` | 540×720 | Marco de polaroid "increíble día con México": Denisse con dos hombres (uno con sombrero, contexto de El Recodo y Piña Agavera) | Portada de https://www.tiktok.com/@lic.denissegb/video/7690270989933956360 |
| `cartel-migrar-con-derechos-2026-02-22.jpg` | 540×764 | *(cartel)* "MIGRAR CON DERECHOS – Tu dignidad y tu trabajo no tienen fronteras – Santa Catalina 7 – Domingo 22 de febrero de 2026 16:30", con su foto y la de los otros ponentes y los logos de Mejora, Peruanos en el Exterior y CCEE | Portada de https://www.tiktok.com/@lic.denissegb/video/7609457677504236818 |
| `cartel-migrar-con-derechos-8m-2026.jpg` | 1440×2034 | *(cartel)* "MIGRAR CON DERECHOS – Día de la Mujer Trabajadora – Domingo 8 de marzo 2026 16:30 – Consigue una asesoría gratuita" | Portada de https://www.tiktok.com/@lic.denissegb/video/7613853809487629576 |
| `cartel-conoce-tus-derechos-santa-catalina.jpg` | 1080×1350 | *(cartel)* "CONOCE TUS DERECHOS con Denisse González – Directora Ejecutiva de Jóvenes por los Derechos Humanos España – Conócenos todos los viernes en Calle Santa Catalina 7 Madrid", con foto suya de gorra y camiseta | Carrusel https://www.instagram.com/p/DcKvM6XlbEb/ |
| `cartel-conoce-tus-derechos-voluntarios-tt.jpg` | 540×954 | *(cartel)* "Conoce tus derechos – Infórmate y difunde": voluntarios de azul con folletos en un stand | Portada de https://www.tiktok.com/@lic.denissegb/video/7612419197649292552 |
| `articulo-8m-construyendo-un-mundo-mejor-tt.jpg` | 1414×2000 | Página de su artículo del 8M en *Construyendo un Mundo Mejor*, con su foto ("Denisse González Barbosa, México, Abogada") | Portada de https://www.tiktok.com/@lic.denissegb/video/7623838275249245447 |
| `en-medios-tiptip-mx-2021-captura-fb.jpg` | 526×905 | Captura del artículo de Tiptip MX (26/08/2021) "Más de 3.000 personas… demandaron a China y la OMS…", con foto de Denisse en el despacho | Publicación de FB del 6 sep (perfil personal), vista en el plugin de la página |
| `infografia-linea-tiempo-ddhh.jpg` | 1152×1440 | *(infografía)* "Línea del tiempo de los Derechos Humanos – España y el mundo" (1948–2006), firmada "Con Denisse González" | Carrusel https://www.instagram.com/p/DcTnA6HjVtm/ |
| `portada-guia-regularizarte-espana-ig.jpg` | 720×1280 | *(pieza de marca)* Portada de la "Guía básica para regularizarte en España": Denisse con abrigo granate ante la Sagrada Familia (posible montaje) | https://www.instagram.com/p/DceQSu6EX74/ |
| `anuncio-espana-te-esta-esperando-ig.jpg` | 940×788 | *(pieza de marca)* "El comienzo depende de ti – España te está esperando – Servicio de extranjería", logo DG y teléfono | https://www.instagram.com/p/DcWL0zRDdqi/ |
| `logo-dg-portada-fb.jpg` | 843×843 | Logo DG morado con balanza y el texto "Denisse Gonzalez" (portada de FB) | Portada de la página de Facebook |

Ya estaban en `_originales/` y no se han duplicado: Nueva York/ONU, el kit de delegada, el cartel del 8M y similares (ver `contenido.md`). Las portadas de TikTok de la serie de artículos de la DUDH, de "Estudia en España" y de "No todo se sana" son ilustraciones generadas con IA y no se han copiado.

---

## Anexo A. Instagram: 12 publicaciones más recientes (texto literal)

1. **2026-09-30** · Imagen · https://www.instagram.com/p/Dd6zMq8zy00/
   > Conecta. Inspira. Crece. ✨
   >
   > Hoy tuve la oportunidad de participar en el Franchise Innovation Summit, un espacio que reúne innovación, emprendimiento, negocios y grandes oportunidades de conexión.
   >
   > Estos encuentros me recuerdan que detrás de cada proyecto hay personas, ideas y alianzas capaces de abrir nuevas posibilidades. 🌎
   >
   > Como profesional dedicada al derecho, los negocios internacionales y la movilidad internacional, sigo apostando por crear conexiones que trasciendan fronteras y convertirlas en proyectos con impacto.
   >
   > Gracias por la oportunidad de seguir aprendiendo, conectando y creciendo. 🤝
   >
   > Seguimos construyendo. 🚀
   >
   > #FranchiseInnovationSummit #Networking #Innovación #Emprendimiento #Negocios Internacionalización Business NetworkingMadrid Madrid InternationalBusiness

2. **2026-09-27** · Vídeo/Reel · https://www.instagram.com/p/DdzJ9dugE_Q/
   > ✨ UN DÍA. TRES ESCENARIOS. UNA MISMA VISIÓN. 🌎
   >
   > Ayer fue uno de esos días que te recuerdan que las oportunidades aparecen cuando decides estar presente.
   >
   > Madrid se convirtió, en un mismo día, en un punto de encuentro entre cultura, deporte, comunidad y relaciones internacionales.
   >
   > 🇲🇽 La cultura mexicana, presente a través de Piña Agavera y una celebración que nos recuerda que nuestras raíces también cruzan fronteras.
   >
   > 🎶 La música, con El Recodo, demostrando una vez más que la cultura tiene la capacidad de reunir a personas de diferentes lugares alrededor de una misma identidad.
   >
   > 🏆 El deporte y la representación internacional, en la Embassy Cup, donde diferentes países, instituciones y organizaciones encontraron un espacio para compartir, conectar y generar nuevas relaciones.
   >
   > Tres experiencias completamente diferentes, pero con algo en común:
   >
   > las personas que conoces, las conversaciones que tienes y los espacios en los que decides estar pueden abrir puertas que todavía no sabes que existen.
   >
   > Para quienes trabajamos en proyectos internacionales, la presencia también es parte del trabajo.
   >
   > Estar.
   > Escuchar.
   > Conectar.
   > Representar.
   > Crear.
   >
   > Ayer no fue simplemente un día de eventos.
   >
   > Fue un día para celebrar nuestra cultura, ampliar nuestra red y seguir construyendo puentes entre México, España y el mundo. 🌎🇲🇽🇪🇸
   >
   > Y esto apenas comienza.
   >
   > Empoderando Voces. Afirmando la Dignidad. Construyendo conexiones.
   >
   > #Madrid #MéxicoEnEspaña #México #España #InternationalRelations

3. **2026-08-27** · Vídeo/Reel · https://www.instagram.com/p/Dcj9gAIAtyG/
   > *(sin texto visible en la incrustación pública)*

4. **2026-08-26** · Vídeo/Reel · https://www.instagram.com/p/DcfIb5rEoIg/
   > *(sin texto visible en la incrustación pública)*

5. **2026-08-25** · Vídeo/Reel · https://www.instagram.com/p/DceQSu6EX74/
   > *(sin texto visible en la incrustación pública)*

6. **2026-08-22** · Imagen · https://www.instagram.com/p/DcWL0zRDdqi/
   > *(sin texto visible en la incrustación pública)*

7. **2026-08-21** · Carrusel · https://www.instagram.com/p/DcTnA6HjVtm/
   > *(sin texto visible en la incrustación pública)*

8. **2026-08-20** · Carrusel · https://www.instagram.com/p/DcRCOjPASqu/
   > *(sin texto visible en la incrustación pública)*

9. **2026-08-19** · Carrusel · https://www.instagram.com/p/DcOdb6KCaMB/
   > *(sin texto visible en la incrustación pública)*

10. **2026-08-18** · Carrusel · https://www.instagram.com/p/DcL4pX4DhFR/
   > *(sin texto visible en la incrustación pública)*

11. **2026-08-18** · Carrusel · https://www.instagram.com/p/DcKvM6XlbEb/
   > *(sin texto visible en la incrustación pública)*

12. **2026-08-15** · Imagen · https://www.instagram.com/p/DcEtOOxmoas/
   > los Derechos Humanos, 
   > recordamos el hito histórico de 1948 en París, donde se adoptó la Declaración Universal de Derechos Humanos. 
   >
   > Esta convención estableció estándares globales para la dignidad y los derechos fundamentales de TODAS las personas, sin distinción.

## Anexo B. TikTok: 80 vídeos más recientes (texto literal, del más nuevo al más antiguo)

1. **2026-09-27** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7690270989933956360) · 2724 repr. · 54 s  
   > ✨ UN DÍA. TRES ESCENARIOS. UNA MISMA VISIÓN. 🌎 Ayer fue uno de esos días que te recuerdan que las oportunidades aparecen cuando decides estar presente. Madrid se convirtió, en un mismo día, en un punto de encuentro entre cultura, deporte, comunidad y relaciones internacionales. 🇲🇽 La cultura mexicana, presente a través de Piña Agavera y una celebración que nos recuerda que nuestras raíces también cruzan fronteras. 🎶 La música, con El Recodo, demostrando una vez más que la cultura tiene la capacidad de reunir a personas de diferentes lugares alrededor de una misma identidad. 🏆 El deporte y la representación internacional, en la Embassy Cup, donde diferentes países, instituciones y organizaciones encontraron un espacio para compartir, conectar y generar nuevas relaciones. Tres experiencias completamente diferentes, pero con algo en común: las personas que conoces, las conversaciones que tienes y los espacios en los que decides estar pueden abrir puertas que todavía no sabes que existen. Para quienes trabajamos en proyectos internacionales, la presencia también es parte del trabajo. Estar. Escuchar. Conectar. Representar. Crear. Ayer no fue simplemente un día de eventos. Fue un día para celebrar nuestra cultura, ampliar nuestra red y seguir construyendo puentes entre México, España y el mundo. 🌎🇲🇽🇪🇸 Y esto apenas comienza. Empoderando Voces. Afirmando la Dignidad. Construyendo conexiones. #Madrid #MéxicoEnEspaña #México #España #InternationalRelations @elrecododecruzlizarraga

2. **2026-09-17** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7686618973198142727) · 308 repr. · 58 s  
   > Empodera tu vos

3. **2026-09-17** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7686456769115147527) · 257 repr. · 317 s  
   > Hablar de Derechos Humanos también es hablar de historias, de voces y de personas. 🤍 Tuve el honor de participar en el I Encuentro Internacional de Literatura, Arte y Poesía, un espacio que me permitió compartir una reflexión sobre la importancia de utilizar la cultura, el arte y la palabra como herramientas para acercarnos a los Derechos Humanos. Porque detrás de cada derecho existe una persona, una historia y una voz que merece ser escuchada. Quiero agradecer profundamente a Fundacion Mariposa, a los organizadores y a todas las personas que hicieron posible este encuentro por abrir este espacio de diálogo, cultura y reflexión. También quiero invitarles a conocer y formar parte de nuestra campaña de Derechos Humanos, un proyecto que busca acercar los derechos a las personas, generar conciencia y, sobre todo, empoderarlas para conocer, defender y ejercer sus derechos. ✨ Los esperamos para formar parte de nuestras actividades. Gracias por permitirme compartir mi voz y, sobre todo, por recordarnos que una voz puede convertirse en conciencia y la conciencia puede convertirse en acción. 🤍 Los Derechos Humanos son de todos. #DerechosHumanos #HumanRights #Literatura #Arte #Poesía #Cultura #Empoderamiento #Educación #Mujeres #Madrid #España #DerechoInternacional #IEncuentroInternacional #fundacionmariosa

4. **2026-09-09** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7683605283402222856) · 1211 repr. · 150 s  
   > Lo que acabas de escuchar ocurrió de verdad. No es una historia inventada para generar impacto. Es una experiencia real que nos recuerda algo que a veces olvidamos: cuando una persona está vulnerable, la forma en que la tratamos también importa. Hablar de Derechos Humanos no es hablar únicamente de grandes conflictos o de leyes. También es hablar de lo que sucede en un hospital, en una escuela, en un trabajo, en una familia… en nuestra vida cotidiana. Porque la dignidad no debería depender de quién tengas delante. La empatía también es una forma de defender los Derechos Humanos. Y si alguna vez has sentido que tu voz no era escuchada, recuerda: EMPODERANDO TU VOZ Conoce tus derechos. Hazte escuchar. Defiende tu dignidad. Si tienes una historia que contar escribeme #EmpoderandoTuVoz #DerechosHumanos #DerechoALaSalud #DignidadHumana #Empatia

5. **2026-08-14** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7674007822211829010) · 2575 repr. · 65 s  
   > #CapCut #jovenesporlosderechoshumanos

6. **2026-08-14** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7673957400562388232) · 9199 repr. · 14 s  
   > #enjoyinglife#jovenesporlosderechoshumanos #españa

7. **2026-08-13** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7673609006333578514) · 353 repr. · 271 s  
   > Sabías que detrás de un sueño existe un Derecho humano? Did you know that behind every dream lies a human right?#jovenesporlosderechoshumanos @Unidos_Derechos_Humanos

8. **2026-08-09** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7671974891561684242) · 3888 repr. · 7 s  
   > En Nueva York representando a España como Delegada de jóvenes por los Derechos Humanos #jovenesporlosderecjoshumanos#España#humanrights#summityouthforhumanrights2026

9. **2026-07-23** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7665756964718251272) · 696 repr. · 51 s  
   > Errores que puedes cometer si quieres estudiar en España

10. **2026-07-22** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7665408605604252936) · 358 repr. · 31 s  
   > Tu futuro empieza hoy !

11. **2026-07-21** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7665026038849604871) · 575 repr. · 37 s  
   > Tu momento es ahora ‼️

12. **2026-07-15** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7662795225693277448) · 2020 repr. · 26 s  
   > Estudiar es España ! Mas fácil de lo que piensas

13. **2026-07-14** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7662419688818789650) · 420 repr. · 72 s  
   > Mitos sobre estudios en España

14. **2026-07-13** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7662076627655986439) · 4189 repr. · 19 s  
   > Solo terminaste el bachillerato? ‼️ tu futuro podría estar en España ‼️

15. **2026-07-11** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7661377403444366599) · 328 repr. · 60 s  
   > 🚨 ¿Crees que necesitas una universidad para estudiar en España? ❌ ¡No! Si terminaste el bachillerato, puedes acceder a programas con alta demanda laboral como: ⚡ Energías Renovables 👨‍🍳 Gastronomía 🏥 Salud 📊 Gestión Empresarial 🌍 Comercio Internacional Además: ✅ Puedes iniciar el proceso desde tu país. ✅ También si ya estás en España. ✅ Tendrás acompañamiento durante todo el trámite. 📩 Comenta “ESPAÑA” o envíame un mensaje y te explico cómo hacerlo. 🇪🇸 Tu futuro puede empezar hoy.

16. **2026-07-10** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7660821180051410183) · 7140 repr. · 60 s  
   > 🚨 ¿Quieres estudiar en España pero solo terminaste el bachillerato? ¡Sí es posible! 🇪🇸 No necesitas una carrera universitaria para acceder a estos programas de formación con alta demanda laboral. ✨ Elige la opción que más te guste: ⚡ Energías Renovables y Fotovoltaica 🤖 Baja Tensión y Automatización 👨‍🍳 Hostelería y Gastronomía 📚 En solo 1 año podrás obtener una formación profesional de calidad. 📍Si ya tienes permiso de residencia en España, también puedes estudiar. ✈️ Si estás en otro país, te acompañamos en tu proceso de admisión y, cuando corresponda, de visado. 💬 Comenta cuál te interesa más: 1️⃣ Energías Renovables 2️⃣ Automatización 3️⃣ Hostelería 📩 O escríbeme “ESPAÑA” por mensaje y te envío toda la información. ✨ Sígueme para conocer más oportunidades de estudio, extranjería y movilidad internacional en España. #EstudiarEnEspaña #España #Bachillerato #FormaciónProfesional #FPEspaña

17. **2026-04-30** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7634586542282919186) · 874 repr. · 49 s  
   > ¿Cuánto vale tu futuro? #regularizacionmigratoria #extranjeriaespaña #inmigracionespana #viral

18. **2026-04-28** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7633824558239206674) · 789 repr. · 137 s  
   > El problema detrás de la regularización extraordinaria #regularizacionmigratoria #regularizacionmasivaespaña

19. **2026-04-21** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7631111484608646407) · 809 repr. · 43 s  
   > Nosotros te apoyamos ‼️ Sin presión, sin exageración. Si decides hacer el proceso por tu cuenta o con nosotros es tu decisión ‼️ 💕Por qué tu nos IMPORTAS 💕

20. **2026-04-20** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7630941422211878152) · 1711 repr. · 107 s  
   > No improvises !!! Es tu futuro !!! #regularizacionmigratoria #migrantesenespaña #realmadrid

21. **2026-04-20** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7630693448378633479) · 1787 repr. · 49 s  
   > ¿Cuanto has tenido que soportar por ser migrante? Regularizarte NO es un juego es TU FUTURO!

22. **2026-04-19** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7630560473833835783) · 646 repr. · 81 s  
   > ¿Crees que para regularizarte en España solo tienes que subir papeles? ❌error❌ Sígueme y manda whatsapp para agendar #extranjeria #migrantesenespaña #regularizacionmasiva

23. **2026-04-19** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7630395183229570312) · 3264 repr. · 62 s  
   > Si te están cobrando por un informe de vulnerabilidad… primero infórmate. No es para todo el mundo. Y ni siquiera deberían cobrártelo. He visto personas pagar por algo que ni aplicaba en su caso. No pongas tu futuro en manos de alguien que no analiza tu situación. 👉 Sígueme para información real sobre extranjería Y envíame un whats app al 670647593 si quieres que revise tu caso de verdad #extranjeria #migrantesenespaña #vulnerabilidad #regularizacion

24. **2026-04-16** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7629439948692737288) · 792 repr. · 53 s  
   > Ayuda de migrante a migrante No todos aplican, por eso te regalamos una llamada para que no pagues si no aplicas sígueme y envía un whatsapp y te agendamos #regularizacion#regularizacionmigratoria#españa#migrantes

25. **2026-04-16** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7629140518647123207) · 55 repr. · 23 s  
   > 🚨 YA SALIÓ 🚨 REGULARIZACIÓN EXTRAORDINARIA Hoy analizamos el BOE a detalle 📅 A partir del JUEVES empezamos con asesorías reales 👉Sígueme y 📲 Envía un whats app al 670 647 593 y te llamamos Primera llamada GRATIS

26. **2026-04-15** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7629139885647039752) · 835 repr. · 60 s  
   > Sígueme y mándame un mensaje con tu número y te agendamos una llamada gratuita o envía whats app al 670 647 593 #regularizacionmigratoria#regularizaciónmasiva

27. **2026-04-15** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7628906789886643474) · 1524 repr. · 23 s  
   > 🚨 YA SALIÓ 🚨 REGULARIZACIÓN EXTRAORDINARIA Hoy analizamos el BOE a detalle 📅 A partir del JUEVES empezamos con asesorías reales 📲 Envía un whats app al 670 647 593 y te llamamos Primera llamada GRATIS. #migrantes #regularizacion

28. **2026-04-15** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7628783144283409671) · 840 repr. · 251 s  
   > *(sin texto)*

29. **2026-04-14** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7628751556963208466) · 1206 repr. · 79 s  
   > Sabemos lo que se siente estar lejos de tu país… y tener una oportunidad como esta en tus manos. Pero también sabemos lo fácil que es equivocarse cuando hay tanta información y tanta presión. Por eso, en Sandín y Asociados hemos decidido hacerlo diferente. 🤝 Sin prisas 🤝 Sin presión 🤝 Con información real 📢 Además, estaremos dando charlas gratuitas en la Fundación Mejora donde te explicaremos TODO de forma clara. 🎁 Es gratis. 👉 Puedes anotarte y resolver tus dudas con información real. Porque esto no es solo trabajo… 👉 es apoyo de migrante a migrante. No estás solo en este proceso. Escríbeme “QUIERO INFORMACIÓN” y te ayudamos o te reservamos tu plaza en las charlas. #migrantes #extranjeria #regularizacion #España #latinosenespaña

30. **2026-04-14** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7628720581407460616) · 773 repr. · 67 s  
   > Si te están pidiendo dinero HOY por la regularización extraordinaria… 🚨 para. Mañana se publica el texto oficial. Y aún así, hay despachos cobrando con información incompleta. 👉 No es asesoría. Es presión. En Sandín y Asociados no trabajamos con suposiciones. Analizamos el BOE real y luego te decimos la verdad sobre tu caso. 📞 A partir del jueves empezamos asesorías. ✔️ Sin prisas ✔️ Sin miedo ✔️ Sin pagos adelantados Tu futuro no se decide con urgencia… 👉 se decide con información correcta. Escríbeme “INFO REAL” y te explicamos tu caso sin compromiso. #regularizacion #extranjeria #papelesEspaña #migrantes #viral

31. **2026-04-14** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7628694193950493959) · 1933 repr. · 86 s  
   > No cobramos por información que aún no es oficial. No trabajamos con rumores. Analizamos el BOE y te decimos la verdad sobre tu caso. 📲 Escríbeme “REGULARIZACIÓN” y te llamamos.” #regularizacionespaña#regularizacionextraordinaria #migrantes

32. **2026-04-11** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7627459101441723655) · 4195 repr. · 36 s  
   > ¿Te están presionando para que agendes o para que pagues trámites para la regularización extraordinaria? Nosotros hacemos algo diferente cuando sea 100% seguro te llamamos así que déjanos tu número #regularizacionextraordinaria#españa#migracion#regularizacionmasiva

33. **2026-04-03** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7624569977516952850) · 329 repr. · 63 s  
   > Artículo 21 de la Declaración Universal de los Derechos Humanos n@Unidos_Derechos_Humanos os invita a reflexionar • Voto Ciudadano: ¿Pueden los residentes de larga duración votar en elecciones locales? Muchos países ya lo permiten para fomentar la integración. • Representación: No basta con "estar"; la verdadera inclusión ocurre cuando los migrantes pueden proponer soluciones y ser escuchados en las instituciones públicas. • Derechos Políticos en el Origen: El derecho a votar desde el extranjero es vital para que quienes se fueron sigan influyendo en el destino de su patria. #DerechosHumanos #Migración #Artículo21 #DemocraciaInclusiva #CiudadaníaGlobal

34. **2026-04-01** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7623838275249245447) · 311 repr. · 60 s  
   > Este 8 de marzo tuve la oportunidad de aportar mi voz a través de este artículo 🖋️🤍 Hoy comparto algunas de las páginas que escribí, con la misma intención con la que nacieron: informar, generar conciencia y abrir camino. Gracias nuevamente a la revista Construyendo un Mundo Mejor por este espacio, y a quienes leen, comparten y creen en la importancia de comunicar con propósito. Porque cada palabra también puede ser una forma de construir ✨ #8M #DíaInternacionalDeLaMujer #DerechoMigratorio #Extranjería #Abogada https://www.facebook.com/share/p/1EPK1z6scS/?mibextid=wwXIfr

35. **2026-03-30** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7623113662454123783) · 848 repr. · 48 s  
   > Artículo 20 dice que "nadie podrá ser obligado a pertenecer a una asociación". En el contexto de la migración, esto también significa que los migrantes son libres de elegir cómo y con quién se identifican, sin presiones externas #Articulo20 #DerechosHumanos #Migración

36. **2026-03-28** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7622369513329167634) · 448 repr. · 53 s  
   > El Artículo 19 de la Declaración Universal de los Derechos Humanos, libertar de expresión lo que asegurar que quienes migran no sean silenciados por el miedo o la burocracia. #DerechosHumanos #Migración #Artículo19 #LibertadDeExpresión #HumanidadSinFronteras

37. **2026-03-27** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7621997443592326418) · 844 repr. · 55 s  
   > El Artículo 18 de los Derechos Humanos establece que toda persona tiene derecho a la libertad de pensamiento, de conciencia y de religión. Pero, ¿qué pasa cuando alguien debe dejar su hogar? Para millones de migrantes, este derecho es doblemente vital: 1. El motivo del viaje: Muchos huyen precisamente porque su libertad de conciencia o religión está bajo amenaza. 2. El refugio en el camino: En la incertidumbre de la migración, la fe y las convicciones personales son, a menudo, el único equipaje que nadie les puede quitar. 3. La integración: Una sociedad que acoge de verdad es aquella que respeta las creencias y la esencia del que llega. Migrar es un derecho. Mantener tu identidad y tus creencias mientras lo haces, también lo es. #DerechosHumanos #Artículo18 #MigraciónConDignidad #LibertadDeCulto #HumanidadSinFronteras

38. **2026-03-25** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7621269313013468424) · 808 repr. · 55 s  
   > El Artículo 17 de los Derechos Humanos es breve, pero poderoso. Se resume en dos puntos clave: 1. Derecho a la propiedad: Toda persona tiene derecho a tener sus propias cosas, ya sea de forma individual o junto a otros. 2. Protección contra el abuso: Nadie puede quitarte lo que te pertenece de forma arbitraria o injusta. #DerechosHumanos #madrid#extranjeria@Unidos_Derechos_Humanos

39. **2026-03-22** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7620145602365525266) · 378 repr. · 52 s  
   > Derechos humanos y migración. La Declaración universal de Derechos Humanos en su artículo 16 es claro: todos tienen derecho a crear una familia y a que el Estado la proteja. 🏠 La migración no debería ser sinónimo de separación familiar. Los muros no pueden estar por encima de los Derechos Humanos. #MigrarEsUnDerecho #Art16 #HumanRights#derechoshumanos#madrid @Unidos_Derechos_Humanos

40. **2026-03-21** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7619771138440187144) · 943 repr. · 44 s  
   > Artículo 15 de la Declaración Universal de los Derechos Humanos. Es el derecho que te da una identidad oficial ante el planeta. El derecho a cambiar de nacionalidad es igual de importante que el de tener una. Esto asegura que, si decides hacer tu vida en otro lugar del mundo, tengas la puerta abierta para integrarte plenamente y buscar una nueva identidad legal. #DerechosHumanos #Articulo15 #Ciudadania #Libertad #Identidad

41. **2026-03-19** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7619055853232049415) · 793 repr. · 56 s  
   > El Artículo 14 de la declaración universal de los derechos humanos busca que nadie sea devuelto a un lugar donde su vida corra peligro. ¿Por qué es relevante hoy? Con millones de personas desplazadas por conflictos y crisis, entender que buscar asilo es un derecho humano (y no un acto ilegal) es el primer paso para construir sociedades más empáticas y acogedoras. #DerechosHumanos #Articulo14 #Asilo #Migración #HumanidadSinFronteras @Unidos_Derechos_Humanos

42. **2026-03-19** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7618950336945999111) · 790 repr. · 29 s  
   > Conoce tus derechos ! Este viernes en calle Santa Catalina 7 #madrid #migrantes_latinos #derechoshumanos @Unidos_Derechos_Humanos

43. **2026-03-18** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7618661870316129554) · 803 repr. · 25 s  
   > Ven a conocersenos #yotambiensoymigrante #derechoshumanos #migrantes #derechoshumanos @Unidos_Derechos_Humanos

44. **2026-03-18** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7618549867446553874) · 815 repr. · 12 s  
   > Tenemos derechos pero ha que recordar respetar para que me respeten #yotambiensoymigrante#derechoshumanos#migrantes #españa @Unidos_Derechos_Humanos

45. **2026-03-17** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7618159063611788552) · 783 repr. · 54 s  
   > Todos somos libres, saber nuestros Derechos Humanos nos ayuda a que podamos exigir que se respeten #derechoshumanos #migrantes #amor#regularizacion @Unidos_Derechos_Humanos

46. **2026-03-16** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7617771904069537042) · 842 repr. · 37 s  
   > La importancia de conocer tus derechos siendo migrante #migrantes_latinos #españa #derechoshumanos @Unidos_Derechos_Humanos

47. **2026-03-15** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7617537949235678472) · 802 repr. · 64 s  
   > Derechos humanos y migraciones el Artículo 13 de los derechos humanos nos habla de la libertad de movimiento pero deberia implica construir sociedades más empáticas. Sin aprovecharse del migrante La integración comienza con la hospitalidad y el reconocimiento de que moverse es humano. #DerechosHumanos #Migración #Artículo13 #LibreMovimiento #HumanidadSinFronteras

48. **2026-03-15** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7617449373202468103) · 847 repr. · 29 s  
   > Para mí ser abogada mexicana, migrante y hoy consultora significa no solo ver clientes ver humanos que han sufrido ponerme en los zapatos de la otra persona para poder defenderla #derechoshumanos #justicia#empatia @Unidos_Derechos_Humanos

49. **2026-03-14** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7617221872765242632) · 811 repr. · 55 s  
   > Momentos de la conferencia del dia de la mujer en la fundación para la mejora @Unidos_Derechos_Humanos #mujeresqueinspiran #8demarzo💜

50. **2026-03-14** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7617164436322749704) · 815 repr. · 61 s  
   > Derechos humanos y migración #regularizacionmigratoria #españa🇪🇸 @Unidos_Derechos_Humanos

51. **2026-03-14** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7617041297597287687) · 801 repr. · 213 s  
   > 8 de marzo DÍA De LA MUJER! Un día importante para recordar lo fuerte que somos #ponencia#derechoshumanos @Unidos_Derechos_Humanos #LIVEIncentiveProgram #SideHustleLIVE #PaidPartnership

52. **2026-03-13** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7616792058749111560) · 815 repr. · 44 s  
   > ¿Por qué es tan importante conocer tus derechos ? @Unidos_Derechos_Humanos #extranjeriaespaña #LIVEIncentiveProgram #SideHustleLIVE #PaidPartnership #LIVEbringFANS

53. **2026-03-13** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7616700651053059336) · 540 repr. · 54 s  
   > Derechos humanos y migración #migracion#españa#derechoshumanos#regularizacion @Unidos_Derechos_Humanos

54. **2026-03-10** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7615704838747294994) · 851 repr. · 55 s  
   > Derechos humanos y migracion #regularizacionmigratoria @Unidos_Derechos_Humanos

55. **2026-03-09** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7615298205546237192) · 817 repr. · 44 s  
   > Derechos Humanos y migración #migraseguro#regularizacionmigratoria @Unidos_Derechos_Humanos

56. **2026-03-09** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7615221915942128904) · 767 repr. · 256 s  
   > Entrevista del evento ! @Unidos_Derechos_Humanos

57. **2026-03-09** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7615049737372192021) · 122 repr. · 85 s  
   > *(sin texto)*

58. **2026-03-08** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7615038217162640660) · 351 repr. · 32 s  
   > *(sin texto)*

59. **2026-03-08** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7614921765931764999) · 808 repr. · 17 s  
   > #tiktoklive #livehighlights #Derechoshumanos

60. **2026-03-07** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7614584268928437512) · 829 repr. · 51 s  
   > La ley es igual para todos

61. **2026-03-06** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7614187843983805714) · 835 repr. · 55 s  
   > En España Si tienes derechos #españa🇪🇸 #regularizacion#regularizacionmigratoria

62. **2026-03-05** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7613853809487629576) · 848 repr. · 60 s  
   > LIVE: Derechos Humanos y Migración. Hablaremos de cómo proteger tus derechos y las vías legales de regularización en España. Información clara, sin miedo y con base legal. Te espero.

63. **2026-03-05** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7613851802554977543) · 304 repr. · 53 s  
   > Hay violencias que no dejan marcas… pero se viven todos los días. Vivir con miedo constante por ser migrante no es normal. No es “lo que toca”. Y no es legal. La dignidad no depende de un permiso de residencia. ¿Alguna vez has sentido que el miedo forma parte de tu rutina? Te leo en comentarios. #DerechosHumanos #Migración #Extranjería #Regularización #NoEstásSolo

64. **2026-03-05** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7613736571132464402) · 246 repr. · 84 s  
   > La verdad puede doler, pero lo mejor es que te hablen con la verdad asi no te romperán sueños

65. **2026-03-04** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7613496454086200583) · 1010 repr. · 96 s  
   > ¿Para que sirven los derechos humanos? Para protegerte así de fácil @Unidos_Derechos_Humanos #LIVEIncentiveProgram #LIVEbringFANS #PaidPartnership

66. **2026-03-04** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7613287136711789831) · 827 repr. · 49 s  
   > Tu trabajo no se regala !

67. **2026-03-03** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7612973680179662088) · 831 repr. · 76 s  
   > Los derechos humanos no son política. Son la vida diaria. Son cómo tratas a la persona que tienes enfrente. Son respetar aunque piensen distinto. Son defender aunque no te afecte directamente. Hoy con la fundación mejora y unidos por los derechos humanos salimos a repartir información, pero no repartimos papel… Repartimos conciencia. Porque muchas personas creen que los derechos humanos son algo lejano, algo de gobiernos, algo de discursos. Y no. Los derechos humanos empiezan en lo pequeño: en el respeto, en la empatía, en no quedarte callado cuando ves injusticia. No somos activismo de redes. Somos acción en la calle. Y mientras exista alguien que sufra en silencio, seguiremos sembrando información, educación y dignidad. Si crees que los derechos humanos se viven todos los días, comparte este mensaje. @Unidos_Derechos_Humanos #LIVEIncentiveProgram #LIVEMonetization #PaidPartnership

68. **2026-03-02** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7612696979704990994) · 1199 repr. · 63 s  
   > ⚠️ Si tienes miedo de volver a tu país, no ignores este video. En migración, una mala decisión puede cambiarlo todo. Y cuando se trata de tu vida, no se improvisa. Hay mucha desinformación circulando y muchas promesas fáciles. Pero la protección internacional no es un atajo ‼️es algo serio.‼️ Infórmate bien antes de actuar. Si necesitas orientación responsable, comenta PROTECCIÓN o envíame mensaje privado. Guarda este video. Puede ser importante.#LIVEIncentiveProgram #LIVEbringFANS #PaidPartnership

69. **2026-03-02** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7612522248091569416) · 244 repr. · 81 s  
   > Hay algo que casi nadie ve cuando hablamos de derechos humanos. En el despacho no vemos números. Vemos madres con miedo. Jóvenes que no saben si podrán quedarse. Personas que llevan años viviendo en silencio. Cuando escuchas tantas historias, entiendes algo: los derechos humanos no son teoría. Son vida real. Si tú también crees que el derecho debe proteger personas, quédate aquí. #DerechosHumanos #Extranjería #MigrarConDignidad

70. **2026-03-01** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7612419197649292552) · 772 repr. · 69 s  
   > Acciones no palabras @Unidos_Derechos_Humanos

71. **2026-03-01** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7612329329527246087) · 502 repr. · 53 s  
   > Derecho humano número 2, aplicado en la vida diaria como migrante

72. **2026-02-28** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7612010162689166610) · 800 repr. · 455 s  
   > La realidad que estamos viviendo ante la regularización extraordinaria

73. **2026-02-27** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7611630555674758418) · 721 repr. · 64 s  
   > ¿Te han hecho sentir que por no tener papeles vales menos? La Declaración Universal de los Derechos Humanos es clara: todos nacimos libres e iguales en dignidad y derechos. La Ley de Extranjería NO está por encima de tu dignidad. Tu situación administrativa no define tu valor como persona. En Sandin y Asociados llevamos más de 30 años defendiendo algo muy simple: tu dignidad no es negociable. El nuevo reglamento de mayo 2025 puede abrir vías de regularización. Pero tu valor lo tienes desde el primer día que pisaste suelo español. Infórmate. Protégete. Sígueme para conocer tus derechos y las vías reales de regularización. 📩 Asesoría personalizada: 670 647 593 Mini guías gratuitas en mi perfil. #DerechosHumanos #Extranjería #Regularización #Migrantes @Unidos_Derechos_Humanos

74. **2026-02-22** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7609817285938777362) · 431 repr. · 2391 s  
   > Migrando con derechos @Unidos_Derechos_Humanos

75. **2026-02-21** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7609457677504236818) · 970 repr. · 33 s  
   > 📢 ¡ES HOY! LLEGÓ EL DÍA QUE ESTÁBAMOS ESPERANDO 🚀 ¿Tienes dudas sobre tu situación migratoria en España? ¿Quieres conocer tus derechos y sentirte respaldado? ¡Esta tarde es para ti! No es solo una charla, es un espacio creado por la Fundación Mejía y Unidos por los Derechos Humanos para darte herramientas reales y muchas sorpresas que no te imaginas. 🎁✨ 🗓️ ¿QUÉ TENDREMOS? Asesoría en Extranjería: Respondemos tus dudas sobre regularización en vivo. ⚖️ Derechos Humanos: Aprende cómo protegerte y hacer valer tu voz. Invitados Especiales: Personas comprometidas con nuestra comunidad. Sorpresas y Regalos: ¡Queremos que te lleves algo más que información! 👕🧢 📍 ¿DÓNDE Y CUÁNDO? 📌 Lugar: Calle Santa Catalina, 7, Madrid. 🕒 Hora: 16:30 hrs. ¡No caminas solo, estamos unidos por tus derechos! Pasa la voz, trae a un amigo y ven preparado para aprender y disfrutar. 🤝🌍 #EsHoy #MigraciónEspaña #DerechosHumanos #MadridSolidaria @Unidos_Derechos_Humanos

76. **2026-02-21** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7609329521560407314) · 1686 repr. · 39 s  
   > 📢 MIGRAR CON DERECHOS Tu dignidad y tu trabajo no tienen fronteras ¿Quieres conocer tus derechos como persona migrante en España? ¿Sabes qué opciones reales existen para regularizar tu situación y proteger tu dignidad laboral? Te invitamos a un encuentro informativo donde hablaremos de derechos humanos, extranjería y oportunidades reales para migrar con seguridad jurídica. 🗓 Domingo 22 de febrero de 2026 ⏰ 16:30 horas 📍 Calle Santa Catalina 7 Metro: Antón Martín o Sevilla – Madrid 🎙 Contaremos con la participación de: • Denisse González – Consultora Internacional experta en Extranjería • Mónica Muñoz – Directora de Programas de la Fundación Mejora • Juan Antonio Martínez – Secretario de Actividades de JDH España 🤝 Organizan: Fundación para la Mejora de la Vida, la Cultura y la Sociedad Juventud por los Derechos Humanos España Peruanos en el Exterior España Comité Cívico Ecuatoriano en España ✨ Un espacio para informarte, empoderarte y resolver dudas. 🔔 Entrada libre hasta completar aforo. Confirma tu asistencia y comparte con quien lo necesite. Tendremos sorpresas ‼️ No te lo puedes perder #MigrarConDerechos #Extranjería #DerechosHumanos #Madrid #Migrantes @Unidos_Derechos_Humanos

77. **2026-02-21** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7609293723838549255) · 200 repr. · 57 s  
   > 🌍✨ ¿Qué es “Migrar con Derechos”? No es solo una conferencia. Es un espacio creado para ti. Para la comunidad migrante que quiere información clara. Para quien necesita orientación sin miedo. Para quien quiere sentirse acompañado y no juzgado. Migrar con Derechos es: 🤝 Un lugar para crear lazos con otras personas que están viviendo lo mismo que tú. 🛡 Un espacio seguro donde puedes preguntar sin temor. 📚 Información legal clara y responsable. ⚖️ Orientación con base jurídica, sin promesas falsas. ❤️ Comunidad, apoyo y dignidad. Aquí no vienes solo a escuchar. Vienes a entender tus derechos. Vienes a fortalecer tu camino. Vienes a saber que no estás solo. Porque migrar no debería significar vivir con miedo. Debería significar avanzar con información y respaldo. 📍 Calle Santa Catalina 7, Madrid 🗓 22 de febrero ⏰ 16:30 Si eres parte de la comunidad migrante, este espacio también es tuyo. #MigrarConDerechos #ComunidadMigrante #ExtranjeríaEspaña #DerechosHumanos #MigrantesEnMadrid @Unidos_Derechos_Humanos

78. **2026-02-21** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7609292021278199048) · 831 repr. · 60 s  
   > 🌍✨ ¿Qué es “Migrar con Derechos”? No es solo una conferencia. Es un espacio creado para ti. Para la comunidad migrante que quiere información clara. Para quien necesita orientación sin miedo. Para quien quiere sentirse acompañado y no juzgado. Migrar con Derechos es: 🤝 Un lugar para crear lazos con otras personas que están viviendo lo mismo que tú. 🛡 Un espacio seguro donde puedes preguntar sin temor. 📚 Información legal clara y responsable. ⚖️ Orientación con base jurídica, sin promesas falsas. ❤️ Comunidad, apoyo y dignidad. Aquí no vienes solo a escuchar. Vienes a entender tus derechos. Vienes a fortalecer tu camino. Vienes a saber que no estás solo. Porque migrar no debería significar vivir con miedo. Debería significar avanzar con información y respaldo. 📍 Calle Santa Catalina 7, Madrid 🗓 22 de febrero ⏰ 16:30 Si eres parte de la comunidad migrante, este espacio también es tuyo. #MigrarConDerechos #ComunidadMigrante #ExtranjeríaEspaña #DerechosHumanos #MigrantesEnMadrid @Unidos_Derechos_Humanos

79. **2026-02-20** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7608999890714201352) · 417 repr. · 63 s  
   > 🌍✨ ¿Qué es “Migrar con Derechos”? No es solo una conferencia. Es un espacio creado para ti. Para la comunidad migrante que quiere información clara. Para quien necesita orientación sin miedo. Para quien quiere sentirse acompañado y no juzgado. Migrar con Derechos es: 🤝 Un lugar para crear lazos con otras personas que están viviendo lo mismo que tú. 🛡 Un espacio seguro donde puedes preguntar sin temor. 📚 Información legal clara y responsable. ⚖️ Orientación con base jurídica, sin promesas falsas. ❤️ Comunidad, apoyo y dignidad. Aquí no vienes solo a escuchar. Vienes a entender tus derechos. Vienes a fortalecer tu camino. Vienes a saber que no estás solo. Porque migrar no debería significar vivir con miedo. Debería significar avanzar con información y respaldo. 📍 Calle Santa Catalina 7, Madrid 🗓 22 de febrero ⏰ 16:30 Si eres parte de la comunidad migrante, este espacio también es tuyo. #MigrarConDerechos #ComunidadMigrante #ExtranjeríaEspaña #DerechosHumanos #MigrantesEnMadrid. @Unidos_Derechos_Humanos

80. **2026-02-20** · [vídeo](https://www.tiktok.com/@lic.denissegb/video/7608797790369598728) · 918 repr. · 56 s  
   > ¿Te gustaría saber sobre el reglamento de extranjería ? Esto es para ti ‼️. No te lo pierdas tendremos increíbles sorpresas. Te esperamos en calle Santa Catalina 7 ##regularizacionmigratoriaenespaña @@Unidos_Derechos_Humanos

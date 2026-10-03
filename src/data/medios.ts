/**
 * En medios / Publicaciones (docs/contenido.md → EN MEDIOS).
 * La transcripción está copiada literalmente del cartel publicado: PENDIENTE de validar por
 * la cliente (README → Pendiente, punto 9).
 */
export const ARTICLE_8M = {
  publisher: 'Construyendo un Mundo Mejor',
  section: 'Inclusión y Neurodiversidad',
  title: '8 de marzo — Voces que se unen. Alzar la voz para vivir libres y felices',
  author: 'Denisse González Barbosa',
  standfirst: 'Voces unidas que salen a marchar y gritan lo que una sola voz no pudo, mientras vivía entre silencios y heridas.',
  topic: 'Un artículo sobre la violencia contra las mujeres y la revictimización.',
  transcript: [
    'El 8 de marzo de 2026, millones de mujeres de todo el mundo saldrán a las calles por la igualdad y la justicia. Pero muchas otras lo hacen porque solas no se han atrevido a levantar la voz, o porque cuando lo hicieron, no les creyeron.',
    'En el mundo hay 840 millones de mujeres y niñas, y 1 de cada 3 mujeres mayores de 15 años ha sufrido violencia física o sexual. Solo en los últimos 12 meses, 316 millones han sufrido violencia de su pareja, y 263 millones violencia sexual de alguien que fue pareja.',
    'Sin embargo, todavía hay muchas mujeres que no forman parte de estas estadísticas, por que viven violencia detrás de sonrisas forzadas, matrimonios impuestos, familias obligadas a callar, manos que controlan y decisiones extremas que llevan incluso al suicidio.',
    '¿Por qué lo hacen?<br>Si tenemos derecho a decir lo que nos pasa, a denunciar e incluso hay organismos internacionales que protegen. Lo hacen por que callar es más sencillo. Decir “estoy bien” es más fácil que decir “tengo miedo”; confiar es difícil, y denunciar no siempre garantiza protección.',
    'Hoy existe una violencia menos visible, pero más dura: la revictimización. Cuando una mujer decide hablar, enfrenta no solo a su agresor, sino cuestionamientos, difamaciones, indiferencia institucional y procesos que la obligan a repetir su dolor. Esto puede llevar a que la víctima parezca culpable o mentirosa y se vea obligada a abandonar el proceso legal.',
  ],
} as const;

/**
 * Prensa de 2021 (docs/redes-sociales.md §3, verificada en la web de cada medio): la demanda
 * internacional contra China y la OMS por la COVID-19. Citas literales, tal como las publicó
 * cada medio (SDP Noticias escribe «Deniss»). Economis la cita con su nombre completo, que solo
 * aparece en las páginas legales (README → Dónde se edita): sin extracto. Tiptip MX NO se
 * incluye: su URL no está verificada.
 */
export const PRESS_CONTEXT =
  'Citada como representante en México de Poplavsky International Law Offices en la demanda internacional contra China y la OMS por la COVID-19.';

export interface PressItem {
  outlet: string;
  /** Agencia o detalle del medio (opcional). */
  note?: string;
  /** Fecha ISO para <time datetime> (día o solo año). */
  date: string;
  /** Fecha para mostrar. */
  dateLabel: string;
  headline: string;
  /** Extracto literal del medio en el que se la cita (sin comillas exteriores). */
  excerpt?: string;
  href: string;
}

export const PRESS_2021: readonly PressItem[] = [
  {
    outlet: 'Expansión',
    note: 'México · nota de AFP',
    date: '2021-12-31',
    dateLabel: '31 de diciembre de 2021',
    headline: 'Mexicanos reclaman a China y la OMS indemnizaciones millonarias por el COVID',
    excerpt: '“Estos reclamos se presentan por la negligencia que hubo tanto de China como de la OMS en el manejo del COVID-19”, dice a la AFP la abogada Denisse González, representante en México de Poplavsky.',
    href: 'https://expansion.mx/mundo/2021/12/31/mexicanos-reclaman-china-oms-indemnizacion-millonaria-covid',
  },
  {
    outlet: 'SDP Noticias',
    note: 'México',
    date: '2021-12-29',
    dateLabel: '29 de diciembre de 2021',
    headline: 'Mexicanos afectados por Covid-19 buscan indemnizaciones de China y la OMS',
    excerpt: 'Deniss González, representante del despacho en México, aseguró que la demanda se presenta por la negligencia de China y la OMS en el manejo del Covid-19.',
    href: 'https://www.sdpnoticias.com/internacional/mexicanos-afectados-por-covid-19-buscan-indemnizaciones-de-china-y-la-oms/',
  },
  {
    outlet: 'Economis',
    note: 'Argentina',
    date: '2021',
    dateLabel: '2021',
    headline: 'Más de 3.000 personas de todo el mundo demandaron a China y la OMS por la pandemia de COVID-19',
    href: 'https://economis.com.ar/mas-de-3-000-personas-de-todo-el-mundo-demandaron-a-china-y-la-oms-por-la-pandemia-de-covid-19/',
  },
] as const;

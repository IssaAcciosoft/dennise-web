/**
 * «Actividad reciente · Agenda 2026» de /conoceme/ (docs/redes-sociales.md §4, solo hechos de
 * sus publicaciones; los textos entre comillas son suyos, tal cual).
 * NO se incluyen los actos celebrados en la sede de las charlas de los viernes ni la marca de
 * los vídeos de abril: pendientes de que la cliente decida (docs/contenido.md §7).
 */

export interface AgendaItem {
  /** Fecha ISO de inicio para <time datetime>. */
  date: string;
  /** Fecha para mostrar. */
  dateLabel: string;
  title: string;
  place: string;
  /** Su papel, solo si consta (p. ej. «Delegada»). */
  role?: string;
  /** Una línea suya o un dato del evento. */
  text?: string;
}

/** De lo más reciente a lo más antiguo. */
export const AGENDA_2026: readonly AgendaItem[] = [
  {
    date: '2026-09-30',
    dateLabel: '30 sep. 2026',
    title: 'Franchise Innovation Summit',
    place: 'Madrid',
    text: '«Un espacio que reúne innovación, emprendimiento, negocios y grandes oportunidades de conexión.»',
  },
  {
    date: '2026-09-26',
    dateLabel: '26 sep. 2026',
    title: 'Embassy Cup y cultura mexicana',
    place: 'Madrid',
    text: 'Piña Agavera, concierto de El Recodo y la Embassy Cup, torneo deportivo entre embajadas. «Un día. Tres escenarios. Una misma visión.»',
  },
  {
    date: '2026-07-30',
    dateLabel: '30–31 jul. 2026',
    title: '20th International Human Rights Summit',
    place: 'Naciones Unidas, Nueva York',
    role: 'Delegada',
  },
];

export interface CampaignItem {
  /** Mes ISO (AAAA-MM). */
  date: string;
  dateLabel: string;
  title: string;
  text: string;
}

export const CAMPAIGNS_2026: readonly CampaignItem[] = [
  {
    date: '2026-07',
    dateLabel: 'Julio',
    title: '«Estudia en España»',
    text: 'Formación Profesional para quien solo tiene bachillerato: mitos y errores frecuentes.',
  },
  {
    date: '2026-04',
    dateLabel: 'Abril',
    title: 'Regularización extraordinaria',
    text: 'Lo que debes saber y cómo evitar estafas y cobros abusivos.',
  },
];

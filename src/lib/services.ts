/**
 * Catálogo de servicios: src/data/servicios.json + catálogo de AccioGest al compilar
 * (docs/integracion-acciogest.md → «Fase A»). TODA la web lee el catálogo desde aquí.
 *
 * Cada precio de una asesoría (consultations[].prices[]) y cada plan llevan `acciogest_id`
 * (null = aún sin enlazar). Si BOOKING_PLUGIN_ID está configurado, la compilación descarga el
 * catálogo de AccioGest (src/integrations/acciogest-catalog.mjs → `virtual:acciogest-catalog`)
 * y aquí se mezcla por `acciogest_id`: nombre → name, descripcion → description, duracion_min →
 * duration_minutes (y duration_label), precio_bruto → amount (IVA incluido, como tax_included).
 * `mostrar_precio: false` (normalizado en la integración: false, 0, "0", "false", "no"…) oculta
 * ese precio (la tarjeta se queda), igual en asesorías y en planes; también un id enlazado que no
 * está en el catálogo (despublicado en AccioGest; vale también la última copia buena), que además
 * sale del widget.
 * `lead_value` NO cambia con el catálogo: es el valor del campo «Servicio» que recibe AccioGest y
 * debe seguir siendo estable; si el nombre o la duración de AccioGest difieren, el selector
 * enseña el texto nuevo (label) con el mismo valor y la compilación avisa para revisarlo a mano.
 * Ids que la web no conoce se
 * ignoran; nunca se quita un elemento de servicios.json. Los bloques sin precio (immigration,
 * firm_services, companies, dubai) salen solo del JSON. Los planes toman su importe del campo
 * de pago de su formulario (GET /form-builder/public/{PLAN_FORM_ID}) si su ID está configurado.
 * Sin IDs (modo simulado) todo sale de servicios.json, como siempre.
 */
import catalog from '~/data/servicios.json';
// Ya filtrado por la integración: catálogo solo con BOOKING_PLUGIN_ID configurado, y planes solo
// con su PLANES.<plan> configurado (mismos IDs que src/config/acciogest.ts; no se importa aquí
// para no añadir ese módulo al JS de la visita guiada, que también lee este archivo).
import remote from 'virtual:acciogest-catalog';

export type Price = {
  modality: string;
  label: string;
  amount: number;
  /** Id del servicio en AccioGest (online y presencial son servicios distintos). null = sin enlazar. */
  acciogest_id: string | number | null;
};
/** Servicio del widget de reservas para una modalidad (incluso si su precio está oculto). */
export type BookingService = { modality: string; acciogest_id: string };
export type Consultation = {
  id: string;
  name: string;
  duration_minutes: number;
  duration_label: string;
  description: string | null;
  /** Precios visibles (sin los de `mostrar_precio: false` en AccioGest). */
  prices: Price[];
  bookable: boolean;
  lead_value: string;
  /** Modalidades enlazadas con AccioGest (para abrir el widget con ese servicio). */
  booking: BookingService[];
};
export type Plan = {
  id: string;
  name: string;
  /** null = precio oculto (`mostrar_precio: false` o despublicado en AccioGest). */
  amount: number | null;
  /** Id en el catálogo de AccioGest (null = sin enlazar). El importe sale del formulario del plan. */
  acciogest_id: string | number | null;
  featured: boolean;
  form_key: string;
  lead_value: string;
  /** ids de `Program.features` que incluye el plan (docs/cambios-2026-10.md §5). */
  includes: string[];
};
export type Feature = { id: string; label: string };
export type Program = {
  id: string;
  name: string;
  /** Lema de sus piezas gráficas («Gestiona tu propio trámite de extranjería»). */
  tagline: string;
  procedures_title: string;
  procedures: string[];
  features_title: string;
  /** Todo lo que puede incluir un plan, en orden (de Básico a Premium). */
  features: Feature[];
  plans: Plan[];
};

/**
 * Servicio sin precio publicado (se solicita por el formulario). `pending: true` → texto
 * neutro provisional (PENDIENTE: la cliente aún no ha enviado su descripción).
 */
export type CatalogService = {
  id: string;
  name: string;
  description: string;
  lead_value: string;
  pending?: boolean;
};
/** `also: true` → bajo el subtítulo «También» (`also_title`) de la sección: la línea «Nómadas
 *  digitales · Emprendedores · Residencias» de la web anterior, hoy tarjetas (§2.1). */
export type ImmigrationService = CatalogService & { also?: boolean };
export type Immigration = {
  id: string;
  eyebrow: string;
  title: string;
  intro: string[];
  also_title?: string;
  services: ImmigrationService[];
};
/** Gestión administrativa y homologación de títulos (docs/cambios-2026-10.md §2.4 y §2.12). */
export type FirmServices = { id: string; eyebrow: string; title: string; services: CatalogService[] };
/** Apertura de empresas en España, México y Dubái (/apertura-de-empresas/). */
export type Country = { id: string; name: string; lead_value: string };
export type Companies = { id: string; name: string; path: string; countries: Country[] };
/** Dubái (parte de /apertura-de-empresas/). */
export type Dubai = {
  id: string;
  name: string;
  lead_value: string;
  structures: string[];
};

type RawConsultation = Omit<Consultation, 'booking'>;
type RawCatalog = {
  updated_at: string;
  currency: string;
  tax_included: boolean;
  tax_label: string;
  immigration: Immigration;
  firm_services: FirmServices;
  consultations: RawConsultation[];
  programs: Program[];
  companies: Companies;
  dubai: Dubai;
};

/* ---------------------------------------------------------------- mezcla con AccioGest ---- */

type RemoteService = (typeof remote.catalog & {})['servicios'][number];

/** 30 → «30 min», 60 → «1 hora», 90 → «1 h 30 min», 120 → «2 horas», 150 → «2 h 30 min». */
export const durationLabel = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  if (!m) return h === 1 ? '1 hora' : `${h} horas`;
  return `${h} h ${m} min`;
};

/** Id propio de servicios.json (null = sin enlazar). */
const ownId = (id: string | number | null): string | null => (id !== null && String(id).trim() !== '' ? String(id).trim() : null);
/** Id con el que se busca en AccioGest; en modo de prueba, los no enlazados reciben `mock-…`. */
const linkedId = (id: string | number | null, mockId: string): string | null => ownId(id) ?? (remote.mock ? mockId : null);

function mergeCatalog(raw: RawCatalog): { consultations: Consultation[]; programs: Program[]; updated_at: string } {
  const live = remote.catalog;
  const byId = new Map<string, RemoteService>((live?.servicios ?? []).map((s) => [s.id, s]));
  // Un id enlazado que no está en el catálogo (el recién descargado o, si AccioGest falla, la
  // última copia buena, que también fue una respuesta válida) se ha despublicado o borrado en
  // AccioGest → como `mostrar_precio: false` (sin precio, nunca el precio viejo del JSON) y fuera
  // del widget. La integración avisa en el log de la compilación.
  const gone = (id: string | null) => Boolean(live) && id !== null && !byId.has(id);

  const consultations = raw.consultations.map((c): Consultation => {
    const linked = c.prices.map((p) => {
      const id = linkedId(p.acciogest_id, `mock-${c.id}-${p.modality}`);
      return { price: p, id, remote: id ? byId.get(id) : undefined };
    });
    // Nombre, descripción y duración de la tarjeta: del primer servicio enlazado (online primero).
    // TODO (AccioGest): confirmar que online y presencial tienen el mismo nombre/duración.
    const head = linked.find((l) => l.remote)?.remote;
    const minutes = head?.duracion_min ?? c.duration_minutes;
    return {
      ...c,
      name: head?.nombre ?? c.name,
      description: head?.descripcion ?? c.description,
      duration_minutes: minutes,
      duration_label: head?.duracion_min ? durationLabel(minutes) : c.duration_label,
      prices: linked
        .filter((l) => l.remote?.mostrar_precio !== false && !gone(l.id))
        .map((l) => ({ ...l.price, amount: l.remote?.precio_bruto ?? l.price.amount })),
      booking: linked
        .filter((l) => l.id && !gone(l.id))
        .map((l) => ({ modality: l.price.modality, acciogest_id: l.id as string })),
    };
  });

  const programs = raw.programs.map((prog) => ({
    ...prog,
    plans: prog.plans.map((plan): Plan => {
      const id = linkedId(plan.acciogest_id, `mock-plan-${plan.id}`);
      const fromCatalog = id ? byId.get(id) : undefined;
      const formAmount = remote.plans[plan.form_key as keyof typeof remote.plans]?.amount;
      // Mismo criterio que las asesorías: `mostrar_precio: false` o un id que no está en el
      // catálogo (despublicado) ocultan el precio (amount: null), aunque el formulario de
      // pago tenga importe (la página de pago de AccioGest lo enseña al contratar).
      // Si se ve: campo de pago del formulario del plan > catálogo > servicios.json.
      // (Los ids de prueba `mock-plan-…` no están en el fixture: ahí no cuenta como despublicado.)
      const hidden = fromCatalog?.mostrar_precio === false || (ownId(plan.acciogest_id) !== null && gone(id));
      return {
        ...plan,
        name: fromCatalog?.nombre ?? plan.name,
        amount: hidden ? null : (formAmount ?? fromCatalog?.precio_bruto ?? plan.amount),
      };
    }),
  }));

  return { consultations, programs, updated_at: live?.updated_at?.slice(0, 10) || raw.updated_at };
}

const RAW = catalog as RawCatalog;
const merged = mergeCatalog(RAW);

export const CATALOG = { ...RAW, ...merged };

export const consultations: Consultation[] = CATALOG.consultations;
/**
 * Modalidades de las asesorías (online, presencial…), en el orden de servicios.json y SIN
 * filtrar: aunque AccioGest oculte algún precio, la columna sigue (con «—» en esa celda).
 */
export const modalities: { modality: string; label: string }[] = [
  ...new Map(RAW.consultations.flatMap((c) => c.prices).map((p) => [p.modality, { modality: p.modality, label: p.label }])).values(),
];
/** Autogestión DG (antes «Programa Autogestiona»): página aparte, /autogestion-dg/. */
export const autogestion: Program = CATALOG.programs.find((p) => p.id === 'autogestion-dg') ?? CATALOG.programs[0];
export const immigration: Immigration = CATALOG.immigration;
export const firmServices: FirmServices = CATALOG.firm_services;
export const companies: Companies = CATALOG.companies;
export const dubai: Dubai = CATALOG.dubai;

export const AUTOGESTION_PATH = '/autogestion-dg/';
export const COMPANIES_PATH = companies.path;

/** Etiquetas de lo que incluye un plan (en el orden de `features`). */
export const planIncludes = (plan: Plan): string[] =>
  autogestion.features.filter((f) => plan.includes.includes(f.id)).map((f) => f.label);

/** Valor «Otro» del selector de servicio (formulario «servicio» de AccioGest). */
export const OTHER_SERVICE = 'Otro trámite / no lo sé';

type Option = { value: string; label?: string };

const consultationOption = (c: Consultation): Option => {
  const shown = `${c.name} · ${c.duration_label}`;
  return shown === c.lead_value ? { value: c.lead_value } : { value: c.lead_value, label: shown };
};
type Group = { label: string; options: Option[] };

/**
 * Opciones del selector «Servicio» (ServiceRequestDialog): lead_value de todo el catálogo,
 * agrupadas. El texto visible puede ser más corto que el valor que recibe AccioGest.
 * Los planes de Autogestión DG solo se ofrecen en su página (`withPlans`): fuera de ella no se
 * promociona (docs/cambios-2026-10.md §2.8).
 */
export function serviceOptions({ withPlans = false } = {}): (Group | Option)[] {
  return [
    { label: immigration.title, options: immigration.services.map((s) => ({ value: s.lead_value, label: s.name })) },
    { label: firmServices.title, options: firmServices.services.map((s) => ({ value: s.lead_value })) },
    // Valor estable (lead_value); texto con el nombre y la duración de AccioGest si han cambiado.
    { label: 'Asesorías', options: consultations.map((c) => consultationOption(c)) },
    { label: companies.name, options: companies.countries.map((c) => ({ value: c.lead_value })) },
    ...(withPlans ? [{ label: autogestion.name, options: autogestion.plans.map((p) => ({ value: p.lead_value })) }] : []),
    { value: OTHER_SERVICE },
  ];
}

const nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
export const formatAmount = (amount: number) => nf.format(amount);

export const allAmounts = [
  ...consultations.flatMap((c) => c.prices.map((p) => p.amount)),
  ...autogestion.plans.flatMap((p) => (p.amount === null ? [] : [p.amount])),
];
export const minAmount = allAmounts.length ? Math.min(...allAmounts) : 0;
export const maxAmount = allAmounts.length ? Math.max(...allAmounts) : 0;

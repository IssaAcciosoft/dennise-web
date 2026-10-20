/**
 * Catálogo de servicios (src/data/servicios.json). AccioGest no expone catálogo público:
 * los precios se editan en el JSON y la web se recompila. Ver docs/integracion-acciogest.md.
 */
import catalog from '~/data/servicios.json';

export type Price = { modality: string; label: string; amount: number };
export type Consultation = {
  id: string;
  name: string;
  duration_minutes: number;
  duration_label: string;
  description: string | null;
  prices: Price[];
  bookable: boolean;
  lead_value: string;
};
export type Plan = {
  id: string;
  name: string;
  amount: number;
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

export const CATALOG = catalog as {
  updated_at: string;
  currency: string;
  tax_included: boolean;
  tax_label: string;
  immigration: Immigration;
  firm_services: FirmServices;
  consultations: Consultation[];
  programs: Program[];
  companies: Companies;
  dubai: Dubai;
};

export const consultations: Consultation[] = CATALOG.consultations;
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
    { label: 'Asesorías', options: consultations.map((c) => ({ value: c.lead_value })) },
    { label: companies.name, options: companies.countries.map((c) => ({ value: c.lead_value })) },
    ...(withPlans ? [{ label: autogestion.name, options: autogestion.plans.map((p) => ({ value: p.lead_value })) }] : []),
    { value: OTHER_SERVICE },
  ];
}

const nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
export const formatAmount = (amount: number) => nf.format(amount);

export const allAmounts = [
  ...consultations.flatMap((c) => c.prices.map((p) => p.amount)),
  ...autogestion.plans.map((p) => p.amount),
];
export const minAmount = Math.min(...allAmounts);
export const maxAmount = Math.max(...allAmounts);
